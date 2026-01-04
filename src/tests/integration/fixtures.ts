import { type prismaMock, type authMock } from './bun-harness-mocks';

export interface EndpointScenario {
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    auth?: { user: { id: string; email?: string; name?: string } } | null;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    isFormData?: boolean;
    expectedStatus: number;
    expectedBody?: (body: unknown) => void;
    setupMock?: (prisma: typeof prismaMock, auth: typeof authMock) => void;
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
        setupMock: (_prisma, auth) => {
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
            prisma.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1' } as unknown));
            prisma.project.create.mockImplementation(() => Promise.resolve({
                id: 'p-new',
                name: 'New Project',
                phase: 'planning',
                userId: 'user-1'
            } as unknown));
        }
    },
    {
        name: 'POST /api/projects - Validation Error',
        path: '/api/projects',
        method: 'POST',
        auth: { user: { id: 'user-1' } },
        body: {}, // Missing name
        expectedStatus: 400,
        setupMock: (_prisma, auth) => {
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
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1', name: 'P1' } as unknown));
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
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' } as unknown));
            prisma.project.update.mockImplementation((data: unknown) => {
                const d = data as { data: object };
                return Promise.resolve({ id: 'p1', ...d.data });
            });
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
            prisma.project.findFirst.mockImplementation(() => Promise.resolve({ id: 'p1', userId: 'user-1' } as unknown));
            prisma.project.delete.mockImplementation(() => Promise.resolve({ id: 'p1' } as unknown));
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
            assetId: 'a1',
            assetName: 'Hero',
            variantId: 'v1'
        },
        expectedStatus: 200,
        setupMock: (prisma, auth) => {
            auth.mockImplementation(() => Promise.resolve({ user: { id: 'user-1' } }));
            prisma.user.findUnique.mockImplementation(() => Promise.resolve({ id: 'user-1', openRouterApiKey: null } as unknown));
            prisma.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1', baseResolution: '32x32' } as unknown));
            prisma.styleAnchor.findFirst.mockImplementation(() => Promise.resolve({
                id: 's1',
                referenceImageBlob: Buffer.from([]),
                colorPalette: '[]'
            } as unknown));
            prisma.generatedAsset.create.mockImplementation(() => Promise.resolve({ id: 'g1', metadata: '{}' } as unknown));
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
            prisma.user.create.mockImplementation((data: unknown) => {
                const d = data as object;
                return Promise.resolve({ id: 'u2', ...d });
            });
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
            prisma.styleAnchor.upsert.mockImplementation((data: unknown) => {
                const d = data as { create: object };
                return Promise.resolve({ id: 's1', ...d.create });
            });
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
            prisma.generationCost.upsert.mockImplementation((data: unknown) => {
                const d = data as { create: object };
                return Promise.resolve({ id: 'c1', ...d.create });
            });
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
            prisma.project.findUnique.mockImplementation(() => Promise.resolve({ id: 'p1' } as unknown));
            prisma.generatedAsset.findMany.mockImplementation(() => Promise.resolve([]));
        }
    }
];
