/**
 * VersionCarousel Component
 *
 * Displays multiple generations of an asset in a carousel format.
 * Users can navigate between versions using arrows and dot indicators.
 * Each version can be approved or rejected independently.
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssetVersion } from '@/lib/client-db'

/**
 * Props for VersionCarousel
 */
interface VersionCarouselProps {
  /** Array of all versions for this asset */
  versions: AssetVersion[]
  /** Currently displayed version index */
  currentIndex: number
  /** Callback when version index changes */
  onIndexChange: (index: number) => void
  /** Callback when user approves a version */
  onApprove: (versionId: string) => void
  /** Callback when user rejects a version */
  onReject: (versionId: string) => void
}

/**
 * VersionCarousel Component
 *
 * Carousel UI for navigating and managing multiple asset generations.
 */
export function VersionCarousel({
  versions,
  currentIndex,
  onIndexChange,
  onApprove,
  onReject,
}: VersionCarouselProps) {
  const currentVersion = versions[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < versions.length - 1

  return (
    <div className="relative">
      {/* Main image display */}
      <div className="relative rounded-lg overflow-hidden bg-black/30 border border-white/10">
        <img
          src={currentVersion.image_base64}
          alt={`Version ${currentIndex + 1}`}
          className="w-full h-auto"
        />

        {/* Navigation arrows (only if multiple versions) */}
        {versions.length > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={() => onIndexChange(currentIndex - 1)}
              disabled={!hasPrevious}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-all ${
                hasPrevious
                  ? 'bg-black/50 hover:bg-black/70 text-white'
                  : 'bg-black/20 text-white/30 cursor-not-allowed'
              }`}
              aria-label="Previous version"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right arrow */}
            <button
              onClick={() => onIndexChange(currentIndex + 1)}
              disabled={!hasNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-all ${
                hasNext
                  ? 'bg-black/50 hover:bg-black/70 text-white'
                  : 'bg-black/20 text-white/30 cursor-not-allowed'
              }`}
              aria-label="Next version"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Version indicator badge */}
        {versions.length > 1 && (
          <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs text-white/80">
            v{currentIndex + 1} of {versions.length}
          </div>
        )}
      </div>

      {/* Dot indicators (only if multiple versions) */}
      {versions.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-3">
          {versions.map((_, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-purple-500 w-6'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to version ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Version metadata */}
      <div className="mt-4 p-3 rounded-lg bg-black/30 border border-white/10">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-white/50">Model:</span>
            <span className="ml-2 text-white/80">{currentVersion.generation_metadata.model}</span>
          </div>
          <div>
            <span className="text-white/50">Seed:</span>
            <span className="ml-2 text-white/80">{currentVersion.generation_metadata.seed}</span>
          </div>
          <div>
            <span className="text-white/50">Cost:</span>
            <span className="ml-2 text-white/80">${currentVersion.generation_metadata.cost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-white/50">Time:</span>
            <span className="ml-2 text-white/80">
              {(currentVersion.generation_metadata.duration_ms / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Accept/Reject buttons for current version */}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => onApprove(currentVersion.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Accept v{currentIndex + 1}
        </Button>
        <Button
          onClick={() => onReject(currentVersion.id)}
          variant="destructive"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Reject v{currentIndex + 1}
        </Button>
      </div>

      {/* Prompt preview (collapsed by default) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80 transition-colors">
          View prompt
        </summary>
        <div className="mt-2 p-3 rounded-lg bg-black/30 border border-white/10 text-xs text-white/70 max-h-32 overflow-y-auto">
          {currentVersion.prompt_used}
        </div>
      </details>
    </div>
  )
}
