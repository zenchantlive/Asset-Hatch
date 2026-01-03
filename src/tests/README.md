# API Integration Test Harness

This directory contains the deterministic integration test suite for the Asset-Hatch project.

## Structure
- `tests/integration/`: Core test suite.
  - `mocks/`: Manual mock implementations for external dependencies and Prisma.
  - `projects.test.ts`: Tests for project listing and creation.
  - `project-details.test.ts`: Tests for individual project CRUD.
  - `chat.test.ts`: Tests for the agentic chat API.
  - `generate.test.ts`: Tests for the individual asset generation flow.
  - `export.test.ts`: Tests for the ZIP export workflow.
  - `style-anchors.test.ts`: Tests for style anchor creation.
  - `remaining.test.ts`: Tests for support APIs (Analyze Style, Generate Style, Asset Sync).
  - `types.ts`: Shared TypeScript interfaces for test reliability.

## Test Strategy
The harness uses **Deterministic Mocking** to ensure that tests are fast, reliable, and do not require a live database or external API keys.

- **Prisma**: All database calls are intercepted by `prismaMock`, allowing us to simulate specific DB states and errors.
- **NextAuth**: The `auth` helper is mocked to return a consistent test session.
- **OpenRouter & AI SDK**: Language model streams and image generation calls are mocked to return fixed responses, avoiding latency and cost.

## Running Tests
To run the integration tests, use:

```bash
bun test tests/integration/
```

Or with coverage:

```bash
bun test --coverage tests/integration/
```

## Maintenance
When adding a new API route:
1. Add the endpoint to `tests/api_surface.md`.
2. Create a new `.test.ts` file in `tests/integration/`.
3. Update `tests/integration/mocks/prisma.ts` if new models or methods are used.
4. Ensure all tests are strictly typed using `tests/integration/types.ts`.
