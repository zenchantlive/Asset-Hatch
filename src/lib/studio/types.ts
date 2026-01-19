// -----------------------------------------------------------------------------
// Hatch Studios TypeScript Types
// Defines API response shapes and client-side state for the studio feature
// -----------------------------------------------------------------------------

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Single game API response shape
 * Returned by GET /api/studio/games/[id] and POST /api/studio/games
 */
export interface GameResponse {
    /** Whether the request was successful */
    success: boolean;
    /** The game data when success is true */
    game?: GameData;
    /** Error message when success is false */
    error?: string;
}

/**
 * Game data returned from API
 */
export interface GameData {
    /** Unique game identifier (UUID) */
    id: string;
    /** ID of the user who owns this game */
    userId: string;
    /** Display name of the game */
    name: string;
    /** Optional description */
    description?: string | null;
    /** ID of the currently active scene */
    activeSceneId?: string | null;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
    /** ISO timestamp of soft deletion (null if not deleted) */
    deletedAt?: string | null;
    /** Related project ID (Phase 6: unified project) */
    projectId?: string | null;
    /** Related scenes (when included) */
    scenes?: SceneData[];
}

/**
 * Game list API response shape
 * Returned by GET /api/studio/games
 */
export interface GameListResponse {
    /** Whether the request was successful */
    success: boolean;
    /** Array of games when success is true */
    games?: GameData[];
    /** Error message when success is false */
    error?: string;
}

/**
 * Scene data returned from API
 */
export interface SceneData {
    /** Unique scene identifier (UUID) */
    id: string;
    /** ID of the parent game */
    gameId: string;
    /** Display name of the scene */
    name: string;
    /** Order index for sorting scenes */
    orderIndex: number;
    /** Scene code content */
    code: string;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
}

/**
 * Single scene API response shape
 * Returned by GET/POST/PATCH /api/studio/games/[id]/scenes/[sceneId]
 */
export interface SceneResponse {
    /** Whether the request was successful */
    success: boolean;
    /** The scene data when success is true */
    scene?: SceneData;
    /** Error message when success is false */
    error?: string;
}

/**
 * Scene list API response shape
 * Returned by GET /api/studio/games/[id]/scenes
 */
export interface SceneListResponse {
    /** Whether the request was successful */
    success: boolean;
    /** Array of scenes when success is true */
    scenes?: SceneData[];
    /** Error message when success is false */
    error?: string;
}

// =============================================================================
// CLIENT STATE TYPES
// =============================================================================

/**
 * Studio editor state for client-side management
 * Based on architecture spec for StudioState
 */
export interface StudioState {
    /** Currently loaded game data */
    game: GameData | null;
    /** ID of the currently selected scene */
    activeSceneId: string | null;
    /** Current code content in editor */
    currentCode: string;
    /** Whether there are unsaved changes */
    isDirty: boolean;
    /** Loading state flags */
    loading: {
        /** True while loading game data */
        game: boolean;
        /** True while saving changes */
        saving: boolean;
        /** True while generating with AI */
        generating: boolean;
    };
    /** Error state */
    error: string | null;
}

/**
 * Asset reference data for linking assets to games
 */
export interface GameAssetRefData {
    /** Unique identifier */
    id: string;
    /** Parent game ID */
    gameId: string;
    /** Original asset's project ID */
    assetProjectId: string;
    /** Original asset ID */
    assetId: string;
    /** Asset type (e.g., 'model', 'texture', 'skybox') */
    assetType: string;
    /** Display name */
    name: string;
    /** Thumbnail image URL */
    thumbnailUrl?: string | null;
    /** GLB model URL if applicable */
    glbUrl?: string | null;
    /** ISO timestamp of creation */
    createdAt: string;
}

/**
 * Asset placement in a scene
 */
export interface AssetPlacementData {
    /** Unique identifier */
    id: string;
    /** Parent scene ID */
    sceneId: string;
    /** Reference to the asset */
    assetRefId: string;
    /** Position coordinates */
    position: {
        x: number;
        y: number;
        z: number;
    };
    /** Rotation in radians */
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    /** Scale factors */
    scale: {
        x: number;
        y: number;
        z: number;
    };
}

/**
 * Code version history entry
 */
export interface CodeVersionData {
    /** Unique identifier */
    id: string;
    /** Parent game ID */
    gameId: string;
    /** Snapshot of the code at this version */
    code: string;
    /** Optional description of changes */
    description?: string | null;
    /** What triggered this version (e.g., 'user_save', 'ai_generation', 'auto_save') */
    trigger: string;
    /** ISO timestamp of creation */
    createdAt: string;
}

/**
 * Chat message in game context
 */
export interface GameChatMessageData {
    /** Unique identifier */
    id: string;
    /** Parent game ID */
    gameId: string;
    /** Message role ('user' | 'assistant' | 'system') */
    role: string;
    /** Message content */
    content: string;
    /** Tool calls made (JSON string) */
    toolCalls?: string | null;
    /** ISO timestamp of creation */
    createdAt: string;
}

/**
 * Game file data - individual code file in a game (multi-file support)
 */
export interface GameFileData {
    /** Unique identifier */
    id: string;
    /** Parent game ID */
    gameId: string;
    /** Filename (e.g., 'main.js', 'player.js') */
    name: string;
    /** File content */
    content: string;
    /** Execution order (0 = first) */
    orderIndex: number;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
}

/**
 * File list API response shape
 * Returned by GET /api/studio/games/[id]/files
 */
export interface FileListResponse {
    /** Whether the request was successful */
    success: boolean;
    /** Array of files when success is true */
    files?: GameFileData[];
    /** Error message when success is false */
    error?: string;
}

/**
 * Single file API response shape
 * Returned by POST/PATCH/DELETE /api/studio/games/[id]/files
 */
export interface FileResponse {
    /** Whether the request was successful */
    success: boolean;
    /** The file data when success is true */
    file?: GameFileData;
    /** Error message when success is false */
    error?: string;
}

// =============================================================================
// PHASE 7: ASSET LOADING TYPES
// =============================================================================

/**
 * Runtime asset info - extracted from AssetManifest for iframe use
 */
export interface AssetInfo {
    /** Manifest key (e.g., "knight", "forest_sky") */
    key: string;
    /** Asset type */
    type: "2d" | "3d" | "skybox";
    /** Human-readable name */
    name: string;
    /** Asset URLs */
    urls: {
        thumbnail?: string;
        model?: string;
        glb?: string;
        /** Base64-encoded GLB data for permanent storage (Phase 10) */
        glbData?: string;
    };
    /** Generation metadata */
    metadata: {
        prompt?: string;
        style?: string;
        animations?: string[];
        poses?: string[];
        skybox?: boolean;
    };
}

/**
 * Map AssetManifestEntry to AssetInfo for runtime use
 */
export function manifestEntryToAssetInfo(
    key: string,
    entry: import("@/lib/types/unified-project").AssetManifestEntry
): AssetInfo {
    // Phase 10: Handle glbData for permanent asset storage
    const urls = { ...(entry.urls || {}) };

    // If glbData exists in urls, construct data URL
    if (urls.glbData) {
        urls.glb = `data:application/octet-stream;base64,${urls.glbData}`;
        urls.model = `data:application/octet-stream;base64,${urls.glbData}`;
    }

    return {
        key,
        type: entry.type,
        name: entry.name,
        urls: urls,
        metadata: entry.metadata,
    };
}
