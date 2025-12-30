export const generateFluxImageMock = jest.fn();

jest.mock('@/lib/openrouter-image', () => ({
    generateFluxImage: generateFluxImageMock,
    OPENROUTER_FLUX_MODELS: {
        'flux-2-dev': { modelId: 'flux-2-dev-id', costPerImage: 0.01 },
        'flux-2-pro': { modelId: 'flux-2-pro-id', costPerImage: 0.05 },
    },
}));
