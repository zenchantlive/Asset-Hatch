/**
 * Generation Layout Types
 * 
 * Shared types for the responsive generation UI layouts.
 * These types define the common props and state for all layout variants.
 */

import type { ParsedAsset } from '@/lib/prompt-builder'
import type { GenerationContextValue } from '@/lib/types/generation'

/**
 * Layout breakpoint configuration
 * Defines which layout to use at each screen size
 */
export type LayoutBreakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Props for all generation layout components
 */
export interface GenerationLayoutProps {
    /** React children (unused - layouts use context) */
    children?: React.ReactNode
}

/**
 * Currently selected asset for preview
 */
export interface SelectedAssetState {
    /** The asset being previewed */
    asset: ParsedAsset | null
    /** Source of the selection (queue, grid, keyboard) */
    source: 'queue' | 'grid' | 'keyboard' | null
}

/**
 * Preview panel state
 */
export interface PreviewPanelState {
    /** Currently selected asset */
    selectedAsset: SelectedAssetState
    /** Whether the prompt editor is open */
    isPromptEditorOpen: boolean
    /** Whether variant comparison mode is active */
    isVariantMode: boolean
}

/**
 * Queue panel state
 */
export interface QueuePanelState {
    /** Selected asset IDs (for batch operations) */
    selectedIds: Set<string>
    /** Current filter applied */
    filter: 'all' | 'pending' | 'generating' | 'awaiting_approval' | 'approved' | 'failed'
    /** Search query */
    searchQuery: string
    /** Whether categories are collapsed */
    collapsedCategories: Set<string>
}

/**
 * Mini grid panel state
 */
export interface MiniGridState {
    /** Scroll position for virtualization */
    scrollPosition: number
    /** Number of columns based on width */
    columns: number
    /** Whether the mini-grid is collapsed */
    isCollapsed: boolean
}

/**
 * Combined layout state
 */
export interface GenerationLayoutState {
    preview: PreviewPanelState
    queue: QueuePanelState
    miniGrid: MiniGridState
    /** Current breakpoint */
    breakpoint: LayoutBreakpoint
}

/**
 * Layout context value
 */
export interface GenerationLayoutContextValue {
    /** Current layout state */
    state: GenerationLayoutState
    /** Select an asset for preview */
    selectAsset: (asset: ParsedAsset | null, source: SelectedAssetState['source']) => void
    /** Toggle asset selection (for batch operations) */
    toggleAssetSelection: (assetId: string) => void
    /** Select all visible assets */
    selectAllVisible: (assetIds?: string[]) => void
    /** Select only assets that are not approved or awaiting_approval */
    selectRemainingAssets: (assetIds: string[], assetStates: Map<string, any>) => void
    /** Clear all selections */
    clearSelection: () => void
    /** Set filter */
    setFilter: (filter: QueuePanelState['filter']) => void
    /** Set search query */
    setSearchQuery: (query: string) => void
    /** Toggle category collapse */
    toggleCategoryCollapse: (category: string) => void
    /** Open prompt editor */
    openPromptEditor: () => void
    /** Close prompt editor */
    closePromptEditor: () => void
    /** Enter variant comparison mode */
    enterVariantMode: () => void
    /** Exit variant comparison mode */
    exitVariantMode: () => void
    /** Toggle mini-grid collapse state */
    toggleMiniGridCollapse: () => void
    /** Whether the mini-grid is collapsed */
    isMiniGridCollapsed: boolean
}
