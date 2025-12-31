/**
 * BatchControls Component
 * 
 * Toolbar for generation controls and settings.
 * Provides model selection and generation status display.
 * 
 * Features:
 * - Model selector (Flux.2 Dev vs Pro)
 * - Progress indicator showing completion count
 * - Failed assets indicator
 * 
 * Note: Individual asset generation is triggered from the PromptPreview component.
 */

'use client'

import { AlertCircle } from 'lucide-react'
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
    progress,
    failed,
    selectedModel,
    setSelectedModel,
  } = useGenerationContext()

  // Calculate counts
  const hasFailures = failed.size > 0

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
