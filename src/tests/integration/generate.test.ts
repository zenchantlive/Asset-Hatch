import { POST } from '@/app/api/generate/route';
import { prismaMock, generateFluxImageMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { GenerateResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('/api/generate', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    it('returns 404 if project not found', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve(null));

        const req = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'non-existent', asset: { id: 'a1', name: 'Asset' } })
        });
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 400 if no style anchor found', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1', name: 'Project' }));
        prismaMock.styleAnchor.findFirst.mockImplementation(() => Promise.resolve(null));

        const req = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1', asset: { id: 'a1', name: 'Asset' } })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('generates an image and saves to database', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1', name: 'Project', baseResolution: '32x32' }));
        prismaMock.styleAnchor.findFirst.mockImplementation(() => Promise.resolve({
            id: 's1',
            referenceImageBlob: Buffer.from('abc'),
            colorPalette: '[]',
            modelKey: 'black-forest-labs/flux.2-pro',
        }));

        generateFluxImageMock.mockImplementation(() => Promise.resolve({
            success: true,
            data: {
                url: 'http://cdn/img.png',
                seed: 123,
                duration_ms: 5000,
                generationId: 'gen-123'
            }
        }));

        prismaMock.generatedAsset.create.mockImplementation(() => Promise.resolve({
            id: 'ga1',
            metadata: '{}'
        }));

        const req = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1', asset: { id: 'a1', name: 'Asset', variant: { id: 'v1' } } })
        });

        const res = await POST(req);
        const body = await res.json() as GenerateResponse;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.asset!.id).toBe('ga1');
        expect(prismaMock.generatedAsset.create).toHaveBeenCalled();
    });
});
