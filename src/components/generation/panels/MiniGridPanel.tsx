/**
 * MiniGridPanel Component (v2.1 - Collapsible)
 * 
 * Right panel showing thumbnail grid of all assets with:
 * - Collapse/expand toggle [−]/[+]
 * - Color-coded status borders
 * - Click to select/preview
 * - Compact visual overview
 * - Stats summary
 */

'use client'

import { useMemo } from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'

/**
 * Props for MiniGridPanel
 */
interface MiniGridPanelProps {
    /** Compact mode for mobile layout */
    compact?: boolean
}

/**
 * Get border color class based on asset status
 */
function getStatusBorderClass(status: string | undefined): string {
    switch (status) {
        case 'generating':
            return 'border-purple-500 animate-pulse'
        case 'awaiting_approval':
            return 'border-amber-500'
        case 'approved':
            return 'border-green-500'
        case 'rejected':
        case 'error':
            return 'border-red-500'
        default:
            return 'border-white/20'
    }
}

/**
 * MiniGridPanel Component
 * 
 * Compact grid showing all assets as thumbnails for quick overview.
 * Can be collapsed to give more room to the preview panel.
 */
export function MiniGridPanel({ compact = false }: MiniGridPanelProps) {
    // Get contexts
    const { parsedAssets, assetStates } = useGenerationContext()
    const { state, selectAsset, toggleMiniGridCollapse, isMiniGridCollapsed } = useGenerationLayout()

    // Calculate grid stats
    const stats = useMemo(() => {
        let pending = 0
        let generating = 0
        let awaiting = 0
        let approved = 0
        let failed = 0

        parsedAssets.forEach(asset => {
            const assetState = assetStates.get(asset.id)
            if (!assetState) {
                pending++
            } else {
                switch (assetState.status) {
                    case 'generating': generating++; break
                    case 'awaiting_approval': awaiting++; break
                    case 'approved': approved++; break
                    case 'rejected':
                    case 'error': failed++; break
                    default: pending++
                }
            }
        })

        return { pending, generating, awaiting, approved, failed, total: parsedAssets.length }
    }, [parsedAssets, assetStates])

    // Collapsed state - just show the toggle button
    if (isMiniGridCollapsed) {
        return (
            <div className="flex flex-col h-full">
                {/* Collapsed header with expand button */}
                <button
                    onClick={toggleMiniGridCollapse}
                    className="p-3 border-b border-white/10 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-between"
                    title="Expand mini-grid"
                >
                    <Plus className="w-4 h-4 text-white/60" />
                </button>

                {/* Vertical stats when collapsed */}
                <div className="flex flex-col items-center gap-2 p-2 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-white/70">{stats.approved}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-white/70">{stats.awaiting}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/40"></span>
                        <span className="text-white/70">{stats.pending}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with collapse toggle and stats */}
            <div className="p-3 border-b border-white/10 bg-black/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white/90">Overview</h3>
                    <button
                        onClick={toggleMiniGridCollapse}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Collapse mini-grid"
                    >
                        <Minus className="w-4 h-4 text-white/60" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-white/70">{stats.approved}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-white/70">{stats.awaiting}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/40"></span>
                        <span className="text-white/70">{stats.pending}</span>
                    </div>
                    {stats.generating > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="text-white/70">{stats.generating}</span>
                        </div>
                    )}
                    {stats.failed > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-white/70">{stats.failed}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnail grid */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {parsedAssets.map(asset => {
                        const assetState = assetStates.get(asset.id)
                        const status = assetState?.status
                        const isSelected = state.preview.selectedAsset.asset?.id === asset.id
                        const hasImage = (status === 'awaiting_approval' || status === 'approved') && assetState?.result?.imageUrl

                        return (
                            <button
                                key={asset.id}
                                onClick={() => selectAsset(asset, 'grid')}
                                className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${getStatusBorderClass(status)
                                    } ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''} hover:scale-105`}
                                title={asset.name}
                            >
                                {/* Background/image */}
                                {hasImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={assetState.result.imageUrl}
                                        alt={asset.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                        {status === 'generating' ? (
                                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                        ) : (
                                            <span className="text-[0.625rem] text-white/40 text-center px-1 line-clamp-2">
                                                {asset.name.slice(0, 8)}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Status indicator dot */}
                                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${status === 'generating' ? 'bg-purple-500 animate-pulse' :
                                    status === 'awaiting_approval' ? 'bg-amber-500' :
                                        status === 'approved' ? 'bg-green-500' :
                                            status === 'error' || status === 'rejected' ? 'bg-red-500' :
                                                'bg-white/30'
                                    }`} />
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Footer with legend */}
            <div className="p-2 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-center gap-3 text-[0.625rem] text-white/50">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Done
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Review
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Gen
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                        Wait
                    </span>
                </div>
            </div>
        </div>
    )
}
