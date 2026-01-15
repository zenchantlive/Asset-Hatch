/**
 * Asset Detail 3D Component
 * 
 * Renders detailed view of a selected 3D asset with interactive 3D viewer,
 * download buttons, metadata, and animation presets
 */

'use client'

import { useState } from 'react'
import { Box } from 'lucide-react'
import type { Generated3DAsset, AnimationPreset } from '@/lib/types/3d-generation'
import { ANIMATION_PRESET_LABELS } from '@/lib/types/3d-generation'
import { Button } from '@/components/ui/button'
import { SimpleSkyboxViewer } from '@/components/3d/generation/SimpleSkyboxViewer'
import { ModelViewer } from '@/components/3d/generation/ModelViewer'
import { getStatusBadge, getRigBadge, getAnimationBadge, getSkyboxBadge } from './AssetBadges'
import { cn } from '@/lib/utils'

/** Suffix used to identify skybox assets */
const SKYBOX_ASSET_SUFFIX = '-skybox'

interface AssetDetail3DProps {
    /** The selected 3D asset to display */
    asset: Generated3DAsset
    /** Callback to go back to grid view */
    onBack: () => void
    /** Function to format timestamp for display */
    formatTimestamp: (isoString: string) => string
}

/**
 * Trigger file download for a given URL
 */
function downloadFile(url: string, filename: string) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * AssetDetail3D - Renders detailed view of a 3D asset with interactive viewers
 */
export function AssetDetail3D({ asset, onBack, formatTimestamp }: AssetDetail3DProps) {
    // Skybox preview mode: spherical 360° or flat 2:1
    const [skyboxPreviewMode, setSkyboxPreviewMode] = useState<'spherical' | 'flat'>('spherical')

    const isSkybox = asset.asset_id.endsWith(SKYBOX_ASSET_SUFFIX)

    return (
        <div className="flex flex-col h-full">
            {/* Back button */}
            <div className="p-4 border-b border-white/10">
                <button
                    onClick={onBack}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    ← Back to assets
                </button>
            </div>

            {/* Asset details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold text-white/90">{asset.asset_id}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {isSkybox ? (
                            getSkyboxBadge()
                        ) : (
                            <>
                                {getStatusBadge(asset)}
                                {getRigBadge(asset)}
                                {getAnimationBadge(asset)}
                            </>
                        )}
                    </div>
                </div>

                {/* Skybox 360° Interactive Preview with Tab Switcher */}
                {isSkybox && asset.draft_model_url && (
                    <div className="space-y-2">
                        {/* Preview Mode Tabs */}
                        <div className="flex gap-2 border-b border-white/10">
                            <button
                                onClick={() => setSkyboxPreviewMode('spherical')}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${skyboxPreviewMode === 'spherical'
                                        ? 'text-cyan-400 border-cyan-400'
                                        : 'text-white/50 hover:text-white/70 border-transparent hover:border-white/20'
                                    }`}
                            >
                                Spherical 360°
                            </button>
                            <button
                                onClick={() => setSkyboxPreviewMode('flat')}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${skyboxPreviewMode === 'flat'
                                        ? 'text-cyan-400 border-cyan-400'
                                        : 'text-white/50 hover:text-white/70 border-transparent hover:border-white/20'
                                    }`}
                            >
                                Flat 2:1
                            </button>
                        </div>

                        {/* Preview Content */}
                        {skyboxPreviewMode === 'spherical' ? (
                            <div className="h-[300px] rounded-lg border border-white/10 overflow-hidden">
                                <SimpleSkyboxViewer
                                    imageUrl={asset.draft_model_url}
                                    autoRotate={false}
                                />
                            </div>
                        ) : (
                            <div className="relative rounded-lg border border-white/10 overflow-hidden bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={asset.draft_model_url}
                                    alt="Skybox flat preview"
                                    className="w-full h-auto"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 3D Model Interactive Preview */}
                {!isSkybox && asset.draft_model_url && (
                    <div className="h-[300px] rounded-lg border border-white/10 overflow-hidden">
                        <ModelViewer
                            modelUrl={asset.draft_model_url}
                            autoRotate={true}
                        />
                    </div>
                )}

                {/* No model URL available placeholder */}
                {!asset.draft_model_url && (
                    <div className="h-[200px] rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
                        <div className="text-center text-white/40">
                            <Box className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">No model available</p>
                        </div>
                    </div>
                )}

                {/* Prompt */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-white/60 font-semibold mb-1">Prompt:</p>
                    <p className="text-sm text-white/80 font-mono">{asset.prompt_used}</p>
                </div>

                {/* Model URLs with download handlers */}
                <div className="space-y-2">
                    <p className="text-xs text-white/60 font-semibold">Model Files:</p>
                    {asset.draft_model_url && (
                        <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                            <span className="text-sm text-white/80">
                                {isSkybox ? "Skybox Image" : "Draft Model"}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => downloadFile(
                                    asset.draft_model_url!,
                                    isSkybox ? `${asset.asset_id}.jpg` : `${asset.asset_id}-draft.glb`
                                )}
                            >
                                Download
                            </Button>
                        </div>
                    )}
                    {asset.rigged_model_url && (
                        <div className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                            <span className="text-sm text-white/80">Rigged Model</span>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => downloadFile(asset.rigged_model_url!, `${asset.asset_id}-rigged.glb`)}
                            >
                                Download
                            </Button>
                        </div>
                    )}
                    {asset.animated_model_urls && Object.entries(asset.animated_model_urls).length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-white/60 font-semibold">Animated Models:</p>
                            {Object.entries(asset.animated_model_urls).map(([preset, url]) => (
                                <div key={preset} className="flex items-center justify-between bg-black/20 rounded p-2 border border-white/10">
                                    <span className="text-sm text-white/80">
                                        {ANIMATION_PRESET_LABELS[preset as AnimationPreset] || preset}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => downloadFile(url, `${asset.asset_id}-${preset}.glb`)}
                                    >
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Created:</span>
                        <span className="ml-2 text-white/90 font-medium">{formatTimestamp(asset.created_at)}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2 border border-white/10">
                        <span className="text-white/60">Status:</span>
                        <span className="ml-2 text-white/90 font-medium capitalize">{asset.status}</span>
                    </div>
                </div>

                {/* Animations section with approval status */}
                {asset.animated_model_urls && Object.keys(asset.animated_model_urls).length > 0 && (
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white/60 font-semibold mb-2">Animations:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(asset.animated_model_urls).map((preset) => {
                                const status = asset.animationApprovals?.[preset as AnimationPreset] || 'pending'
                                return (
                                    <div key={preset} className="flex items-center gap-2 bg-black/20 rounded px-2 py-1">
                                        <span className="text-xs text-white/80">
                                            {ANIMATION_PRESET_LABELS[preset as AnimationPreset] || preset}
                                        </span>
                                        <span className={cn(
                                            'text-xs px-1.5 py-0.5 rounded',
                                            {
                                                'bg-green-600/20 text-green-300': status === 'approved',
                                                'bg-red-600/20 text-red-300': status === 'rejected',
                                                'bg-yellow-600/20 text-yellow-300': status === 'pending',
                                            }
                                        )}>
                                            {status}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
