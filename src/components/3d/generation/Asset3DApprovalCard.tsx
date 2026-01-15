/**
 * Asset3DApprovalCard Component
 *
 * Displays a generated 3D asset with approval controls.
 * Similar to 2D AssetApprovalCard but uses ModelViewer for 3D preview.
 *
 * Features:
 * - Interactive 3D model preview with orbit controls
 * - Asset name and category display
 * - RIG/STATIC type indicator
 * - Prompt used for generation
 * - Approve, Reject, and Regenerate actions
 *
 * @see components/generation/AssetApprovalCard.tsx for 2D pattern
 * @see components/3d/generation/ModelViewer.tsx for 3D preview
 */

"use client";

import { Check, X, RotateCcw, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "./ModelViewer";
import { cn } from "@/lib/utils";
import type { Asset3DApprovalCardProps } from "./types/3d-queue-types";

// =============================================================================
// Main Component
// =============================================================================

/**
 * Asset3DApprovalCard Component
 *
 * Shows a generated 3D model with approval controls.
 * Allows users to preview, approve, reject, or regenerate the asset.
 *
 * @param asset - Asset metadata from parsed plan
 * @param modelUrl - URL to the model file for preview
 * @param promptUsed - Text prompt used to generate the model
 * @param onApprove - Callback when user clicks Approve
 * @param onReject - Callback when user clicks Reject
 * @param onRegenerate - Callback when user clicks Regenerate
 */
export function Asset3DApprovalCard({
    asset,
    modelUrl,
    promptUsed,
    onApprove,
    onReject,
    onRegenerate,
}: Asset3DApprovalCardProps) {
    return (
        <div className="glass-panel p-6 space-y-4">
            {/* Header with asset name and regenerate button */}
            <div className="flex items-start justify-between">
                {/* Asset info */}
                <div>
                    {/* Asset name */}
                    <h3 className="text-lg font-semibold text-white/90">{asset.name}</h3>
                    {/* Category */}
                    <p className="text-sm text-white/60">{asset.category}</p>
                </div>

                {/* Regenerate button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRegenerate}
                    className="text-xs"
                    title="Regenerate with same prompt"
                >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Regenerate
                </Button>
            </div>

            {/* Approval Buttons - at top for easy access */}
            <div className="flex gap-3">
                {/* Approve button with aurora gradient */}
                <Button onClick={onApprove} className="flex-1 aurora-gradient font-semibold">
                    <Check className="w-4 h-4 mr-2" />
                    Approve & Save
                </Button>

                {/* Reject button */}
                <Button onClick={onReject} variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Reject
                </Button>
            </div>

            {/* 3D Model Preview */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10">
                {/* ModelViewer component for interactive 3D preview */}
                <ModelViewer modelUrl={modelUrl} className="h-full" autoRotate={true} />
            </div>

            {/* Prompt Used - shows the generation prompt */}
            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/60 mb-1 font-semibold">Prompt Used:</p>
                <p className="text-sm text-white/80 font-mono">{promptUsed}</p>
            </div>

            {/* Asset Type Badge */}
            <div className="flex items-center gap-2">
                {/* GLB file type indicator */}
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-white/60">GLB Model</span>

                {/* RIG/STATIC type badge */}
                <span
                    className={cn(
                        "px-2 py-0.5 text-xs rounded",
                        asset.shouldRig
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-blue-500/20 text-blue-300"
                    )}
                >
                    {asset.shouldRig ? "Riggable" : "Static"}
                </span>
            </div>

            {/* Tip Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-xs text-white/70">
                <strong className="text-purple-300">Tip:</strong> Approve to save this 3D model to your project.
                Reject to try again with different settings or a modified prompt.
            </div>
        </div>
    );
}
