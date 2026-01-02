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
import { isDirectionVariant, getParentAsset } from '@/lib/direction-utils'

// PHASE 7: Helper to check if asset is a direction variant (child)
function isChildAsset(asset: ParsedAsset): boolean {
    return isDirectionVariant(asset)
}

// PHASE 7: Helper to get directional children of a parent asset
function getDirectionalChildren(asset: ParsedAsset, allAssets: ParsedAsset[]): ParsedAsset[] {
    return allAssets.filter(a => a.directionState?.parentAssetId === asset.id)
}

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

    // PHASE 7: State for expanded parent assets (to show direction children)
    const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({})

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    // PHASE 7: Toggle expanded state for parent assets
    const toggleAssetExpanded = (assetId: string) => {
        setExpandedAssets(prev => ({
            ...prev,
            [assetId]: !prev[assetId]
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

                            {/* Asset List (Accordion Body) - PHASE 7: Filter out direction children */}
                            {isExpanded && (
                                <div className="border-t border-white/5">
                                    {assets
                                        .filter(asset => !isChildAsset(asset)) // Hide direction children
                                        .map(asset => {
                                            const isSelected = selectedAssetId === asset.id
                                            const isChecked = state.queue.selectedIds.has(asset.id)

                                            // PHASE 7: Get directional children for this asset
                                            const directionChildren = getDirectionalChildren(asset, parsedAssets)
                                            const hasChildren = directionChildren.length > 0
                                            const isAssetExpanded = expandedAssets[asset.id]

                                            // Calculate approval stats for children
                                            const approvedChildren = directionChildren.filter(
                                                child => assetStates.get(child.id)?.status === 'approved'
                                            ).length

                                            return (
                                                <div key={asset.id}>
                                                    {/* Parent Asset Row */}
                                                    <div
                                                        className={`w-full flex items-center px-4 py-2 text-sm transition-colors cursor-pointer border-l-2 ${isSelected
                                                            ? 'bg-purple-500/10 border-purple-500'
                                                            : 'hover:bg-white/5 border-transparent'
                                                            }`}
                                                        onClick={() => selectAsset(asset, 'queue')}
                                                    >
                                                        {/* PHASE 7: Expand toggle for assets with children */}
                                                        {hasChildren && (
                                                            <div
                                                                className="mr-2 cursor-pointer p-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleAssetExpanded(asset.id)
                                                                }}
                                                            >
                                                                {isAssetExpanded ?
                                                                    <ChevronDown className="w-3 h-3 text-white/60" /> :
                                                                    <ChevronRight className="w-3 h-3 text-white/60" />
                                                                }
                                                            </div>
                                                        )}

                                                        {/* Selection Checkbox */}
                                                        <div
                                                            className={`${hasChildren ? '' : 'ml-5'} mr-3 flex-shrink-0 cursor-pointer p-1 group/checkbox`}
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

                                                        {/* PHASE 7: Direction badge for parent assets */}
                                                        {hasChildren && (
                                                            <span className="text-[0.625rem] font-bold uppercase tracking-wide rounded bg-purple-500/30 text-purple-300 border border-purple-500/50 px-1.5 py-0.5 mr-2">
                                                                {directionChildren.length}-DIR: {approvedChildren}/{directionChildren.length} ✓
                                                            </span>
                                                        )}

                                                        {getStatusIcon(asset.id)}
                                                    </div>

                                                    {/* PHASE 7: Expandable direction children */}
                                                    {hasChildren && isAssetExpanded && (
                                                        <div className="ml-8 border-l border-white/10">
                                                            {directionChildren.map(child => {
                                                                const childSelected = selectedAssetId === child.id
                                                                const childChecked = state.queue.selectedIds.has(child.id)

                                                                return (
                                                                    <div
                                                                        key={child.id}
                                                                        className={`w-full flex items-center px-4 py-1.5 text-xs transition-colors cursor-pointer border-l-2 ${childSelected
                                                                            ? 'bg-purple-500/10 border-purple-500'
                                                                            : 'hover:bg-white/5 border-transparent'
                                                                            }`}
                                                                        onClick={() => selectAsset(asset, 'queue')}
                                                                    >
                                                                        {/* Child checkbox */}
                                                                        <div
                                                                            className="mr-2 flex-shrink-0 cursor-pointer p-1 group/checkbox"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                toggleAssetSelection(child.id)
                                                                            }}
                                                                        >
                                                                            <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${childChecked
                                                                                ? 'bg-purple-500 border-purple-500'
                                                                                : 'border-white/30 group-hover/checkbox:border-white/60 bg-transparent'
                                                                                }`}>
                                                                                {childChecked && <CheckCircle2 className="w-2 h-2 text-white" />}
                                                                            </div>
                                                                        </div>

                                                                        <span className={`truncate flex-1 ${childSelected ? 'text-white font-medium' : 'text-white/60'}`}>
                                                                            {child.directionState?.direction || 'Unknown'} direction
                                                                        </span>

                                                                        {getStatusIcon(child.id)}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
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
