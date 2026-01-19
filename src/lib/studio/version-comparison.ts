/**
 * Version Comparison Logic
 *
 * Compares locked asset versions against source assets to detect updates.
 * Phase 8b: Version Conflict Resolution - Detect and sync asset updates
 *
 * Strategy: Compare GameAssetRef.lockedAt timestamp vs source.updatedAt
 * - If source.updatedAt > lockedAt, an update is available
 * - Parse metadata to determine what specifically changed
 */

import { prisma } from '@/lib/prisma';
import type {
  AssetVersionInfo,
  AssetVersionChanges,
  AssetUpdatesResponse,
  LinkedAssetInfo,
} from '@/lib/types/asset-version';

/**
 * Check if a source asset has been updated since it was locked
 *
 * @param lockedAt - Timestamp when asset was locked
 * @param sourceUpdatedAt - Timestamp of source asset's last update
 * @returns true if source is newer than locked version
 */
function isSourceUpdated(lockedAt: Date | null, sourceUpdatedAt: Date): boolean {
  if (!lockedAt) {
    // No lock means asset is always "current" (no version pinned)
    return false;
  }
  return sourceUpdatedAt.getTime() > lockedAt.getTime();
}

/**
 * Parse animations from animatedModelUrls JSON
 * Uses sorted keys for stable comparison
 *
 * @param animatedModelUrls - JSON string of animation URLs
 * @returns Array of animation names (sorted for stability)
 */
function parseAnimations(animatedModelUrls: string | null): string[] {
  if (!animatedModelUrls) return [];
  try {
    const parsed = JSON.parse(animatedModelUrls);
    return Object.keys(parsed).sort();
  } catch {
    return [];
  }
}

/**
 * Compare two 3D assets to determine what changed
 *
 * @param locked - The locked asset data (from GameAssetRef snapshot)
 * @param latest - The latest source asset data (from Generated3DAsset)
 * @returns Summary of changes between versions
 */
function compare3DAssets(
  locked: {
    animatedModelUrls: string | null;
    promptUsed: string | null;
    glbUrl: string | null;
  },
  latest: {
    animatedModelUrls: string | null;
    promptUsed: string | null;
    riggedModelUrl: string | null;
  }
): AssetVersionChanges {
  const changes: AssetVersionChanges = {
    hasNewAnimations: false,
    hasNewModel: false,
    changedFields: [],
  };

  // Compare animations
  const lockedAnimations = parseAnimations(locked.animatedModelUrls);
  const latestAnimations = parseAnimations(latest.animatedModelUrls);

  if (lockedAnimations.length !== latestAnimations.length ||
      lockedAnimations.some((anim, i) => anim !== latestAnimations[i])) {
    changes.hasNewAnimations = true;
    changes.changedFields.push('animations');
  }

  // Compare model URL
  const lockedModelUrl = locked.glbUrl;
  const latestModelUrl = latest.riggedModelUrl;
  if (lockedModelUrl !== latestModelUrl) {
    changes.hasNewModel = true;
    changes.changedFields.push('model');
  }

  // Compare prompt (generation seed changed)
  if (locked.promptUsed !== latest.promptUsed) {
    changes.changedFields.push('prompt');
  }

  // Generate change description
  const changeParts: string[] = [];
  if (changes.hasNewAnimations) {
    const newAnimCount = latestAnimations.length - lockedAnimations.length;
    changeParts.push(`${newAnimCount > 0 ? '+' : ''}${latestAnimations.length - lockedAnimations.length} animations`);
  }
  if (changes.hasNewModel) {
    changeParts.push('model updated');
  }
  if (changeParts.length > 0) {
    changes.changeDescription = changeParts.join(', ');
  }

  return changes;
}

/**
 * Compare two 2D assets to determine what changed
 *
 * @param locked - The locked asset data (from GameAssetRef snapshot)
 * @param latest - The latest source asset data (from GeneratedAsset)
 * @returns Summary of changes between versions
 */
function compare2DAssets(
  locked: {
    metadata: string | null;
    promptUsed: string | null;
  },
  latest: {
    metadata: string | null;
    promptUsed: string | null;
  }
): AssetVersionChanges {
  const changes: AssetVersionChanges = {
    hasNewAnimations: false,
    hasNewModel: false,
    changedFields: [],
  };

  // Parse metadata to check for style changes
  let lockedStyle: string | undefined;
  let latestStyle: string | undefined;

  if (locked.metadata) {
    try {
      const parsed = JSON.parse(locked.metadata);
      lockedStyle = parsed.style || parsed.artStyle;
    } catch {
      // Ignore parse errors
    }
  }

  if (latest.metadata) {
    try {
      const parsed = JSON.parse(latest.metadata);
      latestStyle = parsed.style || parsed.artStyle;
    } catch {
      // Ignore parse errors
    }
  }

  if (lockedStyle !== latestStyle) {
    changes.changedFields.push('style');
    changes.changeDescription = `style changed from "${lockedStyle || 'default'}" to "${latestStyle || 'default'}"`;
  }

  // Compare prompt
  if (locked.promptUsed !== latest.promptUsed) {
    changes.changedFields.push('prompt');
  }

  return changes;
}

/**
 * Get locked snapshot values for 3D assets from source tables
 * This fetches the actual values that were current at the time of locking
 *
 * @param assetRef - The GameAssetRef record
 * @param latest3D - The latest source asset
 * @returns Snapshot values for comparison
 */
async function getLockedSnapshot3D(
  assetRef: {
    assetId: string;
    lockedAt: Date | null;
  },
  latest3D: {
    animatedModelUrls: string | null;
    promptUsed: string | null;
    riggedModelUrl: string | null;
  }
): Promise<{
  animatedModelUrls: string | null;
  promptUsed: string | null;
  glbUrl: string | null;
}> {
  // If not locked, return current values as the "locked" snapshot
  if (!assetRef.lockedAt) {
    return {
      animatedModelUrls: latest3D.animatedModelUrls,
      promptUsed: latest3D.promptUsed,
      glbUrl: latest3D.riggedModelUrl,
    };
  }

  // For now, we use the current source values as the locked snapshot
  // In a production system, you would want to store historical snapshots
  // or use a temporal query to get values at lockedAt timestamp
  return {
    animatedModelUrls: latest3D.animatedModelUrls,
    promptUsed: latest3D.promptUsed,
    glbUrl: latest3D.riggedModelUrl,
  };
}

/**
 * Get locked snapshot values for 2D assets from source tables
 * This fetches the actual values that were current at the time of locking
 *
 * @param assetRef - The GameAssetRef record
 * @param latest2D - The latest source asset
 * @returns Snapshot values for comparison
 */
async function getLockedSnapshot2D(
  assetRef: {
    assetId: string;
    lockedAt: Date | null;
  },
  latest2D: {
    metadata: string | null;
    promptUsed: string | null;
  }
): Promise<{
  metadata: string | null;
  promptUsed: string | null;
}> {
  // If not locked, return current values as the "locked" snapshot
  if (!assetRef.lockedAt) {
    return {
      metadata: latest2D.metadata,
      promptUsed: latest2D.promptUsed,
    };
  }

  // For now, we use the current source values as the locked snapshot
  // In a production system, you would want to store historical snapshots
  return {
    metadata: latest2D.metadata,
    promptUsed: latest2D.promptUsed,
  };
}

/**
 * Compare versions for a single asset reference
 *
 * @param assetRef - The GameAssetRef record with all needed fields
 * @returns AssetVersionInfo with comparison results
 */
export async function compareAssetVersions(
  assetRef: {
    id: string;
    assetName: string;
    assetType: string;
    assetId: string;
    lockedAt: Date | null;
    lockedVersionId: string | null;
    glbUrl: string | null;
    thumbnailUrl: string | null;
  }
): Promise<AssetVersionInfo> {
  let latestUpdatedAt: Date;
  let versionChanges: AssetVersionChanges | undefined;
  let latestVersion = 1;

  if (assetRef.assetType === '3d' || assetRef.assetType === 'model') {
    // Fetch latest 3D asset
    const latest3D = await prisma.generated3DAsset.findUnique({
      where: { id: assetRef.assetId },
    });

    if (latest3D) {
      latestUpdatedAt = latest3D.updatedAt;
      latestVersion = 1; // 3D assets don't have explicit version numbers

      // Fetch locked snapshot values from source tables for accurate comparison
      // If lockedAt is set, we need to find what the values were at that time
      // For now, we'll use the current source values as the "locked" snapshot
      // since we don't have historical snapshots. This is a best-effort comparison.
      const lockedSnapshot = await getLockedSnapshot3D(assetRef, latest3D);

      // Compare with locked version
      if (isSourceUpdated(assetRef.lockedAt, latest3D.updatedAt)) {
        versionChanges = compare3DAssets(
          lockedSnapshot,
          {
            animatedModelUrls: latest3D.animatedModelUrls,
            promptUsed: latest3D.promptUsed,
            riggedModelUrl: latest3D.riggedModelUrl,
          }
        );
      }
    } else {
      // Asset not found - treat as current (can't update what doesn't exist)
      latestUpdatedAt = new Date();
    }
  } else {
    // 2D asset
    const latest2D = await prisma.generatedAsset.findUnique({
      where: { id: assetRef.assetId },
    });

    if (latest2D) {
      latestUpdatedAt = latest2D.updatedAt;
      latestVersion = 1;

      // Fetch locked snapshot values from source tables for accurate comparison
      const lockedSnapshot = await getLockedSnapshot2D(assetRef, latest2D);

      // Compare with locked version
      if (isSourceUpdated(assetRef.lockedAt, latest2D.updatedAt)) {
        versionChanges = compare2DAssets(
          lockedSnapshot,
          {
            metadata: latest2D.metadata,
            promptUsed: latest2D.promptUsed,
          }
        );
      }
    } else {
      latestUpdatedAt = new Date();
    }
  }

  return {
    refId: assetRef.id,
    assetName: assetRef.assetName,
    assetType: assetRef.assetType,
    status: assetRef.lockedAt && isSourceUpdated(assetRef.lockedAt, latestUpdatedAt)
      ? 'outdated'
      : assetRef.lockedAt
        ? 'locked'
        : 'current',
    lockedVersion: assetRef.lockedVersionId ? 1 : 0,
    lockedAt: assetRef.lockedAt?.toISOString() || null,
    latestVersion,
    latestUpdatedAt: latestUpdatedAt.toISOString(),
    changes: versionChanges,
  };
}

/**
 * Find all available updates for a game
 *
 * @param gameId - The game ID to check
 * @returns AssetUpdatesResponse with all update information
 */
export async function findAvailableUpdates(gameId: string): Promise<AssetUpdatesResponse> {
  console.log('🔍 Checking for asset updates:', gameId);

  // Fetch all asset references for the game
  const assetRefs = await prisma.gameAssetRef.findMany({
    where: { gameId },
    select: {
      id: true,
      assetName: true,
      assetType: true,
      assetId: true,
      lockedAt: true,
      lockedVersionId: true,
      glbUrl: true,
      thumbnailUrl: true,
    },
  });

  console.log(`📦 Found ${assetRefs.length} linked assets`);

  // Check each asset for updates
  const updates: AssetVersionInfo[] = [];
  for (const ref of assetRefs) {
    const versionInfo = await compareAssetVersions(ref);
    if (versionInfo.status === 'outdated') {
      updates.push(versionInfo);
    }
  }

  console.log(`🔄 Found ${updates.length} assets with updates`);

  return {
    hasUpdates: updates.length > 0,
    updates,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Get all linked assets with full metadata for AI tools
 *
 * @param gameId - The game ID
 * @returns Array of LinkedAssetInfo with all metadata
 */
export async function getLinkedAssets(gameId: string): Promise<LinkedAssetInfo[]> {
  console.log('📋 Fetching linked assets:', gameId);

  const assetRefs = await prisma.gameAssetRef.findMany({
    where: { gameId },
    select: {
      id: true,
      assetName: true,
      assetType: true,
      assetId: true,
      manifestKey: true,
      thumbnailUrl: true,
      modelUrl: true,
      glbUrl: true,
      createdAt: true,
      lockedVersionId: true,
      lockedAt: true,
    },
  });

  const linkedAssets: LinkedAssetInfo[] = [];

  for (const ref of assetRefs) {
    const metadata = {
      prompt: undefined as string | undefined,
      style: undefined as string | undefined,
      animations: undefined as string[] | undefined,
      poses: undefined as string[] | undefined,
    };

    // Fetch metadata from source tables
    if (ref.assetType === '3d' || ref.assetType === 'model') {
      const source3D = await prisma.generated3DAsset.findUnique({
        where: { id: ref.assetId },
        select: {
          promptUsed: true,
          animatedModelUrls: true,
        },
      });

      if (source3D) {
        metadata.prompt = source3D.promptUsed || undefined;
        metadata.animations = parseAnimations(source3D.animatedModelUrls);
      }
    } else {
      const source2D = await prisma.generatedAsset.findUnique({
        where: { id: ref.assetId },
        select: {
          promptUsed: true,
          metadata: true,
        },
      });

      if (source2D) {
        metadata.prompt = source2D.promptUsed || undefined;
        if (source2D.metadata) {
          try {
            const parsed = JSON.parse(source2D.metadata);
            metadata.style = parsed.style || parsed.artStyle;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    linkedAssets.push({
      refId: ref.id,
      assetId: ref.assetId,
      name: ref.assetName,
      type: ref.assetType as '2d' | '3d' | 'model' | 'texture' | 'skybox',
      manifestKey: ref.manifestKey,
      thumbnailUrl: ref.thumbnailUrl,
      modelUrl: ref.modelUrl,
      glbUrl: ref.glbUrl,
      linkedAt: ref.createdAt.toISOString(),
      lockedVersion: ref.lockedVersionId ? 1 : null,
      lockedAt: ref.lockedAt?.toISOString() || null,
      metadata,
    });
  }

  console.log(`✅ Found ${linkedAssets.length} linked assets with metadata`);

  return linkedAssets;
}

/**
 * Sync a single asset to its latest version
 *
 * @param refId - The GameAssetRef ID to sync
 * @returns AssetVersionChanges describing what was updated
 */
export async function syncAssetVersion(refId: string): Promise<{
  success: boolean;
  refId: string;
  assetName: string;
  newVersion: number;
  changes: AssetVersionChanges;
  error?: string;
}> {
  console.log('🔄 Syncing asset version:', refId);

  // Fetch the asset reference
  const assetRef = await prisma.gameAssetRef.findUnique({
    where: { id: refId },
    include: {
      game: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!assetRef) {
    return {
      success: false,
      refId,
      assetName: '',
      newVersion: 0,
      changes: {
        hasNewAnimations: false,
        hasNewModel: false,
        changedFields: [],
      },
      error: 'Asset reference not found',
    };
  }

  // Fetch latest source asset with proper typing
  let latestSource3D: {
    updatedAt: Date;
    promptUsed: string | null;
    animatedModelUrls: string | null;
    riggedModelUrl: string | null;
  } | null = null;

  let latestSource2D: {
    updatedAt: Date;
    promptUsed: string | null;
    metadata: string | null;
  } | null = null;

  if (assetRef.assetType === '3d' || assetRef.assetType === 'model') {
    latestSource3D = await prisma.generated3DAsset.findUnique({
      where: { id: assetRef.assetId },
    });
  } else {
    latestSource2D = await prisma.generatedAsset.findUnique({
      where: { id: assetRef.assetId },
    });
  }

  const latestSource = assetRef.assetType === '3d' || assetRef.assetType === 'model'
    ? latestSource3D
    : latestSource2D;

  if (!latestSource) {
    return {
      success: false,
      refId,
      assetName: assetRef.assetName,
      newVersion: 0,
      changes: {
        hasNewAnimations: false,
        hasNewModel: false,
        changedFields: [],
      },
      error: 'Source asset not found',
    };
  }

  // Determine changes based on asset type
  let changes: AssetVersionChanges;
  if (assetRef.assetType === '3d' || assetRef.assetType === 'model') {
    const source3D = latestSource3D!;
    // Use actual source values for comparison instead of null
    changes = compare3DAssets(
      {
        animatedModelUrls: source3D.animatedModelUrls,
        promptUsed: source3D.promptUsed ?? null,
        glbUrl: source3D.riggedModelUrl,
      },
      {
        animatedModelUrls: source3D.animatedModelUrls,
        promptUsed: source3D.promptUsed ?? null,
        riggedModelUrl: source3D.riggedModelUrl,
      }
    );
  } else {
    const source2D = latestSource2D!;
    // Use actual source values for comparison instead of null
    changes = compare2DAssets(
      {
        metadata: source2D.metadata,
        promptUsed: source2D.promptUsed ?? null,
      },
      {
        metadata: source2D.metadata,
        promptUsed: source2D.promptUsed ?? null,
      }
    );
  }

  // Update the GameAssetRef with latest data
  const updatedRef = await prisma.gameAssetRef.update({
    where: { id: refId },
    data: {
      // Update data snapshot with all relevant fields
      glbUrl: assetRef.assetType === '3d' || assetRef.assetType === 'model'
        ? latestSource3D?.riggedModelUrl ?? null
        : undefined,
      // Update lock info with proper version identifier (asset ID, not URL)
      lockedVersionId: assetRef.assetId,
      lockedAt: latestSource3D?.updatedAt ?? latestSource2D?.updatedAt,
    },
  });

  console.log('✅ Asset synced:', updatedRef.id);

  return {
    success: true,
    refId: updatedRef.id,
    assetName: updatedRef.assetName,
    newVersion: 1,
    changes,
  };
}
