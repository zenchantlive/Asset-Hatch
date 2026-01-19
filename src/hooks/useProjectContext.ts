"use client";

// -----------------------------------------------------------------------------
// useProjectContext Hook
// Manages project context state and updates (Phase 7b)
// -----------------------------------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import type { UnifiedProjectContext } from "@/lib/types/shared-context";

/**
 * Return type for useProjectContext hook
 */
interface UseProjectContextReturn {
  /** Current project context or null if not loaded */
  context: UnifiedProjectContext | null;
  /** Whether context is loading */
  isLoading: boolean;
  /** Any error message */
  error: string | null;
  /** Refresh context from server */
  refetch: () => Promise<void>;
  /** Update context on server */
  updateContext: (updates: Partial<UnifiedProjectContext>) => Promise<boolean>;
}

/**
 * Hook for managing project context state
 *
 * Provides:
 * - Context fetching with enriched asset data
 * - Context updates
 * - Loading and error states
 *
 * @param projectId - The project ID to fetch context for
 * @returns Context state and mutation functions
 */
export function useProjectContext(projectId: string): UseProjectContextReturn {
  const [context, setContext] = useState<UnifiedProjectContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch project context from server
   * Context is automatically enriched with asset metadata by the API
   */
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/context`);
      if (!response.ok) {
        throw new Error("Failed to fetch context");
      }

      const data = await response.json();
      if (data.success && data.context) {
        setContext(data.context);
      } else {
        throw new Error(data.error || "Invalid response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * Update project context on server
   *
   * @param updates - Partial context updates to apply
   * @returns true if update succeeded, false otherwise
   */
  const updateContext = useCallback(
    async (updates: Partial<UnifiedProjectContext>): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: updates }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update context");
        }

        // Refresh context after successful update
        await refetch();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [projectId, refetch]
  );

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      refetch();
    }
  }, [projectId, refetch]);

  return {
    context,
    isLoading,
    error,
    refetch,
    updateContext,
  };
}
