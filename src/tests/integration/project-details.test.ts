import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { ProjectResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('/api/projects/[id]', () => {
    let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
    let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
    let PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

    beforeEach(async () => {
        resetAllMocks();
        const route = await import('@/app/api/projects/[id]/route');
        GET = route.GET;
        DELETE = route.DELETE;
        PATCH = route.PATCH;
    });

    const params = Promise.resolve({ id: 'p1' });

    describe('GET', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockImplementation(() => Promise.resolve(null));
            const res = await GET(new Request('http://localhost'), { params });
            expect(res.status).toBe(401);
        });

        it('returns 404 if project not found', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve(null));
            const res = await GET(new Request('http://localhost'), { params });
            expect(res.status).toBe(404);
        });

        it('returns project details', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', name: 'Project 1', userId: 'user-1' }));

            const res = await GET(new Request('http://localhost'), { params });
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.project!.id).toBe('p1');
        });
    });

    describe('DELETE', () => {
        it('deletes project', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' }));
            prismaMock.project.delete.mockImplementation(() => Promise.resolve({ id: 'p1' }));

            const res = await DELETE(new Request('http://localhost'), { params });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(prismaMock.project.delete).toHaveBeenCalled();
        });
    });

    describe('PATCH', () => {
        it('updates project phase', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' }));
            prismaMock.project.update.mockImplementation(() => Promise.resolve({ id: 'p1', phase: 'style' }));

            const req = new NextRequest('http://localhost', {
                method: 'PATCH',
                body: JSON.stringify({ phase: 'style' })
            });
            const res = await PATCH(req, { params });
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.project!.phase).toBe('style');
        });

        it('returns 400 on invalid phase', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' }));
            const req = new NextRequest('http://localhost', {
                method: 'PATCH',
                body: JSON.stringify({ phase: 'invalid-phase' })
            });
            const res = await PATCH(req, { params });
            expect(res.status).toBe(400);
        });
    });
});
