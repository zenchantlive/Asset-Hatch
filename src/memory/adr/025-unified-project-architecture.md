# ADR-025: Unified Project Architecture (Phase 6)

**Status:** Accepted
**Date:** 2026-01-17
**Deciders:** Claude (AI), User

---

## Context

Asset Hatch and Hatch Studios were developed as separate experiences:
- **Asset Hatch**: Project-based asset generation (planning → style → generation → export)
- **Hatch Studios**: Game creation with AI chat, multi-file code editing

Users couldn't:
- Link assets to games
- See relationship between their assets and games
- Add assets mid-game without manual integration

We needed a unified architecture that bridges both experiences.

---

## Decision

Implement a unified project architecture with:

1. **1:1 Bidirectional Relation** between Project and Game via unique foreign keys
2. **JSON-based Asset Manifest** for tracking linked assets
3. **Three Start Paths**: Assets First, Game First, Both Together
4. **Manual Sync Trigger** for asset integration
5. **Version Locking** on asset references

### Schema Changes

```prisma
// Project extends with game reference and manifest
model Project {
  gameId              String?   @unique
  game                Game?     // Prisma infers from unique gameId
  assetManifest       Json?     @default("{}")
  syncStatus          String    @default("clean")
  lastSyncAt          DateTime?
  pendingAssetCount   Int       @default(0)
}

// Game extends with project reference
model Game {
  projectId           String?   @unique
  project             Project?  @relation(fields: [projectId], references: [id])
}

// GameAssetRef enhanced with version locking
model GameAssetRef {
  lockedVersionId     String?
  lockedAt            DateTime?
  manifestKey         String?
}
```

### Start Path Selection (Updated)

```typescript
interface CreateProjectData {
  name: string;
  mode: "2d" | "3d" | "hybrid";
  // Note: startWith field removed - all projects now create both modes automatically
}
```

**Change**: As of 2026-01-20, all projects now automatically create both asset and game modes together. The `startWith` option has been removed because the "both" option wasn't working correctly, and the unified experience is simpler and more powerful.

---

## Consequences

### Positive

* **Single Source of Truth**: One project experience for both assets and games
* **Simplified Workflow**: All projects automatically include both asset and game modes
* **Automatic Linking**: Assets can be synced to games without manual URL copying
* **Version Safety**: Locked versions prevent breaking changes from regenerated assets
* **Seamless Integration**: Users can switch between asset generation and game development without friction
* **Unified Dashboard**: Single view showing all projects with asset/game status

### Negative

* **Schema Migration**: Required adding unique constraints (potential data loss)
* **Complexity**: Additional sync logic to maintain
* **Learning Curve**: New concepts (manifest, sync status) for users

### Neutral / Trade-offs

* **JSON Manifest vs Separate Table**: Simpler queries but no FK constraints
* **Manual Sync vs Auto-sync**: User control vs seamless experience (chose manual for safety)

---

## Alternatives Considered

### Alternative 1: Keep Separate, Add Linking Table
* **Pros:** Less invasive change
* **Cons:** Doesn't solve "unified experience" goal
* **Why rejected:** Partial solution doesn't meet user needs

### Alternative 2: Auto-sync All Assets
* **Pros:** Seamless experience
* **Cons:** Breaking changes when assets regenerate
* **Why rejected:** Safety concern for production games

### Alternative 3: Single Table for Both
* **Pros:** Maximum unification
* **Cons:** Complex migration, loses clear asset vs game distinction
* **Why rejected:** Over-engineering for current needs

---

## Implementation Notes

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/types/unified-project.ts` | Type definitions |
| `src/lib/studio/sync-tools.ts` | AI SDK sync tool |
| `src/app/api/projects/[id]/status/route.ts` | Status endpoint |
| `src/app/api/projects/[id]/assets/sync/route.ts` | Sync endpoint |
| `src/components/dashboard/NewProjectDialog.tsx` | Start path UI |
| `src/components/dashboard/UnifiedProjectCard.tsx` | Dashboard cards |

### Prisma 1:1 Relation Pattern

Only ONE side defines `fields` and `references`:
```prisma
// ✅ Correct: Project owns the relation
model Project {
  gameId String? @unique
  game   Game?
}

// ✅ Correct: Game just references
model Game {
  projectId String? @unique
  project   Project? @relation(fields: [projectId], references: [id])
}

// ❌ Wrong: Both define fields/references (P1012 error)
// model Project {
//   gameId String? @unique
//   game   Game? @relation(fields: [gameId], references: [id])  // ERROR
// }
```

### Database Migration

```bash
bunx prisma db push --accept-data-loss
```

Warning is acceptable because:
- Development database (can reset)
- New feature (no existing data to preserve)
- Unique constraints on new nullable FKs

---

## Review Schedule

Review after Phase 7 (if auto-sync is considered) or when:
- User feedback indicates sync friction
- Asset manifest grows large (performance concern)
- Version locking needs more granularity

---

## References

* Phase 6 Plan: `src/.agents/plans/hatch-studios/phase-6-unified-project-architecture.md`
* System Patterns: `memory/system_patterns.md` → "Phase 6: Unified Project Architecture Patterns"
* Related: ADR-007 (Hybrid Persistence Model), ADR-024 (Multi-File Game Code)
