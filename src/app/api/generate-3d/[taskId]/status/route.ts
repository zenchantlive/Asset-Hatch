/**
 * 3D Asset Generation Status Polling API Route
 *
 * Polls Tripo3D API for task status and updates database when complete.
 *
 * Workflow:
 * 1. Client polls this endpoint with taskId
 * 2. Query Tripo API for current status
 * 3. If status changed to 'success', update database with model URL
 * 4. If status is 'failed', update database with error
 * 5. Return current status to client
 *
 * @see lib/tripo-client.ts for Tripo API integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { auth } from '@/auth'; // TODO: Uncomment when tripoApiKey added to User model
import { pollTripoTaskStatus } from '@/lib/tripo-client';
import type { TaskStatusResponse } from '@/lib/types/3d-generation';

/**
 * GET /api/generate-3d/[taskId]/status
 *
 * Polls Tripo3D API for task status and updates database accordingly.
 *
 * Route params:
 * - taskId: string - Tripo task ID to check
 *
 * Response:
 * - taskId: string - Task ID
 * - status: TripoTaskStatus - Current status (queued/running/success/failed)
 * - progress?: number - Progress percentage (0-100) when running
 * - output?: TripoTaskOutput - Model URLs when complete
 * - error?: string - Error message if failed
 *
 * @example
 * ```typescript
 * GET /api/generate-3d/tripo-task-123/status
 * // Returns: { taskId: "...", status: "running", progress: 45 }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated session
    // const session = await auth();
    const userTripoApiKey: string | null = null;

    // TODO: Add tripoApiKey field to User model
    // Check if user has their own Tripo API key configured (BYOK)
    // if (session?.user?.id) {
    //   const user = await prisma.user.findUnique({
    //     where: { id: session.user.id },
    //     select: { tripoApiKey: true },
    //   });
    //   userTripoApiKey = user?.tripoApiKey || null;
    // }

    // Get Tripo API key (user's key or environment fallback)
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

    console.log('📊 Polling task status:', taskId);

    // 1. Poll Tripo API for status
    const tripoTask = await pollTripoTaskStatus(tripoApiKey, taskId);

    // 2. Find database record by taskId
    const asset = await prisma.generated3DAsset.findFirst({
      where: { draftTaskId: taskId },
    });

    // 3. Update database if status changed to success or failed
    if (asset) {
      if (tripoTask.status === 'success' && tripoTask.output?.model?.url) {
        // Task completed successfully - update with model URL
        await prisma.generated3DAsset.update({
          where: { id: asset.id },
          data: {
            status: 'generated',
            draftModelUrl: tripoTask.output.model.url,
            updatedAt: new Date(),
          },
        });

        console.log('✅ Model URL saved to database:', tripoTask.output.model.url);
      } else if (tripoTask.status === 'failed') {
        // Task failed - update with error message
        await prisma.generated3DAsset.update({
          where: { id: asset.id },
          data: {
            status: 'failed',
            errorMessage: tripoTask.error || 'Task failed without error message',
            updatedAt: new Date(),
          },
        });

        console.log('❌ Task failed:', tripoTask.error);
      } else if (tripoTask.status === 'running' && asset.status === 'queued') {
        // Update status from queued to generating
        await prisma.generated3DAsset.update({
          where: { id: asset.id },
          data: {
            status: 'generating',
            updatedAt: new Date(),
          },
        });
      }
    }

    // 4. Return status to client
    const response: TaskStatusResponse = {
      taskId: tripoTask.task_id,
      status: tripoTask.status,
      progress: tripoTask.progress,
      output: tripoTask.output,
      error: tripoTask.error,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Status polling error:', error);
    return NextResponse.json(
      {
        error: 'Status polling failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
