import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createGameTools } from '@/lib/studio/game-tools';
import { createSharedDocTools } from '@/lib/studio/shared-doc-tools';
import { getBabylonSystemPrompt } from '@/lib/studio/babylon-system-prompt';
import { getDefaultModel } from '@/lib/model-registry';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

export const maxDuration = 30;

// Get default chat model from registry
const chatModel = getDefaultModel('chat');

export async function POST(req: NextRequest) {
  try {
    const { messages, gameId, projectContext: projectContextJson } = await req.json();

    // Validate gameId is present
    console.log('🎮 Studio Chat API received gameId:', gameId, 'hasProjectContext:', !!projectContextJson);
    if (!gameId || typeof gameId !== 'string') {
      console.error('❌ Studio Chat API: gameId is missing or invalid');
      return new Response(
        JSON.stringify({ error: 'gameId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the game
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse project context if provided (Phase 6B)
    let projectContext: UnifiedProjectContext | undefined;
    if (projectContextJson) {
      try {
        projectContext =
          typeof projectContextJson === 'string'
            ? JSON.parse(projectContextJson)
            : projectContextJson;
      } catch (error) {
        console.warn('Failed to parse projectContext:', error);
      }
    }

    // Fetch linked assets for system prompt
    let linkedAssets: Array<{ key: string; type: string; name: string; metadata: Record<string, unknown> }> = [];

    if (game.projectId) {
      // Fetch asset refs for this game
      const assetRefs = await prisma.gameAssetRef.findMany({
        where: { gameId: game.id },
        select: {
          manifestKey: true,
          assetType: true,
          assetName: true,
          assetId: true,
        },
      });

      // Fetch metadata from Generated3DAsset for all referenced assets
      const assetIds = assetRefs.map(ref => ref.assetId);
      const generatedAssets = await prisma.generated3DAsset.findMany({
        where: { id: { in: assetIds } },
        select: {
          id: true,
          promptUsed: true,
          animatedModelUrls: true,
          isRiggable: true,
        },
      });

      // Build metadata map
      const metadataMap = new Map<string, Record<string, unknown>>();
      for (const asset of generatedAssets) {
        const metadata: Record<string, unknown> = {};
        if (asset.promptUsed) metadata.prompt = asset.promptUsed;
        if (asset.isRiggable) metadata.rigged = asset.isRiggable;
        if (asset.animatedModelUrls) {
          try {
            const anims = JSON.parse(asset.animatedModelUrls);
            metadata.animations = Object.keys(anims);
          } catch {
            // Not valid JSON
          }
        }
        metadataMap.set(asset.id, metadata);
      }

      linkedAssets = assetRefs.map(ref => ({
        key: ref.manifestKey || ref.assetName.toLowerCase().replace(/\s+/g, '_'),
        type: ref.assetType,
        name: ref.assetName,
        metadata: metadataMap.get(ref.assetId) || {},
      }));
    }

    // Build system prompt with current context
    const gameContext = {
      id: gameId,
      name: game.name,
      activeSceneId: game.activeSceneId,
    };

    // Build extended context with project context (Phase 6B)
    let systemPromptContext = JSON.stringify(gameContext, null, 2);
    if (projectContext?.gameConcept) {
      systemPromptContext += `\n\nPROJECT CONTEXT:\n${projectContext.gameConcept}`;
      if (projectContext.characters?.length) {
        systemPromptContext += `\nCharacters: ${projectContext.characters.map((c) => c.name).join(', ')}`;
      }
      if (projectContext.keyFeatures?.length) {
        systemPromptContext += `\nKey Features: ${projectContext.keyFeatures.join(', ')}`;
      }
    }

    const systemPrompt = getBabylonSystemPrompt(gameId, systemPromptContext, linkedAssets);

    // Convert UIMessages to ModelMessages (CRITICAL - MUST BE AWAITED)
    const modelMessages = await convertToModelMessages(messages);

    // Get game tools
    const gameTools = createGameTools(gameId);

    // Get shared document tools (Phase 7b - these let AI read/write game-design.md, asset-inventory.md, etc.)
    const sharedDocTools = createSharedDocTools(gameId);

    // Combine all tools
    const allTools = {
      ...gameTools,
      ...sharedDocTools,
    };

    // Stream response with tools
    const result = streamText({
      model: openrouter(chatModel.id),
      messages: modelMessages,
      system: systemPrompt,
      stopWhen: stepCountIs(15), // Allow up to 15 tool calls per request
      tools: allTools,
    });

    // CRITICAL: Use toUIMessageStreamResponse()
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Studio Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
