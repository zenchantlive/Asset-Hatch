/**
 * AssetActions3D Component
 *
 * Renders action buttons for 3D asset generation workflow.
 * Buttons shown depend on current asset state in the pipeline.
 *
 * Features:
 * - Generate button (when ready)
 * - Progress indicator (when generating)
 * - Auto-Rig button (for RIG assets after generation)
 * - Animation preset selection (after rigging)
 * - Approve/Reject buttons (after complete)
 * - Download dropdown (when model URLs available)
 *
 * @see GenerationQueue3D.tsx for parent container
 * @see types/3d-queue-types.ts for type definitions
 */

"use client";

import {
    Loader2,
    Play,
    Check,
    Bone,
    Film,
    ChevronDown,
    Download,
    RotateCcw,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ANIMATION_PRESET_LABELS, type AnimationPreset } from "@/lib/types/3d-generation";
import type { AssetActions3DProps } from "./types/3d-queue-types";

// =============================================================================
// Main Component
// =============================================================================

/**
 * AssetActions3D Component
 *
 * Displays action buttons based on current asset state.
 * Handles generate, rig, animate, approve, reject, and download actions.
 *
 * @param asset - Currently selected asset data
 * @param assetState - Current state of the selected asset
 * @param selectedAnimations - Set of selected animation presets
 * @param onGenerate - Callback to start generation
 * @param onRig - Callback to start rigging
 * @param onAnimate - Callback to apply selected animations
 * @param onToggleAnimation - Callback to toggle animation preset selection
 * @param onApprove - Callback to approve the asset
 * @param onReject - Callback to reject the asset
 * @param onRegenerate - Callback to regenerate the asset
 */
export function AssetActions3D({
    asset,
    assetState,
    selectedAnimations,
    onGenerate,
    onRig,
    onAnimate,
    onToggleAnimation,
    onApprove,
    onReject,
    onRegenerate,
}: AssetActions3DProps) {
    // Extract commonly used values
    const { status, progress, draftModelUrl, riggedModelUrl, animatedModelUrls, error } = assetState;

    return (
        // Sticky container ensures buttons are always accessible on shorter screens
        <div className="sticky bottom-0 bg-glass-bg/95 backdrop-blur-sm space-y-4">
            {/* Main Action Row */}
            <div className="p-4 border-t border-white/10 flex items-center gap-3 flex-wrap">
                {/* Generate Button - shown when asset is ready */}
                {status === "ready" && (
                    <Button onClick={onGenerate} className="bg-cyan-600 hover:bg-cyan-500">
                        <Play className="h-4 w-4 mr-2" />
                        Generate
                    </Button>
                )}

                {/* Progress Indicator - shown during generation */}
                {status === "generating" && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        <span className="text-sm text-cyan-400">Generating... {progress}%</span>
                    </div>
                )}

                {/* Rigging Progress - shown during rigging */}
                {status === "rigging" && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                        <span className="text-sm text-purple-400">Rigging... {progress}%</span>
                    </div>
                )}

                {/* Animation Progress - shown during animation */}
                {status === "animating" && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                        <span className="text-sm text-yellow-400">Applying animations...</span>
                    </div>
                )}

                {/* Auto-Rig Button - shown for RIG assets after generation, or to retry if failed */}
                {asset.shouldRig && draftModelUrl && (status === "generated" || status === "failed") && (
                    <Button onClick={onRig} variant="outline" className="border-purple-500/50 text-purple-300">
                        <Bone className="h-4 w-4 mr-2" />
                        {status === "failed" ? "Retry Rig" : "Auto-Rig"}
                    </Button>
                )}

                {/* Animation Preset Dropdown - shown for RIG assets after rigging or when complete (to add more) */}
                {asset.shouldRig && (status === "rigged" || status === "complete") && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-yellow-500/50 text-yellow-300">
                                <Film className="h-4 w-4 mr-2" />
                                Animations
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-glass-panel border-glass-border">
                            {/* Render all available animation presets */}
                            {(Object.keys(ANIMATION_PRESET_LABELS) as AnimationPreset[]).map((preset) => (
                                <DropdownMenuItem
                                    key={preset}
                                    onClick={() => onToggleAnimation(preset)}
                                    className="flex items-center gap-2"
                                >
                                    {/* Checkbox indicator */}
                                    <span
                                        className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center",
                                            selectedAnimations.has(preset)
                                                ? "bg-cyan-500 border-cyan-500"
                                                : "border-white/30"
                                        )}
                                    >
                                        {selectedAnimations.has(preset) && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    {/* Preset label */}
                                    {ANIMATION_PRESET_LABELS[preset]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Apply Animations Button - shown when animations are selected and asset is rigged or complete */}
                {selectedAnimations.size > 0 && (status === "rigged" || status === "complete") && (
                    <Button onClick={onAnimate} className="bg-yellow-600 hover:bg-yellow-500">
                        <Play className="h-4 w-4 mr-2" />
                        Apply {selectedAnimations.size} Animation{selectedAnimations.size > 1 ? "s" : ""}
                    </Button>
                )}

                {/* Download Dropdown - shown when any model URL is available */}
                {draftModelUrl && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <Download className="h-4 w-4 mr-2" />
                                Download (.glb)
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-glass-panel border-glass-border" align="end">
                            {/* Draft model download */}
                            <DropdownMenuItem asChild>
                                <a href={draftModelUrl} download>
                                    Draft Model
                                </a>
                            </DropdownMenuItem>

                            {/* Rigged model download - if available */}
                            {riggedModelUrl && (
                                <DropdownMenuItem asChild>
                                    <a href={riggedModelUrl} download>
                                        Rigged Model
                                    </a>
                                </DropdownMenuItem>
                            )}

                            {/* Animated model downloads - for each preset */}
                            {animatedModelUrls &&
                                Object.entries(animatedModelUrls).map(([preset, url]) => (
                                    <DropdownMenuItem key={preset} asChild>
                                        <a href={url} download>
                                            Animated - {ANIMATION_PRESET_LABELS[preset as AnimationPreset]}
                                        </a>
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Approval Row - shown when asset generation is complete */}
            {(status === "generated" || status === "rigged" || status === "complete") && (
                <div className="px-4 pb-4 flex items-center gap-3">
                    {/* Already Approved State */}
                    {assetState.approvalStatus === "approved" ? (
                        <>
                            <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-md bg-green-500/10 border border-green-500/30">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400 font-medium">Approved</span>
                            </div>
                            <Button onClick={onReject} variant="outline" size="sm" className="border-white/20">
                                Undo
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Approve Button */}
                            <Button onClick={onApprove} className="flex-1 aurora-gradient font-semibold">
                                <Check className="w-4 h-4 mr-2" />
                                Approve & Save
                            </Button>

                            {/* Reject Button */}
                            <Button onClick={onReject} variant="destructive" className="flex-1">
                                <X className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </>
                    )}

                    {/* Regenerate Button */}
                    <Button onClick={onRegenerate} variant="outline" className="border-white/20 hover:bg-white/10" title="Regenerate with same prompt">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Error Display - shown when status is failed */}
            {error && (
                <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-400 flex-1">{error}</p>

                    {/* Retry Generation Button - for failed generation or unrecoverable rig error */}
                    {status === "failed" && (
                        <Button onClick={onRegenerate} variant="outline" size="sm" className="border-red-500/50 text-red-300 hover:bg-red-500/10">
                            <RotateCcw className="w-3 h-3 mr-2" />
                            {draftModelUrl ? "Regenerate Asset" : "Retry"}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
