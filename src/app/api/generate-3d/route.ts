/**
 * 3D Asset Generation API Route
 *
 * Generates 3D models using Tripo3D API from text prompts.
 *
 * Workflow:
 * 1. Receive asset specification from finalized plan
 * 2. Submit text_to_model task to Tripo3D
 * 3. Create Generated3DAsset record with task ID
 * 4. Client polls /api/generate-3d/[taskId]/status until complete
 * 5. Optional: Automatically chain rigging and animation tasks
 *
 * @see lib/tripo-client.ts for Tripo API integration
 * @see lib/types/3d-generation.ts for type definitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { submitTripoTask } from '@/lib/tripo-client';
import type { Generate3DRequest, Generate3DResponse } from '@/lib/types/3d-generation';

/**
 * POST /api/generate-3d
 *
 * Submits a text-to-3D model generation task to Tripo3D API.
 * Returns immediately with task ID for status polling.
 *
 * Request body:
 * - projectId: string - Parent project ID
 * - assetId: string - Asset ID from finalized plan
 * - prompt: string - Text description for 3D model
 * - shouldRig?: boolean - Auto-rig after generation (optional)
 * - animations?: AnimationPreset[] - Animations to apply (optional)
 *
 * Response:
 * - taskId: string - Tripo task ID for polling
 * - status: 'queued' - Initial task status
 *
 * @example
 * ```typescript
 * POST /api/generate-3d
 * {
 *   "projectId": "proj-123",
 *   "assetId": "asset-456",
 *   "prompt": "a low poly knight character in T-pose",
 *   "shouldRig": true,
 *   "animations": ["preset:idle", "preset:walk"]
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session to check for user's Tripo API key
    const session = await auth();
    let userTripoApiKey: string | null = null;

    // Check if user has their own Tripo API key configured (BYOK)
    console.log('🔑 BYOK Debug - Session:', {
      hasSession: !!session,
      userId: session?.user?.id || 'none'
    });

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tripoApiKey: true },
      });
      
      // If the field is not null, the user has "opted-in" to BYOK
      if (user && user.tripoApiKey !== null) {
        userTripoApiKey = user.tripoApiKey;
      }
      
      console.log('🔑 BYOK Debug - User key:', {
        hasKey: userTripoApiKey !== null,
        keyPrefix: userTripoApiKey?.slice(0, 8) || 'none',
        keyLength: userTripoApiKey?.length || 0
      });
    }

    // Parse and validate request body
    const body: Generate3DRequest = await request.json();
    const { projectId, assetId, name, prompt, shouldRig = false } = body;

    // Validate required fields
    if (!projectId || !assetId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, assetId, prompt' },
        { status: 400 }
      );
    }

    console.log('🎨 Starting 3D asset generation:', {
      projectId,
      assetId,
      promptLength: prompt.length,
      shouldRig,
    });

    // 1. Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 2. Verify user owns the project (if authenticated)
    if (session?.user?.id && project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this project' },
        { status: 403 }
      );
    }

    // 2. Get Tripo API key (user's BYOK key takes priority over environment)
    const envKey = process.env.TRIPO_API_KEY;
    const tripoApiKey = userTripoApiKey !== null ? userTripoApiKey : envKey;
    console.log('🔑 BYOK - Key source:', {
      usingSource: userTripoApiKey !== null ? 'USER_BYOK' : (envKey ? 'ENV_VAR' : 'NONE'),
      keyPrefix: tripoApiKey?.slice(0, 8) || 'none',
    });

    if (!tripoApiKey) {
      return NextResponse.json(
        {
          error: 'Tripo API key not configured',
          details: 'Please add your Tripo API key in settings or configure TRIPO_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    // 3. Submit text_to_model task to Tripo
    console.log('📤 Submitting task to Tripo3D...');
    const tripoTask = await submitTripoTask(tripoApiKey, {
      type: 'text_to_model',
      prompt,
    });

    console.log('✅ Task submitted:', tripoTask.task_id);

    // 4. Create or update Generated3DAsset database record
    // Use upsert to handle regeneration (when asset already exists)
    const generated3DAsset = await prisma.generated3DAsset.upsert({
      where: {
        // Use the unique constraint for lookup
        projectId_assetId: {
          projectId,
          assetId,
        },
      },
      create: {
        projectId,
        assetId,
        name, // Human-readable name for file naming (e.g., "Knight Character")
        status: 'queued',
        draftTaskId: tripoTask.task_id,
        promptUsed: prompt,
        isRiggable: shouldRig,
      },
      update: {
        // Reset all generation state for regeneration
        name,
        status: 'queued',
        draftTaskId: tripoTask.task_id,
        promptUsed: prompt,
        isRiggable: shouldRig,
        // Clear previous generation data
        draftModelUrl: null,
        rigTaskId: null,
        riggedModelUrl: null,
        animationTaskIds: null,
        animatedModelUrls: null,
        errorMessage: null,
        approvalStatus: null,
        approvedAt: null,
        updatedAt: new Date(),
      },
    });

    console.log('💾 Database record created/updated:', generated3DAsset.id);

    // 5. Return task ID for polling
    const response: Generate3DResponse = {
      taskId: tripoTask.task_id,
      status: 'queued',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 3D generation error:', error);
    return NextResponse.json(
      {
        error: 'Generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
