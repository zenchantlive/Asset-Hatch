// -----------------------------------------------------------------------------
// Studio Scenes API Integration Tests
// TDD approach: Tests written before implementation
// -----------------------------------------------------------------------------

import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { SceneResponse, SceneListResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

// =============================================================================
// ROUTE TYPES
// =============================================================================

type ParentRoute = (
    req: Request,
    props: { params: Promise<{ id: string }> }
) => Promise<Response>;

type NestedRoute = (
    req: Request,
    props: { params: Promise<{ id: string; sceneId: string }> }
) => Promise<Response>;

describe('/api/studio/games/[id]/scenes', () => {
    let GET: ParentRoute;
    let POST: ParentRoute;

    beforeEach(async () => {
        // Reset all mocks to default state
        resetAllMocks();
        // Import route handlers fresh for each test
        const route = await import('@/app/api/studio/games/[id]/scenes/route');
        GET = route.GET;
        POST = route.POST;
    });

    describe('GET - List Scenes', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 if game not found', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(404);
        });

        it('returns scenes for authenticated game owner', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            // Mock game exists
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            // Mock scenes list
            prismaMock.gameScene.findMany.mockImplementation(() => Promise.resolve([
                { id: 'scene-1', gameId: 'game-1', name: 'Scene 1', orderIndex: 0 },
                { id: 'scene-2', gameId: 'game-1', name: 'Scene 2', orderIndex: 1 },
            ]));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1' }) });
            const body = await res.json() as SceneListResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.scenes).toHaveLength(2);
        });
    });

    describe('POST - Create Scene', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Scene' }),
            });
            const res = await POST(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 if game not found', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Scene' }),
            });
            const res = await POST(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(404);
        });

        it('returns 400 on invalid input', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes', {
                method: 'POST',
                body: JSON.stringify({ name: '' }), // Empty name
            });
            const res = await POST(req, { params: Promise.resolve({ id: 'game-1' }) });

            expect(res.status).toBe(400);
        });

        it('creates new scene with correct orderIndex', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            // Mock existing scenes count for orderIndex calculation
            prismaMock.gameScene.count.mockImplementation(() => Promise.resolve(2));

            prismaMock.gameScene.create.mockImplementation(() => Promise.resolve({
                id: 'scene-3',
                gameId: 'game-1',
                name: 'New Scene',
                orderIndex: 2,
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Scene' }),
            });
            const res = await POST(req, { params: Promise.resolve({ id: 'game-1' }) });
            const body = await res.json() as SceneResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.scene!.name).toBe('New Scene');
            expect(body.scene!.orderIndex).toBe(2);
        });
    });
});

describe('/api/studio/games/[id]/scenes/[sceneId]', () => {
    let GET: NestedRoute;
    let PATCH: NestedRoute;
    let DELETE: NestedRoute;

    beforeEach(async () => {
        resetAllMocks();
        const route = await import('@/app/api/studio/games/[id]/scenes/[sceneId]/route');
        GET = route.GET;
        PATCH = route.PATCH;
        DELETE = route.DELETE;
    });

    describe('GET - Get Single Scene', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes/scene-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1', sceneId: 'scene-1' }) });

            expect(res.status).toBe(401);
        });

        it('returns 404 if scene not found', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            // Game exists
            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            // Scene doesn't exist
            prismaMock.gameScene.findFirst.mockImplementation(() => Promise.resolve(null));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes/scene-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1', sceneId: 'scene-1' }) });

            expect(res.status).toBe(404);
        });

        it('returns scene data', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            prismaMock.gameScene.findFirst.mockImplementation(() => Promise.resolve({
                id: 'scene-1',
                gameId: 'game-1',
                name: 'Main Scene',
                orderIndex: 0,
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes/scene-1');
            const res = await GET(req, { params: Promise.resolve({ id: 'game-1', sceneId: 'scene-1' }) });
            const body = await res.json() as SceneResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.scene!.name).toBe('Main Scene');
        });
    });

    describe('PATCH - Update Scene', () => {
        it('updates scene name', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            prismaMock.gameScene.findFirst.mockImplementation(() => Promise.resolve({
                id: 'scene-1',
                gameId: 'game-1',
                name: 'Old Name',
                orderIndex: 0,
            }));

            prismaMock.gameScene.update.mockImplementation(() => Promise.resolve({
                id: 'scene-1',
                gameId: 'game-1',
                name: 'New Name',
                orderIndex: 0,
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes/scene-1', {
                method: 'PATCH',
                body: JSON.stringify({ name: 'New Name' }),
            });
            const res = await PATCH(req, { params: Promise.resolve({ id: 'game-1', sceneId: 'scene-1' }) });
            const body = await res.json() as SceneResponse;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.scene!.name).toBe('New Name');
        });
    });

    describe('DELETE - Delete Scene', () => {
        it('deletes scene (hard delete)', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));

            prismaMock.game.findFirst.mockImplementation(() => Promise.resolve({
                id: 'game-1',
                userId: 'user-1',
                deletedAt: null,
            }));

            prismaMock.gameScene.findFirst.mockImplementation(() => Promise.resolve({
                id: 'scene-1',
                gameId: 'game-1',
                name: 'Scene to Delete',
            }));

            prismaMock.gameScene.delete.mockImplementation(() => Promise.resolve({
                id: 'scene-1',
            }));

            const req = new NextRequest('http://localhost/api/studio/games/game-1/scenes/scene-1', {
                method: 'DELETE',
            });
            const res = await DELETE(req, { params: Promise.resolve({ id: 'game-1', sceneId: 'scene-1' }) });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(prismaMock.gameScene.delete).toHaveBeenCalled();
        });
    });
});
