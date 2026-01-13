/**
 * 3D Animation Retargeting API Route
 *
 * Applies animation presets to rigged 3D models using Tripo3D.
 * Must be called after rigging is complete.
 *
 * Workflow:
 * 1. Validate rigged model URL exists
 * 2. Submit animate_retarget task to Tripo with animation preset
 * 3. Update database with animation task ID
 * 4. Client polls status endpoint until animation complete
 *
 * @see lib/tripo-client.ts for Tripo API integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { auth } from '@/auth'; // TODO: Uncomment when tripoApiKey added to User model
import { submitTripoTask } from '@/lib/tripo-client';
import type { AnimationPreset } from '@/lib/types/3d-generation';

/**
 * Request body for animation endpoint
 */
interface AnimateRequest {
  projectId: string;
  assetId: string;
  riggedModelUrl: string;
  animationPreset: AnimationPreset; // e.g., 'preset:walk'
}

/**
 * POST /api/generate-3d/animate
 *
 * Applies an animation preset to a rigged 3D model.
 * Requires a completed rigged model URL.
 *
 * Request body:
 * - projectId: string - Parent project ID
 * - assetId: string - Asset ID from plan
 * - riggedModelUrl: string - URL to the rigged model
 * - animationPreset: AnimationPreset - Animation to apply (e.g., 'preset:walk')
 *
 * Response:
 * - taskId: string - Tripo task ID for polling
 * - status: 'queued' - Initial task status
 *
 * @example
 * ```typescript
 * POST /api/generate-3d/animate
 * {
 *   "projectId": "proj-123",
 *   "assetId": "asset-456",
 *   "riggedModelUrl": "https://tmp.tripo3d.ai/rigged-xyz.glb",
 *   "animationPreset": "preset:walk"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    // const session = await auth();
    const userTripoApiKey: string | null = null;

    // TODO: Add tripoApiKey field to User model
    // if (session?.user?.id) {
    //   const user = await prisma.user.findUnique({
    //     where: { id: session.user.id },
    //     select: { tripoApiKey: true },
    //   });
    //   userTripoApiKey = user?.tripoApiKey || null;
    // }

    // Parse and validate request body
    const body: AnimateRequest & { rigTaskId?: string } = await request.json();
    const { projectId, assetId, riggedModelUrl, animationPreset, rigTaskId } = body;

    // Validate required fields
    if (!projectId || !assetId || !riggedModelUrl || !animationPreset) {
      return NextResponse.json(
        {
          error: 'Missing required fields: projectId, assetId, riggedModelUrl, animationPreset',
        },
        { status: 400 }
      );
    }

    // Validate animation preset format
    if (!animationPreset.startsWith('preset:')) {
      return NextResponse.json(
        {
          error: 'Invalid animation preset format',
          details: 'Animation preset must start with "preset:" (e.g., "preset:walk")',
        },
        { status: 400 }
      );
    }

    console.log('🎬 Starting animation retargeting:', {
      projectId,
      assetId,
      animation: animationPreset,
      rigTaskId: rigTaskId || 'lookup from db',
    });

    // 1. Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 2. Find the Generated3DAsset record
    const asset = await prisma.generated3DAsset.findFirst({
      where: {
        projectId,
        assetId,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Generated asset not found' },
        { status: 404 }
      );
    }

    // 3. Resolve Rig Task ID (Required for Tripo animate_retarget)
    // Prefer ID from request, fallback to DB record
    const finalRigTaskId = rigTaskId || asset.rigTaskId;

    if (!finalRigTaskId) {
      console.error('❌ Missing rigTaskId for animation request');
      return NextResponse.json(
        {
          error: 'Rig task ID missing',
          details: 'Cannot animate without the original rig task ID. Try re-rigging the asset.',
        },
        { status: 400 }
      );
    }

    // 4. Get Tripo API key
    const tripoApiKey = userTripoApiKey || process.env.TRIPO_API_KEY;

    if (!tripoApiKey) {
      return NextResponse.json(
        {
          error: 'Tripo API key not configured',
          details: 'Please add TRIPO_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    // 5. Submit animate_retarget task to Tripo
    // Note: Use original_model_task_id (the rigging task) instead of model_url
    console.log('📤 Submitting animation task to Tripo3D...', { original_model_task_id: finalRigTaskId });

    const tripoTask = await submitTripoTask(tripoApiKey, {
      type: 'animate_retarget',
      original_model_task_id: finalRigTaskId,
      animation: animationPreset,
    });

    console.log('✅ Animation task submitted:', tripoTask.task_id);

    // 6. Update database with animation task ID
    // Parse existing animation task IDs (JSON string)
    const existingTaskIds = asset.animationTaskIds
      ? JSON.parse(asset.animationTaskIds)
      : {};

    // Add new task ID for this animation preset
    const updatedTaskIds = {
      ...existingTaskIds,
      [animationPreset]: tripoTask.task_id,
    };

    await prisma.generated3DAsset.update({
      where: { id: asset.id },
      data: {
        animationTaskIds: JSON.stringify(updatedTaskIds),
        status: 'animating',
        updatedAt: new Date(),
      },
    });

    // 7. Return task ID for polling
    return NextResponse.json({
      taskId: tripoTask.task_id,
      status: 'queued',
      animationPreset,
    });

  } catch (error) {
    console.error('❌ Animation error:', error);
    return NextResponse.json(
      {
        error: 'Animation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
