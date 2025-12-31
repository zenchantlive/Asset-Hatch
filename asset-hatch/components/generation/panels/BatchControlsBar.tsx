/**
 * BatchControlsBar Component (v2.1 - Simplified)
 * 
 * Cleaner top toolbar with only essential controls visible:
 * - Generate button (primary action)
 * - Model selector
 * - Cost/Time estimate (combined)
 * - Settings gear (advanced options hidden here)
 */

'use client'

import { useState } from 'react'
import { Play, Pause, Square, Settings2, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { GenerateAllWarning } from './GenerateAllWarning'

/**
 * Props for BatchControlsBar
 */
interface BatchControlsBarProps {
    /** Compact mode for mobile layout */
    compact?: boolean
}

/**
 * BatchControlsBar Component
 * 
 * Simplified controls for batch generation operations.
 * Advanced options (workers, auto-approve) hidden in settings popover.
 */
export function BatchControlsBar({ compact = false }: BatchControlsBarProps) {
    // Settings popover state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    // Warning dialog state
    const [showWarning, setShowWarning] = useState(false)

    // Get generation context for state and actions
    const {
        parsedAssets,
        status,
        selectedModel,
        setSelectedModel,
        startGeneration,
        pauseGeneration,
        resumeGeneration,
        assetStates,
    } = useGenerationContext()

    // Get layout context for selection state
    const { state, selectAllVisible, selectRemainingAssets } = useGenerationLayout()
    const selectedCount = state.queue.selectedIds.size

    // Calculate remaining count (assets not approved or awaiting approval)
    const remainingCount = parsedAssets.filter(asset => {
        const state = assetStates.get(asset.id)
        return !state ||
            (state.status !== 'approved' && state.status !== 'awaiting_approval')
    }).length

    // Calculate cost estimate
    const costPerImage = selectedModel === 'flux-2-dev' ? 0.04 : 0.15
    const assetsToGenerate = selectedCount > 0 ? selectedCount : remainingCount
    const estimatedCost = assetsToGenerate * costPerImage

    // Calculate time estimate (rough: 4s per asset for dev, 8s for pro)
    const timePerAsset = selectedModel === 'flux-2-dev' ? 4 : 8
    const estimatedTimeSeconds = assetsToGenerate * timePerAsset
    const estimatedTimeDisplay = estimatedTimeSeconds < 60
        ? `~${estimatedTimeSeconds}s`
        : `~${Math.ceil(estimatedTimeSeconds / 60)}m`

    // Determine button state
    const isGenerating = status === 'generating'
    const isPaused = status === 'paused'
    const canGenerate = parsedAssets.length > 0 && !isGenerating

    // Handle generate button click
    const handleGenerateClick = () => {
        if (isGenerating) {
            pauseGeneration()
        } else if (isPaused) {
            resumeGeneration()
        } else if (selectedCount === 0) {
            // Prep All mode: Just select all assets, don't generate yet
            selectAllVisible(parsedAssets.map(a => a.id))
        } else {
            // Generate mode: Check if batch is large (>5 assets) and show warning
            if (assetsToGenerate > 5) {
                setShowWarning(true)
            } else {
                startGeneration(state.queue.selectedIds)
            }
        }
    }

    // Handle Prep Remaining button click
    const handlePrepRemaining = () => {
        // Just select remaining assets, don't generate yet (same as Prep All)
        selectRemainingAssets(parsedAssets.map(a => a.id), assetStates)
    }

    // Handle warning dialog confirmation
    const handleConfirmGeneration = () => {
        setShowWarning(false)
        startGeneration(state.queue.selectedIds)
    }

    // Compact mode for mobile
    if (compact) {
        return (
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                {/* Generate button */}
                <Button
                    onClick={handleGenerateClick}
                    disabled={!canGenerate && !isGenerating && !isPaused}
                    className={`${isGenerating ? 'bg-yellow-600 hover:bg-yellow-700' : 'aurora-gradient'}`}
                    size="sm"
                >
                    {isGenerating ? (
                        <>
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                        </>
                    ) : isPaused ? (
                        <>
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                        </>
                    ) : selectedCount > 0 ? (
                        <>
                            <Play className="w-4 h-4 mr-1" />
                            Generate
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Prep
                        </>
                    )}
                </Button>

                {/* Cost + Time combined */}
                <span className="text-sm text-white/70">
                    ${estimatedCost.toFixed(2)} • {estimatedTimeDisplay}
                </span>

                {/* Settings gear */}
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Settings2 className="w-4 h-4 text-white/60" />
                </button>
            </div>
        )
    }

    // Full mode for desktop/tablet
    return (
        <div className="relative flex items-center justify-between p-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
            {/* Left: Generate button with count */}
            <div className="flex items-center gap-3">
                {/* Main generate button */}
                <Button
                    onClick={handleGenerateClick}
                    disabled={!canGenerate && !isGenerating && !isPaused}
                    className={`${isGenerating ? 'bg-yellow-600 hover:bg-yellow-700' : 'aurora-gradient'} font-semibold`}
                >
                    {isGenerating ? (
                        <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                        </>
                    ) : isPaused ? (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                        </>
                    ) : selectedCount > 0 ? (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Generate ({selectedCount})
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Prep All
                        </>
                    )}
                </Button>

                {/* Prep Remaining button (show when some assets are already generated) */}
                {!isGenerating && !isPaused && remainingCount > 0 && remainingCount < parsedAssets.length && (
                    <Button
                        variant="outline"
                        onClick={handlePrepRemaining}
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Prep Remaining ({remainingCount})
                    </Button>
                )}

                {/* Stop button (only when generating) */}
                {isGenerating && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            // TODO: Implement stop functionality
                            console.log('Stop generation')
                        }}
                    >
                        <Square className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Center: Model selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">Model:</span>
                <Select
                    value={selectedModel}
                    onValueChange={(value: 'flux-2-dev' | 'flux-2-pro') => setSelectedModel(value)}
                    disabled={isGenerating}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="flux-2-dev">
                            <span className="font-medium">Flux.2 Dev</span>
                            <span className="text-xs text-white/50 ml-2">$0.04</span>
                        </SelectItem>
                        <SelectItem value="flux-2-pro">
                            <span className="font-medium">Flux.2 Pro</span>
                            <span className="text-xs text-white/50 ml-2">$0.15</span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Right: Cost + Time + Settings */}
            <div className="flex items-center gap-4">
                {/* Combined cost and time */}
                <span className="text-sm text-white/70">
                    ${estimatedCost.toFixed(2)} • {estimatedTimeDisplay}
                </span>

                {/* Settings gear */}
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Advanced settings"
                >
                    <Settings2 className="w-5 h-5 text-white/60" />
                </button>
            </div>

            {/* Settings Popover */}
            {isSettingsOpen && (
                <div className="absolute top-full right-4 mt-2 w-72 p-4 bg-black/95 border border-white/10 rounded-xl shadow-2xl z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white/90">Advanced Settings</h3>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="p-1 hover:bg-white/10 rounded"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </div>

                    {/* Workers setting */}
                    <div className="mb-4">
                        <label className="text-sm text-white/70 block mb-2">
                            Parallel Generations
                        </label>
                        <div className="flex bg-black/50 rounded-lg p-0.5">
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${count === 2 // TODO: Use actual worker count from state
                                        ? 'bg-purple-600 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                    disabled={isGenerating}
                                >
                                    {count}x
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                            More = faster but higher cost velocity
                        </p>
                    </div>

                    {/* Auto-approve setting */}
                    <div className="mb-4">
                        <label className="text-sm text-white/70 block mb-2">
                            Auto-Approve
                        </label>
                        <select className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90">
                            <option value="off">Off (Manual review)</option>
                            <option value="selective">Selective (By category)</option>
                            <option value="all">Full Trust (All)</option>
                        </select>
                    </div>

                    {/* Budget limit setting */}
                    <div>
                        <label className="text-sm text-white/70 block mb-2">
                            Session Budget Limit
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-white/50">$</span>
                            <input
                                type="number"
                                placeholder="No limit"
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Warning Dialog */}
            <GenerateAllWarning
                isOpen={showWarning}
                onClose={() => setShowWarning(false)}
                onConfirm={handleConfirmGeneration}
                assetCount={assetsToGenerate}
                estimatedCost={estimatedCost}
                estimatedTime={estimatedTimeDisplay}
            />
        </div>
    )
}
