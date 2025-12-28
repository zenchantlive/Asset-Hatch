// -----------------------------------------------------------------------------
// Projects API Route
// Handles project creation with user ownership
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const createProjectSchema = z.object({
    name: z.string().min(1, "Name is required"),
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

// =============================================================================
// GET - Fetch all projects for the authenticated user
// =============================================================================

export async function GET(): Promise<NextResponse<ProjectResponse | { projects: Array<{ id: string; name: string; phase: string }> }>> {
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
// POST - Create a new project
// =============================================================================

export async function POST(
    request: Request
): Promise<NextResponse<ProjectResponse>> {
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

        const { name } = parsed.data;

        // Create project with user ownership
        const project = await prisma.project.create({
            data: {
                name,
                userId: session.user.id,
                phase: "planning",
            },
        });

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                phase: project.phase,
                userId: project.userId,
            },
        });
    } catch (error) {
        console.error("Failed to create project:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create project" },
            { status: 500 }
        );
    }
}
