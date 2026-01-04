import { mock, type Mock } from "bun:test";

interface MockModel {
    findMany: Mock<() => Promise<unknown[]>>;
    findUnique: Mock<() => Promise<unknown | null>>;
    findFirst: Mock<() => Promise<unknown | null>>;
    create: Mock<(data: unknown) => Promise<unknown>>;
    update: Mock<(data: unknown) => Promise<unknown>>;
    upsert: Mock<(data: unknown) => Promise<unknown>>;
    delete: Mock<() => Promise<unknown>>;
    mockReset: () => void;
}

// Create the mock objects first
export const authMock = mock((): Promise<{ user: { id: string; email?: string; name?: string } } | null> =>
    Promise.resolve({ user: { id: 'test-user' } }));

const createMockModel = (): MockModel => ({
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock((args: unknown) => Promise.resolve({ id: 'mock-id', ...((args as { data: object }).data) })), 
    update: mock((args: unknown) => Promise.resolve({ id: 'mock-id', ...((args as { data: object }).data) })), 
    delete: mock(() => Promise.resolve({ id: 'mock-id' })), 
    upsert: mock((args: unknown) => Promise.resolve({ id: 'mock-id', ...((args as { create: object }).create) })), 
    mockReset: function () {
        this.findUnique.mockReset();
        this.findMany.mockReset();
        this.findFirst.mockReset();
        this.create.mockReset();
        this.update.mockReset();
        this.delete.mockReset();
        this.upsert.mockReset();
    }
});

export const prismaMock = {
    project: createMockModel(),
    user: createMockModel(),
    memoryFile: createMockModel(),
    styleAnchor: createMockModel(),
    generatedAsset: createMockModel(),
    generationCost: createMockModel(),
};

// Mock the modules themselves
mock.module('@/auth', () => ({
    auth: authMock,
}));

mock.module('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

mock.module('@/lib/style-anchor-generator', () => ({
    generateStyleAnchor: mock(() => Promise.resolve({
        styleAnchor: { id: 's1', referenceImageBlob: Buffer.from([]) }
    })),
}));

mock.module('@/lib/cost-tracker', () => ({
    fetchGenerationCostWithRetry: mock((id: string) => Promise.resolve({
        status: 'success',
        cost: {
            generationId: id,
            modelId: 'test-model',
            totalCost: 0.04,
            tokensPrompt: 100,
            tokensCompletion: 50,
            tokensCompletionImages: 1,
            generationTimeMs: 1000,
            cacheDiscount: 0,
            fetchedAt: new Date().toISOString(),
        }
    })),
}));

mock.module('ai', () => ({
    generateText: mock(() => Promise.resolve({
        text: JSON.stringify({
            style_keywords: "pixel art, retro",
            lighting_keywords: "flat",
            color_notes: "vibrant"
        })
    })),
}));

mock.module('@/lib/model-registry', () => ({
    getDefaultModel: mock(() => ({ id: 'google/gemini-2.0-flash-exp' })),
}));

mock.module('@/lib/prompt-builder', () => ({
    generatePrompt: mock(() => 'test prompt'),
    generateSemanticId: mock(() => 'hero_v1'),
    getCategoryFolder: mock(() => 'characters'),
}));

mock.module('@/lib/image-generator', () => ({
    generateFluxImage: mock(() => Promise.resolve({
        success: true,
        data: {
            url: 'mock-url',
            revised_prompt: 'mock-prompt',
            seed: 123,
            duration_ms: 100
        }
    })),
    base64ToBlob: mock(() => Promise.resolve(new Blob(['image-data']))),
}));

/**
 * Helper to reset all mocks between tests
 */
export const resetAllMocks = () => {
    Object.values(prismaMock).forEach((model: MockModel) => {
        model.mockReset();
    });
    authMock.mockReset();
    authMock.mockImplementation(() => Promise.resolve({ user: { id: 'test-user' } }));
};
