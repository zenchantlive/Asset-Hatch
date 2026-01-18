/**
 * useAssetUpdates Hook
 *
 * Manages asset update checking and version sync state.
 * Phase 8b: Version Conflict Resolution - Frontend state management
 *
 * @example
 * const {
 *   updates,
 *   isChecking,
 *   isSyncing,
 *   checkForUpdates,
 *   syncUpdate,
 *   syncAll,
 *   dismissUpdates
 * } = useAssetUpdates(gameId);
 */

"use client";

import { useState, useCallback } from "react";
import type { AssetVersionInfo } from "@/lib/types/asset-version";

interface UseAssetUpdatesReturn {
  /** Array of assets with updates available */
  updates: AssetVersionInfo[];
  /** Whether updates check is in progress */
  isChecking: boolean;
  /** Whether any sync operation is in progress */
  isSyncing: boolean;
  /** Error message if check or sync failed */
  error: string | null;
  /** Check for updates for this game */
  checkForUpdates: () => Promise<boolean>;
  /** Sync a specific asset to latest version */
  syncUpdate: (refId: string) => Promise<boolean>;
  /** Sync all available updates */
  syncAll: () => Promise<boolean>;
  /** Dismiss update notifications */
  dismissUpdates: () => void;
}

/**
 * Hook for managing asset update state and operations
 *
 * Provides:
 * - Update checking via GET /api/studio/games/[id]/assets/updates
 * - Individual asset sync via POST /api/studio/games/[id]/assets/[refId]/sync
 * - Bulk sync via syncAll
 * - Loading and error states
 *
 * @param gameId - The game ID to manage updates for
 * @returns Update state and mutation functions
 */
export function useAssetUpdates(gameId: string): UseAssetUpdatesReturn {
  const [updates, setUpdates] = useState<AssetVersionInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check for available updates
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    try {
      setIsChecking(true);
      setError(null);

      const response = await fetch(`/api/studio/games/${gameId}/assets/updates`);
      if (!response.ok) {
        throw new Error("Failed to check for updates");
      }

      const data = await response.json();
      if (data.success) {
        setUpdates(data.updates || []);
        return data.hasUpdates;
      } else {
        throw new Error(data.message || "Check failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [gameId]);

  /**
   * Sync a single asset to its latest version
   */
  const syncUpdate = useCallback(
    async (refId: string): Promise<boolean> => {
      try {
        setIsSyncing(true);
        setError(null);

        const response = await fetch(
          `/api/studio/games/${gameId}/assets/${refId}/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Manual sync from UI" }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Sync failed");
        }

        const data = await response.json();
        if (data.success) {
          // Remove the synced asset from updates list
          setUpdates((prev) => prev.filter((u) => u.refId !== refId));
          return true;
        } else {
          throw new Error(data.message || "Sync failed");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [gameId]
  );

  /**
   * Sync all available updates
   */
  const syncAll = useCallback(async (): Promise<boolean> => {
    if (updates.length === 0) return false;

    let allSucceeded = true;
    setIsSyncing(true);
    setError(null);

    try {
      // Sync each update sequentially
      for (const update of updates) {
        const response = await fetch(
          `/api/studio/games/${gameId}/assets/${update.refId}/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Bulk sync all updates" }),
          }
        );

        if (!response.ok) {
          allSucceeded = false;
        }
      }

      // Clear updates list after attempting all syncs
      setUpdates([]);

      return allSucceeded;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [gameId, updates]);

  /**
   * Dismiss update notifications without syncing
   */
  const dismissUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return {
    updates,
    isChecking,
    isSyncing,
    error,
    checkForUpdates,
    syncUpdate,
    syncAll,
    dismissUpdates,
  };
}

export default useAssetUpdates;
