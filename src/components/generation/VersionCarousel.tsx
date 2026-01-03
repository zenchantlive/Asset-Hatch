/**
 * VersionCarousel Component
 *
 * Displays multiple generations of an asset in a carousel format.
 * Users can navigate between versions using arrows and dot indicators.
 * Each version can be approved or rejected independently.
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

import { ChevronLeft, ChevronRight, Check, X, AlertCircle, X as Close } from 'lucide-react'
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
  onApprove: (version: AssetVersion) => void;
  /** Callback when user rejects a version */
  onReject: (versionId: string) => void;
  /** Optional callback to close/minimize the carousel */
  onClose?: () => void;
  isSyncingCost?: boolean;
  syncError?: Error | null;
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
  onClose,
  isSyncingCost = false,
  syncError = null,
}: VersionCarouselProps) {
  // Hooks must be called unconditionally, before any early returns
  const [imageUrl, setImageUrl] = useState('')
  const currentVersion = versions[currentIndex]

  // Effect to convert base64 to blob URL for high-performance rendering
  useEffect(() => {
    // Guard for empty versions array - just return, don't set state synchronously
    if (!currentVersion?.image_base64) {
      return
    }

    let active = true
    let url = ''

    // Convert base64 to a Blob
    fetch(currentVersion.image_base64)
      .then(res => res.blob())
      .then(blob => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setImageUrl(url)
      })

    // Cleanup function to revoke the URL when component unmounts or image changes
    return () => {
      active = false
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [currentVersion?.image_base64])

  // Early return after hooks
  if (versions.length === 0) {
    return null
  }

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < versions.length - 1

  return (
    <div className="relative">
      {/* Main image display */}
      <div className="relative rounded-lg overflow-hidden bg-black/30 border border-white/10">
        {imageUrl ? (
          <div className="relative aspect-square w-full">
            <Image
              src={imageUrl}
              alt={`Version ${currentIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

        ) : (
          <div className="w-full aspect-square flex items-center justify-center">
            <span className="text-white/50 text-sm">Loading...</span>
          </div>
        )}

        {/* Navigation arrows (only if multiple versions) */}
        {versions.length > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={() => onIndexChange(currentIndex - 1)}
              disabled={!hasPrevious}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-all ${hasPrevious
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
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-all ${hasNext
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

        {/* Close/Minimize button (if onClose callback provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white/80 hover:text-white transition-colors"
            title="Close carousel"
            aria-label="Close version carousel"
          >
            <Close className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dot indicators (only if multiple versions) */}
      {versions.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-3">
          {versions.map((_, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex
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
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 group">
            <span className="text-xs text-white/50 uppercase tracking-widest font-medium">Cost:</span>
            <span className={`text-xs font-bold ${isSyncingCost ? 'text-amber-300' : 'text-green-300'}`}>
              ${currentVersion.generation_metadata.cost?.toFixed(4) || '0.0000'}
              {isSyncingCost ? (
                <span className="ml-1 opacity-70">(est.)</span>
              ) : !syncError ? (
                <span className="ml-1 opacity-70">(actual)</span>
              ) : null}
            </span>
            {isSyncingCost && (
              <div className="w-2.5 h-2.5 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
            ) || (!isSyncingCost && !syncError && (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0.3125rem_rgba(34,197,94,0.5)]" />
            ))}
            {syncError && (
              <div className="flex items-center gap-1 text-red-400 group-hover:text-red-300 transition-colors cursor-help" title={`Sync failed: ${syncError.message}`}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[0.625rem] font-bold">ERR</span>
              </div>
            )}
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
          onClick={() => onApprove(currentVersion)}
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
