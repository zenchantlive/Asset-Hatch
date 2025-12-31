import { GET, DELETE, PATCH } from '@/app/api/projects/[id]/route';
import { prismaMock } from './mocks/prisma';
import { authMock } from './mocks/auth';
import { NextRequest } from 'next/server';
import { ProjectResponse } from './types';

describe('/api/projects/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const params = Promise.resolve({ id: 'p1' });

    describe('GET', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockResolvedValue(null);
            const res = await GET(new Request('http://localhost'), { params });
            expect(res.status).toBe(401);
        });

        it('returns 404 if project not found', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue(null);
            const res = await GET(new Request('http://localhost'), { params });
            expect(res.status).toBe(404);
        });

        it('returns project details', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', name: 'Project 1', userId: 'user-1' });

            const res = await GET(new Request('http://localhost'), { params });
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.project!.id).toBe('p1');
        });
    });

    describe('DELETE', () => {
        it('deletes project', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' });
            prismaMock.project.delete.mockResolvedValue({ id: 'p1' });

            const res = await DELETE(new Request('http://localhost'), { params });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(prismaMock.project.delete).toHaveBeenCalledWith({
                where: { id: 'p1' }
            });
        });
    });

    describe('PATCH', () => {
        it('updates project phase', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' });
            prismaMock.project.update.mockResolvedValue({ id: 'p1', phase: 'style' });

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
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' });
            const req = new NextRequest('http://localhost', {
                method: 'PATCH',
                body: JSON.stringify({ phase: 'invalid-phase' })
            });
            const res = await PATCH(req, { params });
            expect(res.status).toBe(400);
        });
    });
});
