"use client";

// -----------------------------------------------------------------------------
// Sync Status Banner
// Shows warning when assets need to be synced (Phase 6)
// -----------------------------------------------------------------------------

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Props for SyncStatusBanner
 */
interface SyncStatusBannerProps {
  /** Array of pending asset keys */
  pendingAssets: string[];
  /** Callback to trigger sync */
  onSync: () => void;
  /** Callback to dismiss the banner */
  onDismiss: () => void;
  /** Whether sync is in progress */
  isSyncing?: boolean;
}

/**
 * SyncStatusBanner - Shows when assets need to be synced to the game
 *
 * Appears when:
 * - Assets have been added to the project
 * - They haven't been synced to the linked game yet
 */
export function SyncStatusBanner({
  pendingAssets,
  onSync,
  onDismiss,
  isSyncing = false,
}: SyncStatusBannerProps) {
  // Don't render if no pending assets
  if (pendingAssets.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-medium text-yellow-300">
            {pendingAssets.length} asset{pendingAssets.length !== 1 ? "s" : ""}{" "}
            pending sync
          </p>
          <p className="text-sm text-yellow-200/70">
            New assets have been added. Review and sync to use them in your
            game.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onDismiss}
          disabled={isSyncing}
          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
        >
          Later
        </Button>
        <Button
          onClick={onSync}
          disabled={isSyncing}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            `Sync Now (${pendingAssets.length})`
          )}
        </Button>
      </div>
    </div>
  );
}
