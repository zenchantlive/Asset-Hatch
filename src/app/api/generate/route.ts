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
import { auth } from '@/auth';
import { buildAssetPrompt, calculateGenerationSize, type ParsedAsset } from '@/lib/prompt-builder';
import { prepareStyleAnchorForAPI } from '@/lib/image-utils';
import { generateFluxImage } from '@/lib/openrouter-image';
import { getModelById, getDefaultModel, estimateCost } from '@/lib/model-registry';

// Request body interface
interface GenerateRequest {
  projectId: string;
  asset: ParsedAsset;
  modelKey?: string; // e.g. 'black-forest-labs/flux.2-pro'
  customPrompt?: string; // Optional custom prompt override
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session to check for user's API key
    const session = await auth();
    let userApiKey: string | null = null;

    // Check if user has their own API key configured (BYOK)
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openRouterApiKey: true },
      });
      
      // If the field is not null, the user has "opted-in" to BYOK
      if (user && user.openRouterApiKey !== null) {
        userApiKey = user.openRouterApiKey;
      }
    }

    const body: GenerateRequest = await request.json();
    // modelKey is now a full model ID from registry (e.g., 'google/gemini-2.5-flash-image')
    // Default to multimodal model for style-consistent generation
    const defaultModelId = getDefaultModel('multimodal').id;
    const { projectId, asset, modelKey = defaultModelId, customPrompt } = body;

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
      fluxModel: styleAnchor.fluxModel || 'black-forest-labs/flux.2-pro',
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
          // Reference image for direction consistency
          referenceDirection: char.referenceDirection || undefined,
          referenceImageBase64: char.referenceImageBase64 || undefined,
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

    // 5b. PHASE 4: Determine reference image for consistency
    // Priority: Parent direction reference > Character registry > Style anchor
    let referenceImageBase64 = styleAnchorBase64;
    let isUsingCharacterReference = false;

    // Decision: Prefer directional reference over style anchor for moveable assets
    if (asset.mobility?.type === 'moveable') {
      // PHASE 4: Check if this is a direction variant with a parent reference
      // If this asset has a parentAssetId, it's a child direction (Back/Left/Right)
      // and should use the parent's approved image (Front) for consistency
      if (asset.directionState?.parentAssetId) {
        // Note: Parent images no longer stored in database (moved to IndexedDB)
        // Fall back to character registry reference instead
        console.log(
          `ℹ️ Parent direction reference not available (images in IndexedDB). Using character registry or style anchor.`
        );
      }


      // Fallback to character registry if parent reference not available
      if (!isUsingCharacterReference && characterRegistry?.referenceImageBase64) {
        referenceImageBase64 = characterRegistry.referenceImageBase64;
        isUsingCharacterReference = true;
        console.log('🎯 Using character registry reference for consistency');
      }
    }

    // 6. Calculate generation size (2x for pixel-perfect downscaling)
    const genSize = calculateGenerationSize(project.baseResolution || '32x32');

    // 7. Get model config from registry
    const model = getModelById(modelKey);
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelKey}` },
        { status: 400 }
      );
    }

    // 8. Call OpenRouter using shared utility (correct endpoint + response parsing)
    // Use user's API key if available (BYOK), otherwise use default from env
    const result = await generateFluxImage({
      modelId: model.id,
      prompt: prompt,
      referenceImageBase64, // Uses character reference OR style anchor
      width: genSize.width,
      height: genSize.height,
      apiKey: userApiKey !== null ? userApiKey : undefined, // BYOK: use user's key if available
    });

    // Use seed from result or generate random fallback
    const seed = result.seed || Math.floor(Math.random() * 1000000);

    // Estimate cost using registry pricing (actual cost will be fetched later)
    const estimatedCostValue = estimateCost(model.id, 500, 1);

    console.log('✅ Image generated successfully:', {
      duration: `${result.durationMs}ms`,
      seed,
      size: `${genSize.width}x${genSize.height}`,
      generationId: result.generationId,
    });

    // 9. Save metadata to database (image stored in client IndexedDB)
    const createdAsset = await prisma.generatedAsset.create({
      data: {
        projectId: projectId,
        assetId: asset.id,
        variantId: asset.variant.id,
        status: 'generated',
        seed: seed,
        // imageBlob removed - client stores image in IndexedDB
        promptUsed: prompt,
        metadata: JSON.stringify({
          model: model.id,
          cost: estimatedCostValue,
          duration_ms: result.durationMs,
          seed: seed,
          generation_id: result.generationId, // For actual cost lookup
        }),
      },
    });

    console.log('💾 Saved metadata to database:', createdAsset.id);

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

    // 10b. Store as reference image for moveable assets (first direction only)
    // This enables consistency across N/S/E/W directions
    if (
      asset.mobility?.type === 'moveable' &&
      characterRegistry &&
      !isUsingCharacterReference // Only if we used style anchor (not existing reference)
    ) {
      console.log('📸 Storing generated image as character reference');
      await prisma.characterRegistry.update({
        where: { id: characterRegistry.id },
        data: {
          referenceDirection: asset.variant.direction || 'south',
          referenceImageBase64: result.imageUrl, // Store the generated image URL/base64
        },
      });
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
