/**
 * 3D Chat Tools for Asset Hatch
 *
 * Provides 3D-specific AI SDK tools and system prompt for the chat route.
 * Used when project.mode === '3d'.
 *
 * Kept separate from the main chat route to maintain modularity and
 * ensure 2D code isolation (~200 line target per file).
 *
 * @see app/api/chat/route.ts for integration
 * @see lib/schemas-3d.ts for tool input validation
 */

import { tool } from 'ai';
import { prisma } from '@/lib/prisma';
import {
    updateQuality3DSchema,
    updatePlan3DSchema,
    finalizePlan3DSchema,
    type UpdateQuality3DInput,
    type UpdatePlan3DInput,
} from '@/lib/schemas-3d';

// =============================================================================
// 3D System Prompt
// =============================================================================

/**
 * Generate the 3D-specific system prompt for chat
 *
 * @param projectId - Current project ID
 * @param qualities - Current quality settings (JSON)
 * @returns System prompt string for 3D planning mode
 */
export function get3DSystemPrompt(projectId: string, qualities: Record<string, unknown>): string {
    return `You are a proactive 3D Game Asset Planner.

CURRENT PROJECT CONTEXT:
- Project ID: ${projectId}
- Mode: 3D
- Current Qualities: ${JSON.stringify(qualities, null, 2)}

YOUR BEHAVIORAL PROTOCOLS:
1. **BE AGENTIC:** Do not wait for permission. If the user implies a preference, set it immediately using tools.
2. **BE ITERATIVE:** Update the plan continuously as requirements emerge.
3. **BE TRANSPARENT:** When you perform an action, briefly mention it.

3D ASSET PLAN FORMAT REQUIREMENTS:
Each asset bullet must specify:
- [RIG] - If the asset should be auto-rigged (characters/creatures with humanoid skeleton)
- [STATIC] - Non-rigged props/environmental assets

For [RIG] assets, specify animations needed:
- Animations: idle, walk, run, jump, climb, dive

CORRECT FORMAT EXAMPLE:
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose for rigging
  - Animations: idle, walk, run, attack

## Props
- [STATIC] Treasure Chest
  - Description: Wooden chest with gold trim

## Environment
- [STATIC] Stone Pillar
  - Description: Ancient stone pillar with ivy

PRO-TIP: Include "T-pose" or "A-pose" in character descriptions for best rigging results.

DO NOT USE 2D TAGS: No [MOVEABLE:4], [MOVEABLE:8], or [ANIM:N] tags - those are for 2D sprite generation only.

GENERATION WORKFLOW:
Once plan is finalized, assets will be generated via:
1. POST /api/generate-3d - Submit text_to_model task
2. GET /api/generate-3d/[taskId]/status - Poll until complete (returns model URL)
3. POST /api/generate-3d/rig - Auto-rig characters (if [RIG] tag)
4. POST /api/generate-3d/animate - Apply animation presets
5. All tasks are async - UI polls status endpoints for progress`;
}

// =============================================================================
// 3D Quality Tool
// =============================================================================

/**
 * 3D quality update tool - sets mesh style, texture quality, rig preferences
 *
 * @param projectId - Current project ID
 * @returns AI SDK tool for updateQuality3D
 */
function createUpdateQuality3DTool(projectId: string) {
    return tool({
        description: 'Update 3D quality parameters like mesh style, texture quality, and rigging preferences.',
        inputSchema: updateQuality3DSchema,
        execute: async (input: UpdateQuality3DInput) => {
            try {
                // Load existing 3D quality settings
                const existingRecord = await prisma.memoryFile.findUnique({
                    where: { id: `${projectId}-quality-3d` },
                });

                // Default 3D quality settings
                const defaultSettings = {
                    meshStyle: 'stylized',
                    textureQuality: 'standard',
                    defaultShouldRig: true,
                    defaultAnimations: ['preset:idle', 'preset:walk'],
                };

                // Parse existing or use defaults
                let currentSettings;
                try {
                    currentSettings = existingRecord?.content
                        ? JSON.parse(existingRecord.content)
                        : defaultSettings;
                } catch {
                    currentSettings = defaultSettings;
                }

                // Merge with new input
                const updatedSettings = {
                    meshStyle: input.meshStyle ?? currentSettings.meshStyle,
                    textureQuality: input.textureQuality ?? currentSettings.textureQuality,
                    defaultShouldRig: input.defaultShouldRig ?? currentSettings.defaultShouldRig,
                    defaultAnimations: input.defaultAnimations ?? currentSettings.defaultAnimations,
                };

                // Persist to SQLite
                await prisma.memoryFile.upsert({
                    where: { id: `${projectId}-quality-3d` },
                    update: { content: JSON.stringify(updatedSettings) },
                    create: {
                        id: `${projectId}-quality-3d`,
                        projectId: projectId,
                        type: 'quality-3d.json',
                        content: JSON.stringify(updatedSettings),
                    },
                });

                return {
                    success: true,
                    message: '[System] 3D quality settings updated',
                    ...updatedSettings,
                };
            } catch (error) {
                console.error('Failed to update 3D quality:', error);
                return { success: false, error: 'Database update failed' };
            }
        },
    });
}

// =============================================================================
// 3D Plan Tool
// =============================================================================

/**
 * 3D plan update tool - saves markdown with [RIG]/[STATIC] tags
 *
 * @param projectId - Current project ID
 * @returns AI SDK tool for updatePlan3D
 */
function createUpdatePlan3DTool(projectId: string) {
    return tool({
        description: 'Update the 3D asset plan markdown with [RIG]/[STATIC] tags.',
        inputSchema: updatePlan3DSchema,
        execute: async ({ planMarkdown }: UpdatePlan3DInput) => {
            try {
                // Persist to SQLite as a MemoryFile
                await prisma.memoryFile.upsert({
                    where: { id: `${projectId}-plan` },
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
                    message: '[System] 3D plan saved to server',
                    planMarkdown,
                };
            } catch (error) {
                console.error('Failed to update 3D plan:', error);
                return { success: false, error: 'Database update failed' };
            }
        },
    });
}

// =============================================================================
// 3D Finalize Tool
// =============================================================================

/**
 * 3D finalize tool - skips style phase, goes directly to generation
 *
 * @param projectId - Current project ID
 * @returns AI SDK tool for finalizePlan3D
 */
function createFinalizePlan3DTool(projectId: string) {
    return tool({
        description: 'Finalize the 3D plan and proceed to generation. Call when user approves the plan.',
        inputSchema: finalizePlan3DSchema,
        execute: async () => {
            try {
                // 3D mode skips style phase - go directly to generation
                await prisma.project.update({
                    where: { id: projectId },
                    data: { phase: 'generation' },
                });
                return {
                    success: true,
                    message: '[System] 3D plan finalized, proceeding to generation phase',
                };
            } catch {
                return { success: false, error: 'Database update failed' };
            }
        },
    });
}

// =============================================================================
// Export Factory Function
// =============================================================================

/**
 * Create all 3D chat tools for a given project
 *
 * @param projectId - Current project ID
 * @returns Record of 3D tools for AI SDK
 */
export function create3DChatTools(projectId: string) {
    return {
        updateQuality3D: createUpdateQuality3DTool(projectId),
        updatePlan3D: createUpdatePlan3DTool(projectId),
        finalizePlan3D: createFinalizePlan3DTool(projectId),
    };
}
