// -----------------------------------------------------------------------------
// Studio Games API Route
// Handles game listing and creation for Hatch Studios
// Following patterns from /api/projects/route.ts
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

// Schema for creating a new game
const createGameSchema = z.object({
    // Game name is required, must be at least 1 character
    name: z.string().min(1, "Name is required"),
    // Optional description for the game
    description: z.string().optional(),
});

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface GameData {
    id: string;
    name: string;
    userId: string;
    description: string | null;
    activeSceneId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    scenes?: Array<{
        id: string;
        name: string;
        orderIndex: number;
        code: string;
    }>;
}

interface GameResponse {
    success: boolean;
    game?: GameData;
    error?: string;
}

interface GameListResponse {
    success: boolean;
    games?: GameData[];
    error?: string;
}

// =============================================================================
// GET - Fetch all games for the authenticated user
// =============================================================================

export async function GET(): Promise<NextResponse<GameListResponse>> {
    try {
        // Get current session for user authentication
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user's games, excluding soft-deleted ones
        const games = await prisma.game.findMany({
            where: {
                userId: session.user.id,
                deletedAt: null, // Exclude soft-deleted games
            },
            orderBy: { updatedAt: "desc" }, // Most recently updated first
            select: {
                id: true,
                name: true,
                userId: true,
                description: true,
                activeSceneId: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
            },
        });

        return NextResponse.json({ success: true, games });
    } catch (error) {
        console.error("Failed to fetch games:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch games" },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create a new game with default scene and initial main.js file
// =============================================================================

// Default main.js content for new games
const DEFAULT_MAIN_JS = `// Hatch Studios - Babylon.js Scene
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Camera
const camera = new BABYLON.ArcRotateCamera(
  'camera',
  0,
  Math.PI / 3,
  10,
  BABYLON.Vector3.Zero(),
  scene
);
camera.attachControl(canvas, true);

// Light
const light = new BABYLON.HemisphericLight(
  'light',
  new BABYLON.Vector3(0, 1, 0),
  scene
);
light.intensity = 0.7;

// Create a simple box
const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);
box.position.y = 1;

// Add rotation animation
scene.registerBeforeRender(() => {
  box.rotation.y += 0.01;
});

// Render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});
`;

export async function POST(
    request: Request
): Promise<NextResponse<GameResponse>> {
    try {
        // Get current session for user authentication
        const session = await auth();

        // Return 401 if no valid session
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body: unknown = await request.json();

        // Validate input using Zod schema
        const parsed = createGameSchema.safeParse(body);
        if (!parsed.success) {
            // Return first validation error
            const firstError = parsed.error.issues[0]?.message || "Invalid input";
            return NextResponse.json(
                { success: false, error: firstError },
                { status: 400 }
            );
        }

        const { name, description } = parsed.data;
        const userId = session.user.id;
        const userEmail = session.user.email;

        // Verify user exists in DB to prevent Foreign Key errors (P2003)
        // This handles cases where the DB was reset but the user has a valid session cookie
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        // Re-create user if they don't exist (stale session scenario)
        if (!existingUser) {
            console.log(`User not found in DB (stale session?). Re-creating user.`);
            if (userEmail) {
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

        // Create game with a default "Main Scene" and initial main.js file using a transaction
        // This ensures game, scene, and file are created atomically
        const game = await prisma.game.create({
            data: {
                name,
                description: description || null,
                userId: userId,
                // Create default scene inline (legacy, for backwards compatibility)
                scenes: {
                    create: {
                        name: "Main Scene",
                        orderIndex: 0,
                        code: "", // Empty code - multi-file uses GameFile table
                    },
                },
                // Create initial main.js file for multi-file support
                files: {
                    create: {
                        name: "main.js",
                        content: DEFAULT_MAIN_JS,
                        orderIndex: 0,
                    },
                },
            },
            include: {
                scenes: {
                    select: {
                        id: true,
                        name: true,
                        orderIndex: true,
                        code: true,
                    },
                },
            },
        });

        // Set the active scene to the newly created default scene
        const updatedGame = await prisma.game.update({
            where: { id: game.id },
            data: { activeSceneId: game.scenes[0]?.id ?? null },
            include: {
                scenes: {
                    select: {
                        id: true,
                        name: true,
                        orderIndex: true,
                        code: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            game: updatedGame,
        });
    } catch (error) {
        console.error("Failed to create game:", error);
        // Log specifics if it's a Prisma error
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error("Prisma Error Code:", error.code);
            console.error("Prisma Error Message:", error.message);
        }
        // Return generic error - do NOT expose internal details to client
        return NextResponse.json(
            { success: false, error: "Failed to create game" },
            { status: 500 }
        );
    }
}
