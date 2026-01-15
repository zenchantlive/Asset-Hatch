/**
 * Asset Detail 2D Component
 * 
 * Renders detailed view of a selected 2D asset with image, prompt, metadata, and actions
 */

'use client'

import { Edit2, RotateCcw } from 'lucide-react'
import type { GeneratedAsset } from '@/lib/client-db'
import { Button } from '@/components/ui/button'

interface AssetDetail2DProps {
    /** The selected 2D asset to display */
    asset: GeneratedAsset
    /** Callback to go back to grid view */
    onBack: () => void
    /** Function to format timestamp for display */
    formatTimestamp: (isoString: string) => string
}

/**
 * AssetDetail2D - Renders detailed view of a 2D asset
 */
export function AssetDetail2D({ asset, onBack, formatTimestamp }: AssetDetail2DProps) {
    // TODO: Implement regeneration logic
    const handleRegenerate = () => {
        console.log('Regenerate asset:', asset.id)
    }

    // TODO: Implement prompt editing
    const handleEditPrompt = () => {
        console.log('Edit prompt for asset:', asset.id)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Back button */}
            <div className="p-4 border-b border-white/10">
                <button
                    onClick={onBack}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    ← Back to assets
                </button>
            </div>

            {/* Asset details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-white/90">{asset.asset_id}</h3>
                    <p className="text-sm text-white/60">{asset.status}</p>
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={asset.image_base64 || ''}
                        alt={asset.asset_id}
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
                            onClick={handleEditPrompt}
                            className="text-xs h-6"
                        >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                        </Button>
                    </div>
                    <p className="text-sm text-white/80 font-mono">{asset.prompt}</p>
                </div>

                {/* Generation metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Model:</span>
                        <span className="ml-2 text-white/90 font-medium">{asset.generation_metadata.model}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Seed:</span>
                        <span className="ml-2 text-white/90 font-medium">{asset.generation_metadata.seed}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Cost:</span>
                        <span className="ml-2 text-white/90 font-medium">${asset.generation_metadata.cost.toFixed(4)}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Created:</span>
                        <span className="ml-2 text-white/90 font-medium">{formatTimestamp(asset.created_at)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        className="flex-1"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerate
                    </Button>
                </div>
            </div>
        </div>
    )
}
