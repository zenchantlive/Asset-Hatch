/**
 * 3D Asset Generation Status Polling API Route
 *
 * Polls Tripo3D API for task status and updates database when complete.
 * Handles draft generation, rigging, AND animation tasks.
 *
 * Workflow:
 * 1. Client polls this endpoint with taskId
 * 2. Query Tripo API for current status
 * 3. Find asset by taskId (draft, rig, OR animation task)
 * 4. If status changed to 'success', update database with model URL
 * 5. If status is 'failed', update database with error
 * 6. Return current status to client
 *
 * @see lib/tripo-client.ts for Tripo API integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { pollTripoTaskStatus } from '@/lib/tripo-client';
import type { TaskStatusResponse, TripoTaskOutput } from '@/lib/types/3d-generation';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Result of finding an asset by task ID
 * Includes which type of task matched (for proper URL field update)
 */
interface AssetMatchResult {
  // The matched database record
  asset: {
    id: string;
    projectId: string;
    assetId: string;
    status: string;
    draftTaskId: string | null;
    rigTaskId: string | null;
    animationTaskIds: string | null;
    animatedModelUrls: string | null;
  };
  // Type of task that matched
  matchType: 'draft' | 'rig' | 'animation';
  // If animation match, which preset (e.g., 'preset:walk')
  animationPreset?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Extract model URL from Tripo task output.
 * Handles different response structures from various task types.
 *
 * @param output - Raw output from Tripo API
 * @returns Model URL string or null if not found
 */
function extractModelUrl(output: TripoTaskOutput | undefined): string | null {
  if (!output) return null;

  // Direct pbr_model string (most common for text_to_model results)
  if (typeof output.pbr_model === 'string') {
    return output.pbr_model;
  }

  // pbr_model as object with url property (refine_model results)
  if (output.pbr_model && typeof output.pbr_model === 'object') {
    return output.pbr_model.url;
  }

  // Direct model string (rigging and animation task results)
  // Tripo returns { "model": "https://..." } for animate_rig, animate_retarget
  if (typeof output.model === 'string') {
    return output.model;
  }

  // model as object with url property (fallback format)
  if (output.model?.url) {
    return output.model.url;
  }

  return null;
}

/**
 * Find an asset by task ID, searching draft, rig, AND animation task IDs.
 * Animation task IDs are stored as JSON strings and must be searched specially.
 *
 * @param taskId - The Tripo task ID to find
 * @returns Asset match result with match type, or null if not found
 */
async function findAssetByTaskId(taskId: string): Promise<AssetMatchResult | null> {
  // First, try fast lookup by draft or rig task ID
  const directMatch = await prisma.generated3DAsset.findFirst({
    where: {
      OR: [
        { draftTaskId: taskId },
        { rigTaskId: taskId },
      ],
    },
    select: {
      id: true,
      projectId: true,
      assetId: true,
      status: true,
      draftTaskId: true,
      rigTaskId: true,
      animationTaskIds: true,
      animatedModelUrls: true,
    },
  });

  if (directMatch) {
    // Determine which type matched
    const matchType = directMatch.rigTaskId === taskId ? 'rig' : 'draft';
    return { asset: directMatch, matchType };
  }

  // If no direct match, search animation task IDs (stored as JSON strings)
  // This is less efficient but necessary for animation task persistence
  const allAssets = await prisma.generated3DAsset.findMany({
    where: {
      animationTaskIds: { not: null },
    },
    select: {
      id: true,
      projectId: true,
      assetId: true,
      status: true,
      draftTaskId: true,
      rigTaskId: true,
      animationTaskIds: true,
      animatedModelUrls: true,
    },
  });

  // Search through each asset's animation task IDs
  for (const asset of allAssets) {
    if (!asset.animationTaskIds) continue;

    try {
      // Parse JSON: { "preset:walk": "task-123", "preset:idle": "task-456" }
      const taskIds = JSON.parse(asset.animationTaskIds) as Record<string, string>;

      // Check if any animation preset has this task ID
      for (const [preset, storedTaskId] of Object.entries(taskIds)) {
        if (storedTaskId === taskId) {
          return {
            asset,
            matchType: 'animation',
            animationPreset: preset,
          };
        }
      }
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse animationTaskIds for asset ${asset.id}:`, parseError);
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Route Handler
// -----------------------------------------------------------------------------

/**
 * GET /api/generate-3d/[taskId]/status
 *
 * Polls Tripo3D API for task status and updates database accordingly.
 * Supports draft generation, rigging, AND animation tasks.
 *
 * @example
 * GET /api/generate-3d/tripo-task-123/status
 * // Returns: { taskId: "...", status: "running", progress: 45 }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated session
    const session = await auth();
    const userTripoApiKey: string | null = null;

    // TODO: Add tripoApiKey field to User model
    // if (session?.user?.id) {
    //   const user = await prisma.user.findUnique({ ... });
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

    // 2. Find database record by taskId (draft, rig, OR animation)
    const matchResult = await findAssetByTaskId(taskId);

    // 3. Verify user owns the project (authentication required)
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'Authentication required to access this asset' },
            { status: 401 }
        );
    }

    if (matchResult) {
        const project = await prisma.project.findUnique({
            where: { id: matchResult.asset.projectId },
            select: { userId: true },
        });

        if (project && project.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'You do not have permission to access this asset' },
                { status: 403 }
            );
        }
    }

    // 3. Update database if status changed to success or failed
    if (matchResult) {
      const { asset, matchType, animationPreset } = matchResult;

      if (tripoTask.status === 'success') {
        // Log output for debugging
        console.log('📦 Tripo Task Output:', JSON.stringify(tripoTask.output, null, 2));

        // Extract model URL from output
        const modelUrl = extractModelUrl(tripoTask.output);

        if (modelUrl) {
          if (matchType === 'draft') {
            // Update DRAFT model URL
            await prisma.generated3DAsset.update({
              where: { id: asset.id },
              data: {
                status: 'generated',
                draftModelUrl: modelUrl,
                updatedAt: new Date(),
              },
            });
            console.log('✅ Draft Model URL saved:', modelUrl);

          } else if (matchType === 'rig') {
            // Update RIGGED model URL
            await prisma.generated3DAsset.update({
              where: { id: asset.id },
              data: {
                status: 'rigged',
                riggedModelUrl: modelUrl,
                updatedAt: new Date(),
              },
            });
            console.log('✅ Rigged Model URL saved:', modelUrl);

          } else if (matchType === 'animation' && animationPreset) {
            // Update ANIMATED model URL for specific preset
            // Parse existing URLs, add new one, save back
            const existingUrls = asset.animatedModelUrls
              ? JSON.parse(asset.animatedModelUrls) as Record<string, string>
              : {};

            const updatedUrls = {
              ...existingUrls,
              [animationPreset]: modelUrl,
            };

            await prisma.generated3DAsset.update({
              where: { id: asset.id },
              data: {
                status: 'complete', // Animation is the final step
                animatedModelUrls: JSON.stringify(updatedUrls),
                updatedAt: new Date(),
              },
            });
            console.log(`✅ Animated Model URL saved for ${animationPreset}:`, modelUrl);
          }
        } else {
          console.warn('⚠️ Task success but no model URL found in response');
        }

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

        const taskTypeName = matchType === 'animation' ? `Animation (${animationPreset})` :
          matchType === 'rig' ? 'Rigging' : 'Generation';
        console.log(`❌ ${taskTypeName} task failed:`, tripoTask.error);
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
