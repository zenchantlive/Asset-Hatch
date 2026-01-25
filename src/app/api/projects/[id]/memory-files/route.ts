// API endpoint to fetch memory files from Prisma database
// Supports filtering by file type via query parameter
// Used by GenerationQueue to load plan data and FilesPanel to list all files

import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * GET /api/projects/[id]/memory-files
 *
 * Fetches memory files for a specific project from Prisma SQLite database.
 *
 * Query Parameters:
 * - type (optional): Filter files by type (e.g., 'entities.json', 'style-draft')
 *
 * Response:
 * - success: boolean
 * - files: Array of MemoryFile objects with id, projectId, type, content, timestamps
 *
 * Example Usage:
 * - GET /api/projects/abc-123/memory-files (returns all files for project)
 * - GET /api/projects/abc-123/memory-files?type=entities.json (returns only plan file)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise and must be awaited
    const { id: projectId } = await params;

    // Authentication check - prevent unauthorized access to memory files
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project ownership - users can only access their own projects
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter by file type

    // Build Prisma query with conditional type filter
    // If type is provided, only return files matching that type
    // Otherwise, return all files for the project
    const where = {
      projectId,
      ...(type && { type }), // Spread operator adds type filter only if type exists
    };

    // Query database for memory files
    // Ordered by creation date (newest first) for better UX
    const memoryFiles = await prisma.memoryFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Return successful response with files array
    // Even if no files found, return empty array (not an error)
    return NextResponse.json({
      success: true,
      files: memoryFiles,
    });
  } catch (error) {
    // Log error for debugging but don't expose internal details to client
    console.error('Failed to fetch memory files:', error);

    // Return generic error message with 500 status
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memory files' },
    );
  }
}

// Validation schema for memory file input
const memoryFileSchema = z.object({
  type: z.enum([
    'project.json',
    'entities.json',
    'style-anchor.json',
    'generation-log.json',
    'conversation.json',
    'style-draft.json',
  ]),
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(10_000_000, 'Content too large (max 10MB)'),
});

/**
 * POST /api/projects/[id]/memory-files
 *
 * Upsert a memory file for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse and validate request body with Zod schema
    const body: unknown = await request.json();
    const parsed = memoryFileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { type, content } = parsed.data;

    // Use atomic upsert to prevent race conditions
    // Now safe because we have @@unique([projectId, type]) constraint
    const memoryFile = await prisma.memoryFile.upsert({
      where: {
        projectId_type: { projectId, type },
      },
      update: { content },
      create: {
        projectId,
        type,
        content,
      },
    });

    return NextResponse.json({ success: true, file: memoryFile });
  } catch (error) {
    console.error("Failed to save memory file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save memory file" },
      { status: 500 }
    );
  }
}
