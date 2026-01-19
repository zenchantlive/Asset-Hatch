/**
 * Asset Updates API Route
 * GET /api/studio/games/[id]/assets/updates
 *
 * Detects when linked assets have newer versions available in the source project.
 * Phase 8b: Version Conflict Resolution - Detect updates
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findAvailableUpdates } from '@/lib/studio/version-comparison';
import type { AssetUpdatesResponse } from '@/lib/types/asset-version';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/studio/games/[id]/assets/updates
 *
 * Check if any linked assets have newer versions available.
 *
 * Response:
 * {
 *   hasUpdates: boolean,
 *   updates: Array<{
 *     refId: string,
 *     assetName: string,
 *     assetType: string,
 *     status: 'current' | 'outdated' | 'locked',
 *     lockedVersion: number,
 *     latestVersion: number,
 *     changes: { hasNewAnimations, hasNewModel, changedFields }
 *   }>,
 *   checkedAt: string
 * }
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse<AssetUpdatesResponse>> {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { hasUpdates: false, updates: [], checkedAt: new Date().toISOString() },
        { status: 401 }
      );
    }

    const { id: gameId } = await props.params;

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
        { hasUpdates: false, updates: [], checkedAt: new Date().toISOString() },
        { status: 404 }
      );
    }

    console.log('🔍 Checking for asset updates:', gameId);

    // Find available updates
    const result = await findAvailableUpdates(gameId);

    console.log(`✅ Update check complete: ${result.updates.length} updates found`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Asset updates check failed:', error);
    return NextResponse.json(
      { hasUpdates: false, updates: [], checkedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}

