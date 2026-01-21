/**
 * Tripo3D API Client for Asset Hatch
 *
 * Handles all interactions with Tripo's 3D generation API including:
 * - Task submission (text_to_model, animate_rig, animate_retarget)
 * - Status polling with progress tracking
 * - Error handling and retry logic
 *
 * @see https://platform.tripo3d.ai/docs for API documentation
 * @see lib/types/3d-generation.ts for type definitions
 */

import type {
  TripoTask,
  TripoTaskType,
  AnimationPreset,
} from '@/lib/types/3d-generation';

// Tripo3D API base endpoint
const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi/task';

/**
 * Request body for task submission
 * Different task types require different fields
 */
export interface TripoTaskRequest {
  // Task type (text_to_model, animate_rig, animate_retarget)
  type: TripoTaskType;
  // Text prompt for text_to_model
  prompt?: string;
  // Model URL for rigging/animation tasks (legacy, may not work for all tasks)
  model_url?: string;
  // Original model task ID for rigging/animation tasks (required for animate_rig)
  original_model_task_id?: string;
  // Animation preset for animate_retarget
  animation?: AnimationPreset;
}

/**
 * Submit a new task to Tripo3D API
 *
 * Creates a new generation, rigging, or animation task and returns the task ID.
 * The task will be queued and must be polled for status updates.
 *
 * @param apiKey - Tripo API key (starts with "tsk_")
 * @param request - Task request parameters
 * @returns Promise resolving to the created task
 * @throws Error if API key is invalid or request fails
 *
 * @example
 * ```typescript
 * const task = await submitTripoTask(apiKey, {
 *   type: 'text_to_model',
 *   prompt: 'a low poly knight character in T-pose'
 * });
 * console.log('Task ID:', task.task_id);
 * ```
 */
export async function submitTripoTask(
  apiKey: string,
  request: TripoTaskRequest
): Promise<TripoTask> {
  // Validate API key format (Tripo keys start with "tsk_")
  if (!apiKey || !apiKey.startsWith('tsk_')) {
    throw new Error('Invalid Tripo API key format (must start with "tsk_")');
  }

  console.log('🎨 Submitting Tripo task:', {
    type: request.type,
    hasPrompt: !!request.prompt,
    hasModelUrl: !!request.model_url,
    keyLength: apiKey.length,
    keyPrefix: apiKey.slice(0, 8),
    keySuffix: apiKey.slice(-4),
    hasWhitespace: apiKey !== apiKey.trim(),
  });

  // Call Tripo API
  const response = await fetch(TRIPO_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Handle API errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Tripo API error:', response.status, errorData);
    throw new Error(`Tripo error ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const responseData = await response.json();

  // Unwrap the data field from Tripo API response wrapper
  // Tripo returns: { code: 0, data: { task_id, status, ... } }
  const taskData = responseData.data || responseData;

  console.log('✅ Task submitted:', taskData.task_id);

  return taskData as TripoTask;
}

/**
 * Poll the status of a Tripo task
 *
 * Queries the Tripo API for the current status, progress, and output of a task.
 * Should be called periodically until status is 'success' or 'failed'.
 *
 * Recommended polling strategy:
 * - Poll every 2 seconds for first 10 seconds
 * - Then every 5 seconds until complete
 * - Max total wait time: 120 seconds
 *
 * @param apiKey - Tripo API key (starts with "tsk_")
 * @param taskId - Tripo task ID to check
 * @returns Promise resolving to the task status
 * @throws Error if API key is invalid or request fails
 *
 * @example
 * ```typescript
 * const status = await pollTripoTaskStatus(apiKey, 'tripo-task-123');
 * if (status.status === 'success') {
 *   console.log('Model URL:', status.output?.model?.url);
 * }
 * ```
 */
export async function pollTripoTaskStatus(
  apiKey: string,
  taskId: string
): Promise<TripoTask> {
  // Validate API key format (Tripo keys start with "tsk_")
  if (!apiKey || !apiKey.startsWith('tsk_')) {
    throw new Error('Invalid Tripo API key format (must start with "tsk_")');
  }

  // Call Tripo API to check status
  const response = await fetch(`${TRIPO_API_BASE}/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle API errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Tripo status error:', response.status, errorData);
    throw new Error(`Tripo error ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const responseData = await response.json();

  // Unwrap the data field from Tripo API response wrapper
  const taskData = responseData.data || responseData;

  console.log('📊 Task status:', {
    taskId,
    status: taskData.status,
    progress: taskData.progress,
  });

  return taskData as TripoTask;
}

/**
 * Download a 3D model file from a Tripo URL
 *
 * Fetches the GLB file from Tripo's CDN and returns it as a Buffer.
 * Used for optional local caching or processing of generated models.
 *
 * Note: Current architecture stores URLs only, not binary files.
 * This function is provided for future enhancements (Phase 4).
 *
 * @param url - Full URL to the model file (from task output)
 * @returns Promise resolving to the model file buffer
 * @throws Error if download fails
 *
 * @example
 * ```typescript
 * const modelBuffer = await downloadModelFile(task.output.model.url);
 * // Save to S3, local disk, etc.
 * ```
 */
export async function downloadModelFile(url: string): Promise<Buffer> {
  console.log('📥 Downloading model from:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log('✅ Model downloaded:', buffer.length, 'bytes');

  return buffer;
}
