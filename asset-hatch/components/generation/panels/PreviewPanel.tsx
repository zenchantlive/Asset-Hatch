/**
 * PreviewPanel Component (v2.1)
 * 
 * Center panel showing the currently selected asset with:
 * - Moderate-size image with maximize button [⤢]
 * - Asset name, category, and status badge
 * - Full prompt display (not truncated) with edit button
 * - Approve/Reject/Regenerate buttons
 * - Image lightbox on click or maximize
 */

'use client'

import { useState } from 'react'
import { Play, Check, X, RotateCcw, Edit3, Loader2, Maximize2, X as Close, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { BatchPreviewContent } from './BatchPreviewContent'

/**
 * Props for PreviewPanel
 */
interface PreviewPanelProps {
    /** Compact mode for mobile layout */
    compact?: boolean
}

/**
 * PreviewPanel Component
 * 
 * Main preview area showing selected asset details and actions.
 * Includes lightbox for full-size image viewing.
 */
export function PreviewPanel({ compact = false }: PreviewPanelProps) {
    // Lightbox state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)

    // Get contexts
    const {
        parsedAssets,
        assetStates,
        generatedPrompts,
        generatePrompt,
        generateImage,
        approveAsset,
        rejectAsset,
    } = useGenerationContext()

    const { state, openPromptEditor, selectAsset } = useGenerationLayout()

    const { selectedAsset } = state.preview

    // Resolve asset: Use explicitly selected Preview asset OR fallback to single selection in queue
    let asset = selectedAsset.asset

    // Fallback: If no direct preview asset, but exactly 1 item is selected in queue, show that one
    if (!asset && state.queue.selectedIds.size === 1) {
        const singleSelectedId = state.queue.selectedIds.values().next().value
        asset = parsedAssets.find(a => a.id === singleSelectedId) || null
    }

    // Track if we're generating the prompt
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)

    // Get the current state of the selected asset
    const assetState = asset ? assetStates.get(asset.id) : null
    const currentPrompt = asset ? generatedPrompts.get(asset.id) : null

    // Find current asset index for prev/next navigation
    const currentIndex = asset ? parsedAssets.findIndex(a => a.id === asset.id) : -1

    // Handle generate prompt
    const handleGeneratePrompt = async () => {
        if (!asset) return
        setIsGeneratingPrompt(true)
        try {
            await generatePrompt(asset)
        } catch (err) {
            console.error('Failed to generate prompt:', err)
        } finally {
            setIsGeneratingPrompt(false)
        }
    }

    // Handle generate image
    const handleGenerateImage = async () => {
        if (!asset) return
        await generateImage(asset.id)
    }

    // Handle approve
    const handleApprove = async () => {
        if (!asset) return
        await approveAsset(asset.id)
    }

    // Handle reject
    const handleReject = () => {
        if (!asset) return
        rejectAsset(asset.id)
    }

    // Navigate to prev/next asset (for lightbox)
    const navigateTo = (direction: 'prev' | 'next') => {
        if (currentIndex === -1) return
        const newIndex = direction === 'prev'
            ? Math.max(0, currentIndex - 1)
            : Math.min(parsedAssets.length - 1, currentIndex + 1)
        if (newIndex !== currentIndex) {
            selectAsset(parsedAssets[newIndex], 'keyboard')
        }
    }

    // Check for multi-selection
    const selectedCount = state.queue.selectedIds.size
    const isMultiSelect = selectedCount > 1

    // Multi-selection view
    if (isMultiSelect) {
        return <BatchPreviewContent selectedIds={state.queue.selectedIds} />
    }

    // No asset selected state
    if (!asset) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-24 h-24 mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <span className="text-4xl opacity-50">🎨</span>
                </div>
                <h3 className="text-lg font-medium text-white/80 mb-2">No Asset Selected</h3>
                <p className="text-sm text-white/50 max-w-md">
                    Select an asset from the queue to preview it here.
                    You can generate prompts, view results, and approve assets.
                </p>
            </div>
        )
    }

    // Determine what to show based on asset state
    const isGenerating = assetState?.status === 'generating'
    const isAwaitingApproval = assetState?.status === 'awaiting_approval'
    const isApproved = assetState?.status === 'approved'
    const hasError = assetState?.status === 'error'
    const hasResult = isAwaitingApproval || isApproved

    // Get the image URL if available
    const imageUrl = hasResult && assetState?.result?.imageUrl

    return (
        <>
            <div className={`flex flex-col h-full ${compact ? 'p-3' : 'p-6'}`}>
                {/* Image section with maximize button */}
                {/* Image section with maximize button - Flexible height */}
                <div className={`relative bg-black/30 rounded-xl border border-white/10 overflow-hidden mb-4 ${compact
                    ? 'flex-shrink-0 h-48'
                    : 'flex-1 min-h-[16rem] max-h-[50vh]'
                    }`}>
                    {isGenerating ? (
                        // Generating state
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                            <p className="text-white/70">Generating image...</p>
                        </div>
                    ) : imageUrl ? (
                        // Has image - clickable for lightbox
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={asset.name}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => setIsLightboxOpen(true)}
                            />
                            {/* Maximize button */}
                            <button
                                onClick={() => setIsLightboxOpen(true)}
                                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                                title="View full size"
                            >
                                <Maximize2 className="w-4 h-4 text-white/80" />
                            </button>
                        </>
                    ) : (
                        // No image yet
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="text-2xl opacity-50">🖼️</span>
                            </div>
                            <p className="text-white/50 text-sm">No image generated yet</p>
                        </div>
                    )}
                </div>

                {/* Asset info section */}
                <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h2 className={`font-semibold text-white/90 ${compact ? 'text-base' : 'text-lg'}`}>
                                {asset.name}
                            </h2>
                            <p className="text-sm text-white/60">{asset.category}</p>
                        </div>

                        {/* Status badge */}
                        {assetState && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isGenerating ? 'bg-purple-500/20 text-purple-400' :
                                isAwaitingApproval ? 'bg-amber-500/20 text-amber-400' :
                                    isApproved ? 'bg-green-500/20 text-green-400' :
                                        hasError ? 'bg-red-500/20 text-red-400' :
                                            'bg-white/10 text-white/60'
                                }`}>
                                {isGenerating ? 'Generating...' :
                                    isAwaitingApproval ? 'Awaiting Review' :
                                        isApproved ? 'Approved' :
                                            hasError ? 'Failed' :
                                                'Pending'}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {asset.description && (
                        <p className="text-sm text-white/70">{asset.description}</p>
                    )}
                </div>

                {/* Prompt section - full visible, not truncated */}
                <div className="mb-4 flex-1 min-h-0 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white/70">Prompt</span>
                        <button
                            onClick={openPromptEditor}
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <Edit3 className="w-3 h-3" />
                            Edit
                        </button>
                    </div>

                    {currentPrompt ? (
                        <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                            <p className="text-sm text-white/80 font-mono whitespace-pre-wrap">
                                {currentPrompt}
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                            <p className="text-sm text-white/50 italic mb-2">No prompt generated</p>
                            <Button
                                onClick={handleGeneratePrompt}
                                disabled={isGeneratingPrompt}
                                size="sm"
                            >
                                {isGeneratingPrompt ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Prompt'
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    {/* Approve/Reject (when awaiting approval) */}
                    {isAwaitingApproval && (
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleApprove}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 px-8"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                onClick={handleReject}
                                variant="destructive"
                                size="sm"
                                className="shadow-lg shadow-red-900/20 px-8"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Generate button (when pending with prompt) */}
                    {!assetState && currentPrompt && (
                        <Button
                            onClick={handleGenerateImage}
                            className="w-full aurora-gradient font-semibold"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Generate Image
                        </Button>
                    )}

                    {/* Regenerate button (when has result or error) */}
                    {(hasResult || hasError) && (
                        <div>
                            <Button
                                onClick={handleGenerateImage}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Regenerate
                            </Button>
                        </div>
                    )}

                    {/* Error message */}
                    {hasError && assetState?.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">
                                Error: {assetState.error.message || 'Generation failed'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && imageUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <Close className="w-6 h-6 text-white" />
                    </button>

                    {/* Navigation - Previous */}
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateTo('prev') }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                    )}

                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={asset.name}
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Navigation - Next */}
                    {currentIndex < parsedAssets.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateTo('next') }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    )}

                    {/* Asset name caption */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-lg">
                        <p className="text-white font-medium">{asset.name}</p>
                        <p className="text-white/60 text-sm text-center">{currentIndex + 1} of {parsedAssets.length}</p>
                    </div>
                </div>
            )}
        </>
    )
}
