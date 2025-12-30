'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Edit3, Loader2, RefreshCw, Play, X, Check, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParsedAsset } from '@/lib/prompt-builder'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { AssetGenerationState } from '@/lib/types/generation'

interface BatchPreviewContentProps {
    selectedIds: Set<string>
}

/**
 * Standardized Asset Card Component
 * Enforces strict square aspect ratio and uniform styling.
 */
function AssetCard({
    asset,
    state,
    generateImage,
    isExpandedItem,
    onClick,
    onClickPending,
    onNavigateToSingle,
    onApprove,
    onReject
}: {
    asset: ParsedAsset
    state: AssetGenerationState | undefined // Typed state
    generateImage: (id: string) => void
    isExpandedItem: boolean
    onClick: () => void // Click on card with generated image - opens lightbox
    onClickPending?: () => void // Click on card without  image - navigate to editing
    onNavigateToSingle?: () => void
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
}) {
    const isGenerating = state?.status === 'generating'
    const result = (state?.status === 'approved' || state?.status === 'awaiting_approval') ? state.result : null
    const hasResult = !!result?.imageUrl

    return (
        <div
            className={`
                aspect-square bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 group 
                hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/10 
                relative overflow-hidden animate-in zoom-in-50 fill-mode-both 
                ${isExpandedItem ? 'ring-2 ring-purple-500 bg-white/10' : ''}
            `}
        // Stagger animation delay logic would need index passed, omitting for simplicity in sub-component
        >
            {/* Card Image/Placeholder */}
            <div
                className="flex-1 w-full bg-black/30 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
                onClick={() => {
                    // If no image, navigate to editing view
                    // If has image, open lightbox
                    if (hasResult) {
                        onClick()
                    } else if (onClickPending) {
                        onClickPending()
                    }
                }}
            >
                {isGenerating ? (
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                ) : hasResult && result ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={result.imageUrl || ''}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-30">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <span className="text-xs uppercase tracking-widest font-medium">Pending</span>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="flex items-center justify-between mt-auto pt-2">
                <span className="font-medium text-white/90 truncate mr-2 text-sm">{asset.name}</span>

                <div className="flex items-center gap-1">
                    {/* Approve/Reject buttons - show for generated assets */}
                    {hasResult && onApprove && onReject && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onApprove(asset.id)
                                }}
                                title="Approve asset"
                            >
                                <Check className="w-4 h-4" />
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onReject(asset.id)
                                }}
                                title="Reject asset"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </>
                    )}

                    {/* Edit Button (navigate to single asset view) */}
                    {onNavigateToSingle && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onNavigateToSingle()
                            }}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white/40 hover:text-purple-400 shrink-0"
                        onClick={(e) => {
                            e.stopPropagation()
                            generateImage(asset.id)
                        }}
                    >
                        {hasResult ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Detail Overlay within the grid cell? No, grid cells are too small.
                 Ideally, expansion should maybe be a modal or an overlay. 
                 For scaling reasons, let's keep the details separate or unused in grid mode, 
                 or replicate the expansion logic outside the card if needed.
                 The user asked for 'square cards'. Expanding inside a square card is tight.
                 We will keep it simple for now as per "square card format" request.
             */}
        </div>
    )
}

/**
 * BatchPreviewContent Component
 */
export function BatchPreviewContent({ selectedIds }: BatchPreviewContentProps) {
    const { parsedAssets, assetStates, generateImage, generatedPrompts, approveAsset, rejectAsset } = useGenerationContext()
    const { toggleAssetSelection, selectAsset } = useGenerationLayout()
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
    const [lightboxAssetId, setLightboxAssetId] = useState<string | null>(null)

    // Filter to get only selected asset objects
    const selectedAssets = useMemo(() => {
        return parsedAssets.filter(a => selectedIds.has(a.id))
    }, [parsedAssets, selectedIds])

    // Group by category
    const groupedAssets = useMemo(() => {
        const groups: Record<string, ParsedAsset[]> = {}
        selectedAssets.forEach(asset => {
            const cat = asset.category || 'Uncategorized'
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(asset)
        })
        return groups
    }, [selectedAssets])

    const isLargeBatch = selectedAssets.length >= 4
    const categoryKeys = Object.keys(groupedAssets)

    // Handlers
    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
    }

    const handleClearSelection = () => {
        selectedIds.forEach(id => toggleAssetSelection(id))
    }

    // --- Renderers ---

    // 1. Large Batch: Category Groups (Accordion + Grid)
    if (isLargeBatch) {
        return (
            <div className="flex flex-col h-full bg-black/20 text-white rounded-lg overflow-hidden animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-lg font-semibold text-white/90">Batch Dashboard</h2>
                        <p className="text-xs text-white/50">{selectedAssets.length} Assets Selected</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border-0"
                        onClick={handleClearSelection}
                    >
                        Clear
                    </Button>
                </div>

                {/* Content: Category Lists */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {categoryKeys.map(category => {
                        const assets = groupedAssets[category]
                        const isExpanded = expandedCategories[category] ?? true // Default open

                        return (
                            <div key={category} className="border border-white/10 rounded-lg overflow-hidden bg-black/30">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-white/60" />}
                                        <span className="font-semibold">{category}</span>
                                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{assets.length}</span>
                                    </div>
                                    <span className="text-xs text-white/40 uppercase tracking-widest">{isExpanded ? 'Collapse' : 'Expand'}</span>
                                </button>

                                {/* Asset Grid (2 Columns) */}
                                {isExpanded && (
                                    <div className="p-4 bg-black/20 border-t border-white/5">
                                        <div className="grid grid-cols-2 gap-4">
                                            {assets.map(asset => (
                                                <AssetCard
                                                    key={asset.id}
                                                    asset={asset}
                                                    state={assetStates.get(asset.id)}
                                                    generateImage={generateImage}
                                                    isExpandedItem={false}
                                                    onClick={() => setLightboxAssetId(asset.id)}
                                                    onClickPending={() => selectAsset(asset, 'grid')}
                                                    onNavigateToSingle={() => selectAsset(asset, 'grid')}
                                                    onApprove={approveAsset}
                                                    onReject={rejectAsset}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Lightbox Modal */}
                {lightboxAssetId && (() => {
                    const lightboxAsset = parsedAssets.find(a => a.id === lightboxAssetId)
                    const lightboxState = lightboxAsset ? assetStates.get(lightboxAsset.id) : null
                    const hasImage = (lightboxState?.status === 'awaiting_approval' || lightboxState?.status === 'approved') && lightboxState?.result?.imageUrl
                    const prompt = lightboxAsset ? generatedPrompts.get(lightboxAsset.id) : null

                    return (
                        <div
                            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                            onClick={() => setLightboxAssetId(null)}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setLightboxAssetId(null)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>

                            {/* Content */}
                            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                                {/* Image */}
                                {hasImage && lightboxState?.result?.imageUrl ? (
                                    <div className="mb-4 bg-black/50 rounded-xl p-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={lightboxState.result.imageUrl}
                                            alt={lightboxAsset?.name || 'Asset'}
                                            className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-4 bg-black/50 rounded-xl p-8 text-center">
                                        <p className="text-white/50">No image generated yet</p>
                                    </div>
                                )}

                                {/* Asset Info and Prompt */}
                                <div className="bg-black/70 rounded-xl p-6 space-y-4">
                                    <h3 className="text-xl font-semibold text-white">{lightboxAsset?.name}</h3>
                                    {prompt && (
                                        <div>
                                            <p className="text-sm text-white/60 mb-2">Prompt:</p>
                                            <p className="text-white/90 font-mono text-sm whitespace-pre-wrap">{prompt}</p>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => setLightboxAssetId(null)}
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                    >
                                        Return to Batch
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        )
    }

    // 2. Small Batch: Simple Grid (< 4)
    return (
        <div className="flex flex-col h-full p-6 animate-in fade-in duration-500 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white/90">Batch View</h2>
                    <p className="text-sm text-white/50">{selectedAssets.length} Assets Selected</p>
                </div>
                <Button
                    variant="ghost"
                    onClick={handleClearSelection}
                    className="text-white/60 hover:text-white"
                >
                    Clear
                </Button>
            </div>

            {/* 
                Grid Layout - Constraints:
                - max-w-[80vh] helps ensure the squares don't become excessively huge on wide screens, 
                  keeping them closer to the "fit in reasonable view" request without scroll.
            */}
            {/* 
                Adaptive Grid Layout based on count
            */}
            <div className={`grid gap-6 auto-rows-min transition-all duration-500 w-full mx-auto
                ${selectedAssets.length === 1 ? 'grid-cols-1 max-w-xl' :
                    selectedAssets.length === 2 ? 'grid-cols-2 max-w-5xl' :
                        selectedAssets.length === 3 ? 'grid-cols-3 max-w-7xl' :
                            selectedAssets.length === 4 ? 'grid-cols-2 max-w-4xl' :
                                'grid-cols-2 md:grid-cols-3 max-w-7xl'
                }
            `}>
                {selectedAssets.map(asset => (
                    <AssetCard
                        key={asset.id}
                        asset={asset}
                        state={assetStates.get(asset.id)}
                        generateImage={generateImage}
                        isExpandedItem={false}
                        onClick={() => setLightboxAssetId(asset.id)}
                        onClickPending={() => selectAsset(asset, 'grid')}
                        onNavigateToSingle={() => selectAsset(asset, 'grid')}
                        onApprove={approveAsset}
                        onReject={rejectAsset}
                    />
                ))}
            </div>

            {/* Lightbox Modal */}
            {lightboxAssetId && (() => {
                const lightboxAsset = parsedAssets.find(a => a.id === lightboxAssetId)
                const lightboxState = lightboxAsset ? assetStates.get(lightboxAsset.id) : null
                const hasImage = (lightboxState?.status === 'awaiting_approval' || lightboxState?.status === 'approved') && lightboxState?.result?.imageUrl
                const prompt = lightboxAsset ? generatedPrompts.get(lightboxAsset.id) : null

                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightboxAssetId(null)}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setLightboxAssetId(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Content */}
                        <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                            {/* Image */}
                            {hasImage && lightboxState?.result?.imageUrl ? (
                                <div className="mb-4 bg-black/50 rounded-xl p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={lightboxState.result.imageUrl}
                                        alt={lightboxAsset?.name || 'Asset'}
                                        className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div className="mb-4 bg-black/50 rounded-xl p-8 text-center">
                                    <p className="text-white/50">No image generated yet</p>
                                </div>
                            )}

                            {/* Asset Info and Prompt */}
                            <div className="bg-black/70 rounded-xl p-6 space-y-4">
                                <h3 className="text-xl font-semibold text-white">{lightboxAsset?.name}</h3>
                                {prompt && (
                                    <div>
                                        <p className="text-sm text-white/60 mb-2">Prompt:</p>
                                        <p className="text-white/90 font-mono text-sm whitespace-pre-wrap">{prompt}</p>
                                    </div>
                                )}
                                <Button
                                    onClick={() => setLightboxAssetId(null)}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    Return to Batch
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
