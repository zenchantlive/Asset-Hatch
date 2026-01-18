# Active State

## Current Session (2026-01-17)

### Phase 6b: Shared Context & Unified UI
- **Status**: 🔄 In Progress - Planning complete, implementation pending
- **Spec**: Added Phase 6b to implementation-prd.md
- **Removed**: "Both Together" start path (no screen real estate)
- **Added**: Shared context document architecture for tab-aware AI

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

## Known Issues

### Issue: API Parameter Mismatch
**Date**: 2026-01-17
**Status**: Open - Investigation needed

**Description**:
When using `/api/studio/chat`, the server logs show:
```
❌ Chat API: projectId is missing or empty
POST /api/chat 400
```

However, the `/api/studio/chat/route.ts` expects `{ messages, gameId }` in the request body, and the ChatPanel is configured to pass `{ gameId }` via the body parameter.

**Root Cause**: Unknown - needs investigation in development environment

**Impact**: Users cannot send messages through the Hatch Studios chat panel

**Expected Behavior**:
- ChatPanel should call `/api/studio/chat` endpoint
- Body should contain `{ gameId: string }`
- Server should extract `gameId` from body

**Observed Behavior**:
- Request goes to `/api/chat` (old Asset Hatch endpoint) instead
- Server reports `projectId` as undefined
- Returns 400 Bad Request

**Files Affected**:
- `src/components/studio/ChatPanel.tsx`
- `src/app/api/studio/chat/route.ts`
- `src/components/studio/StudioLayout.tsx` (passes gameId correctly)

**Next Steps**:
1. Verify which endpoint ChatPanel is actually calling
2. Check if there's a route conflict between `/api/chat` and `/api/studio/chat`
3. Ensure request body is properly formatted on the client side
