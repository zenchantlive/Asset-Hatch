import { prismaMock, authMock } from './bun-harness-mocks';

export interface EndpointScenario {
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    auth?: { user: { id: string; email?: string; name?: string } } | null;
    body?: any;
    params?: Record<string, string>;
    isFormData?: boolean;
    expectedStatus: number;
    expectedBody?: (body: any) => void;
    setupMock?: (prisma: any, auth: any) => void;
}

export const scenarios: EndpointScenario[] = [
    // PROJECTS API
    {
        name: 'GET /api/projects - Success',
        path: '/api/projects',
        method: 'GET',
        auth: { user: { id: 'user-1' } },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.project.findMany.mockImplementation(() => Promise.resolve([
                { id: 'p1', name: 'Project 1', phase: 'planning', updatedAt: new Date() }
            ]));
        }
    },
    {
        name: 'GET /api/projects - Unauthorized',
        path: '/api/projects',
        method: 'GET',
        auth: null,
        expectedStatus: 401,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve(null));
        }
    },
    {
        name: 'POST /api/projects - Success',
        path: '/api/projects',
        method: 'POST',
        auth: { user: { id: 'user-1', email: 'test@example.com' } },
        body: { name: 'New Project' },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1', email: 'test@example.com' } }));
            prisma.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1' } as any));
            prisma.project.create.mockImplementation(() => Promise.resolve({
                id: 'p-new',
                name: 'New Project',
                phase: 'planning',
                userId: 'user-1'
            } as any));
        }
    },
    {
        name: 'POST /api/projects - Validation Error',
        path: '/api/projects',
        method: 'POST',
        auth: { user: { id: 'user-1' } },
        body: {}, // Missing name
        expectedStatus: 400,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
        }
    },

    // PROJECTS [ID]
    {
        name: 'GET /api/projects/[id] - Success',
        path: '/api/projects/p1',
        method: 'GET',
        auth: { user: { id: 'user-1' } },
        params: { id: 'p1' },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1', name: 'P1' } as any));
        }
    },
    {
        name: 'PATCH /api/projects/[id] - Update Phase',
        path: '/api/projects/p1',
        method: 'PATCH',
        auth: { user: { id: 'user-1' } },
        params: { id: 'p1' },
        body: { phase: 'style' },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' } as any));
            prisma.project.update.mockImplementation((data: any) => Promise.resolve({ id: 'p1', ...data.data }));
        }
    },
    {
        name: 'DELETE /api/projects/[id] - Success',
        path: '/api/projects/p1',
        method: 'DELETE',
        auth: { user: { id: 'user-1' } },
        params: { id: 'p1' },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' } as any));
            prisma.project.delete.mockImplementation(() => Promise.resolve({ id: 'p1' } as any));
        }
    },

    // GENERATE API
    {
        name: 'POST /api/generate - Success',
        path: '/api/generate',
        method: 'POST',
        auth: { user: { id: 'user-1' } },
        body: {
            projectId: 'p1',
            asset: { id: 'a1', name: 'Hero', description: 'A brave knight', variant: { id: 'v1' } }
        },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1', openRouterApiKey: null } as any));
            prisma.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1', baseResolution: '32x32' } as any));
            prisma.styleAnchor.findFirst.mockImplementation(() => Promise.resolve({
                id: 's1',
                referenceImageBlob: Buffer.from([]),
                colorPalette: '[]'
            } as any));
            prisma.generatedAsset.create.mockImplementation(() => Promise.resolve({ id: 'g1', metadata: '{}' } as any));
        }
    },

    // AUTH REGISTER
    {
        name: 'POST /api/auth/register - Success',
        path: '/api/auth/register',
        method: 'POST',
        body: { name: 'New User', email: 'new@example.com', password: 'password123' },
        expectedStatus: 200,
        setupMock: (prisma) => {
            prisma.user.findUnique.mockImplementation(() => Promise.resolve(null));
            prisma.user.create.mockImplementation((data: any) => Promise.resolve({ id: 'u2', ...data }));
        }
    },

    // ANALYZE STYLE
    {
        name: 'POST /api/analyze-style - Success',
        path: '/api/analyze-style',
        method: 'POST',
        auth: { user: { id: 'user-1' } },
        body: { image: 'dummy-content', projectId: 'p1' },
        isFormData: true,
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.styleAnchor.upsert.mockImplementation((data: any) => Promise.resolve({ id: 's1', ...data.create }));
        }
    },

    // SYNC COST
    {
        name: 'POST /api/sync-cost - Success',
        path: '/api/generation/sync-cost',
        method: 'POST',
        auth: { user: { id: 'user-1' } },
        body: { generation_id: 'g1', projectId: 'p1' },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.generationCost.upsert.mockImplementation((data: any) => Promise.resolve({ id: 'c1', ...data.create }));
        }
    },

    // EXPORT
    {
        name: 'POST /api/export - No Approved Assets Error',
        path: '/api/export',
        method: 'POST',
        body: {
            projectId: 'p1',
            assets: [{ id: 'g1', imageBlob: '...' }]
        },
        expectedStatus: 400,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1' } as any));
            prisma.generatedAsset.findMany.mockImplementation(() => Promise.resolve([]));
        }
    }
];
