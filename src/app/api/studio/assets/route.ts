// -----------------------------------------------------------------------------
// Studio Assets API Route
// Query user's Asset Hatch assets for use in games
// -----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolveR2AssetUrl } from '@/lib/studio/r2-storage';

/**
 * GET /api/studio/assets
 * Query user's approved 3D assets across all projects
 */
export async function GET(request: Request) {
    try {
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all'; // '2d' | '3d' | 'all'
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const includeGlbData = searchParams.get('includeGlbData') === '1';

        // Get all user's projects first
        const userProjects = await prisma.project.findMany({
            where: {
                userId: session.user.id,
            },
            select: { id: true },
        });

        const projectIds = userProjects.map((p) => p.id);

        if (projectIds.length === 0) {
            return NextResponse.json({
                success: true,
                assets: [],
                total: 0,
            });
        }

        // Fetch assets in parallel
        const [assets3D, assets2D] = await Promise.all([
            type === 'all' || type === '3d'
                ? prisma.generated3DAsset.findMany({
                    where: {
                        projectId: { in: projectIds },
                        approvalStatus: 'approved',
                        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
                    },
                    include: {
                        project: {
                            select: { name: true },
                        },
                    },
                    take: limit,
                    orderBy: { updatedAt: 'desc' },
                })
                : Promise.resolve([]),
            type === 'all' || type === '2d'
                ? prisma.generatedAsset.findMany({
                    where: {
                        projectId: { in: projectIds },
                        status: 'completed',
                        ...(search ? { assetId: { contains: search, mode: 'insensitive' } } : {}),
                    },
                    include: {
                        project: {
                            select: { name: true },
                        },
                    },
                    take: limit,
                    orderBy: { updatedAt: 'desc' },
                })
                : Promise.resolve([]),
        ]);

        // Phase 10: Get permanent asset data from GameAssetRef
        const gameAssetRefs = assets3D.length
            ? await prisma.gameAssetRef.findMany({
                where: {
                    projectId: { in: projectIds },
                    assetType: '3d',
                    assetId: { in: assets3D.map((asset) => asset.id) },
                },
                select: {
                    assetId: true,
                    glbUrl: true,
                    ...(includeGlbData ? { glbData: true } : {}),
                },
            })
            : [];

        const assetRefMap = new Map<string, { glbData: string | null; glbUrl: string | null }>();
        gameAssetRefs.forEach((ref) => {
            assetRefMap.set(ref.assetId, {
                glbData: includeGlbData && 'glbData' in ref ? ref.glbData : null,
                glbUrl: ref.glbUrl || null,
            });
        });

        // Format 3D assets with resolved URLs
        const formatted3D = await Promise.all(
            assets3D.map(async (asset) => {
                const assetRef = assetRefMap.get(asset.id);
                const glbData = includeGlbData ? assetRef?.glbData || null : null;
                const storedUrl = assetRef?.glbUrl || asset.riggedModelUrl || asset.draftModelUrl || null;
                const glbUrl = await resolveR2AssetUrl(storedUrl);

                return {
                    id: asset.id,
                    projectId: asset.projectId,
                    name: asset.name || asset.assetId,
                    type: '3d' as const,
                    thumbnailUrl: asset.draftModelUrl || null,
                    modelUrl: glbUrl,
                    riggedModelUrl: asset.riggedModelUrl,
                    glbData,
                    prompt: asset.promptUsed,
                    updatedAt: asset.updatedAt.toISOString(),
                };
            })
        );

        // Format 2D assets
        const formatted2D = assets2D.map((asset) => {
            let imageUrl: string | null = null;
            try {
                const metadata = asset.metadata ? JSON.parse(asset.metadata) : {};
                imageUrl = metadata.imageUrl || null;
            } catch {
                // Ignore parse errors
            }

            return {
                id: asset.id,
                projectId: asset.projectId,
                name: asset.assetId,
                type: '2d' as const,
                thumbnailUrl: imageUrl,
                modelUrl: null,
                riggedModelUrl: null,
                prompt: asset.promptUsed || '',
                updatedAt: asset.updatedAt.toISOString(),
            };
        });

        const formattedAssets = [...formatted3D, ...formatted2D]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, limit);

        return NextResponse.json({
            success: true,
            assets: formattedAssets,
            total: formattedAssets.length,
        });
    } catch (error) {
        console.error('Failed to fetch studio assets:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch assets' },
            { status: 500 }
        );
    }
}
