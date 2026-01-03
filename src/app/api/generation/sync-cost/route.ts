import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchGenerationCostWithRetry } from '@/lib/cost-tracker';

/**
 * API Route to fetch and sync actual generation cost from OpenRouter
 * 
 * POST /api/generation/sync-cost
 * Body: { generation_id: string, projectId: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { generation_id, projectId } = body;

        if (!generation_id || !projectId) {
            return NextResponse.json(
                { error: 'Missing generation_id or projectId' },
                { status: 400 }
            );
        }

        console.log(`💰 Syncing cost for ${generation_id} in project ${projectId}`);

        // Fetch actual cost from OpenRouter with retry logic
        const fetchResult = await fetchGenerationCostWithRetry(generation_id);

        if (fetchResult.status === 'error' || !fetchResult.cost) {
            return NextResponse.json(
                { error: 'Failed to fetch cost from OpenRouter', details: fetchResult.error },
                { status: 500 }
            );
        }

        const { cost } = fetchResult;

        // Save to database
        // Use upsert in case this is called multiple times for the same generation
        const savedCost = await prisma.generationCost.upsert({
            where: { generationId: cost.generationId },
            update: {
                totalCost: cost.totalCost,
                promptTokens: cost.tokensPrompt,
                completionTokens: cost.tokensCompletion,
                imageCount: 1, // Assume 1 for now, can be updated if batching
                metadata: JSON.stringify({
                    tokensCompletionImages: cost.tokensCompletionImages,
                    generationTimeMs: cost.generationTimeMs,
                    cacheDiscount: cost.cacheDiscount,
                    fetchedAt: cost.fetchedAt,
                }),
            },
            create: {
                projectId,
                generationId: cost.generationId,
                modelId: cost.modelId,
                totalCost: cost.totalCost,
                promptTokens: cost.tokensPrompt,
                completionTokens: cost.tokensCompletion,
                imageCount: 1,
                metadata: JSON.stringify({
                    tokensCompletionImages: cost.tokensCompletionImages,
                    generationTimeMs: cost.generationTimeMs,
                    cacheDiscount: cost.cacheDiscount,
                    fetchedAt: cost.fetchedAt,
                }),
            },
        });

        console.log(`✅ Cost synced to DB: $${savedCost.totalCost.toFixed(5)}`);

        return NextResponse.json({
            success: true,
            cost: {
                totalCost: savedCost.totalCost,
                modelId: savedCost.modelId,
                generationId: savedCost.generationId,
            }
        });
    } catch (error) {
        console.error('❌ Error in sync-cost API:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync generation cost',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
