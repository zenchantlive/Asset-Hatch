// -----------------------------------------------------------------------------
// Studio File Version History API Route
// Handles version history for a specific file
// Nested route: /api/studio/games/[id]/files/[fileId]/versions
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for restoring a version
const restoreVersionSchema = z.object({
    versionId: z.string().uuid("Invalid version ID"),
});

// =============================================================================
// ROUTE CONTEXT TYPE
// =============================================================================

interface RouteContext {
    params: Promise<{ id: string; fileId: string }>;
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
// HELPER: Verify File Ownership
// =============================================================================

async function verifyFileOwnership(fileId: string, gameId: string) {
    const file = await prisma.gameFile.findFirst({
        where: {
            id: fileId,
            gameId: gameId,
        },
    });
    return file;
}

// =============================================================================
// GET - Fetch version history for a file
// =============================================================================

export async function GET(
    request: Request,
    context: RouteContext
): Promise<NextResponse> {
    try {
        const params = await context.params;
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

        const file = await verifyFileOwnership(params.fileId, params.id);
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        // Fetch version history for this file by filename
        const versions = await prisma.codeVersion.findMany({
            where: {
                gameId: params.id,
                fileName: file.name,
            },
            orderBy: { createdAt: "desc" },
            take: 50, // Last 50 versions
            select: {
                id: true,
                gameId: true,
                fileName: true,
                code: true,
                description: true,
                trigger: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, versions });
    } catch (error) {
        console.error("Failed to fetch version history:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch version history" },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Restore a file to a previous version
// =============================================================================

export async function POST(
    request: Request,
    context: RouteContext
): Promise<NextResponse> {
    try {
        const params = await context.params;
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

        const file = await verifyFileOwnership(params.fileId, params.id);
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        const body: unknown = await request.json();

        const parsed = restoreVersionSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Invalid input";
            return NextResponse.json(
                { success: false, error: firstError },
                { status: 400 }
            );
        }

        const { versionId } = parsed.data;

        // Find the version to restore
        const versionToRestore = await prisma.codeVersion.findFirst({
            where: {
                id: versionId,
                gameId: params.id,
                fileName: file.name,
            },
        });

        if (!versionToRestore) {
            return NextResponse.json(
                { success: false, error: "Version not found" },
                { status: 404 }
            );
        }

        // Update the file content with the restored version
        await prisma.gameFile.update({
            where: { id: params.fileId },
            data: { content: versionToRestore.code },
        });

        // Create a new version entry to track the restore action
        await prisma.codeVersion.create({
            data: {
                gameId: params.id,
                fileName: file.name,
                code: versionToRestore.code,
                description: `Restored to version from ${new Date(versionToRestore.createdAt).toLocaleString()}`,
                trigger: "restore",
                createdAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to restore version:", error);
        return NextResponse.json(
            { success: false, error: "Failed to restore version" },
            { status: 500 }
        );
    }
}
