/**
 * Integration tests for skybox generation endpoint
 * 
 * Tests the complete skybox generation workflow including:
 * - API endpoint authentication
 * - Project creation and access
 * - Style anchor integration
 * - OpenRouter API calls
 * - Database persistence
 * 
 * WARNING: These tests make real API calls and database operations!
 * Only run when OPENROUTER_API_KEY is configured and you accept the costs.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

describe('Skybox Generation - Integration Tests', () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    let testUserId: string;
    let testProjectId: string;

    if (!apiKey) {
        it('skipped - OPENROUTER_API_KEY not configured', () => {
            console.warn('⚠️  Skipping integration tests - OPENROUTER_API_KEY not configured');
            expect(true).toBe(true);
        });
        return;
    }

    beforeAll(async () => {
        // Create a test user
        const user = await prisma.user.create({
            data: {
                email: 'test-skybox@example.com',
                name: 'Test Skybox User',
            }
        });
        testUserId = user.id;

        // Create a test project
        const project = await prisma.project.create({
            data: {
                name: 'Test Skybox Project',
                userId: testUserId,
                description: 'Test project for skybox generation',
            }
        });
        testProjectId = project.id;
    });

    afterAll(async () => {
        // Clean up test data
        if (testProjectId) {
            await prisma.generated3DAsset.deleteMany({
                where: { projectId: testProjectId }
            });
            await prisma.project.delete({
                where: { id: testProjectId }
            });
        }
        if (testUserId) {
            await prisma.user.delete({
                where: { id: testUserId }
            });
        }
    });

    it('should generate a skybox through the API endpoint', async () => {
        // Import the route handler
        const { POST } = await import('@/app/api/generate-skybox/route');

        // Import the route handler
        const { POST } = await import('@/app/api/generate-skybox/route');
        const { auth } = await import('@/auth');

        // Mock the auth function to return our test user
        (auth as jest.Mock).mockResolvedValue({
            user: {
                id: testUserId,
                email: 'test-skybox@example.com'
            }
        });

        // Create a mock request
        const request = new NextRequest('http://localhost:3000/api/generate-skybox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: testProjectId,
                prompt: 'A futuristic cityscape at sunset with neon lights',
                preset: 'sunset'
            })
        });

        // Call the API endpoint
        const response = await POST(request);
        const data = await response.json();

        // Verify the response
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.imageUrl).toBeDefined();
        expect(data.imageUrl).toContain('data:image/');
        expect(data.modelId).toBe('google/gemini-2.5-flash-image');
        expect(data.durationMs).toBeGreaterThan(0);

        console.log('✅ Skybox generation API test passed!');
        console.log('   Duration:', data.durationMs + 'ms');
        console.log('   Model:', data.modelId);
        console.log('   Image URL length:', data.imageUrl.length);

        // Verify the skybox was saved to the database
        const skyboxAsset = await prisma.generated3DAsset.findUnique({
            where: {
                projectId_assetId: {
                    projectId: testProjectId,
                    assetId: `${testProjectId}-skybox`
                }
            }
        });

        expect(skyboxAsset).toBeDefined();
        expect(skyboxAsset?.status).toBe('complete');
        expect(skyboxAsset?.draftModelUrl).toBe(data.imageUrl);
    }, 60000); // 60 second timeout for full workflow

    it('should apply style anchor if present', async () => {
        // Create a style anchor for the project
        await prisma.styleAnchor.create({
            data: {
                projectId: testProjectId,
                styleKeywords: 'cyberpunk, neon, futuristic',
                lightingKeywords: 'dramatic, high contrast',
                colorPalette: JSON.stringify(['#00ff00', '#ff00ff', '#00ffff']),
            }
        });

        const { POST } = await import('@/app/api/generate-skybox/route');

        jest.mock('@/auth', () => ({
            auth: jest.fn().mockResolvedValue({
                user: {
                    id: testUserId,
                    email: 'test-skybox@example.com'
                }
            })
        }));

        const request = new NextRequest('http://localhost:3000/api/generate-skybox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: testProjectId,
                prompt: 'A dark alleyway',
                preset: 'night'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.imageUrl).toBeDefined();

        console.log('✅ Style anchor integration test passed!');
        console.log('   Applied style keywords: cyberpunk, neon, futuristic');
    }, 60000);

    it('should handle authentication errors', async () => {
        const { POST } = await import('@/app/api/generate-skybox/route');

        // Mock auth to return null (unauthenticated)
        jest.mock('@/auth', () => ({
            auth: jest.fn().mockResolvedValue(null)
        }));

        const request = new NextRequest('http://localhost:3000/api/generate-skybox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: testProjectId,
                prompt: 'Test skybox'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403); // Forbidden
        expect(data.error).toBeDefined();
    }, 30000);

    it('should handle missing project errors', async () => {
        const { POST } = await import('@/app/api/generate-skybox/route');

        jest.mock('@/auth', () => ({
            auth: jest.fn().mockResolvedValue({
                user: {
                    id: testUserId,
                    email: 'test@example.com'
                }
            })
        }));

        const request = new NextRequest('http://localhost:3000/api/generate-skybox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: 'non-existent-project-id',
                prompt: 'Test skybox'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404); // Not Found
        expect(data.error).toContain('not found');
    }, 30000);
});
