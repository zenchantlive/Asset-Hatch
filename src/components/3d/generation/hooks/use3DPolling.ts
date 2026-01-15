/**
 * 3D Asset Polling Hooks
 *
 * Custom hooks for polling Tripo3D task status during generation,
 * rigging, and animation stages. Uses interval-based polling with
 * automatic cleanup and timeout handling.
 *
 * @see lib/types/3d-generation.ts for Tripo API types
 * @see app/api/generate-3d/[taskId]/status for polling endpoint
 */

import { useCallback, useRef, useEffect } from "react";
import type { Asset3DState } from "../types/3d-queue-types";
import type { AnimationPreset } from "@/lib/types/3d-generation";

// =============================================================================
// Constants
// =============================================================================

// Polling interval in milliseconds (2 seconds)
const POLL_INTERVAL_MS = 2000;

// Maximum polling duration in milliseconds (5 minutes)
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

// =============================================================================
// Types
// =============================================================================

/**
 * Callback to update asset state during polling.
 */
type StateUpdater = React.Dispatch<React.SetStateAction<Map<string, Asset3DState>>>;

/**
 * Return type for the use3DPolling hook.
 */
interface Use3DPollingReturn {
    // Poll draft model generation task
    pollTaskStatus: (assetId: string, taskId: string) => void;
    // Poll rigging task
    pollRigTask: (assetId: string, taskId: string) => void;
    // Poll animation task for specific preset
    pollAnimationTask: (assetId: string, preset: AnimationPreset, taskId: string) => void;
    // Cancel all active polls
    cancelAllPolls: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook providing polling functions for 3D generation tasks.
 *
 * Example usage:
 * ```tsx
 * const { pollTaskStatus, pollRigTask } = use3DPolling(setAssetStates);
 * // After submitting generation task:
 * pollTaskStatus(assetId, taskId);
 * // After submitting rig task:
 * pollRigTask(assetId, taskId);
 * ```
 *
 * @param setAssetStates - State setter for updating asset states
 * @returns Object containing polling functions
 */
export function use3DPolling(setAssetStates: StateUpdater): Use3DPollingReturn {
    // Track active intervals for cleanup
    const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

    // Cleanup all intervals on unmount
    useEffect(() => {
        // Capture current ref value for cleanup (React best practice)
        const intervals = activeIntervalsRef.current;
        return () => {
            intervals.forEach(clearInterval);
            intervals.clear();
        };
    }, []);

    /**
     * Extract model URL from Tripo task output.
     * Handles different response structures depending on task type.
     */
    const extractModelUrl = useCallback((output: Record<string, unknown> | undefined): string | null => {
        if (!output) return null;

        // Direct pbr_model URL (most common)
        if (typeof output.pbr_model === "string") {
            return output.pbr_model;
        }

        // pbr_model as object with url property
        if (output.pbr_model && typeof output.pbr_model === "object") {
            const pbrModel = output.pbr_model as { url?: string };
            if (pbrModel.url) return pbrModel.url;
        }

        // Direct model URL (seen in some Tripo responses)
        if (typeof output.model === "string") {
            return output.model;
        }

        // Fallback: model.url (legacy format)
        if (output.model && typeof output.model === "object") {
            const model = output.model as { url?: string };
            if (model.url) return model.url;
        }

        return null;
    }, []);

    /**
     * Poll draft model generation task until complete.
     * Updates status from "generating" to "generated" or "failed".
     */
    const pollTaskStatus = useCallback(
        (assetId: string, taskId: string) => {
            // Create polling interval
            const pollInterval = setInterval(async () => {
                try {
                    // Fetch current task status from API
                    const response = await fetch(`/api/generate-3d/${taskId}/status`);
                    if (!response.ok) {
                        throw new Error(`Status check failed: ${response.statusText}`);
                    }

                    // Parse response data
                    const data = await response.json() as {
                        status: string;
                        progress?: number;
                        output?: Record<string, unknown>;
                        error?: string;
                    };

                    // Extract model URL from task output
                    const modelUrl = extractModelUrl(data.output);

                    if (data.status === "success" && modelUrl) {
                        // Generation complete - stop polling and update state
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

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
                    } else if (data.status === "failed") {
                        // Generation failed - stop polling and update with error
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            next.set(assetId, {
                                status: "failed",
                                progress: 0,
                                error: data.error || "Generation failed",
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
                                progress: data.progress || 0,
                                draftTaskId: taskId,
                            } as Asset3DState);
                            return next;
                        });
                    }
                } catch (err) {
                    console.error("Draft polling error:", err);
                }
            }, POLL_INTERVAL_MS);

            // Track interval for cleanup
            activeIntervalsRef.current.add(pollInterval);

            // Set timeout to stop polling after max duration
            // IMPORTANT: On timeout, set status to failed so user knows
            setTimeout(() => {
                // Check if interval is still active (not already completed)
                if (activeIntervalsRef.current.has(pollInterval)) {
                    clearInterval(pollInterval);
                    activeIntervalsRef.current.delete(pollInterval);

                    // Set status to failed with timeout error
                    setAssetStates((prev) => {
                        const next = new Map(prev);
                        const current = prev.get(assetId);
                        // Only update if still in generating state
                        if (current?.status === "generating") {
                            next.set(assetId, {
                                ...current,
                                status: "failed",
                                progress: current?.progress || 0,
                                error: "Generation timed out after 5 minutes. The task may still complete on Tripo's server - try refreshing the page.",
                            } as Asset3DState);
                        }
                        return next;
                    });
                    console.warn(`⏱️ Draft generation polling timed out for asset ${assetId}`);
                }
            }, POLL_TIMEOUT_MS);
        },
        [extractModelUrl, setAssetStates]
    );

    /**
     * Poll rigging task until complete.
     * Updates status from "rigging" to "rigged" or "failed".
     */
    const pollRigTask = useCallback(
        (assetId: string, taskId: string) => {
            // Create polling interval
            const pollInterval = setInterval(async () => {
                try {
                    // Fetch current task status
                    const response = await fetch(`/api/generate-3d/${taskId}/status`);
                    if (!response.ok) {
                        throw new Error(`Rig status check failed: ${response.statusText}`);
                    }

                    // Parse response data
                    const data = await response.json() as {
                        status: string;
                        progress?: number;
                        output?: Record<string, unknown>;
                        error?: string;
                    };

                    // Extract rigged model URL
                    const riggedUrl = extractModelUrl(data.output);

                    if (data.status === "success" && riggedUrl) {
                        // Rigging complete - stop polling and update state
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            const current = prev.get(assetId);
                            next.set(assetId, {
                                ...current,
                                status: "rigged",
                                progress: 100,
                                rigTaskId: taskId,
                                riggedModelUrl: riggedUrl,
                            } as Asset3DState);
                            return next;
                        });
                    } else if (data.status === "failed") {
                        // Rigging failed
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            next.set(assetId, {
                                ...prev.get(assetId),
                                status: "failed",
                                error: data.error || "Rigging failed",
                            } as Asset3DState);
                            return next;
                        });
                    } else {
                        // Still rigging - update progress
                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            const current = prev.get(assetId);
                            next.set(assetId, {
                                ...current,
                                status: "rigging",
                                progress: data.progress || 0,
                                rigTaskId: taskId,
                            } as Asset3DState);
                            return next;
                        });
                    }
                } catch (err) {
                    console.error("Rig polling error:", err);
                }
            }, POLL_INTERVAL_MS);

            // Track interval for cleanup
            activeIntervalsRef.current.add(pollInterval);

            // Set timeout with error handling
            setTimeout(() => {
                if (activeIntervalsRef.current.has(pollInterval)) {
                    clearInterval(pollInterval);
                    activeIntervalsRef.current.delete(pollInterval);

                    setAssetStates((prev) => {
                        const next = new Map(prev);
                        const current = prev.get(assetId);
                        if (current?.status === "rigging") {
                            next.set(assetId, {
                                ...current,
                                status: "failed",
                                error: "Rigging timed out after 5 minutes. Try refreshing the page.",
                            } as Asset3DState);
                        }
                        return next;
                    });
                    console.warn(`⏱️ Rigging polling timed out for asset ${assetId}`);
                }
            }, POLL_TIMEOUT_MS);
        },
        [extractModelUrl, setAssetStates]
    );

    /**
     * Poll animation task until complete.
     * Updates status and adds animated URL to animatedModelUrls map.
     */
    const pollAnimationTask = useCallback(
        (assetId: string, preset: AnimationPreset, taskId: string) => {
            // Create polling interval
            const pollInterval = setInterval(async () => {
                try {
                    // Fetch current task status
                    const response = await fetch(`/api/generate-3d/${taskId}/status`);
                    if (!response.ok) {
                        throw new Error(`Animation status check failed: ${response.statusText}`);
                    }

                    // Parse response data
                    const data = await response.json() as {
                        status: string;
                        progress?: number;
                        output?: Record<string, unknown>;
                        error?: string;
                    };

                    // Extract animated model URL
                    const animatedUrl = extractModelUrl(data.output);

                    if (data.status === "success" && animatedUrl) {
                        // Animation complete - add URL to map
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            const current = prev.get(assetId);
                            const existingAnimUrls = current?.animatedModelUrls || {};
                            const existingTaskIds = current?.animationTaskIds || {};

                            next.set(assetId, {
                                ...current,
                                status: "complete",
                                progress: 100,
                                animationTaskIds: { ...existingTaskIds, [preset]: taskId },
                                animatedModelUrls: { ...existingAnimUrls, [preset]: animatedUrl },
                            } as Asset3DState);
                            return next;
                        });
                    } else if (data.status === "failed") {
                        // Animation failed
                        clearInterval(pollInterval);
                        activeIntervalsRef.current.delete(pollInterval);

                        setAssetStates((prev) => {
                            const next = new Map(prev);
                            next.set(assetId, {
                                ...prev.get(assetId),
                                status: "failed",
                                error: data.error || `Animation ${preset} failed`,
                            } as Asset3DState);
                            return next;
                        });
                    }
                    // Note: We don't update progress for individual animations as multiple may run in parallel
                } catch (err) {
                    console.error("Animation polling error:", err);
                }
            }, POLL_INTERVAL_MS);

            // Track interval for cleanup
            activeIntervalsRef.current.add(pollInterval);

            // Set timeout with error handling
            setTimeout(() => {
                if (activeIntervalsRef.current.has(pollInterval)) {
                    clearInterval(pollInterval);
                    activeIntervalsRef.current.delete(pollInterval);

                    setAssetStates((prev) => {
                        const next = new Map(prev);
                        const current = prev.get(assetId);
                        if (current?.status === "animating") {
                            next.set(assetId, {
                                ...current,
                                status: "failed",
                                error: `Animation (${preset}) timed out after 5 minutes. Try refreshing the page.`,
                            } as Asset3DState);
                        }
                        return next;
                    });
                    console.warn(`⏱️ Animation ${preset} polling timed out for asset ${assetId}`);
                }
            }, POLL_TIMEOUT_MS);
        },
        [extractModelUrl, setAssetStates]
    );

    /**
     * Cancel all active polling intervals.
     * Called when component unmounts or user navigates away.
     */
    const cancelAllPolls = useCallback(() => {
        activeIntervalsRef.current.forEach(clearInterval);
        activeIntervalsRef.current.clear();
    }, []);

    return {
        pollTaskStatus,
        pollRigTask,
        pollAnimationTask,
        cancelAllPolls,
    };
}
