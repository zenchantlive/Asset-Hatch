---
description: "Phase 9: Asset Incorporation - Auto-link approved assets to games"
---

# Feature: Asset Auto-Incorporation in Game Mode

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Bridge assets from Asset Gen Chat to Game Mode automatically. When a game is linked to a project, all approved assets should automatically appear in Game mode—no manual linking required. This follows the shared documents pattern where AI auto-updates game-design.md, asset-inventory.md, etc.

## User Story

As a game developer
I want assets I created in Asset Hatch to automatically appear in my game
So that I can immediately use them without any manual setup

## Problem Statement

Currently:
1. Assets exist as `Generated3DAsset`/`Generated2DAsset` records with `approvalStatus: 'approved'`
2. Game mode has NO way to browse these assets
3. AssetBrowser has a disabled "Use in Game (Phase 3)" button that does nothing
4. The bridge from "asset planning" to "asset usage in game" is missing

## Solution Statement

Follow the shared documents pattern:
1. When a game is created from a project, auto-create `GameAssetRef` records for ALL approved assets
2. Remove the "Use in Game" button from AssetBrowser—no action needed
3. AI already receives `linkedAssets` via system prompt (see `chat/route.ts` lines 69-89)
4. AssetBrowser simply displays what's already linked (read-only view)

## Feature Metadata

**Feature Type**: Enhancement (auto-linking workflow)
**Estimated Complexity**: Low
**Primary Systems Affected**: 
- Game creation API (`src/app/api/studio/games/route.ts`)
- Asset Browser component (`src/components/studio/AssetBrowser.tsx`)
- Asset API (`src/app/api/studio/assets/route.ts`)
**Dependencies**: Phase 6 unified project (game.projectId link already exists)

---

## CONTEXT REFERENCES

### Relevant Codebase Files

- `src/app/api/studio/chat/route.ts` (lines 69-89) - How AI receives linked assets
- `src/app/api/studio/games/route.ts` - Game creation endpoint
- `src/components/studio/AssetBrowser.tsx` - Asset display (has disabled button to remove)
- `src/prisma/schema.prisma` (lines 338-375) - GameAssetRef model
- `src/lib/studio/game-tools.ts` (lines 457-562) - listUserAssetsTool implementation

### Files to Update

1. `src/app/api/studio/games/route.ts` - Add auto-linking of approved assets
2. `src/components/studio/AssetBrowser.tsx` - Remove "Use in Game" button, make read-only

### New Files to Create

None required—existing infrastructure handles the rest

### Patterns to Follow

**Shared Documents Pattern** (auto-init, no manual linking):
```typescript
// From chat/route.ts - AI already knows about linked assets
const linkedAssets = assetRefs.map(ref => ({
  key: ref.manifestKey || ref.assetName.toLowerCase().replace(/\s+/g, '_'),
  type: ref.assetType,
  name: ref.assetName,
  metadata: {},
}));
```

**GameAssetRef Creation** (from existing patterns):
```typescript
// From game-tools.ts placeAssetTool
const assetRef = await prisma.gameAssetRef.findFirst({
  where: { gameId, assetId },
});
```

---

## IMPLEMENTATION PLAN

### Phase 1: Auto-Link Approved Assets on Game Creation

**Objective**: When a game is created with a linked project, automatically create GameAssetRef records for all approved assets

**Tasks**:
- READ `src/app/api/studio/games/route.ts` to understand game creation flow
- ADD function to auto-create GameAssetRef records for approved 3D assets
- ADD function to auto-create GameAssetRef records for approved 2D assets
- CALL auto-link function after successful game creation
- VALIDATE: Approved assets from project appear in game.assetRefs

### Phase 2: Clean Up Asset Browser

**Objective**: Remove the "Use in Game" button since assets auto-appear

**Tasks**:
- READ `src/components/studio/AssetBrowser.tsx`
- REMOVE the disabled "Use in Game (Phase 3)" button (lines 197-203)
- REMOVE unused imports (Button if only used for that button)
- KEEP: Grid display, detail panel, filtering by type
- VALIDATE: No console errors, UI still renders correctly

### Phase 3: Verify AI Integration

**Objective**: Confirm AI receives asset information via existing system prompt

**Tasks**:
- VERIFY chat/route.ts already passes linkedAssets to system prompt (it does, lines 69-89)
- NO CHANGES needed—AI already has access to asset inventory
- VALIDATE: AI can reference assets in generated code using `ASSETS.load(key, scene)`

### Phase 4: Validation

**Tasks**:
- Run lint and typecheck
- Build succeeds
- Manual verification: Create project → generate assets → approve → create game → assets appear in Asset Browser

---

## STEP-BY-STEP TASKS

### {UPDATE} src/app/api/studio/games/route.ts

- **IMPLEMENT**: Add `autoLinkApprovedAssets` function
- **PATTERN**: Follow existing prisma patterns (transactional creation)
- **IMPORTS**: Add `prisma` import if not present
- **GOTCHA**: Handle case where no project is linked (game created standalone)
- **VALIDATE**: `bun run typecheck && bun run lint`

```typescript
/**
 * Auto-link all approved assets from a project to a game
 * Called after game creation to automatically make assets available
 */
async function autoLinkApprovedAssets(gameId: string, projectId: string): Promise<void> {
  console.log('🔗 Auto-linking approved assets from project:', projectId, 'to game:', gameId);

  // Fetch approved 3D assets
  const approved3D = await prisma.generated3DAsset.findMany({
    where: { projectId, approvalStatus: 'approved' },
  });

  // Fetch approved 2D assets
  const approved2D = await prisma.generatedAsset.findMany({
    where: { projectId, approvalStatus: 'approved' },
  });

  // Create GameAssetRef for each approved asset
  const assetRefs = [
    ...approved3D.map(asset => ({
      gameId,
      projectId,
      assetType: '3d' as const,
      assetId: asset.id,
      assetName: asset.name || asset.assetId,
      thumbnailUrl: asset.draftModelUrl || null,
      modelUrl: asset.riggedModelUrl || asset.draftModelUrl || null,
      glbUrl: asset.riggedModelUrl || null,
      manifestKey: (asset.name || asset.assetId).toLowerCase().replace(/\s+/g, '_'),
      createdAt: new Date(),
    })),
    ...approved2D.map(asset => ({
      gameId,
      projectId,
      assetType: '2d' as const,
      assetId: asset.id,
      assetName: asset.name || asset.assetId,
      thumbnailUrl: asset.thumbnailUrl || null,
      modelUrl: null,
      glbUrl: null,
      manifestKey: (asset.name || asset.assetId).toLowerCase().replace(/\s+/g, '_'),
      createdAt: new Date(),
    })),
  ];

  // Bulk create in transaction (skip duplicates)
  if (assetRefs.length > 0) {
    await prisma.$transaction(
      assetRefs.map(ref => 
        prisma.gameAssetRef.upsert({
          where: { gameId_assetId: { gameId, assetId: ref.assetId } },
          update: {}, // No update on duplicate
          create: ref,
        })
      )
    );
  }

  console.log('✅ Auto-linked', assetRefs.length, 'approved assets');
}
```

- **CALL**: After successful game creation:
```typescript
// After game creation in POST handler
if (game.projectId) {
  await autoLinkApprovedAssets(game.id, game.projectId);
}
```

### {UPDATE} src/components/studio/AssetBrowser.tsx

- **IMPLEMENT**: Remove "Use in Game" button and simplify detail panel
- **PATTERN**: Keep existing UI style (border-radius, gradients, icons)
- **GOTCHA**: Don't remove the detail panel—just the action button
- **VALIDATE**: `bun run typecheck && bun run lint`

Changes:
1. REMOVE the "Use in Game" Button section (lines 197-203)
2. The detail panel should just show asset info (name, type, prompt if available)
3. Keep the thumbnail display and metadata

---

## TESTING STRATEGY

### Manual Testing

1. **Asset Auto-Link Test**:
   - Create a new project
   - Generate and approve some 3D/2D assets
   - Create a game (or use existing linked game)
   - Open Asset Browser in Game mode
   - ✅ APPROVED assets appear automatically

2. **AI Asset Knowledge Test**:
   - In Game chat, ask "What assets do I have?"
   - ✅ AI lists the approved assets from the project
   - Ask AI to add an asset to the scene
   - ✅ AI generates code using `ASSETS.load(assetKey, scene)`

### Edge Cases

- **No approved assets**: Empty state should display correctly
- **Assets approved after game creation**: Future enhancement (Phase 9B)
- **Standalone game (no project)**: Auto-link function skips, empty asset browser

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
cd asset-hatch/src
bun run typecheck
bun run lint
```

### Level 2: Build

```bash
cd asset-hatch/src
bun run build
```

### Level 3: Manual Validation

1. Create project with assets → approve assets
2. Navigate to game mode
3. Open Asset Browser tab
4. ✅ Approved assets appear
5. ✅ No "Use in Game" button

---

## ACCEPTANCE CRITERIA

- [ ] Approved assets automatically appear in Game mode Asset Browser
- [ ] No manual "Use in Game" button required
- [ ] AI can reference assets via system prompt
- [ ] Lint and typecheck pass
- [ ] Build succeeds
- [ ] No console errors in browser

---

## COMPLETION CHECKLIST

- [ ] Game creation auto-links approved assets
- [ ] AssetBrowser "Use in Game" button removed
- [ ] All validation commands executed successfully
- [ ] Manual testing confirms feature works
- [ ] `active_state.md` updated with Phase 9 completion

---

## NOTES

**Design Decision**: Auto-linking on game creation is simpler than real-time sync. Future Phase 9B could add sync button for assets approved after game creation.

**Existing AI Integration**: No changes needed—the `chat/route.ts` already passes `linkedAssets` to the system prompt via `getBabylonSystemPrompt()`.

**Asset Browser API**: The existing `/api/studio/assets` route fetches from ALL user projects. For Phase 9, we may want to scope to linked project only (enhancement).
