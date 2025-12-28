/**
 * Style Anchor Reference Image Generation API Route
 *
 * Generates a standardized style reference image using Flux.2 via OpenRouter.
 * This image becomes the style anchor that guides all future asset generation.
 *
 * Workflow:
 * 1. Receive style draft (keywords, colors, lighting) + generation prompt
 * 2. Build optimized prompt for style reference generation
 * 3. Call OpenRouter Flux API
 * 4. Create StyleAnchor record with generated image
 * 5. Return image URL to client
 * 
 * Uses shared utility: lib/openrouter-image.ts for correct API handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFluxImage, OPENROUTER_FLUX_MODELS } from '@/lib/openrouter-image';

// OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Request body interface with strict typing
interface GenerateStyleRequest {
    projectId: string;
    prompt: string;
    styleKeywords: string;
    lightingKeywords: string;
    colorPalette: string[];
    fluxModel?: 'flux-2-dev' | 'flux-2-pro';
}

/**
 * Build a standardized prompt for style reference generation.
 * This ensures consistency across all style anchors.
 *
 * @param basePrompt - User/AI provided base prompt
 * @param styleKeywords - Extracted style keywords
 * @param lightingKeywords - Extracted lighting keywords
 * @param colorPalette - Selected color palette
 * @returns Optimized prompt string
 */
function buildStyleReferencePrompt(
    basePrompt: string,
    styleKeywords: string,
    lightingKeywords: string,
    colorPalette: string[]
): string {
    // Parts to combine into final prompt
    const parts: string[] = [];

    // Start with style keywords for maximum weight (Flux.2 weights first tokens highest)
    if (styleKeywords) {
        parts.push(styleKeywords);
    }

    // Add the base prompt describing what to generate
    parts.push(basePrompt);

    // Add lighting characteristics
    if (lightingKeywords) {
        parts.push(lightingKeywords);
    }

    // Add color palette constraint if specified
    if (colorPalette.length > 0) {
        parts.push(`limited color palette using ${colorPalette.slice(0, 6).join(', ')}`);
    }

    // Add standard suffix for game asset style references
    parts.push('game asset, sprite, clean lines, consistent style');

    // Join with commas for Flux.2 natural language understanding
    return parts.filter(Boolean).join(', ');
}

export async function POST(request: NextRequest) {
    try {
        // Validate API key is configured
        if (!OPENROUTER_API_KEY) {
            console.error('❌ OPENROUTER_API_KEY not configured');
            return NextResponse.json(
                { error: 'Image generation not configured' },
                { status: 500 }
            );
        }

        // Parse and validate request body
        const body: GenerateStyleRequest = await request.json();
        const {
            projectId,
            prompt,
            styleKeywords,
            lightingKeywords,
            colorPalette,
            fluxModel = 'flux-2-dev',
        } = body;

        // Validate required fields
        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        if (!prompt) {
            return NextResponse.json(
                { error: 'prompt is required' },
                { status: 400 }
            );
        }

        console.log('🎨 Generating style anchor reference image:', {
            projectId,
            model: fluxModel,
            promptLength: prompt.length,
        });

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Build optimized prompt
        const optimizedPrompt = buildStyleReferencePrompt(
            prompt,
            styleKeywords,
            lightingKeywords,
            colorPalette
        );

        console.log('📝 Optimized prompt:', optimizedPrompt);

        // Get model configuration from shared utility
        const model = OPENROUTER_FLUX_MODELS[fluxModel];
        if (!model) {
            return NextResponse.json(
                { error: `Unknown model: ${fluxModel}` },
                { status: 400 }
            );
        }

        // Call OpenRouter API using shared utility
        const result = await generateFluxImage({
            modelId: model.modelId,
            prompt: optimizedPrompt,
            // No reference image for style anchor generation (this IS the reference)
        });

        console.log('✅ Style reference image generated:', {
            duration: `${result.durationMs}ms`,
            seed: result.seed,
        });

        // Create StyleAnchor record in database
        const styleAnchor = await prisma.styleAnchor.create({
            data: {
                projectId: projectId,
                referenceImageName: 'ai-generated-style-anchor.png',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                referenceImageBlob: result.imageBuffer as any,
                referenceImageBase64: result.imageUrl,
                styleKeywords: styleKeywords || '',
                lightingKeywords: lightingKeywords || '',
                colorPalette: JSON.stringify(colorPalette || []),
                fluxModel: model.modelId,
                aiSuggested: true,
            },
        });

        console.log('💾 Style anchor saved:', styleAnchor.id);

        // Return success with image data
        return NextResponse.json({
            success: true,
            styleAnchor: {
                id: styleAnchor.id,
                imageUrl: result.imageUrl,
                prompt: optimizedPrompt,
                metadata: {
                    model: model.modelId,
                    cost: model.costPerImage,
                    durationMs: result.durationMs,
                },
            },
        });
    } catch (error) {
        console.error('❌ Style generation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate style anchor',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
