/**
 * UnifiedActionBar Component
 * 
 * Renders contextual action buttons based on the current generation state.
 * Uses the derived actionBarState from GenerationLayoutContext.
 */

'use client'

import {
    Zap,
    Play,
    Pause,
    Check,
    X,
    Loader2,
    Square,
    RefreshCw,
    Sparkles,
    Compass
} from 'lucide-react'
import { useGenerationLayout } from './GenerationLayoutContext'
import { cn } from '@/lib/utils'
import type { ActionDefinition } from '@/lib/types/action-bar'

// Icon mapping - returns the actual component, not a new instance
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'play': Play,
    'pause': Pause,
    'sparkles': Sparkles,
    'check': Check,
    'x': X,
    'square': Square,
    'refresh': RefreshCw,
    'zap': Zap,
    'loader': Loader2,
    'compass': Compass,
}

/**
 * Unified Action Bar Component
 * 
 * Renders the primary, secondary, and tertiary actions based on the 
 * current context derived by GenerationLayoutContext.
 */
export function UnifiedActionBar({ className, compact = false }: { className?: string; compact?: boolean }) {
    const {
        actionBarState,
        executeAction,
        executeSecondaryAction,
        isDirectionGridVisible,
        selectedDirectionCount,
        isGeneratingDirections,
    } = useGenerationLayout()

    // If no action bar state, render nothing
    if (!actionBarState) return null

    // Base bar styles - smaller padding in compact mode
    const barStyles = compact
        ? "p-2 rounded-none"
        : "p-2 rounded-xl"

    // In direction mode, show direction-specific controls
    if (isDirectionGridVisible) {
        return (
            <div className={cn(
                "flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-white/10 transition-all duration-300",
                barStyles,
                className
            )}>
                {/* Direction Mode Context (Left) */}
                <div className="flex-1 flex items-center gap-2 px-2">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">
                        Direction Mode
                    </span>
                    {selectedDirectionCount > 0 && (
                        <span className="font-medium text-white bg-purple-500/20 px-2 py-0.5 rounded-full text-xs">
                            {selectedDirectionCount} selected
                        </span>
                    )}
                </div>

                {/* Direction Actions (Right) - Use executeAction which is wired to onGenerateDirections */}
                <div className="flex items-center gap-2">
                    {executeAction && (
                        <button
                            onClick={executeAction}
                            disabled={selectedDirectionCount === 0 || isGeneratingDirections}
                            className={cn(
                                "relative flex items-center justify-center gap-2 rounded-lg text-sm font-medium",
                                "transition-all duration-150 active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                                "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25",
                                compact ? "px-3 py-2 min-h-11" : "px-4 py-2.5"
                            )}
                        >
                            {isGeneratingDirections ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            <span>
                                {isGeneratingDirections ? 'Generating...' : `Generate${selectedDirectionCount > 0 ? ` (${selectedDirectionCount})` : ''}`}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // Determine if we should show selection count
    const showSelectionControls = actionBarState.selection.count > 0

    return (
        <div className={cn(
            "flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-white/10 transition-all duration-300",
            barStyles,
            className
        )}>
            {/* Selection Context (Left) */}
            <div className="flex-1 min-w-0 flex items-center gap-3 px-2">
                {showSelectionControls ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="font-medium text-white bg-primary/20 px-2 py-0.5 rounded-full text-xs">
                            {actionBarState.selection.count}
                        </span>
                        <span className="truncate">Selected</span>
                    </div>
                ) : (
                    <div className="text-sm text-zinc-400 truncate">
                        Ready to generate
                    </div>
                )}
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-2">

                {/* Secondary Action (Dismiss/Reject/Clear) */}
                {actionBarState.secondaryAction && executeSecondaryAction && (
                    <ActionButton
                        action={actionBarState.secondaryAction}
                        onClick={executeSecondaryAction}
                    />
                )}

                {/* Primary Action (Generate/Approve/Prep) */}
                {executeAction && (
                    <ActionButton
                        action={actionBarState.primaryAction}
                        onClick={executeAction}
                    />
                )}
            </div>
        </div>
    )
}

/**
 * Individual Action Button
 * 
 * Renders a single action button with appropriate styling and icon.
 */
function ActionButton({
    action,
    onClick,
}: {
    action: ActionDefinition
    onClick: () => void
}) {
    // Get the icon component from the map
    const IconComponent = ICON_MAP[action.icon] || Play
    const isDisabled = !action.enabled
    const isLoading = action.isLoading

    // Variant styles
    const variantStyles: Record<string, string> = {
        primary: "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25",
        secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        outline: "bg-transparent text-zinc-300 border border-white/10 hover:bg-white/5"
    }

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={cn(
                // Base styles
                "relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                // Transition
                "transition-all duration-150 active:scale-95",
                // Disabled state
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                // Variant
                variantStyles[action.variant] || variantStyles.primary,
            )}
        >
            {/* Icon - show loader if loading, otherwise the action icon */}
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <IconComponent className="w-4 h-4" />
            )}

            {/* Label with optional count */}
            <span>
                {action.label}
                {action.count !== undefined && action.count > 0 && (
                    <span className="ml-1">({action.count})</span>
                )}
            </span>
        </button>
    )
}
