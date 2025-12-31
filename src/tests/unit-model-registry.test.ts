import {
    CURATED_MODELS,
    getImageGenerationModels,
    getMultimodalModels,
    getChatModels,
    getModelById,
    getDefaultModel,
    estimateCost,
    discoverModels
} from '@/lib/model-registry';

// Mock fetch for discoverModels
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Model Registry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Queries', () => {
        it('should return curated models by default', () => {
            expect(CURATED_MODELS.length).toBeGreaterThan(0);
            expect(CURATED_MODELS.find(m => m.id === 'google/gemini-2.5-flash-image')).toBeDefined();
        });

        it('should filter image generation models', () => {
            const models = getImageGenerationModels();
            models.forEach(m => {
                expect(m.capabilities.outputModalities).toContain('image');
            });
            expect(models.some(m => m.category === 'multimodal')).toBe(true);
            expect(models.some(m => m.category === 'image-gen')).toBe(true);
        });

        it('should filter multimodal models correctly', () => {
            const models = getMultimodalModels();
            models.forEach(m => {
                expect(m.capabilities.inputModalities).toContain('text');
                expect(m.capabilities.inputModalities).toContain('image');
                expect(m.capabilities.outputModalities).toContain('image');
            });
        });

        it('should filter chat models correctly', () => {
            const models = getChatModels();
            models.forEach(m => {
                expect(m.category).toBe('chat');
            });
        });

        it('should find model by ID', () => {
            const model = getModelById('google/gemini-2.5-flash-image');
            expect(model).toBeDefined();
            expect(model?.displayName).toBe('Gemini 2.5 Flash Image');
        });

        it('should get default model for category', () => {
            const chatDefault = getDefaultModel('chat');
            expect(chatDefault.isDefault).toBe(true);
            expect(chatDefault.category).toBe('chat');

            const multiDefault = getDefaultModel('multimodal');
            expect(multiDefault.isDefault).toBe(true);
            expect(multiDefault.category).toBe('multimodal');
        });
    });

    describe('Cost Estimation', () => {
        it('should estimate cost for Gemini 2.5 Flash Image', () => {
            const cost = estimateCost('google/gemini-2.5-flash-image', 1000, 1);
            // prompt: 1000 * 0.0001 = 0.1
            // image: 1 * 0.02 = 0.02
            // total: 0.12
            expect(cost).toBeCloseTo(0.12);
        });

        it('should estimate cost for Gemini 3 Pro Image', () => {
            const cost = estimateCost('google/gemini-3-pro-image-preview', 1000, 2);
            // prompt: 1000 * 0.00125 = 1.25
            // image: 2 * 0.04 = 0.08
            // total: 1.33
            expect(cost).toBeCloseTo(1.33);
        });

        it('should return 0 for unknown model', () => {
            const cost = estimateCost('non-existent-model');
            expect(cost).toBe(0);
        });
    });

    describe('Auto-Discovery', () => {
        const mockApiResponse = {
            data: [
                {
                    id: 'newly-discovered-model',
                    name: 'Newly Discovered',
                    description: 'A newly discovered test model',
                    architecture: {
                        input_modalities: ['text', 'image'],
                        output_modalities: ['image'],
                        tokenizer: 'test',
                        instruct_type: null
                    },
                    pricing: {
                        prompt: '0.001',
                        completion: '0.002',
                        image: '0.05'
                    }
                },
                {
                    id: 'text-only-model',
                    name: 'Text Only',
                    architecture: {
                        input_modalities: ['text'],
                        output_modalities: ['text']
                    },
                    pricing: {
                        prompt: '0.0001',
                        completion: '0.0002'
                    }
                }
            ]
        };

        it('should discovery and filter models from API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponse
            });

            process.env.OPENROUTER_API_KEY = 'test-key';

            const models = await discoverModels(true); // Force refresh

            // Should find the image model but skip the text-only one
            expect(models.some(m => m.id === 'newly-discovered-model')).toBe(true);
            expect(models.some(m => m.id === 'text-only-model')).toBe(false);

            // Should still include curated models
            expect(models.some(m => m.id === 'google/gemini-2.5-flash-image')).toBe(true);

            const discovered = models.find(m => m.id === 'newly-discovered-model');
            expect(discovered?.source).toBe('discovered');
            expect(discovered?.pricing.perImage).toBe(0.05);
            expect(discovered?.category).toBe('multimodal');
        });

        it('should fall back to curated list on API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const models = await discoverModels(true);
            expect(models).toEqual(CURATED_MODELS);
        });
    });
});
