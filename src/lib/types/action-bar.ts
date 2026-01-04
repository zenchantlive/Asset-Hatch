/**
 * Action Bar Types
 * 
 * Centralized type definitions for the unified action bar system.
 * The action bar adapts its behavior based on current selection,
 * generation state, and pending approvals.
 */

// -----------------------------------------------------------------------------
// Action Mode - Determines which button state to show
// -----------------------------------------------------------------------------

/**
 * ActionMode represents the current operational state of the action bar.
 * The mode determines button labels, icons, and available actions.
 */
export type ActionMode =
    | 'idle'           // No selection, show "Prep All"
    | 'selected'       // Assets selected, show "Generate (N)"
    | 'generating'     // Generation in progress, show "Pause"
    | 'paused'         // Generation paused, show "Resume"
    | 'awaiting'       // Has assets awaiting_approval, show "Review (N)"
    | 'directions'     // Direction grid active, context-specific actions

// -----------------------------------------------------------------------------
// Selection Context - What type of items are selected
// -----------------------------------------------------------------------------

/**
 * SelectionContext provides details about what is currently selected.
 * This helps the action bar determine appropriate labels and actions.
 */
export interface SelectionContext {
    /** Type of selection */
    type: 'assets' | 'directions' | 'versions' | 'none'

    /** Number of items selected */
    count: number

    /** IDs of selected items */
    ids: Set<string>

    /** Parent asset ID (for direction/version selection) */
    parentAssetId?: string
}

// -----------------------------------------------------------------------------
// Action Definition - Describes an actionable button
// -----------------------------------------------------------------------------

/**
 * ActionDefinition describes a button's configuration.
 * Used for both primary and secondary action buttons.
 */
export interface ActionDefinition {
    /** Button label text */
    label: string

    /** Optional count to display in label (e.g., "Generate (5)") */
    count?: number

    /** Icon identifier (matched to Lucide icon) */
    icon: 'play' | 'pause' | 'sparkles' | 'check' | 'x' | 'square' | 'refresh'

    /** Button variant for styling */
    variant: 'primary' | 'secondary' | 'destructive' | 'outline'

    /** Whether the action is currently executable */
    enabled: boolean

    /** Callback to execute the action */
    onExecute: () => void

    /** Optional loading state */
    isLoading?: boolean
}

// -----------------------------------------------------------------------------
// Action Bar State - Complete state for rendering the action bar
// -----------------------------------------------------------------------------

/**
 * ActionBarState is the complete state object consumed by the UnifiedActionBar component.
 * It contains all information needed to render the action bar correctly.
 */
export interface ActionBarState {
    /** Current operational mode */
    mode: ActionMode

    /** Selection context details */
    selection: SelectionContext

    /** Primary action button configuration */
    primaryAction: ActionDefinition

    /** Optional secondary action (e.g., approve when items awaiting) */
    secondaryAction?: ActionDefinition

    /** Optional tertiary action (e.g., reject when items awaiting) */
    tertiaryAction?: ActionDefinition

    /** Cost estimate for the action (if applicable) */
    estimatedCost?: number

    /** Time estimate for the action (if applicable) */
    estimatedTime?: string

    /** Whether to show the model selector */
    showModelSelector: boolean

    /** Whether to show the settings gear */
    showSettings: boolean
}

// -----------------------------------------------------------------------------
// Action Bar Context Value - Provided by context to consumers
// -----------------------------------------------------------------------------

/**
 * ActionBarContextValue is the interface exposed by the ActionBar context.
 * Components use this to access and modify action bar state.
 */
export interface ActionBarContextValue {
    /** Current action bar state */
    state: ActionBarState

    /** Execute the primary action */
    executePrimary: () => void

    /** Execute the secondary action (if available) */
    executeSecondary?: () => void

    /** Execute the tertiary action (if available) */
    executeTertiary?: () => void

    /** Update selection context (called by panels when selection changes) */
    updateSelection: (context: SelectionContext) => void

    /** Force a specific mode (for edge cases) */
    forceMode?: (mode: ActionMode) => void
}

// -----------------------------------------------------------------------------
// Helper Types - For action derivation logic
// -----------------------------------------------------------------------------

/**
 * GenerationStatus from the GenerationQueue context
 */
export type GenerationStatus = 'idle' | 'generating' | 'paused' | 'completed'

/**
 * AssetStatus for determining approval state
 */
export type AssetApprovalStatus =
    | 'pending'
    | 'generating'
    | 'awaiting_approval'
    | 'approved'
    | 'rejected'
    | 'error'

/**
 * DeriveActionBarStateParams - Input for deriving action bar state
 */
export interface DeriveActionBarStateParams {
    /** Current generation status */
    generationStatus: GenerationStatus

    /** Selected asset/direction IDs */
    selectedIds: Set<string>

    /** Map of asset states for status checking */
    assetStates: Map<string, { status: AssetApprovalStatus }>

    /** Total parsed assets count */
    totalAssets: number

    /** Current view context (is direction grid active?) */
    isDirectionGridActive: boolean

    /** Active asset for direction context */
    activeAssetId?: string

    /** Callbacks for actions */
    callbacks: {
        onPrepAll: () => void
        onGenerate: (ids: Set<string>) => void
        onPause: () => void
        onResume: () => void
        onApproveAll: (ids: string[]) => void
        onRejectAll: (ids: string[]) => void
        onGenerateDirections: () => void
        onClearSelection: () => void
    }

    /** Selected model for cost estimation */
    selectedModel: string
}
