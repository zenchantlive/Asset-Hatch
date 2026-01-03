import { prismaMock } from './mocks/prisma';

// Ensure mock is hoisted
jest.mock('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

import { POST } from '@/app/api/style-anchors/route';
import { NextRequest } from 'next/server';
import { GenerateStyleResponse } from './types';

describe('/api/style-anchors', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 if projectId is missing', async () => {
        const req = new NextRequest('http://localhost/api/style-anchors', {
            method: 'POST',
            body: JSON.stringify({ referenceImageBase64DataUrl: 'data:...' })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 if image data is missing', async () => {
        const req = new NextRequest('http://localhost/api/style-anchors', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1' })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('creates a style anchor', async () => {
        prismaMock.styleAnchor.create.mockResolvedValue({ id: 'sa1' });

        const req = new NextRequest('http://localhost/api/style-anchors', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                referenceImageName: 'test.png',
                referenceImageBase64DataUrl: 'data:image/png;base64,YWJj',
                styleKeywords: 'pixel art',
                lightingKeywords: 'bright',
                colorPalette: ['#ffffff'],
                fluxModel: 'black-forest-labs/flux.2-pro'
            })
        });

        const res = await POST(req);
        const body = await res.json() as GenerateStyleResponse & { success: boolean };

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.styleAnchor.id).toBe('sa1');
        expect(prismaMock.styleAnchor.create).toHaveBeenCalled();
    });
});
