/**
 * Type definitions for the Asset Generation system
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the generation queue UI, ensuring type safety and code reusability.
 */

import type { ParsedAsset } from '@/lib/prompt-builder'

/**
 * Status of a single asset generation task
 * - idle: Not yet started
 * - generating: Currently being generated
 * - success: Successfully generated
 * - error: Generation failed
 */
export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'

/**
 * Batch generation status
 * - idle: No batch generation in progress
 * - generating: Batch generation active
 * - paused: User paused the batch
 * - completed: All assets processed
 */
export type BatchStatus = 'idle' | 'generating' | 'paused' | 'completed'

/**
 * Result from a successful asset generation
 * Returned by the /api/generate endpoint
 */
export interface GeneratedAssetResult {
  id: string
  imageUrl: string        // Data URL for immediate display
  prompt: string          // Actual prompt used
  metadata: {
    model: string
    seed: number
    cost: number // Estimated or actual cost
    duration_ms: number
    generationId?: string // For actual cost lookup
  }
}

/**
 * Error information for failed generations
 * Provides context for debugging and user feedback
 */
export interface GenerationError {
  assetId: string
  message: string
  timestamp: Date
}

/**
 * Item in the generation queue
 * Tracks asset state throughout the generation process
 */
export interface QueueItem {
  asset: ParsedAsset
  status: GenerationStatus
  result: GeneratedAssetResult | null
  error: Error | null
  customPrompt: string | null  // User-edited prompt override
}

/**
 * Progress tracking for batch operations
 * Used to display overall completion status
 */
export interface BatchProgress {
  total: number
  completed: number
  failed: number
  percent: number
}

/**
 * Log entry for the generation console
 * Provides detailed timeline of generation events
 */
export interface GenerationLogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error'
  message: string
  assetId?: string // Optional asset ID for asset-specific logs
}

/**
 * Props for the main GenerationQueue component
 */
export interface GenerationQueueProps {
  projectId: string
}

/**
 * State for individual asset generation lifecycle
 * Now includes version carousel support
 */
export type AssetGenerationState =
  | { status: 'pending' } // Not started
  | { status: 'generating'; progress?: number } // In progress
  | {
    status: 'awaiting_approval';
    result: GeneratedAssetResult;
    versions?: import('@/lib/client-db').AssetVersion[]; // All versions for carousel
    currentVersionIndex?: number; // Currently displayed version
  } // Needs approval
  | {
    status: 'approved';
    result: GeneratedAssetResult;
    versions?: import('@/lib/client-db').AssetVersion[];
    currentVersionIndex?: number;
  } // Saved to DB
  | { status: 'rejected' } // User rejected
  | { status: 'error'; error: Error } // Failed

/**
 * Context value for the Generation Provider
 * Manages global generation state across all components
 */
export interface GenerationContextValue {
  // State
  parsedAssets: ParsedAsset[]
  queue: QueueItem[]
  status: BatchStatus
  currentAsset: ParsedAsset | null
  completed: Set<string>
  failed: Map<string, Error>
  log: GenerationLogEntry[]
  // Selected model ID from model registry (e.g., 'google/gemini-2.5-flash-image')
  selectedModel: string

  // Prompt generation state
  generatedPrompts: Map<string, string>

  // Individual asset generation state
  assetStates: Map<string, AssetGenerationState>

  // Actions
  generatePrompt: (asset: ParsedAsset) => Promise<string>
  generateImage: (assetId: string, providedAsset?: ParsedAsset) => Promise<void>
  approveAsset: (assetId: string, version: import('@/lib/client-db').AssetVersion) => Promise<void>
  rejectAsset: (assetId: string, versionId: string) => void
  startGeneration: (selectedIds?: Set<string>) => Promise<void>
  pauseGeneration: () => void
  resumeGeneration: () => void
  regenerateAsset: (assetId: string) => Promise<void>
  updatePrompt: (assetId: string, customPrompt: string) => void
  // Set selected model ID from registry
  setSelectedModel: (modelId: string) => void
  // Update current version index for an asset
  updateVersionIndex: (assetId: string, index: number) => void
  // Add a new asset to the parsed assets array (for direction children, etc.)
  addAsset: (asset: ParsedAsset) => void

  // Progress
  progress: BatchProgress
  // Sync status
  isSyncingCost: boolean
  syncErrors: Record<string, Error | null> // assetId -> Error
}
