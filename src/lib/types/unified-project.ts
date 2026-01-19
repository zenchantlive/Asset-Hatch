/**
 * Unified Project Types
 *
 * Types for the unified project architecture (Phase 6)
 * Bridges Asset Hatch projects with Hatch Studios games.
 */

/**
 * Project creation data
 * Used when creating a new unified project
 */
export interface CreateProjectData {
  /** Project name */
  name: string;
  /** Project mode: 2D, 3D, or hybrid */
  mode: "2d" | "3d" | "hybrid";
  /** Start path: assets first, or game first (game can add assets later) */
  startWith: "assets" | "game";
}

/**
 * Asset manifest entry
 * Tracks a single asset within the project's manifest
 */
export interface AssetManifestEntry {
  /** Unique identifier for the asset */
  id: string;
  /** Asset type */
  type: "2d" | "3d";
  /** Human-readable name */
  name: string;
  /** Version number for change tracking */
  version: number;
  /** Asset URLs */
  urls: {
    /** Thumbnail image URL */
    thumbnail?: string;
    /** Model URL (if applicable) */
    model?: string;
    /** GLB/GLTF model URL */
    glb?: string;
  };
  /** Generation metadata */
  metadata: {
    /** Original prompt used */
    prompt?: string;
    /** Art style applied */
    style?: string;
    /** Available animations */
    animations?: string[];
    /** Available poses */
    poses?: string[];
  };
  /** When the asset was linked */
  linkedAt: string;
  /** Optional version lock to prevent breaking changes */
  lockedVersion?: number;
}

/**
 * Asset manifest sync state
 * Tracks the synchronization status between assets and games
 */
export interface AssetManifestSyncState {
  /** Overall sync status */
  status: "clean" | "pending";
  /** Array of asset keys pending sync */
  pendingAssets: string[];
  /** Timestamp of last sync */
  lastSync: string | null;
}

/**
 * Asset manifest
 * Main structure for tracking all linked assets in a unified project
 */
export interface AssetManifest {
  /** Manifest version for future migrations */
  version: "1.0";
  /** Last update timestamp */
  lastUpdated: string;
  /** All tracked assets indexed by manifest key */
  assets: Record<string, AssetManifestEntry>;
  /** Sync state tracking */
  syncState: AssetManifestSyncState;
}

/**
 * Project status response
 * Returned by GET /api/projects/[id]/status
 */
export interface ProjectStatus {
  /** Project ID */
  projectId: string;
  /** Project name */
  name: string;
  /** Project mode */
  mode: "2d" | "3d" | "hybrid";
  /** Current phase */
  phase: string;
  /** Sync status */
  syncStatus: "clean" | "pending" | "syncing" | "error";
  /** Array of pending asset keys */
  pendingAssets: string[];
  /** Count of pending assets */
  pendingAssetCount: number;
  /** Last sync timestamp */
  lastSync: string | null;
  /** Total count of linked assets */
  assetCount: number;
  /** Linked game ID (if any) */
  gameId?: string;
  /** Game phase (if game exists) */
  gamePhase?: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Create project response
 */
export interface CreateProjectResponse {
  /** The created project ID */
  projectId: string;
  /** The created game ID (only if startWith includes "game") */
  gameId?: string;
}

/**
 * Sync assets response
 */
export interface SyncAssetsResponse {
  /** Whether the sync succeeded */
  success: boolean;
  /** Array of synced asset keys */
  syncedAssets: string[];
  /** Human-readable message */
  message: string;
  /** Optional: detailed changes made during sync */
  changes?: {
    /** File ID that was changed */
    fileId: string;
    /** File name */
    fileName: string;
    /** Type of change */
    changeType: "created" | "updated";
    /** Description of the change */
    description: string;
  }[];
}

/**
 * Sync asset input for the AI tool
 */
export interface SyncAssetInput {
  /** ID of the asset to sync from GameAssetRef */
  assetRefId: string;
  /** Target scene ID (uses active scene if not provided) */
  sceneId?: string;
  /** Initial position in scene */
  position?: {
    x: number;
    y: number;
    z: number;
  };
  /** Initial rotation in scene */
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  /** Initial scale in scene */
  scale?: {
    x: number;
    y: number;
    z: number;
  };
  /** Whether to generate loading code */
  generateCode?: boolean;
}

/**
 * Project with game information for dashboard display
 */
export interface UnifiedProject {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Project mode */
  mode: string;
  /** Current phase */
  phase: string;
  /** Sync status */
  syncStatus: string;
  /** Pending asset count */
  pendingAssetCount: number;
  /** Total asset count */
  assetCount: number;
  /** Game phase (if game exists) */
  gamePhase?: string;
  /** Last update timestamp */
  updatedAt: Date;
}
