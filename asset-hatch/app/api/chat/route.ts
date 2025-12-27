import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, qualities, projectId } = await req.json();

    // Convert UIMessages to ModelMessages for streamText
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,
      stopWhen: stepCountIs(10),
      system: `You are a proactive Game Design Agent. Your goal is to actively help the user build a complete asset plan for their game.
 
 CURRENT PROJECT CONTEXT:
 - Project ID: ${projectId}
 - Phase: Planning
 - Current Qualities: ${JSON.stringify(qualities, null, 2)}
 
 YOUR BEHAVIORAL PROTOCOLS:
 1. **BE AGENTIC:** Do not wait for permission. If the user implies a preference, set it immediately using tools. 
    - *User:* "I want a pixel art platformer."
    - *You:* Call \`updateQuality(art_style="Pixel Art")\` and \`updateQuality(game_genre="Platformer")\` immediately.
 
 2. **BE ITERATIVE:** Update the plan continuously. Don't wait for the "perfect" plan to write it down. 
    - Use \`updatePlan\` early and often to draft the asset list.
 
 3. **BE TRANSPARENT:** When you perform an action, briefly mention it.
    - "I've set the art style to Pixel Art. Let's list the characters next."
 
 WORKFLOW:
 1. Understand the game concept (Genre, Style, Mood).
 2. **IMMEDIATELY** use \`updateQuality\` to lock in these decisions.
 3. Suggest a list of assets (Characters, Environment, UI).
 4. **IMMEDIATELY** use \`updatePlan\` to draft the list.
 5. Refine based on feedback until the user approves.
 
 QUALITY PARAMETERS (Use updateQuality):
 - art_style (e.g., "Pixel Art", "Low Poly", "Vector")
 - base_resolution (e.g., "32x32")
 - perspective (e.g., "Top-down", "Side-view")
 - game_genre (e.g., "RPG", "Platformer")
 - theme (e.g., "Sci-Fi", "Fantasy")
 - mood (e.g., "Dark", "Cozy")
 - color_palette
 
 PLAN FORMAT (Use updatePlan):
 Create a Markdown plan with these headers:
 # Asset Plan for [Game Name]
 ## Characters
 ## Environments
 ## Items & Props
 ## UI Elements`,
      tools: {
        updateQuality: tool({
          description: 'Update a specific quality parameter. Execute this IMMEDIATELY when a user mentions a preference (e.g., "I want pixel art").',
          inputSchema: z.object({
            qualityKey: z.enum([
              'art_style',
              'base_resolution',
              'perspective',
              'game_genre',
              'theme',
              'mood',
              'color_palette'
            ]).describe('The specific parameter to update'),
            value: z.string().min(1).describe('The value to set (e.g., "Pixel Art", "Platformer")'),
          }),
          execute: async ({ qualityKey, value }: { qualityKey: string; value: string }) => {
            return {
              success: true,
              message: `[System] Updated ${qualityKey} to "${value}"`,
              qualityKey,
              value,
            };
          },
        }),
        updatePlan: tool({
          description: 'Update the asset plan markdown. Call this whenever the asset list changes or grows.',
          inputSchema: z.object({
            planMarkdown: z.string().min(10).describe('The full markdown content of the plan'),
          }),
          execute: async ({ planMarkdown }: { planMarkdown: string }) => {
            return {
              success: true,
              message: '[System] Plan updated successfully',
              planMarkdown,
            };
          },
        }),
        finalizePlan: tool({
          description: 'Call ONLY when the user explicitly agrees to "finalize" or "approve" the plan.',
          inputSchema: z.object({}),
          execute: async () => {
            return {
              success: true,
              message: '[System] Phase finalized',
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
