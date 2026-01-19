// -----------------------------------------------------------------------------
// File Version History Panel
// Slide-over panel showing version history for a file with restore capability
// -----------------------------------------------------------------------------

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudio } from '@/lib/studio/context';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, X, Clock, ChevronRight, FileCode } from 'lucide-react';
import type { CodeVersionData } from '@/lib/studio/types';
import { formatRelativeTime } from '@/lib/studio/activity-types';

/**
 * FileVersionHistory - Slide-over panel for viewing and restoring file versions
 */
interface FileVersionHistoryProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel should close */
    onClose: () => void;
    /** The game ID */
    gameId: string;
    /** The file ID to show history for */
    fileId: string;
}

export function FileVersionHistory({ isOpen, onClose, gameId, fileId }: FileVersionHistoryProps) {
    const { updateFileContent, files, refreshPreview } = useStudio();
    const [versions, setVersions] = useState<CodeVersionData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<CodeVersionData | null>(null);

    // Get the file info
    const file = files.find((f) => f.id === fileId);

    // Fetch version history
    const fetchVersions = useCallback(async () => {
        if (!fileId || !isOpen) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/studio/games/${gameId}/files/${fileId}/versions`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setVersions(data.versions);
                }
            }
        } catch (error) {
            console.error('Failed to fetch version history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [gameId, fileId, isOpen]);

    useEffect(() => {
        if (isOpen && fileId) {
            fetchVersions();
        }
    }, [isOpen, fileId, fetchVersions]);

    // Handle version restore
    const handleRestore = async (version: CodeVersionData) => {
        if (!fileId) return;

        setIsRestoring(true);
        try {
            const response = await fetch(`/api/studio/games/${gameId}/files/${fileId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId: version.id }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update the file content
                    updateFileContent(fileId, version.code);
                    // Refresh the preview
                    refreshPreview();
                    // Refetch versions to show the new restore entry
                    fetchVersions();
                    // Close panel
                    onClose();
                }
            }
        } catch (error) {
            console.error('Failed to restore version:', error);
        } finally {
            setIsRestoring(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-studio-panel-bg border-l border-studio-panel-border shadow-2xl animate-slideInRight flex flex-col">
                {/* Header */}
                <div className="h-14 border-b border-studio-panel-border px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-medium">Version History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* File info */}
                {file && (
                    <div className="px-4 py-3 border-b border-studio-panel-border bg-white/5">
                        <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {versions.length} version{versions.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                )}

                {/* Version list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground">Loading versions...</p>
                            </div>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            <div className="text-center">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No version history yet</p>
                                <p className="text-xs mt-1">Versions are created when files are modified</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={`
                                        p-3 rounded-lg border transition-all
                                        ${
                                            selectedVersion?.id === version.id
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }
                                    `}
                                    onClick={() => setSelectedVersion(version)}
                                >
                                    {/* Version header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                    v{versions.length - index}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(new Date(version.createdAt))}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1 truncate">
                                                {version.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Triggered by: {version.trigger}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        {index > 0 && ( // Can't restore to current version
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRestore(version);
                                                }}
                                                disabled={isRestoring}
                                                className="shrink-0 gap-1 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                Restore
                                            </Button>
                                        )}
                                    </div>

                                    {/* Preview on click */}
                                    {selectedVersion?.id === version.id && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto max-h-32">
                                                <code className="text-muted-foreground">
                                                    {version.code.substring(0, 500)}
                                                    {version.code.length > 500 && '...'}
                                                </code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-studio-panel-border">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
