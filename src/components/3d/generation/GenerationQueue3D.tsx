/**
 * GenerationQueue3D Component
 *
 * Main container for 3D asset generation UI. Composes smaller components
 * for the asset tree, detail panel, and action controls.
 *
 * Features:
 * - Asset tree sidebar with categories and status badges
 * - 3D model viewer with orbit controls
 * - Generation, rigging, and animation controls
 * - Approval workflow integration
 *
 * @see AssetTree3D.tsx for asset tree sidebar
 * @see AssetDetailPanel3D.tsx for asset detail view
 * @see AssetActions3D.tsx for action buttons
 * @see hooks/use3DPolling.ts for task polling
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { parse3DPlan, type Parsed3DAsset } from "@/lib/3d-plan-parser";
import type { AnimationPreset } from "@/lib/types/3d-generation";
import type { Asset3DState, GenerationQueue3DProps, Asset3DItem } from "./types/3d-queue-types";
import { use3DPolling } from "./hooks/use3DPolling";
import { AssetTree3D } from "./AssetTree3D";
import { AssetDetailPanel3D } from "./AssetDetailPanel3D";
import { AssetActions3D } from "./AssetActions3D";
import { AddAssetForm } from "./AddAssetForm";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// =============================================================================
// Main Component
// =============================================================================

/**
 * GenerationQueue3D Component
 *
 * Container component that orchestrates the 3D generation workflow.
 * Manages state and composes child components for the UI.
 *
 * @param projectId - Project ID to load plan and generate assets for
 */
export function GenerationQueue3D({ projectId }: GenerationQueue3DProps) {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    // Parsed assets from the plan
    const [parsedAssets, setParsedAssets] = useState<Parsed3DAsset[]>([]);
    // Loading state for initial plan fetch
    const [isLoading, setIsLoading] = useState(true);
    // Error state for plan loading failures
    const [loadError, setLoadError] = useState<string | null>(null);
    // Currently selected asset ID
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    // Collapsed categories in the tree
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    // Asset generation states (assetId → Asset3DState)
    const [assetStates, setAssetStates] = useState<Map<string, Asset3DState>>(new Map());
    // Selected animations for the currently selected asset
    const [selectedAnimations, setSelectedAnimations] = useState<Set<AnimationPreset>>(new Set());
    // Show add asset dialog
    const [showAddAsset, setShowAddAsset] = useState(false);

    // -------------------------------------------------------------------------
    // Hooks
    // -------------------------------------------------------------------------

    // Polling functions for generation tasks
    const { pollTaskStatus, pollRigTask, pollAnimationTask } = use3DPolling(setAssetStates);

    // -------------------------------------------------------------------------
    // Load Plan
    // -------------------------------------------------------------------------

    useEffect(() => {
        async function loadPlan() {
            try {
                // Fetch the entities.json file from the server
                const response = await fetch(`/api/projects/${projectId}/memory-files?type=entities.json`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json() as { success: boolean; files?: Array<{ content: string }> };

                // Check if plan exists
                if (!data.success || !data.files || data.files.length === 0) {
                    setLoadError("No plan found. Please create a plan in the Planning tab first.");
                    setIsLoading(false);
                    return;
                }

                const entitiesFile = data.files[0];

                // Check if plan has content
                if (!entitiesFile.content || entitiesFile.content.trim() === "") {
                    setLoadError("Plan file is empty. Please create a valid plan first.");
                    setIsLoading(false);
                    return;
                }

                // Parse the markdown plan using 3D parser
                const parsed = parse3DPlan(entitiesFile.content, { projectId });

                // Check if any assets were found
                if (!parsed || parsed.length === 0) {
                    setLoadError("No assets found in plan. Make sure your plan uses [RIG] or [STATIC] tags.");
                    setIsLoading(false);
                    return;
                }

                // Add skybox as special first asset
                const skyboxAsset: Parsed3DAsset & { projectId: string } = {
                    id: `${projectId}-skybox`,
                    name: "Environment Skybox",
                    description: "360-degree skybox background",
                    shouldRig: false,
                    category: "Skybox",
                    animationsRequested: [],
                    projectId: projectId,
                };

                // Prepend skybox to assets
                const assetsWithSkybox = [skyboxAsset, ...parsed];

                // Set parsed assets
                setParsedAssets(assetsWithSkybox);
                if (assetsWithSkybox.length > 0) {
                    setSelectedAssetId(assetsWithSkybox[0].id);
                }

                // Fetch existing asset states from database
                try {
                    const response = await fetch(`/api/projects/${projectId}/3d-assets`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && Array.isArray(data.assets)) {
                            // Map DB assets to local state
                            const states = new Map<string, Asset3DState>();

                            // Interface matching API response format
                            interface DBAssetResponse {
                                assetId: string;
                                status: string;
                                approvalStatus: string | null;
                                draftTaskId?: string;
                                rigTaskId?: string;
                                animationTaskIds?: Record<string, string>;
                                draftModelUrl: string | null;
                                riggedModelUrl: string | null;
                                animatedModelUrls?: Record<string, string>;
                                errorMessage?: string;
                            }

                            // Track assets that need polling resumed
                            const assetsNeedingPolling: {
                                assetId: string;
                                status: string;
                                taskId: string;
                            }[] = [];

                            // Iterate over DB assets and hydrate their state
                            // Include both parsed plan assets AND manually injected Skybox
                            (data.assets as DBAssetResponse[]).forEach((dbAsset) => {
                                // Find matching parsed asset OR check if it's the manually injected Skybox
                                const matchingParsed = parsed.find(p => p.id === dbAsset.assetId);
                                const isSkyboxAsset = dbAsset.assetId === `${projectId}-skybox`;

                                if (matchingParsed || isSkyboxAsset) {
                                    // Use string for initial status (DB may have 'queued' which UI type doesn't include)
                                    let hydratedStatus: string = dbAsset.status;

                                    // Self-healing: If we have a model URL but status is ready/queued, assume generated
                                    if (dbAsset.draftModelUrl && (hydratedStatus === 'ready' || hydratedStatus === 'queued')) {
                                        hydratedStatus = 'generated';
                                    }

                                    // Self-healing for Rigged: If we have rigged URL, ensure status is at least rigged
                                    if (dbAsset.riggedModelUrl && (hydratedStatus === 'ready' || hydratedStatus === 'queued' || hydratedStatus === 'generated' || hydratedStatus === 'generating')) {
                                        hydratedStatus = 'rigged';
                                    }

                                    // Map 'queued' to 'ready' for UI (UI doesn't have 'queued' status)
                                    if (hydratedStatus === 'queued') {
                                        hydratedStatus = 'ready';
                                    }

                                    states.set(dbAsset.assetId, {
                                        status: hydratedStatus as Asset3DState["status"],
                                        approvalStatus: (dbAsset.approvalStatus as 'pending' | 'approved' | 'rejected') || 'pending',
                                        progress: hydratedStatus === 'generated' || hydratedStatus === 'rigged' || hydratedStatus === 'complete' ? 100 : 0,
                                        draftTaskId: dbAsset.draftTaskId,
                                        rigTaskId: dbAsset.rigTaskId,
                                        animationTaskIds: dbAsset.animationTaskIds || {},
                                        draftModelUrl: dbAsset.draftModelUrl || undefined,
                                        riggedModelUrl: dbAsset.riggedModelUrl || undefined,
                                        animatedModelUrls: dbAsset.animatedModelUrls || {},
                                        error: dbAsset.errorMessage || undefined
                                    });

                                    // Check if this asset was mid-processing and needs polling resumed
                                    if (hydratedStatus === 'generating' && dbAsset.draftTaskId) {
                                        assetsNeedingPolling.push({
                                            assetId: dbAsset.assetId,
                                            status: 'generating',
                                            taskId: dbAsset.draftTaskId,
                                        });
                                    } else if (hydratedStatus === 'rigging' && dbAsset.rigTaskId) {
                                        assetsNeedingPolling.push({
                                            assetId: dbAsset.assetId,
                                            status: 'rigging',
                                            taskId: dbAsset.rigTaskId,
                                        });
                                    }

                                    // SELF-HEALING: If status is rigged/complete but riggedModelUrl is missing,
                                    // we need to re-poll the rig task to get the URL
                                    if ((hydratedStatus === 'rigged' || hydratedStatus === 'complete')
                                        && dbAsset.rigTaskId
                                        && !dbAsset.riggedModelUrl) {
                                        console.warn(`⚠️ Self-healing: Asset ${dbAsset.assetId} has rigTaskId but no riggedModelUrl - re-polling`);
                                        assetsNeedingPolling.push({
                                            assetId: dbAsset.assetId,
                                            status: 'rigging', // Poll rig task to get the URL
                                            taskId: dbAsset.rigTaskId,
                                        });
                                    }

                                    // Note: animating is harder to resume as multiple tasks may run
                                }
                            });

                            setAssetStates(states);

                            // Debug: Log hydrated states to verify rigTaskId is loaded
                            console.log("📦 Hydrated asset states from DB:", Array.from(states.entries()).map(([id, state]) => ({
                                assetId: id,
                                status: state.status,
                                rigTaskId: state.rigTaskId || "MISSING",
                                riggedModelUrl: state.riggedModelUrl ? "✅" : "❌",
                                animatedModelUrls: Object.keys(state.animatedModelUrls || {}).length,
                            })));

                            // Resume polling for in-progress assets after a short delay
                            // (allow state to settle before starting intervals)
                            if (assetsNeedingPolling.length > 0) {
                                setTimeout(() => {
                                    console.log(`🔄 Resuming polling for ${assetsNeedingPolling.length} in-progress asset(s)`);
                                    assetsNeedingPolling.forEach(({ assetId, status, taskId }) => {
                                        if (status === 'generating') {
                                            pollTaskStatus(assetId, taskId);
                                        } else if (status === 'rigging') {
                                            pollRigTask(assetId, taskId);
                                        }
                                    });
                                }, 500);
                            }
                        }
                    }
                } catch (fetchErr) {
                    console.error("Failed to fetch existing asset states:", fetchErr);
                    // Non-blocking error, we just start with empty states
                }

                setIsLoading(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                setLoadError(`Failed to load plan: ${errorMessage}`);
                setIsLoading(false);
            }
        }

        loadPlan();
    }, [projectId, pollTaskStatus, pollRigTask]);

    // -------------------------------------------------------------------------
    // Derived State
    // -------------------------------------------------------------------------

    // Group assets by category for tree display
    const assetsByCategory = useMemo(() => {
        const grouped: Record<string, Asset3DItem[]> = {};
        for (const asset of parsedAssets) {
            if (!grouped[asset.category]) {
                grouped[asset.category] = [];
            }
            // Map Parsed3DAsset to Asset3DItem
            grouped[asset.category].push({
                id: asset.id,
                name: asset.name,
                category: asset.category,
                description: asset.description,
                shouldRig: asset.shouldRig,
                animations: asset.animationsRequested,
                projectId: asset.projectId,
            });
        }
        return grouped;
    }, [parsedAssets]);

    // Currently selected asset
    const selectedAsset = useMemo(() => {
        const found = parsedAssets.find((a) => a.id === selectedAssetId);
        if (!found) return null;
        return {
            id: found.id,
            name: found.name,
            category: found.category,
            description: found.description,
            shouldRig: found.shouldRig,
            animations: found.animationsRequested,
            projectId: found.projectId,
        } as Asset3DItem;
    }, [parsedAssets, selectedAssetId]);

    // State of the selected asset with default values
    const selectedAssetState = useMemo(() => {
        if (!selectedAssetId) return { status: "ready" as const, progress: 0 };
        return assetStates.get(selectedAssetId) || { status: "ready" as const, progress: 0 };
    }, [selectedAssetId, assetStates]);

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    // Toggle category collapse in tree
    const toggleCategory = useCallback((category: string) => {
        setCollapsedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    // Handle adding a new asset manually
    const handleAddAsset = useCallback((newAsset: Parsed3DAsset) => {
        // Add to parsed assets
        setParsedAssets((prev) => [...prev, newAsset]);

        // Initialize asset state as ready
        setAssetStates((prev) => {
            const next = new Map(prev);
            next.set(newAsset.id, {
                status: "ready",
                progress: 0,
            });
            return next;
        });

        // Select the newly added asset
        setSelectedAssetId(newAsset.id);

        // Close the dialog
        setShowAddAsset(false);
    }, []);

    // Generate 3D model for selected asset
    const handleGenerate = useCallback(async () => {
        if (!selectedAsset || !selectedAssetId) return;

        // Update state to generating
        setAssetStates((prev) => {
            const next = new Map(prev);
            next.set(selectedAssetId, { status: "generating", progress: 0 });
            return next;
        });

        try {
            // Build prompt from asset description
            const prompt = selectedAsset.description || `A 3D model of ${selectedAsset.name}`;

            // Submit generation task
            const response = await fetch("/api/generate-3d", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetId: selectedAssetId,
                    prompt,
                    shouldRig: selectedAsset.shouldRig,
                }),
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.statusText}`);
            }

            const data = await response.json() as { taskId: string };

            // Store task ID and start polling
            setAssetStates((prev) => {
                const next = new Map(prev);
                next.set(selectedAssetId, {
                    status: "generating",
                    progress: 0,
                    draftTaskId: data.taskId,
                });
                return next;
            });

            // Start polling for task status
            pollTaskStatus(selectedAssetId, data.taskId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setAssetStates((prev) => {
                const next = new Map(prev);
                next.set(selectedAssetId, {
                    status: "failed",
                    progress: 0,
                    error: errorMessage,
                });
                return next;
            });
        }
    }, [selectedAsset, selectedAssetId, projectId, pollTaskStatus]);

    // Handle auto-rig button click
    const handleRig = useCallback(async () => {
        if (!selectedAssetId || !selectedAssetState.draftModelUrl) return;

        // Tripo API requires the task ID of the original model
        if (!selectedAssetState.draftTaskId) {
            setAssetStates((prev) => {
                const next = new Map(prev);
                const current = prev.get(selectedAssetId);
                next.set(selectedAssetId, {
                    ...current,
                    status: "failed",
                    error: "Cannot rig this asset: Missing original task ID. Try regenerating the asset."
                } as Asset3DState);
                return next;
            });
            return;
        }

        // Update state to rigging
        setAssetStates((prev) => {
            const next = new Map(prev);
            const current = prev.get(selectedAssetId);
            next.set(selectedAssetId, { ...current, status: "rigging", progress: 0 } as Asset3DState);
            return next;
        });

        try {
            // Submit rig task - Tripo requires original_model_task_id, not URL
            const response = await fetch("/api/generate-3d/rig", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetId: selectedAssetId,
                    draftTaskId: selectedAssetState.draftTaskId,
                    draftModelUrl: selectedAssetState.draftModelUrl, // For DB sync if needed
                }),
            });

            if (!response.ok) {
                throw new Error(`Rigging failed: ${response.statusText}`);
            }

            const data = await response.json() as { taskId: string };

            // Start polling for rig task status
            pollRigTask(selectedAssetId, data.taskId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setAssetStates((prev) => {
                const next = new Map(prev);
                next.set(selectedAssetId, {
                    ...prev.get(selectedAssetId),
                    status: "failed",
                    error: errorMessage,
                } as Asset3DState);
                return next;
            });
        }
    }, [selectedAssetId, selectedAssetState.draftModelUrl, selectedAssetState.draftTaskId, projectId, pollRigTask]);

    // Handle apply animations button click
    const handleAnimate = useCallback(async () => {
        // Log debug info to help diagnose issues
        console.log("🎬 handleAnimate called:", {
            selectedAssetId,
            riggedModelUrl: selectedAssetState.riggedModelUrl,
            rigTaskId: selectedAssetState.rigTaskId,
            selectedAnimations: Array.from(selectedAnimations),
        });

        if (!selectedAssetId) {
            console.error("❌ Animation failed: No asset selected");
            return;
        }
        if (!selectedAssetState.riggedModelUrl) {
            console.error("❌ Animation failed: No rigged model URL - asset may not be rigged yet");
            return;
        }
        if (selectedAnimations.size === 0) {
            console.error("❌ Animation failed: No animations selected");
            return;
        }

        // Ensure we have the rig task ID (required for animation)
        if (!selectedAssetState.rigTaskId) {
            console.error("❌ Animation failed: Missing rigTaskId - this may happen after refresh if the rig task ID wasn't saved");
            // Show user feedback in UI
            setAssetStates((prev) => {
                const next = new Map(prev);
                const current = prev.get(selectedAssetId);
                next.set(selectedAssetId, {
                    ...current,
                    error: "Missing rig data. Try re-rigging this asset.",
                } as Asset3DState);
                return next;
            });
            return;
        }

        // Update state to animating
        setAssetStates((prev) => {
            const next = new Map(prev);
            const current = prev.get(selectedAssetId);
            next.set(selectedAssetId, { ...current, status: "animating", progress: 0 } as Asset3DState);
            return next;
        });

        // Submit animation tasks for each selected preset
        for (const preset of selectedAnimations) {
            try {
                const response = await fetch("/api/generate-3d/animate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId,
                        assetId: selectedAssetId,
                        riggedModelUrl: selectedAssetState.riggedModelUrl,
                        rigTaskId: selectedAssetState.rigTaskId, // Required for Tripo animate_retarget
                        animationPreset: preset,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Animation submission failed: ${response.statusText}`);
                }

                const data = await response.json() as { taskId: string };

                // Start polling for this animation task
                pollAnimationTask(selectedAssetId, preset, data.taskId);
            } catch (err) {
                console.error(`Animation ${preset} error:`, err);
            }
        }
    }, [selectedAssetId, selectedAssetState.riggedModelUrl, selectedAssetState.rigTaskId, selectedAnimations, projectId, pollAnimationTask]);

    // Toggle animation selection
    const toggleAnimation = useCallback((preset: AnimationPreset) => {
        setSelectedAnimations((prev) => {
            const next = new Set(prev);
            if (next.has(preset)) {
                next.delete(preset);
            } else {
                next.add(preset);
            }
            return next;
        });
    }, []);

    // Handle approve action
    const handleApprove = useCallback(async () => {
        if (!selectedAssetId || !selectedAssetState.draftModelUrl) return;

        try {
            // Update approval status in DB
            const response = await fetch("/api/generate-3d/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetId: selectedAssetId,
                    status: "approved",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to approve asset");
            }

            // Update local state - approval is independent of pipeline status
            setAssetStates((prev) => {
                const next = new Map(prev);
                const current = prev.get(selectedAssetId);
                next.set(selectedAssetId, {
                    ...current,
                    approvalStatus: "approved",
                } as Asset3DState);
                return next;
            });
        } catch (err) {
            console.error("Approval error:", err);
        }
    }, [selectedAssetId, selectedAssetState.draftModelUrl, projectId]);

    // Handle reject action
    const handleReject = useCallback(async () => {
        if (!selectedAssetId) return;

        try {
            // Update approval status in DB
            await fetch("/api/generate-3d/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetId: selectedAssetId,
                    status: "rejected",
                }),
            });

            // Update local state - reset to ready for regeneration
            setAssetStates((prev) => {
                const next = new Map(prev);
                next.set(selectedAssetId, { status: "ready", progress: 0, approvalStatus: "rejected" });
                return next;
            });
        } catch (err) {
            console.error("Rejection error:", err);
        }
    }, [selectedAssetId, projectId]);

    // Handle regenerate action
    const handleRegenerate = useCallback(() => {
        if (!selectedAssetId) return;

        // Reset to ready state
        setAssetStates((prev) => {
            const next = new Map(prev);
            next.set(selectedAssetId, { status: "ready", progress: 0 });
            return next;
        });
    }, [selectedAssetId]);

    // -------------------------------------------------------------------------
    // Loading State
    // -------------------------------------------------------------------------

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <span className="text-white/60">Loading 3D asset plan...</span>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // Error State
    // -------------------------------------------------------------------------

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <span className="text-red-400">{loadError}</span>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // Main Render
    // -------------------------------------------------------------------------

    return (
        <div className="w-full h-full flex">
            {/* Left Panel: Asset Tree with Add Button */}
            <div className="flex flex-col">
                {/* Add Asset Button */}
                <div className="p-2 border-b border-white/10">
                    <button
                        onClick={() => setShowAddAsset(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-sm font-medium transition-colors"
                    >
                        <span className="text-lg">+</span>
                        Add Asset
                    </button>
                </div>

                {/* Asset Tree */}
                <AssetTree3D
                    assetsByCategory={assetsByCategory}
                    selectedAssetId={selectedAssetId}
                    onSelectAsset={setSelectedAssetId}
                    collapsedCategories={collapsedCategories}
                    onToggleCategory={toggleCategory}
                    assetStates={assetStates}
                />
            </div>

            {/* Add Asset Dialog */}
            <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
                <DialogContent className="bg-glass-panel border-glass-border max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Asset</DialogTitle>
                    </DialogHeader>
                    <AddAssetForm
                        projectId={projectId}
                        onSubmit={handleAddAsset}
                        onCancel={() => setShowAddAsset(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Right Panel: Asset Detail, Actions, and Skybox */}
            {selectedAsset ? (
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Asset Detail Panel */}
                    <AssetDetailPanel3D
                        key={selectedAsset.id}
                        asset={selectedAsset}
                        assetState={selectedAssetState}
                    />

                    {/* Action Controls */}
                    <AssetActions3D
                        asset={selectedAsset}
                        assetState={selectedAssetState}
                        selectedAnimations={selectedAnimations}
                        onGenerate={handleGenerate}
                        onRig={handleRig}
                        onAnimate={handleAnimate}
                        onToggleAnimation={toggleAnimation}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onRegenerate={handleRegenerate}
                    />
                </div>
            ) : (
                // No asset selected placeholder
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/40">Select an asset from the queue</p>
                    </div>
                </div>
            )}
        </div>
    );
}
