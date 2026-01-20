// -----------------------------------------------------------------------------
// Studio Game Details API Route
// Handles operations on a single game (GET, PATCH, DELETE)
// Following patterns from /api/projects/[id]/route.ts
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for updating game metadata
const updateGameSchema = z.object({
    // Optional name update, must be non-empty if provided
    name: z.string().min(1, "Name cannot be empty").optional(),
    // Optional description update
    description: z.string().nullable().optional(),
    // Optional active scene ID update
    activeSceneId: z.string().uuid().nullable().optional(),
});

// =============================================================================
// ROUTE CONTEXT TYPE
// =============================================================================

interface RouteContext {
    params: Promise<{ id: string }>;
}

// =============================================================================
// GET - Fetch a single game by ID with related scenes
// =============================================================================

export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        // Extract game ID from route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find game with ownership verification and soft-delete check
        const game = await prisma.game.findFirst({
            where: {
                id: params.id,
                userId: session.user.id, // Enforce ownership
                deletedAt: null, // Exclude soft-deleted
            },
            include: {
                project: {
                    select: { id: true },
                },
                scenes: {
                    orderBy: { orderIndex: "asc" }, // Order scenes by index
                    select: {
                        id: true,
                        name: true,
                        orderIndex: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        // Return 404 if game not found or user doesn't own it
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Transform to include projectId at top level
        const { project, ...gameData } = game;
        const responseGame = {
            ...gameData,
            projectId: project?.id || null,
        };

        return NextResponse.json({ success: true, game: responseGame });
    } catch (error) {
        console.error("Failed to fetch game:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch game" },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update game metadata
// =============================================================================

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        // Extract game ID from route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const json = await request.json();
        const validation = updateGameSchema.safeParse(json);

        // Return 400 if validation fails
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid request body", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, description, activeSceneId } = validation.data;

        // Verify game exists and user owns it
        const existingGame = await prisma.game.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
                deletedAt: null, // Cannot update soft-deleted game
            },
        });

        // Return 404 if game not found
        if (!existingGame) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Build update data - only include fields that were provided
        const updateData: {
            name?: string;
            description?: string | null;
            activeSceneId?: string | null;
        } = {};

        if (name !== undefined) {
            updateData.name = name;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (activeSceneId !== undefined) {
            updateData.activeSceneId = activeSceneId;
        }

        // Update the game
        const updatedGame = await prisma.game.update({
            where: { id: params.id },
            data: updateData,
            include: {
                scenes: {
                    orderBy: { orderIndex: "asc" },
                    select: {
                        id: true,
                        name: true,
                        orderIndex: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, game: updatedGame });
    } catch (error) {
        console.error("Failed to update game:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update game" },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Soft delete a game (sets deletedAt timestamp)
// =============================================================================

export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        // Extract game ID from route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify game exists and user owns it
        const game = await prisma.game.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
                deletedAt: null, // Cannot delete already deleted game
            },
        });

        // Return 404 if game not found
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Soft delete by setting deletedAt timestamp
        // This preserves the game and related data for potential recovery
        await prisma.game.update({
            where: { id: params.id },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete game:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete game" },
            { status: 500 }
        );
    }
}
