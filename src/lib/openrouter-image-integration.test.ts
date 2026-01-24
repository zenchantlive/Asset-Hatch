/**
 * Integration tests for OpenRouter image generation with real API calls
 * 
 * These tests make actual API calls to OpenRouter to verify the fix works
 * with real Gemini 2.5 Flash Image model responses.
 * 
 * WARNING: These tests will make real API calls and incur costs!
 * Only run these tests when you have OPENROUTER_API_KEY configured
 * and are prepared to pay for the API calls.
 */

import {
    generateFluxImage,
} from './openrouter-image';

// Mock process.env
const originalEnv = process.env;

describe('OpenRouter Image Generation - Integration Tests (Real API Calls)', () => {
    // Only run these tests if OPENROUTER_API_KEY is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        it('skipped - OPENROUTER_API_KEY not configured', () => {
            console.warn('⚠️  Skipping integration tests - OPENROUTER_API_KEY not configured');
            expect(true).toBe(true);
        });
        return;
    }

    beforeAll(() => {
        // Ensure the API key is available
        if (!process.env.OPENROUTER_API_KEY) {
            process.env.OPENROUTER_API_KEY = apiKey;
        }
    });

    afterAll(() => {
        // Restore original environment
        process.env.OPENROUTER_API_KEY = originalEnv.OPENROUTER_API_KEY;
    });

    it('should generate an image with Gemini 2.5 Flash Image model', async () => {
        // Import the function
        const { generateFluxImage } = await import('./openrouter-image');

        // Make a real API call
        const result = await generateFluxImage({
            modelId: 'google/gemini-2.5-flash-image',
            prompt: 'A simple test image: a red circle on a white background'
        });

        // Verify the result
        expect(result).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.imageUrl).toContain('data:image/');
        expect(result.imageBuffer).toBeInstanceOf(Buffer);
        expect(result.modelId).toBe('google/gemini-2.5-flash-image');
        expect(result.durationMs).toBeGreaterThan(0);
        expect(result.generationId).toBeDefined();

        // Verify the image data is valid
        expect(result.imageUrl.length).toBeGreaterThan(100);
        
        console.log('✅ Integration test passed!');
        console.log('   Duration:', result.durationMs + 'ms');
        console.log('   Generation ID:', result.generationId);
        console.log('   Image URL length:', result.imageUrl.length);
    }, 30000); // 30 second timeout for API call

    it('should generate a skybox-style image', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        const result = await generateFluxImage({
            modelId: 'google/gemini-2.5-flash-image',
            prompt: 'A 360 degree panorama of a futuristic cityscape at sunset, equirectangular projection'
        });

        expect(result).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.imageUrl).toContain('data:image/');
        expect(result.modelId).toBe('google/gemini-2.5-flash-image');
        
        console.log('✅ Skybox generation test passed!');
        console.log('   Duration:', result.durationMs + 'ms');
    }, 30000);

    it('should work with Flux model for comparison', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        const result = await generateFluxImage({
            modelId: 'black-forest-labs/flux.2-pro',
            prompt: 'A simple test image: a blue square'
        });

        expect(result).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.imageUrl).toContain('data:image/');
        expect(result.modelId).toBe('black-forest-labs/flux.2-pro');
        
        console.log('✅ Flux model test passed!');
        console.log('   Duration:', result.durationMs + 'ms');
    }, 30000);

    it('should handle errors gracefully with real API', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        // Test with invalid model to verify error handling
        await expect(
            generateFluxImage({
                modelId: 'invalid/model-name',
                prompt: 'Test image'
            })
        ).rejects.toThrow();
    }, 30000);
});
