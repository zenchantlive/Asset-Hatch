// -----------------------------------------------------------------------------
// Studio Context Definition
// Context types and hook for studio state management
// Follows GenerationLayoutContext pattern
// Multi-file support: tracks GameFile[] instead of single code string
// -----------------------------------------------------------------------------

import { createContext, useContext } from 'react';
import type { GameData } from './types';
import type { GameFileData } from './types';
import type { ActivityEntry, ActivityFilter } from './activity-types';

/**
 * Studio context value - state and actions for studio UI
 */
export interface StudioContextValue {
    // Current game data
    game: GameData | null;

    // UI state
    activeTab: 'preview' | 'code' | 'assets';
    isPlaying: boolean;
    previewKey: number;

    // Multi-file state - replaces single code string
    files: GameFileData[];
    activeFileId: string | null; // ID of currently selected file for editing
    openFileIds: string[]; // IDs of files currently open in tabs

    // Actions
    setActiveTab: (tab: 'preview' | 'code' | 'assets') => void;
    setIsPlaying: (playing: boolean) => void;
    refreshPreview: () => void;

    // File management actions
    setFiles: (files: GameFileData[]) => void;
    setActiveFileId: (fileId: string | null) => void;
    updateFileContent: (fileId: string, content: string) => void;
    loadFiles: () => Promise<void>;
    openFile: (fileId: string) => void; // Open a file in tabs
    closeFile: (fileId: string) => void; // Close a file in tabs
    closeOtherFiles: (fileId: string) => void; // Close all except this
    closeAllFiles: () => void; // Close all tabs

    // Game metadata actions
    updateGameName: (name: string) => void;

    // Game data sync actions (for AI tool callbacks)
    setGame: (game: GameData) => void;
    refreshGame: () => Promise<void>;

    // Error fix request (triggers chat message)
    pendingFixRequest: { message: string; line?: number } | null;
    requestErrorFix: (error: { message: string; line?: number }) => void;
    clearFixRequest: () => void;

    // Activity log state
    activityLog: ActivityEntry[];
    addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
    clearActivityLog: () => void;
    setActivityFilter: (filter: ActivityFilter) => void;
    activityFilter: ActivityFilter;
}

/**
 * Studio context - to be provided by StudioProvider
 */
export const StudioContext = createContext<StudioContextValue | null>(null);

/**
 * Hook to access studio context
 * Must be used within StudioProvider
 */
export function useStudio(): StudioContextValue {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error('useStudio must be used within StudioProvider');
    }
    return context;
}

