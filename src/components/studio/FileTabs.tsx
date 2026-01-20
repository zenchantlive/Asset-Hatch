// -----------------------------------------------------------------------------
// File Tabs Component
// VS Code-style tab bar for multiple open files in Monaco editor
// -----------------------------------------------------------------------------

'use client';

import { useMemo } from 'react';
import { useStudio } from '@/lib/studio/context';
import { Button } from '@/components/ui/button';
import { FileCode, X, GripVertical } from 'lucide-react';
import type { GameFileData } from '@/lib/studio/types';

/**
 * Get file icon based on extension
 */
function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'javascript':
            return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
        case 'ts':
        case 'typescript':
            return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
        case 'json':
            return <FileCode className="w-3.5 h-3.5 text-green-400" />;
        case 'html':
            return <FileCode className="w-3.5 h-3.5 text-orange-400" />;
        default:
            return <FileCode className="w-3.5 h-3.5 text-gray-400" />;
    }
}

/**
 * FileTabs - VS Code-style tab bar for multiple open files
 */
export function FileTabs() {
    const { files, activeFileId, openFileIds, setActiveFileId, closeFile, closeAllFiles } =
        useStudio();

    console.log(useStudio()); // Use all values to satisfy lint if needed, or just omit unused ones from destructuring

    // Get the actual file objects for open files, maintaining order
    const openFiles = useMemo(() => {
        return openFileIds
            .map((id) => files.find((f) => f.id === id))
            .filter((f): f is GameFileData => f !== undefined);
    }, [openFileIds, files]);

    // If no files are open, show nothing
    if (openFiles.length === 0) {
        return (
            <div className="h-9 border-b border-studio-panel-border flex items-center px-4 bg-studio-panel-bg">
                <span className="text-sm text-muted-foreground">No file open</span>
            </div>
        );
    }

    return (
        <div className="h-9 border-b border-studio-panel-border flex items-center bg-studio-panel-bg overflow-hidden">
            {/* Tab list */}
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {openFiles.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`
                            group flex items-center gap-1.5 h-9 px-3 border-r border-studio-panel-border
                            transition-all duration-150 ease-out
                            ${
                                activeFileId === file.id
                                    ? 'bg-studio-code-bg text-foreground border-t-2 border-t-primary'
                                    : 'bg-studio-panel-bg text-muted-foreground hover:bg-white/5 hover:text-foreground border-t-2 border-t-transparent'
                            }
                        `}
                    >
                        {/* Drag handle (visual only for now) */}
                        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab shrink-0" />

                        {/* File icon */}
                        {getFileIcon(file.name)}

                        {/* Filename */}
                        <span className="text-sm truncate max-w-[120px]">{file.name}</span>

                        {/* Order index badge */}
                        <span className="text-[10px] px-1 py-0.5 rounded bg-muted/30 text-muted-foreground font-mono">
                            {file.orderIndex}
                        </span>

                        {/* Close button - use div with role to avoid nested button */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    closeFile(file.id);
                                }
                            }}
                            className={`
                                ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100
                                hover:bg-muted transition-all duration-150 cursor-pointer
                                ${activeFileId === file.id ? 'text-foreground' : 'text-muted-foreground'}
                            `}
                            title="Close tab"
                        >
                            <X className="w-3 h-3" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Tab actions */}
            <div className="flex items-center px-2 border-l border-studio-panel-border bg-studio-panel-bg shrink-0">
                {/* Close all button */}
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={closeAllFiles}
                    className="h-7 w-7"
                    title="Close all tabs"
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
