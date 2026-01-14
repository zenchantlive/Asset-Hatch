/**
 * UnifiedAssetsPanel Component
 *
 * A slide-out panel that displays ALL approved assets (2D, 3D, Skybox) in one unified view.
 * Provides responsive grid layout, categorized sections, and full-screen detail views.
 *
 * Features:
 * - Fetches from multiple databases (2D: generated_assets, 3D: generated_3d_assets)
 * - Responsive grid (1, 2, or 3 columns based on screen size)
 * - Categorized sections (2D Assets, 3D Models, Skybox)
 * - Full-screen detail view with action buttons (Regenerate, Edit Prompt, Download)
 * - Consistent glassmorphism styling
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Image as ImageIcon, Box, Cloud, RotateCcw, Edit2, Download, CheckCircle, Bone, Film } from 'lucide-react'
import { db, type GeneratedAsset } from '@/lib/client-db'
import type { Generated3DAsset } from '@/lib/types/3d-generation'
import { Button } from '@/components/ui/button'

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the UnifiedAssetsPanel component.
 */
interface UnifiedAssetsPanelProps {
    // Project ID to fetch assets for
    projectId: string
    // Whether the panel is visible
    isOpen: boolean
    // Callback to close the panel
    onClose: () => void
}

/**
 * Unified asset type that can represent 2D, 3D, or Skybox assets.
 */
type UnifiedAsset = {
    // Unique identifier
    id: string
    // Asset type for categorization
    type: '2d' | '3d' | 'skybox'
    // Display name
    name: string
    // Prompt used for generation
    prompt: string
    // Preview image URL (data URL for 2D/skybox, placeholder for 3D)
    imageUrl?: string
    // Creation timestamp
    createdAt: string
    // Generation metadata
    metadata: {
        model?: string
        seed?: number
        cost?: number
        durationMs?: number
        isRigged?: boolean
        animationCount?: number
    }
    // Original data for detail view
    rawData: GeneratedAsset | Generated3DAsset
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * UnifiedAssetsPanel - Displays all approved assets in one panel
 *
 * @param projectId - The project ID to fetch assets for
 * @param isOpen - Whether the panel is visible
 * @param onClose - Callback to close the panel
 */
export function UnifiedAssetsPanel({ projectId, isOpen, onClose }: UnifiedAssetsPanelProps) {
    // State for unified asset list
    const [assets, setAssets] = useState<UnifiedAsset[]>([])

    // Currently selected asset for detail view
    const [selectedAsset, setSelectedAsset] = useState<UnifiedAsset | null>(null)

    // Loading state during fetch
    const [isLoading, setIsLoading] = useState(false)

    // Error state if fetch fails
    const [error, setError] = useState<string | null>(null)

    /**
     * Fetch all approved assets from multiple sources and unify them.
     * Wrapped in useCallback to satisfy React Hook dependency rules.
     */
    const loadAssets = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const unifiedAssets: UnifiedAsset[] = []

            // Fetch 2D assets from Dexie (approved status)
            const assets2D = await db.generated_assets
                .where('project_id')
                .equals(projectId)
                .filter(asset => asset.status === 'approved')
                .sortBy('created_at')

            // Map 2D assets to unified format
            assets2D.forEach((asset) => {
                unifiedAssets.push({
                    id: asset.id,
                    type: '2d',
                    name: asset.asset_id,
                    prompt: asset.prompt_used,
                    imageUrl: asset.image_base64 || undefined,
                    createdAt: asset.created_at,
                    metadata: {
                        model: asset.generation_metadata.model,
                        seed: asset.generation_metadata.seed,
                        cost: asset.generation_metadata.cost,
                        durationMs: asset.generation_metadata.duration_ms,
                    },
                    rawData: asset,
                })
            })

            // Fetch 3D assets from Dexie (complete status)
            const assets3D = await db.generated_3d_assets
                .where('project_id')
                .equals(projectId)
                .filter(asset => asset.status === 'complete')
                .sortBy('created_at')

            // Map 3D assets to unified format
            assets3D.forEach((asset) => {
                // Check if this is a skybox asset
                const isSkybox = asset.asset_id.endsWith('-skybox')

                // Count animations
                let animationCount = 0
                if (asset.animated_model_urls) {
                    animationCount = Object.keys(asset.animated_model_urls).length
                }

                unifiedAssets.push({
                    id: asset.id,
                    type: isSkybox ? 'skybox' : '3d',
                    name: asset.asset_id,
                    prompt: asset.prompt_used,
                    imageUrl: isSkybox ? asset.draft_model_url || undefined : undefined,
                    createdAt: asset.created_at,
                    metadata: {
                        isRigged: !!asset.rigged_model_url,
                        animationCount,
                    },
                    rawData: asset,
                })
            })

            // Sort by created_at descending (newest first)
            unifiedAssets.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            // Debug logging
            console.log('Loaded unified assets:', {
                total: unifiedAssets.length,
                '2d': unifiedAssets.filter(a => a.type === '2d').length,
                '3d': unifiedAssets.filter(a => a.type === '3d').length,
                skybox: unifiedAssets.filter(a => a.type === 'skybox').length,
            })

            setAssets(unifiedAssets)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            console.error('Failed to load unified assets:', err)
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    /**
     * Load assets when panel opens.
     * Re-fetch when projectId changes.
     */
    useEffect(() => {
        if (isOpen) {
            loadAssets()
        }
    }, [isOpen, loadAssets])

    /**
     * Format timestamp for display.
     * Converts ISO string to relative time.
     */
    const formatTimestamp = (isoString: string): string => {
        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`

        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    }

    /**
     * Get icon for asset type.
     */
    const getAssetIcon = (type: UnifiedAsset['type']) => {
        switch (type) {
            case '2d':
                return <ImageIcon className="w-4 h-4" />
            case '3d':
                return <Box className="w-4 h-4" />
            case 'skybox':
                return <Cloud className="w-4 h-4" />
        }
    }

    /**
     * Get type badge for asset.
     */
    const getTypeBadge = (asset: UnifiedAsset) => {
        const badges = {
            '2d': { label: '2D', className: 'bg-purple-600/20 text-purple-300' },
            '3d': { label: '3D', className: 'bg-cyan-600/20 text-cyan-300' },
            skybox: { label: 'Skybox', className: 'bg-blue-600/20 text-blue-300' },
        }

        const badge = badges[asset.type]

        return (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${badge.className}`}>
                {getAssetIcon(asset.type)}
                <span>{badge.label}</span>
            </div>
        )
    }

    /**
     * Categorize assets by type for section display.
     */
    const categorizedAssets = {
        '2d': assets.filter(a => a.type === '2d'),
        '3d': assets.filter(a => a.type === '3d'),
        skybox: assets.filter(a => a.type === 'skybox'),
    }

    /**
     * Handle regenerate action for selected asset.
     */
    const handleRegenerate = useCallback(async () => {
        if (!selectedAsset) return

        // TODO: Implement regeneration logic based on asset type
        console.log('Regenerate asset:', selectedAsset.id, selectedAsset.type)
    }, [selectedAsset])

    /**
     * Handle edit prompt action for selected asset.
     */
    const handleEditPrompt = useCallback(() => {
        if (!selectedAsset) return

        // TODO: Implement prompt editing modal
        console.log('Edit prompt for asset:', selectedAsset.id)
    }, [selectedAsset])

    /**
     * Handle download action for selected asset.
     */
    const handleDownload = useCallback(() => {
        if (!selectedAsset) return

        // Create download link
        const link = document.createElement('a')

        if (selectedAsset.type === '2d' || selectedAsset.type === 'skybox') {
            // Download image
            if (selectedAsset.imageUrl) {
                link.href = selectedAsset.imageUrl
                link.download = `${selectedAsset.name}-${Date.now()}.png`
            }
        } else if (selectedAsset.type === '3d') {
            // Download 3D model
            const asset3D = selectedAsset.rawData as Generated3DAsset
            if (asset3D.draft_model_url) {
                link.href = asset3D.draft_model_url
                link.download = `${selectedAsset.name}-${Date.now()}.glb`
            }
        }

        if (link.href) {
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }, [selectedAsset])

    // If not open, render nothing
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop overlay - click to close */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
            />

            {/* Slide-out panel from right */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-[48rem] lg:w-[64rem] bg-black/40 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col animate-slideInRight">
                {/* Header with title and close button */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold font-heading text-white">All Assets</h2>
                        {!isLoading && assets.length > 0 && (
                            <span className="text-sm text-white/60">({assets.length})</span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        aria-label="Close panel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-center text-white/60">
                                <div className="inline-block w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-sm">Loading assets...</p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !error && assets.length === 0 && (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-center text-white/60">
                                <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No approved assets yet</p>
                                <p className="text-xs mt-1">Approved assets will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Grid view - show if not loading, no error, and no asset selected */}
                    {!isLoading && assets.length > 0 && !selectedAsset && (
                        <div className="p-4 space-y-6">
                            {/* 2D Assets Section */}
                            {categorizedAssets['2d'].length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-purple-400" />
                                        2D Assets ({categorizedAssets['2d'].length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categorizedAssets['2d'].map((asset) => (
                                            <div
                                                key={asset.id}
                                                className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedAsset(asset)}
                                            >
                                                {/* Image preview */}
                                                <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                                                    {asset.imageUrl && (
                                                        <img
                                                            src={asset.imageUrl}
                                                            alt={asset.name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    )}
                                                </div>

                                                {/* Asset info */}
                                                <div>
                                                    <h4 className="font-semibold text-white/90 text-sm truncate">{asset.name}</h4>
                                                    <p className="text-xs text-white/60 truncate">{asset.prompt}</p>
                                                </div>

                                                {/* Badges and metadata */}
                                                <div className="flex items-center justify-between text-xs text-white/60">
                                                    {getTypeBadge(asset)}
                                                    <span>{formatTimestamp(asset.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3D Models Section */}
                            {categorizedAssets['3d'].length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                        <Box className="w-4 h-4 text-cyan-400" />
                                        3D Models ({categorizedAssets['3d'].length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categorizedAssets['3d'].map((asset) => (
                                            <div
                                                key={asset.id}
                                                className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedAsset(asset)}
                                            >
                                                {/* 3D placeholder */}
                                                <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                                                    <Box className="w-12 h-12 text-cyan-400/50" />
                                                </div>

                                                {/* Asset info */}
                                                <div>
                                                    <h4 className="font-semibold text-white/90 text-sm truncate">{asset.name}</h4>
                                                    <p className="text-xs text-white/60 truncate">{asset.prompt}</p>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-wrap gap-2">
                                                    {getTypeBadge(asset)}
                                                    {asset.metadata.isRigged && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-xs">
                                                            <Bone className="h-3 w-3" />
                                                            <span>Rigged</span>
                                                        </div>
                                                    )}
                                                    {asset.metadata.animationCount! > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300 text-xs">
                                                            <Film className="h-3 w-3" />
                                                            <span>{asset.metadata.animationCount}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Metadata */}
                                                <div className="text-xs text-white/60">
                                                    {formatTimestamp(asset.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Skybox Section */}
                            {categorizedAssets.skybox.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                        <Cloud className="w-4 h-4 text-blue-400" />
                                        Skybox ({categorizedAssets.skybox.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categorizedAssets.skybox.map((asset) => (
                                            <div
                                                key={asset.id}
                                                className="glass-panel p-3 space-y-3 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedAsset(asset)}
                                            >
                                                {/* Skybox image preview */}
                                                <div className="relative aspect-video w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
                                                    {asset.imageUrl && (
                                                        <img
                                                            src={asset.imageUrl}
                                                            alt={asset.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>

                                                {/* Asset info */}
                                                <div>
                                                    <h4 className="font-semibold text-white/90 text-sm truncate">{asset.name}</h4>
                                                    <p className="text-xs text-white/60 truncate">{asset.prompt}</p>
                                                </div>

                                                {/* Badges and metadata */}
                                                <div className="flex items-center justify-between text-xs text-white/60">
                                                    {getTypeBadge(asset)}
                                                    <span>{formatTimestamp(asset.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* Full-screen detail view */}
                    {selectedAsset && (
                        <div className="flex flex-col h-full">
                            {/* Back button */}
                            <div className="p-4 border-b border-white/10">
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    ← Back to assets
                                </button>
                            </div>

                            {/* Asset details */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {/* Header */}
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-semibold text-white/90 mb-2">{selectedAsset.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {getTypeBadge(selectedAsset)}
                                        {selectedAsset.type === '3d' && selectedAsset.metadata.isRigged && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-xs">
                                                <Bone className="h-3 w-3" />
                                                <span>Rigged</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-600/20 text-green-300 text-xs">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Approved</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Large preview */}
                                <div className="relative w-full max-w-2xl mx-auto aspect-square bg-black/20 rounded-lg overflow-hidden border border-white/10">
                                    {selectedAsset.imageUrl ? (
                                        <img
                                            src={selectedAsset.imageUrl}
                                            alt={selectedAsset.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Box className="w-16 h-16 text-cyan-400/50" />
                                            <p className="absolute bottom-4 text-xs text-white/40">3D Model Viewer</p>
                                        </div>
                                    )}
                                </div>

                                {/* Prompt */}
                                <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
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
                                    <p className="text-sm text-white/80 font-mono break-words">{selectedAsset.prompt}</p>
                                </div>

                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-black/20 rounded p-2 sm:p-3 border border-white/10">
                                        <span className="text-white/60">Created:</span>
                                        <span className="ml-2 text-white/90 font-medium">{formatTimestamp(selectedAsset.createdAt)}</span>
                                    </div>
                                    {selectedAsset.metadata.model && (
                                        <div className="bg-black/20 rounded p-2 sm:p-3 border border-white/10">
                                            <span className="text-white/60">Model:</span>
                                            <span className="ml-2 text-white/90 font-medium truncate block">{selectedAsset.metadata.model}</span>
                                        </div>
                                    )}
                                    {selectedAsset.metadata.seed !== undefined && (
                                        <div className="bg-black/20 rounded p-2 sm:p-3 border border-white/10">
                                            <span className="text-white/60">Seed:</span>
                                            <span className="ml-2 text-white/90 font-mono">{selectedAsset.metadata.seed}</span>
                                        </div>
                                    )}
                                    {selectedAsset.metadata.cost !== undefined && (
                                        <div className="bg-black/20 rounded p-2 sm:p-3 border border-white/10">
                                            <span className="text-white/60">Cost:</span>
                                            <span className="ml-2 text-white/90 font-medium">${selectedAsset.metadata.cost.toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="space-y-3 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Button
                                            onClick={handleRegenerate}
                                            className="w-full aurora-gradient font-semibold"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Regenerate
                                        </Button>
                                        <Button
                                            onClick={handleDownload}
                                            variant="outline"
                                            className="w-full border-white/20"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>

                                {/* Info box */}
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 sm:p-3 text-xs text-white/70">
                                    <strong className="text-purple-300">Tip:</strong> Click &quot;Regenerate&quot; to create a new version with the same prompt, or edit the prompt first for variations.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
