/**
 * Comprehensive tests for OpenRouter image generation with Gemini models
 * 
 * These tests verify that the openrouter-image.ts module correctly handles
 * various response formats from different models, especially Gemini 2.5 Flash Image
 * which has been causing intermittent "No image data in OpenRouter response" errors.
 * 
 * Based on first principles:
 * 1. Different models return data in different formats
 * 2. Gemini models may return images in message.content instead of message.images
 * 3. The extraction logic must be resilient to all possible formats
 * 4. We need comprehensive fallback mechanisms
 */

import {
    generateFluxImage,
} from './openrouter-image';

// Mock process.env
const originalEnv = process.env;

// Setup global fetch mock
const mockFetch = jest.fn();

describe('OpenRouter Image Generation - Gemini Model Response Formats', () => {
    beforeAll(() => {
        process.env.OPENROUTER_API_KEY = 'test-api-key';
        global.fetch = mockFetch as unknown as typeof fetch;
    });

    afterAll(() => {
        process.env.OPENROUTER_API_KEY = originalEnv.OPENROUTER_API_KEY;
        mockFetch.mockReset();
    });

    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('Gemini 2.5 Flash Image Response Formats', () => {
        test('should handle Gemini response with image_url.url format', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-12345',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Here is your generated skybox image.',
                                images: [
                                    {
                                        index: 0,
                                        type: 'image',
                                        image_url: {
                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                        }
                                    }
                                ]
                            },
                            seed: 12345
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'A futuristic cityscape at sunset'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
            expect(result.generationId).toBe('gen-12345');
            expect(result.seed).toBe(12345);
            expect(result.modelId).toBe('google/gemini-2.5-flash-image');
        });

        test('should handle Gemini response with direct url format', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-67890',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Generated image',
                                images: [
                                    {
                                        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Mountain landscape'
            });

            expect(result.imageUrl).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
        });

        test('should handle response with base64 data field (no prefix)', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-abc123',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Image ready',
                                images: [
                                    {
                                        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Abstract art'
            });

            expect(result.imageUrl).toContain('data:image/png;base64,');
            expect(result.imageUrl).toContain('iVBORw0KGgo');
        });

        test('should handle response with b64_json field', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-def456',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Here is your image',
                                images: [
                                    {
                                        b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Fantasy landscape'
            });

            expect(result.imageUrl).toContain('data:image/png;base64,');
        });

        test('should handle response with image data in message.content as data URL', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-ghi789',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Sci-fi environment'
            });

            expect(result.imageUrl).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==');
        });

        test('should handle response with image data in message.content as array of parts', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-jkl012',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Here is your generated image:'
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Character design'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
        });

        test('should handle response with image in annotations array', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-mno345',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Image generated successfully',
                                annotations: [
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Environment art'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
        });

        test('should handle response with raw base64 string in content', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            // Use a longer base64 string (> 100 chars) to pass the validation check
            const longBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='.repeat(2);

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-pqr678',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: longBase64
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Texture map'
            });

            expect(result.imageUrl).toContain('data:image/png;base64,iVBORw0KGgo');
        });

        test('should handle response with image object containing mime_type', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-stu901',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Your image is ready',
                                images: [
                                    {
                                        image: {
                                            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==',
                                            mime_type: 'image/png'
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Material texture'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
        });

        test('should handle response with image object containing url in nested structure', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-vwx234',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Generated',
                                images: [
                                    {
                                        image: {
                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'UI element'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should throw descriptive error when no image data in any format', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-error123',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'I cannot generate images'
                            }
                        }
                    ]
                })
            });

            await expect(
                generateFluxImage({
                    modelId: 'google/gemini-2.5-flash-image',
                    prompt: 'Generate an image'
                })
            ).rejects.toThrow('No image data in OpenRouter response');
        });

        test('should throw error when message is missing', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-error456',
                    choices: []
                })
            });

            await expect(
                generateFluxImage({
                    modelId: 'google/gemini-2.5-flash-image',
                    prompt: 'Generate an image'
                })
            ).rejects.toThrow('No message in OpenRouter response');
        });

        test('should handle empty images array', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-error789',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'No image generated',
                                images: []
                            }
                        }
                    ]
                })
            });

            await expect(
                generateFluxImage({
                    modelId: 'google/gemini-2.5-flash-image',
                    prompt: 'Generate an image'
                })
            ).rejects.toThrow('No image data in OpenRouter response');
        });

        test('should handle malformed image data', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-error012',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Error',
                                images: [
                                    {
                                        url: 'not-a-valid-data-url'
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            // Should still accept it (it's technically valid, just not a data URL)
            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Generate an image'
            });

            expect(result.imageUrl).toBe('not-a-valid-data-url');
        });
    });

    describe('Integration with Different Models', () => {
        test('should work with Flux models (existing behavior)', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-flux123',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Image generated',
                                images: [
                                    {
                                        image_url: {
                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
                                        }
                                    }
                                ]
                            },
                            seed: 54321
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'black-forest-labs/flux.2-pro',
                prompt: 'High quality render'
            });

            expect(result.imageUrl).toContain('data:image/png;base64');
            expect(result.seed).toBe(54321);
            expect(result.modelId).toBe('black-forest-labs/flux.2-pro');
        });

        test('should work with Gemini 3 Pro Image', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-gemini3pro',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Here is your image:'
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-3-pro-image-preview',
                prompt: 'Premium quality image'
            });

            expect(result.imageUrl).toContain('data:image/jpeg;base64');
            expect(result.modelId).toBe('google/gemini-3-pro-image-preview');
        });
    });

    describe('Cost and Performance Tracking', () => {
        test('should track generation duration', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'gen-timing',
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Image',
                                images: [{ url: 'data:image/png;base64,ABC' }]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Test'
            });

            expect(result.durationMs).toBeDefined();
            expect(typeof result.durationMs).toBe('number');
            expect(result.durationMs).toBeGreaterThanOrEqual(0);
        });

        test('should return generation ID for cost tracking', async () => {
            const { generateFluxImage } = await import('./openrouter-image');

            const testGenerationId = 'gen-cost-tracking-12345';

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: testGenerationId,
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Image',
                                images: [{ url: 'data:image/png;base64,XYZ' }]
                            }
                        }
                    ]
                })
            });

            const result = await generateFluxImage({
                modelId: 'google/gemini-2.5-flash-image',
                prompt: 'Test'
            });

            expect(result.generationId).toBe(testGenerationId);
        });
    });
});
