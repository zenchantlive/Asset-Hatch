/**
 * Tripo3D Mesh Generation Functions
 * 
 * High-level functions for generating 3D meshes from text prompts.
 * Uses the base client and polling utilities.
 */

import {
    createTripoTask,
    getTripoApiKey,
    type TextToModelParams,
} from './client';
import { pollTripoTask, type PollOptions } from './polling';
import type { TripoTask } from '@/lib/types/3d-generation';

// =============================================================================
// Generation Options
// =============================================================================

/**
 * Options for text-to-3D mesh generation
 */
export interface TextTo3DOptions {
    // Text prompt describing the 3D model
    prompt: string;
    // Optional user-provided API key (BYOK)
    apiKey?: string;
    // Optional polling configuration
    pollOptions?: PollOptions;
}

/**
 * Result from a successful mesh generation
 */
export interface MeshGenerationResult {
    // Task ID for reference
    taskId: string;
    // URL to download the GLB model
    modelUrl: string;
    // URL to preview render image
    previewImageUrl?: string;
    // Total generation time in ms
    durationMs: number;
}

// =============================================================================
// Generation Functions
// =============================================================================

/**
 * Generate a 3D mesh from a text prompt
 * 
 * This is the main entry point for text-to-3D generation.
 * It creates a task, polls until complete, and returns the model URL.
 * 
 * @param options - Generation options
 * @returns Generated mesh result with model URL
 * @throws Error if generation fails
 */
export async function generateMeshFromText(
    options: TextTo3DOptions
): Promise<MeshGenerationResult> {
    const startTime = Date.now();

    // Get API key
    const apiKey = getTripoApiKey(options.apiKey);

    console.log('🎨 Starting text-to-3D generation:', {
        promptLength: options.prompt.length,
    });

    // Create the task
    const taskParams: TextToModelParams = {
        type: 'text_to_model',
        prompt: options.prompt,
    };

    const task = await createTripoTask(taskParams, apiKey);

    // Poll until complete
    const completedTask = await pollTripoTask(
        task.task_id,
        apiKey,
        options.pollOptions
    );

    // Extract model URL from output
    const modelUrl = getModelUrl(completedTask);
    if (!modelUrl) {
        throw new Error('No model URL in completed task output');
    }

    const durationMs = Date.now() - startTime;
    console.log('✅ Mesh generation complete:', {
        taskId: task.task_id,
        durationMs,
    });

    return {
        taskId: task.task_id,
        modelUrl,
        previewImageUrl: completedTask.output?.rendered_image?.url,
        durationMs,
    };
}

/**
 * Submit a mesh generation task without waiting for completion
 * 
 * Use this when you want to handle polling separately or 
 * need the task ID immediately.
 * 
 * @param options - Generation options
 * @returns Task ID and initial status
 */
export async function submitMeshGenerationTask(
    options: Omit<TextTo3DOptions, 'pollOptions'>
): Promise<TripoTask> {
    // Get API key
    const apiKey = getTripoApiKey(options.apiKey);

    // Create the task
    const taskParams: TextToModelParams = {
        type: 'text_to_model',
        prompt: options.prompt,
    };

    return createTripoTask(taskParams, apiKey);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract model URL from task output
 * Handles both draft and PBR model outputs
 */
function getModelUrl(task: TripoTask): string | undefined {
    // Prefer PBR model if available (from refine step)
    if (task.output?.pbr_model?.url) {
        return task.output.pbr_model.url;
    }
    // Fall back to draft model
    if (task.output?.model?.url) {
        return task.output.model.url;
    }
    return undefined;
}
