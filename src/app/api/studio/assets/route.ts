// -----------------------------------------------------------------------------
// Studio Assets API Route
// Query user's Asset Hatch assets for use in games
// -----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

        // Fetch 3D assets if needed
        const assets3D = type === 'all' || type === '3d'
            ? await prisma.generated3DAsset.findMany({
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
            : [];

        // Format assets for API response
        const formattedAssets = assets3D.map((asset) => ({
            id: asset.id,
            projectId: asset.projectId,
            name: asset.name || asset.assetId,
            type: '3d' as const,
            thumbnailUrl: asset.draftModelUrl || null,
            modelUrl: asset.riggedModelUrl || asset.draftModelUrl || null,
            riggedModelUrl: asset.riggedModelUrl,
            prompt: asset.promptUsed,
            updatedAt: asset.updatedAt.toISOString(),
        }));

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
