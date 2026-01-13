/**
 * Unit tests for Tripo3D API Client
 * 
 * Tests the core client functions with mocked fetch responses.
 */

import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import {
    getTripoApiKey,
    tripoFetch,
    createTripoTask,
    getTripoTaskStatus,
} from './client';

// Store original env value
const originalApiKey = process.env.TRIPO_API_KEY;

describe('Tripo3D Client', () => {
    beforeEach(() => {
        // Set test API key
        process.env.TRIPO_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        // Restore original env
        if (originalApiKey) {
            process.env.TRIPO_API_KEY = originalApiKey;
        } else {
            delete process.env.TRIPO_API_KEY;
        }
    });

    describe('getTripoApiKey', () => {
        test('returns user-provided API key when given', () => {
            // User-provided key should take precedence
            const result = getTripoApiKey('user-key');
            expect(result).toBe('user-key');
        });

        test('returns env API key when no user key provided', () => {
            // Should fall back to env variable
            const result = getTripoApiKey();
            expect(result).toBe('test-api-key');
        });

        test('throws error when no API key available', () => {
            // Remove the env key
            delete process.env.TRIPO_API_KEY;

            // Should throw
            expect(() => getTripoApiKey()).toThrow('TRIPO_API_KEY not configured');
        });
    });

    describe('tripoFetch', () => {
        test('makes authenticated request with correct headers', async () => {
            // Create a mock response
            const mockResponse = {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: { task_id: 'test-task-123' },
                }),
            };

            // Mock global fetch
            const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
                mockResponse as Response
            );

            // Make request
            const result = await tripoFetch<{ task_id: string }>(
                '/test-endpoint',
                { method: 'GET' },
                'test-key'
            );

            // Verify fetch was called with correct URL and headers
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            const [url, options] = fetchSpy.mock.calls[0];
            expect(url).toBe('https://api.tripo3d.ai/v2/openapi/test-endpoint');
            expect(options?.headers).toMatchObject({
                Authorization: 'Bearer test-key',
                'Content-Type': 'application/json',
            });

            // Verify result
            expect(result).toEqual({ task_id: 'test-task-123' });

            // Restore fetch
            fetchSpy.mockRestore();
        });

        test('throws on HTTP error', async () => {
            // Mock error response
            const mockResponse = {
                ok: false,
                status: 401,
                json: async () => ({ error: 'Unauthorized' }),
            };

            const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
                mockResponse as Response
            );

            // Should throw
            await expect(
                tripoFetch('/test', { method: 'GET' }, 'bad-key')
            ).rejects.toThrow('Tripo API error 401');

            fetchSpy.mockRestore();
        });

        test('throws on API error code', async () => {
            // Mock API-level error (code !== 0)
            const mockResponse = {
                ok: true,
                json: async () => ({
                    code: 400,
                    message: 'Invalid prompt',
                }),
            };

            const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
                mockResponse as Response
            );

            await expect(
                tripoFetch('/test', { method: 'GET' }, 'key')
            ).rejects.toThrow('Tripo API error code 400');

            fetchSpy.mockRestore();
        });
    });

    describe('createTripoTask', () => {
        test('creates text_to_model task correctly', async () => {
            // Mock successful task creation
            const mockResponse = {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: {
                        task_id: 'new-task-456',
                        type: 'text_to_model',
                        status: 'queued',
                    },
                }),
            };

            const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
                mockResponse as Response
            );

            // Create task
            const task = await createTripoTask(
                {
                    type: 'text_to_model',
                    prompt: 'A knight in shining armor',
                },
                'test-key'
            );

            // Verify task returned
            expect(task.task_id).toBe('new-task-456');
            expect(task.type).toBe('text_to_model');
            expect(task.status).toBe('queued');

            // Verify POST with correct body
            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.method).toBe('POST');
            const body = JSON.parse(options?.body as string);
            expect(body.type).toBe('text_to_model');
            expect(body.prompt).toBe('A knight in shining armor');

            fetchSpy.mockRestore();
        });
    });

    describe('getTripoTaskStatus', () => {
        test('fetches task status correctly', async () => {
            // Mock status response
            const mockResponse = {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: {
                        task_id: 'task-789',
                        type: 'text_to_model',
                        status: 'success',
                        output: {
                            model: {
                                url: 'https://cdn.tripo3d.ai/model.glb',
                                type: 'glb',
                            },
                        },
                    },
                }),
            };

            const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
                mockResponse as Response
            );

            // Get status
            const task = await getTripoTaskStatus('task-789', 'test-key');

            // Verify result
            expect(task.task_id).toBe('task-789');
            expect(task.status).toBe('success');
            expect(task.output?.model?.url).toBe('https://cdn.tripo3d.ai/model.glb');

            // Verify correct endpoint called
            const [url] = fetchSpy.mock.calls[0];
            expect(url).toBe('https://api.tripo3d.ai/v2/openapi/task/task-789');

            fetchSpy.mockRestore();
        });
    });
});
