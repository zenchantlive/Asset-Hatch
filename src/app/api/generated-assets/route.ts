import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/generated-assets
 *
 * Syncs approved asset METADATA from client (Dexie) to server (Prisma)
 * Images stay in IndexedDB - only metadata is synced
 * Called when user approves an asset in GenerationQueue
 */
export async function POST(req: NextRequest) {
    try {
        const {
            id,
            projectId,
            assetId,
            variantId,
            promptUsed,
            seed,
            metadata,
            status,
        } = await req.json();

        // Validate required fields (imageBlob no longer required)
        if (!id || !projectId || !assetId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create or update the generated asset metadata in Prisma
        // Image blob stays in client IndexedDB
        const generatedAsset = await prisma.generatedAsset.upsert({
            where: { id },
            update: {
                promptUsed: promptUsed || '',
                seed: seed || 0,
                metadata: metadata ? JSON.stringify(metadata) : '{}',
                status: status || 'approved',
                updatedAt: new Date(),
            },
            create: {
                id,
                projectId,
                assetId,
                variantId: variantId || '',
                promptUsed: promptUsed || '',
                seed: seed || 0,
                metadata: metadata ? JSON.stringify(metadata) : '{}',
                status: status || 'approved',
            },
        });

        return NextResponse.json({ success: true, id: generatedAsset.id });
    } catch (error) {
        console.error('Failed to sync generated asset:', error);
        return NextResponse.json(
            { error: 'Failed to sync asset' },
            { status: 500 }
        );
    }
}
