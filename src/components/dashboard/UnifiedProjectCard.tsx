"use client";

// -----------------------------------------------------------------------------
// Unified Project Card
// Shows project with both asset and game status (Phase 6)
// -----------------------------------------------------------------------------

import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for UnifiedProjectCard
 */
interface UnifiedProjectCardProps {
  project: {
    /** Project ID */
    id: string;
    /** Project name */
    name: string;
    /** Project mode */
    mode: string;
    /** Current phase */
    phase: string;
    /** Sync status */
    syncStatus: string;
    /** Pending asset count */
    pendingAssetCount: number;
    /** Total asset count */
    assetCount: number;
    /** Game phase (if game exists) */
    gamePhase?: string | null;
    /** Last update timestamp */
    updatedAt: Date | string;
  };
}

/**
 * Mode badge component with color coding
 */
function ProjectModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    "2d": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "3d": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    hybrid: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  const colorClass = colors[mode] || colors["2d"];

  return (
    <span
      className={cn(
        "px-2 py-1 text-xs rounded-full border",
        colorClass
      )}
    >
      {mode.toUpperCase()}
    </span>
  );
}

/**
 * Phase badge component with icon and label
 */
function ProjectPhaseBadge({ phase }: { phase: string }) {
  const labels: Record<string, { label: string; icon: string }> = {
    planning: { label: "Planning", icon: "📋" },
    assets: { label: "Assets", icon: "🎨" },
    building: { label: "Building", icon: "🏗️" },
    testing: { label: "Testing", icon: "🧪" },
  };

  const { label, icon } = labels[phase] || { label: phase, icon: "" };

  return (
    <span className="text-xs text-muted-foreground">
      {icon} {label}
    </span>
  );
}

/**
 * Format relative time from now
 */
function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * UnifiedProjectCard - Shows project with asset and game status
 *
 * Displays:
 * - Project name and mode (2D/3D/Hybrid)
 * - Asset count and sync status
 * - Game phase if game exists
 * - Last updated time
 */
export function UnifiedProjectCard({ project }: UnifiedProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`} className="block">
      <div className="glass-interactive rounded-lg p-6 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold truncate pr-4">{project.name}</h3>
          <ProjectModeBadge mode={project.mode} />
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.gamePhase && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              🎮 Game
            </span>
          )}
          <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🎨 {project.assetCount} assets
          </span>
          {project.syncStatus === "pending" && project.pendingAssetCount > 0 && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              ⚠️ {project.pendingAssetCount} sync
            </span>
          )}
        </div>

        {/* Phase */}
        <ProjectPhaseBadge phase={project.phase} />

        {/* Last updated */}
        <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Updated {formatRelativeTime(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
