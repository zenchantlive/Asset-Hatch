// -----------------------------------------------------------------------------
// Studio Provider Component
// Context provider for studio state management
// Follows GenerationLayoutProvider pattern
// Multi-file support: Manages GameFile[] instead of single code string
// -----------------------------------------------------------------------------

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { StudioContext } from '@/lib/studio/context';
import type { StudioContextValue } from '@/lib/studio/context';
import type { GameData } from '@/lib/studio/types';
import type { GameFileData } from '@/lib/studio/types';
import type { ActivityEntry, ActivityFilter } from '@/lib/studio/activity-types';

/**
 * Props for StudioProvider
 */
interface StudioProviderProps {
    /** Child components that need studio state */
    children: React.ReactNode;
    /** Initial game data from server */
    initialGame: GameData;
    /** Initial files loaded from server (from GameFile table) */
    initialFiles?: GameFileData[];
}


/**
 * StudioProvider - manages all studio state (multi-file support)
 */
export function StudioProvider({
    children,
    initialGame,
    initialFiles = [],
}: StudioProviderProps) {
    // Game state
    const [game, setGame] = useState<GameData>(initialGame);
    
    // UI state
    const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'assets'>('preview');
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [previewKey, setPreviewKey] = useState<number>(0);
    const [pendingFixRequest, setPendingFixRequest] = useState<{ id: string; message: string; line?: number; fileName?: string; stack?: string } | null>(null);
    
    // Multi-file state - replaces single code string
    const [files, setFiles] = useState<GameFileData[]>(initialFiles);
    const [activeFileId, setActiveFileId] = useState<string | null>(
        initialFiles.length > 0 ? initialFiles[0].id : null
    );

    // Open files tab state (for Monaco tab bar)
    const [openFileIds, setOpenFileIds] = useState<string[]>(() => {
        if (initialFiles.length > 0) {
            return [initialFiles[0].id];
        }
        return [];
    });

    // Activity log state
    const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
    const [activityFilter, setActivityFilter] = useState<ActivityFilter>({});
    const activityIdRef = useRef(0);

    // Refresh preview by incrementing key (forces iframe reload)
    const refreshPreview = useCallback(() => {
        setPreviewKey((prev) => prev + 1);
    }, []);

    // Update game name (will trigger API call in parent)
    const updateGameName = useCallback(async (name: string) => {
        setGame((prev) => ({ ...prev, name }));
        console.log('TODO: Save game name to API:', name);
    }, []);

    // Refresh game data from API (after AI creates scenes, etc.)
    const refreshGame = useCallback(async () => {
        try {
            const response = await fetch(`/api/studio/games/${game.id}`);
            if (response.ok) {
                const data = await response.json();
                setGame(data.game);
                console.log('Game data refreshed from API');
            }
        } catch (error) {
            console.error('Failed to refresh game:', error);
        }
    }, [game.id]);

    // Load files from API - called after file tools execute
    const loadFiles = useCallback(async () => {
        try {
            const response = await fetch(`/api/studio/games/${game.id}/files`);
            if (response.ok) {
                const data = await response.json();
                if (data.files && data.files.length > 0) {
                    setFiles(data.files);
                    // Set active file if not set
                    if (!activeFileId) {
                        setActiveFileId(data.files[0].id);
                    }
                    console.log('🔄 Loaded', data.files.length, 'files from API');
                }
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }, [game.id, activeFileId]);

    // Update content of a specific file
    const updateFileContent = useCallback((fileId: string, content: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, content } : f))
        );
    }, []);

    // Open a file in the tab bar
    const openFile = useCallback((fileId: string) => {
        setOpenFileIds((prev) => {
            if (prev.includes(fileId)) {
                return prev;
            }
            return [...prev, fileId];
        });
        setActiveFileId(fileId);
    }, []);

    // Close a file in the tab bar
    const closeFile = useCallback((fileId: string) => {
        setOpenFileIds((prev) => {
            const index = prev.indexOf(fileId);
            if (index === -1) return prev;
            const newOpenFiles = prev.filter((id) => id !== fileId);
            
            // If we just closed the active file, switch to another open file
            if (activeFileId === fileId && newOpenFiles.length > 0) {
                // If there are files before the closed one, use the previous one
                // Otherwise use the first one
                const newIndex = Math.max(0, index - 1);
                // Schedule active file change after state update
                setTimeout(() => setActiveFileId(newOpenFiles[newIndex]), 0);
            } else if (activeFileId === fileId && newOpenFiles.length === 0) {
                // No files left, clear active file
                setTimeout(() => setActiveFileId(null), 0);
            }
            
            return newOpenFiles;
        });
    }, [activeFileId]);

    // Close all files except the specified one
    const closeOtherFiles = useCallback((fileId: string) => {
        setOpenFileIds([fileId]);
        setActiveFileId(fileId);
    }, []);

    // Close all files
    const closeAllFiles = useCallback(() => {
        setOpenFileIds([]);
        setActiveFileId(null);
    }, []);

    // Request error fix - sets pending request for ChatPanel to pick up
    const requestErrorFix = useCallback((error: { message: string; line?: number; fileName?: string; stack?: string }) => {
        console.log('🔧 Error fix requested:', error.message);
        const id = `fix-${crypto.randomUUID()}`;
        setPendingFixRequest({ ...error, id });
    }, []);

    // Clear fix request after ChatPanel processes it
    const clearFixRequest = useCallback(() => {
        setPendingFixRequest(null);
    }, []);

    // Activity log functions
    const addActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
        const newEntry: ActivityEntry = {
            ...entry,
            id: `activity-${++activityIdRef.current}`,
            timestamp: new Date(),
        };
        setActivityLog((prev) => [newEntry, ...prev].slice(0, 100)); // Keep last 100 entries
    }, []);

    const clearActivityLog = useCallback(() => {
        setActivityLog([]);
        activityIdRef.current = 0;
    }, []);

    // Build context value with multi-file support
    const contextValue: StudioContextValue = useMemo(
        () => ({
            game,
            activeTab,
            isPlaying,
            previewKey,
            files,
            activeFileId,
            openFileIds,
            setActiveTab,
            setIsPlaying,
            refreshPreview,
            setFiles,
            setActiveFileId,
            updateFileContent,
            loadFiles,
            updateGameName,
            setGame,
            refreshGame,
            pendingFixRequest,
            requestErrorFix,
            clearFixRequest,
            activityLog,
            addActivity,
            clearActivityLog,
            setActivityFilter,
            activityFilter,
            openFile,
            closeFile,
            closeOtherFiles,
            closeAllFiles,
        }),
        [
            game,
            activeTab,
            isPlaying,
            previewKey,
            files,
            activeFileId,
            openFileIds,
            refreshPreview,
            updateFileContent,
            loadFiles,
            updateGameName,
            setGame,
            refreshGame,
            pendingFixRequest,
            requestErrorFix,
            clearFixRequest,
            activityLog,
            activityFilter,
            openFile,
            closeFile,
            closeOtherFiles,
            closeAllFiles,
            addActivity,
            clearActivityLog,
        ]
    );

    return (
        <StudioContext.Provider value={contextValue}>
            {children}
        </StudioContext.Provider>
    );
}
