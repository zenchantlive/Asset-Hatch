import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { generateStyleAnchor } from '@/lib/style-anchor-generator';
import { getDefaultModel } from '@/lib/model-registry';
import {
  updateQualitySchema,
  updatePlanSchema,
  finalizePlanSchema,
  updateStyleDraftSchema,
  generateStyleAnchorSchema,
  finalizeStyleSchema,
  UpdateQualityInput,
  UpdatePlanInput,
  UpdateStyleDraftInput,
  GenerateStyleAnchorInput,
} from '@/lib/schemas';
// 3D mode tools and system prompt (conditional based on project.mode)
import { create3DChatTools, get3DSystemPrompt } from '@/lib/chat-tools-3d';
// Phase 7b: Shared documents for context bridge
import { fetchSharedDocuments, formatSharedDocsForPrompt } from '@/lib/studio/shared-doc-formatter';
import { createSharedDocToolsByProject } from '@/lib/studio/shared-doc-tools';

export const maxDuration = 30;

// Get default chat model from registry
const chatModel = getDefaultModel('chat');

export async function POST(req: NextRequest) {
  try {
    const { messages, qualities, projectId, model: requestModel } = await req.json();

    // Use model from request if provided, otherwise fall back to default
    const selectedModelId = requestModel || chatModel.id;
    console.log('🤖 Using chat model:', selectedModelId);

    // Validate projectId is present
    console.log('🔧 Chat API received projectId:', projectId);
    if (!projectId || projectId === '') {
      console.error('❌ Chat API: projectId is missing or empty');
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ensure project exists in SQLite (might only exist in IndexedDB)
    // This handles the hybrid persistence model sync issue
    let existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      console.log('📦 Project not found in SQLite, creating...');
      existingProject = await prisma.project.create({
        data: {
          id: projectId,
          name: 'Imported Project',
          phase: 'planning',
        },
      });
      console.log('✅ Project created in SQLite');
    }

    // Check if project is in 3D mode for conditional tool/prompt selection
    // Note: mode field exists in schema.prisma but client may need regeneration
    const projectMode = (existingProject as { mode?: string }).mode;
    const is3DMode = projectMode === '3d';
    console.log(`🎮 Project mode: ${is3DMode ? '3D' : '2D'}`);

    // Get authenticated session to check for user's API key (BYOK)
    const session = await auth();
    let userApiKey: string | null = null;

    // Check if user has their own API key configured
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openRouterApiKey: true },
      });
      userApiKey = user?.openRouterApiKey || null;
      if (userApiKey) {
        console.log('🔑 Using user\'s own API key (BYOK)');
      }
    }

    // Convert UIMessages to ModelMessages for streamText
    const modelMessages = await convertToModelMessages(messages);

    // Fetch shared documents for context (game-design.md, asset-inventory.md, etc.)
    let sharedDocsFormatted = '';
    try {
      const sharedDocs = await fetchSharedDocuments(projectId);
      sharedDocsFormatted = formatSharedDocsForPrompt(sharedDocs);
      console.log('📚 Asset chat: Loaded shared docs');
    } catch (error) {
      console.warn('Failed to fetch shared docs:', error);
    }

    // Use 3D system prompt for 3D mode, 2D system prompt otherwise
    const baseSystemPrompt = is3DMode
      ? get3DSystemPrompt(projectId, qualities)
      : `You are a proactive Game Design Agent. Your goal is to actively help the user build a complete asset plan for their game.

 CURRENT PROJECT CONTEXT:
  - Project ID: ${projectId}
  - Phase: Planning
  - Current Qualities: ${JSON.stringify(qualities, null, 2)}

 YOUR BEHAVIORAL PROTOCOLS:
   1. **BE AGENTIC:** Do not wait for permission. If the user implies a preference, set it immediately using tools.
   2. **BE ITERATIVE:** Update the plan continuously. Don't wait for the "perfect" plan to write it down.
   3. **BE TRANSPARENT:** When you perform an action, briefly mention it.
   4. **AUTO-DOCUMENT:** Whenever the user shares game concept, assets, scenes, or patterns - IMMEDIATELY update the shared documents. Do NOT ask permission - just do it.

 AUTO-DOCUMENTATION RULES (DO THIS PROACTIVELY):
   - User describes game genre/story → updateSharedDoc(game-design.md)
   - User adds characters/NPCs to plan → updateSharedDoc(asset-inventory.md)
   - User mentions level/scene ideas → updateSharedDoc(scene-notes.md)
   - User discusses technical patterns/gotchas → updateSharedDoc(development-log.md)
   - After EVERY meaningful conversation update, call updateSharedDoc with append=true

 WORKFLOW:
   1. Understand the game concept (Genre, Style, Mood).
   2. **IMMEDIATELY** use \`updateQuality\` to lock in these decisions.
   3. **IMMEDIATELY** use \`updateSharedDoc\` to document the concept in game-design.md.
   4. Suggest a list of assets (Characters, Environment, UI).
   5. **IMMEDIATELY** use \`updatePlan\` to draft the list.
   6. **IMMEDIATELY** use \`updateSharedDoc\` (append=true) to add assets to asset-inventory.md.
   7. Refine based on feedback until the user approves.
   8. Keep all shared docs synchronized with the conversation.

 CRITICAL ASSET PLAN FORMAT REQUIREMENTS:
   - Each bullet point MUST represent exactly ONE individual asset
   - NEVER group multiple items in one line (e.g., NOT "robots, cats, dogs")
   - Include specific details for EACH individual asset
   - Each asset will generate a single isolated image
   
   MOBILITY TAGS (REQUIRED FOR EACH ASSET):
   Each asset MUST start with a mobility tag in brackets:
   - [STATIC] - Non-moving assets: furniture, buildings, items, UI elements, backgrounds
   - [MOVEABLE:4] - Characters/NPCs needing 4 directions (N/S/E/W)
   - [MOVEABLE:8] - Characters needing 8 directions (includes diagonals)
   - [ANIM:N] - Animated elements with N frames (fire, water, flags)
   
   CORRECT FORMAT EXAMPLE:
   ## Characters
   - [MOVEABLE:4] Farmer Character
     - Idle (4 frames)
     - Walking (8 frames)
   - [MOVEABLE:4] Village Guard
     - Idle (4 frames)
     - Patrol (6 frames)
   
   ## Environment
   - [STATIC] Oak Tree
     - Description: Large oak tree with autumn leaves
   - [ANIM:4] Campfire
     - Description: Flickering campfire with smoke
   
    ## Items
    - [STATIC] Health Potion
      - Description: Red potion in glass bottle
    
    BE SPECIFIC: Each asset needs a clear, individual description for image generation.`;

    // Append shared docs to system prompt
    const systemPrompt = sharedDocsFormatted
      ? `${baseSystemPrompt}\n\n# SHARED PROJECT DOCUMENTS\n\nThe following documents have been created for this project. Update them as you work:\n\n${sharedDocsFormatted}`
      : baseSystemPrompt;

    // Create 3D tools if in 3D mode (these will be merged with base tools)
    const tools3D = is3DMode ? create3DChatTools(projectId) : {};

    const result = streamText({
      // Use chat model from registry or request override
      model: openrouter(selectedModelId),
      messages: modelMessages,
      stopWhen: stepCountIs(10),
      system: systemPrompt,
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

              const prismaField = fieldMap[qualityKey as keyof typeof fieldMap];

              if (!prismaField) {
                return { success: false, error: `Invalid quality key: ${qualityKey}` };
              }

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
        // Style Phase Tools
        updateStyleDraft: tool({
          description: 'Update the style draft with collected parameters. Call this whenever the user specifies style preferences.',
          inputSchema: updateStyleDraftSchema,
          execute: async (input: UpdateStyleDraftInput) => {
            try {
              // Load existing draft or create new one
              const existingDraft = await prisma.memoryFile.findUnique({
                where: { id: `${projectId}-style-draft` },
              });

              // Merge with existing draft data (with improved error handling)
              const defaultData = { styleKeywords: '', lightingKeywords: '', colorPalette: [], fluxModel: 'black-forest-labs/flux.2-pro' };
              let currentData;
              try {
                currentData = existingDraft && existingDraft.content
                  ? JSON.parse(existingDraft.content)
                  : defaultData;
              } catch {
                currentData = defaultData;
              }

              const updatedData = {
                styleKeywords: input.styleKeywords ?? currentData.styleKeywords,
                lightingKeywords: input.lightingKeywords ?? currentData.lightingKeywords,
                colorPalette: input.colorPalette ?? currentData.colorPalette,
                fluxModel: input.fluxModel ?? currentData.fluxModel,
              };

              // Persist to SQLite
              await prisma.memoryFile.upsert({
                where: { id: `${projectId}-style-draft` },
                update: { content: JSON.stringify(updatedData) },
                create: {
                  id: `${projectId}-style-draft`,
                  projectId: projectId,
                  type: 'style-draft.json',
                  content: JSON.stringify(updatedData),
                },
              });

              return {
                success: true,
                message: '[System] Style draft updated',
                ...updatedData,
              };
            } catch (error) {
              console.error('Failed to update style draft:', error);
              return { success: false, error: 'Database update failed' };
            }
          },
        }),
        generateStyleAnchor: tool({
          description: 'Generate the style anchor reference image. Call when user approves the style and wants to generate the reference image.',
          inputSchema: generateStyleAnchorSchema,
          execute: async ({ prompt }: GenerateStyleAnchorInput) => {
            try {
              // Load style draft
              const styleDraftRecord = await prisma.memoryFile.findUnique({
                where: { id: `${projectId}-style-draft` },
              });

              if (!styleDraftRecord) {
                return { success: false, error: 'No style draft found. Collect style preferences first.' };
              }

              const styleDraft = JSON.parse(styleDraftRecord.content);

              // Call the shared generation logic directly (no HTTP overhead)
              // Pass user's API key for BYOK support
              const result = await generateStyleAnchor({
                projectId,
                prompt,
                styleKeywords: styleDraft.styleKeywords,
                lightingKeywords: styleDraft.lightingKeywords,
                colorPalette: styleDraft.colorPalette,
                fluxModel: styleDraft.fluxModel,
                apiKey: userApiKey ?? undefined, // BYOK: use user's key if available
              });

              // NOTE: We DO NOT return imageUrl to the LLM at all
              // The imageUrl is a huge base64 string (~2MB) that would blow up the context
              // The client must fetch the image from the database using styleAnchorId
              console.log('✅ Style anchor generated:', result.styleAnchor.id);

              return {
                success: true,
                message: '[System] Style anchor image has been generated and saved. The reference image is ready for user review. Ask the user if they are happy with the generated style.',
                styleAnchorId: result.styleAnchor.id,
              };
            } catch (error) {
              console.error('Failed to generate style anchor:', error);
              return { success: false, error: 'Style anchor generation failed' };
            }
          },
        }),
        finalizeStyle: tool({
          description: 'Finalize the style phase and proceed to generation. Call ONLY when user explicitly approves the generated style anchor image.',
          inputSchema: finalizeStyleSchema,
          execute: async () => {
            try {
              await prisma.project.update({
                where: { id: projectId },
                data: { phase: 'generation' },
              });
              return { success: true, message: '[System] Style finalized, proceeding to generation phase' };
            } catch {
              return { success: false, error: 'Database update failed' };
            }
          },
        }),
        // Shared document tools (game-design.md, asset-inventory.md, etc.)
        ...createSharedDocToolsByProject(projectId),
        // Spread 3D tools if in 3D mode (these override 2D equivalents)
        ...tools3D,
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
