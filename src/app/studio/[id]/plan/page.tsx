// -----------------------------------------------------------------------------
// Game Planning Page
// Initial planning phase for a Hatch Studios game
// User chats with AI to create a game plan (features + files) before building
// -----------------------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GamePlanningLayout } from '@/components/studio/planning/GamePlanningLayout';

/**
 * Route params for this dynamic page
 */
interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Game planning page - create a plan before building
 */
export default async function GamePlanningPage({ params }: PageProps) {
    // Extract game ID from route params
    const { id } = await params;

    // Get current session
    const session = await auth();

    // Redirect to login if not authenticated
    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    // Fetch game with ownership verification
    const game = await prisma.game.findFirst({
        where: {
            id,
            userId: session.user.id,
            deletedAt: null,
        },
        include: {
            plan: true,
            scenes: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
            },
        },
    });

    // Return 404 if game not found or user doesn't own it
    if (!game) {
        notFound();
    }

    // If game already has an accepted plan and is in building phase, redirect to build page
    if (game.plan?.status === 'accepted' && game.phase === 'building') {
        redirect(`/studio/${id}`);
    }

    // Serialize game data for client
    const serializedGame = {
        id: game.id,
        name: game.name,
        description: game.description,
        phase: game.phase,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
        plan: game.plan ? {
            id: game.plan.id,
            content: game.plan.content,
            status: game.plan.status,
            updatedAt: game.plan.updatedAt.toISOString(),
        } : null,
    };

    return <GamePlanningLayout game={serializedGame} />;
}
