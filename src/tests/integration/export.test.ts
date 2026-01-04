import { POST } from '@/app/api/export/route';
import { prismaMock, resetAllMocks } from './harness-mocks';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('/api/export', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    it('returns 400 if projectId is missing', async () => {
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({ assets: [{ id: 'ga1', imageBlob: '...' }] })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 404 if project not found', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve(null));
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                assets: [{ id: 'ga1', imageBlob: '...' }]
            })
        });
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 400 if no approved assets', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1', name: 'Project' }));
        prismaMock.generatedAsset.findMany.mockImplementation(() => Promise.resolve([]));
        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                assets: [{ id: 'ga1', imageBlob: '...' }]
            })
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('exports assets as ZIP', async () => {
        prismaMock.project.findUnique.mockImplementation(() => Promise.resolve({
            id: 'p1',
            name: 'Project',
            createdAt: new Date()
        }));
        prismaMock.generatedAsset.findMany.mockImplementation(() => Promise.resolve([
            { id: 'ga1', assetId: 'a1', status: 'approved', imageBlob: Buffer.from('img'), createdAt: new Date() }
        ]));
        prismaMock.memoryFile.findUnique.mockImplementation(() => Promise.resolve({ content: 'markdown-plan' }));

        const req = new NextRequest('http://localhost/api/export', {
            method: 'POST',
            body: JSON.stringify({
                projectId: 'p1',
                assets: [{ id: 'ga1', imageBlob: 'base64-image-data' }]
            })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/zip');

        const blob = await res.blob();
        expect(blob.size).toBeGreaterThan(0);
    });
});
