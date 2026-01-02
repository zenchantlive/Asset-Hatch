'use client'

import { useState } from 'react'
import { Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerLeftUp, CornerRightUp, CornerLeftDown, CornerRightDown, Maximize2, Minimize2, ChevronDown, ChevronUp, Play, type LucideIcon } from 'lucide-react'
import { type ParsedAsset } from '@/lib/prompt-builder'
import { type Direction, getDirectionPromptModifier, DIRECTION_LABELS } from '@/lib/direction-utils'
import { useGenerationContext } from './GenerationQueue'
import { v4 as uuidv4 } from 'uuid'

// Redesigned: Image-based direction grid that replaces main preview
interface DirectionGridProps {
    asset: ParsedAsset
    onDirectionSelect?: (direction: Direction) => void
}

// PHASE 5: Map user-friendly directions to grid positions (row, col) - 0-indexed
// Grid is 3x3: BL(0,0) Back(0,1) BR(0,2) / Left(1,0) C(1,1) Right(1,2) / FL(2,0) Front(2,1) FR(2,2)
// USER DECISION: Using user-friendly direction names (Front/Back/Left/Right)
const DIRECTION_MAP: Record<Direction, { r: number; c: number; icon: LucideIcon; label: string }> = {
    'back-left': { r: 0, c: 0, icon: CornerLeftUp, label: 'BL' },
    'back': { r: 0, c: 1, icon: ArrowUp, label: 'Back' },
    'back-right': { r: 0, c: 2, icon: CornerRightUp, label: 'BR' },
    'left': { r: 1, c: 0, icon: ArrowLeft, label: 'Left' },
    'right': { r: 1, c: 2, icon: ArrowRight, label: 'Right' },
    'front-left': { r: 2, c: 0, icon: CornerLeftDown, label: 'FL' },
    'front': { r: 2, c: 1, icon: ArrowDown, label: 'Front' },
    'front-right': { r: 2, c: 2, icon: CornerRightDown, label: 'FR' },
}

export function DirectionGrid({ asset, onDirectionSelect }: DirectionGridProps) {
    const { parsedAssets, assetStates, generateImage, generatedPrompts, addAsset } = useGenerationContext()

    // Track which direction is currently selected/active for viewing
    const [activeDirection, setActiveDirection] = useState<Direction>('front')

    // Track selections for batch generation
    const [selectedForBatch, setSelectedForBatch] = useState<Set<Direction>>(new Set())
    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false)

    // Grid size state: 'small' (default), 'medium', 'large'
    const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('small')

    // Grid collapsed/expanded state
    const [isGridCollapsed, setIsGridCollapsed] = useState(false)

    // Individual direction maximize state
    const [maximizedDirection, setMaximizedDirection] = useState<Direction | null>(null)

    // Get directional children (sibling direction assets)
    const directionChildren = parsedAssets.filter(
        a => a.directionState?.parentAssetId === asset.id
    )

    // Helper to get image for a direction
    const getDirectionImage = (direction: Direction): string | null => {
        const dirAsset = directionChildren.find(
            a => a.directionState?.direction === direction
        )
        if (!dirAsset) return null

        const state = assetStates.get(dirAsset.id)
        if (state?.status === 'approved' || state?.status === 'awaiting_approval') {
            return state.result?.imageUrl || null
        }
        return null
    }

    // Helper to get generation status for a direction
    const getDirectionStatus = (direction: Direction): 'idle' | 'generating' | 'success' | 'error' => {
        const dirAsset = directionChildren.find(
            a => a.directionState?.direction === direction
        )
        if (!dirAsset) return 'idle'

        const state = assetStates.get(dirAsset.id)
        if (!state) return 'idle'

        if (state.status === 'generating') return 'generating'
        if (state.status === 'approved' || state.status === 'awaiting_approval') return 'success'
        if (state.status === 'error') return 'error'
        return 'idle'
    }

    // Handle clicking a direction card
    const handleDirectionClick = (direction: Direction, event?: React.MouseEvent) => {
        // Ctrl/Cmd + click or right-click = toggle batch selection
        if (event && (event.ctrlKey || event.metaKey || event.button === 2)) {
            event.preventDefault()
            setSelectedForBatch(prev => {
                const next = new Set(prev)
                if (next.has(direction)) {
                    next.delete(direction)
                } else {
                    // Only allow selecting ungenerated directions
                    const status = getDirectionStatus(direction)
                    if (status === 'idle') {
                        next.add(direction)
                    }
                }
                return next
            })
        } else {
            // Regular click = set as active for viewing
            setActiveDirection(direction)
            onDirectionSelect?.(direction)
        }
    }

    // Helper: Create a single direction child if it doesn't exist
    const getOrCreateDirectionChild = (direction: Direction): ParsedAsset => {
        // Check if child already exists
        const existing = directionChildren.find(
            a => a.directionState?.direction === direction
        )
        if (existing) return existing

        // Create new direction child
        const newChild: ParsedAsset = {
            ...asset,
            id: uuidv4(),
            name: `${asset.name} (${DIRECTION_LABELS[direction]})`,
            variant: {
                ...asset.variant,
                direction,
            },
            directionState: {
                generated: new Set(),
                parentAssetId: asset.id,
                direction,
                isParent: false,
            },
        }

        // Add to context
        addAsset(newChild)
        return newChild
    }

    // Handle individual direction generation
    const handleGenerateDirection = async (direction: Direction) => {
        const dirAsset = getOrCreateDirectionChild(direction)
        // Pass the asset directly to avoid race condition with newly added assets
        await generateImage(dirAsset.id, dirAsset)
    }

    // Handle batch generation
    const handleBatchGenerate = async () => {
        if (selectedForBatch.size === 0) return

        setIsGeneratingBatch(true)
        try {
            // Generate each selected direction sequentially
            for (const direction of selectedForBatch) {
                const dirAsset = getOrCreateDirectionChild(direction)
                // Pass the asset directly to avoid race condition
                await generateImage(dirAsset.id, dirAsset)
            }
            // Clear selections after successful generation
            setSelectedForBatch(new Set())
        } catch (error) {
            console.error('Batch generation failed:', error)
        } finally {
            setIsGeneratingBatch(false)
        }
    }

    // Cycle grid size
    const cycleGridSize = () => {
        setGridSize(prev => {
            if (prev === 'small') return 'medium'
            if (prev === 'medium') return 'large'
            return 'small'
        })
    }

    // Get grid dimensions based on size
    const getGridClass = () => {
        switch (gridSize) {
            case 'small': return 'max-w-sm'
            case 'medium': return 'max-w-md'
            case 'large': return 'max-w-2xl'
        }
    }

    // Render a single direction card
    const renderCell = (row: number, col: number) => {
        // Center cell (1,1) shows the active/selected direction
        if (row === 1 && col === 1) {
            const activeImage = getDirectionImage(activeDirection)
            const activeStatus = getDirectionStatus(activeDirection)

            return (
                <div key="center" className="aspect-square rounded-lg border-2 border-purple-500/60 bg-black/40 overflow-hidden relative group">
                    {activeStatus === 'generating' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : activeImage ? (
                        <>
                            <img
                                src={activeImage}
                                alt={`${DIRECTION_LABELS[activeDirection]} view`}
                                className="w-full h-full object-contain"
                            />
                            {/* Maximize button - show on hover */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMaximizedDirection(maximizedDirection === activeDirection ? null : activeDirection)
                                }}
                                className="absolute bottom-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title={maximizedDirection === activeDirection ? 'Minimize' : 'Maximize'}
                            >
                                {maximizedDirection === activeDirection ? (
                                    <Minimize2 className="w-4 h-4 text-white/80" />
                                ) : (
                                    <Maximize2 className="w-4 h-4 text-white/80" />
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                            <span className="text-xs uppercase font-bold mb-2">{DIRECTION_LABELS[activeDirection]}</span>
                            <span className="text-[0.625rem] mb-3">Not Generated</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleGenerateDirection(activeDirection)
                                }}
                                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                <Play className="w-3 h-3" />
                                Generate
                            </button>
                        </div>
                    )}
                    {/* Active indicator */}
                    <div className="absolute top-1 right-1 text-[0.625rem] font-bold px-1.5 py-0.5 bg-purple-500 text-white rounded">
                        ACTIVE
                    </div>
                </div>
            )
        }

        // Find which direction maps to this cell
        const dirEntry = Object.entries(DIRECTION_MAP).find(([, val]) => val.r === row && val.c === col)
        if (!dirEntry) return <div key={`${row}-${col}`} className="aspect-square" />

        const [dirKey, dirInfo] = dirEntry
        const direction = dirKey as Direction

        const image = getDirectionImage(direction)
        const status = getDirectionStatus(direction)
        const Icon = dirInfo.icon
        const isActive = activeDirection === direction
        const isSelectedForBatch = selectedForBatch.has(direction)

        return (
            <div
                key={`${row}-${col}`}
                onClick={(e) => handleDirectionClick(direction, e)}
                onContextMenu={(e) => handleDirectionClick(direction, e)}
                className={`
                    aspect-square rounded-md border overflow-hidden relative cursor-pointer transition-all group
                    ${isActive ? 'border-purple-500 ring-2 ring-purple-500/50' :
                        isSelectedForBatch ? 'border-green-500 ring-2 ring-green-500/50' :
                            'border-white/20 hover:border-white/40'}
                    ${status === 'idle' ? 'opacity-50 hover:opacity-75' : ''}
                `}
            >
                {status === 'generating' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : image ? (
                    <>
                        <img
                            src={image}
                            alt={`${dirInfo.label} view`}
                            className="w-full h-full object-contain bg-black/40"
                        />
                        {/* Maximize button - show on hover */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setMaximizedDirection(maximizedDirection === direction ? null : direction)
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title={maximizedDirection === direction ? 'Minimize' : 'Maximize'}
                        >
                            {maximizedDirection === direction ? (
                                <Minimize2 className="w-3 h-3 text-white/80" />
                            ) : (
                                <Maximize2 className="w-3 h-3 text-white/80" />
                            )}
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white/30 hover:text-white/50 transition-colors group-hover:bg-black/30">
                        <Icon className="w-3 h-3 mb-1" />
                        <span className="text-[0.625rem] font-medium mb-2">{dirInfo.label}</span>
                        {/* Generate button - show on hover for idle cards */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateDirection(direction)
                            }}
                            className="mt-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[0.625rem] font-medium transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                        >
                            <Play className="w-2.5 h-2.5" />
                            Generate
                        </button>
                    </div>
                )}

                {/* Batch selection indicator */}
                {isSelectedForBatch && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-[0.625rem]">✓</span>
                    </div>
                )}

                {/* Status indicator */}
                {status === 'error' && !isSelectedForBatch && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
            </div>
        )
    }

    // Get prompt for active direction
    const activePrompt = getDirectionPromptModifier(activeDirection)

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Grid Header with Controls */}
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/70">Direction Variants</span>
                <div className="flex items-center gap-2">
                    {/* Size toggle */}
                    <button
                        onClick={cycleGridSize}
                        className="flex items-center gap-1 text-[0.625rem] text-purple-400 hover:text-purple-300 transition-colors"
                        title="Cycle grid size"
                    >
                        <Maximize2 className="w-3 h-3" />
                        {gridSize === 'small' && 'Small'}
                        {gridSize === 'medium' && 'Medium'}
                        {gridSize === 'large' && 'Large'}
                    </button>
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setIsGridCollapsed(!isGridCollapsed)}
                        className="flex items-center gap-1 text-[0.625rem] text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {isGridCollapsed ? (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                Expand
                            </>
                        ) : (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Collapse
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 3x3 Direction Grid - Collapsible with Dynamic Sizing */}
            {!isGridCollapsed && (
                <>
                    <div className={`w-full ${getGridClass()} mx-auto transition-all duration-300`}>
                        <div className="grid grid-cols-3 gap-1.5 bg-black/20 p-2 rounded-lg border border-white/5">
                            {[0, 1, 2].map(row =>
                                [0, 1, 2].map(col => renderCell(row, col))
                            )}
                        </div>
                        <div className="text-[0.625rem] text-white/40 mt-1 text-center">
                            Ctrl+Click • Right-click to select
                        </div>
                    </div>

                    {/* Batch Generation Bar - Compact */}
                    {selectedForBatch.size > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-medium text-green-400">
                                        {selectedForBatch.size} Direction{selectedForBatch.size > 1 ? 's' : ''} Selected
                                    </div>
                                    <div className="text-[0.625rem] text-white/50">
                                        ${(selectedForBatch.size * 0.04).toFixed(2)} est.
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => setSelectedForBatch(new Set())}
                                        className="px-2 py-1 text-[0.625rem] rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleBatchGenerate}
                                        disabled={isGeneratingBatch}
                                        className="px-3 py-1 text-[0.625rem] rounded bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        {isGeneratingBatch && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                        {isGeneratingBatch ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Direction Info - Compact */}
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white/90">
                                {DIRECTION_LABELS[activeDirection]} Direction
                            </span>
                            <span className="text-[0.625rem] text-white/40 uppercase tracking-wider">
                                {getDirectionStatus(activeDirection)}
                            </span>
                        </div>
                        <div className="text-[0.625rem] text-white/60 leading-snug">
                            {activePrompt}
                        </div>
                    </div>
                </>
            )}

            {/* Inline Enlarged Preview for Maximized Direction */}
            {maximizedDirection && (() => {
                const directionImage = getDirectionImage(maximizedDirection)
                const directionStatus = getDirectionStatus(maximizedDirection)
                const dirAsset = directionChildren.find(a => a.directionState?.direction === maximizedDirection)
                const prompt = dirAsset ? generatedPrompts.get(dirAsset.id) : null

                return (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-4 animate-in slide-in-from-top-2 fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-white">
                                {DIRECTION_LABELS[maximizedDirection]} - Enlarged View
                            </h3>
                            <button
                                onClick={() => setMaximizedDirection(null)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Minimize"
                            >
                                <Minimize2 className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Enlarged Image */}
                        <div className="bg-black/40 rounded-lg p-4 mb-3 flex items-center justify-center min-h-[20rem]">
                            {directionStatus === 'generating' ? (
                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                            ) : directionImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={directionImage}
                                    alt={`${DIRECTION_LABELS[maximizedDirection]} view`}
                                    className="max-h-[20rem] object-contain"
                                />
                            ) : (
                                <p className="text-white/50 text-sm">No image generated yet</p>
                            )}
                        </div>

                        {/* Info */}
                        {prompt && (
                            <div className="text-xs text-white/60 bg-black/20 rounded p-2">
                                <p className="font-mono">{prompt}</p>
                            </div>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}
