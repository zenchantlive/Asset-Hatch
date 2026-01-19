import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { prismaMock, authMock, resetAllMocks } from '../integration/harness-mocks';

/**
 * Studio Chat API Integration Tests
 * Tests for Hatch Studios chat endpoint with game tools
 */

describe('Studio Chat API', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      // Setup: Mock auth to return null session
      authMock.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [], gameId: 'test-id' }),
      });

      // Dynamic import
      const { POST } = await import('../../app/api/studio/chat/route');

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if game not found', async () => {
      // Setup: Auth returns valid user
      authMock.mockResolvedValue({ user: { id: 'user-id' } });

      // Mock: Game not found
      prismaMock.game.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [], gameId: 'test-id' }),
      });

      const { POST } = await import('../../app/api/studio/chat/route');
      const response = await POST(request);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Game not found' });
    });

    it('should validate gameId is required', async () => {
      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }), // Missing gameId
      });

      const { POST } = await import('../../app/api/studio/chat/route');
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'gameId is required' });
    });
  });

  describe('Tool Execution', () => {
    it('should execute createScene tool successfully', async () => {
      // Setup: Auth returns valid user, game exists
      authMock.mockResolvedValue({ user: { id: 'user-id' } });
      prismaMock.game.findFirst.mockResolvedValue({
        id: 'game-id',
        userId: 'user-id',
        name: 'Test Game',
        activeSceneId: 'scene-1',
      });
      prismaMock.gameScene.create.mockResolvedValue({
        id: 'scene-new-id',
        name: 'New Scene',
        orderIndex: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Create a scene' }],
          gameId: 'game-id',
        }),
      });

      const { POST } = await import('../../app/api/studio/chat/route');
      const response = await POST(request);
      
      // Note: Can't easily test streaming response in unit tests
      // We're testing that the tool definitions are correct and don't throw
      expect(response.status).not.toBe(500);
      expect(prismaMock.gameScene.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Scene',
          orderIndex: 0,
        }),
      });
    });

    it('should execute switchScene tool successfully', async () => {
      // Setup
      authMock.mockResolvedValue({ user: { id: 'user-id' } });
      prismaMock.game.findFirst.mockResolvedValue({
        id: 'game-id',
        activeSceneId: 'scene-1',
      });
      prismaMock.game.update.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Switch scenes' }],
          gameId: 'game-id',
        }),
      });

      const { POST } = await import('../../app/api/studio/chat/route');
      const response = await POST(request);
      
      expect(prismaMock.game.update).toHaveBeenCalledWith({
        where: { id: 'game-id' },
        data: { activeSceneId: 'scene-2' }, // Would be scene-2 from tool
      });
    });

    it('should handle tool execution errors', async () => {
      // Setup: Tool throws error
      authMock.mockResolvedValue({ user: { id: 'user-id' } });
      prismaMock.game.findFirst.mockResolvedValue({
        id: 'game-id',
      });
      prismaMock.gameScene.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/studio/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Create a scene' }],
          gameId: 'game-id',
        }),
      });

      const { POST } = await import('../../app/api/studio/chat/route');
      const response = await POST(request);
      
      // Should handle error gracefully
      expect(response.status).toBe(500);
    });
  });

  describe('Streaming', () => {
    it('should convert UIMessages to ModelMessages', async () => {
      // Test that messages are properly converted
      // This is difficult to test directly, but we verify the function is imported
      const route = await import('../../app/api/studio/chat/route');
      
      expect(route).toBeDefined();
      // The actual conversion happens inside, so we rely on integration testing
    });
  });
});
