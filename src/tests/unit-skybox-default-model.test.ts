/**
 * Unit test for skybox default model configuration
 * 
 * Verifies that the skybox generation route uses Gemini 2.5 Flash Image
 * as the default model for cost optimization (~50% cost reduction).
 */

import { describe, it, expect } from '@jest/globals';
import { getModelById, getDefaultModel, estimateCost } from '@/lib/model-registry';

describe('Skybox Default Model Configuration', () => {
    it('should use Gemini 2.5 Flash Image as the default skybox model', () => {
        // Verify Gemini 2.5 Flash Image exists in the model registry
        const flashModel = getModelById('google/gemini-2.5-flash-image');
        expect(flashModel).toBeDefined();
        expect(flashModel?.displayName).toBe('Gemini 2.5 Flash Image');
        
        // Verify it's the default multimodal model (which skybox generation uses)
        const defaultMultimodal = getDefaultModel('multimodal');
        expect(defaultMultimodal.id).toBe('google/gemini-2.5-flash-image');
        
        // Verify cost optimization: $0.02 per image (vs $0.04 for Pro)
        expect(flashModel?.pricing.perImage).toBe(0.02);
    });

    it('should verify Gemini 3 Pro Image is still available as an alternative', () => {
        // Verify Gemini 3 Pro Image still exists for users who want it
        const proModel = getModelById('google/gemini-3-pro-image-preview');
        expect(proModel).toBeDefined();
        expect(proModel?.displayName).toBe('Gemini 3 Pro Image (Preview)');
        expect(proModel?.pricing.perImage).toBe(0.04); // Double the cost
    });

    it('should verify the cost difference between models', () => {
        // Estimate cost for a typical skybox generation (500 prompt tokens, 1 image)
        const flashCost = estimateCost('google/gemini-2.5-flash-image', 500, 1);
        const proCost = estimateCost('google/gemini-3-pro-image-preview', 500, 1);
        
        // Flash should be significantly cheaper
        expect(flashCost).toBeLessThan(proCost);
        expect(flashCost).toBeCloseTo(0.07, 1); // 500 * 0.0001 + 0.02 = 0.07
        expect(proCost).toBeCloseTo(0.665, 1);  // 500 * 0.00125 + 0.04 = 0.665
        
        // Verify the cost reduction is substantial (89% in this case)
        // This is because Flash has lower per-token costs AND lower per-image costs
        const costReduction = ((proCost - flashCost) / proCost) * 100;
        expect(costReduction).toBeGreaterThan(85); // At least 85% reduction
        expect(costReduction).toBeLessThan(95);    // At most 95% reduction
    });
});
