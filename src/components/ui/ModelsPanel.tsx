/**
 * ModelsPanel Component
 * 
 * Slide-out panel for model selection on mobile.
 * Uses simple tappable button cards (NOT Select dropdown - broken on mobile).
 */

'use client'

import { X, Check } from 'lucide-react'
import { getImageGenerationModels, formatCost } from '@/lib/model-registry'

const availableModels = getImageGenerationModels()

interface ModelsPanelProps {
    isOpen: boolean
    onClose: () => void
    selectedModel: string
    onModelChange: (modelId: string) => void
}

export function ModelsPanel({ isOpen, onClose, selectedModel, onModelChange }: ModelsPanelProps) {
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - click to close */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel - starts below header with safe area padding */}
            <div className="fixed top-28 bottom-0 right-0 w-full max-w-sm bg-zinc-900 border-l border-white/10 z-50 flex flex-col shadow-2xl rounded-tl-2xl">
                {/* Header with prominent close button */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                    <h2 className="text-lg font-semibold text-white">Select Model</h2>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors min-w-12 min-h-12 flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Model list - scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-sm text-white/60 mb-4">
                        Tap a model to select it
                    </p>
                    <div className="space-y-3">
                        {availableModels.map((model) => {
                            const isSelected = selectedModel === model.id
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id)
                                        onClose()
                                    }}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left min-h-16 ${isSelected
                                        ? 'bg-purple-500/20 border-purple-500'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/15'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white text-base">
                                                {model.displayName}
                                            </div>
                                            <div className="text-sm text-white/50 mt-1">
                                                {model.category === 'image-gen' ? 'Image Generation' : 'Multimodal'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-purple-400">
                                                {model.pricing.perImage ? formatCost(model.pricing.perImage) : 'Token'}
                                            </span>
                                            {isSelected && (
                                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
