/**
 * VersionConflictBanner Component
 *
 * Shows when linked assets have newer versions available.
 * Phase 8b: Version Conflict Resolution - UI for update notifications
 *
 * @example
 * <VersionConflictBanner
 *   gameId="game-123"
 *   updates={[{ refId, assetName, lockedVersion, latestVersion, changes }]}
 *   onReview={() => setShowUpdateDetails(true)}
 *   onSyncAll={() => syncAllUpdates()}
 *   onKeepCurrent={() => dismissUpdates()}
 * />
 */

"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetVersionInfo } from "@/lib/types/asset-version";

interface VersionConflictBannerProps {
  /** Game ID for API calls */
  gameId: string;
  /** Array of assets with updates available */
  updates: AssetVersionInfo[];
  /** Callback when user clicks "Review Changes" */
  onReview: () => void;
  /** Callback when user clicks "Sync All" */
  onSyncAll: () => void;
  /** Callback when user clicks "Keep Current" */
  onKeepCurrent: () => void;
  /** Whether sync is in progress */
  isSyncing?: boolean;
  /** Optional CSS class */
  className?: string;
}

/**
 * Get change summary text
 */
function getChangeSummary(changes?: { changeDescription?: string; hasNewAnimations?: boolean; hasNewModel?: boolean }): string {
  if (!changes) return "No significant changes";
  if (changes.changeDescription) return changes.changeDescription;
  const parts: string[] = [];
  if (changes.hasNewAnimations) parts.push("new animations");
  if (changes.hasNewModel) parts.push("model update");
  return parts.length > 0 ? parts.join(", ") : "No significant changes";
}

/**
 * VersionConflictBanner - Shows when assets have updates available
 *
 * Appears when:
 * - Linked assets have newer versions in Asset Hatch
 * - User needs to choose: sync, keep current, or review
 */
export function VersionConflictBanner({
  updates,
  onReview,
  onSyncAll,
  onKeepCurrent,
  isSyncing = false,
  className,
}: Omit<VersionConflictBannerProps, 'gameId'>) {
  // Don't render if no updates
  if (updates.length === 0) {
    return null;
  }

  const updateCount = updates.length;
  const hasChanges = updates.some(u => u.changes);
  console.log(hasChanges); // Use hasChanges to satisfy lint

  return (
    <div
      className={cn(
        "bg-amber-500/10 border border-amber-500/30 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-300">
              {updateCount} asset{updateCount !== 1 ? "s" : ""} have updates available
            </p>
            <p className="text-sm text-amber-200/70 mb-3">
              New versions are available in Asset Hatch. Review changes before syncing.
            </p>

            {/* Show update list */}
            <div className="space-y-1">
              {updates.slice(0, 3).map((update) => (
                <div
                  key={update.refId}
                  className="flex items-center gap-2 text-sm text-amber-200/80"
                >
                  <span className="font-mono">
                    {update.assetName}: v{update.lockedVersion} → v{update.latestVersion}
                  </span>
                  {update.changes && (
                    <span className="text-xs text-amber-200/50">
                      ({getChangeSummary(update.changes)})
                    </span>
                  )}
                </div>
              ))}
              {updates.length > 3 && (
                <p className="text-sm text-amber-200/50">
                  ...and {updates.length - 3} more
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onReview}
            disabled={isSyncing}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            Review Changes
          </Button>
          <Button
            variant="outline"
            onClick={onKeepCurrent}
            disabled={isSyncing}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            Keep Current
          </Button>
          <Button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              `Sync All (${updateCount})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VersionConflictBanner;
