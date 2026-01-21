import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { ProjectResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('/api/projects', () => {
    let GET: () => Promise<Response>;
    let POST: (req: Request) => Promise<Response>;

    beforeEach(async () => {
        resetAllMocks();
        const route = await import('@/app/api/projects/route');
        GET = route.GET;
        POST = route.POST;
    });

    describe('GET', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));
            const res = await GET();
            expect(res.status).toBe(401);
        });

        it('returns projects for user', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findMany.mockImplementation(() => Promise.resolve([
                { id: 'p1', name: 'Project 1', phase: 'planning' }
            ]));

            const res = await GET();
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.projects).toHaveLength(1);
            expect(prismaMock.project.findMany).toHaveBeenCalled();
        });

        it('returns 500 on database error', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findMany.mockImplementation(() => Promise.reject(new Error('DB Error')));

            const res = await GET();
            expect(res.status).toBe(500);
        });
    });

    describe('POST', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Project' })
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('returns 400 on invalid input', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: '' }) // Name is required
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('creates a new project with game', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1', email: 'test@example.com' } }));
            prismaMock.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1' } as { id: string }));

            // Mock the transaction to return both project and game
            // Mock individual model methods
            prismaMock.project.create.mockImplementation((data) => Promise.resolve({
                id: 'new-project-id',
                name: 'New Project',
                phase: 'assets',
                userId: 'user-1',
                ...data
            }));

            prismaMock.project.update.mockImplementation((data) => Promise.resolve({
                id: 'new-project-id',
                name: 'New Project',
                phase: 'building',
                userId: 'user-1',
                gameId: 'new-game-id',
                ...data
            }));

            prismaMock.game.create.mockImplementation((data) => Promise.resolve({
                id: 'new-game-id',
                name: 'New Project Game',
                phase: 'planning',
                userId: 'user-1',
                projectId: 'new-project-id',
                ...data
            }));

            // The default transaction implementation in resetAllMocks handles the callback correctly
            // by passing the prismaMock itself.

            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Project' })
            });

            const res = await POST(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.projectId).toBe('new-project-id');
            expect(body.gameId).toBe('new-game-id');
            expect(prismaMock.$transaction).toHaveBeenCalled();
        });
    });
});
