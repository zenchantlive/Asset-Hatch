/**
 * Asset Generation API Route
 *
 * Generates game assets using Flux.2 models via OpenRouter.
 *
 * Workflow:
 * 1. Receive asset specification + project data
 * 2. Load style anchor from SQLite (Prisma)
 * 3. Build optimized Flux.2 prompt using prompt-builder
 * 4. Call OpenRouter image generation API with style anchor image
 * 5. Save generated asset to SQLite (Prisma)
 * 6. Return generated image to client
 * 
 * Uses shared utility: lib/openrouter-image.ts for correct API handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAssetPrompt, calculateGenerationSize, type ParsedAsset } from '@/lib/prompt-builder';
import { prepareStyleAnchorForAPI } from '@/lib/image-utils';
import { generateFluxImage, OPENROUTER_FLUX_MODELS } from '@/lib/openrouter-image';

// Request body interface
interface GenerateRequest {
  projectId: string;
  asset: ParsedAsset;
  modelKey?: string; // 'flux-2-dev' or 'flux-2-pro'
  customPrompt?: string; // Optional custom prompt override
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectId, asset, modelKey = 'flux-2-dev', customPrompt } = body;

    console.log('🎨 Starting asset generation:', {
      projectId,
      assetId: asset.id,
      assetName: asset.name,
      model: modelKey,
    });

    // 1. Load project from SQLite
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Map Prisma Project to Dexie-like Project for compatibility with prompt builder
    const legacyProject = {
      ...project,
      base_resolution: project.baseResolution,
    };

    // 2. Load style anchor
    const styleAnchor = await prisma.styleAnchor.findFirst({
      where: { projectId: projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!styleAnchor) {
      return NextResponse.json(
        { error: 'No style anchor found for this project. Please create one first.' },
        { status: 400 }
      );
    }

    // Map Prisma StyleAnchor to Dexie-like StyleAnchor
    const legacyStyleAnchor = {
      ...styleAnchor,
      reference_image_blob: new Blob([styleAnchor.referenceImageBlob], { type: 'image/png' }),
      reference_image_base64: styleAnchor.referenceImageBase64 || undefined,
      style_keywords: styleAnchor.styleKeywords,
      lighting_keywords: styleAnchor.lightingKeywords,
      color_palette: JSON.parse(styleAnchor.colorPalette),
      flux_model: styleAnchor.fluxModel,
    };

    // 3. Load character registry (if applicable)
    let characterRegistry = undefined;
    if (asset.type === 'character-sprite' || asset.type === 'sprite-sheet') {
      const char = await prisma.characterRegistry.findFirst({
        where: {
          projectId: projectId,
          name: { equals: asset.name },
        },
      });

      if (char) {
        characterRegistry = {
          ...char,
          color_hex: JSON.parse(char.colorHex),
          style_keywords: char.styleKeywords,
          successful_seed: char.successfulSeed || undefined,
          poses_generated: JSON.parse(char.posesGenerated),
          animations: JSON.parse(char.animations),
        };
      }
    }

    // 4. Build optimized prompt (use custom if provided, otherwise generate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = customPrompt || buildAssetPrompt(asset, legacyProject as any, legacyStyleAnchor as any, characterRegistry as any);
    console.log('📝 Using prompt:', customPrompt ? '(custom)' : '(generated)', prompt);

    // 5. Prepare style anchor image for API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleAnchorBase64 = await prepareStyleAnchorForAPI(legacyStyleAnchor as any);

    // 6. Calculate generation size (2x for pixel-perfect downscaling)
    const genSize = calculateGenerationSize(project.baseResolution || '32x32');

    // 7. Get model config from shared utility
    const model = OPENROUTER_FLUX_MODELS[modelKey];
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelKey}` },
        { status: 400 }
      );
    }

    // 8. Call OpenRouter using shared utility (correct endpoint + response parsing)
    const result = await generateFluxImage({
      modelId: model.modelId,
      prompt: prompt,
      referenceImageBase64: styleAnchorBase64,
      width: genSize.width,
      height: genSize.height,
    });

    // Use seed from result or generate random fallback
    const seed = result.seed || Math.floor(Math.random() * 1000000);

    console.log('✅ Image generated successfully:', {
      duration: `${result.durationMs}ms`,
      seed,
      size: `${genSize.width}x${genSize.height}`,
    });

    // 9. Save to SQLite
    const createdAsset = await prisma.generatedAsset.create({
      data: {
        projectId: projectId,
        assetId: asset.id,
        variantId: asset.variant.id,
        status: 'generated',
        seed: seed,
        imageBlob: Buffer.from(result.imageBuffer),
        promptUsed: prompt,
        metadata: JSON.stringify({
          model: model.modelId,
          cost: model.costPerImage,
          duration_ms: result.durationMs,
          seed: seed,
        }),
      },
    });

    console.log('💾 Saved to SQLite:', createdAsset.id);

    // 10. Update character registry if this is a new pose
    if (characterRegistry && asset.variant.pose) {
      const poses = characterRegistry.poses_generated as string[];
      if (!poses.includes(asset.variant.pose)) {
        poses.push(asset.variant.pose);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const animations = characterRegistry.animations as Record<string, any>;
        animations[asset.variant.pose] = {
          prompt_suffix: asset.variant.pose,
          seed: seed,
          asset_id: createdAsset.id,
        };

        await prisma.characterRegistry.update({
          where: { id: characterRegistry.id },
          data: {
            posesGenerated: JSON.stringify(poses),
            animations: JSON.stringify(animations),
            successfulSeed: characterRegistry.successful_seed || seed,
          },
        });
      }
    }

    // 11. Return generated image to client
    return NextResponse.json({
      success: true,
      asset: {
        id: createdAsset.id,
        imageUrl: result.imageUrl,  // ← Fixed to camelCase
        prompt: prompt,
        metadata: {
          ...JSON.parse(createdAsset.metadata || '{}'),
          seed: seed,  // Add seed to metadata
        },
      },
    });
  } catch (error) {
    console.error('❌ Generation error:', error);
    return NextResponse.json(
      {
        error: 'Asset generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
