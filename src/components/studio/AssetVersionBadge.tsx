/**
 * AssetVersionBadge Component
 *
 * Displays the version status of a linked asset.
 * Phase 8b: Version Conflict Resolution - UI for version status
 *
 * @example
 * <AssetVersionBadge status="current" version={1} />
 * <AssetVersionBadge status="outdated" version={1} latestVersion={2} />
 * <AssetVersionBadge status="locked" version={1} />
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AssetVersionStatus = 'current' | 'outdated' | 'locked';

interface AssetVersionBadgeProps {
  /** Current version number */
  version: number;
  /** Latest available version (only for outdated status) */
  latestVersion?: number;
  /** Version status */
  status: AssetVersionStatus;
  /** Optional CSS class */
  className?: string;
}

/**
 * Get badge variant based on status
 */
function getStatusVariant(status: AssetVersionStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'current':
      return 'default';
    case 'outdated':
      return 'destructive';
    case 'locked':
      return 'secondary';
    default:
      return 'default';
  }
}

/**
 * Get icon based on status
 */
function getStatusIcon(status: AssetVersionStatus): string {
  switch (status) {
    case 'current':
      return '✓';
    case 'outdated':
      return '!';
    case 'locked':
      return '🔒';
    default:
      return '';
  }
}

/**
 * AssetVersionBadge - Small badge showing version status
 *
 * Styles:
 * - Current (green): "v1 ✓"
 * - Outdated (red): "v1 → v2 !"
 * - Locked (gray): "v1 🔒"
 */
export function AssetVersionBadge({
  version,
  latestVersion,
  status,
  className,
}: AssetVersionBadgeProps) {
  const variant = getStatusVariant(status);
  const icon = getStatusIcon(status);

  const displayText =
    status === 'outdated' && latestVersion
      ? `v${version} → v${latestVersion}`
      : `v${version}`;

  return (
    <Badge
      variant={variant}
      className={cn(
        'gap-1',
        status === 'outdated' && 'animate-pulse',
        className
      )}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span className="font-mono">{displayText}</span>
    </Badge>
  );
}

export default AssetVersionBadge;
