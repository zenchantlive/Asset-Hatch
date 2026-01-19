// -----------------------------------------------------------------------------
// Studio Scenes List/Create API Route
// Handles scene listing and creation for a game
// Nested route: /api/studio/games/[id]/scenes
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for creating a new scene
const createSceneSchema = z.object({
    // Scene name is required, must be at least 1 character
    name: z.string().min(1, "Name is required"),
});

// =============================================================================
// ROUTE CONTEXT TYPE
// =============================================================================

interface RouteContext {
    params: Promise<{ id: string }>;
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
// GET - Fetch all scenes for a game
// =============================================================================

export async function GET(
    request: Request,
    context: RouteContext
): Promise<NextResponse> {
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

        // Verify user owns this game
        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Fetch all scenes for this game, ordered by orderIndex
        const scenes = await prisma.gameScene.findMany({
            where: { gameId: params.id },
            orderBy: { orderIndex: "asc" },
            select: {
                id: true,
                gameId: true,
                name: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ success: true, scenes });
    } catch (error) {
        console.error("Failed to fetch scenes:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch scenes" },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create a new scene in the game
// =============================================================================

export async function POST(
    request: Request,
    context: RouteContext
): Promise<NextResponse> {
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

        // Verify user owns this game
        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Parse request body
        const body: unknown = await request.json();

        // Validate input using Zod schema
        const parsed = createSceneSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Invalid input";
            return NextResponse.json(
                { success: false, error: firstError },
                { status: 400 }
            );
        }

        const { name } = parsed.data;

        // Calculate next orderIndex based on existing scenes count
        const sceneCount = await prisma.gameScene.count({
            where: { gameId: params.id },
        });

        // Create the new scene
        const scene = await prisma.gameScene.create({
            data: {
                gameId: params.id,
                name,
                orderIndex: sceneCount, // New scene goes at the end
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

        return NextResponse.json({ success: true, scene });
    } catch (error) {
        console.error("Failed to create scene:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create scene" },
            { status: 500 }
        );
    }
}
