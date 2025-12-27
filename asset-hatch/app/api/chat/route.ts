import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  updateQualitySchema,
  updatePlanSchema,
  finalizePlanSchema,
  updateStyleKeywordsSchema,
  updateLightingKeywordsSchema,
  updateColorPaletteSchema,
  UpdateQualityInput,
  UpdatePlanInput,
  UpdateStyleKeywordsInput,
  UpdateLightingKeywordsInput,
  UpdateColorPaletteInput,
} from '@/lib/schemas';

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
 2. **BE ITERATIVE:** Update the plan continuously. Don't wait for the "perfect" plan to write it down. 
 3. **BE TRANSPARENT:** When you perform an action, briefly mention it.
 
 WORKFLOW:
 1. Understand the game concept (Genre, Style, Mood).
 2. **IMMEDIATELY** use \`updateQuality\` to lock in these decisions.
 3. Suggest a list of assets (Characters, Environment, UI).
 4. **IMMEDIATELY** use \`updatePlan\` to draft the list.
 5. Refine based on feedback until the user approves.`,
      tools: {
        updateQuality: tool({
          description: 'Update a specific quality parameter.',
          inputSchema: updateQualitySchema,
          execute: async ({ qualityKey, value }: UpdateQualityInput) => {
            try {
              // Persist to SQLite
              const fieldMap: Record<string, string> = {
                art_style: 'artStyle',
                base_resolution: 'baseResolution',
                perspective: 'perspective',
                game_genre: 'gameGenre',
                theme: 'theme',
                mood: 'mood',
                color_palette: 'colorPalette',
              };

              const prismaField = fieldMap[qualityKey] || qualityKey;

              await prisma.project.update({
                where: { id: projectId },
                data: { [prismaField]: value },
              });

              return {
                success: true,
                message: `[System] Updated ${qualityKey} to "${value}"`,
                qualityKey,
                value,
              };
            } catch (error) {
              console.error('Failed to update quality in SQLite:', error);
              return { success: false, error: 'Database update failed' };
            }
          },
        }),
        updatePlan: tool({
          description: 'Update the asset plan markdown.',
          inputSchema: updatePlanSchema,
          execute: async ({ planMarkdown }: UpdatePlanInput) => {
            try {
              // Persist to SQLite as a MemoryFile
              await prisma.memoryFile.upsert({
                where: {
                  // We need a unique way to identify the plan file for this project
                  // In Dexie it was 'entities.json' for the plan
                  id: `${projectId}-plan`, // Simple deterministic ID for plan
                },
                update: { content: planMarkdown },
                create: {
                  id: `${projectId}-plan`,
                  projectId: projectId,
                  type: 'entities.json',
                  content: planMarkdown,
                },
              });

              return {
                success: true,
                message: '[System] Plan saved to server',
                planMarkdown,
              };
            } catch (error) {
              console.error('Failed to update plan in SQLite:', error);
              return { success: false, error: 'Database update failed' };
            }
          },
        }),
        finalizePlan: tool({
          description: 'Call ONLY when the user explicitly agrees to "finalize" or "approve" the plan.',
          inputSchema: finalizePlanSchema,
          execute: async () => {
            try {
              await prisma.project.update({
                where: { id: projectId },
                data: { phase: 'style' },
              });
              return { success: true, message: '[System] Phase finalized' };
            } catch {
              return { success: false, error: 'Database update failed' };
            }
          },
        }),
        updateStyleKeywords: tool({
          description: 'Update style keywords.',
          inputSchema: updateStyleKeywordsSchema,
          execute: async ({ styleKeywords }: UpdateStyleKeywordsInput) => {
            // This is usually part of StyleAnchor which is created later, 
            // but we can store it in a temporary MemoryFile or update the latest StyleAnchor if it exists
            return { success: true, message: '[System] Style keywords noted', styleKeywords };
          },
        }),
        updateLightingKeywords: tool({
          description: 'Update lighting keywords.',
          inputSchema: updateLightingKeywordsSchema,
          execute: async ({ lightingKeywords }: UpdateLightingKeywordsInput) => {
            return { success: true, message: '[System] Lighting keywords noted', lightingKeywords };
          },
        }),
        updateColorPalette: tool({
          description: 'Update color palette.',
          inputSchema: updateColorPaletteSchema,
          execute: async ({ colors }: UpdateColorPaletteInput) => {
            return { success: true, message: '[System] Palette noted', colors };
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
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
