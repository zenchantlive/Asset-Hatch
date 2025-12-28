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
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FLUX_MODELS } from '@/lib/prompt-builder';

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

        // Get model configuration
        const model = FLUX_MODELS[fluxModel];
        if (!model) {
            return NextResponse.json(
                { error: `Unknown model: ${fluxModel}` },
                { status: 400 }
            );
        }

        // Call OpenRouter API using chat/completions with image modality
        const startTime = Date.now();

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://asset-hatch.app',
                'X-Title': 'Asset Hatch',
            },
            body: JSON.stringify({
                model: model.modelId,
                messages: [
                    {
                        role: 'user',
                        content: optimizedPrompt,
                    }
                ],
                // Request image output - must include both 'image' and 'text' per OpenRouter docs
                modalities: ['image', 'text'],
                // Image generation parameters
                provider: {
                    only: ['black-forest-labs'],
                },
            }),
        });

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ OpenRouter API error:', response.status, errorData);
            return NextResponse.json(
                {
                    error: 'Image generation failed',
                    details: errorData,
                },
                { status: response.status }
            );
        }

        // Parse response - chat/completions returns different format
        const result = await response.json();
        const duration = Date.now() - startTime;

        // Log message structure (truncate base64 to avoid flooding console)
        const message = result.choices?.[0]?.message;
        console.log('📦 OpenRouter message keys:', message ? Object.keys(message) : 'undefined');
        console.log('📦 OpenRouter message role:', message?.role);
        console.log('📦 OpenRouter message content type:', typeof message?.content);

        if (typeof message?.content === 'string') {
            console.log('📦 Content string length:', message.content.length);
            console.log('📦 Content starts with:', message.content.substring(0, 50));
        } else if (Array.isArray(message?.content)) {
            console.log('📦 OpenRouter message content (array) length:', message.content.length);
            message.content.forEach((part: Record<string, unknown>, i: number) => {
                console.log(`📦 Part ${i}:`, JSON.stringify(part).substring(0, 200));
            });
        } else if (message?.content) {
            console.log('📦 Content (other):', JSON.stringify(message.content).substring(0, 200));
        }

        // Extract image from response
        // OpenRouter Flux returns images in message.images array, NOT content
        let imageDataUrl: string | undefined;

        // Check message.images first (OpenRouter Flux format)
        if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
            const firstImage = message.images[0];
            console.log('📦 Found images array, first image type:', typeof firstImage);
            if (typeof firstImage === 'string') {
                if (firstImage.startsWith('data:image')) {
                    imageDataUrl = firstImage;
                } else if (firstImage.startsWith('http')) {
                    // It's a URL - we need to fetch it or use it directly
                    imageDataUrl = firstImage;
                } else {
                    // Assume raw base64
                    imageDataUrl = `data:image/png;base64,${firstImage}`;
                }
            } else if (typeof firstImage === 'object' && firstImage !== null) {
                // Log the actual keys to understand the structure
                console.log('📦 Image object keys:', Object.keys(firstImage));
                // Could be { url: string } or { data: string } or { b64_json: string }
                if ('url' in firstImage) {
                    imageDataUrl = firstImage.url as string;
                } else if ('data' in firstImage) {
                    imageDataUrl = `data:image/png;base64,${firstImage.data}`;
                } else if ('b64_json' in firstImage) {
                    imageDataUrl = `data:image/png;base64,${firstImage.b64_json}`;
                } else if ('image_url' in firstImage && typeof firstImage.image_url === 'object') {
                    // Nested format: { image_url: { url: string } }
                    imageDataUrl = (firstImage.image_url as { url: string }).url;
                }
            }
            console.log('📦 Extracted image URL length:', imageDataUrl?.length || 0);
        }

        // Fallback to content parsing (other models)
        if (!imageDataUrl) {
            const imageContent = message?.content;
            if (Array.isArray(imageContent)) {
                for (const part of imageContent) {
                    if (part.type === 'image_url' && part.image_url?.url) {
                        imageDataUrl = part.image_url.url;
                        break;
                    } else if (part.type === 'image' && part.url) {
                        imageDataUrl = part.url;
                        break;
                    } else if (part.type === 'image' && part.data) {
                        imageDataUrl = `data:image/png;base64,${part.data}`;
                        break;
                    }
                }
            } else if (typeof imageContent === 'string') {
                if (imageContent.startsWith('data:image')) {
                    imageDataUrl = imageContent;
                } else if (imageContent.length > 100 && /^[A-Za-z0-9+/=]+$/.test(imageContent.substring(0, 100))) {
                    imageDataUrl = `data:image/png;base64,${imageContent}`;
                }
            }
        }

        if (!imageDataUrl) {
            console.error('❌ No image in response. Message:', JSON.stringify({
                keys: Object.keys(message || {}),
                images: message?.images?.length || 0,
                contentType: typeof message?.content,
                contentLength: typeof message?.content === 'string' ? message.content.length : 'N/A',
            }));
            return NextResponse.json(
                { error: 'No image data in response', details: result },
                { status: 500 }
            );
        }

        console.log('✅ Style reference image generated:', {
            duration: `${duration}ms`,
        });

        // Extract base64 from data URL
        const base64Match = imageDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
        const generatedImageB64 = base64Match ? base64Match[1] : '';

        // Create buffer for storage
        const imageBuffer = Buffer.from(generatedImageB64, 'base64');

        // Create StyleAnchor record in database
        const styleAnchor = await prisma.styleAnchor.create({
            data: {
                projectId: projectId,
                referenceImageName: 'ai-generated-style-anchor.png',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                referenceImageBlob: imageBuffer as any,
                referenceImageBase64: imageDataUrl,
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
                imageUrl: imageDataUrl,
                prompt: optimizedPrompt,
                metadata: {
                    model: model.modelId,
                    cost: model.costPerImage,
                    durationMs: duration,
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
