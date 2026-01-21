// -----------------------------------------------------------------------------
// Studio Scene Detail API Route
// Handles operations on a single scene (GET, PATCH, DELETE)
// Nested route: /api/studio/games/[id]/scenes/[sceneId]
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for updating scene
const updateSceneSchema = z.object({
    // Optional name update, must be non-empty if provided
    name: z.string().min(1, "Name cannot be empty").optional(),
    // Optional orderIndex update for reordering
    orderIndex: z.number().int().min(0).optional(),
});

// =============================================================================
// ROUTE CONTEXT TYPE
// =============================================================================

interface RouteContext {
    params: Promise<{ id: string; sceneId: string }>;
}

// =============================================================================
// HELPER: Verify Game Ownership
// =============================================================================

async function verifyGameOwnership(gameId: string, userId: string) {
    // Find game with ownership and soft-delete check
    const game = await prisma.game.findFirst({
        where: {
            id: gameId,
            userId: userId,
            deletedAt: null,
        },
    });
    return game;
}

// =============================================================================
// GET - Fetch a single scene by ID
// =============================================================================

export async function GET(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        // Extract route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user owns this game
        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Find scene and verify it belongs to this game
        const scene = await prisma.gameScene.findFirst({
            where: {
                id: params.sceneId,
                gameId: params.id, // Ensure scene belongs to the game
            },
            select: {
                id: true,
                gameId: true,
                name: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Return 404 if scene not found
        if (!scene) {
            return NextResponse.json(
                { success: false, error: "Scene not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, scene });
    } catch (error) {
        console.error("Failed to fetch scene:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch scene" },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update scene data (name, orderIndex)
// =============================================================================

export async function PATCH(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        // Extract route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user owns this game
        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Verify scene exists and belongs to this game
        const existingScene = await prisma.gameScene.findFirst({
            where: {
                id: params.sceneId,
                gameId: params.id,
            },
        });

        if (!existingScene) {
            return NextResponse.json(
                { success: false, error: "Scene not found" },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const json = await request.json();
        const validation = updateSceneSchema.safeParse(json);

        // Return 400 if validation fails
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid request body", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, orderIndex } = validation.data;

        // Build update data - only include fields that were provided
        const updateData: {
            name?: string;
            orderIndex?: number;
        } = {};

        if (name !== undefined) {
            updateData.name = name;
        }
        if (orderIndex !== undefined) {
            updateData.orderIndex = orderIndex;
        }

        // Update the scene
        const updatedScene = await prisma.gameScene.update({
            where: { id: params.sceneId },
            data: updateData,
            select: {
                id: true,
                gameId: true,
                name: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ success: true, scene: updatedScene });
    } catch (error) {
        console.error("Failed to update scene:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update scene" },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Hard delete a scene
// =============================================================================

export async function DELETE(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        // Extract route params
        const params = await context.params;
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user owns this game
        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Verify scene exists and belongs to this game
        const scene = await prisma.gameScene.findFirst({
            where: {
                id: params.sceneId,
                gameId: params.id,
            },
        });

        if (!scene) {
            return NextResponse.json(
                { success: false, error: "Scene not found" },
                { status: 404 }
            );
        }

        // Hard delete the scene (cascade will clean up AssetPlacements)
        await prisma.gameScene.delete({
            where: { id: params.sceneId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete scene:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete scene" },
            { status: 500 }
        );
    }
}
