# ADR-023: 3D Asset Generation Mode Foundation

**Date:** 2026-01-12  
**Status:** Accepted  
**Context:** Adding 3D asset generation using Tripo3D API

## Decision

Implement 3D asset generation as a **parallel mode** to 2D, not a replacement. The foundation includes:

### 1. Mode Field on Projects

Added `mode: '2d' | '3d'` field to Project model (Prisma + Dexie). Defaults to `'2d'` for backward compatibility.

### 2. Tripo3D API Client Architecture

Created modular client in `lib/tripo/` with focused files (~150-200 lines each):

| File | Purpose |
|------|---------|
| `client.ts` | Base HTTP, auth, `createTripoTask()`, `getTripoTaskStatus()` |
| `polling.ts` | Exponential backoff polling (5s initial, 1.5x, 30s max) |
| `mesh.ts` | `generateMeshFromText()`, `submitMeshGenerationTask()` |
| `rig.ts` | `rigMesh()`, `applyAnimation()` |
| `index.ts` | Re-exports for clean imports |

### 3. Task Chain Pattern

Tripo3D uses async tasks. Each 3D asset tracks a chain:
- `draft_task_id` → mesh generation
- `rig_task_id` → auto-rigging
- `animation_task_ids` → per-animation tasks (JSON map)

### 4. CDN Streaming (No Local Storage)

MVP uses Tripo CDN URLs directly (valid ~24h). No IndexedDB caching for 3D models initially.

## Consequences

**Positive:**
- Clean separation from 2D workflow
- Modular client enables easy testing/mocking
- Exponential backoff handles long-running tasks (30-120s)

**Trade-offs:**
- Model URLs expire after 24h (acceptable for MVP generate→export flow)
- No offline 3D model access (future enhancement)

## Related Files

- `lib/types/3d-generation.ts` - All 3D types
- `lib/tripo/` - API client
- `prisma/schema.prisma` - `Generated3DAsset` model
- `lib/client-db.ts` - Dexie version 5 with `generated_3d_assets` table
