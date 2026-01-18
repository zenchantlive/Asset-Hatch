import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createGameTools } from '@/lib/studio/game-tools';
import { getBabylonSystemPrompt } from '@/lib/studio/babylon-system-prompt';
import { getDefaultModel } from '@/lib/model-registry';

export const maxDuration = 30;

// Get default chat model from registry
const chatModel = getDefaultModel('chat');

export async function POST(req: NextRequest) {
  try {
    const { messages, gameId } = await req.json();

    // Validate gameId is present
    console.log('🎮 Studio Chat API received gameId:', gameId);
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

    // Build system prompt with current context
    const gameContext = {
      id: gameId,
      name: game.name,
      activeSceneId: game.activeSceneId,
    };
    const systemPrompt = getBabylonSystemPrompt(
      gameId,
      JSON.stringify(gameContext, null, 2)
    );

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
