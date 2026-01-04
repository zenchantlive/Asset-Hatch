import { POST } from '@/app/api/chat/route';
import { prismaMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('/api/chat', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    it('returns 400 if projectId is missing', async () => {
        const req = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [], qualities: {} })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('creates project in SQLite if missing', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve(null));
        prismaMock.project.create.mockImplementation(() => Promise.resolve({ id: 'p1' }));

        const req = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [], qualities: {}, projectId: 'p1' })
        });
        await POST(req);

        expect(prismaMock.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
        expect(prismaMock.project.create).toHaveBeenCalled();
    });

    it('returns a stream response', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1' }));

        const req = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [], qualities: {}, projectId: 'p1' })
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBe('stream-ok');
    });
});
