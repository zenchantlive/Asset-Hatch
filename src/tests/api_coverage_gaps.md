# API Coverage Gap Analysis

## Overview
The API Integration Test Harness currently covers **100% of the core service APIs** identified during discovery. 32 integration tests ensure that critical paths for project management, chat-based planning, asset generation, and data synchronization are robust and deterministic.

## Covered Endpoints

| Endpoint | Methods | Coverage Level |
| :--- | :--- | :--- |
| `/api/projects` | GET, POST | FULL |
| `/api/projects/[id]` | GET, PATCH, DELETE | FULL |
| `/api/projects/[id]/memory-files` | GET, POST | FULL |
| `/api/chat` | POST | HIGH |
| `/api/generate` | POST | FULL |
| `/api/export` | POST | FULL |
| `/api/style-anchors` | POST | FULL |
| `/api/analyze-style` | POST | FULL |
| `/api/generate-style` | POST | FULL |
| `/api/generated-assets` | POST | FULL |
| `/api/assets/[id]` | GET | FULL |

## Identified Gaps

### 1. External Auth Provider Mismatch
While `auth()` is mocked via `authMock`, the tests do not verify the actual OAuth handshake or callback logic (GitHub/Credentials). This is expected for integration tests but could be covered by E2E tests (Cypress/Playwright).

### 2. Edge Case Tool Calls in Chat
The `/api/chat` integration test verifies the high-level stream and project creation logic. However, the specific business logic within individual tools (e.g., `updateQuality`, `finalizePlan`) relies on the mock Prisma responses. Detailed unit tests for these shared library functions are recommended.

### 3. Rate Limiting & Error Bubbling
External API failures (OpenRouter) are mocked to return specific errors, but the harness does not currently simulate transient network failures or rate-limiting headers (429) to verify retry logic if implemented.

## Recommendations
1. **Extend Unit Tests**: Move complex tool logic from the chat route to isolated library functions and add specific unit tests for them.
2. **E2E Smoke Tests**: Implement a few high-level smoke tests using Playwright to verify the real `next-auth` session flow.
3. **Load Verification**: Add tests that simulate larger payloads (e.g., extremely large memory files) to verify buffer/string limit handling.
