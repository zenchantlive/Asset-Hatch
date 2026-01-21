import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// Project Layout (Server Component)
// Validates project access and provides context to child pages
// -----------------------------------------------------------------------------

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Get session server-side
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect("/");
  }

  // Get project ID from params
  const { id } = await params;

  console.log("🔍 Layout: Looking up project:", id, "for user:", session.user.id);

  // Verify project exists and belongs to user (or has no owner for legacy projects)
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, phase: true },
  });

  console.log("🔍 Layout: Project found:", project);

  if (!project) {
    console.log("❌ Layout: Project not found, redirecting to dashboard");
    redirect("/dashboard");
  }

  // Check ownership: project must have a userId and it must match the session user's id.
  if (!project.userId || project.userId !== session.user.id) {
    console.log("❌ Layout: Ownership mismatch", { projectUserId: project.userId, sessionUserId: session.user.id });
    redirect("/dashboard");
  }

  return <>{children}</>;
}
