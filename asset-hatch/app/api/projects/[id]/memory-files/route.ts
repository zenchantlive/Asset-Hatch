// API endpoint to fetch memory files from Prisma database
// Supports filtering by file type via query parameter
// Used by GenerationQueue to load plan data and FilesPanel to list all files

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter by file type

    // Validate projectId exists
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

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
      { status: 500 }
    );
  }
}
