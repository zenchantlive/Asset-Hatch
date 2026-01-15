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

import { useEffect, useState, useCallback, useMemo } from 'react'
import { X, Image as ImageIcon, RotateCcw, Edit2, Box, Grid, Layers } from 'lucide-react'
import { db, GeneratedAsset } from '@/lib/client-db'
import type { Generated3DAsset } from '@/lib/types/3d-generation'
import { Button } from '@/components/ui/button'
import { ANIMATION_PRESET_LABELS, type AnimationPreset } from '@/lib/types/3d-generation'
import { cn } from '@/lib/utils'

/**
 * Constants
 */
const SKYBOX_ASSET_SUFFIX = SKYBOX_ASSET_SUFFIX

/**
 * Asset type filter options
 */
export type AssetType = 'all' | '2d' | '3d' | 'skybox'

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
  // State for list of 2D assets
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  
  // State for list of 3D assets
  const [assets3D, setAssets3D] = useState<Generated3DAsset[]>([])

  // Currently selected 2D asset for detail view
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null)

  // Currently selected 3D asset for detail view
  const [selectedAsset3D, setSelectedAsset3D] = useState<Generated3DAsset | null>(null)

  // Asset type filter
  const [assetType, setAssetType] = useState<AssetType>('all')

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

      // Fetch 2D assets from Dexie
      const approvedAssets = await db.generated_assets
        .where('project_id')
        .equals(projectId)
        .filter(asset => asset.status === 'approved')
        .sortBy('created_at')

      // Fetch 3D assets from Dexie - filter for complete status (approved)
      const approved3DAssets = await db.generated_3d_assets
        .where('project_id')
        .equals(projectId)
        .filter(asset => asset.status === 'complete')
        .sortBy('created_at')

      // Reverse to show newest first
      setAssets(approvedAssets.reverse())
      setAssets3D(approved3DAssets.reverse())
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

  /**
   * Get status badge component based on 3D asset status
   */
  const getStatusBadge = (asset: Generated3DAsset) => {
    if (asset.status === 'complete') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-600/20 text-green-300 text-xs">
          <Box className="h-3 w-3" />
          <span>Approved</span>
        </div>
      )
    }
    if (asset.status === 'failed') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 text-red-300 text-xs">
          <Box className="h-3 w-3" />
          <span>Failed</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
        <Box className="h-3 w-3" />
        <span>{asset.status}</span>
      </div>
    )
  }

  /**
   * Get rig status badge for 3D assets
   */
  const getRigBadge = (asset: Generated3DAsset) => {
    if (asset.rigged_model_url) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-xs">
          <Box className="h-3 w-3" />
          <span>Rigged</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-white/60 text-xs">
        <Box className="h-3 w-3" />
        <span>Draft</span>
      </div>
    )
  }

  /**
   * Get animation count badge for 3D assets
   */
  const getAnimationBadge = (asset: Generated3DAsset) => {
    const count = asset.animated_model_urls ? Object.keys(asset.animated_model_urls).length : 0
    if (count === 0) {
      return null
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
        <Layers className="h-3 w-3" />
        <span>{count}</span>
      </div>
    )
  }

  /**
   * Get asset type label and icon
   */
  const getAssetTypeLabel = (type: AssetType): { label: string; icon: React.ReactNode } => {
    switch (type) {
      case '2d':
        return { label: '2D Assets', icon: <ImageIcon className="h-4 w-4" /> }
      case '3d':
        return { label: '3D Models', icon: <Box className="h-4 w-4" /> }
      case 'skybox':
        return { label: 'Skyboxes', icon: <Grid className="h-4 w-4" /> }
      default:
        return { label: 'All Assets', icon: <Layers className="h-4 w-4" /> }
    }
  }

  /**
   * Check if asset should be shown based on current filter
   */
  const shouldShowAsset = useCallback((asset: Generated3DAsset): boolean => {
    if (assetType === 'all') return true
    if (assetType === '2d') return false
    if (assetType === '3d') return !asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)
    if (assetType === 'skybox') return asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)
    return true
  }, [assetType])

  /**
   * Pre-calculate asset counts for each tab
   */
  const counts = useMemo(() => {
    const count2D = assets.length
    const skyboxes = assets3D.filter(a => a.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)).length
    const count3D = assets3D.length - skyboxes
    return {
      all: count2D + assets3D.length,
      '2d': count2D,
      '3d': count3D,
      skybox: skyboxes,
    }
  }, [assets, assets3D])

  /**
   * Filtered assets to display based on current tab
   */
  const displayedAssets = useMemo(() => {
    const assets2D = (assetType === 'all' || assetType === '2d') ? assets : []
    const assets3DToShow = (assetType === 'all' || assetType === '3d' || assetType === 'skybox')
      ? assets3D.filter(shouldShowAsset)
      : []
    return { assets2D, assets3D: assets3DToShow }
  }, [assetType, assets, assets3D, shouldShowAsset])

  const hasNoAssets = displayedAssets.assets2D.length === 0 && displayedAssets.assets3D.length === 0

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
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold font-heading text-white">Generated Assets</h2>
            {!isLoading && counts.all > 0 && (
              <span className="text-sm text-white/60">({counts.all})</span>
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

        {/* Asset type filter tabs */}
        <div className="flex gap-1 px-4 border-b border-white/10">
          {(['all', '2d', '3d', 'skybox'] as AssetType[]).map((type) => {
            const { label, icon } = getAssetTypeLabel(type)
            const isActive = assetType === type
            const count = counts[type]
            return (
              <button
                key={type}
                onClick={() => setAssetType(type)}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${isActive 
                    ? 'text-purple-400 border-purple-400' 
                    : 'text-white/50 hover:text-white/80 border-transparent hover:border-white/20'}
                `}
              >
                {icon}
                <span>{label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
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
          {!isLoading && !error && hasNoAssets && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-white/60">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No assets generated yet</p>
                <p className="text-xs mt-1">Approved assets will appear here</p>
              </div>
            </div>
          )}

          {/* 2D Asset grid */}
          {!isLoading && !selectedAsset && !selectedAsset3D && displayedAssets.assets2D.length > 0 && (
            <div className="p-4 grid grid-cols-2 gap-4">
              {displayedAssets.assets2D.map((asset) => (
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

          {/* 3D Asset grid */}
          {!isLoading && !selectedAsset && !selectedAsset3D && displayedAssets.assets3D.length > 0 && (
            <div className="p-4 grid grid-cols-2 gap-4">
              {displayedAssets.assets3D.map((asset) => (
                <div
                  key={asset.id}
                  className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedAsset3D(asset)}
                >
                  {/* Use image for Skybox, otherwise placeholder */}
                  {asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) && asset.draft_model_url ? (
                    <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.draft_model_url}
                        alt="Skybox"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                      <Box className="w-12 h-12 text-cyan-400/50" />
                    </div>
                  )}

                  {/* Asset info */}
                  <div>
                    <h3 className="font-semibold text-white/90 text-sm truncate">{asset.asset_id}</h3>
                    <p className="text-xs text-white/60 truncate">{asset.prompt_used}</p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    {/* Skybox Badge */}
                    {asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-xs">
                        <Box className="h-3 w-3" />
                        <span>Skybox</span>
                      </div>
                    ) : (
                      <>
                        {getStatusBadge(asset)}
                        {getRigBadge(asset)}
                        {getAnimationBadge(asset)}
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{formatTimestamp(asset.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2D Asset detail view */}
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

          {/* 3D Asset detail view */}
          {selectedAsset3D && (
            <div className="flex flex-col h-full">
              {/* Back button */}
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={() => setSelectedAsset3D(null)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Back to assets
                </button>
              </div>

              {/* Asset details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-white/90">{selectedAsset3D.asset_id}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAsset3D.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-xs">
                        <Box className="h-3 w-3" />
                        <span>Skybox</span>
                      </div>
                    ) : (
                      <>
                        {getStatusBadge(selectedAsset3D)}
                        {getRigBadge(selectedAsset3D)}
                        {getAnimationBadge(selectedAsset3D)}
                      </>
                    )}
                  </div>
                </div>

                {/* Skybox Preview or 3D Model Viewer Placeholder */}
                {selectedAsset3D.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) && selectedAsset3D.draft_model_url ? (
                  <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedAsset3D.draft_model_url}
                      alt="Skybox Full"
                      className="w-full h-full object-cover"
                    />
                    <p className="absolute bottom-4 left-4 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">2D Preview</p>
                  </div>
                ) : (
                  <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                    <Box className="w-16 h-16 text-cyan-400/50" />
                    <p className="absolute bottom-4 text-xs text-white/40">3D Model Viewer</p>
                  </div>
                )}

                {/* Prompt */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-white/60 font-semibold mb-1">Prompt:</p>
                  <p className="text-sm text-white/80 font-mono">{selectedAsset3D.prompt_used}</p>
                </div>

                {/* Model URLs */}
                <div className="space-y-2">
                  <p className="text-xs text-white/60 font-semibold">Model Files:</p>
                  {selectedAsset3D.draft_model_url && (
                    <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                      <span className="text-sm text-white/80">
                        {selectedAsset3D.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) ? "Skybox Image" : "Draft Model"}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Download
                      </Button>
                    </div>
                  )}
                  {selectedAsset3D.rigged_model_url && (
                    <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                      <span className="text-sm text-white/80">Rigged Model</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Download
                      </Button>
                    </div>
                  )}
                  {selectedAsset3D.animated_model_urls && Object.entries(selectedAsset3D.animated_model_urls).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/60 font-semibold">Animated Models:</p>
                      {Object.entries(selectedAsset3D.animated_model_urls).map(([preset, url]) => (
                        <div key={preset} className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                          <span className="text-sm text-white/80">
                            {ANIMATION_PRESET_LABELS[preset as AnimationPreset] || preset}
                          </span>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Created:</span>
                    <span className="ml-2 text-white/90 font-medium">{formatTimestamp(selectedAsset3D.created_at)}</span>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/10">
                    <span className="text-white/60">Status:</span>
                    <span className="ml-2 text-white/90 font-medium capitalize">{selectedAsset3D.status}</span>
                  </div>
                </div>

                {/* Animations section */}
                {selectedAsset3D.animated_model_urls && Object.keys(selectedAsset3D.animated_model_urls).length > 0 && (
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-white/60 font-semibold mb-2">Animations:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedAsset3D.animated_model_urls).map(([preset, url]) => {
                        const status = selectedAsset3D.animationApprovals?.[preset as AnimationPreset] || 'pending'
                        return (
                          <div key={preset} className="flex items-center gap-2 bg-black/20 rounded px-2 py-1">
                            <span className="text-xs text-white/80">
                              {ANIMATION_PRESET_LABELS[preset as AnimationPreset] || preset}
                            </span>
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              {
                                'bg-green-600/20 text-green-300': status === 'approved',
                                'bg-red-600/20 text-red-300': status === 'rejected',
                                'bg-yellow-600/20 text-yellow-300': status === 'pending',
                              }
                            )}>
                              {status}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
