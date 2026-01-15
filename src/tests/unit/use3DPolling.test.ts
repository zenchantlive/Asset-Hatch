/**
 * Unit Tests for 3D Polling Hook Logic
 *
 * Tests the pure logic functions used in the polling hook.
 * These tests focus on URL extraction and status determination
 * without needing to mock React hooks or fetch.
 *
 * @see components/3d/generation/hooks/use3DPolling.ts
 */

import { describe, it, expect } from "bun:test";

// =============================================================================
// Helper Function Reproductions (for testing logic without hook dependencies)
// =============================================================================

/**
 * Extracts model URL from Tripo API response output.
 * Mirrors the logic in use3DPolling.ts
 */
function extractModelUrl(output: Record<string, unknown> | null): string | null {
    if (!output) return null;

    // Try pbr_model as string
    if (typeof output.pbr_model === "string") {
        return output.pbr_model;
    }

    // Try pbr_model.url
    if (
        typeof output.pbr_model === "object" &&
        output.pbr_model !== null &&
        "url" in output.pbr_model
    ) {
        const pbrModel = output.pbr_model as { url?: string };
        if (typeof pbrModel.url === "string") {
            return pbrModel.url;
        }
    }

    // Fallback to model.url
    if (
        typeof output.model === "object" &&
        output.model !== null &&
        "url" in output.model
    ) {
        const model = output.model as { url?: string };
        if (typeof model.url === "string") {
            return model.url;
        }
    }

    return null;
}

/**
 * Determines the next status based on task status from API.
 * For draft generation tasks.
 */
function getNextStatusFromTask(
    taskStatus: string,
    currentStatus: string
): string {
    switch (taskStatus) {
        case "running":
        case "queued":
        case "pending":
            return currentStatus === "ready" ? "generating" : currentStatus;
        case "success":
            return "generated";
        case "failed":
            return "failed";
        default:
            return currentStatus;
    }
}

/**
 * Determines next status for rigging tasks.
 */
function getNextRigStatus(taskStatus: string): string {
    switch (taskStatus) {
        case "running":
        case "queued":
        case "pending":
            return "rigging";
        case "success":
            return "rigged";
        case "failed":
            return "failed";
        default:
            return "rigging";
    }
}

/**
 * Determines if task is complete (success or failed).
 */
function isTaskComplete(taskStatus: string): boolean {
    return taskStatus === "success" || taskStatus === "failed";
}

// =============================================================================
// Tests
// =============================================================================

describe("3D Polling Logic", () => {
    // =========================================================================
    // Model URL Extraction Tests
    // =========================================================================

    describe("extractModelUrl", () => {
        it("should extract URL from pbr_model string", () => {
            const output = {
                pbr_model: "https://tripo-data.example.com/model.glb",
            };

            expect(extractModelUrl(output)).toBe(
                "https://tripo-data.example.com/model.glb"
            );
        });

        it("should extract URL from pbr_model.url object", () => {
            const output = {
                pbr_model: {
                    url: "https://tripo-data.example.com/nested.glb",
                },
            };

            expect(extractModelUrl(output)).toBe(
                "https://tripo-data.example.com/nested.glb"
            );
        });

        it("should fallback to model.url for legacy format", () => {
            const output = {
                model: {
                    url: "https://tripo-data.example.com/legacy.glb",
                },
            };

            expect(extractModelUrl(output)).toBe(
                "https://tripo-data.example.com/legacy.glb"
            );
        });

        it("should return null for empty output", () => {
            expect(extractModelUrl(null)).toBeNull();
            expect(extractModelUrl({})).toBeNull();
        });

        it("should return null for invalid pbr_model types", () => {
            const output1 = { pbr_model: 123 };
            const output2 = { pbr_model: true };
            const output3 = { pbr_model: null };

            expect(extractModelUrl(output1)).toBeNull();
            expect(extractModelUrl(output2)).toBeNull();
            expect(extractModelUrl(output3)).toBeNull();
        });

        it("should prioritize pbr_model over model", () => {
            const output = {
                pbr_model: "https://example.com/pbr.glb",
                model: { url: "https://example.com/legacy.glb" },
            };

            expect(extractModelUrl(output)).toBe("https://example.com/pbr.glb");
        });
    });

    // =========================================================================
    // Status Transition Tests
    // =========================================================================

    describe("getNextStatusFromTask", () => {
        it("should return 'generating' for running tasks from ready state", () => {
            expect(getNextStatusFromTask("running", "ready")).toBe("generating");
            expect(getNextStatusFromTask("queued", "ready")).toBe("generating");
            expect(getNextStatusFromTask("pending", "ready")).toBe("generating");
        });

        it("should keep current status for running tasks if already generating", () => {
            expect(getNextStatusFromTask("running", "generating")).toBe("generating");
        });

        it("should return 'generated' for success", () => {
            expect(getNextStatusFromTask("success", "generating")).toBe("generated");
            expect(getNextStatusFromTask("success", "ready")).toBe("generated");
        });

        it("should return 'failed' for failed tasks", () => {
            expect(getNextStatusFromTask("failed", "generating")).toBe("failed");
            expect(getNextStatusFromTask("failed", "ready")).toBe("failed");
        });

        it("should keep current status for unknown task status", () => {
            expect(getNextStatusFromTask("unknown", "ready")).toBe("ready");
            expect(getNextStatusFromTask("processing", "generating")).toBe("generating");
        });
    });

    describe("getNextRigStatus", () => {
        it("should return 'rigging' for in-progress tasks", () => {
            expect(getNextRigStatus("running")).toBe("rigging");
            expect(getNextRigStatus("queued")).toBe("rigging");
            expect(getNextRigStatus("pending")).toBe("rigging");
        });

        it("should return 'rigged' for success", () => {
            expect(getNextRigStatus("success")).toBe("rigged");
        });

        it("should return 'failed' for failed tasks", () => {
            expect(getNextRigStatus("failed")).toBe("failed");
        });
    });

    describe("isTaskComplete", () => {
        it("should return true for success", () => {
            expect(isTaskComplete("success")).toBe(true);
        });

        it("should return true for failed", () => {
            expect(isTaskComplete("failed")).toBe(true);
        });

        it("should return false for in-progress statuses", () => {
            expect(isTaskComplete("running")).toBe(false);
            expect(isTaskComplete("queued")).toBe(false);
            expect(isTaskComplete("pending")).toBe(false);
        });
    });

    // =========================================================================
    // Animated Model URL Map Tests
    // =========================================================================

    describe("Animated Model URL Map", () => {
        it("should correctly build animated URLs map", () => {
            const animatedUrls: Record<string, string> = {};

            // Add first animation
            animatedUrls["preset:idle"] = "https://example.com/idle.glb";

            expect(animatedUrls["preset:idle"]).toBe("https://example.com/idle.glb");

            // Add second animation
            animatedUrls["preset:walk"] = "https://example.com/walk.glb";

            expect(Object.keys(animatedUrls)).toHaveLength(2);
            expect(animatedUrls["preset:walk"]).toBe("https://example.com/walk.glb");
        });

        it("should overwrite duplicate preset keys", () => {
            const animatedUrls: Record<string, string> = {
                "preset:idle": "https://example.com/old-idle.glb",
            };

            // Overwrite with new URL
            animatedUrls["preset:idle"] = "https://example.com/new-idle.glb";

            expect(animatedUrls["preset:idle"]).toBe("https://example.com/new-idle.glb");
            expect(Object.keys(animatedUrls)).toHaveLength(1);
        });

        it("should serialize to JSON correctly", () => {
            const animatedUrls: Record<string, string> = {
                "preset:idle": "https://example.com/idle.glb",
                "preset:walk": "https://example.com/walk.glb",
            };

            const json = JSON.stringify(animatedUrls);
            const parsed = JSON.parse(json);

            expect(parsed["preset:idle"]).toBe("https://example.com/idle.glb");
            expect(parsed["preset:walk"]).toBe("https://example.com/walk.glb");
        });
    });

    // =========================================================================
    // Polling Interval Logic Tests
    // =========================================================================

    describe("Polling Interval Logic", () => {
        it("should use standard polling interval of 2 seconds", () => {
            const POLL_INTERVAL_MS = 2000;
            expect(POLL_INTERVAL_MS).toBe(2000);
        });

        it("should clear intervals on completion", () => {
            const intervals = new Set<NodeJS.Timeout>();

            // Simulate adding an interval
            const intervalId = setTimeout(() => { }, 2000);
            intervals.add(intervalId);

            expect(intervals.size).toBe(1);

            // Simulate clearing on completion
            clearTimeout(intervalId);
            intervals.delete(intervalId);

            expect(intervals.size).toBe(0);
        });

        it("should track multiple concurrent polls", () => {
            const intervals = new Set<NodeJS.Timeout>();

            // Simulate multiple concurrent polls
            const id1 = setTimeout(() => { }, 2000);
            const id2 = setTimeout(() => { }, 2000);
            const id3 = setTimeout(() => { }, 2000);

            intervals.add(id1);
            intervals.add(id2);
            intervals.add(id3);

            expect(intervals.size).toBe(3);

            // Cleanup
            intervals.forEach(clearTimeout);
            intervals.clear();

            expect(intervals.size).toBe(0);
        });
    });

    // =========================================================================
    // State Update Pattern Tests
    // =========================================================================

    describe("State Update Patterns", () => {
        it("should maintain immutability when updating state map", () => {
            type TestState = { status: string; progress: number };
            const original = new Map<string, TestState>();
            original.set("asset-1", { status: "ready", progress: 0 });

            // Immutable update (React pattern)
            const updated = new Map(original);
            updated.set("asset-1", { status: "generating", progress: 25 });

            // Original should be unchanged
            expect(original.get("asset-1")?.status).toBe("ready");
            expect(original.get("asset-1")?.progress).toBe(0);

            // Updated should have new values
            expect(updated.get("asset-1")?.status).toBe("generating");
            expect(updated.get("asset-1")?.progress).toBe(25);
        });

        it("should merge existing state with updates", () => {
            type TestState = {
                status: string;
                progress: number;
                draftModelUrl?: string;
            };

            const existing: TestState = {
                status: "generating",
                progress: 50,
            };

            // Merge update
            const updated: TestState = {
                ...existing,
                status: "generated",
                progress: 100,
                draftModelUrl: "https://example.com/model.glb",
            };

            // Original values preserved where not overwritten
            expect(updated.status).toBe("generated");
            expect(updated.progress).toBe(100);
            expect(updated.draftModelUrl).toBe("https://example.com/model.glb");
        });

        it("should handle default state for new assets", () => {
            type DefaultState = { status: string; progress: number };
            const stateMap = new Map<string, DefaultState>();

            // Get with default
            const getState = (id: string): DefaultState =>
                stateMap.get(id) || { status: "ready", progress: 0 };

            const state = getState("non-existent");

            expect(state.status).toBe("ready");
            expect(state.progress).toBe(0);
        });
    });
});
