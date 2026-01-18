// -----------------------------------------------------------------------------
// Studio Game Files API Route
// Handles file listing and management for a game (multi-file support)
// Nested route: /api/studio/games/[id]/files
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for creating a new file
const createFileSchema = z.object({
    name: z.string().min(1, "Name is required").regex(/^\w+\.js$/, "Name must be like 'main.js'"),
    content: z.string().optional(),
    orderIndex: z.number().int().optional(),
});

// Schema for updating a file
const updateFileSchema = z.object({
    content: z.string().optional(),
    orderIndex: z.number().int().optional(),
});

// Schema for reordering files
const reorderFilesSchema = z.object({
    fileOrder: z.array(z.string()), // Array of file IDs in new order
});

// =============================================================================
// ROUTE PARAMS TYPE
// =============================================================================

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =============================================================================
// HELPER: Verify Game Ownership
// =============================================================================

async function verifyGameOwnership(gameId: string, userId: string) {
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
// GET - Fetch all files for a game
// =============================================================================

export async function GET(
    request: Request,
    props: RouteParams
): Promise<NextResponse> {
    try {
        const params = await props.params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        // Fetch all files for this game, ordered by orderIndex
        const files = await prisma.gameFile.findMany({
            where: { gameId: params.id },
            orderBy: { orderIndex: "asc" },
            select: {
                id: true,
                gameId: true,
                name: true,
                content: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ success: true, files });
    } catch (error) {
        console.error("Failed to fetch files:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create a new file in the game
// =============================================================================

export async function POST(
    request: Request,
    props: RouteParams
): Promise<NextResponse> {
    try {
        const params = await props.params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const game = await verifyGameOwnership(params.id, session.user.id);
        if (!game) {
            return NextResponse.json(
                { success: false, error: "Game not found" },
                { status: 404 }
            );
        }

        const body: unknown = await request.json();

        const parsed = createFileSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Invalid input";
            return NextResponse.json(
                { success: false, error: firstError },
                { status: 400 }
            );
        }

        const { name, content, orderIndex } = parsed.data;

        // Calculate orderIndex if not provided
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined) {
            const fileCount = await prisma.gameFile.count({
                where: { gameId: params.id },
            });
            finalOrderIndex = fileCount;
        }

        // Create the new file
        const file = await prisma.gameFile.create({
            data: {
                gameId: params.id,
                name,
                content: content || "",
                orderIndex: finalOrderIndex,
            },
            select: {
                id: true,
                gameId: true,
                name: true,
                content: true,
                orderIndex: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ success: true, file });
    } catch (error) {
        console.error("Failed to create file:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create file" },
            { status: 500 }
        );
    }
}
