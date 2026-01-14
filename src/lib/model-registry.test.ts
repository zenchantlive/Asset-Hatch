/**
 * Unit tests for model registry
 */

import {
  CURATED_MODELS,
  getImageGenerationModels,
  getMultimodalModels,
  getChatModels,
  getModelById,
  getDefaultModel,
  modelSupports,
  estimateCost,
  formatCost,
  type RegisteredModel,
} from './model-registry';

describe('model-registry', () => {
  describe('CURATED_MODELS', () => {
    test('contains at least one default model per category', () => {
      const defaultModels = CURATED_MODELS.filter(m => m.isDefault);
      const categoriesWithDefault = new Set(defaultModels.map(m => m.category));

      // Should have defaults for multimodal and chat categories
      expect(categoriesWithDefault.has('multimodal')).toBe(true);
      expect(categoriesWithDefault.has('chat')).toBe(true);
    });

    test('all models have valid provider', () => {
      CURATED_MODELS.forEach(model => {
        expect(['openrouter', 'huggingface']).toContain(model.provider);
      });
    });

    test('all models have required fields', () => {
      CURATED_MODELS.forEach(model => {
        expect(model.id).toBeDefined();
        expect(model.displayName).toBeDefined();
        expect(model.capabilities).toBeDefined();
        expect(model.pricing).toBeDefined();
        expect(model.category).toBeDefined();
        expect(model.source).toBe('curated');
      });
    });

    test('all models have pricing perToken values', () => {
      CURATED_MODELS.forEach(model => {
        expect(typeof model.pricing.promptPerToken).toBe('number');
        expect(typeof model.pricing.completionPerToken).toBe('number');
        expect(model.pricing.promptPerToken).toBeGreaterThanOrEqual(0);
        expect(model.pricing.completionPerToken).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getImageGenerationModels', () => {
    test('returns models with image output capability', () => {
      const imageModels = getImageGenerationModels();

      expect(imageModels.length).toBeGreaterThan(0);
      imageModels.forEach(model => {
        expect(model.capabilities.outputModalities).toContain('image');
      });
    });

    test('excludes deprecated models', () => {
      const imageModels = getImageGenerationModels();
      imageModels.forEach(model => {
        expect(model.deprecated).not.toBe(true);
      });
    });

    test('includes both multimodal and image-gen categories', () => {
      const imageModels = getImageGenerationModels();
      const categories = new Set(imageModels.map(m => m.category));

      expect(categories.has('multimodal')).toBe(true);
      expect(categories.has('image-gen')).toBe(true);
    });
  });

  describe('getMultimodalModels', () => {
    test('returns models with text and image input', () => {
      const multimodalModels = getMultimodalModels();

      expect(multimodalModels.length).toBeGreaterThan(0);
      multimodalModels.forEach(model => {
        expect(model.capabilities.inputModalities).toContain('text');
        expect(model.capabilities.inputModalities).toContain('image');
        expect(model.capabilities.outputModalities).toContain('image');
      });
    });

    test('excludes deprecated models', () => {
      const multimodalModels = getMultimodalModels();
      multimodalModels.forEach(model => {
        expect(model.deprecated).not.toBe(true);
      });
    });

    test('returns only multimodal category', () => {
      const multimodalModels = getMultimodalModels();
      multimodalModels.forEach(model => {
        expect(model.category).toBe('multimodal');
      });
    });
  });

  describe('getChatModels', () => {
    test('returns models with text output', () => {
      const chatModels = getChatModels();

      expect(chatModels.length).toBeGreaterThan(0);
      chatModels.forEach(model => {
        expect(model.capabilities.outputModalities).toContain('text');
      });
    });

    test('excludes deprecated models', () => {
      const chatModels = getChatModels();
      chatModels.forEach(model => {
        expect(model.deprecated).not.toBe(true);
      });
    });

    test('returns only chat category', () => {
      const chatModels = getChatModels();
      chatModels.forEach(model => {
        expect(model.category).toBe('chat');
      });
    });
  });

  describe('getModelById', () => {
    test('finds existing model', () => {
      const model = getModelById('google/gemini-2.5-flash-image');

      expect(model).toBeDefined();
      expect(model?.id).toBe('google/gemini-2.5-flash-image');
    });

    test('returns undefined for non-existent model', () => {
      const model = getModelById('non-existent-model');
      expect(model).toBeUndefined();
    });

    test('finds model with custom model list', () => {
      const customModels: RegisteredModel[] = [
        {
          id: 'custom-model',
          displayName: 'Custom Model',
          provider: 'openrouter',
          capabilities: {
            inputModalities: ['text'],
            outputModalities: ['image'],
          },
          pricing: {
            promptPerToken: 0.001,
            completionPerToken: 0.001,
          },
          category: 'image-gen',
          source: 'curated',
        },
      ];

      const model = getModelById('custom-model', customModels);
      expect(model?.id).toBe('custom-model');
    });
  });

  describe('getDefaultModel', () => {
    test('returns default for multimodal category', () => {
      const model = getDefaultModel('multimodal');
      expect(model.category).toBe('multimodal');
      expect(model.isDefault).toBe(true);
    });

    test('returns default for chat category', () => {
      const model = getDefaultModel('chat');
      expect(model.category).toBe('chat');
      expect(model.isDefault).toBe(true);
    });

    test('returns fallback for category without default', () => {
      const model = getDefaultModel('image-gen');
      expect(model).toBeDefined();
      expect(model.category).toBe('image-gen');
      expect(model.id).toBe('black-forest-labs/flux.2-pro');
    });

    test('uses custom model list', () => {
      const customModels: RegisteredModel[] = [
        {
          id: 'custom-chat',
          displayName: 'Custom Chat',
          provider: 'openrouter',
          capabilities: {
            inputModalities: ['text'],
            outputModalities: ['text'],
          },
          pricing: {
            promptPerToken: 0.001,
            completionPerToken: 0.001,
          },
          category: 'chat',
          isDefault: true,
          source: 'curated',
        },
      ];

      const model = getDefaultModel('chat', customModels);
      expect(model.id).toBe('custom-chat');
    });
  });

  describe('modelSupports', () => {
    test('returns true for supported capabilities', () => {
      const result = modelSupports(
        'google/gemini-2.5-flash-image',
        ['text', 'image'],
        ['image'],
        CURATED_MODELS
      );
      expect(result).toBe(true);
    });

    test('returns false for unsupported input', () => {
      const result = modelSupports(
        'google/gemini-2.5-flash-image',
        ['audio'], // Not supported
        ['image'],
        CURATED_MODELS
      );
      expect(result).toBe(false);
    });

    test('returns true for supported text output', () => {
      const result = modelSupports(
        'google/gemini-2.5-flash-image',
        ['text'],
        ['text'], // Model supports text output
        CURATED_MODELS
      );
      expect(result).toBe(true);
    });

    test('returns false for non-existent model', () => {
      const result = modelSupports(
        'non-existent-model',
        ['text'],
        ['image'],
        CURATED_MODELS
      );
      expect(result).toBe(false);
    });

    test('requires all input modalities', () => {
      // Flux only supports text input, not image
      const result = modelSupports(
        'black-forest-labs/flux.2-pro',
        ['text', 'image'], // Requires both
        ['image'],
        CURATED_MODELS
      );
      expect(result).toBe(false);
    });
  });

  describe('estimateCost', () => {
    test('returns 0 for unknown model', () => {
      const result = estimateCost('unknown-model', 500, 1, CURATED_MODELS);
      expect(result).toBe(0);
    });

    test('calculates cost for known model', () => {
      const result = estimateCost('google/gemini-2.5-flash-image', 500, 1, CURATED_MODELS);
      expect(result).toBeGreaterThan(0);
    });

    test('uses default values', () => {
      const result = estimateCost('google/gemini-2.5-flash-image', undefined, undefined, CURATED_MODELS);
      expect(result).toBeGreaterThan(0);
    });

    test('scales with prompt tokens', () => {
      const lowTokens = estimateCost('google/gemini-2.5-flash-image', 100, 1, CURATED_MODELS);
      const highTokens = estimateCost('google/gemini-2.5-flash-image', 1000, 1, CURATED_MODELS);
      expect(highTokens).toBeGreaterThan(lowTokens);
    });

    test('scales with image count', () => {
      const oneImage = estimateCost('google/gemini-2.5-flash-image', 500, 1, CURATED_MODELS);
      const fourImages = estimateCost('google/gemini-2.5-flash-image', 500, 4, CURATED_MODELS);
      expect(fourImages).toBeGreaterThan(oneImage);
    });
  });

  describe('formatCost', () => {
    test('formats small costs with 4 decimals', () => {
      expect(formatCost(0.0034)).toBe('$0.0034');
    });

    test('formats larger costs with 2 decimals', () => {
      expect(formatCost(0.1)).toBe('$0.10');
    });

    test('adds estimate prefix when specified', () => {
      expect(formatCost(0.0034, true)).toBe('~$0.0034');
    });

    test('handles zero', () => {
      expect(formatCost(0)).toBe('$0.0000');
    });

    test('handles whole numbers', () => {
      expect(formatCost(5)).toBe('$5.00');
    });
  });

  describe('Model Categories', () => {
    test('has multimodal models', () => {
      const multimodalModels = CURATED_MODELS.filter(m => m.category === 'multimodal');
      expect(multimodalModels.length).toBeGreaterThan(0);
    });

    test('has image-gen models', () => {
      const imageGenModels = CURATED_MODELS.filter(m => m.category === 'image-gen');
      expect(imageGenModels.length).toBeGreaterThan(0);
    });

    test('has chat models', () => {
      const chatModels = CURATED_MODELS.filter(m => m.category === 'chat');
      expect(chatModels.length).toBeGreaterThan(0);
    });
  });

  describe('Model Capabilities', () => {
    test('multimodal models have correct capabilities', () => {
      const multimodalModels = CURATED_MODELS.filter(m => m.category === 'multimodal');
      multimodalModels.forEach(model => {
        expect(model.capabilities.inputModalities).toContain('text');
        expect(model.capabilities.inputModalities).toContain('image');
        expect(model.capabilities.outputModalities).toContain('image');
      });
    });

    test('image-gen models have correct capabilities', () => {
      const imageGenModels = CURATED_MODELS.filter(m => m.category === 'image-gen');
      imageGenModels.forEach(model => {
        expect(model.capabilities.inputModalities).toContain('text');
        expect(model.capabilities.outputModalities).toContain('image');
        expect(model.capabilities.outputModalities).not.toContain('text');
      });
    });

    test('chat models have text output', () => {
      const chatModels = CURATED_MODELS.filter(m => m.category === 'chat');
      chatModels.forEach(model => {
        expect(model.capabilities.outputModalities).toContain('text');
      });
    });
  });
});
