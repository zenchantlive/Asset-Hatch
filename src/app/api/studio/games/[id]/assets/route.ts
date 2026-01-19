import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AssetManifest } from '@/lib/types/unified-project';

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
          } catch (e) {
            console.warn(`[fetchAllAssetMetadata] Failed to parse animatedModelUrls for asset ${asset.id}:`, e);
          }
        }
        metadataMap.set(asset.id, metadata);
      }
    } catch (e) {
      console.error('[fetchAllAssetMetadata] Database error fetching 3D assets:', e);
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
    } catch (e) {
      console.error('[fetchAllAssetMetadata] Database error fetching 2D assets:', e);
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

  // Batch fetch all metadata at once to avoid N+1 queries
  const assetRefs = game.assetRefs.map(ref => ({ assetId: ref.assetId, assetType: ref.assetType }));
  const metadataMap = await fetchAllAssetMetadata(assetRefs);

  // Build asset manifest from GameAssetRefs
  const assets: AssetManifest['assets'] = {};

  for (const ref of game.assetRefs) {
    const key = ref.manifestKey || ref.assetId;

    // Look up pre-fetched metadata from map
    const metadata = metadataMap.get(ref.assetId) || {};

    assets[key] = {
      id: ref.assetId,
      type: ref.assetType as '2d' | '3d',
      name: ref.assetName,
      version: ref.lockedVersionId ? 1 : 0,
      urls: {
        thumbnail: ref.thumbnailUrl || undefined,
        model: ref.modelUrl || undefined,
        glb: ref.glbUrl || undefined,
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
