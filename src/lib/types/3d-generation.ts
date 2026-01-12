/**
 * Type definitions for 3D Asset Generation using Tripo3D API
 * 
 * This file contains all TypeScript interfaces and types for the 3D
 * generation workflow including Tripo API integration, task management,
 * and 3D asset state tracking.
 * 
 * @see https://platform.tripo3d.ai/docs/introduction for Tripo3D API docs
 */

// =============================================================================
// Tripo3D API Types
// =============================================================================

/**
 * Task types supported by Tripo3D API
 * Each corresponds to a specific step in the 3D generation pipeline
 * 
 * - text_to_model: Generate mesh from text prompt
 * - image_to_model: Generate mesh from reference image
 * - refine_model: High-quality mesh refinement (uses more credits)
 * - skeleton_prerig_check: Check if mesh can be rigged
 * - animate_rig: Auto-rig a mesh with humanoid skeleton
 * - animate_retarget: Apply preset animation to rigged mesh
 */
export type TripoTaskType =
    | 'text_to_model'
    | 'image_to_model'
    | 'refine_model'
    | 'skeleton_prerig_check'
    | 'animate_rig'
    | 'animate_retarget';

/**
 * Task status returned by Tripo3D API
 * 
 * - queued: Task submitted, waiting to be processed
 * - running: Task is actively being processed
 * - success: Task completed successfully, outputs available
 * - failed: Task failed, check error message
 * - banned: Task rejected by moderation
 * - expired: Task output URLs have expired (typically 24 hours)
 */
export type TripoTaskStatus =
    | 'queued'
    | 'running'
    | 'success'
    | 'failed'
    | 'banned'
    | 'expired';

/**
 * Model output from a successful Tripo task
 * Contains URL to download the 3D model file
 */
export interface TripoModelOutput {
    // URL to the model file (GLB format)
    url: string;
    // File format type
    type: 'glb';
}

/**
 * Texture map output from refined models
 * Contains URL to download texture file
 */
export interface TripoTextureOutput {
    // URL to the texture image
    url: string;
}

/**
 * Complete task output structure from Tripo3D API
 * Different task types populate different fields
 */
export interface TripoTaskOutput {
    // Draft model output (text_to_model, image_to_model)
    model?: TripoModelOutput;
    // PBR-textured model (refine_model)
    pbr_model?: TripoModelOutput;
    // Rendered preview image
    rendered_image?: { url: string };
    // PBR texture maps (refine_model)
    base_color_map?: TripoTextureOutput;
    metallic_map?: TripoTextureOutput;
    roughness_map?: TripoTextureOutput;
    normal_map?: TripoTextureOutput;
}

/**
 * Complete Tripo task response
 * Returned by both task creation and status endpoints
 */
export interface TripoTask {
    // Unique task identifier
    task_id: string;
    // Type of task
    type: TripoTaskType;
    // Current status
    status: TripoTaskStatus;
    // Progress percentage (0-100) when running
    progress?: number;
    // Output data when status is 'success'
    output?: TripoTaskOutput;
    // Error message when status is 'failed'
    error?: string;
    // Timestamp when task was created
    create_time?: number;
}

// =============================================================================
// Animation Types
// =============================================================================

/**
 * Available animation presets from Tripo3D
 * These are retargetable motion capture animations
 */
export type AnimationPreset =
    | 'preset:idle'
    | 'preset:walk'
    | 'preset:run'
    | 'preset:jump'
    | 'preset:climb'
    | 'preset:dive';

/**
 * All available animation preset names for UI display
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
    'preset:idle',
    'preset:walk',
    'preset:run',
    'preset:jump',
    'preset:climb',
    'preset:dive',
];

/**
 * Human-readable labels for animation presets
 */
export const ANIMATION_PRESET_LABELS: Record<AnimationPreset, string> = {
    'preset:idle': 'Idle',
    'preset:walk': 'Walk',
    'preset:run': 'Run',
    'preset:jump': 'Jump',
    'preset:climb': 'Climb',
    'preset:dive': 'Dive',
};

// =============================================================================
// 3D Asset Types
// =============================================================================

/**
 * Status of a 3D asset through its generation lifecycle
 * 
 * - queued: Waiting to start generation
 * - generating: Draft mesh being created
 * - generated: Draft mesh complete, ready for rigging
 * - rigging: Auto-rig in progress
 * - rigged: Rigging complete, ready for animation
 * - animating: Applying animation preset(s)
 * - complete: All requested processing done
 * - failed: Error occurred during any stage
 */
export type Generated3DAssetStatus =
    | 'queued'
    | 'generating'
    | 'generated'
    | 'rigging'
    | 'rigged'
    | 'animating'
    | 'complete'
    | 'failed';

/**
 * Complete 3D asset record with all task chain information
 * Tracks the entire generation pipeline from text to animated model
 */
export interface Generated3DAsset {
    // Unique identifier for this generated asset
    id: string;
    // Parent project ID
    project_id: string;
    // Original asset ID from plan
    asset_id: string;
    // Current status in the generation pipeline
    status: Generated3DAssetStatus;

    // Task chain IDs - each step creates a new Tripo task
    draft_task_id?: string;
    refine_task_id?: string;
    rig_task_id?: string;
    // Map of animation preset to task ID: { "preset:walk": "task-123" }
    animation_task_ids?: Record<string, string>;

    // Model URLs - populated as each task completes
    draft_model_url?: string;
    refined_model_url?: string;
    rigged_model_url?: string;
    // Map of animation preset to model URL
    animated_model_urls?: Record<string, string>;

    // Generation metadata
    prompt_used: string;
    is_riggable?: boolean;
    animations_applied?: AnimationPreset[];
    error_message?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// =============================================================================
// Quality & Configuration Types
// =============================================================================

/**
 * Visual style options for 3D mesh generation
 * Affects the output aesthetic of generated models
 */
export type Mesh3DStyle =
    | 'realistic'
    | 'stylized'
    | 'low_poly'
    | 'voxel';

/**
 * Texture quality options
 * Higher quality uses more credits and processing time
 */
export type Texture3DQuality =
    | 'draft'    // Quick preview quality
    | 'standard' // Normal quality for most uses
    | 'high';    // Maximum detail (requires refine step)

/**
 * Quality configuration for 3D asset generation
 * Used when creating generation requests
 */
export interface Mesh3DQuality {
    // Visual style of the mesh
    mesh_style: Mesh3DStyle;
    // Texture quality level
    texture_quality: Texture3DQuality;
    // Whether to auto-rig after generation
    should_rig: boolean;
    // Which animations to apply (if rigging)
    animations_requested: AnimationPreset[];
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request body for POST /api/generate-3d
 */
export interface Generate3DRequest {
    // Project containing this asset
    projectId: string;
    // Asset ID from the plan
    assetId: string;
    // Text prompt for model generation
    prompt: string;
    // Whether to automatically rig after generation
    shouldRig?: boolean;
    // Animations to apply if rigging
    animations?: AnimationPreset[];
}

/**
 * Response from POST /api/generate-3d
 */
export interface Generate3DResponse {
    // Tripo task ID for polling
    taskId: string;
    // Initial status (always 'queued')
    status: TripoTaskStatus;
}

/**
 * Response from GET /api/generate-3d/[taskId]/status
 */
export interface TaskStatusResponse {
    // Task ID
    taskId: string;
    // Current task status
    status: TripoTaskStatus;
    // Progress percentage when running
    progress?: number;
    // Output URLs when complete
    output?: TripoTaskOutput;
    // Error message if failed
    error?: string;
}
