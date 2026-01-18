# Next Session Prompt - Phase 4B: Frontend Integration

## Context

I'm working on Hatch Studios (AI-powered game creation platform). We're in **Phase 4B - Multi-File Frontend Integration**, which is blocking MVP completion.

## Current Situation

**What's Done (Phase 4A - Backend):**
- ✅ Prisma models: `GamePlan`, `GameFile` (migration pending)
- ✅ AI tools: `createFile`, `updateFile`, `deleteFile`, `listFiles`, `reorderFiles`, `updatePlan`, `getPlan`
- ✅ Planning page UI at `/studio/[gameId]/plan`
- ✅ Files are being saved to database when AI calls tools

**The Problem:**
The backend infrastructure is complete, but the UI still operates on the old single-file model. When the AI calls `createFile`, files are saved to the database but:
- The UI doesn't fetch or display them
- `CodeTab` still shows a single hardcoded `code` string from context
- `PreviewFrame` doesn't concatenate files - it uses a single code string
- `StudioProvider` tracks `code: string` instead of `files: GameFile[]`
- No API endpoint exists to fetch GameFiles
- `PlayControls` component still exists (user doesn't want play/pause/restart buttons)

## What Needs to Be Done

**Priority 1 - Critical Path (Must Complete):**
1. **Create Files API Endpoint** - `GET /api/studio/games/[id]/files` to fetch all GameFiles for a game
2. **Update StudioProvider** - Replace `code: string` with `files: GameFile[]` state management
3. **Load Files on Page Mount** - Update `GameEditorPage` to fetch files and pass to `StudioProvider`
4. **Update PreviewFrame** - Concatenate files in `orderIndex` order instead of using single code string
5. **Update CodeTab** - Display file explorer sidebar + Monaco editor with file tabs
6. **Update ChatPanel Tool Handlers** - Refresh files state when `createFile`/`updateFile`/`deleteFile` tools execute
7. **Remove PlayControls** - Delete the component and remove from `PreviewTab`

**Priority 2 - Testing:**
9. Test that AI can create files and they appear in UI
10. Test that preview shows concatenated code from all files
11. Test that files persist across page reloads

## Key Files to Modify

- `src/app/api/studio/games/[id]/files/route.ts` - **CREATE NEW** - API endpoint to fetch files
- `src/lib/studio/context.ts` - Update `StudioContextValue` interface
- `src/components/studio/StudioProvider.tsx` - Replace `code: string` with `files: GameFile[]`
- `src/app/studio/[id]/page.tsx` - Load files on mount
- `src/components/studio/PreviewFrame.tsx` - Concatenate files for preview
- `src/components/studio/tabs/CodeTab.tsx` - Add file explorer + multi-file Monaco
- `src/components/studio/ChatPanel.tsx` - Update tool handlers to refresh files
- `src/components/studio/tabs/PreviewTab.tsx` - Remove `PlayControls` import and usage
- `src/components/studio/PlayControls.tsx` - **DELETE** this file

## File Concatenation Logic

When previewing or exporting, files should be concatenated like this:
```typescript
const combinedCode = files
  .sort((a, b) => a.orderIndex - b.orderIndex)
  .map(f => f.content)
  .join('\n\n');
```

## Success Criteria

After this session:
- ✅ AI creates file → File appears in CodeTab file explorer
- ✅ AI updates file → CodeTab shows updated content
- ✅ Preview shows concatenated code from all files in order
- ✅ Files persist across page reloads
- ✅ No PlayControls in UI
- ✅ Migration has been run

## Reference

See `src/.agents/plans/hatch-studios/implementation-prd.md` for full context, especially:
- Phase 4B section (lines ~415-450)
- Session notes from 2026-01-18
- Current phase status

---

**Start by running the migration, then create the files API endpoint, then work through the state management updates.**
