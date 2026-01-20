// -----------------------------------------------------------------------------
// Projects API Route
// Handles project creation with user ownership and unified project support
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { CreateProjectData } from "@/lib/types/unified-project";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["2d", "3d", "hybrid"]).default("2d"),
  startWith: z.enum(["assets", "game", "both"]).default("assets"),
});

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface ProjectResponse {
  success: boolean;
  project?: {
    id: string;
    name: string;
    phase: string;
    userId: string | null;
  };
  error?: string;
}

interface UnifiedProjectResponse {
  success: boolean;
  projectId: string;
  gameId?: string;
  error?: string;
}

// =============================================================================
// GET - Fetch all projects for the authenticated user
// =============================================================================

export async function GET(): Promise<
  NextResponse<ProjectResponse | { projects: Array<{ id: string; name: string; phase: string }> }>
> {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's projects
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        phase: true,
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create a new project (unified with optional game creation)
// =============================================================================

export async function POST(
  request: Request
): Promise<NextResponse<UnifiedProjectResponse | { success: false; error: string }>> {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: unknown = await request.json();

    // Validate input
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { name, mode, startWith } = parsed.data as CreateProjectData;
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Verify user exists in DB to prevent Foreign Key errors (P2003)
    // This handles cases where the DB was reset but the user has a valid session cookie
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log(`User not found in DB (stale session?). Re-creating user.`);
      if (userEmail) {
        // Use upsert to prevent race condition if multiple requests try to create same user
        await prisma.user.upsert({
          where: { id: userId },
          update: {}, // If exists, no-op
          create: {
            id: userId,
            email: userEmail,
            name: session.user.name,
            image: session.user.image,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, error: "User record missing and no email in session to re-create" },
          { status: 500 }
        );
      }
    }

    // Set initial phase based on startWith
    const initialPhase = startWith === "game" || startWith === "both" ? "building" : "assets";

    // Create initial asset manifest
    const initialManifest = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      assets: {},
      syncState: {
        status: "clean",
        pendingAssets: [],
        lastSync: null,
      },
    };

    let project;
    let gameId: string | undefined;

    // Always create project and game together - they are always linked
    // The startWith parameter only affects initial view, not creation
    project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          userId: userId,
          phase: "assets",
          mode: mode,
          assetManifest: initialManifest,
          syncStatus: "clean",
        },
      });

      const newGame = await tx.game.create({
        data: {
          userId: userId,
          name: `${name} Game`,
          phase: "planning",
          projectId: newProject.id,
        },
      });
      gameId = newGame.id;

      // Update project with game reference and correct phase
      return tx.project.update({
        where: { id: newProject.id },
        data: {
          gameId: newGame.id,
          phase: initialPhase,
        },
      });
    });

    console.log(
      `✅ Created unified project: ${project.id}${gameId ? ` with game: ${gameId}` : ""}`
    );

    return NextResponse.json({
      success: true,
      projectId: project.id,
      gameId,
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    // Log specifics if it's a Prisma error using type guards
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Message:", error.message);
    }
    // Return generic error - do NOT expose internal details to client
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 }
    );
  }
}
