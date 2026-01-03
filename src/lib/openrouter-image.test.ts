import type { FluxGenerationOptions } from './openrouter-image';

// Mock process.env
const originalEnv = process.env;

// Setup global fetch mock
const mockFetch = jest.fn();

describe('openrouter-image', () => {
    beforeAll(() => {
        global.fetch = mockFetch as unknown as typeof fetch;
    });

    afterAll(() => {
        process.env = originalEnv;
        mockFetch.mockRestore();
    });

    // Dynamic import to avoid load-time issues if we needed to mock modules, 
    // though for this file it should be fine.
    // importing here to ensure mocks are active if there were top-level side effects (unlikely here)

    test('generateFluxImage successfully returns image data', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        // Mock successful API response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
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
                        seed: 12345
                    }
                ]
            })
        });

        const options: FluxGenerationOptions = {
            modelId: 'black-forest-labs/flux.2-pro',
            prompt: 'test prompt',
            width: 1024,
            height: 1024
        };

        const result = await generateFluxImage(options);

        expect(result.imageUrl).toContain('data:image/png;base64');
        expect(result.seed).toBe(12345);
        expect(result.imageBuffer).toBeInstanceOf(Buffer);

        // safe check for call arguments
        const calls = mockFetch.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const [url, requestInit] = calls[calls.length - 1];

        expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
        expect(requestInit.method).toBe('POST');
        const body = JSON.parse(requestInit.body);
        expect(body.model).toBe('black-forest-labs/flux.2-pro');
        expect(body.modalities).toEqual(['image', 'text']);
        expect(body.messages[0].content).toBe('test prompt');
    });

    test('generateFluxImage handles different response formats', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        // Test direct url format
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            images: [{ url: 'data:image/png;base64,DATA' }]
                        }
                    }
                ]
            })
        });

        const result = await generateFluxImage({ modelId: 'm', prompt: 'p' });
        expect(result.imageUrl).toBe('data:image/png;base64,DATA');
    });

    test('generateFluxImage throws on missing API key', async () => {
        process.env.OPENROUTER_API_KEY = '';
        // Re-import might not reset module state if already loaded, but the function checks env var at runtime
        const { generateFluxImage } = await import('./openrouter-image');

        // We expect it to throw
        expect(generateFluxImage({ modelId: 'm', prompt: 'p' })).rejects.toThrow('OPENROUTER_API_KEY not configured');

        // Restore key
        process.env.OPENROUTER_API_KEY = 'test-key';
    });

    test('generateFluxImage throws on API error', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Bad Request' })
        });

        expect(generateFluxImage({ modelId: 'm', prompt: 'p' })).rejects.toThrow('OpenRouter error 400');
    });

    test('generateFluxImage includes reference image if provided', async () => {
        const { generateFluxImage } = await import('./openrouter-image');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { images: [{ url: 'data:image/png;base64,DATA' }] } }]
            })
        });

        await generateFluxImage({
            modelId: 'm',
            prompt: 'p',
            referenceImageBase64: 'data:image/png;base64,REF_DATA'
        });

        const calls = mockFetch.mock.calls;
        const body = JSON.parse(calls[calls.length - 1][1].body);

        expect(body.images).toBeDefined();
        expect(body.images[0].data).toBe('REF_DATA');
    });
});
