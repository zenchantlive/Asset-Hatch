import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        styleAnchor: {
            findFirst: jest.fn(),
        },
        characterRegistry: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        generatedAsset: {
            create: jest.fn(),
        },
        memoryFile: {
            upsert: jest.fn(),
        },
    },
}));

// Mock the image-utils and prompt-builder
jest.mock('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: jest.fn().mockResolvedValue('mock-base64-image'),
    base64ToBlob: jest.fn().mockResolvedValue(new Blob(['image-data'])),
}));

jest.mock('@/lib/prompt-builder', () => ({
    buildAssetPrompt: jest.fn().mockReturnValue('mock-prompt'),
    calculateGenerationSize: jest.fn().mockReturnValue({ width: 512, height: 512 }),
    FLUX_MODELS: {
        'flux-2-dev': { modelId: 'mock-model', costPerImage: 0.1 },
    },
}));

// Mock fetch for OpenRouter API call
global.fetch = jest.fn() as unknown as typeof fetch;

describe('POST /api/generate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('successfully generates an asset', async () => {
        // 1. Setup mock data in Prisma mocks
        const mockProject = {
            id: 'p1',
            name: 'Test Project',
            phase: 'planning',
            baseResolution: '32x32',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const mockStyleAnchor = {
            id: 's1',
            projectId: 'p1',
            referenceImageName: 'ref.png',
            referenceImageBlob: Buffer.from([]),
            referenceImageBase64: 'mock-base64',
            styleKeywords: 'pixel art',
            lightingKeywords: 'flat',
            colorPalette: JSON.stringify(['#000000']),
            fluxModel: 'flux-2-dev',
            aiSuggested: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.styleAnchor.findFirst as jest.Mock).mockResolvedValue(mockStyleAnchor);
        (prisma.generatedAsset.create as jest.Mock).mockResolvedValue({ id: 'g1', metadata: '{}' });

        // 2. Mock OpenRouter response
        (global.fetch as jest.MockedFunction<typeof fetch>)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: [{ b64_json: 'mock-generated-image', seed: 123 }]
                }),
            } as Response);

        const request = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                asset: { id: 'a1', name: 'Hero', variant: { id: 'v1' } },
                modelKey: 'flux-2-dev',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.asset.id).toBe('g1');
        expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
        expect(prisma.generatedAsset.create).toHaveBeenCalled();
    });

    it('returns 404 if project is not found', async () => {
        (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'non-existent',
                asset: { id: 'a1', name: 'Hero', variant: { id: 'v1' } },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Project not found');
    });

    it('returns 400 if no style anchor is found', async () => {
        (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
        (prisma.styleAnchor.findFirst as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                asset: { id: 'a1', name: 'Hero', variant: { id: 'v1' } },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('No style anchor found');
    });
});
