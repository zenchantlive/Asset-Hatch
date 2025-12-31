/**
 * Style Anchor Generation Logic
 * 
 * Shared business logic for generating style anchor reference images.
 * Used by both API route and direct internal calls from chat route.
 */

import { prisma } from '@/lib/prisma';
import { generateFluxImage, OPENROUTER_FLUX_MODELS } from '@/lib/openrouter-image';

/**
 * Parameters for style anchor generation
 */
export interface StyleAnchorGenerationParams {
  projectId: string;
  prompt: string;
  styleKeywords: string;
  lightingKeywords: string;
  colorPalette: string[];
  fluxModel?: 'flux-2-dev' | 'flux-2-pro';
}

/**
 * Result from style anchor generation
 */
export interface StyleAnchorGenerationResult {
  success: true;
  styleAnchor: {
    id: string;
    imageUrl: string;
    prompt: string;
    metadata: {
      model: string;
      cost: number;
      durationMs: number;
    };
  };
}

/**
 * Build a standardized prompt for style reference generation.
 * This ensures consistency across all style anchors.
 */
function buildStyleReferencePrompt(
  basePrompt: string,
  styleKeywords: string,
  lightingKeywords: string,
  colorPalette: string[]
): string {
  const parts: string[] = [];

  // Start with style keywords for maximum weight
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

  return parts.filter(Boolean).join(', ');
}

/**
 * Generate a style anchor reference image
 * 
 * This function:
 * 1. Validates the project exists
 * 2. Builds an optimized prompt
 * 3. Calls OpenRouter Flux API
 * 4. Saves the result to the database
 * 5. Returns the style anchor data
 * 
 * @param params - Generation parameters
 * @returns Promise resolving to the generated style anchor
 * @throws Error if generation fails or project not found
 */
export async function generateStyleAnchor(
  params: StyleAnchorGenerationParams
): Promise<StyleAnchorGenerationResult> {
  const {
    projectId,
    prompt,
    styleKeywords,
    lightingKeywords,
    colorPalette,
    fluxModel = 'flux-2-dev',
  } = params;

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
    throw new Error('Project not found');
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
  const model = OPENROUTER_FLUX_MODELS[fluxModel];
  if (!model) {
    throw new Error(`Unknown model: ${fluxModel}`);
  }

  // Call OpenRouter API
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
      referenceImageBlob: Buffer.from(result.imageBuffer),
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
  return {
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
  };
}
