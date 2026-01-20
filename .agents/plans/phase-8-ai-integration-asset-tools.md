# Feature: Phase 8 - AI Integration & Asset Tools

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you implement.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Phase 8 implements two related capabilities:

**Phase 8a - Asset Awareness**: AI knows about linked assets and can query their metadata. The system prompt includes current asset information, and AI has tools to discover assets during conversation.

**Phase 8b - Version Conflict Resolution**: Users can detect when linked assets have newer versions in Asset Hatch and choose to sync updates, keep current versions, or review changes before updating.

The current `implementation-prd.md` describes the goal but lacks implementation tasks. This plan provides the missing implementation details.

## User Story

**Phase 8a - Asset Awareness**
```
As a game developer using AI to build my game
I want the AI to know what assets are available and their metadata
So that the AI can write code that correctly loads and uses my assets
```

**Phase 8b - Version Conflicts**
```
As a game developer who has linked assets to my game
I want to be notified when those assets are updated in Asset Hatch
So that I can choose to sync updates, keep current versions, or review changes
```

## Problem Statement

**Phase 8a Problem**: AI currently has no awareness of linked assets. While `ASSETS.load()` exists, the system prompt only shows a static list at conversation start. AI cannot:
- Query assets mid-conversation
- Get detailed metadata (animations, poses)
- Suggest using specific assets

**Phase 8b Problem**: When a user regenerates an asset in Asset Hatch, the game still references the old locked version. No mechanism exists to:
- Detect that updates are available
- Show what changed between versions
- Sync updates to the game

## Solution Statement

**Phase 8a Solution**:
1. Add `/api/studio/games/[id]/assets/updates` endpoint to detect newer asset versions
2. Add AI tools: `getLinkedAssets`, `getAssetUpdates`, `syncAssetVersion`
3. Update system prompt to include dynamic asset section with tool call

**Phase 8b Solution**:
1. Create version comparison logic comparing `lockedAt` vs source `updatedAt`
2. Add frontend UI component: `VersionConflictBanner` with actions
3. Add `POST /api/studio/games/[id]/assets/[refId]/sync` to sync updates
4. Store user preferences for auto-sync behavior

## Feature Metadata

**Feature Type**: Enhancement (adds capabilities to existing feature)
**Estimated Complexity**: Medium-High (API + AI tools + frontend)
**Primary Systems Affected**:
- `src/app/api/studio/games/[id]/assets/` - New endpoints
- `src/lib/studio/game-tools.ts` - New AI tools
- `src/lib/studio/babylon-system-prompt.ts` - Updated prompt
- `src/components/studio/` - New UI components
- `src/lib/types/unified-project.ts` - New types

**Dependencies**:
- Existing `ASSETS.load()` in `asset-loader.ts`
- Existing `GameAssetRef` model with `lockedVersionId`
- Existing `Generated3DAsset` and `GeneratedAsset` models

---

## CONTEXT REFERENCES

### Relevant Codebase Files (MUST READ BEFORE IMPLEMENTING!)

**API Patterns**
- `src/app/api/studio/games/[id]/assets/route.ts` (lines 1-141) - Existing asset API pattern, auth, response format
- `src/app/api/studio/games/[id]/files/route.ts` (lines 1-186) - API route pattern to follow
- `src/app/api/projects/[id]/assets/sync/route.ts` (lines 1-192) - Sync pattern, Prisma update

**Type Definitions**
- `src/lib/types/unified-project.ts` (lines 1-205) - AssetManifest, AssetManifestEntry types
- `src/lib/types/shared-context.ts` (lines 1-100) - UnifiedProjectContext type

**AI Tools**
- `src/lib/studio/game-tools.ts` (lines 1-1102) - Tool patterns, listUserAssetsTool (lines 461-566)
- `src/lib/studio/sync-tools.ts` (lines 1-150) - syncAssetTool pattern

**System Prompt**
- `src/lib/studio/babylon-system-prompt.ts` (lines 1-247) - Current asset section (lines 126-142)

**Asset Loading**
- `src/lib/studio/asset-loader.ts` (lines 1-130) - ASSETS global helper pattern

**Database Schema**
- `src/prisma/schema.prisma` (lines 338-375) - GameAssetRef model with lockedVersionId

### New Files to Create

- `src/app/api/studio/games/[id]/assets/updates/route.ts` - Detect available updates
- `src/app/api/studio/games/[id]/assets/[refId]/sync/route.ts` - Sync specific version
- `src/components/studio/VersionConflictBanner.tsx` - UI for conflict display
- `src/components/studio/AssetVersionBadge.tsx` - Small badge showing version status
- `src/lib/studio/version-comparison.ts` - Version comparison logic
- `src/lib/types/version-update.ts` - New types for update detection

### Relevant Documentation

- [Vercel AI SDK Tools](https://ai.sdk.dev/docs/tools) - Tool definition patterns
- [Prisma JSON Fields](https://www.prisma.io/docs/orm/prisma-schema/data-model/json) - For assetManifest handling
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - API route patterns

### Patterns to Follow

**API Route Pattern** (from `files/route.ts:61-107`):
```typescript
export async function GET(
    request: Request,
    props: RouteParams
): Promise<NextResponse> {
    // Auth check
    // Ownership verification
    // Prisma query with select
    // Return NextResponse.json({ success: true, data })
}
```

**AI Tool Pattern** (from `game-tools.ts:461-566`):
```typescript
export const listUserAssetsTool = (gameId: string) => {
  return tool({
    description: 'Query the user\'s Asset Hatch library...',
    inputSchema: listUserAssetsSchema,
    execute: async ({ type, search, limit }) => {
      // Get game with projectId
      // Query assets from linked project
      // Return { success, assets: [...] }
    },
  });
};
```

**Zod Schema Pattern** (from `files/route.ts:17-32`):
```typescript
const createFileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    content: z.string().optional(),
    orderIndex: z.number().int().optional(),
});
```

**Logging Pattern** (from codebase):
```typescript
console.log('🎮 Creating scene:', name, 'order:', orderIndex);
console.log('✅ Scene created:', scene.id);
console.error('❌ Failed to create scene:', error);
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Types & Comparison Logic)

**Goal**: Create type definitions and version comparison logic

**Tasks**:

#### CREATE src/lib/types/version-update.ts
- **IMPLEMENT**: Define types for asset updates
- **PATTERN**: Mirror `unified-project.ts:25-58`
- **TYPES**:
  - `AssetVersionInfo` - Current and latest version comparison
  - `AssetUpdate` - What changed (animations, model, etc.)
  - `VersionUpdateResponse` - API response structure
- **VALIDATE**: `cd src && bun run typecheck`

#### CREATE src/lib/studio/version-comparison.ts
- **IMPLEMENT**: Version comparison logic
- **PATTERN**: Use prisma queries from `assets/route.ts:9-70`
- **FUNCTIONS**:
  - `compareAssetVersions(gameId, refId)` - Compare locked vs current
  - `findAvailableUpdates(gameId)` - Find all assets with newer versions
  - `summarizeChanges(previous, current)` - What changed between versions
- **VALIDATE**: `cd src && bun run typecheck`

### Phase 2: Core API Endpoints

**Goal**: Create API endpoints for update detection and version sync

**Tasks**:

#### CREATE src/app/api/studio/games/[id]/assets/updates/route.ts
- **IMPLEMENT**: GET endpoint for detecting available updates
- **PATTERN**: Follow `files/route.ts:61-107`
- **AUTH**: Session + ownership check
- **QUERY**: Compare GameAssetRef.lockedVersionId vs Generated3DAsset/GeneratedAsset
- **RESPONSE**:
```typescript
{
  success: true,
  hasUpdates: boolean,
  updates: Array<{
    refId: string,
    assetName: string,
    currentVersion: number,
    latestVersion: number,
    changes: {
      hasNewAnimations: boolean,
      hasNewModel: boolean,
      changedFields: string[]
    }
  }>
}
```
- **VALIDATE**: `cd src && bun run typecheck && bun run lint`

#### CREATE src/app/api/studio/games/[id]/assets/[refId]/sync/route.ts
- **IMPLEMENT**: POST endpoint to sync a specific version
- **PATTERN**: Follow `sync/route.ts:42-191`
- **AUTH**: Session + ownership check
- **ACTIONS**:
  1. Fetch current GameAssetRef and source asset
  2. Compare versions
  3. If update available, snapshot new data to GameAssetRef
  4. Update lockedAt timestamp
  5. Return success with changes summary
- **VALIDATE**: `cd src && bun run typecheck && bun run lint`

### Phase 3: AI Tools Integration

**Goal**: Add AI tools for asset awareness and version management

**Tasks**:

#### UPDATE src/lib/studio/game-tools.ts
- **IMPLEMENT**: Add three new tools
- **PATTERN**: Follow existing tool patterns (lines 461-566)

**Tool 1: getLinkedAssets**
```typescript
export const getLinkedAssetsTool = (gameId: string) => {
  return tool({
    description: 'Get all assets linked to this game with their metadata',
    inputSchema: z.object({
      includeMetadata: z.boolean().default(true),
    }),
    execute: async ({ includeMetadata }) => {
      // Query GameAssetRef with asset data
      // Return formatted asset list with metadata
    },
  });
};
```

**Tool 2: getAssetUpdates**
```typescript
export const getAssetUpdatesTool = (gameId: string) => {
  return tool({
    description: 'Check if any linked assets have newer versions available',
    inputSchema: z.object({}),
    execute: async () => {
      // Call /api/studio/games/[id]/assets/updates
      // Return update list with change summaries
    },
  });
};
```

**Tool 3: syncAssetVersion**
```typescript
export const syncAssetVersionTool = (gameId: string) => {
  return tool({
    description: 'Sync a linked asset to its latest version',
    inputSchema: z.object({
      assetRefId: z.string(),
      reason: z.string().optional(), // For development log
    }),
    execute: async ({ assetRefId, reason }) => {
      // Call /api/studio/games/[id]/assets/[refId]/sync
      // Return sync result
    },
  });
};
```

**ADD**: Tools to `createGameTools()` return object (around line 1060)
- **VALIDATE**: `cd src && bun run typecheck && bun run lint`

#### UPDATE src/lib/studio/babylon-system-prompt.ts
- **IMPLEMENT**: Add dynamic asset awareness section
- **PATTERN**: Lines 126-142 for current asset section
- **ADD**: After current assets section, add:
```
## ASSET MANAGEMENT
You have tools to:
- getLinkedAssets: List all assets with metadata (animations, styles)
- getAssetUpdates: Check if newer versions are available
- syncAssetVersion: Update to latest asset version

When user mentions an asset by name, use getLinkedAssets to verify it exists.
When code loads assets, use ASSETS.load(key, scene) as documented.
```
- **VALIDATE**: `cd src && bun run typecheck`

### Phase 4: Frontend UI Components

**Goal**: Create UI for version conflict display

**Tasks**:

#### CREATE src/components/studio/VersionConflictBanner.tsx
- **IMPLEMENT**: Banner showing when updates are available
- **PATTERN**: Follow `SyncStatusBanner.tsx` pattern
- **PROPS**:
  - `gameId`: string
  - `updates`: Array of update info
  - `onReview`: () => void
  - `onSyncAll`: () => void
  - `onKeepCurrent`: () => void
- **UI**:
```
⚠️ Asset Updates Available
• treasure_chest: v1 → v2 (new animation)
• knight: v1 → v1 (no changes)
[Review Changes] [Sync All] [Keep Current]
```
- **VALIDATE**: `cd src && bun run lint`

#### CREATE src/components/studio/AssetVersionBadge.tsx
- **IMPLEMENT**: Small badge showing version status
- **PATTERN**: Follow `SharedContextIndicator.tsx:22-82`
- **TYPES**: "current", "outdated", "locked"
- **STYLES**:
  - Current: Green badge "v1"
  - Outdated: Yellow badge "v1 → v2"
  - Locked: Gray badge "v1 🔒"
- **VALIDATE**: `cd src && bun run lint`

#### UPDATE src/components/studio/AssetBrowser.tsx
- **ADD**: Version badges to asset cards
- **ADD**: "Check for Updates" button
- **PATTERN**: Follow existing asset display pattern
- **VALIDATE**: `cd src && bun run lint`

### Phase 5: Integration & Hook

**Goal**: Connect frontend to new APIs

**Tasks**:

#### CREATE src/hooks/useAssetUpdates.ts
- **IMPLEMENT**: Hook for checking and managing updates
- **PATTERN**: Follow `useProjectContext.ts:38-117`
- **FUNCTIONS**:
  - `checkForUpdates()` - Call updates API
  - `syncUpdate(refId)` - Sync specific asset
  - `syncAll()` - Sync all updates
  - `dismissUpdates()` - Clear update notifications
- **STATE**: updates list, isChecking, isSyncing
- **VALIDATE**: `cd src && bun run typecheck`

#### UPDATE src/app/api/studio/chat/route.ts
- **ADD**: getAssetUpdatesTool to gameTools (around line 137)
- **PATTERN**: Follow existing tool addition pattern
- **VALIDATE**: `cd src && bun run typecheck`

---

## TESTING STRATEGY

### Unit Tests

**Files to test**:
- `src/lib/studio/version-comparison.ts` - Test comparison logic
- `src/lib/studio/game-tools.ts` - Test tool outputs

**Test cases**:
- No updates available (clean state)
- Multiple updates available
- Single asset with new animations
- Single asset with new model URL
- Sync updates asset correctly
- Sync fails gracefully on error

**Pattern**: Follow `tests/integration/studio-chat.test.ts`

### Integration Tests

**API endpoints**:
- `GET /api/studio/games/[id]/assets/updates` returns correct structure
- `POST /api/studio/games/[id]/assets/[refId]/sync` updates version

**Test flow**:
1. Create game with linked assets
2. Regenerate source asset (update timestamp)
3. Call updates endpoint - should detect update
4. Call sync endpoint - should update GameAssetRef

### Edge Cases

- Asset deleted from source project
- Asset reference points to non-existent asset
- Multiple concurrent sync requests
- User without ownership calls API
- Network timeout during sync

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions.

### Level 1: Syntax & Style

```bash
cd src
bun run lint 2>&1 | head -50
bun run typecheck 2>&1
```

### Level 2: Unit Tests

```bash
cd src
bun run test:ci 2>&1 | head -100
```

### Level 3: Integration Tests

```bash
cd src
# API endpoint tests (manual or via integration tests)
curl -s http://localhost:3000/api/studio/games/test-id/assets/updates \
  -H "Authorization: Bearer <token>" \
  | jq .
```

### Level 4: Manual Validation

1. Create a project with assets
2. Link assets to a game
3. Regenerate an asset in Asset Hatch
4. Check `/api/studio/games/[id]/assets/updates` - should show update
5. Sync the update via UI
6. Verify GameAssetRef updated with new data

### Level 5: Build Verification

```bash
cd src
bun run build 2>&1 | tail -30
```

---

## ACCEPTANCE CRITERIA

- [ ] Phase 8a: AI can list assets with `getLinkedAssets` tool
- [ ] Phase 8a: AI can check for updates with `getAssetUpdates` tool
- [ ] Phase 8a: System prompt includes asset management section
- [ ] Phase 8b: API detects when assets have newer versions
- [ ] Phase 8b: UI shows version conflict banner with actions
- [ ] Phase 8b: Sync updates GameAssetRef with new data
- [ ] All validation commands pass with zero errors
- [ ] No regressions in existing functionality
- [ ] Code follows project conventions

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **Version Comparison Strategy**: Compare `lockedAt` timestamp vs source `updatedAt`. More reliable than content hashing for binary assets.

2. **Update Detection Timing**: Check updates on game load AND when AI tools are invoked. Lazy loading to avoid unnecessary queries.

3. **Sync Granularity**: Sync individual assets, not all at once. User can choose [Sync All] for convenience.

4. **AI Tool Design**: Three separate tools instead of one with flags for clarity. AI can understand "check for updates" vs "sync this asset".

### Trade-offs Acknowledged

- **Token Usage**: getLinkedAssets returns full metadata. Could be truncated for large asset counts.
- **N+1 Queries**: Current implementation does N queries for N assets. Acceptable for typical game (< 50 assets).
- **No Auto-Sync**: User must explicitly sync. Safer but requires action.

### Future Considerations

- Add caching layer for asset metadata
- Batch sync for multiple updates
- Diff visualization in UI
- Auto-sync with user preference toggle
- Integration with development log (record sync decisions)

---

## Report

**Full Path**: `.agents/plans/phase-8-ai-integration-asset-tools.md`

**Complexity Assessment**: Medium-High - Requires coordination across API, AI tools, and frontend. Multiple new files and modifications.

**Key Implementation Risks**:
1. Version comparison logic must handle deleted/missing assets gracefully
2. AI tool descriptions must be clear for LLM to use correctly
3. Frontend UI must handle empty states and loading correctly

**Confidence Score**: 8/10 - Plan is comprehensive, but AI tool behavior in production may require iteration based on LLM behavior.

**Estimated Files Created**: 6 new files
**Estimated Files Modified**: 5 existing files
**Estimated Lines Added**: ~800-1000 lines
