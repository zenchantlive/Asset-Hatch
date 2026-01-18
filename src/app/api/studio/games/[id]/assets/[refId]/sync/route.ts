/**
 * Asset Sync API Route
 * POST /api/studio/games/[id]/assets/[refId]/sync
 *
 * Syncs a linked asset to its latest version from the source project.
 * Phase 8b: Version Conflict Resolution - Sync updates
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { syncAssetVersion } from '@/lib/studio/version-comparison';
import type { AssetSyncResponse } from '@/lib/types/asset-version';

/**
 * POST /api/studio/games/[id]/assets/[refId]/sync
 *
 * Sync a specific asset reference to the latest version from its source.
 *
 * Request body:
 * {
 *   reason?: string  // Optional reason for logging
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   refId: string,
 *   assetName: string,
 *   newVersion: number,
 *   syncedAt: string,
 *   changes: { hasNewAnimations, hasNewModel, changedFields },
 *   message: string
 * }
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; refId: string }> }
): Promise<NextResponse<AssetSyncResponse>> {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          refId: '',
          assetName: '',
          newVersion: 0,
          syncedAt: new Date().toISOString(),
          changes: {
            hasNewAnimations: false,
            hasNewModel: false,
            changedFields: [],
          },
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { id: gameId, refId } = await props.params;

    // Verify game ownership
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          refId,
          assetName: '',
          newVersion: 0,
          syncedAt: new Date().toISOString(),
          changes: {
            hasNewAnimations: false,
            hasNewModel: false,
            changedFields: [],
          },
          message: 'Game not found',
        },
        { status: 404 }
      );
    }

    // Verify asset reference belongs to this game
    const assetRef = await prisma.gameAssetRef.findFirst({
      where: {
        id: refId,
        gameId,
      },
    });

    if (!assetRef) {
      return NextResponse.json(
        {
          success: false,
          refId,
          assetName: '',
          newVersion: 0,
          syncedAt: new Date().toISOString(),
          changes: {
            hasNewAnimations: false,
            hasNewModel: false,
            changedFields: [],
          },
          message: 'Asset reference not found',
        },
        { status: 404 }
      );
    }

    console.log('🔄 Syncing asset:', refId, 'reason:', (await request.json())?.reason);

    // Perform the sync
    const result = await syncAssetVersion(refId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          refId,
          assetName: result.assetName,
          newVersion: 0,
          syncedAt: new Date().toISOString(),
          changes: result.changes,
          message: result.error || 'Sync failed',
        },
        { status: 400 }
      );
    }

    console.log('✅ Asset synced successfully:', result.assetName);

    return NextResponse.json({
      success: true,
      refId: result.refId,
      assetName: result.assetName,
      newVersion: result.newVersion,
      syncedAt: new Date().toISOString(),
      changes: result.changes,
      message: `Synced "${result.assetName}" to latest version`,
    });
  } catch (error) {
    console.error('❌ Asset sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        refId: '',
        assetName: '',
        newVersion: 0,
        syncedAt: new Date().toISOString(),
        changes: {
          hasNewAnimations: false,
          hasNewModel: false,
          changedFields: [],
        },
        message: 'Sync failed due to server error',
      },
      { status: 500 }
    );
  }
}
