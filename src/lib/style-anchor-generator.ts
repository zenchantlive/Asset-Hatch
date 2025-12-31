/**
 * Style Anchor Generation Logic
 * 
 * Shared business logic for generating style anchor reference images.
 * Used by both API route and direct internal calls from chat route.
 */

import { prisma } from '@/lib/prisma';
import { generateFluxImage } from '@/lib/openrouter-image';
import { getModelById, getDefaultModel } from '@/lib/model-registry';

/**
 * Parameters for style anchor generation
 */
export interface StyleAnchorGenerationParams {
  projectId: string;
  prompt: string;
  styleKeywords: string;
  lightingKeywords: string;
  colorPalette: string[];
  // Full model ID from registry (e.g., 'black-forest-labs/flux.2-pro')
  fluxModel?: string;
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
      generationId: string; // For actual cost lookup via /api/v1/generation
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
    colorPalette = [],
    fluxModel = 'black-forest-labs/flux.2-pro',
  } = params;

  // Default to image-gen model for style anchor (no reference needed)
  const defaultModelId = fluxModel || getDefaultModel('image-gen').id;

  console.log('🎨 Generating style anchor reference image:', {
    projectId,
    model: defaultModelId,
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

  // Get model configuration from registry with safety fallback
  let model = getModelById(defaultModelId);

  if (!model) {
    console.warn(`⚠️ Model '${defaultModelId}' not found in registry (legacy data?). Falling back to default.`);
    const fallback = getDefaultModel('image-gen');
    model = fallback;
    console.log(`🔄 Using fallback model: ${model.id}`);
  }

  // Call OpenRouter API
  const result = await generateFluxImage({
    modelId: model.id,
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
      fluxModel: model.id,
      aiSuggested: true,
    },
  });

  console.log('💾 Style anchor saved:', styleAnchor.id);

  // Estimate cost from registry pricing
  const estimatedCost = model.pricing.perImage ?? 0;

  // Return success with image data
  return {
    success: true,
    styleAnchor: {
      id: styleAnchor.id,
      imageUrl: result.imageUrl,
      prompt: optimizedPrompt,
      metadata: {
        model: model.id,
        cost: estimatedCost,
        durationMs: result.durationMs,
        generationId: result.generationId, // For actual cost lookup
      },
    },
  };
}
