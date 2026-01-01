import { POST } from '@/app/api/generate/route';
import { prismaMock } from './mocks/prisma';
import { generateFluxImageMock } from './mocks/openrouter';
import { NextRequest } from 'next/server';
import { GenerateResponse } from './types';

// Mock image utils and prompt builder
jest.mock('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: jest.fn().mockResolvedValue('base64-image'),
}));

jest.mock('@/lib/prompt-builder', () => ({
    buildAssetPrompt: jest.fn().mockReturnValue('mocked-prompt'),
    calculateGenerationSize: jest.fn().mockReturnValue({ width: 1024, height: 1024 }),
}));

describe('/api/generate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 404 if project not found', async () => {
        prismaMock.project.findUnique.mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'non-existent', asset: { id: 'a1', name: 'Asset' } })
        });
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 400 if no style anchor found', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 'p1', name: 'Project' });
        prismaMock.styleAnchor.findFirst.mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1', asset: { id: 'a1', name: 'Asset' } })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('generates an image and saves to database', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 'p1', name: 'Project', baseResolution: '32x32' });
        prismaMock.styleAnchor.findFirst.mockResolvedValue({
            id: 's1',
            referenceImageBlob: Buffer.from('abc'),
            colorPalette: '[]',
            modelKey: 'black-forest-labs/flux.2-pro',
        });
        generateFluxImageMock.mockResolvedValue({
            imageUrl: 'http://cdn/img.png',
            imageBuffer: Buffer.from('generated-img'),
            seed: 123,
            durationMs: 5000
        });
        prismaMock.generatedAsset.create.mockResolvedValue({
            id: 'ga1',
            metadata: '{}'
        });

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
