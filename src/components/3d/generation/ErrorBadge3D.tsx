"use client";

/**
 * ErrorBadge3D Component
 * 
 * Tappable status badge that expands to show explanation and action button.
 * Used for displaying expired model warnings and other 3D asset errors.
 * 
 * Design: Slack-style honest, slightly humorous messaging.
 */

import { useState } from "react";
import { Clock, AlertTriangle, Wifi, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error types that can occur when loading 3D assets
export type ErrorType = "expired" | "failed" | "network";

// Error content with Slack-style humorous copy
const ERROR_CONTENT: Record<
    ErrorType,
    { icon: typeof Clock; badge: string; message: string; color: string }
> = {
    // Expired URL error - 403 from Tripo CDN
    expired: {
        icon: Clock,
        badge: "🕐 Model Expired",
        message:
            "This model's download link has timed out. Tripo3D links are like concert tickets — they don't last forever! Hit regenerate to get a fresh one.",
        color: "amber",
    },
    // Generation failed error
    failed: {
        icon: AlertTriangle,
        badge: "💥 Generation Failed",
        message:
            "Well, that didn't work. The 3D gods weren't feeling it. Give it another shot?",
        color: "red",
    },
    // Network connectivity error
    network: {
        icon: Wifi,
        badge: "📡 Connection Lost",
        message:
            "Can't reach the model right now. Check your internet or try again in a bit.",
        color: "blue",
    },
};

interface ErrorBadge3DProps {
    /** Type of error to display */
    errorType: ErrorType;
    /** Callback when user clicks the action button (regenerate) */
    onAction?: () => void;
    /** Optional: control expanded state externally */
    isExpanded?: boolean;
    /** Optional: callback when expansion toggled */
    onToggle?: (expanded: boolean) => void;
    /** Text for action button (defaults to "Regenerate") */
    actionLabel?: string;
}

/**
 * ErrorBadge3D - Tappable badge that expands to show explanation
 * 
 * On mobile, users tap the badge to expand and see the full explanation.
 * On desktop, they can also click.
 */
export function ErrorBadge3D({
    errorType,
    onAction,
    isExpanded: controlledExpanded,
    onToggle,
    actionLabel = "Regenerate",
}: ErrorBadge3DProps) {
    // Use internal state if not controlled externally
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isExpanded = controlledExpanded ?? internalExpanded;

    // Get error content based on type
    const content = ERROR_CONTENT[errorType];
    const Icon = content.icon;

    // Color classes based on error type with explicit type for safety
    const colorMap = {
        amber: {
            badge: "bg-amber-500/20 border-amber-500/30 text-amber-400",
            card: "bg-amber-500/10 border-amber-500/30",
            button: "bg-amber-600 hover:bg-amber-700",
        },
        red: {
            badge: "bg-red-500/20 border-red-500/30 text-red-400",
            card: "bg-red-500/10 border-red-500/30",
            button: "bg-red-600 hover:bg-red-700",
        },
        blue: {
            badge: "bg-blue-500/20 border-blue-500/30 text-blue-400",
            card: "bg-blue-500/10 border-blue-500/30",
            button: "bg-blue-600 hover:bg-blue-700",
        },
    } as const;
    
    // Get color classes with fallback to amber (expired is most common)
    const colorClasses = colorMap[content.color as keyof typeof colorMap] ?? colorMap.amber;

    // Toggle expansion state
    const handleToggle = () => {
        const newState = !isExpanded;
        setInternalExpanded(newState);
        onToggle?.(newState);
    };

    return (
        <div className="w-full">
            {/* Tappable Badge - Always visible */}
            <button
                onClick={handleToggle}
                className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2 
                    rounded-lg border text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${colorClasses.badge}
                `}
            >
                <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{content.badge}</span>
                </span>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>

            {/* Expandable Card - Shows on tap */}
            {isExpanded && (
                <div
                    className={`
                        mt-2 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2
                        ${colorClasses.card}
                    `}
                >
                    {/* Message */}
                    <p className="text-sm text-white/80 mb-4">{content.message}</p>

                    {/* Action Button */}
                    {onAction && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction();
                            }}
                            className={`w-full ${colorClasses.button}`}
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {actionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
