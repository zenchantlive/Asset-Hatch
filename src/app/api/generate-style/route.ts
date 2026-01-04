/**
 * Style Anchor Reference Image Generation API Route
 *
 * Generates a standardized style reference image using Flux.2 via OpenRouter.
 * This image becomes the style anchor that guides all future asset generation.
 *
 * Workflow:
 * 1. Receive style draft (keywords, colors, lighting) + generation prompt
 * 2. Build optimized prompt for style reference generation
 * 3. Call OpenRouter Flux API
 * 4. Create StyleAnchor record with generated image
 * 5. Return image URL to client
 * 
 * Uses shared utility: lib/openrouter-image.ts for correct API handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateStyleAnchor, type StyleAnchorGenerationParams } from '@/lib/style-anchor-generator';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session to check for user's API key (BYOK)
    const session = await auth();
    let userApiKey: string | null = null;

    // Check if user has their own API key configured
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openRouterApiKey: true },
      });
      userApiKey = user?.openRouterApiKey || null;
      if (userApiKey) {
        console.log('🔑 Using user\'s own API key (BYOK)');
      }
    }

    // Parse and validate request body
    const body: StyleAnchorGenerationParams = await request.json();
    const { projectId, prompt } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Call shared generation logic with user's API key if available
    const result = await generateStyleAnchor({
      ...body,
      apiKey: userApiKey || undefined, // BYOK: use user's key if available
    });

    // Return success with image data
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Style generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate style anchor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
