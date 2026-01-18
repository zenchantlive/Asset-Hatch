/**
 * Asset Version Types
 *
 * Type definitions for asset update detection and version comparison.
 * Phase 8a: Asset Awareness - AI can query linked asset metadata
 * Phase 8b: Version Conflict Resolution - Detect and sync asset updates
 */

import type { AssetManifestEntry } from './unified-project';

/**
 * Version status of a linked asset
 */
export type AssetVersionStatus = 'current' | 'outdated' | 'locked';

/**
 * Summary of what changed between versions
 */
export interface AssetVersionChanges {
  /** Whether the asset has new animations */
  hasNewAnimations: boolean;
  /** Whether the model URL changed */
  hasNewModel: boolean;
  /** List of fields that changed */
  changedFields: string[];
  /** Optional: description of changes */
  changeDescription?: string;
}

/**
 * Detailed version information for a linked asset
 */
export interface AssetVersionInfo {
  /** Reference ID in GameAssetRef table */
  refId: string;
  /** Human-readable asset name */
  assetName: string;
  /** Asset type: 2d, 3d, model, texture, skybox */
  assetType: string;
  /** Current version status */
  status: AssetVersionStatus;
  /** Version that was locked (1-based) */
  lockedVersion: number;
  /** Timestamp when version was locked */
  lockedAt: string | null;
  /** Current latest version from source */
  latestVersion: number;
  /** Timestamp of latest version in source */
  latestUpdatedAt: string;
  /** Summary of changes between locked and latest */
  changes?: AssetVersionChanges;
}

/**
 * Response from the updates detection endpoint
 */
export interface AssetUpdatesResponse {
  /** Whether any updates are available */
  hasUpdates: boolean;
  /** Array of assets with update information */
  updates: AssetVersionInfo[];
  /** Timestamp when check was performed */
  checkedAt: string;
}

/**
 * Response from the sync endpoint
 */
export interface AssetSyncResponse {
  /** Whether the sync succeeded */
  success: boolean;
  /** The reference ID that was synced */
  refId: string;
  /** Asset name */
  assetName: string;
  /** New locked version number */
  newVersion: number;
  /** Timestamp of sync */
  syncedAt: string;
  /** Summary of changes applied */
  changes: AssetVersionChanges;
  /** Human-readable message */
  message: string;
}

/**
 * Linked asset with full metadata for AI tools
 */
export interface LinkedAssetInfo {
  /** Reference ID */
  refId: string;
  /** Asset ID in source table */
  assetId: string;
  /** Human-readable name */
  name: string;
  /** Asset type */
  type: '2d' | '3d' | 'model' | 'texture' | 'skybox';
  /** Manifest key for ASSETS.load() */
  manifestKey: string | null;
  /** Thumbnail URL */
  thumbnailUrl: string | null;
  /** Model URL (3D) */
  modelUrl: string | null;
  /** GLB URL (3D) */
  glbUrl: string | null;
  /** When the asset was linked */
  linkedAt: string;
  /** Locked version info */
  lockedVersion: number | null;
  lockedAt: string | null;
  /** Source asset metadata */
  metadata: {
    /** Original prompt used */
    prompt?: string;
    /** Art style */
    style?: string;
    /** Available animations (3D) */
    animations?: string[];
    /** Available poses (3D) */
    poses?: string[];
  };
}

/**
 * AI tool response for getLinkedAssets
 */
export interface GetLinkedAssetsResponse {
  /** Whether the query succeeded */
  success: boolean;
  /** Array of linked assets */
  assets: LinkedAssetInfo[];
  /** Total count */
  totalCount: number;
  /** Human-readable message */
  message: string;
}

/**
 * AI tool response for getAssetUpdates
 */
export interface GetAssetUpdatesResponse {
  /** Whether the check succeeded */
  success: boolean;
  /** Whether updates are available */
  hasUpdates: boolean;
  /** Array of update information */
  updates: AssetVersionInfo[];
  /** Human-readable message */
  message: string;
}

/**
 * AI tool response for syncAssetVersion
 */
export interface SyncAssetVersionResponse {
  /** Whether the sync succeeded */
  success: boolean;
  /** The refId that was synced */
  refId: string;
  /** Asset name */
  assetName: string;
  /** New version number */
  newVersion: number;
  /** Summary of changes */
  changes: AssetVersionChanges;
  /** Human-readable message */
  message: string;
}
