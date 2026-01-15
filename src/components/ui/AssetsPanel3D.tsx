/**
 * AssetsPanel3D Component
 *
 * A slide-out panel that displays all approved 3D assets for a project.
 * Similar to AssetsPanel but shows 3D assets with rigging and animation status.
 *
 * Features:
 * - Grid display of approved 3D assets
 * - Asset metadata (prompt, rig status, animations)
 * - Status indicators (draft/rigged/animated)
 * - Animation presets display
 * - Slide-in animation from right
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Box, Bone, Film, CheckCircle, Clock, AlertCircle } from 'lucide-react'
// Server API used instead of Dexie for 3D assets
import type { Generated3DAsset } from '@/lib/types/3d-generation'
import { Button } from '@/components/ui/button'
import { ANIMATION_PRESET_LABELS, type AnimationPreset } from '@/lib/types/3d-generation'
// 3D Viewer components for interactive previews
import { SimpleSkyboxViewer } from '@/components/3d/generation/SimpleSkyboxViewer'
import { ModelViewer } from '@/components/3d/generation/ModelViewer'

interface AssetsPanel3DProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * AssetsPanel3D - Displays approved 3D assets in a slide-out panel
 *
 * @param projectId - The project ID to fetch assets for
 * @param isOpen - Whether the panel is visible
 * @param onClose - Callback to close the panel
 */
export function AssetsPanel3D({ projectId, isOpen, onClose }: AssetsPanel3DProps) {
  // State for list of assets
  const [assets, setAssets] = useState<Generated3DAsset[]>([])

  // Currently selected asset for detail view
  const [selectedAsset, setSelectedAsset] = useState<Generated3DAsset | null>(null)

  // Loading state during fetch
  const [isLoading, setIsLoading] = useState(false)

  // Error state if fetch fails
  const [error, setError] = useState<string | null>(null)

  // Skybox preview mode: spherical 360° or flat 2:1
  const [skyboxPreviewMode, setSkyboxPreviewMode] = useState<'spherical' | 'flat'>('spherical')

  /**
   * Fetch all approved 3D assets for the project from server API
   * Uses the /api/projects/[id]/3d-assets endpoint which reads from Prisma
   */
  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch from server API - filter for approved status
      const response = await fetch(`/api/projects/${projectId}/3d-assets?status=approved`)

      if (!response.ok) {
        throw new Error(`Failed to fetch 3D assets: ${response.status}`)
      }

      const data = await response.json()

      // Debug logging
      console.log('Loaded 3D assets from API:', data.assets?.length || 0)

      // Map API response to component's expected format
      interface ApiAsset {
        id: string
        assetId: string
        status: string
        approvalStatus: string | null
        draftModelUrl: string | null
        riggedModelUrl: string | null
        animatedModelUrls: Record<string, string>
        promptUsed: string
        isRiggable: boolean | null
        createdAt: string
        errorMessage: string | null
      }

      const mappedAssets: Generated3DAsset[] = (data.assets || []).map((asset: ApiAsset) => ({
        id: asset.id,
        project_id: projectId,
        asset_id: asset.assetId,
        status: asset.status as Generated3DAsset['status'],
        draft_model_url: asset.draftModelUrl,
        rigged_model_url: asset.riggedModelUrl,
        animated_model_urls: asset.animatedModelUrls || {},
        prompt_used: asset.promptUsed || '',
        is_riggable: asset.isRiggable ?? false,
        created_at: asset.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      setAssets(mappedAssets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to load 3D assets:', err)
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
   * Get status badge component based on asset status
   */
  const getStatusBadge = (asset: Generated3DAsset) => {
    if (asset.status === 'complete') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-600/20 text-green-300 text-xs">
          <CheckCircle className="h-3 w-3" />
          <span>Approved</span>
        </div>
      )
    }
    if (asset.status === 'failed') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 text-red-300 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Failed</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
        <Clock className="h-3 w-3" />
        <span>{asset.status}</span>
      </div>
    )
  }

  /**
   * Get rig status badge
   */
  const getRigBadge = (asset: Generated3DAsset) => {
    if (asset.rigged_model_url) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-xs">
          <Bone className="h-3 w-3" />
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
   * Get animation count badge
   */
  const getAnimationBadge = (asset: Generated3DAsset) => {
    const count = asset.animated_model_urls ? Object.keys(asset.animated_model_urls).length : 0
    if (count === 0) {
      return null
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
        <Film className="h-3 w-3" />
        <span>{count} Animation{count > 1 ? 's' : ''}</span>
      </div>
    )
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
            <Box className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold font-heading text-white">3D Assets</h2>
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
                <div className="inline-block w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm">Loading 3D assets...</p>
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
                <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No 3D assets generated yet</p>
                <p className="text-xs mt-1">Approved 3D assets will appear here</p>
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
                  {/* Use image for Skybox, ModelViewer for 3D models, placeholder otherwise */}
                  {asset.asset_id.endsWith('-skybox') && asset.draft_model_url ? (
                    <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.draft_model_url}
                        alt="Skybox"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : asset.draft_model_url ? (
                    <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                      <ModelViewer
                        modelUrl={asset.draft_model_url}
                        autoRotate={true}
                        className="w-full h-full"
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
                    {asset.asset_id.endsWith('-skybox') ? (
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

          {/* Asset detail view */}
          {selectedAsset && (
            <div className="flex flex-col h-full">
              {/* Back button */}
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Back to assets
                </button>
              </div>

              {/* Asset details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-white/90">{selectedAsset.asset_id}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAsset.asset_id.endsWith('-skybox') ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-xs">
                        <Box className="h-3 w-3" />
                        <span>Skybox</span>
                      </div>
                    ) : (
                      <>
                        {getStatusBadge(selectedAsset)}
                        {getRigBadge(selectedAsset)}
                        {getAnimationBadge(selectedAsset)}
                      </>
                    )}
                  </div>
                </div>

                {/* Skybox 360° Interactive Preview with Tab Switcher */}
                {selectedAsset.asset_id.endsWith('-skybox') && selectedAsset.draft_model_url && (
                  <div className="space-y-2">
                    {/* Preview Mode Tabs */}
                    <div className="flex gap-2 border-b border-white/10">
                      <button
                        onClick={() => setSkyboxPreviewMode('spherical')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${skyboxPreviewMode === 'spherical'
                          ? 'text-cyan-400 border-cyan-400'
                          : 'text-white/50 hover:text-white/70 border-transparent hover:border-white/20'
                          }`}
                      >
                        Spherical 360°
                      </button>
                      <button
                        onClick={() => setSkyboxPreviewMode('flat')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${skyboxPreviewMode === 'flat'
                          ? 'text-cyan-400 border-cyan-400'
                          : 'text-white/50 hover:text-white/70 border-transparent hover:border-white/20'
                          }`}
                      >
                        Flat 2:1
                      </button>
                    </div>

                    {/* Preview Content */}
                    {skyboxPreviewMode === 'spherical' ? (
                      <div className="h-[300px] rounded-lg border border-white/10 overflow-hidden">
                        <SimpleSkyboxViewer
                          imageUrl={selectedAsset.draft_model_url}
                          autoRotate={false}
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-lg border border-white/10 overflow-hidden bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedAsset.draft_model_url}
                          alt="Skybox flat preview"
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 3D Model Interactive Preview */}
                {!selectedAsset.asset_id.endsWith('-skybox') && selectedAsset.draft_model_url && (
                  <div className="h-[300px] rounded-lg border border-white/10 overflow-hidden">
                    <ModelViewer
                      modelUrl={selectedAsset.draft_model_url}
                      autoRotate={true}
                    />
                  </div>
                )}

                {/* No model URL available placeholder */}
                {!selectedAsset.draft_model_url && (
                  <div className="h-[200px] rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
                    <div className="text-center text-white/40">
                      <Box className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No model available</p>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-white/60 font-semibold mb-1">Prompt:</p>
                  <p className="text-sm text-white/80 font-mono">{selectedAsset.prompt_used}</p>
                </div>

                {/* Model URLs */}
                <div className="space-y-2">
                  <p className="text-xs text-white/60 font-semibold">Model Files:</p>
                  {selectedAsset.draft_model_url && (
                    <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                      <span className="text-sm text-white/80">
                        {selectedAsset.asset_id.endsWith('-skybox') ? "Skybox Image" : "Draft Model"}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Download
                      </Button>
                    </div>
                  )}
                  {selectedAsset.rigged_model_url && (
                    <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                      <span className="text-sm text-white/80">Rigged Model</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Download
                      </Button>
                    </div>
                  )}
                  {selectedAsset.animated_model_urls && Object.entries(selectedAsset.animated_model_urls).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/60 font-semibold">Animated Models:</p>
                      {Object.keys(selectedAsset.animated_model_urls).map((preset) => (
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
                    <span className="ml-2 text-white/90 font-medium">{formatTimestamp(selectedAsset.created_at)}</span>
                  </div>
                  {!selectedAsset.asset_id.endsWith('-skybox') && (
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                      <span className="text-white/60">Riggable:</span>
                      <span className="ml-2 text-white/90 font-medium">
                        {selectedAsset.is_riggable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
