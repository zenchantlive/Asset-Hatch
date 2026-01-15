/**
 * Unit tests for cost tracker utilities
 */

import {
  formatCostDisplay,
  compareCosts,
  summarizeCosts,
  estimateGenerationCost,
  estimateBatchCost,
  type GenerationCost,
} from './cost-tracker';
import { CURATED_MODELS } from './model-registry';

describe('cost-tracker', () => {
  describe('formatCostDisplay', () => {
    test('formats cost without options', () => {
      expect(formatCostDisplay(0.0034)).toBe('$0.0034');
      expect(formatCostDisplay(0.1)).toBe('$0.10');
      expect(formatCostDisplay(1.5)).toBe('$1.50');
    });

    test('uses 4 decimal places for small costs', () => {
      expect(formatCostDisplay(0.0001)).toBe('$0.0001');
      expect(formatCostDisplay(0.05)).toBe('$0.0500');
    });

    test('uses 2 decimal places for larger costs', () => {
      expect(formatCostDisplay(0.1)).toBe('$0.10');
      expect(formatCostDisplay(1)).toBe('$1.00');
      expect(formatCostDisplay(100)).toBe('$100.00');
    });

    test('adds estimate prefix when isEstimate is true', () => {
      expect(formatCostDisplay(0.0034, { isEstimate: true })).toBe('~$0.0034');
      expect(formatCostDisplay(0.1, { isEstimate: true })).toBe('~$0.10');
    });

    test('shows label when showLabel is true', () => {
      expect(formatCostDisplay(0.0034, { showLabel: true })).toBe('$0.0034 (actual)');
      expect(formatCostDisplay(0.0034, { isEstimate: true, showLabel: true })).toBe('~$0.0034 (estimated)');
    });

    test('respects custom precision', () => {
      expect(formatCostDisplay(0.123456, { precision: 6 })).toBe('$0.123456');
      expect(formatCostDisplay(0.1, { precision: 4 })).toBe('$0.1000');
    });

    test('handles zero cost', () => {
      expect(formatCostDisplay(0)).toBe('$0.0000');
    });

    test('handles very large costs', () => {
      expect(formatCostDisplay(1000.5)).toBe('$1000.50');
    });
  });

  describe('compareCosts', () => {
    test('calculates exact match', () => {
      const result = compareCosts(0.01, 0.01);
      expect(result.difference).toBe(0);
      expect(result.percentDiff).toBe(0);
      expect(result.isHigher).toBe(false);
      expect(result.accuracy).toBe('exact');
    });

    test('identifies higher actual cost', () => {
      const result = compareCosts(0.01, 0.012);
      expect(result.difference).toBe(0.002);
      expect(result.percentDiff).toBe(20);
      expect(result.isHigher).toBe(true);
      expect(result.accuracy).toBe('close');
    });

    test('identifies lower actual cost', () => {
      const result = compareCosts(0.01, 0.008);
      expect(result.difference).toBe(-0.002);
      expect(result.percentDiff).toBe(-20);
      expect(result.isHigher).toBe(false);
      expect(result.accuracy).toBe('close');
    });

    test('classifies close accuracy within 20%', () => {
      const result = compareCosts(0.01, 0.011);
      expect(result.accuracy).toBe('close');
    });

    test('classifies off accuracy beyond 20%', () => {
      const result = compareCosts(0.01, 0.015);
      expect(result.accuracy).toBe('off');
    });

    test('handles zero estimated cost', () => {
      const result = compareCosts(0, 0.01);
      expect(result.difference).toBe(0.01);
      expect(result.percentDiff).toBe(Infinity);
      expect(result.accuracy).toBe('off');
    });

    test('handles negative differences', () => {
      const result = compareCosts(0.02, 0.01);
      expect(result.difference).toBe(-0.01);
      expect(result.isHigher).toBe(false);
    });

    test('calculates correct percentage difference', () => {
      const result = compareCosts(0.10, 0.12);
      expect(result.percentDiff).toBeCloseTo(20, 5);
    });
  });

  describe('summarizeCosts', () => {
    test('returns zero values for empty array', () => {
      const result = summarizeCosts([]);
      expect(result.totalCost).toBe(0);
      expect(result.generationCount).toBe(0);
      expect(result.averageCostPerGeneration).toBe(0);
      expect(result.totalTokensPrompt).toBe(0);
      expect(result.totalTokensCompletion).toBe(0);
      expect(result.totalGenerationTimeMs).toBe(0);
      expect(result.modelBreakdown).toEqual({});
    });

    test('aggregates single cost entry', () => {
      const costs: GenerationCost[] = [{
        generationId: 'gen-1',
        modelId: 'test-model',
        totalCost: 0.01,
        tokensPrompt: 100,
        tokensCompletion: 50,
        tokensCompletionImages: 1,
        generationTimeMs: 1000,
        fetchedAt: new Date(),
      }];

      const result = summarizeCosts(costs);

      expect(result.totalCost).toBe(0.01);
      expect(result.generationCount).toBe(1);
      expect(result.averageCostPerGeneration).toBe(0.01);
      expect(result.totalTokensPrompt).toBe(100);
      expect(result.totalTokensCompletion).toBe(50);
      expect(result.totalGenerationTimeMs).toBe(1000);
      expect(result.modelBreakdown['test-model']).toEqual({ count: 1, cost: 0.01 });
    });

    test('aggregates multiple cost entries', () => {
      const costs: GenerationCost[] = [
        {
          generationId: 'gen-1',
          modelId: 'model-a',
          totalCost: 0.01,
          tokensPrompt: 100,
          tokensCompletion: 50,
          tokensCompletionImages: 1,
          generationTimeMs: 1000,
          fetchedAt: new Date(),
        },
        {
          generationId: 'gen-2',
          modelId: 'model-a',
          totalCost: 0.02,
          tokensPrompt: 200,
          tokensCompletion: 100,
          tokensCompletionImages: 1,
          generationTimeMs: 2000,
          fetchedAt: new Date(),
        },
        {
          generationId: 'gen-3',
          modelId: 'model-b',
          totalCost: 0.015,
          tokensPrompt: 150,
          tokensCompletion: 75,
          tokensCompletionImages: 1,
          generationTimeMs: 1500,
          fetchedAt: new Date(),
        },
      ];

      const result = summarizeCosts(costs);

      expect(result.totalCost).toBeCloseTo(0.045, 4);
      expect(result.generationCount).toBe(3);
      expect(result.averageCostPerGeneration).toBeCloseTo(0.015, 4);
      expect(result.totalTokensPrompt).toBe(450);
      expect(result.totalTokensCompletion).toBe(225);
      expect(result.totalGenerationTimeMs).toBe(4500);
      expect(result.modelBreakdown['model-a']).toEqual({ count: 2, cost: 0.03 });
      expect(result.modelBreakdown['model-b']).toEqual({ count: 1, cost: 0.015 });
    });

    test('calculates average correctly', () => {
      const costs: GenerationCost[] = [
        {
          generationId: 'gen-1',
          modelId: 'model-a',
          totalCost: 0.01,
          tokensPrompt: 100,
          tokensCompletion: 50,
          tokensCompletionImages: 1,
          generationTimeMs: 1000,
          fetchedAt: new Date(),
        },
        {
          generationId: 'gen-2',
          modelId: 'model-a',
          totalCost: 0.03,
          tokensPrompt: 100,
          tokensCompletion: 50,
          tokensCompletionImages: 1,
          generationTimeMs: 1000,
          fetchedAt: new Date(),
        },
      ];

      const result = summarizeCosts(costs);

      expect(result.averageCostPerGeneration).toBe(0.02);
    });
  });

  describe('estimateGenerationCost', () => {
    test('returns 0 for unknown model', () => {
      const result = estimateGenerationCost('unknown-model', 500, 1, CURATED_MODELS);
      expect(result).toBe(0);
    });

    test('calculates cost for multimodal model with perImage pricing', () => {
      // google/gemini-2.5-flash-image has perImage: 0.02 and promptPerToken: 0.0001
      const result = estimateGenerationCost('google/gemini-2.5-flash-image', 500, 1, CURATED_MODELS);
      // 500 * 0.0001 + 0.02 = 0.05 + 0.02 = 0.07
      expect(result).toBeCloseTo(0.07, 4);
    });

    test('calculates cost for multiple images', () => {
      // google/gemini-2.5-flash-image has perImage: 0.02
      const result = estimateGenerationCost('google/gemini-2.5-flash-image', 500, 4, CURATED_MODELS);
      // 500 * 0.0001 + (0.02 * 4) = 0.05 + 0.08 = 0.13
      expect(result).toBeCloseTo(0.13, 4);
    });

    test('uses default values for promptTokens and outputImages', () => {
      const result = estimateGenerationCost('google/gemini-2.5-flash-image', undefined, undefined, CURATED_MODELS);
      // 500 * 0.0001 + (0.02 * 1) = 0.05 + 0.02 = 0.07
      expect(result).toBeCloseTo(0.07, 4);
    });

    test('handles model with perRequest pricing', () => {
      // This would test if a model has perRequest set
      const testModels = [...CURATED_MODELS, {
        id: 'test/per-request-model',
        displayName: 'Test Model',
        provider: 'openrouter' as const,
        capabilities: {
          inputModalities: ['text'],
          outputModalities: ['image'],
        },
        pricing: {
          promptPerToken: 0.0001,
          completionPerToken: 0,
          perImage: 0.01,
          perRequest: 0.005,
        },
        category: 'image-gen' as const,
        source: 'curated' as const,
      }];

      const result = estimateGenerationCost('test/per-request-model', 100, 1, testModels);
      // 100 * 0.0001 + 0.01 + 0.005 = 0.01 + 0.01 + 0.005 = 0.025
      expect(result).toBeCloseTo(0.025, 4);
    });

    test('handles model without perImage pricing', () => {
      // Gemini 3 Pro (Chat) doesn't have perImage pricing
      const result = estimateGenerationCost('google/gemini-3-pro-preview', 500, 1, CURATED_MODELS);
      // 500 * 0.00125 = 0.625
      expect(result).toBeCloseTo(0.625, 4);
    });
  });

  describe('estimateBatchCost', () => {
    test('calculates batch cost correctly', () => {
      const result = estimateBatchCost('google/gemini-2.5-flash-image', 10, 500, CURATED_MODELS);
      // 0.07 * 10 = 0.7
      expect(result).toBeCloseTo(0.7, 4);
    });

    test('uses default avgPromptTokens', () => {
      const result = estimateBatchCost('google/gemini-2.5-flash-image', 10, undefined, CURATED_MODELS);
      // 0.07 * 10 = 0.7 (uses default 500 tokens)
      expect(result).toBeCloseTo(0.7, 4);
    });

    test('calculates for single asset', () => {
      const result = estimateBatchCost('google/gemini-2.5-flash-image', 1, 500, CURATED_MODELS);
      expect(result).toBeCloseTo(0.07, 4);
    });

    test('calculates for large batch', () => {
      const result = estimateBatchCost('google/gemini-2.5-flash-image', 100, 500, CURATED_MODELS);
      expect(result).toBeCloseTo(7, 2);
    });

    test('returns 0 for unknown model', () => {
      const result = estimateBatchCost('unknown-model', 10, 500, CURATED_MODELS);
      expect(result).toBe(0);
    });
  });
});
