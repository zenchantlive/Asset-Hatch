// -----------------------------------------------------------------------------
// Activity Log Types
// Types and utilities for the Activity Log panel
// -----------------------------------------------------------------------------

/**
 * Status of an activity entry
 */
export type ActivityStatus = 'pending' | 'success' | 'error';

/**
 * Activity entry for the activity log panel
 */
export interface ActivityEntry {
    /** Unique identifier for the entry */
    id: string;
    /** Name of the tool that was executed */
    toolName: string;
    /** Current status of the activity */
    status: ActivityStatus;
    /** Human-readable details about the activity */
    details: string;
    /** When the activity occurred */
    timestamp: Date;
    /** Optional: file name associated with this activity */
    fileName?: string;
    /** Optional: error message for error status */
    errorMessage?: string;
}

/**
 * Filter options for activity log
 */
export interface ActivityFilter {
    /** Filter by status types */
    status?: ActivityStatus[];
    /** Filter by specific tool names */
    toolNames?: string[];
}

/**
 * Format a timestamp for display
 * @param date - The date to format
 * @returns Relative time string like "2s ago", "5m ago"
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
    }
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }
    return date.toLocaleDateString();
}

/**
 * Get status icon for activity entry
 * @param status - The activity status
 * @returns Emoji or icon character
 */
export function getStatusIcon(status: ActivityStatus): string {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'success':
            return '✅';
        case 'error':
            return '❌';
    }
}

/**
 * Get CSS class for status badge
 * @param status - The activity status
 * @returns Tailwind CSS classes
 */
export function getStatusClass(status: ActivityStatus): string {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'success':
            return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'error':
            return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
}

/**
 * Map tool name to display category
 * @param toolName - The tool name from AI
 * @returns Category label
 */
export function getToolCategory(toolName: string): string {
    if (toolName.includes('File')) return 'File';
    if (toolName.includes('Scene')) return 'Scene';
    if (toolName.includes('Asset')) return 'Asset';
    if (toolName.includes('Plan')) return 'Plan';
    if (toolName.includes('Camera') || toolName.includes('Physics')) return 'Settings';
    return 'General';
}
