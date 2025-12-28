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
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAssetPrompt, calculateGenerationSize, FLUX_MODELS, type ParsedAsset } from '@/lib/prompt-builder';
import { prepareStyleAnchorForAPI } from '@/lib/image-utils';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set in environment variables');
}

interface GenerateRequest {
  projectId: string;
  asset: ParsedAsset;
  modelKey?: string; // 'flux-2-dev' or 'flux-2-pro'
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectId, asset, modelKey = 'flux-2-dev' } = body;

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

    // 4. Build optimized prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = buildAssetPrompt(asset, legacyProject as any, legacyStyleAnchor as any, characterRegistry as any);
    console.log('📝 Generated prompt:', prompt);

    // 5. Prepare style anchor image for API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleAnchorBase64 = await prepareStyleAnchorForAPI(legacyStyleAnchor as any);

    // 6. Calculate generation size (2x for pixel-perfect downscaling)
    const genSize = calculateGenerationSize(project.baseResolution || '32x32');

    // 7. Get model config
    const model = FLUX_MODELS[modelKey];
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelKey}` },
        { status: 400 }
      );
    }

    // 8. Call OpenRouter image generation API
    const startTime = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Referer': 'https://asset-hatch.app',
        'X-Title': 'Asset Hatch',
      },
      body: JSON.stringify({
        model: model.modelId,
        prompt: prompt,
        images: [styleAnchorBase64],
        size: `${genSize.width}x${genSize.height}`,
        n: 1,
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenRouter API error:', errorData);
      return NextResponse.json(
        {
          error: 'Image generation failed',
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    const generatedImageB64 = result.data?.[0]?.b64_json;
    if (!generatedImageB64) {
      return NextResponse.json(
        { error: 'No image data in response' },
        { status: 500 }
      );
    }

    const seed = result.data?.[0]?.seed || Math.floor(Math.random() * 1000000);

    console.log('✅ Image generated successfully:', {
      duration: `${duration}ms`,
      seed,
      size: `${genSize.width}x${genSize.height}`,
    });

    // 9. Save to SQLite
    const imageDataUrl = `data:image/png;base64,${generatedImageB64}`;
    const imageBuffer = Buffer.from(generatedImageB64, 'base64');

    const createdAsset = await prisma.generatedAsset.create({
      data: {
        projectId: projectId,
        assetId: asset.id,
        variantId: asset.variant.id,
        status: 'generated',
        seed: seed,
        imageBlob: imageBuffer,
        promptUsed: prompt,
        metadata: JSON.stringify({
          model: model.modelId,
          cost: model.costPerImage,
          duration_ms: duration,
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
        image_url: imageDataUrl,
        prompt: prompt,
        metadata: JSON.parse(createdAsset.metadata || '{}'),
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
