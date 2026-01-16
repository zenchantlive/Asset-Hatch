/**
 * AssetsPanel Component
 *
 * A slide-out panel that displays all approved generated assets for a project.
 * This is the container component that handles state management and data fetching.
 *
 * Sub-components:
 * - AssetTypeTabs: Filter tabs for asset types (All, 2D, 3D, Skybox)
 * - AssetGrid2D: Grid display of 2D assets
 * - AssetGrid3D: Grid display of 3D assets with ModelViewer previews
 * - AssetDetail2D: Detail view for selected 2D asset
 * - AssetDetail3D: Detail view for selected 3D asset with interactive viewers
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { X, Image as ImageIcon, Layers } from 'lucide-react'
import { db, GeneratedAsset } from '@/lib/client-db'
import type { Generated3DAsset } from '@/lib/types/3d-generation'
import {
  AssetTypeTabs,
  AssetGrid2D,
  AssetGrid3D,
  AssetDetail2D,
  AssetDetail3D,
  type AssetType,
} from '@/components/ui/assets'

/** Suffix used to identify skybox assets */
const SKYBOX_ASSET_SUFFIX = '-skybox'

interface AssetsPanelProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * AssetsPanel - Container component for approved assets display
 */
export function AssetsPanel({ projectId, isOpen, onClose }: AssetsPanelProps) {
  // 2D assets state
  const [assets, setAssets] = useState<GeneratedAsset[]>([])

  // 3D assets state
  const [assets3D, setAssets3D] = useState<Generated3DAsset[]>([])

  // Selected assets for detail view
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null)
  const [selectedAsset3D, setSelectedAsset3D] = useState<Generated3DAsset | null>(null)

  // Filter state
  const [assetType, setAssetType] = useState<AssetType>('all')

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all approved assets for the project
   * 2D assets from Dexie (client), 3D assets from server API (Prisma)
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

      // Fetch 3D assets from server API (Prisma) - filter for approved status
      const response = await fetch(`/api/projects/${projectId}/3d-assets?status=approved`)

      let approved3DAssets: Generated3DAsset[] = []
      if (response.ok) {
        const data = await response.json()

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

        approved3DAssets = (data.assets || []).map((asset: ApiAsset) => ({
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
      }

      // Show newest first
      setAssets(approvedAssets.reverse())
      setAssets3D(approved3DAssets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Load assets when panel opens
  useEffect(() => {
    if (isOpen) {
      loadAssets()
    }
  }, [isOpen, loadAssets])

  /**
   * Format timestamp for display (relative time)
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
   * Filter 3D assets based on asset type tab
   */
  const shouldShowAsset = useCallback((asset: Generated3DAsset): boolean => {
    if (assetType === 'all') return true
    if (assetType === '2d') return false
    if (assetType === '3d') return !asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)
    if (assetType === 'skybox') return asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)
    return true
  }, [assetType])

  /**
   * Calculate asset counts for tabs
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
   * Filter assets based on current tab
   */
  const displayedAssets = useMemo(() => {
    const assets2D = (assetType === 'all' || assetType === '2d') ? assets : []
    const assets3DToShow = (assetType === 'all' || assetType === '3d' || assetType === 'skybox')
      ? assets3D.filter(shouldShowAsset)
      : []
    return { assets2D, assets3D: assets3DToShow }
  }, [assetType, assets, assets3D, shouldShowAsset])

  const hasNoAssets = displayedAssets.assets2D.length === 0 && displayedAssets.assets3D.length === 0

  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
      />

      {/* Slide-out panel - full width on mobile, max 48rem on larger screens */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[48rem] bg-black/40 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col animate-slideInRight">
        {/* Header */}
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

        {/* Asset type tabs */}
        <AssetTypeTabs
          activeType={assetType}
          onTypeChange={setAssetType}
          counts={counts}
        />

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
          {!isLoading && !selectedAsset && !selectedAsset3D && (
            <AssetGrid2D
              assets={displayedAssets.assets2D}
              onAssetClick={setSelectedAsset}
              formatTimestamp={formatTimestamp}
            />
          )}

          {/* 3D Asset grid */}
          {!isLoading && !selectedAsset && !selectedAsset3D && (
            <AssetGrid3D
              assets={displayedAssets.assets3D}
              onAssetClick={setSelectedAsset3D}
              formatTimestamp={formatTimestamp}
            />
          )}

          {/* 2D Asset detail view */}
          {selectedAsset && (
            <AssetDetail2D
              asset={selectedAsset}
              onBack={() => setSelectedAsset(null)}
              formatTimestamp={formatTimestamp}
            />
          )}

          {/* 3D Asset detail view */}
          {selectedAsset3D && (
            <AssetDetail3D
              asset={selectedAsset3D}
              onBack={() => setSelectedAsset3D(null)}
              formatTimestamp={formatTimestamp}
            />
          )}
        </div>
      </div>
    </>
  )
}
