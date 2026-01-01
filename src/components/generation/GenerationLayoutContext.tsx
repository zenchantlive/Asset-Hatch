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
import type { AssetGenerationState } from '@/lib/types/generation'
import { useBreakpoint } from '@/hooks/useMediaQuery'



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
    }), [
        state,
        selectAsset,
        toggleAssetSelection,
        selectAllVisible,
        selectRemainingAssets,
        clearSelection,
        toggleCategoryCollapse,
        openPromptEditor,
        closePromptEditor,
        enterVariantMode,
        exitVariantMode,
        toggleMiniGridCollapse,
        isMiniGridCollapsed,
        totalEstimatedCost,
        totalActualCost,
    ])

    return (
        <GenerationLayoutContext.Provider value={contextValue}>
            {children}
        </GenerationLayoutContext.Provider>
    )
}
