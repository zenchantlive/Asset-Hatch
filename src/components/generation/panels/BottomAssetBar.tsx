/**
 * BottomAssetBar Component
 * 
 * Horizontal scrollable bar showing asset thumbnails.
 * Replaces the right sidebar grid.
 * 
 * Features:
 * - Minimizable (shows dots/indicators when minimized)
 * - Horizontal scroll
 * - Animated transitions
 * - Status indicators
 */

'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'

export function BottomAssetBar() {
    const { parsedAssets, assetStates } = useGenerationContext()
    const { state, selectAsset } = useGenerationLayout()
    const selectedAssetId = state.preview.selectedAsset.asset?.id

    // Local minimization state (default expanded)
    const [isMinimized, setIsMinimized] = useState(false)

    /**
     * Get border color class based on asset status
     */
    function getStatusBorderClass(status: string | undefined): string {
        switch (status) {
            case 'generating': return 'border-purple-500 animate-pulse'
            case 'awaiting_approval': return 'border-amber-500'
            case 'approved': return 'border-green-500'
            case 'rejected':
            case 'error': return 'border-red-500'
            default: return 'border-white/20'
        }
    }

    return (
        <div
            className={`border-t border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col relative group/bar ${isMinimized ? 'h-14' : 'h-48'
                }`}
        >
            {/* Handle/Header for toggling - Overlaid when minimized */}
            {/* Handle/Header for toggling - Always visible, better positioning */}
            <button
                className={`absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center cursor-pointer transition-all duration-300 
                    bg-black/80 border border-white/20 rounded-full p-1.5 shadow-lg hover:bg-black hover:scale-110 active:scale-95
                    ${isMinimized ? '-top-6' : '-top-3'}`}
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand Asset Bar" : "Minimize Asset Bar"}
            >
                {isMinimized ? (
                    <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-white" />
                )}
            </button>

            {/* Content Area */}
            <div className={`flex-1 overflow-x-auto overflow-y-hidden transition-all duration-300 ${isMinimized ? 'px-2' : 'px-4 pb-4 pt-6'}`}>
                <div className={`flex h-full items-center min-w-max transition-all duration-300 ${isMinimized ? 'gap-1 sm:gap-2 md:gap-3 justify-center w-full px-4' : 'gap-3'}`}>
                    {parsedAssets.map(asset => {
                        const assetState = assetStates.get(asset.id)
                        const status = assetState?.status
                        const isSelected = selectedAssetId === asset.id
                        const hasImage = (status === 'awaiting_approval' || status === 'approved') && assetState?.result?.imageUrl

                        if (isMinimized) {
                            // Minimized View: Just dots/indicators
                            return (
                                <button
                                    key={asset.id}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        selectAsset(asset, 'grid')
                                    }}
                                    className={`relative transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-150 ${isSelected
                                        ? 'w-4 h-4 ring-2 ring-white ring-offset-2 ring-offset-black scale-110 z-10'
                                        : 'w-2 sm:w-2.5 h-2 sm:h-2.5 hover:z-10'
                                        } rounded-full ${status === 'generating' ? 'bg-purple-500 animate-pulse' :
                                            status === 'awaiting_approval' ? 'bg-amber-500' :
                                                status === 'approved' ? 'bg-green-500' :
                                                    status === 'error' || status === 'rejected' ? 'bg-red-500' :
                                                        'bg-white/20 hover:bg-white/60'
                                        }`}
                                    title={asset.name}
                                />
                            )
                        }

                        // Expanded View: Thumbnails
                        return (
                            <button
                                key={asset.id}
                                onClick={() => selectAsset(asset, 'grid')}
                                className={`relative aspect-square h-full max-h-28 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${getStatusBorderClass(status)
                                    } ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black shadow-lg shadow-purple-500/20' : ''}`}
                                title={asset.name}
                            >
                                {hasImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={assetState!.result!.imageUrl}
                                        alt={asset.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        {status === 'generating' ? (
                                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                        ) : (
                                            <span className="text-[0.625rem] text-white/30 text-center px-1 line-clamp-2 leading-tight">
                                                {asset.name}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Status dot overlay */}
                                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${status === 'generating' ? 'bg-purple-500 animate-pulse' :
                                    status === 'awaiting_approval' ? 'bg-amber-500' :
                                        status === 'approved' ? 'bg-green-500' :
                                            status === 'error' ? 'bg-red-500' :
                                                'hidden'
                                    }`} />
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
