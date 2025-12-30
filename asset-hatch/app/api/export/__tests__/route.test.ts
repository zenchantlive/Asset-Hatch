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
    parsePlan: jest.fn().mockReturnValue([
        {
            id: 'asset-1',
            category: 'Characters',
            name: 'Hero',
            type: 'character-sprite',
            description: 'A hero',
            variant: { id: 'v1', name: 'Idle' }
        }
    ]),
}));

describe('POST /api/export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 if projectId is missing', async () => {
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Project ID is required');
    });

    it('returns 404 if project not found', async () => {
        (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'missing-id' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toBe('Project not found');
    });

    it('successfully generates a zip file', async () => {
        // Mock data
        const projectId = 'test-project-id';
        const mockProject = {
            id: projectId,
            name: 'Test Project',
            createdAt: new Date(),
            baseResolution: '32x32',
        };

        const mockAssets = [
            {
                assetId: 'asset-1',
                projectId: projectId,
                status: 'approved',
                imageBlob: Buffer.from('fake-image-data'),
                metadata: JSON.stringify({ model: 'flux-2-dev', seed: 123 }),
                createdAt: new Date(),
            }
        ];

        const mockEntitiesFile = {
            id: 'file-1',
            content: 'mock markdown plan',
        };

        // Setup Prisma mocks
        (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
        (prisma.generatedAsset.findMany as jest.Mock).mockResolvedValue(mockAssets);
        (prisma.memoryFile.findUnique as jest.Mock).mockResolvedValue(mockEntitiesFile);
        (prisma.styleAnchor.findFirst as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ projectId }),
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/zip');
        expect(res.headers.get('Content-Disposition')).toContain('Test_Project_assets.zip');

        // Verify content is a valid zip (basic check)
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Check for manifest
        expect(zip.file('manifest.json')).toBeTruthy();

        // Check for structured asset file
        // Category "Characters" -> "character", Name "Hero", Variant "Idle" -> "character_hero_idle.png"
        // Wait, pluralize singular("Characters") -> "Character". Lowercase -> "character".
        // My mock prompt-builder/singularization logic will run inside the route.
        // We mocked 'plan-parser' but NOT 'prompt-builder' utilities like `generateSemanticId`.
        // So the actual logic from `lib/prompt-builder` will be used.
        // If I refactored it correctly, it should produce "character_hero_idle.png" in "character" folder.
        // Folder logic: getCategoryFolder("Characters") -> "characters" (Wait, looking at code: getCategoryFolder does NOT singularize?)

        // Let's check prompt-builder.ts (Step 46):
        // function getCategoryFolder(category: string): string { return category.toLowerCase().replace(/\s+/g, '_'); }
        // So "Characters" -> "characters".

        // function generateSemanticId(asset): string { ... pluralize.singular(category) ... }
        // So "character_hero_idle".

        // Path: "characters/character_hero_idle.png".

        expect(zip.file('characters/character_hero_idle.png')).toBeTruthy();
    });
});
