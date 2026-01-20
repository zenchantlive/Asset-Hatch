/**
 * Mobile3DGenerationLayout Component
 *
 * Main layout container for mobile devices.
 * Orchestrates the tab-based navigation and content switching.
 *
 * Structure:
 * - Content Area (switches based on active tab)
 * - Bottom Navigation Bar (MobileTabBar3D)
 */

"use client";

import { useState, useCallback } from "react";
import { type MobileTab } from "./MobileTabBar3D";
import { AssetTree3D } from "./AssetTree3D";
import { AssetDetailPanel3D } from "./AssetDetailPanel3D";
import { AssetActions3D } from "./AssetActions3D";
import { ExpirationBanner } from "./ExpirationBanner";
import type { Parsed3DAsset } from "@/lib/3d-plan-parser";
import type { Asset3DState, Asset3DItem } from "./types/3d-queue-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddAssetForm } from "./AddAssetForm";
import type { AnimationPreset } from "@/lib/types/3d-generation";

// =============================================================================
// Props
// =============================================================================

interface Mobile3DGenerationLayoutProps {
    // Data & State
    projectId: string;
    assetsByCategory: Record<string, Asset3DItem[]>;
    selectedAsset: Asset3DItem | null;
    selectedAssetState: Asset3DState;
    assetStates: Map<string, Asset3DState>;
    selectedAnimations: Set<AnimationPreset>;
    collapsedCategories: Set<string>;

    // Actions
    onSelectAsset: (id: string) => void;
    onToggleCategory: (category: string) => void;
    onGenerate: () => Promise<void>;
    onRig: () => Promise<void>;
    onAnimate: () => Promise<void>;
    onToggleAnimation: (preset: AnimationPreset) => void;
    onApprove: () => Promise<void>;
    onReject: () => Promise<void>;
    onRegenerate: () => void;
    onAddAsset: (asset: Parsed3DAsset) => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function Mobile3DGenerationLayout(props: Mobile3DGenerationLayoutProps) {
    const [activeTab, setActiveTab] = useState<MobileTab>("preview"); // Default to preview
    const [showAddAsset, setShowAddAsset] = useState(false);

    // Destructure function props for useCallback dependencies
    const { onSelectAsset } = props;

    // Handle asset selection - auto switch to preview
    const handleAssetSelect = useCallback((id: string) => {
        onSelectAsset(id);
        setActiveTab("preview"); // Navigate to preview on selection
    }, [onSelectAsset]);

    return (
        <div className="h-full flex flex-col bg-background w-full">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Banner */}
                <div className="p-2">
                    <ExpirationBanner />
                </div>

                {/* Queue View */}
                {activeTab === "queue" && (
                    <div className="px-2 pb-4">
                        {/* Add Asset Button */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowAddAsset(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 font-medium transition-colors border border-cyan-500/20"
                            >
                                <span className="text-xl leading-none">+</span>
                                Add New Asset
                            </button>
                        </div>

                        {/* Asset Tree */}
                        <div className="[&>div]:w-full [&>div]:border-r-0 [&>div]:bg-transparent">
                            <AssetTree3D
                                assetsByCategory={props.assetsByCategory}
                                selectedAssetId={props.selectedAsset?.id || null}
                                onSelectAsset={handleAssetSelect}
                                collapsedCategories={props.collapsedCategories}
                                onToggleCategory={props.onToggleCategory}
                                assetStates={props.assetStates}
                            />
                        </div>

                        {/* Navigate to Preview if asset selected */}
                        {props.selectedAsset && (
                            <div className="mt-4 p-3 bg-cyan-600/10 border border-cyan-500/20 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("preview")}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 font-medium transition-colors"
                                >
                                    View {props.selectedAsset.name}
                                    <span className="text-xl">→</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview View */}
                {activeTab === "preview" && (
                    <div className="pb-4">
                        {/* Back to Queue Button */}
                        <div className="px-2 pt-2 pb-3">
                            <button
                                onClick={() => setActiveTab("queue")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span className="text-xl">←</span>
                                Back to Queue
                            </button>
                        </div>

                        {props.selectedAsset ? (
                            <>
                                {/* Model Viewer */}
                                <AssetDetailPanel3D
                                    key={props.selectedAsset.id}
                                    asset={props.selectedAsset}
                                    assetState={props.selectedAssetState}
                                />

                                {/* Actions below viewer */}
                                <div className="px-2 mt-2">
                                    <AssetActions3D
                                        asset={props.selectedAsset}
                                        assetState={props.selectedAssetState}
                                        selectedAnimations={props.selectedAnimations}
                                        onGenerate={props.onGenerate}
                                        onRig={props.onRig}
                                        onAnimate={props.onAnimate}
                                        onToggleAnimation={props.onToggleAnimation}
                                        onApprove={props.onApprove}
                                        onReject={props.onReject}
                                        onRegenerate={props.onRegenerate}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                                <p className="text-white/40 mb-4">No asset selected</p>
                                <button
                                    onClick={() => setActiveTab("queue")}
                                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    Select from Queue
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Asset Dialog */}
            <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
                <DialogContent className="bg-glass-panel border-glass-border max-w-md w-[95%] rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Add New Asset</DialogTitle>
                    </DialogHeader>
                    <AddAssetForm
                        projectId={props.projectId}
                        onSubmit={(asset) => {
                            props.onAddAsset(asset);
                            setShowAddAsset(false);
                        }}
                        onCancel={() => setShowAddAsset(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
