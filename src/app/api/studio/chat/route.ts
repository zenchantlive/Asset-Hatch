import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createGameTools } from '@/lib/studio/game-tools';
import { getBabylonSystemPrompt } from '@/lib/studio/babylon-system-prompt';
import { getDefaultModel } from '@/lib/model-registry';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

export const maxDuration = 30;

// Get default chat model from registry
const chatModel = getDefaultModel('chat');

export async function POST(req: NextRequest) {
  try {
    const { messages, gameId, projectContextJson } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
        console.error('❌ Studio Chat API: Failed to parse projectContext JSON.', error);
        return new Response(
          JSON.stringify({ error: 'Invalid projectContext format. Expected a valid JSON object or string.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch linked assets for system prompt
    let linkedAssets: Array<{ key: string; type: string; name: string; metadata: Record<string, unknown> }> = [];

    if (game.projectId) {
      // Fetch asset refs for this game, including assetId to get metadata
      const assetRefs = await prisma.gameAssetRef.findMany({
        where: { gameId: game.id },
        select: {
          assetId: true,
          manifestKey: true,
          assetType: true,
          assetName: true,
        },
      });

      // Batch fetch metadata to avoid N+1 queries
      const assetIds = assetRefs.map(ref => ref.assetId);
      const [gen3dAssets, gen2dAssets] = await Promise.all([
        prisma.generated3DAsset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, promptUsed: true, animatedModelUrls: true },
        }),
        prisma.generatedAsset.findMany({
          where: { id: { in: assetIds } },
          select: { id: true, promptUsed: true, metadata: true },
        }),
      ]);

      const metadataMap = new Map<string, Record<string, unknown>>();

      for (const asset of gen3dAssets) {
        const metadata: { prompt?: string; animations?: string[] } = { prompt: asset.promptUsed || undefined };
        if (asset.animatedModelUrls) {
          try {
            metadata.animations = Object.keys(JSON.parse(asset.animatedModelUrls));
          } catch {}
        }
        metadataMap.set(asset.id, metadata as Record<string, unknown>);
      }

      for (const asset of gen2dAssets) {
        const metadata: { prompt?: string; style?: string } = { prompt: asset.promptUsed || undefined };
        if (asset.metadata) {
          try {
            const meta = JSON.parse(asset.metadata);
            metadata.style = meta.style || meta.artStyle;
          } catch {}
        }
        metadataMap.set(asset.id, metadata as Record<string, unknown>);
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

    // Stream response with tools
    const result = streamText({
      model: openrouter(chatModel.id),
      messages: modelMessages,
      system: systemPrompt,
      stopWhen: stepCountIs(15), // Allow up to 15 tool calls per request
      tools: gameTools,
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
