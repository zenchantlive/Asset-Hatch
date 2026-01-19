// -----------------------------------------------------------------------------
// Dashboard Page (Unified)
// Server component showing user's projects with asset/game status (Phase 6)
// -----------------------------------------------------------------------------

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Gamepad2, Layers } from "lucide-react";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { UnifiedProjectCard } from "@/components/dashboard/UnifiedProjectCard";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Project with unified status for dashboard display
 */
interface UnifiedProject {
  id: string;
  name: string;
  mode: string;
  phase: string;
  syncStatus: string;
  pendingAssetCount: number;
  assetCount: number;
  gamePhase?: string | null;
  updatedAt: Date;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage() {
  // Get current session (server-side)
  const session = await auth();

  // Redirect to home if not authenticated
  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch user's projects from Prisma
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          generatedAssets: true,
          generated3DAssets: true,
          styleAnchors: true,
        },
      },
      game: {
        select: {
          phase: true,
        },
      },
    },
  });

  // Transform projects to unified format
  const projectsWithStatus: UnifiedProject[] = projects.map((project) => {
    // Safely parse asset manifest to get asset count
    const manifestSchema = z.object({
      assets: z.record(z.unknown()).optional().default({}),
      syncState: z.object({
        pendingAssets: z.array(z.string()).optional().default([]),
      }).optional().default({}),
    }).optional().default({});

    const manifest = manifestSchema.parse(project.assetManifest);
    const assets = manifest.assets;
    const syncState = manifest.syncState;

    // Get game phase, converting null to undefined
    const gamePhaseValue = project.game?.phase;
    const gamePhase: string | undefined = gamePhaseValue === null ? undefined : gamePhaseValue;

    return {
      id: project.id,
      name: project.name,
      mode: project.mode,
      phase: project.phase,
      syncStatus: project.syncStatus,
      pendingAssetCount: syncState.pendingAssets?.length ?? 0,
      assetCount: Object.keys(assets).length > 0
        ? Object.keys(assets).length
        : project._count.generatedAssets + project._count.generated3DAssets,
      gamePhase,
      updatedAt: project.updatedAt,
    };
  });

  // Count projects with games vs assets-only
  const projectsWithGames = projectsWithStatus.filter((p) => p.gamePhase).length;
  const projectsWithAssets = projectsWithStatus.filter((p) => p.assetCount > 0).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 p-6 rounded-lg glass-panel">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white/90">
                Your Projects
              </h1>
              <p className="text-white/60">
                Manage assets and games in one unified workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/studio">
              <Button variant="ghost" size="icon" title="Hatch Studios">
                <Gamepad2 className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                title="Settings"
                className="text-white/70 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <NewProjectDialog />
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Layers className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectsWithAssets}</p>
              <p className="text-sm text-white/60">With Assets</p>
            </div>
          </div>
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Gamepad2 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectsWithGames}</p>
              <p className="text-sm text-white/60">With Games</p>
            </div>
          </div>
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {projectsWithStatus.reduce((sum, p) => sum + p.assetCount, 0)}
              </p>
              <p className="text-sm text-white/60">Total Assets</p>
            </div>
          </div>
        </div>

        {/* Projects grid */}
        <main>
          {projectsWithStatus.length === 0 ? (
            // Empty state
            <div className="text-center py-20 border border-dashed border-glass-border rounded-lg glass-panel">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-xl text-white/70 mb-4">
                No projects yet
              </p>
              <p className="text-white/50 mb-6">
                Create your first project to start building games with
                AI-generated assets.
              </p>
              <NewProjectDialog size="lg">
                <span className="mr-2">+</span>
                Create Project
              </NewProjectDialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithStatus.map((project) => (
                <UnifiedProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
