/**
 * CategoryQueuePanel Component
 * 
 * Left sidebar panel showing assets grouped by category in a card-style layout.
 * Replaces the flat list/tree view.
 * 
 * Features:
 * - Card per category (Characters, Environments, etc.)
 * - Collapsible categories
 * - Asset status indicators
 * - Selection handling
 */

'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { ParsedAsset } from '@/lib/prompt-builder'

/**
 * Group assets by category
 */
function groupAssetsByCategory(assets: ParsedAsset[]) {
    const groups: Record<string, ParsedAsset[]> = {}

    assets.forEach(asset => {
        const category = asset.category || 'Uncategorized'
        if (!groups[category]) {
            groups[category] = []
        }
        groups[category].push(asset)
    })

    return groups
}

/**
 * CategoryQueuePanel Component
 */
export function CategoryQueuePanel() {
    const { parsedAssets, assetStates } = useGenerationContext()
    const { selectAsset, toggleAssetSelection, state } = useGenerationLayout()
    const selectedAssetId = state.preview.selectedAsset.asset?.id

    // Group assets
    const assetGroups = useMemo(() => groupAssetsByCategory(parsedAssets), [parsedAssets])
    const categories = Object.keys(assetGroups)

    // State for expanded categories (default all collapsed as per user request)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    /**
     * Get status icon for an asset
     */
    const getStatusIcon = (assetId: string) => {
        const status = assetStates.get(assetId)?.status

        switch (status) {
            case 'approved':
                return <CheckCircle2 className="w-3 h-3 text-green-500" />
            case 'awaiting_approval':
                return <Clock className="w-3 h-3 text-amber-500" />
            case 'generating':
                return <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
            case 'error':
            case 'rejected':
                return <AlertCircle className="w-3 h-3 text-red-500" />
            default:
                return null // No icon for pending/default state to reduce noise
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/20 border-r border-white/10">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold text-white/90">Asset Queue</h2>
                <div className="text-xs text-white/50 mt-1 flex justify-between">
                    <span>{parsedAssets.length} Total Assets</span>
                    <span>{categories.length} Categories</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {categories.map(category => {
                    const assets = assetGroups[category]
                    const isExpanded = expandedCategories[category]

                    // Calculate quick stats for the category card
                    const stats = assets.reduce((acc, asset) => {
                        const status = assetStates.get(asset.id)?.status
                        if (status === 'approved') acc.approved++
                        else if (status === 'awaiting_approval') acc.review++
                        else if (status === 'generating') acc.generating++
                        return acc
                    }, { approved: 0, review: 0, generating: 0 })

                    return (
                        <div key={category} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden transition-all hover:border-white/20">
                            {/* Category Card Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ?
                                        <ChevronDown className="w-4 h-4 text-white/60" /> :
                                        <ChevronRight className="w-4 h-4 text-white/60" />
                                    }
                                    <span className="font-medium text-white/90">{category}</span>
                                    <span className="text-xs text-white/40 bg-black/30 px-2 py-0.5 rounded-full">
                                        {assets.length}
                                    </span>
                                </div>

                                {/* Status indicators on the card header */}
                                <div className="flex gap-1">
                                    {stats.generating > 0 && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                                    {stats.review > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                                    {stats.approved > 0 && <span className="w-2 h-2 rounded-full bg-green-500" />}
                                </div>
                            </button>

                            {/* Asset List (Accordion Body) */}
                            {isExpanded && (
                                <div className="border-t border-white/5">
                                    {assets.map(asset => {
                                        const isSelected = selectedAssetId === asset.id
                                        const isChecked = state.queue.selectedIds.has(asset.id)

                                        return (
                                            <div
                                                key={asset.id}
                                                className={`w-full flex items-center px-4 py-2 text-sm transition-colors cursor-pointer border-l-2 ${isSelected
                                                    ? 'bg-purple-500/10 border-purple-500'
                                                    : 'hover:bg-white/5 border-transparent'
                                                    }`}
                                                onClick={() => selectAsset(asset, 'queue')}
                                            >
                                                {/* Selection Checkbox */}
                                                <div
                                                    className="mr-3 flex-shrink-0 cursor-pointer p-1 group/checkbox"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleAssetSelection(asset.id)
                                                    }}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked
                                                            ? 'bg-purple-500 border-purple-500'
                                                            : 'border-white/30 group-hover/checkbox:border-white/60 bg-transparent'
                                                        }`}>
                                                        {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>

                                                <span className={`truncate flex-1 ${isSelected ? 'text-white font-medium' : 'text-white/70'}`}>
                                                    {asset.name}
                                                </span>

                                                {getStatusIcon(asset.id)}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
