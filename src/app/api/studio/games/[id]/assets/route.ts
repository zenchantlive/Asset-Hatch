import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AssetManifest } from '@/lib/types/unified-project';
import { resolveR2AssetUrl } from '@/lib/studio/r2-storage';

/**
 * Fetch real metadata for an asset from GeneratedAsset/Generated3DAsset tables
 */
async function fetchAssetMetadata(
  assetId: string,
  assetType: string
): Promise<{
  prompt?: string;
  style?: string;
  animations?: string[];
  poses?: string[];
}> {
  const result: {
    prompt?: string;
    style?: string;
    animations?: string[];
    poses?: string[];
  } = {};

  if (assetType === '3d' || assetType === 'model') {
    // Fetch from Generated3DAsset
    try {
      const gen3d = await prisma.generated3DAsset.findUnique({
        where: { id: assetId },
      });
      if (gen3d) {
        result.prompt = gen3d.promptUsed || undefined;
        // Parse animations from animatedModelUrls JSON
        if (gen3d.animatedModelUrls) {
          try {
            const urls = JSON.parse(gen3d.animatedModelUrls);
            result.animations = Object.keys(urls);
          } catch {
            // Not valid JSON, ignore
          }
        }
      }
    } catch {
      // Generated3DAsset not found, continue with defaults
    }
  } else if (assetType === '2d' || assetType === 'texture') {
    // Fetch from GeneratedAsset
    try {
      const genAsset = await prisma.generatedAsset.findUnique({
        where: { id: assetId },
      });
      if (genAsset) {
        result.prompt = genAsset.promptUsed || undefined;
        // Parse metadata for style info
        if (genAsset.metadata) {
          try {
            const meta = JSON.parse(genAsset.metadata);
            result.style = meta.style || meta.artStyle;
          } catch {
            // Not valid JSON, ignore
          }
        }
      }
    } catch {
      // GeneratedAsset not found, continue with defaults
    }
  }

  return result;
}

/**
 * GET /api/studio/games/[id]/assets
 * Returns asset manifest for linked assets with real metadata
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id: gameId } = await params;
  const { searchParams } = new URL(request.url);
  const includeGlbData = searchParams.get("includeGlbData") === "1";

  // Fetch game with asset references
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      assetRefs: true,
    },
  });

  if (!game) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Auto-link skybox if missing (older projects)
  if (game.projectId) {
    const hasSkyboxRef = game.assetRefs.some((ref) => ref.assetType === "skybox");
    if (!hasSkyboxRef) {
      const skyboxAsset = await prisma.generated3DAsset.findFirst({
        where: {
          projectId: game.projectId,
          assetId: { endsWith: "-skybox" },
        },
        orderBy: { updatedAt: "desc" },
      });

      if (skyboxAsset) {
        const skyboxRef = await prisma.gameAssetRef.upsert({
          where: {
            gameId_assetId: {
              gameId: game.id,
              assetId: skyboxAsset.id,
            },
          },
          update: {},
          create: {
            gameId: game.id,
            projectId: game.projectId,
            assetType: "skybox",
            assetId: skyboxAsset.id,
            assetName: skyboxAsset.name || "Environment Skybox",
            thumbnailUrl: skyboxAsset.draftModelUrl || null,
            modelUrl: skyboxAsset.draftModelUrl || null,
            glbUrl: null,
            manifestKey: "environment_skybox",
            createdAt: new Date(),
          },
        });

        game.assetRefs.push(skyboxRef);
        console.log("✅ Auto-linked skybox asset to game manifest:", skyboxAsset.assetId);
      }
    }
  }

  // Build asset manifest from GameAssetRefs
  const assets: AssetManifest['assets'] = {};
  
  for (const ref of game.assetRefs) {
    const key = ref.manifestKey || ref.assetId;
    
    // Fetch real metadata from source tables
    const metadata = await fetchAssetMetadata(ref.assetId, ref.assetType);

    const resolvedModelUrl = await resolveR2AssetUrl(ref.modelUrl || ref.glbUrl || null);
    const resolvedGlbUrl = await resolveR2AssetUrl(ref.glbUrl || ref.modelUrl || null);
    
    assets[key] = {
      id: ref.assetId,
      type: ref.assetType as '2d' | '3d' | 'skybox',
      name: ref.assetName,
      version: ref.lockedVersionId ? 1 : 0,
      urls: {
        thumbnail: ref.thumbnailUrl || undefined,
        model: resolvedModelUrl || undefined,
        glb: resolvedGlbUrl || undefined,
        ...(includeGlbData && ref.glbData ? { glbData: ref.glbData } : {}),
      },
      metadata,
      linkedAt: ref.createdAt.toISOString(),
      lockedVersion: ref.lockedVersionId ? 1 : undefined,
    };
  }

  const manifest: AssetManifest = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    assets,
    syncState: {
      status: 'clean',
      pendingAssets: [],
      lastSync: null,
    },
  };

  return NextResponse.json(manifest);
}
