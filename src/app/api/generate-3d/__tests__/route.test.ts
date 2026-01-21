/**
 * Unit Tests for 3D Asset Generation API Route
 *
 * Tests the main generation endpoint for submitting Tripo tasks
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { submitTripoTask } from '@/lib/tripo-client';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    generated3DAsset: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

// Mock the Tripo client
jest.mock('@/lib/tripo-client', () => ({
  submitTripoTask: jest.fn(),
}));

describe('POST /api/generate-3d', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable for tests
    process.env.TRIPO_API_KEY = 'tsk-test_key';
  });

  it('returns 400 if projectId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        assetId: 'asset-123',
        prompt: 'a knight character',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 if prompt is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj-123',
        assetId: 'asset-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 404 if project not found', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'nonexistent',
        assetId: 'asset-123',
        prompt: 'a knight character',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Project not found');
  });

  it('returns 500 if TRIPO_API_KEY not configured', async () => {
    delete process.env.TRIPO_API_KEY;

    const mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      mode: '3d',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj-123',
        assetId: 'asset-123',
        prompt: 'a knight character',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Tripo API key not configured');

    // Restore env var
    process.env.TRIPO_API_KEY = 'tsk-test_key';
  });

  it('successfully submits task and creates database record', async () => {
    const mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      mode: '3d',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTripoTask = {
      task_id: 'tripo-task-abc',
      type: 'text_to_model',
      status: 'queued',
    };

    const mockAsset = {
      id: 'asset-db-123',
      projectId: 'proj-123',
      assetId: 'asset-123',
      status: 'queued',
      draftTaskId: 'tripo-task-abc',
      promptUsed: 'a knight character in T-pose',
      isRiggable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (submitTripoTask as jest.Mock).mockResolvedValue(mockTripoTask);
    (prisma.generated3DAsset.create as jest.Mock).mockResolvedValue(mockAsset);

    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj-123',
        assetId: 'asset-123',
        prompt: 'a knight character in T-pose',
        shouldRig: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.taskId).toBe('tripo-task-abc');
    expect(data.status).toBe('queued');

    // Verify submitTripoTask was called with correct params
    expect(submitTripoTask).toHaveBeenCalledWith('tsk-test_key', {
      type: 'text_to_model',
      prompt: 'a knight character in T-pose',
    });

    // Verify database record was created
    expect(prisma.generated3DAsset.create).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-123',
        assetId: 'asset-123',
        status: 'queued',
        draftTaskId: 'tripo-task-abc',
        promptUsed: 'a knight character in T-pose',
        isRiggable: true,
      },
    });
  });

  it('handles API errors gracefully', async () => {
    const mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      mode: '3d',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (submitTripoTask as jest.Mock).mockRejectedValue(new Error('Tripo API error'));

    const request = new NextRequest('http://localhost:3000/api/generate-3d', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj-123',
        assetId: 'asset-123',
        prompt: 'a knight character',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Generation failed');
    expect(data.details).toContain('Tripo API error');
  });
});
