import { POST } from '@/app/api/export/route';
import { prismaMock } from './mocks/prisma';
import { NextRequest } from 'next/server';

// Mock JSZip
jest.mock('jszip', () => {
    return jest.fn().mockImplementation(() => ({
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(new Blob(['zip-content'])),
    }));
});

// Mock plan parser
jest.mock('@/lib/plan-parser', () => ({
    parsePlan: jest.fn().mockReturnValue([
        { id: 'a1', name: 'Asset 1', category: 'Characters', description: 'Desc' }
    ]),
}));

describe('/api/export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 if projectId is missing', async () => {
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({})
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 404 if project not found', async () => {
        prismaMock.project.findUnique.mockResolvedValue(null);
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1' })
        });
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 400 if no approved assets', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 'p1', name: 'Project' });
        prismaMock.generatedAsset.findMany.mockResolvedValue([]);
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1' })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('exports assets as ZIP', async () => {
        prismaMock.project.findUnique.mockResolvedValue({
            id: 'p1',
            name: 'Project',
            createdAt: new Date()
        });
        prismaMock.generatedAsset.findMany.mockResolvedValue([
            { id: 'ga1', assetId: 'a1', status: 'approved', imageBlob: Buffer.from('img'), createdAt: new Date() }
        ]);
        prismaMock.memoryFile.findUnique.mockResolvedValue({ content: 'markdown-plan' });

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/zip');

        const blob = await res.blob();
        expect(blob.size).toBeGreaterThan(0);
    });
});
