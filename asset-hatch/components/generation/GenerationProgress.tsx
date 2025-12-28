/**
 * GenerationProgress Component
 *
 * Right panel showing generation status, progress, and live updates.
 * Displays current asset being generated, progress bar, ETA, latest preview,
 * and a scrollable generation log.
 *
 * Features:
 * - Overall progress bar with percentage
 * - ETA calculation based on average generation time
 * - Current asset indicator with animation
 * - Latest completed asset preview
 * - Scrollable generation log (terminal-style)
 * - Error display with retry button
 */

'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useGenerationContext } from './GenerationQueue'
import { Button } from '@/components/ui/button'
import { AssetApprovalCard } from './AssetApprovalCard'
import type { GeneratedAssetResult, AssetGenerationState } from '@/lib/types/generation'
import type { ParsedAsset } from '@/lib/prompt-builder'

/**
 * Format duration in milliseconds to human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2m 30s", "45s", "< 1s")
 */
function formatETA(ms: number): string {
  if (ms < 1000) return '< 1s'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}


/**
 * GenerationProgress Component
 *
 * Displays real-time generation progress and status
 */
export function GenerationProgress() {
  // Get generation state from context
  const {
    status,
    currentAsset,
    failed,
    log,
    progress,
    regenerateAsset,
    assetStates,
    parsedAssets,
    approveAsset,
    rejectAsset,
    generateImage,
  } = useGenerationContext()

  // Track generation start time using ref (doesn't trigger re-renders)
  const startTimeRef = useRef<number | null>(null)

  // Track ETA in state (updated periodically via interval)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0)

  // Auto-scroll log to bottom
  const logContainerRef = useRef<HTMLDivElement>(null)

  /**
   * Compute latest completed asset from log (useMemo to avoid recalculating)
   */
  const latestAsset = useMemo<GeneratedAssetResult | null>(() => {
    // Find last successful generation in log
    const lastSuccess = [...log].reverse().find(entry =>
      entry.message.includes('✅ Generated') && entry.assetId
    )

    if (!lastSuccess || !lastSuccess.assetId) {
      return null
    }

    // TODO: Fetch asset data from API to get image URL
    // For now, return minimal data
    return {
      id: lastSuccess.assetId,
      imageUrl: '', // Will be populated from API
      prompt: '',
      metadata: {
        model: 'flux-2-dev',
        seed: 0,
        cost: 0,
        duration_ms: 0,
      },
    }
  }, [log])

  /**
   * Find assets awaiting approval
   */
  const assetsAwaitingApproval = useMemo(() => {
    const awaiting: Array<{ assetId: string; asset: ParsedAsset; state: AssetGenerationState }> = []

    assetStates.forEach((state, assetId) => {
      if (state.status === 'awaiting_approval') {
        const asset = parsedAssets.find(a => a.id === assetId)
        if (asset) {
          awaiting.push({ assetId, asset, state })
        }
      }
    })

    return awaiting
  }, [assetStates, parsedAssets])

  /**
   * Track start time and update ETA periodically
   *
   * Note: We intentionally use setState in this effect to subscribe to a timer interval,
   * which is a valid pattern for syncing with external systems (time-based updates).
   */
  useEffect(() => {
    // Set start time when generation begins
    if (status === 'generating' && !startTimeRef.current) {
      startTimeRef.current = Date.now()
    } else if (status === 'idle' || status === 'completed') {
      startTimeRef.current = null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstimatedTimeRemaining(0)
      return
    }

    // Update ETA every second during generation
    if (status === 'generating' && startTimeRef.current && progress.completed > 0) {
      const updateETA = () => {
        if (!startTimeRef.current) return

        const elapsed = Date.now() - startTimeRef.current
        const avgTimePerAsset = elapsed / progress.completed
        const remaining = (progress.total - progress.completed) * avgTimePerAsset
        setEstimatedTimeRemaining(remaining)
      }

      // Update immediately
      updateETA()

      // Then update every second
      const interval = setInterval(updateETA, 1000)
      return () => clearInterval(interval)
    }
  }, [status, progress.completed, progress.total])

  /**
   * Auto-scroll log to bottom when new entries added
   */
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [log])

  /**
   * Get progress bar color based on status
   */
  const getProgressBarClass = (): string => {
    if (failed.size > 0 && progress.completed === progress.total) {
      // Some failures but batch complete
      return 'bg-gradient-to-r from-yellow-500 to-orange-500'
    }
    if (status === 'paused') {
      return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
    if (status === 'completed' && failed.size === 0) {
      return 'bg-gradient-to-r from-green-400 to-emerald-500'
    }
    // Active generation - use aurora gradient
    return 'aurora-gradient'
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      {/* Progress bar section */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="font-semibold text-white/90">Generation Progress</span>
          <span className="text-white/70">
            {progress.percent.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressBarClass()}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-between items-center text-xs text-white/60 mt-2">
          <span>
            {progress.completed} / {progress.total} completed
            {progress.failed > 0 && (
              <span className="text-red-400 ml-2">
                • {progress.failed} failed
              </span>
            )}
          </span>

          {status === 'generating' && estimatedTimeRemaining > 0 && (
            <span>ETA: {formatETA(estimatedTimeRemaining)}</span>
          )}

          {status === 'paused' && (
            <span className="text-yellow-400">⏸ Paused</span>
          )}

          {status === 'completed' && (
            <span className="text-green-400">✓ Complete</span>
          )}
        </div>
      </div>

      {/* Current asset being generated */}
      {currentAsset && status === 'generating' && (
        <div className="glass-panel p-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span className="font-medium text-white/90">Generating...</span>
          </div>
          <p className="text-sm text-white/80">
            {currentAsset.name}
            {currentAsset.variant && (
              <span className="text-white/60"> • {currentAsset.variant.name}</span>
            )}
          </p>
        </div>
      )}

      {/* Assets awaiting approval - scrollable */}
      {assetsAwaitingApproval.length > 0 && (
        <div className="flex-1 overflow-y-auto mb-4 min-h-0">
          <div className="space-y-4">
            <h4 className="font-semibold text-white/90 sticky top-0 bg-black/40 backdrop-blur-sm py-2 z-10">
              Awaiting Approval
            </h4>
            {assetsAwaitingApproval.map(({ assetId, asset, result }) => (
              <AssetApprovalCard
                key={assetId}
                asset={asset}
                result={result}
                onApprove={() => approveAsset(assetId)}
                onReject={() => rejectAsset(assetId)}
                onRegenerate={() => generateImage(assetId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Latest completed asset preview */}
      {latestAsset && latestAsset.imageUrl && (
        <div className="glass-panel p-4 mb-4 flex-shrink-0">
          <h4 className="font-semibold text-white/90 mb-2">Latest Generation</h4>
          <div className="relative">
            <Image
              src={latestAsset.imageUrl}
              alt="Latest generated asset"
              width={400}
              height={400}
              className="w-full rounded border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Generation log (scrollable) */}
      <div className="flex-1 glass-panel p-3 overflow-hidden flex flex-col min-h-0">
        <h4 className="font-semibold text-white/90 mb-2 flex-shrink-0">
          Generation Log
        </h4>

        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto font-mono text-xs space-y-1 min-h-0"
        >
          {log.length === 0 ? (
            <div className="text-white/40 italic">
              No activity yet. Start generation to see logs.
            </div>
          ) : (
            log.map((entry, index) => {
              // Determine log entry color based on type
              let textColor = 'text-white/70'
              if (entry.message.includes('✅')) textColor = 'text-green-400'
              if (entry.message.includes('❌')) textColor = 'text-red-400'
              if (entry.message.includes('⏸')) textColor = 'text-yellow-400'
              if (entry.message.includes('▶')) textColor = 'text-purple-400'

              return (
                <div key={index} className={textColor}>
                  <span className="text-white/40">[{entry.timestamp}]</span>
                  {' '}
                  {entry.message}

                  {/* Show retry button for failed entries */}
                  {entry.message.includes('❌') && entry.assetId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-5 px-2 text-xs"
                      onClick={() => regenerateAsset(entry.assetId!)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Error summary (if batch completed with failures) */}
      {status === 'completed' && failed.size > 0 && (
        <div className="glass-panel bg-red-500/10 border-red-500/30 p-4 mt-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-300">
                Generation completed with {failed.size} error{failed.size > 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-white/80 mt-1">
                Check the log above for details. You can retry failed assets individually.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
