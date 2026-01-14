/**
 * AssetTree3D Component
 *
 * Displays a collapsible tree view of 3D assets grouped by category.
 * Shows status badges and RIG/STATIC indicators for each asset.
 *
 * Features:
 * - Category collapsing/expanding
 * - Asset selection with visual feedback
 * - Status badges showing generation progress
 * - RIG/STATIC type indicators
 *
 * @see GenerationQueue3D.tsx for parent container
 * @see types/3d-queue-types.ts for type definitions
 */

"use client";

import {
    ChevronDown,
    ChevronRight,
    Loader2,
    Check,
    AlertCircle,
    Bone,
    Boxes,
    PersonStanding,
    TreePine,
    Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    AssetTree3DProps,
    Asset3DStatus,
    CategoryIconMap,
} from "./types/3d-queue-types";

// =============================================================================
// Constants
// =============================================================================

/**
 * Icon mapping for asset categories.
 * Maps category names to Lucide icon components.
 */
const CATEGORY_ICONS: CategoryIconMap = {
    Characters: PersonStanding,
    Environment: TreePine,
    Props: Package,
    default: Boxes,
};

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Renders a status badge for an asset.
 * Shows icon and label based on current generation status.
 */
function StatusBadge({ status, progress }: { status: Asset3DStatus; progress: number }) {
    // Define badge configuration for each status
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
 * AssetTree3D Component
 *
 * Displays a collapsible tree of 3D assets grouped by category.
 * Each asset shows its RIG/STATIC type and current status.
 *
 * @param assetsByCategory - Assets grouped by category name
 * @param selectedAssetId - Currently selected asset ID
 * @param onSelectAsset - Callback when user selects an asset
 * @param collapsedCategories - Set of collapsed category names
 * @param onToggleCategory - Callback when user toggles category
 * @param assetStates - Current state of each asset
 */
export function AssetTree3D({
    assetsByCategory,
    selectedAssetId,
    onSelectAsset,
    collapsedCategories,
    onToggleCategory,
    assetStates,
}: AssetTree3DProps) {
    return (
        <div className="w-64 shrink-0 border-r border-white/10 bg-glass-bg/20 flex flex-col">
            {/* Header with asset count summary */}
            <div className="p-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white/90">3D Asset Queue</h2>
                <p className="text-xs text-white/50 mt-1">
                    {/* Count total assets across all categories */}
                    {Object.values(assetsByCategory).reduce((sum, arr) => sum + arr.length, 0)} Total Assets •{" "}
                    {Object.keys(assetsByCategory).length} Categories
                </p>
            </div>

            {/* Scrollable asset tree */}
            <div className="flex-1 overflow-y-auto p-2">
                {Object.entries(assetsByCategory).map(([category, assets]) => {
                    // Check if this category is collapsed
                    const isCollapsed = collapsedCategories.has(category);
                    // Get icon component for this category
                    const CategoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;

                    return (
                        <div key={category} className="mb-2">
                            {/* Category Header - clickable to toggle collapse */}
                            <button
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left"
                                onClick={() => onToggleCategory(category)}
                            >
                                {/* Collapse/Expand chevron */}
                                {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-white/40" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-white/40" />
                                )}
                                {/* Category icon */}
                                <CategoryIcon className="h-4 w-4 text-cyan-400" />
                                {/* Category name */}
                                <span className="text-sm text-white/80 flex-1">{category}</span>
                                {/* Asset count in category */}
                                <span className="text-xs text-white/40">{assets.length}</span>
                            </button>

                            {/* Asset List - hidden when collapsed */}
                            {!isCollapsed && (
                                <div className="ml-4 mt-1 space-y-0.5">
                                    {assets.map((asset) => {
                                        // Get current state for this asset
                                        const state = assetStates.get(asset.id);
                                        // Check if this asset is selected
                                        const isSelected = asset.id === selectedAssetId;

                                        return (
                                            <button
                                                key={asset.id}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors",
                                                    isSelected
                                                        ? "bg-cyan-600/20 border border-cyan-500/40"
                                                        : "hover:bg-white/5 border border-transparent"
                                                )}
                                                onClick={() => onSelectAsset(asset.id)}
                                            >
                                                {/* RIG/STATIC type badge */}
                                                <span
                                                    className={cn(
                                                        "px-1.5 py-0.5 text-[10px] font-medium rounded",
                                                        asset.shouldRig
                                                            ? "bg-purple-500/20 text-purple-300"
                                                            : "bg-blue-500/20 text-blue-300"
                                                    )}
                                                >
                                                    {asset.shouldRig ? "RIG" : "STATIC"}
                                                </span>

                                                {/* Asset name - truncated if long */}
                                                <span className="text-xs text-white/80 flex-1 truncate">
                                                    {asset.name}
                                                </span>

                                                {/* Status indicator badge */}
                                                {state && <StatusBadge status={state.status} progress={state.progress} />}

                                                {/* Approval badge - shows ✓ for approved assets */}
                                                {state?.approvalStatus === "approved" && (
                                                    <span className="px-1 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded flex items-center gap-0.5">
                                                        <Check className="h-2 w-2" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
