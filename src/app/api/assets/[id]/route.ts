/**
 * Individual Asset Fetch API Route
 *
 * Fetches a single generated asset metadata by ID
 * Note: Images are stored in client IndexedDB, not on server
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.generatedAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Return asset metadata only
    // Image should be fetched from IndexedDB on client side
    return NextResponse.json({
      id: asset.id,
      assetId: asset.assetId,
      variantId: asset.variantId,
      status: asset.status,
      prompt: asset.promptUsed,
      seed: asset.seed,
      metadata: JSON.parse(asset.metadata || '{}'),
      createdAt: asset.createdAt,
      // No imageUrl - client reads from IndexedDB
    });
  } catch (error) {
    console.error('❌ Asset fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}
