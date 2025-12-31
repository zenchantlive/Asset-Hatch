import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/generated-assets
 * 
 * Syncs approved assets from client (Dexie) to server (Prisma)
 * Called when user approves an asset in GenerationQueue
 */
export async function POST(req: NextRequest) {
    try {
        const {
            id,
            projectId,
            assetId,
            imageBlob, // base64 string
            promptUsed,
            seed,
            metadata,
            status,
        } = await req.json();

        // Validate required fields
        if (!id || !projectId || !assetId || !imageBlob) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Convert base64 to Buffer for Prisma Bytes field
        const buffer = Buffer.from(imageBlob, 'base64');

        // Create or update the generated asset in Prisma
        const generatedAsset = await prisma.generatedAsset.upsert({
            where: { id },
            update: {
                imageBlob: buffer,
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
                imageBlob: buffer,
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
