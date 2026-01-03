# ADR-007: Hybrid Persistence Model (Dexie + Prisma)

**Status:** Accepted
**Date:** 2025-12-26
**Deciders:** User + Antigravity

## Context
As the project evolved to include more complex AI generations (e.g., Flux.2 via OpenRouter), the need for server-side persistence became critical. API routes like `/api/generate` need to read project state and style anchors that were previously only stored in the client-side IndexedDB (Dexie).

Options considered:
- **Client-only (Status Quo)**: Continue using Dexie and pass all required data in every API request. 
  - *Cons*: Massive payloads, poor data integrity, and difficult to manage as schemas grow.
- **Server-only (Prisma/SQLite)**: Migrate all data to the server and treat the client as a pure view.
  - *Cons*: Large migration effort, loses offline-first benefits of Dexie, and requires rewriting many existing synchronization hooks.
- **Hybrid (Chosen)**: Use Prisma/SQLite as the "Server Source of Truth" for any data the server needs to read (StyleAnchors, Project status), while maintaining Dexie as a local cache/state manager for the UI.

## Decision
We will implement a **Hybrid Persistence Model**:

1. **Server Source of Truth**: Anything required by server-side logic (e.g., asset generation) MUST be persisted to the server via API calls storage in Prisma/SQLite.
2. **Client-side Cache/UI State**: Dexie (`client-db.ts`) remains as the primary data source for UI components, enabling fast `useLiveQuery` updates and offline scenarios.
3. **Dual-Write on Mutation**: UI components that perform "save" operations (like `StyleAnchorEditor`) will write to BOTH the server (via `POST /api/...`) and then optionally update the local Dexie cache with the server-confirmed data.

## Consequences

### Positive
- **API Robustness**: Server-side routes can reliably access data (like `styleAnchor.referenceImageBlob`) without relying on the client to send blobs in every request.
- **UI Performance**: Keep using Dexie's reactive hooks (`useLiveQuery`) for instant UI feedback.
- **Incremental Migration**: Allows us to move models to the server one-by-one (e.g., `StyleAnchor` first) rather than a "Big Bang" migration.

### Negative
- **Sync Complexity**: Risk of data drift if a server write succeeds but client cache update fails (or vice versa).
- **Redundancy**: Shared types between `prisma/schema.prisma` and `lib/client-db.ts` must be manually kept in sync.

### Mitigation
- Prioritize server writes. If the server write fails, do not update the local cache.
- Use the same IDs (UUIDs) across both layers to ensure consistency.
- Implement `/api/style-anchors` to facilitate the centralized storage of visual consistency data.
