/**
 * Asset Grid 3D Component
 * 
 * Renders a grid of 3D asset cards (models and skyboxes) for the assets panel
 */

'use client'

import { Box } from 'lucide-react'
import type { Generated3DAsset } from '@/lib/types/3d-generation'
import { ModelViewer } from '@/components/3d/generation/ModelViewer'
import { getStatusBadge, getRigBadge, getAnimationBadge, getSkyboxBadge } from './AssetBadges'

/** Suffix used to identify skybox assets */
const SKYBOX_ASSET_SUFFIX = '-skybox'

interface AssetGrid3DProps {
    /** 3D assets to display */
    assets: Generated3DAsset[]
    /** Callback when an asset is clicked */
    onAssetClick: (asset: Generated3DAsset) => void
    /** Function to format timestamp for display */
    formatTimestamp: (isoString: string) => string
}

/**
 * AssetGrid3D - Renders a grid of 3D asset cards with live ModelViewer previews
 */
export function AssetGrid3D({ assets, onAssetClick, formatTimestamp }: AssetGrid3DProps) {
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
                    {/* Use image for Skybox, ModelViewer for 3D models, placeholder otherwise */}
                    {asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) && asset.draft_model_url ? (
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
                        {asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX) ? (
                            getSkyboxBadge()
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
    )
}
