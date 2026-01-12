/**
 * Tripo3D Rigging and Animation Functions
 * 
 * Functions for auto-rigging meshes and applying animation presets.
 */

import {
    createTripoTask,
    getTripoApiKey,
    type AnimateRigParams,
    type AnimateRetargetParams,
} from './client';
import { pollTripoTask, type PollOptions } from './polling';
import type { AnimationPreset, TripoTask } from '@/lib/types/3d-generation';

// =============================================================================
// Rigging Types
// =============================================================================

/**
 * Options for rigging a mesh
 */
export interface RigOptions {
    // Task ID of the model to rig (from mesh generation)
    modelTaskId: string;
    // Optional user-provided API key (BYOK)
    apiKey?: string;
    // Optional polling configuration
    pollOptions?: PollOptions;
}

/**
 * Result from a successful rigging operation
 */
export interface RigResult {
    // Task ID for reference
    taskId: string;
    // URL to download the rigged GLB model
    modelUrl: string;
    // Total rigging time in ms
    durationMs: number;
}

// =============================================================================
// Animation Types
// =============================================================================

/**
 * Options for applying animation to a rigged model
 */
export interface AnimateOptions {
    // Task ID of the rigged model
    riggedModelTaskId: string;
    // Animation preset to apply
    animation: AnimationPreset;
    // Optional user-provided API key (BYOK)
    apiKey?: string;
    // Optional polling configuration
    pollOptions?: PollOptions;
}

/**
 * Result from a successful animation operation
 */
export interface AnimateResult {
    // Task ID for reference
    taskId: string;
    // URL to download the animated GLB model
    modelUrl: string;
    // Which animation was applied
    animation: AnimationPreset;
    // Total animation time in ms
    durationMs: number;
}

// =============================================================================
// Rigging Functions
// =============================================================================

/**
 * Auto-rig a mesh for animation
 * 
 * @param options - Rigging options including model task ID
 * @returns Rigged model result with URL
 * @throws Error if rigging fails
 */
export async function rigMesh(options: RigOptions): Promise<RigResult> {
    const startTime = Date.now();
    const apiKey = getTripoApiKey(options.apiKey);

    console.log('🦴 Starting mesh rigging:', { modelTaskId: options.modelTaskId });

    // Create rig task
    const taskParams: AnimateRigParams = {
        type: 'animate_rig',
        original_model_task_id: options.modelTaskId,
    };

    const task = await createTripoTask(taskParams, apiKey);

    // Poll until complete
    const completedTask = await pollTripoTask(
        task.task_id,
        apiKey,
        options.pollOptions
    );

    // Extract rigged model URL
    const modelUrl = completedTask.output?.model?.url;
    if (!modelUrl) {
        throw new Error('No model URL in rigging task output');
    }

    const durationMs = Date.now() - startTime;
    console.log('✅ Rigging complete:', { taskId: task.task_id, durationMs });

    return { taskId: task.task_id, modelUrl, durationMs };
}

// =============================================================================
// Animation Functions
// =============================================================================

/**
 * Apply an animation preset to a rigged model
 * 
 * @param options - Animation options including rig task ID and preset
 * @returns Animated model result with URL
 * @throws Error if animation fails
 */
export async function applyAnimation(
    options: AnimateOptions
): Promise<AnimateResult> {
    const startTime = Date.now();
    const apiKey = getTripoApiKey(options.apiKey);

    console.log('🏃 Applying animation:', {
        riggedModelTaskId: options.riggedModelTaskId,
        animation: options.animation,
    });

    // Create animation task
    const taskParams: AnimateRetargetParams = {
        type: 'animate_retarget',
        original_model_task_id: options.riggedModelTaskId,
        animation: options.animation,
    };

    const task = await createTripoTask(taskParams, apiKey);

    // Poll until complete
    const completedTask = await pollTripoTask(
        task.task_id,
        apiKey,
        options.pollOptions
    );

    // Extract animated model URL
    const modelUrl = completedTask.output?.model?.url;
    if (!modelUrl) {
        throw new Error('No model URL in animation task output');
    }

    const durationMs = Date.now() - startTime;
    console.log('✅ Animation complete:', {
        taskId: task.task_id,
        animation: options.animation,
        durationMs,
    });

    return {
        taskId: task.task_id,
        modelUrl,
        animation: options.animation,
        durationMs,
    };
}

/**
 * Submit a rigging task without waiting for completion
 */
export async function submitRigTask(
    options: Omit<RigOptions, 'pollOptions'>
): Promise<TripoTask> {
    const apiKey = getTripoApiKey(options.apiKey);

    const taskParams: AnimateRigParams = {
        type: 'animate_rig',
        original_model_task_id: options.modelTaskId,
    };

    return createTripoTask(taskParams, apiKey);
}

/**
 * Submit an animation task without waiting for completion
 */
export async function submitAnimationTask(
    options: Omit<AnimateOptions, 'pollOptions'>
): Promise<TripoTask> {
    const apiKey = getTripoApiKey(options.apiKey);

    const taskParams: AnimateRetargetParams = {
        type: 'animate_retarget',
        original_model_task_id: options.riggedModelTaskId,
        animation: options.animation,
    };

    return createTripoTask(taskParams, apiKey);
}
