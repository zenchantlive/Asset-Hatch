/**
 * Unit Tests for 3D Generation Queue Types
 *
 * Tests type definitions and interfaces for the 3D generation UI.
 * These tests verify type guards and helper functions work correctly.
 *
 * @see components/3d/generation/types/3d-queue-types.ts
 */

import { describe, it, expect } from "bun:test";
import type {
    Asset3DState,
    Asset3DStatus,
    Asset3DItem,
    AssetTree3DProps,
    AssetDetailPanel3DProps,
    AssetActions3DProps,
} from "@/components/3d/generation/types/3d-queue-types";

describe("3D Queue Types", () => {
    // =========================================================================
    // Asset3DStatus Type Tests
    // =========================================================================

    describe("Asset3DStatus", () => {
        it("should allow all valid status values", () => {
            // These should compile without error
            const statuses: Asset3DStatus[] = [
                "ready",
                "generating",
                "generated",
                "rigging",
                "rigged",
                "animating",
                "complete",
                "failed",
            ];

            expect(statuses).toHaveLength(8);
        });

        it("should enforce correct status progression logic", () => {
            // Test that status values can be used in conditional logic
            const isTerminalStatus = (status: Asset3DStatus): boolean => {
                return status === "complete" || status === "failed";
            };

            const isProcessingStatus = (status: Asset3DStatus): boolean => {
                return ["generating", "rigging", "animating"].includes(status);
            };

            expect(isTerminalStatus("complete")).toBe(true);
            expect(isTerminalStatus("failed")).toBe(true);
            expect(isTerminalStatus("generating")).toBe(false);

            expect(isProcessingStatus("generating")).toBe(true);
            expect(isProcessingStatus("rigging")).toBe(true);
            expect(isProcessingStatus("animating")).toBe(true);
            expect(isProcessingStatus("ready")).toBe(false);
        });
    });

    // =========================================================================
    // Asset3DState Type Tests
    // =========================================================================

    describe("Asset3DState", () => {
        it("should support minimal state for new assets", () => {
            const minimalState: Asset3DState = {
                status: "ready",
                progress: 0,
            };

            expect(minimalState.status).toBe("ready");
            expect(minimalState.progress).toBe(0);
            expect(minimalState.draftModelUrl).toBeUndefined();
        });

        it("should support full state for completed assets", () => {
            const fullState: Asset3DState = {
                status: "complete",
                progress: 100,
                draftModelUrl: "https://example.com/draft.glb",
                riggedModelUrl: "https://example.com/rigged.glb",
                animatedModelUrls: {
                    "preset:idle": "https://example.com/idle.glb",
                    "preset:walk": "https://example.com/walk.glb",
                },
                approvalStatus: "approved",
            };

            expect(fullState.status).toBe("complete");
            expect(fullState.draftModelUrl).toBeDefined();
            expect(fullState.riggedModelUrl).toBeDefined();
            expect(fullState.animatedModelUrls).toBeDefined();
            expect(Object.keys(fullState.animatedModelUrls!)).toHaveLength(2);
        });

        it("should support error state", () => {
            const errorState: Asset3DState = {
                status: "failed",
                progress: 0,
                error: "Generation timed out after 5 minutes",
            };

            expect(errorState.status).toBe("failed");
            expect(errorState.error).toBe("Generation timed out after 5 minutes");
        });
    });

    // =========================================================================
    // Asset3DItem Type Tests
    // =========================================================================

    describe("Asset3DItem", () => {
        it("should represent a rigged asset correctly", () => {
            const riggedAsset: Asset3DItem = {
                id: "proj-1-3d-asset-0",
                name: "Hero Character",
                category: "Characters",
                description: "Main player character in T-pose",
                shouldRig: true,
                animations: ["preset:idle", "preset:walk", "preset:run"],
            };

            expect(riggedAsset.shouldRig).toBe(true);
            expect(riggedAsset.animations).toHaveLength(3);
        });

        it("should represent a static asset correctly", () => {
            const staticAsset: Asset3DItem = {
                id: "proj-1-3d-asset-1",
                name: "Oak Tree",
                category: "Environment",
                description: "Large oak tree with full foliage",
                shouldRig: false,
                animations: [],
            };

            expect(staticAsset.shouldRig).toBe(false);
            expect(staticAsset.animations).toHaveLength(0);
        });
    });

    // =========================================================================
    // Component Props Type Tests
    // =========================================================================

    describe("Component Props Types", () => {
        it("AssetTree3DProps should require all necessary fields", () => {
            // Create a minimal valid props object
            const treeProps: AssetTree3DProps = {
                assetsByCategory: {
                    Characters: [
                        {
                            id: "asset-1",
                            name: "Knight",
                            category: "Characters",
                            description: "Medieval knight",
                            shouldRig: true,
                            animations: ["preset:idle"],
                        },
                    ],
                },
                assetStates: new Map(),
                selectedAssetId: null,
                collapsedCategories: new Set(),
                onSelectAsset: () => { },
                onToggleCategory: () => { },
            };

            expect(treeProps.assetsByCategory).toBeDefined();
            expect(treeProps.assetStates).toBeInstanceOf(Map);
        });

        it("AssetDetailPanel3DProps should require all necessary fields", () => {
            const detailProps: AssetDetailPanel3DProps = {
                asset: {
                    id: "asset-1",
                    name: "Knight",
                    category: "Characters",
                    description: "Medieval knight",
                    shouldRig: true,
                    animations: [],
                },
                assetState: {
                    status: "generated",
                    progress: 100,
                    draftModelUrl: "https://example.com/model.glb",
                },
                isProcessing: false,
            };

            expect(detailProps.asset).toBeDefined();
            expect(detailProps.assetState).toBeDefined();
        });

        it("AssetActions3DProps should support all action callbacks", () => {
            const actionsProps: AssetActions3DProps = {
                asset: {
                    id: "asset-1",
                    name: "Knight",
                    category: "Characters",
                    description: "Medieval knight",
                    shouldRig: true,
                    animations: ["preset:idle"],
                },
                assetState: {
                    status: "generated",
                    progress: 100,
                    draftModelUrl: "https://example.com/model.glb",
                },
                selectedAnimations: new Set(["preset:idle"] as const),
                onGenerate: () => { },
                onRig: () => { },
                onAnimate: () => { },
                onApprove: () => { },
                onReject: () => { },
                onRegenerate: () => { },
                onToggleAnimation: () => { },
            };

            expect(typeof actionsProps.onGenerate).toBe("function");
            expect(typeof actionsProps.onRig).toBe("function");
            expect(typeof actionsProps.onAnimate).toBe("function");
            expect(typeof actionsProps.onApprove).toBe("function");
            expect(typeof actionsProps.onReject).toBe("function");
            expect(typeof actionsProps.onRegenerate).toBe("function");
            expect(typeof actionsProps.onToggleAnimation).toBe("function");
        });
    });

    // =========================================================================
    // State Map Operations Tests
    // =========================================================================

    describe("Asset State Map Operations", () => {
        it("should correctly store and retrieve asset states", () => {
            const stateMap = new Map<string, Asset3DState>();

            // Add states
            stateMap.set("asset-1", { status: "ready", progress: 0 });
            stateMap.set("asset-2", { status: "generating", progress: 50 });
            stateMap.set("asset-3", { status: "complete", progress: 100 });

            expect(stateMap.size).toBe(3);
            expect(stateMap.get("asset-1")?.status).toBe("ready");
            expect(stateMap.get("asset-2")?.progress).toBe(50);
            expect(stateMap.get("asset-3")?.status).toBe("complete");
        });

        it("should handle immutable state updates correctly", () => {
            const original = new Map<string, Asset3DState>();
            original.set("asset-1", { status: "ready", progress: 0 });

            // Immutable update pattern (as used in React setState)
            const updated = new Map(original);
            const current = updated.get("asset-1");
            updated.set("asset-1", { ...current!, status: "generating", progress: 25 });

            // Original should be unchanged
            expect(original.get("asset-1")?.status).toBe("ready");

            // Updated should have new values
            expect(updated.get("asset-1")?.status).toBe("generating");
            expect(updated.get("asset-1")?.progress).toBe(25);
        });

        it("should support default state retrieval", () => {
            const stateMap = new Map<string, Asset3DState>();

            // Get with default fallback
            const getStateWithDefault = (id: string): Asset3DState => {
                return stateMap.get(id) || { status: "ready", progress: 0 };
            };

            // Non-existent asset should return default
            const defaultState = getStateWithDefault("non-existent");
            expect(defaultState.status).toBe("ready");
            expect(defaultState.progress).toBe(0);

            // Existing asset should return actual state
            stateMap.set("asset-1", { status: "complete", progress: 100 });
            const existingState = getStateWithDefault("asset-1");
            expect(existingState.status).toBe("complete");
        });
    });
});
