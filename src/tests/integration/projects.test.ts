import { GET, POST } from '@/app/api/projects/route';
import { prismaMock } from './mocks/prisma';
import { authMock } from './mocks/auth';
import { NextRequest } from 'next/server';
import { ProjectResponse } from './types';

describe('/api/projects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockResolvedValue(null);
            const res = await GET();
            expect(res.status).toBe(401);
        });

        it('returns projects for user', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findMany.mockResolvedValue([
                { id: 'p1', name: 'Project 1', phase: 'planning' }
            ]);

            const res = await GET();
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.projects).toHaveLength(1);
            expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 'user-1' }
            }));
        });

        it('returns 500 on database error', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findMany.mockRejectedValue(new Error('DB Error'));

            const res = await GET();
            expect(res.status).toBe(500);
        });
    });

    describe('POST', () => {
        it('returns 401 if unauthorized', async () => {
            authMock.mockResolvedValue(null);
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Project' })
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('returns 400 on invalid input', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: '' }) // Name is required
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('creates a new project', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com' } });
            prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prismaMock.project.create.mockResolvedValue({
                id: 'new-id',
                name: 'New Project',
                phase: 'planning',
                userId: 'user-1'
            });

            const req = new NextRequest('http://localhost/api/projects', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Project' })
            });

            const res = await POST(req);
            const body = await res.json() as ProjectResponse;

            expect(res.status).toBe(200);
            expect(body.project!.name).toBe('New Project');
            expect(prismaMock.project.create).toHaveBeenCalled();
        });
    });
});
