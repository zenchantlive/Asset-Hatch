/**
 * Individual Asset Fetch API Route
 * 
 * Fetches a single generated asset by ID with all metadata
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

    // Return asset data with base64 image URL for display
    return NextResponse.json({
      id: asset.id,
      imageUrl: asset.imageBlob 
        ? `data:image/png;base64,${Buffer.from(asset.imageBlob).toString('base64')}`
        : '',
      prompt: asset.promptUsed,
      metadata: JSON.parse(asset.metadata || '{}'),
    });
  } catch (error) {
    console.error('❌ Asset fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}
