import { POST as analyzePOST } from '@/app/api/analyze-style/route';
import { POST as generateStylePOST } from '@/app/api/generate-style/route';
import { POST as generatedAssetsPOST } from '@/app/api/generated-assets/route';
import { GET as assetsGET } from '@/app/api/assets/[id]/route';
import { GET as memoryFilesGET, POST as memoryFilesPOST } from '@/app/api/projects/[id]/memory-files/route';
import { prismaMock } from './mocks/prisma';
import { authMock } from './mocks/auth';
import { NextRequest } from 'next/server';
import { AnalyzeStyleResponse, GenerateStyleResponse, MemoryFileResponse, AssetResponse } from './types';

// Mock AI generateText
jest.mock('ai', () => ({
    generateText: jest.fn().mockResolvedValue({
        text: JSON.stringify({
            style_keywords: 'pixel art',
            lighting_keywords: 'soft',
            color_notes: 'vibrant'
        })
    }),
}));

// Mock style-anchor-generator
jest.mock('@/lib/style-anchor-generator', () => ({
    generateStyleAnchor: jest.fn().mockResolvedValue({
        success: true,
        styleAnchor: { id: 'sa1' }
    }),
}));

describe('Remaining API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
            expect(body.analysis.style_keywords).toBe('pixel art');
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
            expect(body.styleAnchor.id).toBe('sa1');
        });
    });

    describe('/api/generated-assets', () => {
        it('syncs an approved asset', async () => {
            prismaMock.generatedAsset.upsert.mockResolvedValue({ id: 'ga1' });

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
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' });
            prismaMock.memoryFile.findMany.mockResolvedValue([{ id: 'm1', type: 'entities.json' }]);

            const req = new NextRequest('http://localhost/api/projects/p1/memory-files');
            const res = await memoryFilesGET(req, { params });
            const body = await res.json() as MemoryFileResponse;

            expect(res.status).toBe(200);
            expect(body.files).toHaveLength(1);
        });

        it('POST saves a memory file', async () => {
            authMock.mockResolvedValue({ user: { id: 'user-1' } });
            prismaMock.project.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' });
            prismaMock.memoryFile.upsert.mockResolvedValue({ id: 'm1' });

            const req = new NextRequest('http://localhost/api/projects/p1/memory-files', {
                method: 'POST',
                body: JSON.stringify({ type: 'entities.json', content: 'test content' })
            });
            const res = await memoryFilesPOST(req, { params });
            const body = await res.json() as { success: boolean };

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
        });
        describe('/api/assets/[id]', () => {
            const params = Promise.resolve({ id: 'a1' });

            it('returns asset data', async () => {
                prismaMock.generatedAsset.findUnique.mockResolvedValue({
                    id: 'a1',
                    imageBlob: Buffer.from('abc'),
                    promptUsed: 'test prompt',
                    metadata: '{}'
                });

                const req = new NextRequest('http://localhost/api/assets/a1');
                const res = await assetsGET(req, { params });
                const body = await res.json() as AssetResponse;

                expect(res.status).toBe(200);
                expect(body.id).toBe('a1');
            });

            it('returns 404 if not found', async () => {
                prismaMock.generatedAsset.findUnique.mockResolvedValue(null);
                const req = new NextRequest('http://localhost/api/assets/a1');
                const res = await assetsGET(req, { params });
                expect(res.status).toBe(404);
            });
        });
    });
});
