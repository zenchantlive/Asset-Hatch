// -----------------------------------------------------------------------------
// Project Asset Sync API Route
// POST /api/projects/[id]/assets/sync - Syncs pending assets into the game
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
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
  assets: Record<string, {
    id: string;
    type: string;
    name: string;
    version: number;
    urls: Record<string, string | undefined>;
    metadata: Record<string, unknown>;
    linkedAt: string;
    lockedVersion?: number;
  }>;
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
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse<SyncAssetsResponse>> {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", syncedAssets: [] },
        { status: 401 }
      );
    }

    const { id: projectId } = await props.params;

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

      if (asset) {
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
    }

    // Update manifest - clear pending assets and update last sync
    const updatedManifest: LocalAssetManifest = {
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
        assetManifest: updatedManifest as unknown as Prisma.JsonValue,
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

    const { id: projectId } = await props.params;
    try {
      // ... (rest of the try block)
    } catch (error) {
      console.error("Failed to sync assets:", error);

      // Reset sync status on error
      try {
        await prisma.project.update({
          where: { id: projectId },
          data: { syncStatus: "error" },
        });
      } catch (cleanupError) {
        console.error(`Failed to set syncStatus to "error" for project ${projectId}:`, cleanupError);
        // Best effort cleanup
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
