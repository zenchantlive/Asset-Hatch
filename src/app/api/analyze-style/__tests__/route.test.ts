import { NextRequest } from 'next/server';
import { POST } from '../route';
import { generateText } from 'ai';

// Mock the AI SDK and OpenRouter provider
jest.mock('ai', () => ({
    generateText: jest.fn(),
}));

jest.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: jest.fn(),
}));

describe('POST /api/analyze-style', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('successfully analyzes an image and returns JSON analysis', async () => {
        // Mock successful AI response
        (generateText as jest.Mock).mockResolvedValue({
            text: JSON.stringify({
                style_keywords: '16-bit pixel art',
                lighting_keywords: 'flat lighting',
                color_notes: 'vibrant palette',
            }),
        });

        // Create a mock image file
        const file = new File([''], 'test.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', file);

        const request = new NextRequest('http://localhost/api/analyze-style', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis.style_keywords).toBe('16-bit pixel art');
        expect(generateText).toHaveBeenCalled();
    });

    it('returns 400 if no image is provided', async () => {
        const formData = new FormData();
        // No image added

        const request = new NextRequest('http://localhost/api/analyze-style', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('No image file provided');
    });

    it('returns 500 if AI parsing fails', async () => {
        // Mock malformed AI response
        (generateText as jest.Mock).mockResolvedValue({
            text: 'This is not JSON',
        });

        const file = new File([''], 'test.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', file);

        const request = new NextRequest('http://localhost/api/analyze-style', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to parse AI analysis');
    });
});
