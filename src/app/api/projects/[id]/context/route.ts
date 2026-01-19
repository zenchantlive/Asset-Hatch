// -----------------------------------------------------------------------------
// Project Context API Route
// Handles GET/POST operations for project-context.json in MemoryFile
// Phase 6B: Shared Context & Unified UI
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type {
  UnifiedProjectContext,
  GetContextResponse,
  UpdateContextResponse,
} from "@/lib/types/shared-context";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const updateContextSchema = z.object({
  context: z.object({
    gameConcept: z.string().optional(),
    targetAudience: z.string().optional(),
    keyFeatures: z.array(z.string()).optional(),
    characters: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          animations: z.array(z.string()),
          assetId: z.string().optional(),
        })
      )
      .optional(),
    environments: z
      .array(
        z.object({
          name: z.string(),
          type: z.enum(["interior", "exterior", "skybox"]),
          assetId: z.string().optional(),
        })
      )
      .optional(),
    scenes: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
        })
      )
      .optional(),
    lastUpdatedBy: z.enum(["assets", "game"]).optional(),
  }),
});

// =============================================================================
// GET - Fetch project context
// =============================================================================

/**
 * GET /api/projects/[id]/context
 * Fetch the shared context document for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetContextResponse>> {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch context from MemoryFile
    const memoryFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: "project-context.json" } },
    });

    if (!memoryFile) {
      // Return empty context structure
      const emptyContext: UnifiedProjectContext = {
        projectId,
        gameConcept: "",
        targetAudience: "",
        keyFeatures: [],
        characters: [],
        environments: [],
        scenes: [],
        lastUpdatedBy: "assets",
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, context: emptyContext });
    }

    const context = JSON.parse(memoryFile.content) as UnifiedProjectContext;
    return NextResponse.json({ success: true, context });
  } catch (error) {
    console.error("Failed to fetch project context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Update project context
// =============================================================================

/**
 * POST /api/projects/[id]/context
 * Update the shared context document for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateContextResponse | { success: false; error: string }>> {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updates = parsed.data.context;

    // Fetch existing context
    const existingFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: "project-context.json" } },
    });

    let existingContext: UnifiedProjectContext = {
      projectId,
      gameConcept: "",
      targetAudience: "",
      keyFeatures: [],
      characters: [],
      environments: [],
      scenes: [],
      lastUpdatedBy: "assets",
      updatedAt: new Date().toISOString(),
    };

    if (existingFile) {
      existingContext = JSON.parse(existingFile.content);
    }

    // Merge updates
    const mergedContext: UnifiedProjectContext = {
      ...existingContext,
      ...updates,
      projectId, // Ensure projectId never changes
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: updates.lastUpdatedBy || "assets",
    };

    // Upsert MemoryFile
    await prisma.memoryFile.upsert({
      where: { projectId_type: { projectId, type: "project-context.json" } },
      update: {
        content: JSON.stringify(mergedContext),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "project-context.json",
        content: JSON.stringify(mergedContext),
      },
    });

    console.log("✅ Project context updated:", {
      projectId,
      updatedBy: mergedContext.lastUpdatedBy,
    });

    return NextResponse.json({
      success: true,
      message: "Context updated successfully",
    });
  } catch (error) {
    console.error("Failed to update project context:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update context" },
      { status: 500 }
    );
  }
}
