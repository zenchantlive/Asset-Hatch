'use client';

interface SharedContextIndicatorProps {
  lastUpdatedBy?: 'assets' | 'game';
  updatedAt?: string;
  className?: string;
}

/**
 * SharedContextIndicator - Badge showing sync status between Assets and Game contexts
 *
 * Phase 6B: Shared Context & Unified UI
 */
export function SharedContextIndicator({
  lastUpdatedBy,
  updatedAt,
  className = '',
}: SharedContextIndicatorProps) {
  if (!lastUpdatedBy) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        📝 No context
      </span>
    );
  }

  const timeAgo = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        🔄 Synced
      </span>
      <span
        className={`text-xs px-2 py-0.5 rounded ${
          lastUpdatedBy === 'assets'
            ? 'bg-purple-500/20 text-purple-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}
      >
        {lastUpdatedBy === 'assets' ? '🎨 Assets' : '🎮 Game'}
      </span>
      {timeAgo && (
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      )}
    </div>
  );
}
