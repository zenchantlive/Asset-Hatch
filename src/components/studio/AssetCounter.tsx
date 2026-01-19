// -----------------------------------------------------------------------------,
// Asset Counter Component (Phase 10: Permanent 3D Asset Hosting)
//
// Displays the count of stored 3D assets with fun developer-diary style messaging.
// Shows progress toward the storage limit with visual feedback.
//
// Features:
// - Real-time count of assets with glbData stored
// - Fun threshold messages based on count
// - Visual progress bar
// - Developer-diary tone throughout
// -----------------------------------------------------------------------------

'use client';

import { cn } from '@/lib/utils';
import { Progress, ProgressIndicator } from '@/components/ui/progress';

/**
 * Asset count thresholds with fun messages
 */
export const ASSET_THRESHOLDS = {
  SAFE: 10,
  LIMIT: 15,
} as const;

/**
 * Get a fun message based on asset count
 */
function getAssetMessage(count: number): {
  message: string;
  tone: 'encouraging' | 'positive' | 'warning' | 'urgent' | 'epic';
  color: string;
} {
  if (count === 0) {
    return {
      message: "Your backpack is light! Time to fill it up.",
      tone: 'encouraging',
      color: 'text-muted-foreground',
    };
  }

  if (count <= 3) {
    return {
      message: "Nice collection starting to form!",
      tone: 'positive',
      color: 'text-green-400',
    };
  }

  if (count <= 6) {
    return {
      message: "Starting to feel the weight...",
      tone: 'warning',
      color: 'text-yellow-400',
    };
  }

  if (count <= 8) {
    return {
      message: "Getting cozy in here! Choose your additions wisely.",
      tone: 'warning',
      color: 'text-orange-400',
    };
  }

  if (count <= 10) {
    return {
      message: "Backpack full! Next addition means letting something go.",
      tone: 'urgent',
      color: 'text-red-400',
    };
  }

  // 11+
  return {
    message: "Epic creation! But your browser is sweating. 🤯",
    tone: 'epic',
    color: 'text-purple-400',
  };
}

/**
 * Calculate progress percentage
 */
function calculateProgress(count: number, limit: number): number {
  return Math.min((count / limit) * 100, 100);
}

/**
 * Get progress color class based on threshold
 */
function getProgressColorClass(count: number): string {
  if (count <= 6) return 'bg-green-500';
  if (count <= 8) return 'bg-yellow-500';
  if (count <= 10) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Props for AssetCounter component
 */
interface AssetCounterProps {
  /** Current count of 3D assets with permanent storage */
  count: number;
  /** Maximum allowed assets (default: 10) */
  limit?: number;
  /** Optional className for styling */
  className?: string;
  /** Show detailed info (count, limit, progress) */
  showDetails?: boolean;
}

/**
 * AssetCounter - displays 3D asset storage count with fun messaging
 */
export function AssetCounter({
  count,
  limit = ASSET_THRESHOLDS.SAFE,
  className,
  showDetails = true,
}: AssetCounterProps) {
  const progress = calculateProgress(count, limit);
  const { message, color } = getAssetMessage(count);
  const progressColorClass = getProgressColorClass(count);
  const remaining = Math.max(0, limit - count);

  const isAtLimit = count >= limit;
  const isNearLimit = count >= limit - 2;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-lg border',
        isAtLimit
          ? 'bg-red-500/5 border-red-500/20'
          : isNearLimit
            ? 'bg-yellow-500/5 border-yellow-500/20'
            : 'bg-muted/50 border-border',
        className
      )}
    >
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">🎒</span>
          3D Assets
        </span>
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-foreground'
          )}
        >
          {count}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <Progress
        value={progress}
        className="h-2"
      >
        <ProgressIndicator className={progressColorClass} />
      </Progress>

      {/* Fun message */}
      <p className={cn('text-xs italic', color)}>{message}</p>

      {/* Details */}
      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining} slot{remaining !== 1 ? 's' : ''} remaining</span>
          {isAtLimit && (
            <span className="text-red-400/70">
              Consider IndexedDB or cloud storage
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function AssetCounterCompact({
  count,
  limit = ASSET_THRESHOLDS.SAFE,
  className,
}: Pick<AssetCounterProps, 'count' | 'limit' | 'className'>) {
  const progress = calculateProgress(count, limit);
  const progressColorClass = getProgressColorClass(count);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-full text-xs',
        count >= limit
          ? 'bg-red-500/10 text-red-400'
          : count >= limit - 2
            ? 'bg-yellow-500/10 text-yellow-400'
            : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span>🎒</span>
      <span className="font-medium">{count}/{limit}</span>
      <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full transition-all', progressColorClass)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
