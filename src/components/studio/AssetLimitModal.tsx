// -----------------------------------------------------------------------------,
// Asset Limit Modal Component (Phase 10: Permanent 3D Asset Hosting)
//
// Shown when users approach or exceed the 3D asset storage limit.
// Provides honest, developer-diary style messaging with options.
//
// Features:
// - Honest explanation of browser storage limits
// - Fun, non-corporate tone
// - Three options: Continue anyway, Download bundle, Learn more
// - Non-blocking: "Continue anyway" is always available
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress, ProgressIndicator } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Info, Package, Cloud } from 'lucide-react';
import { ASSET_THRESHOLDS } from './AssetCounter';

/**
 * Props for AssetLimitModal component
 */
interface AssetLimitModalProps {
  /** Current count of 3D assets */
  count: number;
  /** Maximum assets allowed (default: 10) */
  limit?: number;
  /** Whether the modal should be open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Optional children to trigger the modal */
  children?: React.ReactNode;
  /** Which action to highlight */
  highlightAction?: 'continue' | 'bundle' | 'cloud';
}

/**
 * Get the appropriate message based on how far over the limit we are
 */
function getLimitMessage(count: number, limit: number): {
  emoji: string;
  title: string;
  description: string;
  options: string[];
} {
  const over = count - limit;

  if (over >= 5) {
    return {
      emoji: '🔥',
      title: "Okay, you're REALLY pushing it now",
      description: `You've packed ${count} 3D assets into your game. Your browser is sweating bullets. This is technically impressive, but also... ambitious.`,
      options: [
        'Continuing like this is fine, some assets just load on demand',
        'Bundle for export (self-contained game, no CDN needed)',
        'Connect cloud storage (future R2/S3 integration)',
      ],
    };
  }

  if (over >= 2) {
    return {
      emoji: '🤯',
      title: "Your browser is sweating",
      description: `You've packed ${count} 3D assets into your game! That's ${over} more than our local storage can handle. You're either building something epic or testing my limits. (Spoiler: both.)`,
      options: [
        'Continue anyway - load on demand, some may lag',
        'Download bundle - self-contained export',
        'Connect cloud storage (coming soon)',
      ],
    };
  }

  // 1 over
  return {
    emoji: '🎒',
    title: "Backpack overflow!",
    description: `You've hit ${count} 3D assets, which is ${over} more than our local storage limit of ${limit}. Time to make some choices about what stays and what goes.`,
    options: [
      'Continue anyway - load on demand',
      'Download bundle - self-contained game',
      'Learn more about storage limits',
    ],
  };
}

/**
 * AssetLimitModal - modal shown when approaching/exceeding asset limits
 */
export function AssetLimitModal({
  count,
  limit = ASSET_THRESHOLDS.SAFE,
  open: controlledOpen,
  onOpenChange,
  children,
  highlightAction = 'continue',
}: AssetLimitModalProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : localOpen;
  const handleOpenChange = onOpenChange || setLocalOpen;

  const progress = Math.min((count / limit) * 100, 100);
  const { emoji, description } = getLimitMessage(count, limit);

  const isOverLimit = count > limit;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{emoji}</span>
            <DialogTitle className="text-xl">
              {isOverLimit ? 'Storage Limit Reached' : 'Approaching Limit'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress visualization */}
        <div className="py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Local Storage</span>
            <span className={cn(
              'font-medium tabular-nums',
              isOverLimit ? 'text-red-400' : 'text-foreground'
            )}>
              {count}/{limit} assets
            </span>
          </div>
          <Progress
            value={progress}
            className="h-3"
          >
            <ProgressIndicator className={cn(
              isOverLimit
                ? 'bg-red-500'
                : progress > 80
                  ? 'bg-orange-500'
                  : 'bg-primary'
            )} />
          </Progress>
          {isOverLimit && (
            <p className="text-xs text-red-400 mt-2">
              +{count - limit} assets beyond local storage capacity
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Button
            variant={highlightAction === 'continue' ? 'default' : 'outline'}
            className="w-full justify-start gap-2"
            onClick={() => handleOpenChange(false)}
          >
            <Info className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Continue anyway</div>
              <div className="text-xs text-muted-foreground">
                {isOverLimit
                  ? 'Assets load on demand, may have slight lag'
                  : 'Add more, see what happens'}
              </div>
            </div>
          </Button>

          <Button
            variant={highlightAction === 'bundle' ? 'default' : 'outline'}
            className="w-full justify-start gap-2"
            onClick={() => handleOpenChange(false)}
          >
            <Package className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Download bundle</div>
              <div className="text-xs text-muted-foreground">
                Self-contained game export, no CDN needed
              </div>
            </div>
          </Button>

          <Button
            variant={highlightAction === 'cloud' ? 'default' : 'outline'}
            className="w-full justify-start gap-2"
            disabled
            onClick={() => handleOpenChange(false)}
          >
            <Cloud className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Connect cloud storage</div>
              <div className="text-xs text-muted-foreground">
                R2/S3 integration (coming in Phase 11)
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>

        {/* Developer diary footer */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          💡 <strong>From the developer:</strong> The 10-asset limit is a practical
          baseline. Real browser limits vary by device (50MB-200MB for IndexedDB).
          IndexedDB caching (Phase 11) will let you store way more. For now,
          {isOverLimit
            ? ` you're living dangerously and I respect it.`
            : ` choose wisely!`}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AssetLimitWarning - smaller warning indicator for when modal isn't needed
 */
interface AssetLimitWarningProps {
  count: number;
  limit?: number;
  className?: string;
}

export function AssetLimitWarning({
  count,
  limit = ASSET_THRESHOLDS.SAFE,
  className,
}: AssetLimitWarningProps) {
  const remaining = limit - count;
  const isNearLimit = remaining <= 2 && remaining > 0;
  const isOverLimit = remaining <= 0;

  if (remaining > 3) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
        isOverLimit
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : isNearLimit
            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span>{isOverLimit ? '🎒' : remaining === 2 ? '🤔' : '😬'}</span>
      <span>
        {isOverLimit
          ? `${count} assets - storage full!`
          : `Only ${remaining} slot${remaining !== 1 ? 's' : ''} left`}
      </span>
    </div>
  );
}
