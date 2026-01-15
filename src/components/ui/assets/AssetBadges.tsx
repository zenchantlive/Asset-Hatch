/**
 * Badge Utilities for 3D Assets
 * 
 * Helper functions to render status, rig, and animation badges
 */

import { Box, Layers } from 'lucide-react'
import type { Generated3DAsset } from '@/lib/types/3d-generation'

/**
 * Get status badge component based on 3D asset status
 */
export function getStatusBadge(asset: Generated3DAsset) {
    if (asset.status === 'complete') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-600/20 text-green-300 text-xs">
                <Box className="h-3 w-3" />
                <span>Approved</span>
            </div>
        )
    }
    if (asset.status === 'failed') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 text-red-300 text-xs">
                <Box className="h-3 w-3" />
                <span>Failed</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
            <Box className="h-3 w-3" />
            <span>{asset.status}</span>
        </div>
    )
}

/**
 * Get rig status badge for 3D assets
 */
export function getRigBadge(asset: Generated3DAsset) {
    if (asset.rigged_model_url) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-xs">
                <Box className="h-3 w-3" />
                <span>Rigged</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-white/60 text-xs">
            <Box className="h-3 w-3" />
            <span>Draft</span>
        </div>
    )
}

/**
 * Get animation count badge for 3D assets
 */
export function getAnimationBadge(asset: Generated3DAsset) {
    const count = asset.animated_model_urls ? Object.keys(asset.animated_model_urls).length : 0
    if (count === 0) {
        return null
    }
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
            <Layers className="h-3 w-3" />
            <span>{count}</span>
        </div>
    )
}

/**
 * Get skybox badge
 */
export function getSkyboxBadge() {
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-xs">
            <Box className="h-3 w-3" />
            <span>Skybox</span>
        </div>
    )
}
