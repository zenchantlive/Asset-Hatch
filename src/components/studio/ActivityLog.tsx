// -----------------------------------------------------------------------------
// Activity Log Panel Component
// Real-time visibility into AI tool calls and their status
// Follows CodeTab panel structure and styling patterns
// -----------------------------------------------------------------------------

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useStudio } from '@/lib/studio/context';
import { ActivityStatus, formatRelativeTime, getStatusIcon, getStatusClass } from '@/lib/studio/activity-types';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ActivityLog - Panel showing real-time AI tool execution activity
 */
export function ActivityLog({ className }: { className?: string }) {
    const { activityLog, clearActivityLog, activityFilter, setActivityFilter } = useStudio();
    const [isExpanded, setIsExpanded] = useState(true);
    const [height, setHeight] = useState(150);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Filtered activity log based on current filter
    const filteredLog = useMemo(() => {
        let entries = activityLog;

        if (activityFilter.status && activityFilter.status.length > 0) {
            entries = entries.filter((e) => activityFilter.status!.includes(e.status));
        }

        if (activityFilter.toolNames && activityFilter.toolNames.length > 0) {
            entries = entries.filter((e) => activityFilter.toolNames!.includes(e.toolName));
        }

        return entries;
    }, [activityLog, activityFilter]);

    // Auto-scroll to top when new entries are added (newest first)
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [filteredLog.length]);

    // Handle resize via drag
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if clicking on the resize handle
        const target = e.target as HTMLElement;
        if (target.closest('.resize-handle') || target.classList.contains('resize-handle')) {
            e.preventDefault();
            setIsDragging(true);
            startYRef.current = e.clientY;
            startHeightRef.current = height;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startYRef.current - e.clientY;
            const newHeight = Math.max(80, Math.min(400, startHeightRef.current + deltaY));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, height]);

    // Status filter toggle
    const toggleStatusFilter = (status: ActivityStatus) => {
        const currentStatuses = activityFilter.status || [];
        const newStatuses = currentStatuses.includes(status)
            ? currentStatuses.filter((s) => s !== status)
            : [...currentStatuses, status];
        setActivityFilter({ ...activityFilter, status: newStatuses.length > 0 ? newStatuses : undefined });
    };

    // Clear all filters
    const clearFilters = () => {
        setActivityFilter({});
    };

    // Calculate list height
    const listHeight = isExpanded ? Math.max(0, height - 40) : 0;

    return (
        <div
            className={`flex flex-col border-t border-studio-panel-border bg-studio-panel-bg relative ${
                isDragging ? 'cursor-ns-resize' : ''
            } ${className || ''}`}
            style={{ height: isExpanded ? height : 40 }}
        >
            {/* Resize handle - positioned at top of content area, spanning full width */}
            <div
                className="resize-handle absolute top-0 left-0 right-0 h-4 cursor-ns-resize z-10"
                onMouseDown={handleMouseDown}
            >
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-1.5 hover:bg-muted-foreground/50 transition-colors" />
            </div>

            {/* Header */}
            <div className="h-10 border-b border-studio-panel-border flex items-center px-3 gap-2 mt-4">
                {/* Spacer for resize handle area */}
                <div className="w-8" />

                {/* Title and status summary */}
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium">Activity Log</span>
                    {activityLog.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            ({activityLog.length} {activityLog.length === 1 ? 'entry' : 'entries'})
                        </span>
                    )}
                    {activityFilter.status && activityFilter.status.length > 0 && (
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-5 w-5"
                            title="Clear filters"
                        >
                            <span className="text-xs">×</span>
                        </Button>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    {/* Status filter buttons */}
                    <div className="flex items-center gap-0.5 mr-1">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => toggleStatusFilter('success')}
                            className={`h-6 w-6 ${
                                activityFilter.status?.includes('success')
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'text-muted-foreground hover:text-green-400'
                            }`}
                            title="Show only success"
                        >
                            ✅
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => toggleStatusFilter('pending')}
                            className={`h-6 w-6 ${
                                activityFilter.status?.includes('pending')
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'text-muted-foreground hover:text-yellow-400'
                            }`}
                            title="Show only pending"
                        >
                            ⏳
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => toggleStatusFilter('error')}
                            className={`h-6 w-6 ${
                                activityFilter.status?.includes('error')
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'text-muted-foreground hover:text-red-400'
                            }`}
                            title="Show only errors"
                        >
                            ❌
                        </Button>
                    </div>

                    {/* Clear button */}
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={clearActivityLog}
                        disabled={activityLog.length === 0}
                        title="Clear log"
                        className="h-7 w-7"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Expand/collapse */}
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-7 w-7"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Activity list - Only visible when expanded */}
            {isExpanded && listHeight > 0 && (
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-2 space-y-1"
                    style={{ height: listHeight }}
                >
                    {filteredLog.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            {activityLog.length === 0
                                ? 'No activity yet'
                                : 'No entries match current filter'}
                        </div>
                    ) : (
                        filteredLog.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                            >
                                {/* Status icon */}
                                <span className="text-sm shrink-0 mt-0.5">
                                    {getStatusIcon(entry.status)}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {entry.toolName}
                                        </span>
                                        <span
                                            className={`text-xs px-1.5 py-0.5 rounded border ${getStatusClass(
                                                entry.status
                                            )}`}
                                        >
                                            {entry.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {entry.details}
                                        {entry.fileName && (
                                            <span className="ml-1 text-primary/70">
                                                • {entry.fileName}
                                            </span>
                                        )}
                                    </p>
                                    {entry.errorMessage && (
                                        <p className="text-xs text-red-400 mt-0.5">
                                            {entry.errorMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {formatRelativeTime(new Date(entry.timestamp))}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
