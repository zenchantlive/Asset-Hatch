/**
 * useBatchGeneration Hook
 * 
 * Manages batch generation of multiple assets with queue management,
 * pause/resume capability, and comprehensive error tracking.
 * 
 * This is the core orchestration logic for the generation queue UI,
 * coordinating sequential generation of assets while providing
 * real-time progress updates and error recovery.
 * 
 * @param projectId - The ID of the current project
 * @returns Object with batch control functions and state
 */

import { useState, useCallback, useRef } from 'react'
import { useAssetGeneration } from './useAssetGeneration'
import type { ParsedAsset } from '@/lib/prompt-builder'
import type { BatchStatus, BatchProgress, GeneratedAssetResult } from '@/lib/types/generation'

/**
 * Callbacks for tracking individual asset generation lifecycle
 */
interface BatchGenerationCallbacks {
  /** Called when an asset starts generating */
  onAssetStart?: (assetId: string) => void
  /** Called when an asset completes successfully */
  onAssetComplete?: (assetId: string, result: GeneratedAssetResult) => void
  /** Called when an asset generation fails */
  onAssetError?: (assetId: string, error: Error) => void
}

/**
 * Return type for the useBatchGeneration hook
 */
interface UseBatchGenerationReturn {
  // Control functions
  startBatch: (
    assets: ParsedAsset[],
    modelKey?: string,
    customPrompts?: Map<string, string>,
    callbacks?: BatchGenerationCallbacks
  ) => Promise<void>
  pause: () => void
  resume: () => void
  retryFailed: (modelKey?: string) => Promise<void>

  // State
  status: BatchStatus
  queue: ParsedAsset[]
  currentAsset: ParsedAsset | null
  completed: Set<string>
  failed: Map<string, Error>
  progress: BatchProgress
}

export function useBatchGeneration(projectId: string): UseBatchGenerationReturn {
  // Core state for the generation queue
  const [queue, setQueue] = useState<ParsedAsset[]>([])
  const [status, setStatus] = useState<BatchStatus>('idle')
  const [currentAsset, setCurrentAsset] = useState<ParsedAsset | null>(null)

  // Track completed and failed assets by ID
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [failed, setFailed] = useState<Map<string, Error>>(new Map())

  // Pause control - using ref to avoid stale closure issues
  const isPausedRef = useRef(false)

  // Get the single asset generation function
  const { generate } = useAssetGeneration(projectId)

  /**
   * Calculate current progress metrics
   * Used for display in UI (progress bar, counters, etc.)
   */
  const progress: BatchProgress = {
    total: queue.length,
    completed: completed.size,
    failed: failed.size,
    // Prevent division by zero
    percent: queue.length > 0 ? (completed.size / queue.length) * 100 : 0,
  }

  /**
   * Start batch generation for a list of assets
   *
   * Processes assets sequentially (not parallel) to avoid overwhelming
   * the API and to provide predictable progress updates.
   *
   * @param assets - Array of parsed assets to generate
   * @param modelKey - Optional model override for all assets
   * @param customPrompts - Optional map of custom prompts (assetId → prompt)
   * @param callbacks - Optional lifecycle callbacks for tracking individual asset state
   */
  const startBatch = useCallback(async (
    assets: ParsedAsset[],
    modelKey: string = 'flux-2-dev',
    customPrompts?: Map<string, string>,
    callbacks?: BatchGenerationCallbacks
  ): Promise<void> => {
    // Initialize state for new batch
    setQueue(assets)
    setStatus('generating')
    setCompleted(new Set())
    setFailed(new Map())
    isPausedRef.current = false

    // Process each asset sequentially
    for (const asset of assets) {
      // Check pause state before each generation
      // Use a polling loop to wait for resume
      while (isPausedRef.current) {
        // Check every 100ms if pause has been lifted
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Update UI to show current asset
      setCurrentAsset(asset)

      // Notify parent that this asset is starting
      callbacks?.onAssetStart?.(asset.id)

      try {
        // Use custom prompt if available, otherwise generate will build default
        const customPrompt = customPrompts?.get(asset.id)

        // Attempt to generate this asset with optional custom prompt
        const result = await generate(asset, modelKey, customPrompt)

        // Mark as completed on success
        setCompleted(prev => {
          const next = new Set(prev)
          next.add(asset.id)
          return next
        })

        // Notify parent of successful completion with result
        callbacks?.onAssetComplete?.(asset.id, result)
      } catch (err) {
        // Type-safe error handling
        const error = err instanceof Error ? err : new Error(String(err))

        // Track this failure for potential retry
        setFailed(prev => {
          const next = new Map(prev)
          next.set(asset.id, error)
          return next
        })

        // Log error for debugging
        console.error(`Failed to generate asset ${asset.id}:`, error)

        // Notify parent of failure
        callbacks?.onAssetError?.(asset.id, error)

        // Continue to next asset despite failure
        // (Don't break the batch - user can retry failed ones)
      }
    }

    // Batch complete (either all succeeded or some failed)
    setStatus('completed')
    setCurrentAsset(null)
  }, [generate])

  /**
   * Pause the current batch generation
   * 
   * Sets a flag that will be checked before starting each asset.
   * The current asset will complete before pausing takes effect.
   */
  const pause = useCallback(() => {
    isPausedRef.current = true
    setStatus('paused')
  }, [])

  /**
   * Resume a paused batch generation
   * 
   * Clears the pause flag, allowing the batch loop to continue
   * with the next asset in the queue.
   */
  const resume = useCallback(() => {
    isPausedRef.current = false
    setStatus('generating')
  }, [])

  /**
   * Retry all failed assets
   * 
   * Creates a new batch containing only the previously failed assets,
   * clearing their error state and attempting generation again.
   * 
   * @param modelKey - Optional model override for retry attempts
   */
  const retryFailed = useCallback(async (modelKey?: string): Promise<void> => {
    // Extract only the failed assets from the original queue
    const failedAssets = queue.filter(asset => failed.has(asset.id))

    // Clear failure state for retry
    setFailed(new Map())

    // Start a new batch with just the failed assets
    await startBatch(failedAssets, modelKey)
  }, [queue, failed, startBatch])

  // Return the hook's public interface
  return {
    startBatch,
    pause,
    resume,
    retryFailed,
    status,
    queue,
    currentAsset,
    completed,
    failed,
    progress,
  }
}
