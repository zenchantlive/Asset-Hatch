// -----------------------------------------------------------------------------
// Project Asset Sync API Route
// POST /api/projects/[id]/assets/sync - Syncs pending assets into the game
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SyncAssetsResponse } from "@/lib/types/unified-project";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Local type for asset manifest to avoid import issues
 */
interface LocalAssetManifest {
  version: string;
  lastUpdated: string;
  assets: Record<
    string,
    {
      id: string;
      type: string;
      name: string;
      version: number;
      urls: Record<string, string | undefined>;
      metadata: Record<string, Prisma.JsonValue>;
      linkedAt: string;
      lockedVersion?: number;
    }
  >;
  syncState: {
    status: string;
    pendingAssets: string[];
    lastSync: string | null;
  };
}

// =============================================================================
// POST - Sync pending assets into the game
// =============================================================================

export async function POST(
  request: Request,
  props: { params: { id: string } }
): Promise<NextResponse<SyncAssetsResponse>> {
  const { id: projectId } = props.params;
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", syncedAssets: [] },
        { status: 401 }
      );
    }

    // Fetch project with game and files
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        game: {
          include: {
            files: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found", syncedAssets: [] },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden", syncedAssets: [] },
        { status: 403 }
      );
    }

    // Parse asset manifest
    const manifest = (project.assetManifest as LocalAssetManifest | null) || {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      assets: {},
      syncState: { status: "clean", pendingAssets: [], lastSync: null },
    };

    const pendingAssets = manifest.syncState?.pendingAssets || [];

    // Check if there are pending assets
    if (pendingAssets.length === 0) {
      return NextResponse.json({
        success: true,
        syncedAssets: [],
        message: "No pending assets",
      });
    }

    // Mark project as syncing
    await prisma.project.update({
      where: { id: projectId },
      data: { syncStatus: "syncing" },
    });
    // Build sync changes array
    const changes: SyncAssetsResponse["changes"] = [];
    const syncedAssetKeys: string[] = [];

    // Process each pending asset
    for (const assetKey of pendingAssets) {
      const asset = manifest.assets?.[assetKey];

      if (!asset || !project.game) {
        continue;
      }

      // Fetch the actual asset data from the database
      let assetRecord;
      if (asset.type === "2d") {
        assetRecord = await prisma.generatedAsset.findUnique({
          where: { id: asset.id },
        });
      } else if (asset.type === "3d") {
        assetRecord = await prisma.generated3DAsset.findUnique({
          where: { id: asset.id },
        });
      }

      if (!assetRecord) {
        continue;
      }

      const lockedVersionId = asset.lockedVersion ? String(asset.lockedVersion) : null;
      const lockedAt = lockedVersionId ? new Date() : null;

      // Create or update GameAssetRef for AI access + sync tracking
      await prisma.gameAssetRef.upsert({
        where: {
          gameId_assetId: {
            gameId: project.game.id,
            assetId: asset.id,
          },
        },
        update: {
          projectId,
          assetType: asset.type,
          assetName: asset.name || asset.id,
          lockedVersionId,
          lockedAt,
          thumbnailUrl: asset.urls.thumbnail || null,
          modelUrl: asset.urls.model || null,
          glbUrl: asset.urls.glb || null,
          manifestKey: assetKey,
        },
        create: {
          gameId: project.game.id,
          projectId,
          assetType: asset.type,
          assetId: asset.id,
          assetName: asset.name || asset.id,
          lockedVersionId,
          lockedAt,
          thumbnailUrl: asset.urls.thumbnail || null,
          modelUrl: asset.urls.model || null,
          glbUrl: asset.urls.glb || null,
          manifestKey: assetKey,
          createdAt: new Date(),
        },
      });

      // Build change description
      const changeDescription = `[ASSET SYNC] Added ${asset.type} asset: ${asset.name}`;

      changes.push({
        fileId: `asset-${assetKey}`,
        fileName: `${asset.name} (${asset.type})`,
        changeType: "created",
        description: changeDescription,
      });

      syncedAssetKeys.push(assetKey);

      console.log(`🔄 Synced asset: ${asset.name} (${asset.type})`);
    }

    // Update manifest - clear pending assets and update last sync
    const updatedManifest: Prisma.InputJsonValue = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      assets: manifest.assets || {},
      syncState: {
        status: "clean",
        pendingAssets: [],
        lastSync: new Date().toISOString(),
      },
    };

    // Update project with new manifest and sync state
    await prisma.project.update({
      where: { id: projectId },
      data: {
        assetManifest: updatedManifest,
        syncStatus: "clean",
        lastSyncAt: new Date(),
        pendingAssetCount: 0,
      },
    });

    console.log(`✅ Synced ${syncedAssetKeys.length} assets for project: ${projectId}`);

    return NextResponse.json({
      success: true,
      syncedAssets: syncedAssetKeys,
      message: `Synced ${syncedAssetKeys.length} assets`,
      changes,
    });
  } catch (error) {
    console.error("Failed to sync assets:", error);

    // Reset sync status on error
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: { syncStatus: "error" },
      });
    } catch (cleanupError) {
      console.error(`Failed to set syncStatus to "error":`, cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        syncedAssets: [],
        message: error instanceof Error ? error.message : "Unknown error during sync",
      },
      { status: 500 }
    );
  }
}
