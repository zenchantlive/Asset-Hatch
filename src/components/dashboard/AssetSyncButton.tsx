"use client";

// -----------------------------------------------------------------------------
// Asset Sync Button
// Shows in header with pending count badge (Phase 6)
// -----------------------------------------------------------------------------

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

/**
 * Props for AssetSyncButton
 */
interface AssetSyncButtonProps {
  /** Project ID */
  projectId: string;
  /** Number of pending assets */
  pendingCount: number;
  /** Click handler */
  onClick: () => void;
}

/**
 * AssetSyncButton - Button with badge showing pending sync count
 *
 * Use in:
 * - Dashboard header
 * - Studio header when viewing unified project
 */
export function AssetSyncButton({
  projectId,
  pendingCount,
  onClick,
}: AssetSyncButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} className="relative">
      <Package className="h-4 w-4 mr-2" />
      <span>Assets</span>
      {pendingCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {pendingCount}
        </span>
      )}
    </Button>
  );
}
