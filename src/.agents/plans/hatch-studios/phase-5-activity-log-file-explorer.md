---
description: "Phase 5 implementation plan for Activity Log & File Explorer UI"
---

# Feature: Phase 5 - Activity Log & File Explorer UI

## Feature Description

Phase 5 adds visual feedback for AI actions and enhanced file navigation to the Hatch Studios editor. This phase builds on the multi-file infrastructure completed in Phase 4B to provide users with:

1. **Activity Log Panel** - Real-time visibility into AI tool calls and their status
2. **Enhanced File Explorer** - Visual file navigation with execution order indicators
3. **Tab Bar for Monaco** - Multiple file editing with tab-based interface
4. **File Execution Order Visualization** - Clear indication of file execution sequence
5. **Per-File Version History** - View and restore previous versions of files

## User Story

As a **game creator**
I want to see AI tool actions and navigate files visually
So that I can understand what's happening in my game and easily manage multiple code files

## Problem Statement

Phase 4B established multi-file support, but users have no visual feedback about:
- What files exist and their execution order
- What actions the AI is taking in real-time
- Which files are currently open for editing
- Previous versions of files for rollback

## Solution Statement

Create a comprehensive UI layer that:
1. Adds an activity log panel at the bottom of the workspace
2. Enhances the file explorer with execution order badges
3. Implements Monaco Editor tabs for multiple open files
4. Shows version history for each file with restore capability

---

## Feature Metadata

**Feature Type**: Enhancement (UI/UX layer on existing backend)
**Estimated Complexity**: Medium
**Primary Systems Affected**: StudioProvider, CodeTab, PreviewTab, new ActivityLog component
**Dependencies**: Phase 4B completion (multi-file infrastructure must be working)

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**State Management:**
- `src/components/studio/StudioProvider.tsx` (lines 1-209) - Multi-file state: `files: GameFileData[]`, `activeFileId`, `loadFiles()`, `updateFileContent()`
- `src/lib/studio/context.ts` (lines 1-69) - `StudioContextValue` interface definition

**UI Components:**
- `src/components/studio/tabs/CodeTab.tsx` (lines 1-263) - Current file explorer (Phase 4B) with Monaco integration
- `src/components/studio/tabs/PreviewTab.tsx` (lines 1-89) - Preview with controls bar
- `src/components/studio/WorkspacePanel.tsx` (lines 1-51) - Tab content switching

**Data Layer:**
- `src/lib/studio/types.ts` (lines 1-271) - `GameFileData`, `CodeVersionData` interfaces
- `src/prisma/schema.prisma` (lines 260-274) - `GameFile` model with `orderIndex`
- `src/prisma/schema.prisma` (lines 290-302) - `CodeVersion` model for version history

**Tool Execution:**
- `src/components/studio/ChatPanel.tsx` (lines 52-158) - `onToolCall` handler with switch case for tool names
- `src/lib/studio/game-tools.ts` (lines 684-752) - Creates `CodeVersion` records on file changes

### New Files to Create

- `src/components/studio/ActivityLog.tsx` - Activity log panel component
- `src/components/studio/FileExplorer.tsx` - Enhanced file explorer with execution order
- `src/components/studio/tabs/FileVersionHistory.tsx` - Per-file version history panel
- `src/lib/studio/activity-types.ts` - Activity log types and utilities
- `src/app/api/studio/games/[id]/files/[fileId]/versions/route.ts` - Version history API

### Relevant Documentation

- [Monaco Editor React Integration](https://microsoft.github.io/monaco-editor/) - Official docs for @monaco-editor/react
- [shadcn/ui ScrollArea](https://ui.shadcn.com/docs/components/scroll-area) - For activity log scroll behavior
- [shadcn/ui Tabs](https://ui.shadcn.com/docs/components/tabs) - For file tabs pattern

### Patterns to Follow

**Component Pattern (from CodeTab.tsx:23-46):**
```typescript
// Dynamic import for Monaco to avoid SSR
useEffect(() => {
    import('@monaco-editor/react').then((module) => {
        Editor = module.Editor;
        setEditorComponent(() => module.Editor);
        setIsEditorLoaded(true);
    });
}, []);
```

**State Update Pattern (from StudioProvider.tsx:144-148):**
```typescript
// Update content of a specific file
const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content } : f))
    );
}, []);
```

**Tool Call Handler (from ChatPanel.tsx:52-158):**
```typescript
onToolCall: ({ toolCall }: { toolCall: any }) => {
    switch (toolCall.toolName) {
        case 'createFile':
            loadFiles();
            refreshPreview();
            break;
        // ... other tools
    }
}
```

**Version History (from game-tools.ts:742-752):**
```typescript
// Create version history record
await prisma.codeVersion.create({
    data: {
        gameId,
        fileName: name,
        code: content,
        description: `Updated file: ${name}`,
        trigger: 'updateFile',
        createdAt: new Date(),
    },
});
```

---

## IMPLEMENTATION PLAN

### Phase 5.1: Activity Log Foundation

**Goal:** Create activity log data structure and basic panel UI

**Tasks:**
- Define `ActivityEntry` type with timestamp, tool name, status, details
- Add activity log state to StudioProvider
- Create basic ActivityLog.tsx component
- Wire ChatPanel onToolCall to activity log state
- Style panel to match studio aesthetic (glass-panel, dark theme)

### Phase 5.2: Enhanced File Explorer

**Goal:** Improve file explorer with execution order and visual polish

**Tasks:**
- Add order index badges to file list in CodeTab
- Add drag-and-drop reordering indicators (visual only, actual reorder via AI tools)
- Add file type icons based on extension
- Style active file state more prominently

### Phase 5.3: Monaco Editor Tab Bar

**Goal:** Implement VS Code-style tabs for multiple open files

**Tasks:**
- Create `openFileIds: string[]` state in StudioProvider
- Build tab bar component above Monaco editor
- Implement click-to-switch, close tab, and drag-to-reorder
- Persist open files to localStorage

### Phase 5.4: File Version History

**Goal:** View and restore previous file versions

**Tasks:**
- Create API endpoint for file version history
- Build version history panel (drawer or side panel)
- Show version list with timestamps and change descriptions
- Implement "Restore" button for each version
- Create new version on restore for audit trail

### Phase 5.5: Activity Log Polish

**Goal:** Complete activity log with filtering and status indicators

**Tasks:**
- Add status icons: ✅ (success), ⏳ (pending), ❌ (error)
- Add filtering by status type
- Add timestamp relative formatting (2s ago, 5m ago)
- Auto-scroll to new entries
- Clear log button

---

## STEP-BY-STEP TASKS

### Task 1: ADD activity types and state

**CREATE** `src/lib/studio/activity-types.ts`

```typescript
// Activity entry types for the activity log

export type ActivityStatus = 'pending' | 'success' | 'error';

export interface ActivityEntry {
    id: string;
    toolName: string;
    status: ActivityStatus;
    details: string;
    timestamp: Date;
    fileName?: string; // For file-related activities
    errorMessage?: string; // For error status
}

export interface ActivityFilter {
    status?: ActivityStatus[];
    toolNames?: string[];
}
```

**UPDATE** `src/lib/studio/context.ts`

- Add `activityLog: ActivityEntry[]` to `StudioContextValue`
- Add `addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void`
- Add `clearActivityLog: () => void`
- Add `setActivityFilter: (filter: ActivityFilter) => void`

**UPDATE** `src/components/studio/StudioProvider.tsx`

- Import `ActivityEntry` and add state: `const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])`
- Add callback functions for adding/clearing activities
- Include new functions in context value

---

### Task 2: CREATE ActivityLog component

**CREATE** `src/components/studio/ActivityLog.tsx`

- Use `ScrollArea` from shadcn/ui for scroll behavior
- Display entries in reverse chronological order (newest first)
- Show status icons: ⏳ for pending, ✅ for success, ❌ for error
- Format timestamps with relative time (e.g., "2s ago")
- Filter dropdown for status types
- Clear log button
- Height: 150-200px, collapsible

**PATTERN:** Follow CodeTab.tsx:138-197 for panel structure and styling

---

### Task 3: UPDATE ChatPanel to log activities

**UPDATE** `src/components/studio/ChatPanel.tsx`

- Import `useStudio` to get `addActivity`
- In `onToolCall` handler, call `addActivity` for each tool:

```typescript
case 'createFile':
    console.log('📄 File created:', toolCall.args?.name);
    addActivity({
        toolName: 'createFile',
        status: 'success',
        details: `Created ${toolCall.args?.name}`,
        fileName: toolCall.args?.name,
    });
    loadFiles();
    refreshPreview();
    break;

// For pending activities (before execution):
// addActivity({ toolName, status: 'pending', details: ... })
```

**Note:** The AI SDK `onToolCall` fires AFTER tool execution completes with result.
For pending state, we may need to track in-flight tool calls separately.

---

### Task 4: ENHANCE CodeTab file explorer

**UPDATE** `src/components/studio/tabs/CodeTab.tsx`

- Add order index badge next to filename: `{file.name} (0)`
- Add file type icon (JavaScript icon for .js files)
- Improve active file highlighting
- Add file count badge in sidebar footer

**Reference:** Current file explorer structure at lines 138-197

---

### Task 5: IMPLEMENT Monaco tab bar

**CREATE** `src/components/studio/FileTabs.tsx`

- Tab bar component above Monaco editor
- Shows all files in `openFileIds` state
- Active tab highlighted, close button on hover
- Drag-and-drop reorder using dnd-kit or similar
- "Open all files" button to open all files at once

**UPDATE** `src/components/studio/StudioProvider.tsx`

- Add `openFileIds: string[]` state (defaults to `[files[0]?.id]` when files exist)
- Add `openFile: (fileId: string) => void` to open a file
- Add `closeFile: (fileId: string) => void` to close a file
- Add `closeOtherFiles: (fileId: string) => void`
- Add `closeAllFiles: () => void`

**UPDATE** `src/components/studio/tabs/CodeTab.tsx`

- Replace single file tab with `FileTabs` component
- Keep Monaco editor, just change active file based on `activeFileId`

---

### Task 6: CREATE file version history API

**CREATE** `src/app/api/studio/games/[id]/files/[fileId]/versions/route.ts`

```typescript
// GET /api/studio/games/[gameId]/files/[fileId]/versions
export async function GET(request: Request, props: RouteParams) {
    const { id: gameId, fileId } = await props.params;
    
    // Verify ownership and fetch versions for this file
    const versions = await prisma.codeVersion.findMany({
        where: {
            gameId,
            fileName: fileName, // Need to look up filename from fileId
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Last 50 versions
    });
    
    return NextResponse.json({ success: true, versions });
}
```

**Note:** Need to lookup filename from `GameFile` table using `fileId`

---

### Task 7: CREATE version history panel

**CREATE** `src/components/studio/tabs/FileVersionHistory.tsx`

- Slide-over panel (shadcn Sheet or Drawer)
- List versions with timestamp and description
- "Restore" button for each version
- Shows what triggered each version (createFile, updateFile, user edit)
- Click to preview version content

**UPDATE** `src/components/studio/tabs/CodeTab.tsx`

- Add "History" button in toolbar
- Open version history panel when clicked
- Restore updates file content via `updateFileContent`

---

### Task 8: INTEGRATE all components into WorkspacePanel

**UPDATE** `src/components/studio/WorkspacePanel.tsx`

- The workspace currently shows PreviewTab, CodeTab, AssetsTab directly
- For Activity Log to appear at bottom, restructure:

```tsx
// Current structure:
<div className="h-full w-full bg-studio-panel-bg">
    {activeTab === 'preview' && <PreviewTab />}
    {activeTab === 'code' && <CodeTab />}
    {activeTab === 'assets' && <AssetsTab />}
</div>

// New structure with activity log:
<div className="h-full w-full flex flex-col bg-studio-panel-bg">
    <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' && <PreviewTab />}
        {activeTab === 'code' && <CodeTab />}
        {activeTab === 'assets' && <AssetsTab />}
    </div>
    {/* Activity log at bottom - collapsible */}
    <ActivityLog className="h-48 border-t border-studio-panel-border" />
</div>
```

**Alternative:** Activity log as a tab or collapsible section in PreviewTab

---

## TESTING STRATEGY

### Unit Tests

- Test `ActivityEntry` type creation and formatting
- Test `StudioProvider` activity log state updates
- Test version history API endpoint returns correct data
- Test tab open/close logic

### Integration Tests

- Test ChatPanel → Activity Log flow (tool call creates log entry)
- Test File Explorer → Tab bar → Monaco flow (open file, switch, close)
- Test Version History → Restore flow (fetch versions, restore, verify new version created)

### Edge Cases

- Empty file list (no files yet)
- Single file game (no tabs needed)
- Version history with no versions
- Network error when fetching versions
- Race condition: multiple file updates at once

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
cd src && bun run lint
cd src && bun run typecheck
```

### Level 2: Build Test

```bash
cd src && bun run build
```

### Level 3: Manual Testing

1. Create a new game and verify file explorer shows correctly
2. Chat to create a file, verify activity log shows entry
3. Create multiple files, verify tab bar appears
4. Edit a file, verify change persists
5. Test version history panel opens and shows versions
6. Test restore functionality

---

## ACCEPTANCE CRITERIA

- [ ] Activity log panel displays at bottom of workspace
- [ ] Each AI tool call creates a log entry with status
- [ ] File explorer shows execution order badges
- [ ] Monaco editor has tab bar for multiple open files
- [ ] File tabs can be opened, closed, and switched
- [ ] Version history panel shows past file versions
- [ ] Restore button creates a new version with restored content
- [ ] All validation commands pass
- [ ] No regressions in existing functionality

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

### Architecture Decisions

1. **Activity Log Storage**: Client-side only (React state) for real-time updates. Alternative: Server-sent events for persistence - deferred to future phase.

2. **Version History**: Uses existing `CodeVersion` table with `fileName` field. Could be improved with `fileId` FK in future migration.

3. **Tab Bar Position**: Above Monaco editor, below toolbar - follows VS Code pattern.

4. **Activity Log Position**: Bottom of workspace panel - matches PRD mockup.

### Future Considerations (Post-MVP)

- Server-side activity log persistence
- Activity filtering by date range
- Activity search functionality
- Per-file activity filtering
- Keyboard shortcuts for tab navigation
- Auto-save with version creation

### Gotchas

1. **Monaco Dynamic Import**: Must use `ssr: false` in dynamic import to avoid hydration errors (already done in WorkspacePanel.tsx)

2. **Tool Call Timing**: AI SDK `onToolCall` fires after execution. For pending state, may need to track via UI state or separate event.

3. **Version History Performance**: Limit to last 50 versions per file to avoid performance issues.

4. **Tab State Persistence**: Consider localStorage for open tabs to persist across page reloads.

---

## Implementation Order

1. **Week 1**: Activity Log (Tasks 1-3)
2. **Week 2**: File Explorer + Tabs (Tasks 4-5)
3. **Week 3**: Version History + Integration (Tasks 6-8)
