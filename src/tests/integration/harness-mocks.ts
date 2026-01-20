import { mock, type Mock } from "bun:test";

/**
 * Unified Integration Test Harness Mocks
 * 
 * This file provides standard mocks for Prisma, Auth, and other external services
 * using Bun's native mocking capabilities to ensure a consistent test environment.
 */

// Generic record type for mock model data
type MockRecord = Record<string, unknown>;

interface MockModel {
    findMany: Mock<() => Promise<MockRecord[]>>;
    findUnique: Mock<() => Promise<MockRecord | null>>;
    findFirst: Mock<() => Promise<MockRecord | null>>;
    create: Mock<(data: MockRecord) => Promise<MockRecord>>;
    update: Mock<(data: MockRecord) => Promise<MockRecord>>;
    upsert: Mock<(data: MockRecord) => Promise<MockRecord>>;
    delete: Mock<() => Promise<MockRecord>>;
    count: Mock<() => Promise<number>>;
    mockReset: () => void;
}

interface PrismaMock {
    project: MockModel;
    user: MockModel;
    memoryFile: MockModel;
    styleAnchor: MockModel;
    generatedAsset: MockModel;
    generationCost: MockModel;
    characterRegistry: MockModel;
    game: MockModel;
    gameScene: MockModel;
    codeVersion: MockModel;
    gameAssetRef: MockModel;
    assetPlacement: MockModel;
    gameChatMessage: MockModel;
    $transaction: Mock<(callback: any) => Promise<any>>;
}

const createMockModel = (): MockModel => ({
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock((data: MockRecord) => Promise.resolve({ id: 'mock-id', ...data })),
    update: mock((data: MockRecord) => Promise.resolve({ id: 'mock-id', ...data })),
    delete: mock(() => Promise.resolve({ id: 'mock-id' })),
    upsert: mock((data: MockRecord) => Promise.resolve({ id: 'mock-id', ...data })),
    count: mock(() => Promise.resolve(0)),
    mockReset: function () {
        this.findUnique.mockReset();
        this.findMany.mockReset();
        this.findFirst.mockReset();
        this.create.mockReset();
        this.update.mockReset();
        this.delete.mockReset();
        this.upsert.mockReset();
        this.count.mockReset();
    }
});

// Primary Prisma Mock
export const prismaMock: PrismaMock = {
    project: createMockModel(),
    user: createMockModel(),
    memoryFile: createMockModel(),
    styleAnchor: createMockModel(),
    generatedAsset: createMockModel(),
    generationCost: createMockModel(),
    characterRegistry: createMockModel(),
    // Hatch Studios models
    game: createMockModel(),
    gameScene: createMockModel(),
    codeVersion: createMockModel(),
    gameAssetRef: createMockModel(),
    assetPlacement: createMockModel(),
    gameChatMessage: createMockModel(),
    $transaction: mock((callback: any) => Promise.resolve(callback(prismaMock))),
};

// Auth Mock - returns session with user object
export const authMock = mock((): Promise<{ user: { id: string; email?: string; name?: string } } | null> =>
    Promise.resolve({ user: { id: 'test-user' } }));

// Style Anchor Generator Mock
export const generateStyleAnchorMock = mock(() => Promise.resolve({
    success: true,
    styleAnchor: { id: 's1' }
}));

// Cost Tracker Mock
export const fetchGenerationCostWithRetryMock = mock((id: string) => Promise.resolve({
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
}));

// AI SDK generateText Mock
export const generateTextMock = mock(() => Promise.resolve({
    text: JSON.stringify({
        style_keywords: "pixel art, retro",
        lighting_keywords: "flat",
        color_notes: "vibrant"
    })
}));

// AI SDK streamText Mock
export const streamTextMock = mock(() => ({
    toUIMessageStreamResponse: mock(() => new Response('stream-ok')),
}));

// OpenRouter provider mock
export const openrouterMock = mock((modelName: string) => `openrouter:${modelName}`);

// Image generation mock
export const generateFluxImageMock = mock(() => Promise.resolve({
    success: true,
    data: {
        url: 'mock-url',
        revised_prompt: 'mock-prompt',
        seed: 123,
        duration_ms: 100
    }
}));

// JSZip Mock
export const jszipMock = {
    file: mock(() => { }),
    generateAsync: mock(() => Promise.resolve(new Blob(['zip-content']))),
};

/**
 * Module Mocking - registers all mocks with Bun's module system
 */

mock.module('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

mock.module('@/auth', () => ({
    auth: authMock,
}));

mock.module('@/lib/style-anchor-generator', () => ({
    generateStyleAnchor: generateStyleAnchorMock,
}));

mock.module('@/lib/cost-tracker', () => ({
    fetchGenerationCostWithRetry: fetchGenerationCostWithRetryMock,
}));

mock.module('ai', () => ({
    generateText: generateTextMock,
    streamText: streamTextMock,
    tool: mock(<T>(config: T) => config),
    convertToModelMessages: mock(<T>(m: T) => m),
    stepCountIs: mock(() => { }),
}));

mock.module('@openrouter/ai-sdk-provider', () => ({
    openrouter: openrouterMock,
}));

mock.module('@/lib/model-registry', () => ({
    getDefaultModel: mock((cat: string) => ({
        id: cat === 'chat' ? 'google/gemini-2.0-flash-exp' : 'google/gemini-2.0-flash-exp',
        pricing: { promptPerToken: 0, completionPerToken: 0 }
    })),
    getModelById: mock((id: string) => ({
        id,
        displayName: id,
        provider: 'openrouter',
        pricing: { promptPerToken: 0, completionPerToken: 0 }
    })),
    estimateCost: mock(() => 0.04),
}));

mock.module('@/lib/prompt-builder', () => ({
    buildAssetPrompt: mock(() => 'test prompt'),
    generateSemanticId: mock(() => 'hero_v1'),
    getCategoryFolder: mock(() => 'characters'),
    calculateGenerationSize: mock(() => ({ width: 512, height: 512 })),
}));

mock.module('@/lib/image-generator', () => ({
    generateFluxImage: generateFluxImageMock,
    base64ToBlob: mock(() => Promise.resolve(new Blob(['image-data']))),
}));

mock.module('@/lib/openrouter-image', () => ({
    generateFluxImage: generateFluxImageMock,
}));

mock.module('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: mock(() => Promise.resolve('mock-base64-image')),
    base64ToBlob: mock(() => Promise.resolve(new Blob(['image-data']))),
}));

mock.module('jszip', () => ({
    default: function () {
        return jszipMock;
    }
}));

mock.module('@/lib/plan-parser', () => ({
    parsePlan: mock(() => [
        { id: 'a1', name: 'Asset 1', category: 'Characters', description: 'Desc' }
    ]),
}));

/**
 * Helper to reset all mocks between tests - restores default implementations
 */
export const resetAllMocks = () => {
    // Reset Prisma model mocks (excluding $transaction which is handled separately)
    Object.entries(prismaMock).forEach(([key, model]) => {
        if (key !== '$transaction' && model.mockReset) {
            model.mockReset();
        }
    });
    
    // Reset $transaction mock
    prismaMock.$transaction.mockReset();
    prismaMock.$transaction.mockImplementation((callback: any) => Promise.resolve(callback(prismaMock)));

    // Reset and restore auth mock
    authMock.mockReset();
    authMock.mockImplementation(() => Promise.resolve({ user: { id: 'test-user' } }));

    // Reset and restore style anchor generator
    generateStyleAnchorMock.mockReset();
    generateStyleAnchorMock.mockImplementation(() => Promise.resolve({
        success: true,
        styleAnchor: { id: 's1' }
    }));

    // Reset and restore cost tracker
    fetchGenerationCostWithRetryMock.mockReset();
    fetchGenerationCostWithRetryMock.mockImplementation((id: string) => Promise.resolve({
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
    }));

    // Reset and restore generateText
    generateTextMock.mockReset();
    generateTextMock.mockImplementation(() => Promise.resolve({
        text: JSON.stringify({
            style_keywords: "pixel art, retro",
            lighting_keywords: "flat",
            color_notes: "vibrant"
        })
    }));

    // Reset and restore streamText
    streamTextMock.mockReset();
    streamTextMock.mockImplementation(() => ({
        toUIMessageStreamResponse: mock(() => new Response('stream-ok')),
    }));

    // Reset and restore openrouter
    openrouterMock.mockReset();
    openrouterMock.mockImplementation((modelName: string) => `openrouter:${modelName}`);

    // Reset and restore image generation
    generateFluxImageMock.mockReset();
    generateFluxImageMock.mockImplementation(() => Promise.resolve({
        success: true,
        data: {
            url: 'mock-url',
            revised_prompt: 'mock-prompt',
            seed: 123,
            duration_ms: 100
        }
    }));

    // Reset JSZip mocks
    jszipMock.file.mockReset();
    jszipMock.generateAsync.mockReset();
    jszipMock.generateAsync.mockImplementation(() => Promise.resolve(new Blob(['zip-content'])));
};
