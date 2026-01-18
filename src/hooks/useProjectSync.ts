"use client";

// -----------------------------------------------------------------------------
// useProjectSync Hook
// Manages project sync state and operations (Phase 6)
// -----------------------------------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import type { ProjectStatus } from "@/lib/types/unified-project";

/**
 * Return type for useProjectSync hook
 */
interface UseProjectSyncReturn {
  /** Current project status or null if not loaded */
  status: ProjectStatus | null;
  /** Whether status is loading */
  isLoading: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
 /** Any error message */
  error: string | null;
  /** Refresh status from server */
  refreshStatus: () => Promise<void>;
  /** Trigger asset sync */
  syncAssets: () => Promise<void>;
  /** Number of pending assets (convenience) */
  pendingCount: number;
}

/**
 * Hook for managing project sync state
 *
 * Provides:
 * - Status polling/refresh
 * - Sync triggering
 * - Loading and error states
 */
export function useProjectSync(projectId: string): UseProjectSyncReturn {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh project status from server
   */
  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * Trigger asset sync
   */
  const syncAssets = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/assets/sync`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to sync assets");
      }

      // Refresh status after successful sync
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSyncing(false);
    }
  }, [projectId, refreshStatus]);

  // Initial fetch
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    isSyncing,
    error,
    refreshStatus,
    syncAssets,
    pendingCount: status?.pendingAssetCount ?? 0,
  };
}
