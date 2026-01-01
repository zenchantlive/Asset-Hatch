/**
 * useAssetGeneration Hook
 * 
 * Manages single asset generation with error handling and status tracking.
 * This hook encapsulates the logic for calling the /api/generate endpoint
 * and managing the lifecycle of a single generation request.
 * 
 * @param projectId - The ID of the current project
 * @returns Object with generate function and current state
 */

import { useState } from 'react'
import type { ParsedAsset } from '@/lib/prompt-builder'
import type { GenerationStatus, GeneratedAssetResult } from '@/lib/types/generation'

/**
 * Return type for the useAssetGeneration hook
 */
interface UseAssetGenerationReturn {
  generate: (
    asset: ParsedAsset,
    modelKey?: string,
    customPrompt?: string,
    options?: {
      onSyncStart?: () => void
      onSyncComplete?: (cost: number) => void
      onSyncError?: (error: Error) => void
    }
  ) => Promise<GeneratedAssetResult>
  status: GenerationStatus
  result: GeneratedAssetResult | null
  error: Error | null
  isSyncingCost: boolean // New: tracks background cost fetch
  syncError: Error | null // New: tracks cost sync error
}

export function useAssetGeneration(projectId: string): UseAssetGenerationReturn {
  // Track the current generation status (idle, generating, success, error)
  const [status, setStatus] = useState<GenerationStatus>('idle')

  // Store the successful generation result
  const [result, setResult] = useState<GeneratedAssetResult | null>(null)

  // Store any error that occurred during generation
  const [error, setError] = useState<Error | null>(null)

  // Track if we are currently fetching actual cost in the background
  const [isSyncingCost, setIsSyncingCost] = useState(false)

  // Track any error during cost sync
  const [syncError, setSyncError] = useState<Error | null>(null)

  /**
   * Generate a single asset
   *
   * Calls the /api/generate endpoint with the parsed asset data
   * and handles the full lifecycle: request → response → state updates
   *
   * @param asset - The parsed asset to generate
   * @param customPrompt - Optional custom prompt to use instead of auto-generated
   * @param options - Optional callbacks for background sync and modelKey override
   * @returns Promise resolving to the generated asset result
   * @throws Error if generation fails
   */
  const generate = async (
    asset: ParsedAsset,
    modelKeyParam?: string, // Renamed to avoid conflict with internal const
    customPrompt?: string,
    generationOptions?: {
      onSyncStart?: () => void
      onSyncComplete?: (cost: number) => void
      onSyncError?: (error: Error) => void
    }
  ): Promise<GeneratedAssetResult> => {
    // Reset error state from any previous attempts
    setError(null)
    setSyncError(null)

    // Mark as generating
    setStatus('generating')

    try {
      // Call the generation API endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          asset,
          modelKey: modelKeyParam || 'black-forest-labs/flux.2-pro',
          customPrompt, // Include custom prompt if provided
        }),
      })

      // Check if the request was successful
      if (!response.ok) {
        // Extract error message from response if available
        const errorData = await response.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Generation failed`)
      }

      // Parse the successful response
      const data = await response.json()

      // Ensure the response has the expected structure
      if (!data.success || !data.asset) {
        throw new Error('Invalid response format from generation API')
      }

      // Store the result and mark as successful
      setResult(data.asset)
      setStatus('success')

      // Trigger actual cost sync in the background
      if (data.asset.metadata?.generation_id) {
        setIsSyncingCost(true)
        generationOptions?.onSyncStart?.()
        fetch('/api/generation/sync-cost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            generation_id: data.asset.metadata.generation_id,
            projectId,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              const syncData = await res.json()
              // Update the result with the actual cost if it changed
              if (syncData.success && syncData.cost) {
                const actualCost = syncData.cost.totalCost
                generationOptions?.onSyncComplete?.(actualCost)
                setResult(prev => prev ? {
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    cost: actualCost
                  }
                } : null)
              }
            }
          })
          .catch((err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            console.error('💰 Cost Sync Error:', error)
            setSyncError(error)
            generationOptions?.onSyncError?.(error)
          })
          .finally(() => setIsSyncingCost(false))
      }

      // Return the generated asset for chaining
      return data.asset
    } catch (err) {
      // Type-safe error handling
      const errorObject = err instanceof Error ? err : new Error(String(err))

      // Store the error and mark status
      setError(errorObject)
      setStatus('error')

      // Re-throw to allow caller to handle
      throw errorObject
    }
  }

  // Return the hook's public interface
  return {
    generate,
    status,
    result,
    error,
    isSyncingCost,
    syncError,
  }
}
