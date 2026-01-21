// -----------------------------------------------------------------------------
// Project Route Redirect
// Redirects /project/[id] to /project/[id]/planning for backwards compatibility
// -----------------------------------------------------------------------------

import { redirect } from 'next/navigation';

/**
 * Route params for this dynamic page
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Redirect page - catches /project/[id] and redirects to /project/[id]/planning
 *
 * This ensures all old links, bookmarks, and any stale references
 * automatically go to the correct planning page.
 */
export default async function ProjectRedirectPage({ params }: PageProps) {
  const { id: projectId } = await params;

  // Redirect to the planning page
  redirect(`/project/${projectId}/planning`);
}
