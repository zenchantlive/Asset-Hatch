/**
 * Asset Generation API Route
 *
 * Generates game assets using Flux.2 models via OpenRouter.
 *
 * Workflow:
 * 1. Receive asset specification + project data
 * 2. Load style anchor from IndexedDB
 * 3. Build optimized Flux.2 prompt using prompt-builder
 * 4. Call OpenRouter image generation API with style anchor image
 * 5. Save generated asset to IndexedDB
 * 6. Return generated image to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // 1. Load project from IndexedDB (server-side uses Dexie too)
    const project = await db.projects.get(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 2. Load style anchor
    const styleAnchors = await db.style_anchors
      .where('project_id')
      .equals(projectId)
      .toArray();

    const styleAnchor = styleAnchors[0]; // Get most recent
    if (!styleAnchor) {
      return NextResponse.json(
        { error: 'No style anchor found for this project. Please create one first.' },
        { status: 400 }
      );
    }

    // 3. Load character registry (if applicable)
    let characterRegistry = undefined;
    if (asset.type === 'character-sprite' || asset.type === 'sprite-sheet') {
      const characters = await db.character_registry
        .where('project_id')
        .equals(projectId)
        .and((char) => char.name.toLowerCase() === asset.name.toLowerCase())
        .toArray();

      characterRegistry = characters[0];
    }

    // 4. Build optimized prompt
    const prompt = buildAssetPrompt(asset, project, styleAnchor, characterRegistry);
    console.log('📝 Generated prompt:', prompt);

    // 5. Prepare style anchor image for API
    const styleAnchorBase64 = await prepareStyleAnchorForAPI(styleAnchor);

    // 6. Calculate generation size (2x for pixel-perfect downscaling)
    const genSize = calculateGenerationSize(project.base_resolution || '32x32');

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
        // Include style anchor as reference image
        images: [styleAnchorBase64],
        // Generation parameters
        size: `${genSize.width}x${genSize.height}`,
        n: 1, // Number of images to generate
        response_format: 'b64_json', // Return as base64
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

    // 9. Extract generated image (OpenRouter returns array of images)
    const generatedImageB64 = result.data?.[0]?.b64_json;
    if (!generatedImageB64) {
      return NextResponse.json(
        { error: 'No image data in response', result },
        { status: 500 }
      );
    }

    // 10. Parse seed from response metadata (if available)
    const seed = result.data?.[0]?.seed || Math.floor(Math.random() * 1000000);

    console.log('✅ Image generated successfully:', {
      duration: `${duration}ms`,
      seed,
      size: `${genSize.width}x${genSize.height}`,
    });

    // 11. Save to IndexedDB
    // Convert base64 to Blob
    const imageDataUrl = `data:image/png;base64,${generatedImageB64}`;
    const response2 = await fetch(imageDataUrl);
    const imageBlob = await response2.blob();

    const generatedAsset = {
      id: `asset-${Date.now()}`,
      project_id: projectId,
      asset_id: asset.id,
      variant_id: asset.variant.id,
      image_blob: imageBlob,
      image_base64: imageDataUrl, // Cache for display
      prompt_used: prompt,
      generation_metadata: {
        model: model.modelId,
        seed: seed,
        cost: model.costPerImage,
        duration_ms: duration,
      },
      status: 'generated' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.generated_assets.add(generatedAsset);

    console.log('💾 Saved to IndexedDB:', generatedAsset.id);

    // 12. Update character registry if this is a new pose
    if (characterRegistry && asset.variant.pose) {
      if (!characterRegistry.poses_generated.includes(asset.variant.pose)) {
        characterRegistry.poses_generated.push(asset.variant.pose);
        characterRegistry.animations[asset.variant.pose] = {
          prompt_suffix: asset.variant.pose,
          seed: seed,
          asset_id: generatedAsset.id,
        };

        // Store first successful seed
        if (!characterRegistry.successful_seed) {
          characterRegistry.successful_seed = seed;
        }

        characterRegistry.updated_at = new Date().toISOString();
        await db.character_registry.update(characterRegistry.id, characterRegistry);
      }
    }

    // 13. Return generated image to client
    return NextResponse.json({
      success: true,
      asset: {
        id: generatedAsset.id,
        image_url: imageDataUrl, // Base64 data URL for immediate display
        prompt: prompt,
        metadata: generatedAsset.generation_metadata,
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

/**
 * Example usage from frontend:
 *
 * ```typescript
 * const asset: ParsedAsset = {
 *   id: 'farmer-idle',
 *   category: 'Characters',
 *   name: 'Farmer',
 *   type: 'character-sprite',
 *   description: 'farmer character with straw hat and overalls',
 *   variant: {
 *     id: 'idle-front',
 *     name: 'Idle',
 *     pose: 'idle standing pose',
 *     direction: 'front',
 *   },
 * };
 *
 * const response = await fetch('/api/generate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     projectId: 'project-123',
 *     asset: asset,
 *     modelKey: 'flux-2-dev',
 *   }),
 * });
 *
 * const result = await response.json();
 * // result.asset.image_url = "data:image/png;base64,..."
 * // Display image: <img src={result.asset.image_url} />
 * ```
 */
