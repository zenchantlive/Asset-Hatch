import { generateFluxImageMock, getModelByIdMock, getDefaultModelMock } from './mocks/openrouter';
import { prismaMock } from './mocks/prisma';

// Re-mock prisma here to ensure it's hoisted in this file context
// This MUST come before any imports that use prisma
jest.mock('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

// Now import the routes and other things that depend on prisma
import { POST as generatePOST } from '@/app/api/generate/route';
import { POST as chatPOST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

// Mock image utils and prompt builder
jest.mock('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: jest.fn().mockResolvedValue('base64-image'),
}));

jest.mock('@/lib/prompt-builder', () => ({
    buildAssetPrompt: jest.fn().mockReturnValue('mocked-prompt'),
    calculateGenerationSize: jest.fn().mockReturnValue({ width: 1024, height: 1024 }),
}));

// Mock AI SDK streamText specifically for this test to check model usage
jest.mock('ai', () => ({
    streamText: jest.fn().mockReturnValue({
        toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response('stream-ok')),
    }),
    tool: jest.fn((config) => config),
    convertToModelMessages: jest.fn((m) => m),
    stepCountIs: jest.fn(),
}));

jest.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: jest.fn((modelName) => `openrouter:${modelName}`),
}));

describe('Model Registry Integration Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up default mock return values for registry
        getModelByIdMock.mockImplementation((id: string) => ({
            id,
            displayName: 'Test Model',
            provider: 'openrouter',
            capabilities: { inputModalities: ['text', 'image'], outputModalities: ['image'] },
            pricing: { promptPerToken: 0, completionPerToken: 0, perImage: 0.04 },
            category: 'multimodal'
        }));

        getDefaultModelMock.mockImplementation((cat: string) => ({
            id: cat === 'chat' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash-image',
            displayName: 'Default ' + cat,
            provider: 'openrouter',
            capabilities: cat === 'chat' ?
                { inputModalities: ['text'], outputModalities: ['text'] } :
                { inputModalities: ['text', 'image'], outputModalities: ['image'] },
            pricing: { promptPerToken: 0, completionPerToken: 0, perImage: 0.15 },
            category: cat
        }));
    });

    describe('/api/generate integration', () => {
        it('uses the model from registry and returns generationId', async () => {
            const testModelId = 'google/gemini-2.5-flash-image';

            prismaMock.project.findUnique.mockResolvedValue({
                id: 'p1',
                name: 'Project',
                baseResolution: '32x32'
            });
            prismaMock.styleAnchor.findFirst.mockResolvedValue({
                id: 's1',
                referenceImageBlob: Buffer.from('abc'),
                colorPalette: '[]',
                fluxModel: testModelId
            });

            generateFluxImageMock.mockResolvedValue({
                imageUrl: 'http://cdn/img.png',
                imageBuffer: Buffer.from('generated-img'),
                seed: 123,
                durationMs: 5000,
                generationId: 'gen-12345',
                modelId: testModelId
            });

            prismaMock.generatedAsset.create.mockResolvedValue({
                id: 'ga1',
                metadata: JSON.stringify({
                    model: testModelId,
                    cost: 0.04,
                    duration_ms: 5000,
                    seed: 123,
                    generationId: 'gen-12345'
                })
            });

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

            if (res.status !== 200) {
                console.log('❌ Test failed with status', res.status, 'body:', body);
            }

            expect(prismaMock.project.findUnique).toHaveBeenCalled();
            expect(prismaMock.styleAnchor.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { projectId: 'p1' }
            }));

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.asset.metadata.generationId).toBe('gen-12345');
            expect(generateFluxImageMock).toHaveBeenCalledWith(expect.objectContaining({
                modelId: testModelId
            }));

            // Verify Prisma save includes generationId
            expect(prismaMock.generatedAsset.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.stringContaining('gen-12345')
                })
            }));
        });
    });

    describe('/api/chat integration', () => {
        it('uses the default chat model from registry', async () => {
            const defaultChatModelId = 'google/gemini-3-pro-preview';

            prismaMock.project.findUnique.mockResolvedValue({ id: 'p1' });

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
            expect(openrouter).toHaveBeenCalledWith(defaultChatModelId);
            expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
                model: `openrouter:${defaultChatModelId}`
            }));
        });
    });
});
