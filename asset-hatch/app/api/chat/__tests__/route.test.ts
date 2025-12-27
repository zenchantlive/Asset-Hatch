import { NextRequest } from 'next/server';
import { POST } from '../route';
import { streamText } from 'ai';

// Mock the AI SDK
jest.mock('ai', () => ({
    streamText: jest.fn(),
    tool: jest.fn((config) => config),
    convertToModelMessages: jest.fn((m) => Promise.resolve(m)),
    stepCountIs: jest.fn(),
}));

jest.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: jest.fn(),
}));

describe('POST /api/chat', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('successfully starts a chat stream', async () => {
        // Mock successful stream response
        const mockResult = {
            toUIMessageStreamResponse: jest.fn().mockReturnValue(new Response('stream-data')),
        };
        (streamText as jest.Mock).mockReturnValue(mockResult);

        const request = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello' }],
                qualities: {},
                projectId: 'p1',
            }),
        });

        const response = await POST(request);
        const text = await response.text();

        expect(response.status).toBe(200);
        expect(text).toBe('stream-data');
        expect(streamText).toHaveBeenCalled();
    });

    it('returns 500 if chat processing fails', async () => {
        (streamText as jest.Mock).mockImplementation(() => {
            throw new Error('Chat failed');
        });

        const request = new NextRequest('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [],
                qualities: {},
                projectId: 'p1',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process chat request');
        expect(data.details).toBe('Chat failed');
    });
});
