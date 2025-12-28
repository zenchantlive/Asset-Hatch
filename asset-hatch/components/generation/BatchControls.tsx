/**
 * BatchControls Component
 * 
 * Toolbar for batch generation controls and settings.
 * Provides the main actions for starting, pausing, and configuring generation.
 * 
 * Features:
 * - "Generate All" button (primary CTA)
 * - Pause/Resume buttons (shown during generation)
 * - "Regenerate Failed" button (shown when failures exist)
 * - Model selector (Flux.2 Dev vs Pro)
 * - Progress indicator showing completion count
 */

'use client'

import { Sparkles, Pause, Play, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGenerationContext } from './GenerationQueue'

/**
 * BatchControls Component
 * 
 * Main toolbar for generation controls
 */
export function BatchControls() {
  const {
    status,
    progress,
    failed,
    selectedModel,
    setSelectedModel,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
  } = useGenerationContext()

  // Calculate counts
  const pendingCount = progress.total - progress.completed - progress.failed
  const hasFailures = failed.size > 0

  /**
   * Handle Generate All button click
   * Starts batch generation for all pending assets
   */
  const handleGenerateAll = async () => {
    await startGeneration()
  }

  /**
   * Handle Pause button click
   * Pauses the current batch generation
   */
  const handlePause = () => {
    pauseGeneration()
  }

  /**
   * Handle Resume button click
   * Resumes a paused batch generation
   */
  const handleResume = () => {
    resumeGeneration()
  }

  return (
    <div className="glass-panel p-4 m-4 flex items-center justify-between gap-4">
      {/* Left side: Action buttons */}
      <div className="flex items-center gap-3">
        {/* Generate All button */}
        {(status === 'idle' || status === 'completed') && pendingCount > 0 && (
          <Button
            className="aurora-gradient font-semibold"
            onClick={handleGenerateAll}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate All ({pendingCount})
          </Button>
        )}

        {/* Pause button (shown during generation) */}
        {status === 'generating' && (
          <Button variant="outline" onClick={handlePause}>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        )}

        {/* Resume button (shown when paused) */}
        {status === 'paused' && (
          <Button variant="outline" onClick={handleResume} className="aurora-gradient">
            <Play className="w-4 h-4 mr-2" />
            Resume
          </Button>
        )}

        {/* Progress indicator (shown during generation) */}
        {status === 'generating' && (
          <span className="text-sm text-white/80 font-medium">
            {progress.completed} / {progress.total} completed
          </span>
        )}

        {/* Failed assets indicator */}
        {hasFailures && (
          <Button variant="destructive" size="sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {failed.size} Failed
          </Button>
        )}
      </div>

      {/* Right side: Model selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Model:</span>
        <Select
          value={selectedModel}
          onValueChange={(value: 'flux-2-dev' | 'flux-2-pro') => setSelectedModel(value)}
          disabled={status === 'generating'}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flux-2-dev">
              <div className="flex flex-col items-start">
                <span className="font-medium">Flux.2 Dev</span>
                <span className="text-xs text-white/60">Fast • $0.04/image</span>
              </div>
            </SelectItem>
            <SelectItem value="flux-2-pro">
              <div className="flex flex-col items-start">
                <span className="font-medium">Flux.2 Pro</span>
                <span className="text-xs text-white/60">Quality • $0.15/image</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
