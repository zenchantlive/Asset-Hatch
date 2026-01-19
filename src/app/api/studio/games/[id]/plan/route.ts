// -----------------------------------------------------------------------------
// Game Plan API Route
// Handles plan CRUD operations for a game
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/studio/games/[id]/plan
 * Get the plan for a game
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: gameId } = await params;

        // Verify game ownership
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                userId: session.user.id,
                deletedAt: null,
            },
            include: {
                plan: true,
            },
        });

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json({
            plan: game.plan ? {
                id: game.plan.id,
                content: game.plan.content,
                status: game.plan.status,
                createdAt: game.plan.createdAt.toISOString(),
                updatedAt: game.plan.updatedAt.toISOString(),
            } : null,
        });
    } catch (error) {
        console.error('Failed to get plan:', error);
        return NextResponse.json({ error: 'Failed to get plan' }, { status: 500 });
    }
}

/**
 * POST /api/studio/games/[id]/plan
 * Create a new plan for a game
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: gameId } = await params;
        const body = await request.json();
        const { content, status = 'draft' } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Verify game ownership
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                userId: session.user.id,
                deletedAt: null,
            },
        });

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Create plan
        const plan = await prisma.gamePlan.create({
            data: {
                gameId,
                content,
                status,
            },
        });

        return NextResponse.json({
            plan: {
                id: plan.id,
                content: plan.content,
                status: plan.status,
                createdAt: plan.createdAt.toISOString(),
                updatedAt: plan.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to create plan:', error);
        return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }
}

/**
 * PATCH /api/studio/games/[id]/plan
 * Update the plan for a game
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: gameId } = await params;
        const body = await request.json();
        const { content, status } = body;

        // Verify game ownership
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                userId: session.user.id,
                deletedAt: null,
            },
            include: {
                plan: true,
            },
        });

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Build update data
        const updateData: { content?: string; status?: string } = {};
        if (content !== undefined) updateData.content = content;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
        }

        // Upsert plan (create if doesn't exist, update if exists)
        const plan = await prisma.gamePlan.upsert({
            where: { gameId },
            update: updateData,
            create: {
                gameId,
                content: content || '',
                status: status || 'draft',
            },
        });

        return NextResponse.json({
            plan: {
                id: plan.id,
                content: plan.content,
                status: plan.status,
                createdAt: plan.createdAt.toISOString(),
                updatedAt: plan.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to update plan:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}
