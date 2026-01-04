import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { AnalyzeStyleResponse, GenerateStyleResponse, MemoryFileResponse, AssetResponse } from './types';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('Remaining API Endpoints', () => {
    let analyzePOST: any;
    let generateStylePOST: any;
    let generatedAssetsPOST: any;
    let memoryFilesGET: any;
    let memoryFilesPOST: any;
    let assetsGET: any;

    beforeEach(async () => {
        resetAllMocks();

        const analyzeRoute = await import('@/app/api/analyze-style/route');
        analyzePOST = analyzeRoute.POST;

        const generateStyleRoute = await import('@/app/api/generate-style/route');
        generateStylePOST = generateStyleRoute.POST;

        const generatedAssetsRoute = await import('@/app/api/generated-assets/route');
        generatedAssetsPOST = generatedAssetsRoute.POST;

        const memoryFilesRoute = await import('@/app/api/projects/[id]/memory-files/route');
        memoryFilesGET = memoryFilesRoute.GET;
        memoryFilesPOST = memoryFilesRoute.POST;

        const assetsRoute = await import('@/app/api/assets/[id]/route');
        assetsGET = assetsRoute.GET;
    });

    describe('/api/analyze-style', () => {
        it('analyzes an image', async () => {
            const formData = new FormData();
            formData.append('image', new Blob(['img'], { type: 'image/png' }));

            const req = new NextRequest('http://localhost/api/analyze-style', {
                method: 'POST',
                body: formData
            });
            const res = await analyzePOST(req);
            const body = await res.json() as AnalyzeStyleResponse;

            expect(res.status).toBe(200);
            expect(body.analysis.style_keywords).toBe('pixel art, retro');
        });
    });

    describe('/api/generate-style', () => {
        it('generates a style anchor', async () => {
            const req = new NextRequest('http://localhost/api/generate-style', {
                method: 'POST',
                body: JSON.stringify({ projectId: 'p1', prompt: 'test prompt' })
            });
            const res = await generateStylePOST(req);
            const body = await res.json() as GenerateStyleResponse;

            expect(res.status).toBe(200);
            expect(body.styleAnchor.id).toBe('s1');
        });
    });

    describe('/api/generated-assets', () => {
        it('syncs an approved asset', async () => {
            prismaMock.generatedAsset.upsert.mockImplementation(() => Promise.resolve({ id: 'ga1' }));

            const req = new NextRequest('http://localhost/api/generated-assets', {
                method: 'POST',
                body: JSON.stringify({
                    id: 'ga1',
                    projectId: 'p1',
                    assetId: 'a1',
                    imageBlob: 'YWJj',
                })
            });
            const res = await generatedAssetsPOST(req);
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
        });
    });

    describe('/api/projects/[id]/memory-files', () => {
        const params = Promise.resolve({ id: 'p1' });

        it('GET returns memory files', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' }));
            prismaMock.memoryFile.findMany.mockImplementation(() => Promise.resolve([{ id: 'm1', type: 'entities.json' }]));

            const req = new NextRequest('http://localhost/api/projects/p1/memory-files');
            const res = await memoryFilesGET(req, { params });
            const body = await res.json() as MemoryFileResponse;

            expect(res.status).toBe(200);
            expect(body.files).toHaveLength(1);
        });

        it('POST saves a memory file', async () => {
            authMock.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prismaMock.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' }));
            prismaMock.memoryFile.upsert.mockImplementation(() => Promise.resolve({ id: 'm1' }));

            const req = new NextRequest('http://localhost/api/projects/p1/memory-files', {
                method: 'POST',
                body: JSON.stringify({ type: 'entities.json', content: 'test content' })
            });
            const res = await memoryFilesPOST(req, { params });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
        });
    });

    describe('/api/assets/[id]', () => {
        const params = Promise.resolve({ id: 'a1' });

        it('returns asset data', async () => {
            prismaMock.generatedAsset.findUnique.mockImplementation(() => Promise.resolve({
                id: 'a1',
                imageBlob: Buffer.from('abc'),
                promptUsed: 'test prompt',
                metadata: '{}'
            }));

            const req = new NextRequest('http://localhost/api/assets/a1');
            const res = await assetsGET(req, { params });
            const body = await res.json() as AssetResponse;

            expect(res.status).toBe(200);
            expect(body.id).toBe('a1');
        });

        it('returns 404 if not found', async () => {
            prismaMock.generatedAsset.findUnique.mockImplementation(() => Promise.resolve(null));
            const req = new NextRequest('http://localhost/api/assets/a1');
            const res = await assetsGET(req, { params });
            expect(res.status).toBe(404);
        });
    });
});
