// -----------------------------------------------------------------------------
// Project Status API Route
// GET /api/projects/[id]/status - Returns unified project status
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/lib/types/unified-project";

// =============================================================================
// GET - Fetch project status including sync state
// =============================================================================

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProjectStatus | { error: string }>> {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId } = await props.params;

    // Fetch project with game info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { game: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse asset manifest
    const manifest = (project.assetManifest as Record<string, unknown> | null) || {
      assets: {},
      syncState: { pendingAssets: [], lastSync: null },
    };
    const assets = (manifest.assets as Record<string, unknown>) || {};
    const syncState = (manifest.syncState as { pendingAssets?: string[] }) || { pendingAssets: [] };

    // Build response
    const status: ProjectStatus = {
      projectId: project.id,
      name: project.name,
      mode: project.mode as "2d" | "3d" | "hybrid",
      phase: project.phase,
      syncStatus: project.syncStatus as "clean" | "pending" | "syncing" | "error",
      pendingAssets: syncState.pendingAssets || [],
      pendingAssetCount: (syncState.pendingAssets?.length ?? 0),
      lastSync: project.lastSyncAt?.toISOString() || null,
      assetCount: Object.keys(assets).length,
      gameId: project.gameId || undefined,
      gamePhase: project.game?.phase,
      updatedAt: project.updatedAt.toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to fetch project status:", error);
    return NextResponse.json(
      { error: "Failed to fetch project status" },
      { status: 500 }
    );
  }
}
