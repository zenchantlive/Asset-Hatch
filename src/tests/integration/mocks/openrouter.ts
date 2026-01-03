export const generateFluxImageMock = jest.fn();

// Mock for openrouter-image module
jest.mock('@/lib/openrouter-image', () => ({
    generateFluxImage: generateFluxImageMock,
}));

// Mock for model-registry module
export const getModelByIdMock = jest.fn((id: string) => ({
    id,
    displayName: 'Test Model',
    provider: 'openrouter',
    capabilities: { inputModalities: ['text', 'image'], outputModalities: ['image'] },
    pricing: { promptPerToken: 0, completionPerToken: 0, perImage: 0.02 },
    category: 'multimodal',
}));

export const getDefaultModelMock = jest.fn((cat: string) => ({
    id: cat === 'chat' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash-image',
    displayName: 'Default ' + cat,
    provider: 'openrouter',
    capabilities: cat === 'chat' ?
        { inputModalities: ['text'], outputModalities: ['text'] } :
        { inputModalities: ['text', 'image'], outputModalities: ['image'] },
    pricing: { promptPerToken: 0, completionPerToken: 0, perImage: 0.02 },
    category: cat,
}));

export const estimateCostMock = jest.fn(() => 0.04);

jest.mock('@/lib/model-registry', () => ({
    getModelById: getModelByIdMock,
    getDefaultModel: getDefaultModelMock,
    estimateCost: estimateCostMock,
    getImageGenerationModels: jest.fn(() => [
        {
            id: 'test-model',
            displayName: 'Test Model',
            provider: 'openrouter',
            capabilities: {
                inputModalities: ['text', 'image'],
                outputModalities: ['image'],
            },
            pricing: { promptPerToken: 0, completionPerToken: 0, perImage: 0.02 },
            category: 'multimodal',
            source: 'curated',
        },
    ]),
    CURATED_MODELS: [],
}));
