// -----------------------------------------------------------------------------
// Project Details API Route
// Handles operations on a single project (GET, DELETE)
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET - Fetch a single project by ID
// =============================================================================

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const project = await prisma.project.findFirst({
            where: {
                id: params.id,
                userId: session.user.id, // Enforce ownership
            },
            select: {
                id: true,
                name: true,
                phase: true,
                mode: true,
                artStyle: true,
                baseResolution: true,
                perspective: true,
                gameGenre: true,
                theme: true,
                mood: true,
                colorPalette: true,
                gameId: true,
                assetManifest: true,
                syncStatus: true,
                lastSyncAt: true,
                pendingAssetCount: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                memoryFiles: true,
                styleAnchors: true,
                generatedAssets: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Delete a project by ID
// =============================================================================

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership before deleting
        const project = await prisma.project.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        await prisma.project.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update a project by ID
// =============================================================================

const ProjectUpdateSchema = z.object({
    phase: z.enum(["planning", "style", "generation", "export"]).optional(),
});

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        const validation = ProjectUpdateSchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { phase } = validation.data;

        // Verify ownership before updating
        const project = await prisma.project.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const updatedProject = await prisma.project.update({
            where: {
                id: params.id,
            },
            data: {
                // Only update phase if it's explicitly provided (not undefined)
                ...(phase !== undefined && { phase }),
            },
        });

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Failed to update project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}
