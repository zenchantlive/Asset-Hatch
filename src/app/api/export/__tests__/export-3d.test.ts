/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findUnique: jest.fn(),
        },
        generatedAsset: {
            findMany: jest.fn(),
        },
        generated3DAsset: {
            findMany: jest.fn(),
        },
        memoryFile: {
            findUnique: jest.fn(),
        },
        styleAnchor: {
            findFirst: jest.fn(),
        },
    },
}));

// Mock plan-parser
jest.mock('@/lib/plan-parser', () => ({
    parsePlan: jest.fn().mockReturnValue([]),
}));

describe('Export All Asset Types (3D Support)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default fetch mock - cast to satisfy typeof fetch with preconnect
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
            })
        ) as unknown as typeof fetch;
    });

    it('should include approved skybox images in ZIP', async () => {
        const projectId = 'test-3d-project';
        const mockProject = {
            id: projectId,
            name: 'Test 3D Project',
            mode: '3d',
            createdAt: new Date(),
        };

        const mock3DAssets = [
            {
                assetId: 'test-3d-project-skybox',
                status: 'complete',
                approvalStatus: 'approved',
                draftModelUrl: 'https://example.com/skybox.jpg',
                promptUsed: 'A beautiful sunset skybox',
                createdAt: new Date(),
            }
        ];

        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.generatedAsset.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.generated3DAsset.findMany as jest.Mock).mockResolvedValue(mock3DAssets);
        (prisma.memoryFile.findUnique as jest.Mock).mockResolvedValue({ content: '' });

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId,
                assets: [{ id: 'dummy', imageBlob: 'dummy' }]
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const blob = await res.blob();
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());

        expect(zip.file('skybox/test-3d-project-skybox.jpg')).toBeTruthy();
    });

    it('should include approved 3D model GLBs in ZIP', async () => {
        const projectId = 'test-3d-project';
        const mockProject = {
            id: projectId,
            name: 'Test 3D Project',
            mode: '3d',
            createdAt: new Date(),
        };

        const mock3DAssets = [
            {
                assetId: 'test-3d-project-hero',
                status: 'complete',
                approvalStatus: 'approved',
                draftModelUrl: 'https://example.com/hero.glb',
                promptUsed: 'A brave hero',
                createdAt: new Date(),
            }
        ];

        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.generatedAsset.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.generated3DAsset.findMany as jest.Mock).mockResolvedValue(mock3DAssets);
        (prisma.memoryFile.findUnique as jest.Mock).mockResolvedValue({ content: '' });

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId,
                assets: [{ id: 'dummy', imageBlob: 'dummy' }]
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());

        expect(zip.file('models/test-3d-project-hero/draft.glb')).toBeTruthy();
    });

    it('should include rigged and animated model GLBs in ZIP', async () => {
        const projectId = 'test-3d-project';
        const mockProject = {
            id: projectId,
            name: 'Test 3D Project',
            mode: '3d',
            createdAt: new Date(),
        };

        const mock3DAssets = [
            {
                assetId: 'test-3d-project-hero',
                status: 'complete',
                approvalStatus: 'approved',
                draftModelUrl: 'https://example.com/hero.glb',
                riggedModelUrl: 'https://example.com/hero_rigged.glb',
                animatedModelUrls: JSON.stringify({
                    'preset:walk': 'https://example.com/hero_walk.glb',
                    'preset:idle': 'https://example.com/hero_idle.glb',
                }),
                promptUsed: 'A brave hero',
                createdAt: new Date(),
            }
        ];

        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.generatedAsset.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.generated3DAsset.findMany as jest.Mock).mockResolvedValue(mock3DAssets);
        (prisma.memoryFile.findUnique as jest.Mock).mockResolvedValue({ content: '' });

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId,
                assets: [{ id: 'dummy', imageBlob: 'dummy' }]
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());

        expect(zip.file('models/test-3d-project-hero/draft.glb')).toBeTruthy();
        expect(zip.file('models/test-3d-project-hero/rigged.glb')).toBeTruthy();
        expect(zip.file('models/test-3d-project-hero/animations/walk.glb')).toBeTruthy();
        expect(zip.file('models/test-3d-project-hero/animations/idle.glb')).toBeTruthy();
    });

    it('should generate correct manifest.json with all asset types', async () => {
        const projectId = 'test-mixed-project';
        const mockProject = {
            id: projectId,
            name: 'Test Mixed Project',
            mode: '3d',
            createdAt: new Date(),
        };

        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.generatedAsset.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.generated3DAsset.findMany as jest.Mock).mockResolvedValue([
            {
                assetId: 'skybox-1',
                status: 'complete',
                approvalStatus: 'approved',
                draftModelUrl: 'https://example.com/skybox.jpg',
                promptUsed: 'Skybox prompt',
                createdAt: new Date(),
            }
        ]);
        (prisma.memoryFile.findUnique as jest.Mock).mockResolvedValue({ content: '' });

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId,
                assets: [{ id: 'dummy', imageBlob: 'dummy' }]
            }),
        });

        const res = await POST(req);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());
        const manifestFile = zip.file('manifest.json');
        expect(manifestFile).toBeTruthy();

        const manifest = JSON.parse(await manifestFile!.async('string'));
        expect(manifest.project.name).toBe('Test Mixed Project');
        expect(manifest.assets3d.length).toBe(1);
        expect(manifest.assets3d[0].id).toBe('skybox-1');
    });
});
