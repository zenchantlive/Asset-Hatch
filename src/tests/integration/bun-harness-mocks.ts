import { mock } from 'bun:test';

// Create the mock objects first
export const authMock = mock(() => Promise.resolve({ user: { id: 'test-user' } }));

const createMockModel = () => ({
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock((data: any) => Promise.resolve({ id: 'mock-id', ...data })),
    update: mock((data: any) => Promise.resolve({ id: 'mock-id', ...data })),
    delete: mock(() => Promise.resolve({ id: 'mock-id' })),
    upsert: mock((data: any) => Promise.resolve({ id: 'mock-id', ...data })),
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
    characterRegistry: createMockModel(),
    generationCost: createMockModel(),
};

/**
 * Configure Bun to intercept these modules
 * IMPORTANT: This must be active when the tests run
 */
mock.module('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

mock.module('@/auth', () => ({
    auth: authMock,
    handlers: { GET: mock(), POST: mock() }
}));

mock.module('@/lib/openrouter-image', () => ({
    generateFluxImage: mock(() => Promise.resolve({ imageUrl: 'mock-url', seed: 123, durationMs: 100 })),
}));

mock.module('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: mock(() => Promise.resolve('mock-base64-image')),
    base64ToBlob: mock(() => Promise.resolve(new Blob(['image-data']))),
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

/**
 * Helper to reset all mocks between tests
 */
export const resetAllMocks = () => {
    Object.values(prismaMock).forEach((model: any) => {
        if (model.mockReset) model.mockReset();
    });
    authMock.mockReset();
    authMock.mockImplementation(() => Promise.resolve({ user: { id: 'test-user' } }));
};
