# Active State

## Current Session (2026-01-18)

### Issue: Asset Incorporation - From AI Plan to Game Code
**Status**: 🔴 In Progress - NEXT UP

**Problem Description**:
When user creates assets in Asset Gen Chat (plans, generates, approves assets), those assets need to be incorporated into the Game mode. Currently:
1. Assets exist as Generated3DAsset/Generated2DAsset records
2. Game mode has no way to browse and load these assets
3. No UI to view, filter, or add assets from the asset inventory
4. The bridge from "asset planning" to "asset usage in game" is missing

**Expected Behavior**:
1. User creates assets in Asset Gen Chat (planning → generation → approval)
2. Approved assets appear in Game mode automatically
3. Game mode has an "Asset Browser" panel showing all approved assets
4. AI can suggest assets from inventory for game scenes
5. User can drag/drop or click to add assets to scenes

**Next Phase**: Phase 9 - Asset Incorporation UI & Workflow

---

### Issue: Unified Project Creation - Auto-create and Link Both Modes
**Status**: ✅ Complete - RESOLVED

**Problem Description**:
When user creates a NEW project, BOTH game AND asset gen modes should be created and linked immediately.

**What Was Implemented**:
1. ✅ `src/app/api/projects/route.ts` - Always creates project + game + shared docs atomically
2. ✅ `src/lib/types/unified-project.ts` - Made startWith optional (backward compat)
3. ✅ `src/components/dashboard/NewProjectDialog.tsx` - Simplified UI, preserves tab selection
4. ✅ `src/components/studio/UnifiedProjectView.tsx` - Accepts initialTab prop from URL
5. ✅ `src/app/project/[id]/page.tsx` - Passes tab from searchParams to UnifiedProjectView
6. ✅ `src/lib/studio/shared-doc-tools.ts` - Created project-scoped tools (no gameId dependency)
7. ✅ `src/app/api/chat/route.ts` - Added shared docs import, fetch, and project-scoped tools

**Auto-Documentation Feature**:
- ✅ Updated system prompt to instruct AI to proactively update shared documents
- ✅ AI automatically updates game-design.md, asset-inventory.md, scene-notes.md, development-log.md
- ✅ No need for user to ask - AI docs as it plans

**Result**:
- User creates project → Both tabs appear immediately
- User selects "Assets First" → Redirects to Assets tab
- User selects "Game First" → Redirects to Game tab
- Shared documents auto-initialize and AI auto-updates them

---

### Phase 8b: Unified Project Architecture Fix
**Status**: ✅ Complete - RESOLVED

**Changes Made**:
- Project creation always creates unified project (project + game + shared docs)
- Removed conditional game creation flow
- Frontend simplified to single "start with" choice (UI only)
- Both modes accessible from unified /project/[id] page
- Initial tab determined by user selection in NewProjectDialog

**Key Files Changed**:
- `src/app/api/projects/route.ts`
- `src/components/dashboard/NewProjectDialog.tsx`
- `src/app/project/[id]/page.tsx`
- `src/components/studio/UnifiedProjectView.tsx`
- `src/lib/studio/shared-doc-tools.ts`
- `src/app/api/chat/route.ts`

---

### Phase 8: AI Integration & Asset Tools
- **Created Files**:
  - `src/lib/types/asset-version.ts` - Type definitions for version updates
  - `src/lib/studio/version-comparison.ts` - Version comparison logic (timestamp-based)
  - `src/app/api/studio/games/[id]/assets/updates/route.ts` - Update detection endpoint
  - `src/app/api/studio/games/[id]/assets/[refId]/sync/route.ts` - Sync action endpoint
  - `src/components/studio/AssetVersionBadge.tsx` - Version status badge (current/outdated/locked)
  - `src/components/studio/VersionConflictBanner.tsx` - Update notification banner with actions
  - `src/hooks/useAssetUpdates.ts` - Frontend hook for update management
- **Updated Files**:
  - `src/lib/studio/schemas.ts` - Added getLinkedAssetsSchema, getAssetUpdatesSchema, syncAssetVersionSchema
  - `src/lib/studio/game-tools.ts` - Added getLinkedAssetsTool, getAssetUpdatesTool, syncAssetVersionTool
  - `src/lib/studio/babylon-system-prompt.ts` - Added asset management section with tool descriptions
- **Key Achievements**:
  - AI can now query linked assets with `getLinkedAssets` tool
  - AI can check for updates with `getAssetUpdates` tool
  - AI can sync assets with `syncAssetVersion` tool
  - Frontend has UI components for version conflict display
  - Version comparison uses `lockedAt` vs `updatedAt` timestamps (correct strategy)

### Phase 7: Asset Loading in Preview
- **Status**: ✅ Complete - Committed `b830bd7`
- **Created Files**:
  - `src/lib/studio/asset-loader.ts` - ASSETS global helper generation
  - `src/app/api/studio/games/[id]/assets/route.ts` - Asset manifest API with REAL metadata
  - `src/lib/studio/asset-loader.test.ts` - Unit tests (Jest has pre-existing config issues)
- **Updated Files**:
  - `src/lib/studio/types.ts` - Added AssetInfo interface
  - `src/components/studio/PreviewFrame.tsx` - assetManifest prop, ASSETS injection
  - `src/components/studio/tabs/PreviewTab.tsx` - Fetches assets, passes to PreviewFrame
  - `src/lib/studio/babylon-system-prompt.ts` - ASSETS usage examples
  - `src/app/api/studio/chat/route.ts` - Fetches linked assets for AI
- **Key Achievement**: AI generates `await ASSETS.load("knight", scene)` with real metadata

### Phase 6b: Shared Context & Unified UI
- **Status**: ✅ Complete - Merged into Phase 7b
- **Spec**: Added Phase 6b to implementation-prd.md
- **Note**: Core context API implemented, enhanced in Phase 7b with rich metadata

### Phase 6 Implementation: Unified Project Architecture
- **Status**: ✅ Complete - All 15 tasks implemented
- **Created Files**:
  - `src/lib/types/unified-project.ts` - Type definitions for manifest, status, sync
  - `src/lib/studio/sync-tools.ts` - AI SDK tool for asset sync
  - `src/hooks/useProjectSync.ts` - Client hook for sync state management
  - `src/app/api/projects/[id]/status/route.ts` - Project status endpoint
  - `src/app/api/projects/[id]/assets/sync/route.ts` - Asset sync endpoint
  - `src/components/dashboard/NewProjectDialog.tsx` - Start path selection UI
  - `src/components/dashboard/UnifiedProjectCard.tsx` - Dashboard cards with game status
  - `src/components/dashboard/SyncStatusBanner.tsx` - Pending sync warning
  - `src/components/dashboard/AssetSyncButton.tsx` - Header sync button
- **Updated Files**:
  - `src/prisma/schema.prisma` - Extended Project/Game with unified fields
  - `src/app/api/projects/route.ts` - Added startWith option
  - `src/app/dashboard/page.tsx` - Unified dashboard with stats
  - `src/components/ui/ModeToggle.tsx` - Added hybrid mode
  - `src/app/api/export/route.ts` - Fixed colorPalette reference
- **Database**: ✅ Pushed with `db push --accept-data-loss`
- **Commit**: `49f478c`

### Phase 4B: Multi-File UI Connection
- **Status**: ✅ Fixed - Files now load in CodeTab
- **Changed Files**:
  - `src/components/studio/ChatPanel.tsx` - Tool call handling
  - `src/components/studio/StudioProvider.tsx` - Files state management
  - `src/components/studio/WorkspacePanel.tsx` - Layout integration
  - `src/components/studio/tabs/CodeTab.tsx` - File display
  - `src/lib/studio/context.ts` - Context updates

### Phase 3 Implementation: Hatch Studios AI Chat
- **Status**: ✅ Complete - All 8 tasks implemented

---

## Next Actions

### Phase 9: Asset Incorporation UI & Workflow

**Goal**: Bridge assets from Asset Gen Chat to Game Mode

**Tasks**:
1. Create Asset Browser panel in Game mode
2. Fetch approved assets from API
3. Display assets in browsable grid/list
4. Allow AI to reference assets when generating code
5. Enable drag-drop or click-to-add asset to scene
6. Auto-link asset metadata (name, type, metadata) to game usage

**Files to Create**:
- `src/components/studio/AssetBrowser.tsx` - Asset browsing UI
- `src/app/api/projects/[id]/assets/route.ts` - List approved assets for project
- `src/lib/studio/asset-integration.ts` - Helper to link assets to scenes

**Files to Update**:
- `src/components/studio/WorkspacePanel.tsx` - Add AssetBrowser tab
- `src/lib/studio/game-tools.ts` - Add browseAssets tool for AI
- `src/components/studio/PreviewFrame.tsx` - Support loading assets from inventory
