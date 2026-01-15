/**
 * Asset Grid 2D Component
 * 
 * Renders a grid of 2D asset cards for the assets panel
 */

'use client'

import type { GeneratedAsset } from '@/lib/client-db'

interface AssetGrid2DProps {
    /** 2D assets to display */
    assets: GeneratedAsset[]
    /** Callback when an asset is clicked */
    onAssetClick: (asset: GeneratedAsset) => void
    /** Function to format timestamp for display */
    formatTimestamp: (isoString: string) => string
}

/**
 * AssetGrid2D - Renders a grid of 2D asset cards
 */
export function AssetGrid2D({ assets, onAssetClick, formatTimestamp }: AssetGrid2DProps) {
    if (assets.length === 0) {
        return null
    }

    return (
        <div className="p-4 grid grid-cols-2 gap-4">
            {assets.map((asset) => (
                <div
                    key={asset.id}
                    className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    onClick={() => onAssetClick(asset)}
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
    )
}
