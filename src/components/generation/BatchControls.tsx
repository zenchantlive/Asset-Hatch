/**
 * BatchControls Component
 * 
 * Toolbar for generation controls and settings.
 * Provides model selection, generation status, and cost display.
 * 
 * Features:
 * - Model selector (Flux.2 Pro)
 * - Progress indicator showing completion count
 * - Failed assets indicator
 * - Inline cost display (estimated → actual)
 * 
 * Note: Individual asset generation is triggered from the PromptPreview component.
 */

'use client'

import { AlertCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGenerationContext } from './GenerationQueue'

interface BatchControlsProps {
  totalEstimatedCost?: number
  totalActualCost?: number
}

/**
 * BatchControls Component
 * 
 * Main toolbar for generation controls
 */
export function BatchControls({
  totalEstimatedCost = 0,
  totalActualCost = 0
}: BatchControlsProps) {
  const {
    progress,
    failed,
    selectedModel,
    setSelectedModel,
  } = useGenerationContext()

  // Calculate counts and cost display
  const hasFailures = failed.size > 0
  const hasActualCosts = totalActualCost > 0
  const displayCost = hasActualCosts ? totalActualCost : totalEstimatedCost
  const costLabel = hasActualCosts ? 'Total' : 'Est.'
  const showCost = displayCost > 0

  return (
    <div className="glass-panel p-4 m-4 flex items-center justify-between gap-4">
      {/* Left side: Status indicators */}
      <div className="flex items-center gap-3">
        {/* Progress indicator */}
        {progress.completed > 0 && (
          <span className="text-sm text-white/80 font-medium">
            {progress.completed} / {progress.total} generated
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

      {/* Right side: Model selector and cost */}
      <div className="flex items-center gap-4">
        {/* Inline cost display */}
        {showCost && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-green-400" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-white/50 font-medium">{costLabel}:</span>
              <span className={`text-sm font-bold ${hasActualCosts ? 'text-green-400' : 'text-white/70'}`}>
                ${displayCost.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {/* Model selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Model:</span>
          <Select
            value={selectedModel}
            onValueChange={(value: string) => setSelectedModel(value)}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="black-forest-labs/flux.2-pro">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Flux.2 Pro</span>
                  <span className="text-xs text-white/60">Quality • $0.05/image</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
