/**
 * Tripo3D API Client - Base HTTP Layer
 * 
 * Low-level HTTP client for Tripo3D API. Handles authentication,
 * request formatting, and error handling.
 * 
 * @see https://platform.tripo3d.ai/docs/introduction
 */

import type { TripoTask } from '@/lib/types/3d-generation';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Tripo3D API base URL
 */
const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';

/**
 * Get Tripo API key from environment or user-provided value
 * @param userApiKey - Optional user-provided API key (BYOK)
 * @returns API key to use
 * @throws Error if no API key available
 */
export function getTripoApiKey(userApiKey?: string): string {
    // Use user-provided key or fall back to environment variable
    const apiKey = userApiKey || process.env.TRIPO_API_KEY;

    // Validate API key exists
    if (!apiKey) {
        throw new Error(
            'TRIPO_API_KEY not configured. Please add it to .env.local or provide your own key.'
        );
    }

    return apiKey;
}

// =============================================================================
// HTTP Client
// =============================================================================

/**
 * Error response from Tripo API
 */
export interface TripoApiError {
    code: number;
    message: string;
}

/**
 * Wrapper response from Tripo API
 * All responses follow this structure
 */
export interface TripoApiResponse<T> {
    code: number;
    data: T;
}

/**
 * Make authenticated request to Tripo API
 * 
 * @param endpoint - API endpoint path (e.g., '/task')
 * @param options - Fetch options (method, body, etc.)
 * @param apiKey - API key to use for authentication
 * @returns Parsed response data
 * @throws Error if request fails or API returns error
 */
export async function tripoFetch<T>(
    endpoint: string,
    options: RequestInit,
    apiKey: string
): Promise<T> {
    // Build full URL
    const url = `${TRIPO_API_BASE}${endpoint}`;

    // Log request (without sensitive data)
    console.log('🔷 Tripo API Request:', {
        method: options.method || 'GET',
        endpoint,
    });

    // Make request with auth header
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    // Handle HTTP errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Tripo API HTTP error:', response.status, errorData);
        throw new Error(
            `Tripo API error ${response.status}: ${JSON.stringify(errorData)}`
        );
    }

    // Parse response
    const result = await response.json() as TripoApiResponse<T>;

    // Check for API-level errors (code !== 0 means error)
    if (result.code !== 0) {
        console.error('❌ Tripo API error response:', result);
        throw new Error(`Tripo API error code ${result.code}`);
    }

    console.log('✅ Tripo API success');
    return result.data;
}

// =============================================================================
// Task Creation Types
// =============================================================================

/**
 * Parameters for text-to-model task
 */
export interface TextToModelParams {
    type: 'text_to_model';
    prompt: string;
    // Optional: model_version, negative_prompt, etc.
}

/**
 * Parameters for rigging task
 */
export interface AnimateRigParams {
    type: 'animate_rig';
    // Task ID of the model to rig
    original_model_task_id: string;
}

/**
 * Parameters for animation retarget task
 */
export interface AnimateRetargetParams {
    type: 'animate_retarget';
    // Task ID of the rigged model
    original_model_task_id: string;
    // Animation preset to apply
    animation: string;
}

/**
 * Union of all task parameter types
 */
export type TripoTaskParams =
    | TextToModelParams
    | AnimateRigParams
    | AnimateRetargetParams;

/**
 * Create a new Tripo task
 * 
 * @param params - Task parameters including type
 * @param apiKey - API key for authentication
 * @returns Created task with task_id
 */
export async function createTripoTask(
    params: TripoTaskParams,
    apiKey: string
): Promise<TripoTask> {
    // Create task via POST /task
    const task = await tripoFetch<TripoTask>(
        '/task',
        {
            method: 'POST',
            body: JSON.stringify(params),
        },
        apiKey
    );

    console.log('📦 Tripo task created:', {
        taskId: task.task_id,
        type: task.type,
        status: task.status,
    });

    return task;
}

/**
 * Get current status of a Tripo task
 * 
 * @param taskId - Task ID to check
 * @param apiKey - API key for authentication
 * @returns Current task state
 */
export async function getTripoTaskStatus(
    taskId: string,
    apiKey: string
): Promise<TripoTask> {
    // Get task status via GET /task/{taskId}
    const task = await tripoFetch<TripoTask>(
        `/task/${taskId}`,
        { method: 'GET' },
        apiKey
    );

    return task;
}
