// -----------------------------------------------------------------------------
// Game Editor Page
// Main editor interface for a game in Hatch Studios
// Phase 4B: Multi-file support - loads GameFile[] on mount
// -----------------------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { StudioProvider } from '@/components/studio/StudioProvider';
import { StudioLayout } from '@/components/studio/StudioLayout';
import type { GameData, GameFileData } from '@/lib/studio/types';

/**
 * Route params for this dynamic page
 */
interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Fetch files for a game from the database
 */
async function fetchGameFiles(gameId: string): Promise<GameFileData[]> {
    const files = await prisma.gameFile.findMany({
        where: { gameId },
        orderBy: { orderIndex: 'asc' },
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

    // Convert Date objects to ISO strings for client
    return files.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
    }));
}

/**
 * Game editor page - main workspace for editing a game
 * Loads both game data and files on the server, passes to client
 */
export default async function GameEditorPage({ params }: PageProps) {
    // Extract game ID from route params
    const { id } = await params;

    // Get current session
    const session = await auth();

    // Redirect to login if not authenticated
    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    // Verify params and session
    console.log('[GameEditorPage] Debug:', {
        id,
        userId: session.user.id,
        hasSession: !!session,
    });

    try {
        // Fetch game with ownership verification
        const game = await prisma.game.findFirst({
            where: {
                id,
                userId: session.user.id,
                deletedAt: null,
            },
            include: {
                scenes: {
                    orderBy: { orderIndex: 'asc' },
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
            console.log('[GameEditorPage] Game not found or access denied');
            notFound();
        }

        // Fetch files for this game (multi-file support)
        const files = await fetchGameFiles(id);

        // Serialize game data for client (convert Dates to ISO strings)
        const serializedGame: GameData = {
            ...game,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
            deletedAt: game.deletedAt?.toISOString() || null,
            scenes: game.scenes.map((scene) => ({
                ...scene,
                gameId: game.id,
                code: '', // Add missing code property
                createdAt: scene.createdAt.toISOString(),
                updatedAt: scene.updatedAt.toISOString(),
            })),
        };

        return (
            <StudioProvider initialGame={serializedGame} initialFiles={files}>
                <StudioLayout gameId={game.id} />
            </StudioProvider>
        );
    } catch (error) {
        console.error('[GameEditorPage] Prisma/Render Error:', error);
        throw error; // Re-throw to show error page
    }
}
