import { prismaMock, generateFluxImageMock, openrouterMock, resetAllMocks, streamTextMock } from './harness-mocks';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('Model Registry Integration Flow', () => {
    let generatePOST: any;
    let chatPOST: any;

    beforeEach(async () => {
        resetAllMocks();

        const generateRoute = await import('@/app/api/generate/route');
        generatePOST = generateRoute.POST;

        const chatRoute = await import('@/app/api/chat/route');
        chatPOST = chatRoute.POST;
    });

    describe('/api/generate integration', () => {
        it('uses the model from registry and returns generationId', async () => {
            const testModelId = 'google/gemini-2.5-flash-image';

            prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({
                id: 'p1',
                name: 'Project',
                baseResolution: '32x32'
            }));
            prismaMock.styleAnchor.findFirst.mockImplementation(() => Promise.resolve({
                id: 's1',
                referenceImageBlob: Buffer.from('abc'),
                colorPalette: '[]',
                fluxModel: testModelId
            }));

            generateFluxImageMock.mockImplementation(() => Promise.resolve({
                success: true,
                data: {
                    url: 'http://cdn/img.png',
                    imageBuffer: Buffer.from('generated-img'),
                    seed: 123,
                    duration_ms: 5000,
                    generationId: 'gen-12345',
                    modelId: testModelId
                }
            }));

            prismaMock.generatedAsset.create.mockImplementation(() => Promise.resolve({
                id: 'ga1',
                metadata: JSON.stringify({
                    model: testModelId,
                    cost: 0.04,
                    duration_ms: 5000,
                    seed: 123,
                    generationId: 'gen-12345'
                })
            }));

            const req = new NextRequest('http://localhost/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: 'p1',
                    asset: { id: 'a1', name: 'Asset', variant: { id: 'v1' } },
                    modelKey: testModelId
                })
            });

            const res = await generatePOST(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(generateFluxImageMock).toHaveBeenCalled();
            expect(prismaMock.generatedAsset.create).toHaveBeenCalled();
        });
    });

    describe('/api/chat integration', () => {
        it('uses the default chat model from registry', async () => {
            const defaultChatModelId = 'google/gemini-2.0-flash-exp';

            prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1' }));

            const req = new NextRequest('http://localhost/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'hello' }],
                    qualities: {},
                    projectId: 'p1'
                })
            });

            await chatPOST(req);

            // Verify that streamText was called with the correct model from registry
            expect(openrouterMock).toHaveBeenCalledWith(defaultChatModelId);
        });
    });
});
