import { NextRequest } from 'next/server';
import { prismaMock, authMock, resetAllMocks } from './harness-mocks';
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
                scenario.setupMock(prismaMock, authMock);
            }

            // 2. Import Handler Dynamically
            const routePath = scenario.path.replace('/api/', '');

            // Intelligent route resolution for dynamic segments
            const routeMappings: { [key: string]: string } = {
                '^projects/([^/]+)$': 'projects/[id]',
                '^projects/([^/]+)/memory-files$': 'projects/[id]/memory-files',
                '^projects/([^/]+)/project-detail$': 'projects/[id]/project-detail',
                '^projects/([^/]+)/style-analysis$': 'projects/[id]/style-analysis',
                '^assets/([^/]+)$': 'assets/[id]',
            };

            let resolvedRoute = routePath;
            for (const pattern in routeMappings) {
                if (new RegExp(pattern).test(routePath)) {
                    resolvedRoute = routeMappings[pattern];
                    break;
                }
            }

            const importPath = `../../app/api/${resolvedRoute}/route`;

            const handlers = await import(importPath);
            const handler = handlers[scenario.method];

            if (!handler) {
                throw new Error(`No ${scenario.method} handler found for ${scenario.path}`);
            }

            // 3. Create Request
            const url = `http://localhost${scenario.path}`;
            let body: BodyInit | null | undefined = scenario.body ? JSON.stringify(scenario.body) : undefined;
            const headers: Record<string, string> = {};

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
