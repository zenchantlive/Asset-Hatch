
import type {
    ActionBarState,
    DeriveActionBarStateParams,
    ActionDefinition
} from '@/lib/types/action-bar'
import { estimateCost } from '@/lib/model-registry'

/**
 * Derives the complete ActionBarState from the current context.
 * This function encapsulates all the business logic for button states.
 */
export function deriveActionBarState(params: DeriveActionBarStateParams): ActionBarState {
    const {
        generationStatus,
        selectedIds,
        assetStates,
        totalAssets,
        isDirectionGridActive,
        activeAssetId,
        callbacks,
        selectedModel
    } = params

    // 1. Calculate selection context
    const selectionCount = selectedIds.size

    // 2. Initial state setup
    const isGenerating = generationStatus === 'generating'
    const isPaused = generationStatus === 'paused'

    // 3. Check for awaiting approvals (Global check)
    // Counts how many assets are waiting for approval (excluding currently selected if any)
    const awaitingApprovalCount = Array.from(assetStates.values())
        .filter(state => state.status === 'awaiting_approval')
        .length

    const hasAwaiting = awaitingApprovalCount > 0

    // -------------------------------------------------------------------------
    // Mode Determination Logic
    // -------------------------------------------------------------------------

    // Default to idle if nothing else matches
    let mode = 'idle'

    if (isDirectionGridActive) {
        mode = 'directions'
    } else if (isGenerating) {
        mode = 'generating'
    } else if (isPaused) {
        mode = 'paused'
    } else if (selectionCount > 0) {
        mode = 'selected'
    } else if (hasAwaiting) {
        // If nothing selected but stuff waiting, show review mode
        mode = 'awaiting'
    }

    // -------------------------------------------------------------------------
    // Action Definition Construction
    // -------------------------------------------------------------------------

    let primaryAction: ActionDefinition = {
        label: 'Prep All',
        icon: 'sparkles',
        variant: 'primary',
        enabled: true,
        onExecute: callbacks.onPrepAll
    }

    let secondaryAction: ActionDefinition | undefined
    let tertiaryAction: ActionDefinition | undefined

    // Cost estimation
    let estimatedCost = 0
    const estimatedTime = ''

    switch (mode) {
        case 'directions':
            // In direction mode, the primary action triggers direction generation
            // The callback is provided by the context and wired to DirectionGrid
            primaryAction = {
                label: 'Generate Directions',
                icon: 'play',
                variant: 'primary',
                enabled: true,
                onExecute: callbacks.onGenerateDirections
            }
            break

        case 'generating':
            primaryAction = {
                label: 'Pause Generation',
                icon: 'pause',
                variant: 'secondary',
                enabled: true,
                onExecute: callbacks.onPause
            }
            // Secondary: Stop?
            break

        case 'paused':
            primaryAction = {
                label: 'Resume Generation',
                icon: 'play',
                variant: 'primary',
                enabled: true,
                onExecute: callbacks.onResume
            }
            break

        case 'selected':
            primaryAction = {
                label: `Generate (${selectionCount})`,
                icon: 'play',
                variant: 'primary',
                enabled: true,
                onExecute: () => callbacks.onGenerate(selectedIds)
            }

            secondaryAction = {
                label: 'Clear Selection',
                icon: 'x',
                variant: 'outline',
                enabled: true,
                onExecute: callbacks.onClearSelection
            }

            // Estimate cost for selected
            estimatedCost = estimateCost(selectedModel, 500, selectionCount)
            break

        case 'awaiting':
            // If we have items waiting for approval
            primaryAction = {
                label: `Approve All (${awaitingApprovalCount})`,
                icon: 'check',
                variant: 'primary',
                enabled: true,
                onExecute: () => {
                    // Find all awaiting IDs
                    const awaitingIds = Array.from(assetStates.entries())
                        .filter(([_, state]) => state.status === 'awaiting_approval')
                        .map(([id]) => id)
                    callbacks.onApproveAll(awaitingIds)
                }
            }

            secondaryAction = {
                label: 'Reject All',
                icon: 'x',
                variant: 'destructive',
                enabled: true,
                onExecute: () => {
                    const awaitingIds = Array.from(assetStates.entries())
                        .filter(([_, state]) => state.status === 'awaiting_approval')
                        .map(([id]) => id)
                    callbacks.onRejectAll(awaitingIds)
                }
            }
            break

        case 'idle':
        default:
            // Default "Prep All" or "Select Remaining"
            // If some are done, show "Prep Remaining" logic
            const totalCompleted = Array.from(assetStates.values())
                .filter(s => s.status === 'approved' || s.status === 'awaiting_approval')
                .length

            const remaining = totalAssets - totalCompleted

            if (remaining > 0 && remaining < totalAssets) {
                primaryAction = {
                    label: `Prep Remaining (${remaining})`,
                    icon: 'sparkles',
                    variant: 'primary',
                    enabled: true,
                    onExecute: callbacks.onPrepAll // This selects remaining
                }
            } else {
                primaryAction = {
                    label: 'Prep All',
                    icon: 'sparkles',
                    variant: 'primary',
                    enabled: true,
                    onExecute: callbacks.onPrepAll
                }
            }
            break
    }

    return {
        mode: mode as any,
        selection: {
            type: selectionCount > 0 ? 'assets' : 'none',
            count: selectionCount,
            ids: selectedIds,
            parentAssetId: activeAssetId
        },
        primaryAction,
        secondaryAction,
        tertiaryAction,
        estimatedCost,
        estimatedTime,
        showModelSelector: !isGenerating && !isPaused,
        showSettings: true
    }
}
