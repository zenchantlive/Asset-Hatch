/**
 * Tripo3D Task Polling with Exponential Backoff
 * 
 * Handles async task polling since Tripo uses a task-based API
 * where operations complete asynchronously.
 */

import { getTripoTaskStatus } from './client';
import type { TripoTask, TripoTaskStatus } from '@/lib/types/3d-generation';

// =============================================================================
// Polling Configuration
// =============================================================================

/**
 * Default polling configuration
 * Tasks typically take 30-120 seconds to complete
 */
export const POLLING_DEFAULTS = {
    // Initial interval between polls (ms)
    initialIntervalMs: 5000,
    // Multiplier for exponential backoff
    backoffMultiplier: 1.5,
    // Maximum interval between polls (ms)
    maxIntervalMs: 30000,
    // Maximum total time to poll before timeout (ms)
    maxTotalTimeMs: 300000, // 5 minutes
} as const;

/**
 * Options for polling a task
 */
export interface PollOptions {
    // Initial polling interval in ms (default: 5000)
    initialIntervalMs?: number;
    // Backoff multiplier (default: 1.5)
    backoffMultiplier?: number;
    // Max interval in ms (default: 30000)
    maxIntervalMs?: number;
    // Max total time in ms (default: 300000)
    maxTotalTimeMs?: number;
    // Callback for progress updates
    onProgress?: (task: TripoTask) => void;
}

/**
 * Terminal task statuses that stop polling
 */
const TERMINAL_STATUSES: TripoTaskStatus[] = [
    'success',
    'failed',
    'banned',
    'expired',
];

/**
 * Check if a task status is terminal (no more polling needed)
 */
function isTerminalStatus(status: TripoTaskStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
}

// =============================================================================
// Polling Function
// =============================================================================

/**
 * Poll a Tripo task until it reaches a terminal state
 * Uses exponential backoff to reduce API load for long-running tasks
 * 
 * @param taskId - Task ID to poll
 * @param apiKey - API key for authentication
 * @param options - Polling configuration options
 * @returns Final task state
 * @throws Error if task fails or timeout reached
 */
export async function pollTripoTask(
    taskId: string,
    apiKey: string,
    options: PollOptions = {}
): Promise<TripoTask> {
    // Merge options with defaults
    const config = {
        initialIntervalMs: options.initialIntervalMs ?? POLLING_DEFAULTS.initialIntervalMs,
        backoffMultiplier: options.backoffMultiplier ?? POLLING_DEFAULTS.backoffMultiplier,
        maxIntervalMs: options.maxIntervalMs ?? POLLING_DEFAULTS.maxIntervalMs,
        maxTotalTimeMs: options.maxTotalTimeMs ?? POLLING_DEFAULTS.maxTotalTimeMs,
        onProgress: options.onProgress,
    };

    // Track timing
    const startTime = Date.now();
    let currentInterval = config.initialIntervalMs;
    let pollCount = 0;

    console.log('⏳ Starting poll for task:', taskId);

    // Poll loop
    while (true) {
        // Check timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > config.maxTotalTimeMs) {
            throw new Error(
                `Tripo task ${taskId} timed out after ${Math.round(elapsed / 1000)}s`
            );
        }

        // Get current status
        const task = await getTripoTaskStatus(taskId, apiKey);
        pollCount++;

        // Log progress
        console.log(`🔄 Poll #${pollCount} - Status: ${task.status}`, {
            progress: task.progress,
            elapsed: `${Math.round(elapsed / 1000)}s`,
        });

        // Call progress callback if provided
        if (config.onProgress) {
            config.onProgress(task);
        }

        // Check if terminal
        if (isTerminalStatus(task.status)) {
            console.log('✅ Task reached terminal state:', task.status);

            // Throw on failure states
            if (task.status === 'failed') {
                throw new Error(`Tripo task failed: ${task.error || 'Unknown error'}`);
            }
            if (task.status === 'banned') {
                throw new Error('Tripo task was banned by content moderation');
            }
            if (task.status === 'expired') {
                throw new Error('Tripo task outputs have expired');
            }

            return task;
        }

        // Wait before next poll with exponential backoff
        await sleep(currentInterval);
        currentInterval = Math.min(
            currentInterval * config.backoffMultiplier,
            config.maxIntervalMs
        );
    }
}

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
