/**
 * BatchControlsBar Component (v2.1 - Simplified)
 * 
 * Cleaner top toolbar with only essential controls visible:
 * - Unified Action Bar (Generate/Pause/Resume/Prep)
 * - Model selector
 * - Cost/Time estimate (combined)
 * - Settings gear (advanced options hidden here)
 */

'use client'

import { useState } from 'react'
import { Settings2, X } from 'lucide-react'
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
import { getImageGenerationModels, getModelById, formatCost, estimateCost } from '@/lib/model-registry'
import { UnifiedActionBar } from '../UnifiedActionBar'

// Get available models from registry (curated list)
const availableModels = getImageGenerationModels();

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
        assetStates,
    } = useGenerationContext()

    // Get layout context for selection state and cost data
    const {
        state,
        totalEstimatedCost,
        totalActualCost,
        executeAction // We might use this if we wanted to trigger action programmatically, but UnifiedActionBar handles UI
    } = useGenerationLayout()
    const selectedCount = state.queue.selectedIds.size

    // Calculate remaining count (assets not approved or awaiting approval)
    const remainingCount = parsedAssets.filter(asset => {
        const state = assetStates.get(asset.id)
        return !state ||
            (state.status !== 'approved' && state.status !== 'awaiting_approval')
    }).length

    // Calculate cost estimate using model registry
    const currentModel = getModelById(selectedModel);
    // Logic from original: if selection > 0, count selection, else count remaining
    const assetsToGenerate = selectedCount > 0 ? selectedCount : remainingCount
    const estimatedCost = estimateCost(selectedModel, 500, assetsToGenerate)

    // Determine which cost to display (actual if available, otherwise estimated)
    const hasActualCosts = totalActualCost && totalActualCost > 0
    const displayCost = hasActualCosts ? totalActualCost : (totalEstimatedCost || estimatedCost)
    const costLabel = hasActualCosts ? 'Total:' : 'Est:'

    // Calculate time estimate (rough: multimodal ~4s, dedicated image-gen ~2s)
    const timePerAsset = currentModel?.category === 'image-gen' ? 2 : 4
    const estimatedTimeSeconds = assetsToGenerate * timePerAsset
    const estimatedTimeDisplay = estimatedTimeSeconds < 60
        ? `~${estimatedTimeSeconds}s`
        : `~${Math.ceil(estimatedTimeSeconds / 60)}m`

    // Determine button state for model selector disabling
    const isGenerating = status === 'generating'

    // Handle warning dialog confirmation
    const handleConfirmGeneration = () => {
        setShowWarning(false)
        // Trigger generation directly via context, as this is a specific "Force Confirm" action
        // that bypasses the standard action bar toggle
        startGeneration(state.queue.selectedIds)
    }

    // Compact mode for mobile
    if (compact) {
        return (
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <UnifiedActionBar />

                {/* Cost + Time combined */}
                <span className={`text-sm font-medium ${hasActualCosts ? 'text-green-400' : 'text-white/70'}`}>
                    {costLabel} {formatCost(displayCost, true)} • {estimatedTimeDisplay}
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
            {/* Left: Unified Action Bar */}
            <div className="flex items-center gap-3">
                <UnifiedActionBar />
            </div>

            {/* Center: Model selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">Model:</span>
                <Select
                    value={selectedModel}
                    onValueChange={(value: string) => setSelectedModel(value)}
                    disabled={isGenerating}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {availableModels.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                                <span className="font-medium">{model.displayName}</span>
                                <span className="text-xs text-white/50 ml-2">
                                    {model.pricing.perImage ? formatCost(model.pricing.perImage) : 'Token-based'}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Right: Cost + Time + Settings */}
            <div className="flex items-center gap-4">
                {/* Combined cost and time */}
                <span className={`text-sm font-medium ${hasActualCosts ? 'text-green-400' : 'text-white/70'}`}>
                    {costLabel} {formatCost(displayCost, true)} • {estimatedTimeDisplay}
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
