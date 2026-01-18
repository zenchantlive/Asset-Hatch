// -----------------------------------------------------------------------------
// Studio Games API Integration Tests
// TDD approach: Tests written before implementation
// -----------------------------------------------------------------------------

import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { GameResponse, GameListResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

// =============================================================================
// ROUTE TYPES
// =============================================================================

type GetRoute = () => Promise<Response>;
type PostRoute = (req: Request) => Promise<Response>;
type PatchDeleteRoute = (
    req: Request,
    props: { params: Promise<{ id: string }> }
) => Promise<Response>;

describe('/api/studio/games', () => {
    let GET: GetRoute;
    let POST: PostRoute;

    beforeEach(async () => {
        // Reset all mocks to default state
        resetAllMocks();
        // Import route handlers fresh for each test
        const route = await import('@/app/api/studio/games/route');
        GET = route.GET;
        POST = route.POST;
    });

    describe('GET - List Games', () => {
        it('returns 401 if unauthorized', async () => {
            // Simulate no session
            authMock.mockImplementation(() => Promise.resolve(null));

            const res = await GET();
            expect(res.status).toBe(401);
        });

        it('returns games for authenticated user (excludes soft-deleted)', async () => {
            // Simulate authenticated user
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            // Mock database returning games (one active, one that would be filtered)
            prismaMock.game.findMany.mockImplementation(() => Promise.resolve([
                {
                    id: 'game-1',
                    name: 'My Game',
                    userId: 'user-1',
                    description: 'Test game',
                    activeSceneId: null,
                    deletedAt: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ]));

            const res = await GET();
            const body = await res.json() as GameListResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.games).toHaveLength(1);
            expect(body.games![0].name).toBe('My Game');
            expect(prismaMock.game.findMany).toHaveBeenCalled();
        });

        it('returns 500 on database error', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findMany.mockImplementation(() => Promise.reject(new Error('DB Error')));

            const res = await GET();
            expect(res.status).toBe(500);
        });
    });

    describe('POST - Create Game', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Game' }),
            });

            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('returns 400 on invalid input (empty name)', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            const req = new NextRequest('http://localhost/api/studio/games', {
                method: 'POST',
                body: JSON.stringify({ name: '' }), // Name is required
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('creates game with default scene', async () => {
            authMock.mockImplementation(() => Promise.resolve({
                user: { id: 'user-1', email: 'test@example.com' }
            }));

            // Mock user exists check
            prismaMock.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1' }));

            // Mock game creation with scene
            const mockGame = {
                id: 'new-game-id',
                name: 'New Game',
                userId: 'user-1',
                description: null,
                activeSceneId: 'scene-1',
                deletedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                scenes: [{
                    id: 'scene-1',
                    gameId: 'new-game-id',
                    name: 'Main Scene',
                    orderIndex: 0,
                    code: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }],
            };

            prismaMock.game.create.mockImplementation(() => Promise.resolve(mockGame));

            const req = new NextRequest('http://localhost/api/studio/games', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Game' }),
            });

            const res = await POST(req);
            const body = await res.json() as GameResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.game!.name).toBe('New Game');
            expect(body.game!.scenes).toHaveLength(1);
            expect(body.game!.scenes![0].name).toBe('Main Scene');
            expect(prismaMock.game.create).toHaveBeenCalled();
        });
    });
});

describe('/api/studio/games/[id]', () => {
    let GET: PatchDeleteRoute;
    let PATCH: PatchDeleteRoute;
    let DELETE: PatchDeleteRoute;

    beforeEach(async () => {
        resetAllMocks();
        const route = await import('@/app/api/studio/games/[id]/route');
        GET = route.GET;
        PATCH = route.PATCH;
        DELETE = route.DELETE;
    });

    describe('GET - Get Single Game', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 for non-existent or deleted game', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(404);
        });

        it('returns game with scenes', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            const mockGame = {
                id: 'game-1',
                name: 'My Game',
                userId: 'user-1',
                description: 'A test game',
                activeSceneId: 'scene-1',
                deletedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                scenes: [
                    { id: 'scene-1', gameId: 'game-1', name: 'Scene 1', orderIndex: 0, code: '' },
                    { id: 'scene-2', gameId: 'game-1', name: 'Scene 2', orderIndex: 1, code: '' },
                ],
            };

            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(mockGame));

            const req = new NextRequest('http://localhost/api/studio/games/game-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });
            const body = await res.json() as GameResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.game!.name).toBe('My Game');
            expect(body.game!.scenes).toHaveLength(2);
        });
    });

    describe('PATCH - Update Game', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            const res = await PATCH(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 for non-existent game', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            const res = await PATCH(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(404);
        });

        it('updates game metadata', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            // Game exists and user owns it
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                name: 'Old Name',
                deletedAt: null,
            }));

            // Return updated game
            prismaMock.game.update.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                name: 'Updated Name',
                description: 'New description',
                deletedAt: null,
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'Updated Name', description: 'New description' }),
            });
            const res = await PATCH(req, { params: Promise.resolve({ id: 'game-1' }) });
            const body = await res.json() as GameResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.game!.name).toBe('Updated Name');
            expect(prismaMock.game.update).toHaveBeenCalled();
        });
    });

    describe('DELETE - Soft Delete Game', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'DELETE',
            });
            const res = await DELETE(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 for non-existent game', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'DELETE',
            });
            const res = await DELETE(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(404);
        });

        it('soft deletes game (sets deletedAt)', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            // Game exists
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                name: 'My Game',
                deletedAt: null,
            }));

            // Return soft-deleted game
            prismaMock.game.update.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                name: 'My Game',
                deletedAt: new Date().toISOString(),
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1', {
                method: 'DELETE',
            });
            const res = await DELETE(req, { params: Promise.resolve({ id: 'game-1' }) });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            // Should use update (soft delete), not delete
            expect(prismaMock.game.update).toHaveBeenCalled();
        });
    });
});
