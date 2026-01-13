/**
 * 3D Auto-Rigging API Route
 *
 * Submits auto-rigging task to Tripo3D for character models.
 * Must be called after draft model generation is complete.
 *
 * Workflow:
 * 1. Validate draft model URL exists
 * 2. Submit animate_rig task to Tripo
 * 3. Update database with rig task ID
 * 4. Client polls status endpoint until rigging complete
 *
 * @see lib/tripo-client.ts for Tripo API integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { auth } from '@/auth'; // TODO: Uncomment when tripoApiKey added to User model
import { submitTripoTask } from '@/lib/tripo-client';

/**
 * Request body for rigging endpoint
 */
interface RigRequest {
  projectId: string;
  assetId: string;
  draftModelUrl: string; // URL from completed text_to_model task
}

/**
 * POST /api/generate-3d/rig
 *
 * Submits an auto-rigging task for a generated 3D model.
 * Requires a completed draft model URL.
 *
 * Request body:
 * - projectId: string - Parent project ID
 * - assetId: string - Asset ID from plan
 * - draftModelUrl: string - URL to the draft model (from generation task)
 *
 * Response:
 * - taskId: string - Tripo task ID for polling
 * - status: 'queued' - Initial task status
 *
 * @example
 * ```typescript
 * POST /api/generate-3d/rig
 * {
 *   "projectId": "proj-123",
 *   "assetId": "asset-456",
 *   "draftModelUrl": "https://tmp.tripo3d.ai/model-xyz.glb"
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
    const body: RigRequest = await request.json();
    const { projectId, assetId, draftModelUrl } = body;

    // Validate required fields
    if (!projectId || !assetId || !draftModelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, assetId, draftModelUrl' },
        { status: 400 }
      );
    }

    console.log('🦴 Starting auto-rigging:', {
      projectId,
      assetId,
      modelUrl: draftModelUrl,
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

    // 3. Validate draft model URL exists
    if (!asset.draftModelUrl) {
      return NextResponse.json(
        {
          error: 'Draft model not ready',
          details: 'Wait for generation to complete before rigging',
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

    // 5. Submit animate_rig task to Tripo
    console.log('📤 Submitting rigging task to Tripo3D...');
    const tripoTask = await submitTripoTask(tripoApiKey, {
      type: 'animate_rig',
      model_url: draftModelUrl,
    });

    console.log('✅ Rigging task submitted:', tripoTask.task_id);

    // 6. Update database with rig task ID
    await prisma.generated3DAsset.update({
      where: { id: asset.id },
      data: {
        rigTaskId: tripoTask.task_id,
        status: 'rigging',
        updatedAt: new Date(),
      },
    });

    // 7. Return task ID for polling
    return NextResponse.json({
      taskId: tripoTask.task_id,
      status: 'queued',
    });

  } catch (error) {
    console.error('❌ Rigging error:', error);
    return NextResponse.json(
      {
        error: 'Rigging failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
