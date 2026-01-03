/**
 * FlatAssetList Component
 * 
 * Simple scrollable list of all assets without category grouping.
 * Optimized for mobile: large touch targets, inline status, category badges.
 */

'use client'

import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'

export function FlatAssetList() {
    const { parsedAssets, assetStates } = useGenerationContext()
    const { selectAsset, toggleAssetSelection, state } = useGenerationLayout()
    const selectedAssetId = state.preview.selectedAsset.asset?.id

    // Filter out direction children - only show parent assets
    const displayAssets = parsedAssets.filter(asset => !asset.directionState?.parentAssetId)

    /**
     * Get status icon for an asset
     */
    const getStatusIcon = (assetId: string) => {
        const status = assetStates.get(assetId)?.status

        switch (status) {
            case 'approved':
                return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            case 'awaiting_approval':
                return <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            case 'generating':
                return <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
            case 'error':
            case 'rejected':
                return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            default:
                return <Circle className="w-4 h-4 text-white/20 flex-shrink-0" />
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white/90">Assets</h2>
                    <span className="text-xs text-white/50">{displayAssets.length} total</span>
                </div>
            </div>

            {/* Scrollable asset list */}
            <div className="flex-1 overflow-y-auto">
                {displayAssets.map(asset => {
                    const isSelected = selectedAssetId === asset.id
                    const isChecked = state.queue.selectedIds.has(asset.id)

                    return (
                        <div
                            key={asset.id}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-colors ${isSelected ? 'bg-purple-500/10' : 'hover:bg-white/5 active:bg-white/10'
                                }`}
                            onClick={() => selectAsset(asset, 'queue')}
                        >
                            {/* Checkbox */}
                            <div
                                className="flex-shrink-0 cursor-pointer p-2 -m-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleAssetSelection(asset.id)
                                }}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-white/30 bg-transparent'
                                    }`}>
                                    {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                            </div>

                            {/* Asset info */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-white/90'
                                        }`}>
                                        {asset.name}
                                    </span>
                                </div>
                                {/* Category badge */}
                                <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full self-start">
                                    {asset.category}
                                </span>
                            </div>

                            {/* Status icon */}
                            <div className="flex-shrink-0">
                                {getStatusIcon(asset.id)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
