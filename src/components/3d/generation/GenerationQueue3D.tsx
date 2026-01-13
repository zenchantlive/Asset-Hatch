/**
 * GenerationQueue3D Component
 *
 * 3D-specific generation UI that replaces the 2D direction grid with:
 * - Tripo3D text-to-model generation
 * - Interactive ModelViewer for 3D preview
 * - Auto-rigging controls for [RIG] assets
 * - Animation preset selection
 * - GLB download options
 *
 * @see lib/3d-plan-parser.ts for plan parsing
 * @see components/3d/generation/ModelViewer.tsx for 3D preview
 * @see app/api/generate-3d/route.ts for generation API
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Loader2,
    Boxes,
    PersonStanding,
    TreePine,
    Package,
    ChevronDown,
    ChevronRight,
    Download,
    Play,
    Check,
    AlertCircle,
    Bone,
    Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { parse3DPlan, type Parsed3DAsset } from "@/lib/3d-plan-parser";
import { ModelViewer } from "@/components/3d/generation/ModelViewer";
import { ANIMATION_PRESET_LABELS, type AnimationPreset } from "@/lib/types/3d-generation";

// =============================================================================
// Types
// =============================================================================

/**
 * Status of a 3D asset through its generation lifecycle
 */
type Asset3DStatus =
    | "ready"       // Ready to generate
    | "generating"  // Tripo task in progress (draft model)
    | "generated"   // Draft model complete
    | "rigging"     // Auto-rig in progress
    | "rigged"      // Rigging complete
    | "animating"   // Applying animation presets
    | "complete"    // All requested processing done
    | "failed";     // Error occurred

/**
 * State for a single 3D asset
 */
interface Asset3DState {
    // Current status in the generation pipeline
    status: Asset3DStatus;
    // Progress percentage (0-100) during generation
    progress: number;
    // Tripo task IDs for each stage
    draftTaskId?: string;
    rigTaskId?: string;
    animationTaskIds?: Record<string, string>;
    // Model URLs as each stage completes
    draftModelUrl?: string;
    riggedModelUrl?: string;
    animatedModelUrls?: Record<string, string>;
    // Error message if failed
    error?: string;
}

/**
 * Props for the GenerationQueue3D component
 */
interface GenerationQueue3DProps {
    // Project ID to load plan and generate assets for
    projectId: string;
}

// =============================================================================
// Constants
// =============================================================================

// Category icons for the asset tree
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    Characters: PersonStanding,
    Environment: TreePine,
    Props: Package,
    default: Boxes,
};

// =============================================================================
// Main Component
// =============================================================================

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

                const data = await response.json();

                if (!data.success || !data.files || data.files.length === 0) {
                    setLoadError("No plan found. Please create a plan in the Planning tab first.");
                    setIsLoading(false);
                    return;
                }

                const entitiesFile = data.files[0];

                if (!entitiesFile.content || entitiesFile.content.trim() === "") {
                    setLoadError("Plan file is empty. Please create a valid plan first.");
                    setIsLoading(false);
                    return;
                }

                // Parse the markdown plan using 3D parser
                const parsed = parse3DPlan(entitiesFile.content, { projectId });

                if (!parsed || parsed.length === 0) {
                    setLoadError("No assets found in plan. Make sure your plan uses [RIG] or [STATIC] tags.");
                    setIsLoading(false);
                    return;
                }

                setParsedAssets(parsed);
                // Select the first asset by default
                if (parsed.length > 0) {
                    setSelectedAssetId(parsed[0].id);
                }
                setIsLoading(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                setLoadError(`Failed to load plan: ${errorMessage}`);
                setIsLoading(false);
            }
        }

        loadPlan();
    }, [projectId]);

    // -------------------------------------------------------------------------
    // Derived State
    // -------------------------------------------------------------------------

    // Group assets by category
    const assetsByCategory = useMemo(() => {
        const grouped: Record<string, Parsed3DAsset[]> = {};
        for (const asset of parsedAssets) {
            if (!grouped[asset.category]) {
                grouped[asset.category] = [];
            }
            grouped[asset.category].push(asset);
        }
        return grouped;
    }, [parsedAssets]);

    // Currently selected asset
    const selectedAsset = useMemo(() => {
        return parsedAssets.find((a) => a.id === selectedAssetId) || null;
    }, [parsedAssets, selectedAssetId]);

    // State of the selected asset
    const selectedAssetState = useMemo(() => {
        if (!selectedAssetId) return null;
        return assetStates.get(selectedAssetId) || { status: "ready" as Asset3DStatus, progress: 0 };
    }, [selectedAssetId, assetStates]);

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    // Toggle category collapse
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

    // Poll task status until complete
    const pollTaskStatus = useCallback(
        async (assetId: string, taskId: string) => {
            const pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/generate-3d/${taskId}/status`);
                    if (!response.ok) {
                        throw new Error(`Status check failed: ${response.statusText}`);
                    }

                    const data = await response.json();
                    const { status, progress, output, error } = data;

                    // Extract model URL from Tripo response (pbr_model, not model.url)
                    const modelUrl = 
                        output?.pbr_model ||           // Direct URL string
                        output?.model?.url ||          // Legacy fallback
                        null;

                    if (status === "success" && modelUrl) {
                        // Generation complete
                        clearInterval(pollInterval);
                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            next.set(assetId, {
                                status: "generated",
                                progress: 100,
                                draftTaskId: taskId,
                                draftModelUrl: modelUrl,
                            });
                            return next;
                        });
                    } else if (status === "failed") {
                        // Generation failed
                        clearInterval(pollInterval);
                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            next.set(assetId, {
                                status: "failed",
                                progress: 0,
                                error: error || "Generation failed",
                            });
                            return next;
                        });
                    } else {
                        // Still running - update progress
                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            const current = prev.get(assetId);
                            next.set(assetId, {
                                ...current,
                                status: "generating",
                                progress: progress || 0,
                                draftTaskId: taskId,
                            } as Asset3DState);
                            return next;
                        });
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 2000); // Poll every 2 seconds

            // Clean up after 5 minutes (timeout)
            setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
        },
        []
    );

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

            const data = await response.json();
            const taskId = data.taskId;

            // Store task ID and start polling
            setAssetStates((prev) => {
                const next = new Map(prev);
                next.set(selectedAssetId, {
                    status: "generating",
                    progress: 0,
                    draftTaskId: taskId,
                });
                return next;
            });

            // Start polling for task status
            pollTaskStatus(selectedAssetId, taskId);
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

    // Handle auto-rig button click
    const handleRig = useCallback(async () => {
        if (!selectedAssetId || !selectedAssetState?.draftModelUrl) return;

        setAssetStates((prev) => {
            const next = new Map(prev);
            const current = prev.get(selectedAssetId);
            next.set(selectedAssetId, { ...current, status: "rigging", progress: 0 } as Asset3DState);
            return next;
        });

        try {
            const response = await fetch("/api/generate-3d/rig", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetId: selectedAssetId,
                    draftModelUrl: selectedAssetState.draftModelUrl,
                }),
            });

            if (!response.ok) {
                throw new Error(`Rigging failed: ${response.statusText}`);
            }

            const data = await response.json();
            // Poll for rig task completion...
            console.log("Rig task submitted:", data.taskId);
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
    }, [selectedAssetId, selectedAssetState, projectId]);

    // -------------------------------------------------------------------------
    // Render Helpers
    // -------------------------------------------------------------------------

    // Render status badge
    const renderStatusBadge = (status: Asset3DStatus, progress: number) => {
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

        const badge = badges[status];
        return (
            <span className={cn("flex items-center gap-1 text-xs", badge.className)}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

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
            {/* Left Panel: Asset Tree */}
            <div className="w-64 shrink-0 border-r border-white/10 bg-glass-bg/20 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-white/90">3D Asset Queue</h2>
                    <p className="text-xs text-white/50 mt-1">
                        {parsedAssets.length} Total Assets • {Object.keys(assetsByCategory).length} Categories
                    </p>
                </div>

                {/* Asset Tree */}
                <div className="flex-1 overflow-y-auto p-2">
                    {Object.entries(assetsByCategory).map(([category, assets]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        const CategoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;

                        return (
                            <div key={category} className="mb-2">
                                {/* Category Header */}
                                <button
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left"
                                    onClick={() => toggleCategory(category)}
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="h-4 w-4 text-white/40" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-white/40" />
                                    )}
                                    <CategoryIcon className="h-4 w-4 text-cyan-400" />
                                    <span className="text-sm text-white/80 flex-1">{category}</span>
                                    <span className="text-xs text-white/40">{assets.length}</span>
                                </button>

                                {/* Asset List */}
                                {!isCollapsed && (
                                    <div className="ml-4 mt-1 space-y-0.5">
                                        {assets.map((asset) => {
                                            const state = assetStates.get(asset.id);
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
                                                    onClick={() => setSelectedAssetId(asset.id)}
                                                >
                                                    {/* Rig/Static badge */}
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
                                                    {/* Asset name */}
                                                    <span className="text-xs text-white/80 flex-1 truncate">
                                                        {asset.name}
                                                    </span>
                                                    {/* Status indicator */}
                                                    {state && renderStatusBadge(state.status, state.progress)}
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

            {/* Right Panel: Asset Detail */}
            <div className="flex-1 flex flex-col bg-glass-bg/10">
                {selectedAsset ? (
                    <>
                        {/* Asset Header */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        "px-2 py-1 text-xs font-medium rounded",
                                        selectedAsset.shouldRig
                                            ? "bg-purple-500/20 text-purple-300"
                                            : "bg-blue-500/20 text-blue-300"
                                    )}
                                >
                                    {selectedAsset.shouldRig ? "RIG" : "STATIC"}
                                </span>
                                <h2 className="text-lg font-semibold text-white/90">{selectedAsset.name}</h2>
                            </div>
                            {selectedAsset.description && (
                                <p className="text-sm text-white/50 mt-2">{selectedAsset.description}</p>
                            )}
                        </div>

                        {/* Model Viewer */}
                        <div className="flex-1 min-h-[300px] p-4">
                            {selectedAssetState?.draftModelUrl ? (
                                <ModelViewer modelUrl={selectedAssetState.draftModelUrl} className="h-full" />
                            ) : (
                                <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20">
                                    <div className="text-center">
                                        <Boxes className="h-12 w-12 mx-auto text-white/20 mb-2" />
                                        <p className="text-white/40 text-sm">No model generated yet</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Bar */}
                        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4">
                            <span className="text-xs text-white/50">Status:</span>
                            {renderStatusBadge(
                                selectedAssetState?.status || "ready",
                                selectedAssetState?.progress || 0
                            )}
                            {selectedAssetState?.status === "generated" && selectedAsset.shouldRig && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span className="text-xs text-white/50">Rig Status:</span>
                                    <span className="text-xs text-purple-400">Not Rigged</span>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/5 flex items-center gap-3">
                            {/* Generate Button */}
                            {(!selectedAssetState || selectedAssetState.status === "ready") && (
                                <Button onClick={handleGenerate} className="bg-cyan-600 hover:bg-cyan-500">
                                    <Play className="h-4 w-4 mr-2" />
                                    Generate
                                </Button>
                            )}

                            {/* Generating progress */}
                            {selectedAssetState?.status === "generating" && (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                                    <span className="text-sm text-cyan-400">Generating... {selectedAssetState.progress}%</span>
                                </div>
                            )}

                            {/* Rig Button (for RIG assets after generation) */}
                            {selectedAsset.shouldRig &&
                                selectedAssetState?.status === "generated" && (
                                    <Button onClick={handleRig} variant="outline" className="border-purple-500/50 text-purple-300">
                                        <Bone className="h-4 w-4 mr-2" />
                                        Auto-Rig
                                    </Button>
                                )}

                            {/* Animations Dropdown (for RIG assets after rigging) */}
                            {selectedAsset.shouldRig && selectedAssetState?.status === "rigged" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="border-yellow-500/50 text-yellow-300">
                                            <Film className="h-4 w-4 mr-2" />
                                            Animations
                                            <ChevronDown className="h-4 w-4 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-glass-panel border-glass-border">
                                        {(Object.keys(ANIMATION_PRESET_LABELS) as AnimationPreset[]).map((preset) => (
                                            <DropdownMenuItem
                                                key={preset}
                                                onClick={() => toggleAnimation(preset)}
                                                className="flex items-center gap-2"
                                            >
                                                <span className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center",
                                                    selectedAnimations.has(preset)
                                                        ? "bg-cyan-500 border-cyan-500"
                                                        : "border-white/30"
                                                )}>
                                                    {selectedAnimations.has(preset) && <Check className="h-3 w-3 text-white" />}
                                                </span>
                                                {ANIMATION_PRESET_LABELS[preset]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Download Dropdown */}
                            {selectedAssetState?.draftModelUrl && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="ml-auto">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download (.glb)
                                            <ChevronDown className="h-4 w-4 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-glass-panel border-glass-border" align="end">
                                        <DropdownMenuItem asChild>
                                            <a href={selectedAssetState.draftModelUrl} download>
                                                Draft Model
                                            </a>
                                        </DropdownMenuItem>
                                        {selectedAssetState.riggedModelUrl && (
                                            <DropdownMenuItem asChild>
                                                <a href={selectedAssetState.riggedModelUrl} download>
                                                    Rigged Model
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                        {selectedAssetState.animatedModelUrls &&
                                            Object.entries(selectedAssetState.animatedModelUrls).map(([preset, url]) => (
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

                        {/* Error Display */}
                        {selectedAssetState?.error && (
                            <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-400">{selectedAssetState.error}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/40">Select an asset from the queue</p>
                    </div>
                )}
            </div>
        </div>
    );
}
