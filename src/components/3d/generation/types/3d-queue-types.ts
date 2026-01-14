/**
 * Type definitions for 3D Generation Queue
 *
 * This file centralizes all types used in the 3D generation UI components.
 * Types are extracted from GenerationQueue3D to keep components focused.
 *
 * @see GenerationQueue3D.tsx for usage
 * @see lib/types/3d-generation.ts for Tripo API types
 */

import type { AnimationPreset } from "@/lib/types/3d-generation";

// =============================================================================
// Asset Status Types
// =============================================================================

/**
 * Status of a 3D asset through its generation lifecycle.
 * Each status represents a stage in the Tripo3D pipeline.
 *
 * Flow: ready → generating → generated → [rigging → rigged] → [animating → complete]
 *              ↘ failed (can occur at any stage)
 */
export type Asset3DStatus =
    | "ready"       // Ready to start generation
    | "generating"  // Tripo text_to_model task in progress
    | "generated"   // Draft model complete, ready for rigging
    | "rigging"     // Tripo animate_rig task in progress
    | "rigged"      // Rigging complete, ready for animation
    | "animating"   // Tripo animate_retarget task(s) in progress
    | "complete"    // All requested processing completed
    | "failed";     // Error occurred at any stage

/**
 * Approval status for generated 3D assets.
 * Mirrors the 2D workflow for user approval before export.
 */
export type ApprovalStatus =
    | "pending"    // Awaiting user review
    | "approved"   // User approved for export
    | "rejected";  // User rejected, needs regeneration

// =============================================================================
// Asset State Types
// =============================================================================

/**
 * Complete state for a single 3D asset during generation.
 * Tracks task IDs, model URLs, and status through the pipeline.
 */
export interface Asset3DState {
    // Current status in the generation pipeline
    status: Asset3DStatus;

    // Progress percentage (0-100) during active generation
    progress: number;

    // Tripo task IDs for each pipeline stage
    draftTaskId?: string;
    rigTaskId?: string;
    // Map of animation preset to task ID: { "preset:walk": "task-123" }
    animationTaskIds?: Record<string, string>;

    // Model URLs populated as each stage completes
    draftModelUrl?: string;
    riggedModelUrl?: string;
    // Map of animation preset to animated model URL
    animatedModelUrls?: Record<string, string>;

    // Approval status for user workflow
    approvalStatus?: ApprovalStatus;

    // Error message if status is "failed"
    error?: string;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for the GenerationQueue3D container component.
 */
export interface GenerationQueue3DProps {
    // Project ID to load plan and generate assets for
    projectId: string;
}

/**
 * Props for the AssetTree3D component.
 * Displays the collapsible tree of assets grouped by category.
 */
export interface AssetTree3DProps {
    // Assets grouped by category name
    assetsByCategory: Record<string, Asset3DItem[]>;
    // Currently selected asset ID
    selectedAssetId: string | null;
    // Callback when user selects an asset
    onSelectAsset: (assetId: string) => void;
    // Set of collapsed category names
    collapsedCategories: Set<string>;
    // Callback when user toggles category collapse
    onToggleCategory: (category: string) => void;
    // Current state of each asset (for status badges)
    assetStates: Map<string, Asset3DState>;
}

/**
 * Props for the AssetDetailPanel3D component.
 * Shows the selected asset's 3D viewer and metadata.
 */
export interface AssetDetailPanel3DProps {
    // Currently selected asset data
    asset: Asset3DItem;
    // Current state of the selected asset
    assetState: Asset3DState;
    // Whether an action is currently in progress
    isProcessing: boolean;
}

/**
 * Props for the AssetActions3D component.
 * Provides action buttons based on asset state.
 */
export interface AssetActions3DProps {
    // Currently selected asset data
    asset: Asset3DItem;
    // Current state of the selected asset
    assetState: Asset3DState;
    // Selected animations to apply
    selectedAnimations: Set<AnimationPreset>;
    // Callbacks for each action
    onGenerate: () => void;
    onRig: () => void;
    onAnimate: () => void;
    onToggleAnimation: (preset: AnimationPreset) => void;
    onApprove: () => void;
    onReject: () => void;
    onRegenerate: () => void;
}

/**
 * Props for the Asset3DApprovalCard component.
 * Shows generated asset with approval controls.
 */
export interface Asset3DApprovalCardProps {
    // Asset metadata from parsed plan
    asset: Asset3DItem;
    // URL to the model for preview
    modelUrl: string;
    // Prompt used to generate the model
    promptUsed: string;
    // Callbacks for approval actions
    onApprove: () => void;
    onReject: () => void;
    onRegenerate: () => void;
}

// =============================================================================
// Data Types
// =============================================================================

/**
 * Parsed 3D asset item from plan.
 * Simplified interface for UI components (mirrors Parsed3DAsset).
 */
export interface Asset3DItem {
    // Unique identifier for this asset
    id: string;
    // Display name of the asset
    name: string;
    // Category for grouping (Characters, Environment, Props)
    category: string;
    // Full description for prompt generation
    description: string;
    // Whether this asset requires rigging
    shouldRig: boolean;
    // Animation presets requested (if rigging)
    animations?: AnimationPreset[];
    // Project ID for linkage (optional, used for skybox)
    projectId?: string;
}

/**
 * Category icon mapping type.
 * Maps category names to Lucide icon components.
 */
export type CategoryIconMap = Record<string, React.ElementType>;

// =============================================================================
// Animation Playback Types
// =============================================================================

/**
 * Animation state for playback tracking in AnimatedModelViewer.
 * Passed to parent component via callback for UI controls.
 */
export interface AnimationState {
    // Whether an animation is currently playing
    isPlaying: boolean;
    // Names of all available animations in the GLB
    animationNames: string[];
    // Name of currently playing animation
    currentAnimation: string | null;
    // Current progress (0-1) through the animation
    progress: number;
    // Total duration of current animation in seconds
    duration: number;
}
