// -----------------------------------------------------------------------------
// Unified Project View Page
// Main entry point for Phase 6B: Shared Context & Unified UI
// Replaces separate /project/[id]/planning and /studio/[id] routes
// -----------------------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UnifiedProjectView } from '@/components/studio/UnifiedProjectView';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

/**
 * Route params for this dynamic page
 */
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Fetch project context from MemoryFile
 */
async function fetchProjectContext(projectId: string): Promise<UnifiedProjectContext | undefined> {
  try {
    const memoryFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'project-context.json' } },
    });

    if (!memoryFile) return undefined;

    return JSON.parse(memoryFile.content) as UnifiedProjectContext;
  } catch (error) {
    console.error('Failed to fetch project context:', error);
    return undefined;
  }
}

/**
 * Unified Project View Page
 *
 * Single entry point for both Assets and Game workflows.
 * Maintains shared context between tabs via MemoryFile.
 */
export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { id: projectId } = await params;
  const { tab } = await searchParams;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch project with ownership verification
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    include: {
      game: {
        select: {
          id: true,
          name: true,
          phase: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch shared context
  const context = await fetchProjectContext(projectId);

  // Serialize for client - convert Date to ISO string
  const initialContext: UnifiedProjectContext | undefined = context
    ? {
        ...context,
        updatedAt: new Date(context.updatedAt).toISOString(),
      }
    : undefined;

  // Determine initial tab from URL or default to 'assets'
  type UnifiedTab = 'assets' | 'game';
  const initialTab: UnifiedTab = tab === 'game' ? 'game' : 'assets';

  return (
    <UnifiedProjectView
      projectId={projectId}
      initialContext={initialContext}
      initialTab={initialTab}
    />
  );
}
