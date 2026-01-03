import { POST } from '@/app/api/chat/route';
import { prismaMock } from './mocks/prisma';
import { NextRequest } from 'next/server';

// Mock AI SDK
jest.mock('ai', () => ({
    streamText: jest.fn().mockReturnValue({
        toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response('stream-ok')),
    }),
    tool: jest.fn((config) => config),
    convertToModelMessages: jest.fn((m) => m),
    stepCountIs: jest.fn(),
}));

jest.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: jest.fn(),
}));

describe('/api/chat', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
        prismaMock.project.findUnique.mockResolvedValue(null);
        prismaMock.project.create.mockResolvedValue({ id: 'p1' });

        const req = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [], qualities: {}, projectId: 'p1' })
        });
        await POST(req);

        expect(prismaMock.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
        expect(prismaMock.project.create).toHaveBeenCalled();
    });

    it('returns a stream response', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 'p1' });

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
