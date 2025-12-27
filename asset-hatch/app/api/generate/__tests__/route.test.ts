import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/db';

// Mock the image-utils and prompt-builder
jest.mock('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: jest.fn().mockResolvedValue('mock-base64-image'),
}));

jest.mock('@/lib/prompt-builder', () => ({
    buildAssetPrompt: jest.fn().mockReturnValue('mock-prompt'),
    calculateGenerationSize: jest.fn().mockReturnValue({ width: 512, height: 512 }),
    FLUX_MODELS: {
        'flux-2-dev': { modelId: 'mock-model', costPerImage: 0.1 },
    },
}));

// Mock fetch for OpenRouter API call
global.fetch = jest.fn() as jest.Mock;

describe('POST /api/generate', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // Clear the mock DB before each test
        await db.projects.clear();
        await db.style_anchors.clear();
    });

    it('successfully generates an asset', async () => {
        // 1. Setup mock data in Dexie
        await db.projects.add({
            id: 'p1',
            name: 'Test Project',
            phase: 'planning',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await db.style_anchors.add({
            id: 's1',
            project_id: 'p1',
            reference_image_name: 'ref.png',
            reference_image_blob: new Blob([]),
            style_keywords: 'pixel art',
            lighting_keywords: 'flat',
            color_palette: ['#000000'],
            flux_model: 'flux-2-dev',
            ai_suggested: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        // 2. Mock OpenRouter response
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: [{ b64_json: 'mock-generated-image', seed: 123 }]
                }),
            })
            // Second fetch is for converting base64 to blob in the route
            .mockResolvedValueOnce({
                blob: () => Promise.resolve(new Blob(['image-data'])),
            });

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
        expect(data.asset.id).toBeDefined();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('openrouter.ai'),
            expect.any(Object)
        );
    });

    it('returns 404 if project is not found', async () => {
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
        // Add project but NO style anchor
        await db.projects.add({
            id: 'p1',
            name: 'Test Project',
            phase: 'planning',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

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
