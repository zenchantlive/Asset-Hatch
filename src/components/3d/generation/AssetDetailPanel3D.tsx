/**
 * AssetDetailPanel3D Component
 *
 * Displays the detail panel for a selected 3D asset including:
 * - Asset header with name and description
 * - 3D model viewer with orbit controls
 * - Status bar showing current generation progress
 *
 * @see GenerationQueue3D.tsx for parent container
 * @see ModelViewer.tsx for 3D preview component
 */

"use client";

import { useState, useMemo } from "react";

import {
    Boxes,
    Loader2,
    Check,
    AlertCircle,
    Bone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelViewer } from "./ModelViewer";
import { AnimatedModelViewer } from "./AnimatedModelViewer";
import type { Asset3DState, Asset3DStatus, Asset3DItem } from "./types/3d-queue-types";

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the AssetDetailPanel3D component.
 */
interface AssetDetailPanel3DProps {
    // Currently selected asset data from the plan
    asset: Asset3DItem;
    // Current generation state of the asset
    assetState: Asset3DState;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Renders a status badge with icon and label.
 * Used in the status bar to show current pipeline stage.
 */
function StatusBadge({ status, progress }: { status: Asset3DStatus; progress: number }) {
    // Define badge configurations for each status
    const badges: Record<Asset3DStatus, { icon: React.ReactNode; label: string; className: string }> = {
        ready: { icon: null, label: "Ready", className: "text-white/50" },
        generating: {
            icon: <Loader2 className="h-3 w-3 animate-spin" />,
            label: `${progress}%`,
            className: "text-cyan-400",
        },
        generated: { icon: <Check className="h-3 w-3" />, label: "Generated", className: "text-green-400" },
        rigging: {
            icon: <Loader2 className="h-3 w-3 animate-spin" />,
            label: "Rigging",
            className: "text-purple-400",
        },
        rigged: { icon: <Bone className="h-3 w-3" />, label: "Rigged", className: "text-purple-400" },
        animating: {
            icon: <Loader2 className="h-3 w-3 animate-spin" />,
            label: "Animating",
            className: "text-yellow-400",
        },
        complete: { icon: <Check className="h-3 w-3" />, label: "Complete", className: "text-green-400" },
        failed: { icon: <AlertCircle className="h-3 w-3" />, label: "Failed", className: "text-red-400" },
    };

    // Get badge config for current status
    const badge = badges[status];

    return (
        <span className={cn("flex items-center gap-1 text-xs", badge.className)}>
            {badge.icon}
            {badge.label}
        </span>
    );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * AssetDetailPanel3D Component
 *
 * Shows the detail view for a selected 3D asset.
 * Includes header, 3D viewer, and status bar.
 *
 * @param asset - Selected asset data from the plan
 * @param assetState - Current generation state
 */
export function AssetDetailPanel3D({
    asset,
    assetState,
}: AssetDetailPanel3DProps) {
    // State to track which version of the model to show
    const [selectedView, setSelectedView] = useState<string>("draft");

    // Determine the active model URL based on selection
    const activeModelUrl = useMemo(() => {
        if (selectedView === "draft") return assetState.draftModelUrl;
        if (selectedView === "rigged") return assetState.riggedModelUrl;
        // Check if selected view matches an animation preset
        if (assetState.animatedModelUrls && assetState.animatedModelUrls[selectedView]) {
            return assetState.animatedModelUrls[selectedView];
        }
        return assetState.draftModelUrl;
    }, [selectedView, assetState]);
    return (
        <div className="flex-1 flex flex-col bg-glass-bg/10">
            {/* Asset Header - shows name, type, and description */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    {/* RIG/STATIC type badge */}
                    <span
                        className={cn(
                            "px-2 py-1 text-xs font-medium rounded",
                            asset.shouldRig
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-blue-500/20 text-blue-300"
                        )}
                    >
                        {asset.shouldRig ? "RIG" : "STATIC"}
                    </span>

                    {/* Asset name */}
                    <h2 className="text-lg font-semibold text-white/90">{asset.name}</h2>
                </div>

                {/* Asset description if available */}
                {asset.description && (
                    <p className="text-sm text-white/50 mt-2">{asset.description}</p>
                )}
            </div>

            {/* Model Viewer - main 3D preview area - uses calc for responsive height */}
            <div className="flex-1 min-h-[12rem] max-h-[60vh] p-4 flex flex-col overflow-hidden">
                {/* View Selector - only show if there are multiple options */}
                {(assetState.riggedModelUrl || (assetState.animatedModelUrls && Object.keys(assetState.animatedModelUrls).length > 0)) && (
                    <div className="flex items-center gap-2 mb-2 p-1 bg-black/20 rounded-lg w-fit">
                        {/* Draft View Option */}
                        <button
                            onClick={() => setSelectedView("draft")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                selectedView === "draft"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                            )}
                        >
                            Draft Model
                        </button>

                        {/* Rigged View Option */}
                        {assetState.riggedModelUrl && (
                            <button
                                onClick={() => setSelectedView("rigged")}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                                    selectedView === "rigged"
                                        ? "bg-purple-500/20 text-purple-200 shadow-sm"
                                        : "text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10"
                                )}
                            >
                                <Bone className="w-3 h-3" />
                                Rigged
                            </button>
                        )}

                        {/* Animated View Options */}
                        {assetState.animatedModelUrls && Object.entries(assetState.animatedModelUrls).map(([preset]) => (
                            <button
                                key={preset}
                                onClick={() => setSelectedView(preset)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 capitalize",
                                    selectedView === preset
                                        ? "bg-yellow-500/20 text-yellow-200 shadow-sm"
                                        : "text-yellow-400/50 hover:text-yellow-300 hover:bg-yellow-500/10"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {preset}
                            </button>
                        ))}
                    </div>
                )}

                {activeModelUrl ? (
                    // Use AnimatedModelViewer for animation presets (not draft/rigged)
                    // This enables playback controls for animated GLBs
                    selectedView !== "draft" && selectedView !== "rigged" ? (
                        <AnimatedModelViewer modelUrl={activeModelUrl} className="h-full" />
                    ) : (
                        <ModelViewer modelUrl={activeModelUrl} className="h-full" />
                    )
                ) : (
                    // Show placeholder when no model yet
                    <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20">
                        <div className="text-center">
                            {/* Placeholder icon */}
                            <Boxes className="h-12 w-12 mx-auto text-white/20 mb-2" />
                            {/* Placeholder text */}
                            <p className="text-white/40 text-sm">No model generated yet</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar - shows current status and rig status */}
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4">
                {/* Main status */}
                <span className="text-xs text-white/50">Status:</span>
                <StatusBadge status={assetState.status} progress={assetState.progress} />

                {/* Rig status for RIG assets that are generated */}
                {assetState.status === "generated" && asset.shouldRig && (
                    <>
                        <span className="text-white/20">•</span>
                        <span className="text-xs text-white/50">Rig Status:</span>
                        <span className="text-xs text-purple-400">Not Rigged</span>
                    </>
                )}

                {/* Animation count for animated assets */}
                {assetState.animatedModelUrls && Object.keys(assetState.animatedModelUrls).length > 0 && (
                    <>
                        <span className="text-white/20">•</span>
                        <span className="text-xs text-white/50">Animations:</span>
                        <span className="text-xs text-yellow-400">
                            {Object.keys(assetState.animatedModelUrls).length}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
