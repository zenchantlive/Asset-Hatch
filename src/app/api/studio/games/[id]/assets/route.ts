import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AssetManifest } from '@/lib/types/unified-project';
import { resolveR2AssetUrl } from '@/lib/studio/r2-storage';

/**
 * Batch fetch all asset metadata to avoid N+1 queries
 */
async function fetchAllAssetMetadata(
  assetRefs: Array<{ assetId: string; assetType: string }>
): Promise<Map<string, { prompt?: string; style?: string; animations?: string[]; poses?: string[] }>> {
  const metadataMap = new Map<string, { prompt?: string; style?: string; animations?: string[]; poses?: string[] }>();

  // Separate 2D and 3D asset IDs
  const gen3dIds: string[] = [];
  const gen2dIds: string[] = [];

  for (const ref of assetRefs) {
    if (ref.assetType === '3d' || ref.assetType === 'model') {
      gen3dIds.push(ref.assetId);
    } else if (ref.assetType === '2d' || ref.assetType === 'texture') {
      gen2dIds.push(ref.assetId);
    }
  }

  // Batch fetch 3D assets
  if (gen3dIds.length > 0) {
    try {
      const gen3dAssets = await prisma.generated3DAsset.findMany({
        where: { id: { in: gen3dIds } },
      });

      for (const asset of gen3dAssets) {
        const metadata: { prompt?: string; style?: string; animations?: string[]; poses?: string[] } = {
          prompt: asset.promptUsed || undefined,
        };
        // Parse animations from animatedModelUrls JSON
        if (asset.animatedModelUrls) {
          try {
            const urls = JSON.parse(asset.animatedModelUrls);
            metadata.animations = Object.keys(urls);
          } catch (error) {
            console.warn(
              `[fetchAllAssetMetadata] Failed to parse animatedModelUrls for asset ${asset.id}:`,
              error
            );
          }
        }
        metadataMap.set(asset.id, metadata);
      }
    } catch (error) {
      console.error('[fetchAllAssetMetadata] Database error fetching 3D assets:', error);
    }
  }

  // Batch fetch 2D assets
  if (gen2dIds.length > 0) {
    try {
      const gen2dAssets = await prisma.generatedAsset.findMany({
        where: { id: { in: gen2dIds } },
      });

      for (const asset of gen2dAssets) {
        const metadata: { prompt?: string; style?: string; animations?: string[]; poses?: string[] } = {
          prompt: asset.promptUsed || undefined,
        };
        // Parse metadata for style info
        if (asset.metadata) {
          try {
            const meta = JSON.parse(asset.metadata);
            metadata.style = meta.style || meta.artStyle;
          } catch {
            // Not valid JSON, ignore
          }
        }
        metadataMap.set(asset.id, metadata);
      }
    } catch (error) {
      console.error('[fetchAllAssetMetadata] Database error fetching 2D assets:', error);
    }
  }

  return metadataMap;
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
    const hasSkyboxRef = game.assetRefs.some((ref) => ref.assetType === 'skybox');
    if (!hasSkyboxRef) {
      const skyboxAsset = await prisma.generated3DAsset.findFirst({
        where: {
          projectId: game.projectId,
          assetId: { endsWith: '-skybox' },
        },
        orderBy: { updatedAt: 'desc' },
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
            assetType: 'skybox',
            assetId: skyboxAsset.id,
            assetName: skyboxAsset.name || 'Environment Skybox',
            thumbnailUrl: skyboxAsset.draftModelUrl || null,
            modelUrl: skyboxAsset.draftModelUrl || null,
            glbUrl: null,
            manifestKey: 'environment_skybox',
            createdAt: new Date(),
          },
        });

        game.assetRefs.push(skyboxRef);
        console.log('✅ Auto-linked skybox asset to game manifest:', skyboxAsset.assetId);
      }
    }
  }

  // Batch fetch all metadata at once to avoid N+1 queries
  const assetRefs = game.assetRefs.map(ref => ({ assetId: ref.assetId, assetType: ref.assetType }));
  const metadataMap = await fetchAllAssetMetadata(assetRefs);

  // Build asset manifest from GameAssetRefs
  const assets: AssetManifest['assets'] = {};

  for (const ref of game.assetRefs) {
    const key = ref.manifestKey || ref.assetId;

    // Look up pre-fetched metadata from map
    const metadata = metadataMap.get(ref.assetId) || {};

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
