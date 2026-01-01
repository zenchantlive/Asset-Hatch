/**
 * AssetsPanel Component
 *
 * A slide-out panel that displays all approved generated assets for a project.
 * Similar to FilesPanel but shows approved assets in a card-style grid layout.
 *
 * Features:
 * - Grid display of approved assets with images
 * - Asset metadata (prompt, model, seed, cost)
 * - Regenerate option for each asset
 * - Edit prompt functionality
 * - Slide-in animation from right
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Image as ImageIcon, RotateCcw, Edit2 } from 'lucide-react'
import { db, GeneratedAsset } from '@/lib/client-db'
import { Button } from '@/components/ui/button'

interface AssetsPanelProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * AssetsPanel - Displays approved generated assets in a slide-out panel
 *
 * @param projectId - The project ID to fetch assets for
 * @param isOpen - Whether the panel is visible
 * @param onClose - Callback to close the panel
 */
export function AssetsPanel({ projectId, isOpen, onClose }: AssetsPanelProps) {
  // State for list of assets
  const [assets, setAssets] = useState<GeneratedAsset[]>([])

  // Currently selected asset for detail view
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null)

  // Loading state during fetch
  const [isLoading, setIsLoading] = useState(false)

  // Error state if fetch fails
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all approved assets for the project from Dexie
   * Wrapped in useCallback to satisfy React Hook dependency rules
   */
  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch from Dexie
      const approvedAssets = await db.generated_assets
        .where('project_id')
        .equals(projectId)
        .sortBy('created_at')

      // Debug logging
      console.log('Loaded assets:', approvedAssets.length)
      if (approvedAssets.length > 0) {
        console.log('First asset:', approvedAssets[0])
        console.log('Has image_base64:', !!approvedAssets[0].image_base64)
        console.log('Has image_blob:', !!approvedAssets[0].image_blob)
      }

      // Reverse to show newest first
      setAssets(approvedAssets.reverse())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to load assets:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Load assets when panel opens
   * Re-fetch when projectId changes
   */
  useEffect(() => {
    if (isOpen) {
      loadAssets()
    }
  }, [isOpen, loadAssets])

  /**
   * Format timestamp for display
   * Converts ISO string to relative time
   */
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  /**
   * Handle regenerate button click
   * TODO: Implement regeneration logic
   */
  const handleRegenerate = (asset: GeneratedAsset) => {
    console.log('Regenerate asset:', asset.id)
    // TODO: Call generation API with existing prompt
  }

  /**
   * Handle edit prompt button click
   * TODO: Implement prompt editing
   */
  const handleEditPrompt = (asset: GeneratedAsset) => {
    console.log('Edit prompt for asset:', asset.id)
    // TODO: Open modal with editable prompt
  }

  // If not open, render nothing
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay - click to close */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
      />

      {/* Slide-out panel from right */}
      <div
        className="fixed right-0 top-0 h-full w-[48rem] bg-black/40 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col animate-slideInRight"
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold font-heading text-white">Generated Assets</h2>
            {!isLoading && assets.length > 0 && (
              <span className="text-sm text-white/60">({assets.length})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-white/60">
                <div className="inline-block w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm">Loading assets...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && assets.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-white/60">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No assets generated yet</p>
                <p className="text-xs mt-1">Approved assets will appear here</p>
              </div>
            </div>
          )}

          {/* Asset grid */}
          {!isLoading && assets.length > 0 && !selectedAsset && (
            <div className="p-4 grid grid-cols-2 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                >
                  {/* Image */}
                  <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.image_base64 || ''}
                      alt={asset.asset_id}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Asset info */}
                  <div>
                    <h3 className="font-semibold text-white/90 text-sm truncate">{asset.asset_id}</h3>
                    <p className="text-xs text-white/60">{asset.status}</p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{formatTimestamp(asset.created_at)}</span>
                    <span>${asset.generation_metadata.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Asset detail view */}
          {selectedAsset && (
            <div className="flex flex-col h-full">
              {/* Back button */}
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Back to assets
                </button>
              </div>

              {/* Asset details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-white/90">{selectedAsset.asset_id}</h3>
                  <p className="text-sm text-white/60">{selectedAsset.status}</p>
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAsset.image_base64 || ''}
                    alt={selectedAsset.asset_id}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Prompt */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/60 font-semibold">Prompt:</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditPrompt(selectedAsset)}
                      className="text-xs h-6"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-white/80 font-mono">{selectedAsset.prompt_used}</p>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Model:</span>
                    <span className="ml-2 text-white/90 font-medium">{selectedAsset.generation_metadata.model}</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Seed:</span>
                    <span className="ml-2 text-white/90 font-mono">{selectedAsset.generation_metadata.seed}</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Cost:</span>
                    <span className="ml-2 text-white/90 font-medium">${selectedAsset.generation_metadata.cost.toFixed(4)}</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Duration:</span>
                    <span className="ml-2 text-white/90 font-medium">{(selectedAsset.generation_metadata.duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Button
                    onClick={() => handleRegenerate(selectedAsset)}
                    className="w-full aurora-gradient font-semibold"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate Image
                  </Button>
                </div>

                {/* Info box */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-xs text-white/70">
                  <strong className="text-purple-300">Tip:</strong> Click &quot;Regenerate Image&quot; to create a new version with the same prompt, or edit the prompt first for variations.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
