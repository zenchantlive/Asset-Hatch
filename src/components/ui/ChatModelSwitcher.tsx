/**
 * ChatModelSwitcher Component
 *
 * Compact model selector for chat interfaces.
 * - Mobile responsive with relative units
 * - Shows current model + dropdown on click
 * - Pre-chat hint when no messages exist
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles, AlertCircle } from "lucide-react";
import {
    getChatModels, getDefaultModel, formatCost
} from "@/lib/model-registry";
import type { RegisteredModel } from "@/lib/model-registry";

// Get available chat models from registry
const chatModels = getChatModels();

// Props for ChatModelSwitcher
interface ChatModelSwitcherProps {
    // Currently selected model ID
    selectedModel: string;
    // Callback when model changes
    onModelChange: (modelId: string) => void;
    // Whether to show the pre-chat hint (no messages yet)
    showHint?: boolean;
    // Compact mode for tight spaces
    compact?: boolean;
}

/**
 * ChatModelSwitcher - Compact dropdown for selecting chat models
 *
 * Features:
 * - Responsive design with relative units (rem, %)
 * - Mobile-friendly touch targets (min 44px)
 * - Pre-chat hint to encourage model selection
 * - Cost indicator per model
 */
export function ChatModelSwitcher({
    selectedModel,
    onModelChange,
    showHint = false,
    compact = false,
}: ChatModelSwitcherProps) {
    // Dropdown open state
    const [isOpen, setIsOpen] = useState(false);
    // Reference for click-outside detection
    const containerRef = useRef<HTMLDivElement>(null);

    // Get current model details
    const currentModel = chatModels.find((m) => m.id === selectedModel)
        || getDefaultModel("chat");

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Handle model selection
    const handleSelect = (model: RegisteredModel) => {
        onModelChange(model.id);
        setIsOpen(false);
    };

    // Calculate estimated cost per 1K tokens
    const getCostBadge = (model: RegisteredModel) => {
        const cost = (model.pricing.promptPerToken + model.pricing.completionPerToken) * 1000;
        if (cost === 0) return "Free";
        return formatCost(cost);
    };

    return (
        <div ref={containerRef} className="relative z-10">
            {/* Pre-chat hint - shown only when no messages */}
            {showHint && (
                <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-white/50">
                    <AlertCircle className="h-3 w-3" />
                    <span>Choose your model before starting</span>
                </div>
            )}

            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          inline-flex items-center gap-1.5 rounded-lg border border-white/15 
          bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white
          shadow-[0_0_0.625rem_-0.25rem_rgba(0,0,0,0.4)]
          transition-all duration-200 hover:bg-white/15 hover:border-white/25
          focus:outline-none focus:ring-2 focus:ring-primary/50
          ${compact ? "min-h-[2rem]" : "min-h-[2.5rem]"}
          ${isOpen ? "ring-2 ring-primary/50" : ""}
        `}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {/* Model icon */}
                <Sparkles className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-primary/80`} />

                {/* Current model name - truncate on mobile */}
                <span className={`${compact ? "max-w-20" : "max-w-32"} truncate`}>
                    {currentModel.displayName}
                </span>

                {/* Chevron */}
                <ChevronDown
                    className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown menu - opens upward since component is at bottom of chat */}
            {isOpen && (
                <div
                    className="
            absolute left-0 bottom-full z-50 mb-1 min-w-56 max-w-72 max-h-64 overflow-y-auto
            rounded-xl border border-white/10 bg-zinc-900/95
            p-1.5 shadow-xl backdrop-blur-lg
          "
                    role="listbox"
                >
                    {/* Model options */}
                    {chatModels.map((model) => {
                        const isSelected = model.id === selectedModel;
                        const costBadge = getCostBadge(model);

                        return (
                            <button
                                key={model.id}
                                onClick={() => handleSelect(model)}
                                className={`
                  flex w-full items-center gap-2 rounded-lg px-3 py-2.5
                  text-left text-sm transition-colors duration-150
                  min-h-[2.75rem]
                  ${isSelected
                                        ? "bg-primary/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }
                `}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {/* Model info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* Model name */}
                                        <span className="font-medium truncate">
                                            {model.displayName}
                                        </span>

                                        {/* Free badge */}
                                        {costBadge === "Free" && (
                                            <span className="shrink-0 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[0.625rem] font-medium text-green-400">
                                                FREE
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {model.description && (
                                        <p className="mt-0.5 text-xs text-white/50 line-clamp-1">
                                            {model.description}
                                        </p>
                                    )}
                                </div>

                                {/* Cost badge (non-free) */}
                                {costBadge !== "Free" && (
                                    <span className="shrink-0 text-xs text-white/40">
                                        {costBadge}/1K
                                    </span>
                                )}

                                {/* Selected checkmark */}
                                {isSelected && (
                                    <Check className="h-4 w-4 shrink-0 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Default export for convenience
 */
export default ChatModelSwitcher;
