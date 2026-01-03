
import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateStyleAnchor } from './style-anchor-generator';
import { prisma } from '@/lib/prisma';
import { generateFluxImage } from '@/lib/openrouter-image';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findUnique: jest.fn(),
        },
        styleAnchor: {
            create: jest.fn(),
        },
    },
}));

jest.mock('@/lib/openrouter-image', () => ({
    generateFluxImage: jest.fn(),
}));

// Mock model registry to control available models
jest.mock('@/lib/model-registry', () => {
    const originalModule = jest.requireActual('@/lib/model-registry');
    return {
        ...originalModule,
        getModelById: jest.fn((id: string) => {
            // Simulate registry where flux-2-dev is missing but flux-2-pro exists
            if (id === 'black-forest-labs/flux.2-pro') {
                return { id: 'black-forest-labs/flux.2-pro', pricing: { perImage: 0.05 } };
            }
            return undefined;
        }),
        getDefaultModel: jest.fn(() => ({
            id: 'black-forest-labs/flux.2-pro',
            pricing: { perImage: 0.05 }
        })),
    };
});

describe('style-anchor-generator', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementation
        (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', name: 'Test Project' });
        (generateFluxImage as jest.Mock).mockResolvedValue({
            imageUrl: 'http://image.url',
            imageBuffer: Buffer.from('test'),
            seed: 12345,
            durationMs: 1000,
        });

        // Mock style anchor creation
        (prisma.styleAnchor.create as jest.Mock).mockResolvedValue({
            id: 'sa-123',
            referenceImageName: 'test.png'
        });
    });

    test('valid model ID is used directly', async () => {
        await generateStyleAnchor({
            projectId: 'p1',
            prompt: 'test prompt',
            fluxModel: 'black-forest-labs/flux.2-pro',
            styleKeywords: 'test style',
            lightingKeywords: 'test lighting',
            colorPalette: ['#ffffff']
        });

        expect(generateFluxImage).toHaveBeenCalledWith(expect.objectContaining({
            modelId: 'black-forest-labs/flux.2-pro'
        }));
    });

    test('invalid model ID falls back to default', async () => {
        // This simulates the legacy data scenario (flux-2-dev)
        await generateStyleAnchor({
            projectId: 'p1',
            prompt: 'test prompt',
            fluxModel: 'flux-2-dev',
            styleKeywords: 'test style',
            lightingKeywords: 'test lighting',
            colorPalette: []
        });

        // Should fall back to the default model (black-forest-labs/flux.2-pro)
        expect(generateFluxImage).toHaveBeenCalledWith(expect.objectContaining({
            modelId: 'black-forest-labs/flux.2-pro'
        }));
    });

    test('throws if project not found', async () => {
        (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(generateStyleAnchor({
            projectId: 'p1',
            prompt: 'test',
            styleKeywords: '',
            lightingKeywords: '',
            colorPalette: []
        })).rejects.toThrow('Project not found');
    });
});
