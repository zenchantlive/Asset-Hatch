import {
    fetchGenerationCost,
    fetchGenerationCostWithRetry,
    estimateGenerationCost,
    estimateBatchCost,
    formatCostDisplay,
    summarizeCosts,
    GenerationCost
} from '@/lib/cost-tracker';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Cost Tracker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENROUTER_API_KEY = 'test-key';
    });

    describe('fetchGenerationCost', () => {
        const mockGenId = 'gen-123';
        const mockResponse = {
            data: {
                id: mockGenId,
                model: 'google/gemini-2.5-flash-image',
                total_cost: 0.0123,
                native_tokens_prompt: 100,
                native_tokens_completion: 50,
                native_tokens_completion_images: 1,
                generation_time: 450,
                cache_discount: 0.001
            }
        };

        it('should fetch and parse generation cost successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const cost = await fetchGenerationCost(mockGenId);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`id=${mockGenId}`),
                expect.any(Object)
            );

            expect(cost.totalCost).toBe(0.0123);
            expect(cost.tokensCompletionImages).toBe(1);
            expect(cost.generationTimeMs).toBe(450);
            expect(cost.cacheDiscount).toBe(0.001);
        });

        it('should throw error when API key is missing', async () => {
            delete process.env.OPENROUTER_API_KEY;
            await expect(fetchGenerationCost(mockGenId)).rejects.toThrow('OPENROUTER_API_KEY not configured');
        });

        it('should throw error when response is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => 'Not Found'
            });

            await expect(fetchGenerationCost(mockGenId)).rejects.toThrow('Failed to fetch generation cost: 404');
        });
    });

    describe('fetchGenerationCostWithRetry', () => {
        const mockGenId = 'gen-retry';

        it('should retry on failure and eventually succeed', async () => {
            // Mock failure then success
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server Error' })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: { id: mockGenId, total_cost: 0.05 } })
                });

            const result = await fetchGenerationCostWithRetry(mockGenId, 2, 10);

            expect(result.status).toBe('success');
            expect(result.cost?.totalCost).toBe(0.05);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should return error status after all retries fail', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => 'Permanent Failure'
            });

            const result = await fetchGenerationCostWithRetry(mockGenId, 2, 10);

            expect(result.status).toBe('error');
            expect(result.error).toContain('500');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('Estimation & Formatting', () => {
        it('should estimate generation cost correctly', () => {
            // For Gemini 2.5: prompt 0.0001/token, image 0.02
            const estimate = estimateGenerationCost('google/gemini-2.5-flash-image', 1000, 1);
            expect(estimate).toBeCloseTo(0.12);
        });

        it('should estimate batch cost correctly', () => {
            const estimate = estimateBatchCost('google/gemini-2.5-flash-image', 5, 1000);
            expect(estimate).toBeCloseTo(0.60); // 0.12 * 5
        });

        it('should format cost for display', () => {
            expect(formatCostDisplay(0.00123)).toBe('$0.0012');
            expect(formatCostDisplay(0.123)).toBe('$0.12');
            expect(formatCostDisplay(0.0123, { isEstimate: true })).toBe('~$0.0123');
            expect(formatCostDisplay(0.05, { showLabel: true })).toBe('$0.0500 (actual)');
        });
    });

    describe('SummarizeCosts', () => {
        const mockCosts: GenerationCost[] = [
            {
                generationId: 'g1',
                modelId: 'm1',
                totalCost: 0.01,
                tokensPrompt: 100,
                tokensCompletion: 50,
                tokensCompletionImages: 0,
                generationTimeMs: 100,
                fetchedAt: new Date()
            },
            {
                generationId: 'g2',
                modelId: 'm1',
                totalCost: 0.02,
                tokensPrompt: 200,
                tokensCompletion: 100,
                tokensCompletionImages: 1,
                generationTimeMs: 200,
                fetchedAt: new Date()
            },
            {
                generationId: 'g3',
                modelId: 'm2',
                totalCost: 0.05,
                tokensPrompt: 500,
                tokensCompletion: 250,
                tokensCompletionImages: 1,
                generationTimeMs: 500,
                fetchedAt: new Date()
            }
        ];

        it('should calculate correct summary totals', () => {
            const summary = summarizeCosts(mockCosts);

            expect(summary.totalCost).toBe(0.08);
            expect(summary.generationCount).toBe(3);
            expect(summary.averageCostPerGeneration).toBe(0.08 / 3);
            expect(summary.totalTokensPrompt).toBe(800);
            expect(summary.modelBreakdown['m1'].count).toBe(2);
            expect(summary.modelBreakdown['m1'].cost).toBe(0.03);
            expect(summary.modelBreakdown['m2'].cost).toBe(0.05);
        });

        it('should handle empty cost list', () => {
            const summary = summarizeCosts([]);
            expect(summary.totalCost).toBe(0);
            expect(summary.generationCount).toBe(0);
            expect(summary.averageCostPerGeneration).toBe(0);
        });
    });
});
