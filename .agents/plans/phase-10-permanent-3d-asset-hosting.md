# Feature: Permanent 3D Asset Hosting (Phase 10)

> Fix URL expiration issue by storing 3D assets as base64-encoded blobs in the database.

**Read before implementing:**
- `src/memory/active_state.md` - Current session context, the URL expiration problem
- `.claude/commands/validation/lattice.md` - First-principles analysis framework used for this design
- `CLAUDE.md` - Project conventions and critical gotchas

## Feature Description

Tripo3D generates 3D assets with signed CloudFront URLs that expire. When users approve assets in the generation phase, the URLs work for preview, but by the time they try to use those assets in the game generation phase, the URLs have expired and `ASSETS.load()` returns null.

This feature implements permanent 3D asset storage by:
1. Downloading GLB files from Tripo3D on asset approval
2. Converting to base64 and storing in the database
3. Serving assets as Blob URLs at game runtime
4. Communicating storage limits transparently with fun, developer-diary style messaging

## User Story

As a game creator using 3D assets,
I want my approved 3D models to load reliably in the game phase,
So that I can build my game without broken assets or URL errors.

## Problem Statement

**Current State:**
- `ASSETS.load("explorer_starship", scene)` returns null
- Tripo3D URLs contain time-limited signatures (Policy, Signature, Key-Pair-Id)
- Signatures expire between asset approval and game load time
- Assets are approved, linked, but unusable at runtime

**Root Cause:** We store Tripo3D URLs directly instead of the actual asset data.

## Solution Statement

**Phase 1 (Now):** Download approved 3D assets, store as base64 in `GameAssetRef.glbData`, serve as Blob URLs at runtime.

**Phase 2 (Later):** Add IndexedDB caching layer when users hit database limits.

**Phase 3 (Future):** Implement external storage (R2/S3) only if users genuinely need 30+ 3D assets.

## Feature Metadata

**Feature Type**: Bug Fix / Enhancement  
**Estimated Complexity**: Medium  
**Primary Systems Affected**:
- `src/app/api/generate-3d/approve/route.ts`
- `src/lib/studio/asset-loader.ts`
- `src/components/studio/tabs/AssetsTab.tsx`
- `src/prisma/schema.prisma`

**Dependencies**: None (no new packages needed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files (MANDATORY READING)

**1. `src/app/api/generate-3d/approve/route.ts` (lines 1-138)**
- Contains the approval flow that creates `GameAssetRef`
- This is where we'll add the download + base64 conversion
- Pattern: `asset.draftModelUrl` / `asset.riggedModelUrl` are the source URLs

**2. `src/lib/studio/asset-loader.ts` (lines 1-130)**
- Generates JavaScript for iframe's `ASSETS` global helper
- Line 59: `BABYLON.SceneLoader.ImportMeshAsync()` - needs to handle blob URLs
- Pattern: `asset.urls.glb || asset.urls.model` - this is where URL goes

**3. `src/prisma/schema.prisma` (lines 340-375)**
- `GameAssetRef` model definition
- Need to add `glbData String?` (or `BYTEA` for binary) column
- Existing fields: `thumbnailUrl`, `modelUrl`, `glbUrl` (all Strings)

**4. `src/lib/studio/types.ts` (lines 281-301)**
- `AssetInfo` interface for runtime asset data
- `urls: { thumbnail?, model?, glb? }` - needs `glbData` field
- `manifestEntryToAssetInfo()` function to update

**5. `src/lib/studio/game-tools.ts` (lines 491-507)**
- `listUserAssetsTool` queries `Generated3DAsset` for approved assets
- Returns `glbUrl: asset.riggedModelUrl || asset.draftModelUrl`
- Need to return `glbData` if present, fall back to URL

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/studio/asset-storage.ts` | Download + base64 conversion utilities |
| `src/components/studio/AssetCounter.tsx` | UI component showing asset count with fun messages |
| `src/components/studio/AssetLimitModal.tsx` | Dialog shown when approaching/exceeding limits |

### Patterns to Follow

**Naming Conventions:**
- Functions: `camelCase` with descriptive verbs (`downloadAssetAsBase64`)
- Types: `PascalCase` (`AssetStorageResult`)
- Constants: `SCREAMING_SNAKE_CASE` (`MAX_3D_ASSETS_LOCAL`)

**Error Handling:**
```typescript
try {
  // operation
} catch (error) {
  console.error('❌ Descriptive message:', error);
  return { success: false, error: 'user-friendly message' };
}
```

**Logging Pattern:**
- Use emoji prefixes for scannability (`🎨`, `📥`, `✅`, `❌`)
- Include context: `console.log('📥 Downloading asset:', assetName)`

---

## IMPLEMENTATION PLAN

### Phase 1: Database Schema

**Add `glbData` column to `GameAssetRef` model**

**Tasks:**
- UPDATE `src/prisma/schema.prisma` - add `glbData String? @db.Text` field
- RUN `bunx prisma migrate dev` - create and apply migration
- UPDATE `src/lib/types/asset-version.ts` if needed for TypeScript types

### Phase 2: Download & Storage Utilities

**Create `src/lib/studio/asset-storage.ts`**

**Tasks:**
- CREATE `downloadAssetAsBase64(url: string): Promise<string>` - fetches GLB, returns base64
- CREATE `createBlobUrl(base64Data: string): string` - converts to blob URL for runtime
- CREATE `AssetStorageResult` type with success/error states
- ADD error handling for fetch failures, invalid responses

### Phase 3: Approval Flow Integration

**Extend `src/app/api/generate-3d/approve/route.ts`**

**Tasks:**
- IMPORT new asset storage utilities
- AFTER `GameAssetRef` creation (line 98-119), ADD:
  - Download GLB from Tripo3D URL
  - Convert to base64
  - Update `GameAssetRef` with `glbData`
- ADD progress logging for large asset downloads
- HANDLE timeout errors gracefully (asset still usable via URL fallback)

### Phase 4: Runtime Loader Update

**Extend `src/lib/studio/asset-loader.ts` to handle blob URLs**

**Tasks:**
- MODIFY `generateAssetLoaderScript()` to pass `glbData` to iframe
- ADD blob URL handling in `ASSETS.load()` function
- DETECT data URL format (`data:application/octet-stream;base64,...`)
- UPDATE `validateAssetInfo()` to accept new `glbData` field

### Phase 5: Asset Counter UI (Fun + Transparent)

**Create `src/components/studio/AssetCounter.tsx`**

**Tasks:**
- DISPLAY current 3D asset count (from `GameAssetRef` where `glbData` exists)
- SHOW progress bar (e.g., "5/10 assets loaded - Room for more!")
- IMPLEMENT fun threshold messages:
  - 0-5: "Your backpack is light!"
  - 6-8: "Starting to feel the weight..."
  - 9-10: "Backpack full! Choose wisely."
  - 11+: "Epic creation! But browser storage is sweating."

**Thresholds:**
```typescript
const ASSET_THRESHOLDS = {
  SAFE: 10,
  WARNING: 8,
  CRITICAL: 10,
  LIMIT: 15, // Browser IndexedDB practical limit for base64
};
```

### Phase 6: Limit Handling & Fallback

**Create `src/components/studio/AssetLimitModal.tsx`**

**Tasks:**
- SHOW modal when user tries to approve 11th+ asset
- EXPLAIN the limit with developer-diary humor:
  > "You've packed 11 3D assets into your game! Your browser is sweating. This is a good problem - you've built something epic."
- OFFER options:
  1. **"Continue anyway"** - Load on demand, some assets may lag
  2. **"Download bundle"** - Self-contained game export
  3. **"Connect cloud storage"** - (Link to future R2/S3 feature, disable for now)

### Phase 7: Integration & Testing

**Tasks:**
- CONNECT `AssetCounter` to `AssetsTab.tsx`
- TEST approval flow: URL → download → base64 → store
- TEST game preview: base64 → blob URL → Babylon.js loads
- TEST fallback: if `glbData` missing, use `glbUrl` (backward compatible)
- VERIFY `bun run lint` and `bun run typecheck` pass

---

## STEP-BY-STEP TASKS

### {CREATE} `src/lib/studio/asset-storage.ts`

- **IMPLEMENT**: Download utility for Tripo3D GLB files
- **PATTERN**: `src/app/api/generate-3d/approve/route.ts:52-62` (asset fetch pattern)
- **IMPORTS**: `fetch` from global (no import needed in Node 18+)
- **GOTCHA**: Set timeout for large file downloads, handle redirect responses
- **VALIDATE**: `bun run typecheck`

```typescript
/**
 * Download asset from URL and convert to base64
 * @param url - Tripo3D signed URL
 * @returns Base64 encoded GLB data
 */
export async function downloadAssetAsBase64(url: string): Promise<string> {
  // Implementation here
}

/**
 * Convert base64 to Blob URL for runtime use
 * @param base64Data - Base64 encoded GLB
 * @returns Blob URL string
 */
export function createBlobUrl(base64Data: string): string {
  // Implementation here
}
```

### {UPDATE} `src/prisma/schema.prisma`

- **MODIFY**: `GameAssetRef` model (lines 340-375)
- **ADD FIELD**:
  ```prisma
  glbData String? @db.Text  // Base64-encoded GLB data for permanent storage
  ```
- **VALIDATE**: `bunx prisma validate` (check schema syntax)
- **RUN MIGRATION**: `bunx prisma migrate dev --name add_glb_data_column`

### {UPDATE} `src/app/api/generate-3d/approve/route.ts`

- **MODIFY**: After `GameAssetRef` creation (around line 119)
- **ADD**:
  ```typescript
  // Download GLB and store as base64 for permanent access
  if (project.gameId) {
    const sourceUrl = asset.riggedModelUrl || asset.draftModelUrl;
    if (sourceUrl) {
      try {
        const glbData = await downloadAssetAsBase64(sourceUrl);
        await prisma.gameAssetRef.update({
          where: { id: createdRef.id },
          data: { glbData },
        });
        console.log('📦 Stored GLB data for asset:', asset.name || asset.assetId);
      } catch (error) {
        console.warn('⚠️ Failed to store GLB data, will use URL fallback:', error);
      }
    }
  }
  ```
- **IMPORT**: `{ downloadAssetAsBase64 } from '@/lib/studio/asset-storage'`
- **GOTCHA**: Don't block approval on download failure - URL fallback works
- **VALIDATE**: `bun run typecheck`

### {UPDATE} `src/lib/studio/asset-loader.ts`

- **MODIFY**: `generateAssetLoaderScript()` function
- **UPDATE** to include `glbData` in asset info:
  ```typescript
  // Pass base64 data if available, fallback to URL
  const assetData = asset.glbData 
    ? `data:application/octet-stream;base64,${asset.glbData}`
    : (asset.urls.glb || asset.urls.model);
  ```
- **ADD** blob URL handling in `ASSETS.load()`:
  ```javascript
  if (assetData.startsWith('data:')) {
    // Handle base64 data URL directly
    return BABYLON.SceneLoader.ImportMeshAsync('', '', assetData.split(',')[1], scene, ...
  }
  ```
- **GOTCHA**: Split data URL properly - `ImportMeshAsync` expects (root, url, filename, scene)
- **VALIDATE**: `bun run lint` and `bun run typecheck`

### {CREATE} `src/components/studio/AssetCounter.tsx`

- **IMPLEMENT**: React component with:
  - `useAssetCount()` hook to get current 3D asset count
  - Progress bar visualization
  - Fun threshold messages based on count
- **PATTERN**: Follow existing component patterns in `src/components/studio/`
- **STYLE**: Use Tailwind CSS, match project design system
- **VALIDATE**: `bun run lint`

### {CREATE} `src/components/studio/AssetLimitModal.tsx`

- **IMPLEMENT**: Radix UI Dialog with:
  - Fun, honest messaging about the limit
  - Options: Continue anyway / Download bundle / Learn more
  - Developer-diary tone throughout
- **PATTERN**: Reuse existing Dialog components from shadcn/ui
- **GOTCHA**: Don't block user - always offer "Continue anyway" option
- **VALIDATE**: `bun run lint`

### {UPDATE} `src/components/studio/tabs/AssetsTab.tsx`

- **IMPORT**: `AssetCounter` component
- **ADD** to UI (top of asset list)
- **CONNECT**: Asset limit detection logic
- **GOTCHA**: Only count 3D assets with `glbData`, not 2D assets
- **VALIDATE**: `bun run typecheck`

### {UPDATE} `src/lib/studio/types.ts`

- **MODIFY**: `AssetInfo` interface (lines 281-301)
- **ADD**:
  ```typescript
  urls: {
    thumbnail?: string;
    model?: string;
    glb?: string;
    glbData?: string;  // Base64-encoded GLB for permanent storage
  }
  ```
- **UPDATE**: `manifestEntryToAssetInfo()` to include `glbData`
- **VALIDATE**: `bun run typecheck`

### {TEST} End-to-End Flow

- **RUN**: `bun dev` to start dev server
- **TEST**:
  1. Generate a 3D asset via Tripo3D
  2. Approve the asset
  3. Verify `GameAssetRef.glbData` column has base64 data
  4. Open game preview
  5. Verify `ASSETS.load()` returns valid mesh (not null)
- **VALIDATE**: All console logs show correct flow, no 403 errors

---

## TESTING STRATEGY

### Unit Tests

**`src/lib/studio/asset-storage.test.ts`**
- Test `downloadAssetAsBase64()` with mock fetch
- Test `createBlobUrl()` with sample base64 data
- Test error handling for invalid URLs

**`src/components/studio/AssetCounter.test.tsx`**
- Test threshold message display
- Test progress bar calculation

### Integration Tests

**`src/app/api/generate-3d/approve/route.test.ts`**
- Test that `glbData` is stored on approval
- Test fallback when download fails
- Test URL still stored when `glbData` save fails

### Edge Cases

1. **Large GLB files** (>10MB) - May timeout, need timeout handling
2. **Download failures** - Fall back to URL, log warning
3. **Corrupted base64** - Validate before storing
4. **Browser memory limits** - Show limit modal before 11th asset
5. **Mixed 2D/3D assets** - Only 3D assets count toward limit

---

## VALIDATION COMMANDS

Execute in order:

```bash
# Level 1: Syntax & Style
cd src
bun run lint
bun run typecheck

# Level 2: Database
bunx prisma validate
bunx prisma migrate dev --name add_glb_data_column

# Level 3: Unit Tests
bun run test -- --testPathPattern="asset-storage|AssetCounter"

# Level 4: Integration
# Manual test flow:
# 1. bun dev (start server)
# 2. Generate + approve 3D asset
# 3. Check Prisma studio for glbData column
# 4. Open game preview, verify ASSETS.load works
```

---

## ACCEPTANCE CRITERIA

- [ ] `GameAssetRef.glbData` column exists and stores base64
- [ ] Approved 3D assets download from Tripo3D and store permanently
- [ ] `ASSETS.load()` in game preview returns valid mesh (not null)
- [ ] Fallback to URL works if `glbData` missing
- [ ] Asset counter shows fun messages at thresholds
- [ ] Limit modal shown when approaching 11+ assets
- [ ] All validation commands pass (lint, typecheck, tests)
- [ ] No regressions in 2D asset flow

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
- [ ] `active_state.md` updated with Phase 10 completion
- [ ] Blog post stub added if developer-diary worthy

---

## NOTES

### Design Decisions

1. **Base64 in VARCHAR vs BYTEA**: Using `@db.Text` (VARCHAR) for base64 is easier to debug and query, even though it uses more storage. Simplicity wins for MVP.

2. **Approval-time download**: Downloading on approval adds latency to approval, but ensures assets are ready for game phase. Alternative: download on first game load (faster approval, slower first load). Chose approval-time for reliability.

3. **10-asset limit**: Based on practical IndexedDB limits and typical game size. Mobile browsers hit limits around 50MB-200MB. 10 × 1-2MB assets = comfortable buffer.

### Tradeoffs Acknowledged

- **Storage size**: Base64 is 33% larger than binary. Acceptable for MVP, can optimize later.
- **Memory usage**: Large games may hit browser limits. IndexedDB fallback planned for Phase 2.
- **No CDN**: Slower than CDN, but zero infrastructure cost. Acceptable for open source.

### Future Enhancements (Out of Scope)

- **IndexedDB caching** (Phase 2) - When users hit the 10-asset ceiling
- **R2/S3 integration** (Phase 3) - Only if users genuinely need 30+ assets
- **Asset compression** - GLB compression for smaller storage
- **Progressive loading** - Load assets on demand, not all at once

### Fun Messaging Reference

| Count | Message | Tone |
|-------|---------|------|
| 0-3 | "Your backpack is light! Time to fill it up." | Encouraging |
| 4-6 | "Nice collection starting to form!" | Positive |
| 7-8 | "Starting to feel the weight..." | Friendly warning |
| 9-10 | "Backpack full! Choose your next addition wisely." | Urgent but kind |
| 11+ | "Epic creation! But your browser is sweating." | Honest + options |
