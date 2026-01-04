import { NextRequest } from 'next/server';
import { prismaMock, authMock, resetAllMocks } from './bun-harness-mocks';
import { scenarios } from './fixtures';
import { describe, it, expect, beforeEach } from 'bun:test';

/**
 * API INTEGRATION TEST RUNNER (BUN VERSION)
 * This file dynamically executes scenarios defined in fixtures.ts
 */

describe('API Integration Test Harness', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    scenarios.forEach((scenario) => {
        it(scenario.name, async () => {
            // 1. Setup Mocks
            if (scenario.setupMock) {
                scenario.setupMock(prismaMock as any, authMock);
            }

            // 2. Import Handler Dynamically
            const routePath = scenario.path.replace('/api/', '');

            // Intelligent route resolution for dynamic segments
            let resolvedRoute = routePath;
            if (routePath.startsWith('assets/')) resolvedRoute = 'assets/[id]';
            if (routePath.startsWith('projects/') && routePath.split('/').length === 2 && !routePath.endsWith('projects/')) {
                resolvedRoute = 'projects/[id]';
            }
            if (routePath.includes('/memory-files')) resolvedRoute = resolvedRoute.replace(/\/[^/]+\/memory-files/, '/[id]/memory-files');
            if (routePath.includes('/project-detail')) resolvedRoute = resolvedRoute.replace(/\/[^/]+\/project-detail/, '/[id]/project-detail');
            if (routePath.includes('/style-analysis')) resolvedRoute = resolvedRoute.replace(/\/[^/]+\/style-analysis/, '/[id]/style-analysis');

            const importPath = `../../app/api/${resolvedRoute}/route`;

            const handlers = await import(importPath);
            const handler = handlers[scenario.method];

            if (!handler) {
                throw new Error(`No ${scenario.method} handler found for ${scenario.path}`);
            }

            // 3. Create Request
            const url = `http://localhost${scenario.path}`;
            let body: any = scenario.body ? JSON.stringify(scenario.body) : undefined;
            let headers: Record<string, string> = {};

            if (scenario.isFormData && scenario.body) {
                const formData = new FormData();
                Object.entries(scenario.body).forEach(([key, value]) => {
                    if (key === 'image') {
                        // Create a dummy File for tests
                        const file = new File([''], 'test.png', { type: 'image/png' });
                        formData.append(key, file);
                    } else {
                        formData.append(key, value as string);
                    }
                });
                body = formData;
            }

            const request = new NextRequest(url, {
                method: scenario.method,
                body,
                headers,
            });

            // 4. Execute
            const response = await handler(request, { params: scenario.params || {} });
            const data = await response.json();

            // 5. Assertions
            expect(response.status).toBe(scenario.expectedStatus);

            if (scenario.expectedBody) {
                scenario.expectedBody(data);
            }
        });
    });
});
