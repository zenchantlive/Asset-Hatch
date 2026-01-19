/**
 * MobileTabBar3D Component
 *
 * Bottom navigation bar for the mobile 3D generation layout.
 * Allows switching between Queue, Preview, and Actions tabs.
 *
 * Features:
 * - Fixed bottom position with glassmorphism style
 * - Large touch targets (min 44px) for mobile accessibility
 * - Visual feedback for active tab
 */

"use client";

import { Boxes, Cuboid } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type MobileTab = "queue" | "preview";

interface MobileTabBar3DProps {
    /** Currently active tab */
    activeTab: MobileTab;
    /** Callback when tab is changed */
    onTabChange: (tab: MobileTab) => void;
    /** Number of assets in queue (optional badge) */
    queueCount?: number;
}

// =============================================================================
// Main Component
// =============================================================================

export function MobileTabBar3D({
    activeTab,
    onTabChange,
    queueCount,
}: MobileTabBar3DProps) {
    return (
        <div className="h-16 bg-glass-bg/95 backdrop-blur-md border-t border-glass-border flex items-stretch">
            {/* Queue Tab */}
            <button
                onClick={() => onTabChange("queue")}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative",
                    activeTab === "queue" ? "text-cyan-400" : "text-white/40 hover:text-white/60"
                )}
            >
                <div className="relative">
                    <Boxes className="w-6 h-6" />
                    {queueCount !== undefined && queueCount > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-[10px] flex items-center justify-center text-cyan-300">
                            {queueCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-medium">Queue</span>
                {/* Active Indicator */}
                {activeTab === "queue" && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                )}
            </button>

            {/* Preview Tab (includes actions) */}
            <button
                onClick={() => onTabChange("preview")}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative",
                    activeTab === "preview" ? "text-cyan-400" : "text-white/40 hover:text-white/60"
                )}
            >
                <Cuboid className="w-6 h-6" />
                <span className="text-[10px] font-medium">Preview</span>
                {activeTab === "preview" && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                )}
            </button>
        </div>
    );
}
