/**
 * GenerationLayoutContext
 * 
 * Provides layout state management for the generation UI.
 * Handles asset selection, filtering, search, and panel states.
 * Used by all layout variants (desktop, tablet, mobile).
 */

'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ParsedAsset } from '@/lib/prompt-builder'
import type {
    GenerationLayoutContextValue,
    GenerationLayoutState,
    QueuePanelState,
    SelectedAssetState,
} from '@/lib/types/generation-layout'
import type { AssetGenerationState, GenerationContextValue } from '@/lib/types/generation'
import { useBreakpoint } from '@/hooks/useMediaQuery'
import type { ActionBarState } from '@/lib/types/action-bar'
import { deriveActionBarState } from '@/lib/generation/action-logic'

/**
 * Context for generation layout state
 */
const GenerationLayoutContext = createContext<GenerationLayoutContextValue | null>(null)

/**
 * Hook to access the generation layout context
 * 
 * @returns The layout context value
 * @throws Error if used outside of GenerationLayoutProvider
 */
export function useGenerationLayout(): GenerationLayoutContextValue {
    const context = useContext(GenerationLayoutContext)
    if (!context) {
        throw new Error('useGenerationLayout must be used within GenerationLayoutProvider')
    }
    return context
}

/**
 * Props for the GenerationLayoutProvider
 */
interface GenerationLayoutProviderProps {
    /** Child components that need access to layout state */
    children: React.ReactNode
    /** Optional initial selected asset */
    initialSelectedAsset?: ParsedAsset | null
    /** Generation context for action logic */
    generationContext: GenerationContextValue
    /** Total estimated cost for display */
    totalEstimatedCost?: number
    /** Total actual cost for display */
    totalActualCost?: number
}

/**
 * GenerationLayoutProvider Component
 * 
 * Provides layout state management to all child components.
 * Handles responsive breakpoint detection and state updates.
 */
export function GenerationLayoutProvider({
    children,
    initialSelectedAsset = null,
    generationContext,
    totalEstimatedCost = 0,
    totalActualCost = 0,
}: GenerationLayoutProviderProps) {
    // Get current breakpoint from hook
    const breakpoint = useBreakpoint()

    // Preview panel state
    const [selectedAsset, setSelectedAsset] = useState<SelectedAssetState>({
        asset: initialSelectedAsset,
        source: null,
    })
    const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)
    const [isVariantMode, setIsVariantMode] = useState(false)

    // Queue panel state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [filter, setFilter] = useState<QueuePanelState['filter']>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

    // Mini grid state
    const [scrollPosition, setScrollPosition] = useState(0)
    const [columns, setColumns] = useState(3)
    const [isMiniGridCollapsed, setIsMiniGridCollapsed] = useState(false)

    // Direction grid visibility (for hybrid action bar approach)
    const [isDirectionGridVisible, setDirectionGridVisible] = useState(false)

    // Direction mode state
    const [activeDirectionAsset, setActiveDirectionAsset] = useState<ParsedAsset | null>(null)
    const [selectedDirections, setSelectedDirections] = useState<Set<string>>(new Set())
    const [isGeneratingDirections, setIsGeneratingDirections] = useState(false)

    // Toggle mini-grid collapse
    const toggleMiniGridCollapse = useCallback(() => {
        setIsMiniGridCollapsed(prev => !prev)
    }, [])

    // Select an asset for preview
    const selectAsset = useCallback((asset: ParsedAsset | null, source: SelectedAssetState['source']) => {
        setSelectedAsset({ asset, source })
        // Close prompt editor when switching assets
        setIsPromptEditorOpen(false)
        // Exit variant mode when switching assets
        setIsVariantMode(false)
    }, [])

    // Toggle asset selection for batch operations
    const toggleAssetSelection = useCallback((assetId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(assetId)) {
                next.delete(assetId)
            } else {
                next.add(assetId)
            }

            // Clear selectedAsset when entering multi-select (2+ assets)
            // This ensures batch dashboard shows immediately
            if (next.size >= 2) {
                setSelectedAsset({ asset: null, source: null })
            }

            return next
        })
    }, [])

    // Select all visible assets
    // Accepts an array of asset IDs to select (from parsedAssets)
    const selectAllVisible = useCallback((assetIds?: string[]) => {
        if (assetIds) {
            setSelectedIds(new Set(assetIds))
        }
    }, [])

    // Select only assets that are not approved or awaiting_approval
    // Used for "Generate Remaining" functionality
    const selectRemainingAssets = useCallback((
        assetIds: string[],
        assetStates: Map<string, AssetGenerationState>
    ) => {
        const remainingIds = assetIds.filter(assetId => {
            const state = assetStates.get(assetId)
            return !state ||
                (state.status !== 'approved' && state.status !== 'awaiting_approval')
        })
        setSelectedIds(new Set(remainingIds))
    }, [])

    // Clear all selections
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    // Toggle category collapse
    const toggleCategoryCollapse = useCallback((category: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev)
            if (next.has(category)) {
                next.delete(category)
            } else {
                next.add(category)
            }
            return next
        })
    }, [])

    // Open prompt editor
    const openPromptEditor = useCallback(() => {
        setIsPromptEditorOpen(true)
    }, [])

    // Close prompt editor
    const closePromptEditor = useCallback(() => {
        setIsPromptEditorOpen(false)
    }, [])

    // Enter variant comparison mode
    const enterVariantMode = useCallback(() => {
        setIsVariantMode(true)
    }, [])

    // Exit variant comparison mode
    const exitVariantMode = useCallback(() => {
        setIsVariantMode(false)
    }, [])

    // Build the current state object
    const state: GenerationLayoutState = useMemo(() => ({
        preview: {
            selectedAsset,
            isPromptEditorOpen,
            isVariantMode,
        },
        queue: {
            selectedIds,
            filter,
            searchQuery,
            collapsedCategories,
        },
        miniGrid: {
            scrollPosition,
            columns,
            isCollapsed: isMiniGridCollapsed,
        },
        breakpoint,
    }), [
        selectedAsset,
        isPromptEditorOpen,
        isVariantMode,
        selectedIds,
        filter,
        searchQuery,
        collapsedCategories,
        scrollPosition,
        columns,
        isMiniGridCollapsed,
        breakpoint,
    ])

    // -------------------------------------------------------------------------
    // Unified Action Bar Logic
    // -------------------------------------------------------------------------

    // Derive the action bar state
    const actionBarState = useMemo(() => {
        return deriveActionBarState({
            generationStatus: generationContext.status,
            selectedIds,
            assetStates: generationContext.assetStates as any,
            totalAssets: generationContext.parsedAssets.length,
            isDirectionGridActive: isDirectionGridVisible,
            activeAssetId: selectedAsset.asset?.id,
            selectedModel: generationContext.selectedModel,
            callbacks: {
                onPrepAll: () => {
                    selectRemainingAssets(
                        generationContext.parsedAssets.map(a => a.id),
                        generationContext.assetStates
                    )
                },
                onGenerate: (ids) => generationContext.startGeneration(ids),
                onPause: generationContext.pauseGeneration,
                onResume: generationContext.resumeGeneration,
                onApproveAll: async (ids) => {
                    // Basic implementation: sequential approve
                    for (const id of ids) {
                        const state = generationContext.assetStates.get(id)
                        // Type narrowing: check status first, then access result safely
                        if (state && state.status === 'awaiting_approval') {
                            // After status check, we know result should exist
                            const awaitingState = state as {
                                status: 'awaiting_approval'
                                result: { id: string; imageUrl?: string; prompt?: string; metadata?: Record<string, unknown> }
                                versions?: unknown[]
                            }
                            if (awaitingState.result) {
                                const version = {
                                    id: awaitingState.result.id,
                                    version_number: awaitingState.versions ? awaitingState.versions.length : 1,
                                    image_blob: null,
                                    image_base64: awaitingState.result.imageUrl ?? '',
                                    prompt_used: awaitingState.result.prompt ?? '',
                                    generation_metadata: awaitingState.result.metadata ?? {}
                                }
                                await generationContext.approveAsset(id, version as unknown as Parameters<typeof generationContext.approveAsset>[1])
                            }
                        }
                    }
                },
                onRejectAll: async (ids) => {
                    for (const id of ids) {
                        const state = generationContext.assetStates.get(id)
                        if (state && state.status === 'awaiting_approval') {
                            const awaitingState = state as {
                                status: 'awaiting_approval'
                                result?: { id: string }
                            }
                            if (awaitingState.result?.id) {
                                await generationContext.rejectAsset(id, awaitingState.result.id)
                            }
                        }
                    }
                },
                onGenerateDirections: () => {
                    // Emit a custom event that DirectionGrid listens to
                    window.dispatchEvent(new CustomEvent('generateDirections'))
                },
                onClearSelection: clearSelection
            }
        })
    }, [
        generationContext.status,
        generationContext.assetStates,
        generationContext.parsedAssets,
        generationContext.selectedModel,
        selectedIds,
        selectedAsset.asset?.id,
        generationContext.startGeneration,
        generationContext.pauseGeneration,
        generationContext.resumeGeneration,
        generationContext.approveAsset,
        generationContext.rejectAsset,
        selectRemainingAssets,
        clearSelection,
        isDirectionGridVisible
    ])

    // Execute handlers
    const executeAction = useCallback(() => {
        if (actionBarState.primaryAction.enabled) {
            actionBarState.primaryAction.onExecute()
        }
    }, [actionBarState.primaryAction])

    const executeSecondaryAction = useCallback(() => {
        if (actionBarState.secondaryAction?.enabled) {
            actionBarState.secondaryAction.onExecute()
        }
    }, [actionBarState.secondaryAction])

    // Build the context value
    const contextValue: GenerationLayoutContextValue = useMemo(() => ({
        state,
        selectAsset,
        toggleAssetSelection,
        selectAllVisible,
        selectRemainingAssets,
        clearSelection,
        setFilter,
        setSearchQuery,
        toggleCategoryCollapse,
        openPromptEditor,
        closePromptEditor,
        enterVariantMode,
        exitVariantMode,
        toggleMiniGridCollapse,
        isMiniGridCollapsed,
        totalEstimatedCost,
        totalActualCost,
        actionBarState,
        executeAction,
        executeSecondaryAction,
        isDirectionGridVisible,
        setDirectionGridVisible,
        // Direction mode state
        activeDirectionAsset,
        setActiveDirectionAsset,
        selectedDirections,
        setSelectedDirections,
        generateSelectedDirections: async () => {
            // This will be called by the action bar
            // DirectionGrid handles the actual generation logic
            console.log('generateSelectedDirections called from action bar')
        },
        selectedDirectionCount: selectedDirections.size,
        isGeneratingDirections,
    }), [
        state,
        selectAsset,
        toggleAssetSelection,
        selectAllVisible,
        selectRemainingAssets,
        clearSelection,
        setFilter,
        setSearchQuery,
        toggleCategoryCollapse,
        openPromptEditor,
        closePromptEditor,
        enterVariantMode,
        exitVariantMode,
        toggleMiniGridCollapse,
        isMiniGridCollapsed,
        totalEstimatedCost,
        totalActualCost,
        actionBarState,
        executeAction,
        executeSecondaryAction,
        isDirectionGridVisible,
        setDirectionGridVisible,
        activeDirectionAsset,
        setActiveDirectionAsset,
        selectedDirections,
        setSelectedDirections,
        isGeneratingDirections,
    ])

    return (
        <GenerationLayoutContext.Provider value={contextValue}>
            {children}
        </GenerationLayoutContext.Provider>
    )
}
