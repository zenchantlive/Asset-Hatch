# Feature: Hatch Studios Phase 2 - UI & Preview

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Phase 2 builds the user interface for Hatch Studios—a two-panel layout with resizable chat and workspace panels, tab navigation (Preview | Code | Assets), sandboxed Babylon.js preview iframe, Monaco editor integration, and asset browser that queries Asset Hatch library. This phase focuses on static/hardcoded content to establish layout and component patterns before Phase 3 adds AI tools.

**Goal**: Working UI with preview iframe displaying hardcoded Babylon.js scene, Monaco editor for code viewing/editing, and asset browser showing user's Asset Hatch assets.

## User Story

As a **game creator**
I want to **see a two-panel layout with chat, preview, code editor, and asset browser**
So that **I can interact with the studio interface before AI tools are integrated**

## Problem Statement

Phase 1 established database schema and API routes, but the studio pages are placeholder shells. Users cannot interact with the studio or see any game preview. Without a working UI, Phase 3 (AI tools) cannot demonstrate game generation visually.

## Solution Statement

Create a full two-panel layout using `react-resizable-panels` with chat on the left and tabbed workspace on the right. Implement preview iframe with postMessage communication, dynamic Monaco editor import, and asset browser querying the new `/api/studio/assets` endpoint. All components follow existing Asset Hatch patterns (~200 lines each).

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium-High
**Primary Systems Affected**: UI components, API routes, State management
**Dependencies**: Phase 1 (database + API routes must be complete)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/components/planning/ChatInterface.tsx` (full file) - Why: Pattern for useChat, forwardRef, message display, tool indicators
- `src/components/ui/AssetsPanel.tsx` (full file) - Why: Pattern for asset grid/detail display, 2D/3D switching
- `src/components/ui/assets/` (directory) - Why: Reusable asset sub-components (AssetTypeTabs, AssetGrid2D, etc.)
- `src/components/generation/GenerationLayoutContext.tsx` (full file) - Why: Context provider pattern for state
- `src/lib/studio/types.ts` (full file) - Why: TypeScript types created in Phase 1
- `src/app/api/studio/games/[id]/route.ts` - Why: Pattern for game data fetching

### New Files to Create

**Dependencies**
- NONE - use existing dependencies (no new npm packages needed)

**API Routes**
- `src/app/api/studio/assets/route.ts` - Asset query endpoint for browser

**Components (Main)**
- `src/components/studio/StudioLayout.tsx` - Two-panel resizable layout
- `src/components/studio/StudioProvider.tsx` - Context provider for studio state
- `src/components/studio/StudioHeader.tsx` - Header with tabs, export button
- `src/components/studio/ChatPanel.tsx` - Left panel with chat interface
- `src/components/studio/WorkspacePanel.tsx` - Right panel tab container

**Components (Tabs)**
- `src/components/studio/tabs/PreviewTab.tsx` - Sandboxed iframe + controls
- `src/components/studio/tabs/CodeTab.tsx` - Monaco editor wrapper
- `src/components/studio/tabs/AssetsTab.tsx` - Asset browser for studio

**Components (Utilities)**
- `src/components/studio/PreviewFrame.tsx` - Iframe with postMessage
- `src/components/studio/PlayControls.tsx` - Play/Pause/Restart buttons
- `src/components/studio/AssetBrowser.tsx` - Grid + detail for assets
- `src/components/studio/index.ts` - Barrel export

**Page Updates**
- `src/app/studio/[id]/page.tsx` - Update to use StudioLayout

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [react-resizable-panels Docs](https://react-resizable-panels.vercel.app)
  - Specific section: PanelGroup, Panel, PanelResizeHandle
  - Why: Two-panel resizable layout implementation
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-editor-react)
  - Specific section: Dynamic import, TypeScript support
  - Why: Code tab editor implementation
- [Babylon.js Playground](https://playground.babylonjs.com)
  - Specific section: iframe srcdoc pattern
  - Why: Understanding sandboxed game preview

### Patterns to Follow

**Naming Conventions:**
```typescript
// Components: PascalCase with descriptive names
// Props: interface with Props suffix
interface StudioLayoutProps {
  gameId: string;
  children?: React.ReactNode;
}

// Context: Provider suffix
// Hooks: use prefix
const useStudio = () => useContext(StudioContext);
```

**CSS Variables (from spec 7-ui-ux):**
```css
/* Extend Asset Hatch theme */
--studio-panel-bg: hsl(var(--card));
--studio-panel-border: hsl(var(--border));
--studio-preview-bg: #1a1a1a;
--studio-code-bg: #1e1e1e;
```

**Relative Units (from spec):**
```css
/* ✅ Correct */
.chat-panel { width: 35%; min-width: 20rem; padding: 1rem; }
/* ❌ Avoid pixels for sizing */
.chat-panel { width: 400px; padding: 16px; }
```

**Component File Pattern (~200 lines):**
```typescript
'use client';

import { ... } from '...';

// Types
interface ComponentProps { ... }

// Subcomponents (if small)
function SubComponent() { ... }

// Main component
export function Component({ ... }: ComponentProps) {
  // State
  // Effects
  // Handlers
  // Render
  return ( ... );
}
```

---

## IMPLEMENTATION PLAN

### Phase 2A: Dependencies & Setup

Install react-resizable-panels and @monaco-editor/react. Update CSS variables for studio theme.

**Tasks:**
- Install `react-resizable-panels` and `@monaco-editor/react`
- Add studio CSS variables to globals.css
- Create types for studio context state

### Phase 2B: Layout Components

Build the two-panel resizable layout with header and tab navigation.

**Tasks:**
- Create StudioProvider with context
- Create StudioLayout with PanelGroup
- Create StudioHeader with tabs
- Create ChatPanel shell
- Create WorkspacePanel with tab switching

### Phase 2C: Preview Tab

Implement sandboxed iframe with Babylon.js, play controls, and postMessage communication.

**Tasks:**
- Create PreviewFrame with srcdoc
- Create PlayControls component
- Create PreviewTab combining frame + controls
- Implement postMessage handlers

### Phase 2D: Code Tab

Implement Monaco editor with TypeScript support, read-only by default.

**Tasks:**
- Create CodeTab with dynamic Monaco import
- Add Babylon.js type definitions
- Implement run button functionality

### Phase 2E: Assets Tab & API

Implement asset browser with API endpoint and grid display.

**Tasks:**
- Create `/api/studio/assets` route
- Create AssetBrowser component
- Create AssetsTab wrapper
- Wire up asset selection to preview

### Phase 2F: Page Integration

Update studio page to use new layout and fetch game data.

**Tasks:**
- Update `[id]/page.tsx` to fetch game
- Integrate StudioProvider with game data
- Test full layout at all breakpoints

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: INSTALL Dependencies

- **IMPLEMENT**: Add `react-resizable-panels` and `@monaco-editor/react` to package.json
- **PATTERN**: Standard npm dependency installation
- **IMPORTS**: N/A
- **GOTCHA**: React 19 compatibility - both packages support it
- **VALIDATE**: `cd src && bun install && bun run typecheck`

```bash
cd src && bun add react-resizable-panels @monaco-editor/react
```

---

### Task 2: UPDATE `src/app/globals.css`

- **IMPLEMENT**: Add studio-specific CSS variables
- **PATTERN**: Extend existing :root and .dark blocks
- **IMPORTS**: N/A
- **GOTCHA**: Use relative units, only px for borders/shadows
- **VALIDATE**: `bun run build` (no CSS errors)

Add to CSS:
```css
/* Hatch Studios Variables */
:root {
  --studio-panel-bg: hsl(var(--card));
  --studio-panel-border: hsl(var(--border));
  --studio-preview-bg: #1a1a1a;
  --studio-code-bg: #1e1e1e;
  --studio-chat-width: 35%;
  --studio-min-chat-width: 20rem;
}
```

---

### Task 3: CREATE `src/lib/studio/context.ts`

- **IMPLEMENT**: Studio context types and hook
- **PATTERN**: Follow GenerationLayoutContext pattern
- **IMPORTS**: React, types from `./types.ts`
- **GOTCHA**: Don't put state logic here - just types and context creation
- **VALIDATE**: `bun run typecheck`

Types to define:
- `StudioContextValue` with state and actions
- `useStudio` hook for consuming context

---

### Task 4: CREATE `src/components/studio/StudioProvider.tsx`

- **IMPLEMENT**: Context provider with studio state management
- **PATTERN**: GenerationLayoutContext provider pattern
- **IMPORTS**: React, context from lib, types
- **GOTCHA**: Handle game data fetching/hydration from props
- **VALIDATE**: `bun run typecheck`

State to manage:
- `activeTab: 'preview' | 'code' | 'assets'`
- `code: string` (current scene code)
- `isPlaying: boolean`
- `previewKey: number` (for iframe refresh)

---

### Task 5: CREATE `src/components/studio/StudioHeader.tsx`

- **IMPLEMENT**: Header with game name, tabs, export button
- **PATTERN**: Shadcn/ui Button, editable input
- **IMPORTS**: Button, lucide-react icons
- **GOTCHA**: Tabs use URL params from spec (but we'll use context for MVP)
- **VALIDATE**: `bun run typecheck`

Props:
- `gameName: string`
- `onNameChange: (name: string) => void`
- `activeTab: 'preview' | 'code' | 'assets'`
- `onTabChange: (tab: string) => void`

---

### Task 6: CREATE `src/components/studio/ChatPanel.tsx`

- **IMPLEMENT**: Left panel with placeholder chat UI
- **PATTERN**: ChatInterface from planning (simplified)
- **IMPORTS**: TextareaAutosize, Button
- **GOTCHA**: Chat integration happens in Phase 3, this is shell only
- **VALIDATE**: `bun run typecheck`

Shell should show:
- Empty message area with placeholder text
- Disabled input field with "Coming in Phase 3" tooltip

---

### Task 7: CREATE `src/components/studio/WorkspacePanel.tsx`

- **IMPLEMENT**: Right panel with tab content switching
- **PATTERN**: Simple switch on activeTab
- **IMPORTS**: PreviewTab, CodeTab, AssetsTab (lazy load)
- **GOTCHA**: Use dynamic import for Monaco to avoid SSR issues
- **VALIDATE**: `bun run typecheck`

---

### Task 8: CREATE `src/components/studio/StudioLayout.tsx`

- **IMPLEMENT**: Two-panel resizable layout
- **PATTERN**: react-resizable-panels PanelGroup
- **IMPORTS**: Panel, PanelGroup, PanelResizeHandle
- **GOTCHA**: Mobile breakpoint shows chat-only (from spec)
- **VALIDATE**: `bun run typecheck`

Layout structure:
```
PanelGroup
├── Panel (chat, defaultSize=35)
├── PanelResizeHandle
└── Panel (workspace, defaultSize=65)
```

---

### Task 9: CREATE `src/components/studio/PreviewFrame.tsx`

- **IMPLEMENT**: Sandboxed iframe with Babylon.js code execution
- **PATTERN**: srcdoc with inline HTML/JS template
- **IMPORTS**: React, useEffect for postMessage
- **GOTCHA**: sandbox="allow-scripts" only, no localStorage
- **VALIDATE**: Render in browser, scene should appear

Props:
- `code: string` (Babylon.js code to execute)
- `isPlaying: boolean`
- `onReady: () => void`
- `onError: (message: string) => void`

---

### Task 10: CREATE `src/components/studio/PlayControls.tsx`

- **IMPLEMENT**: Play/Pause/Restart/Fullscreen controls
- **PATTERN**: Shadcn/ui Button group
- **IMPORTS**: Button, Play/Pause/RefreshCw/Maximize icons
- **GOTCHA**: Fullscreen uses native requestFullscreen API
- **VALIDATE**: `bun run typecheck`

---

### Task 11: CREATE `src/components/studio/tabs/PreviewTab.tsx`

- **IMPLEMENT**: Preview tab combining frame + controls
- **PATTERN**: Container component
- **IMPORTS**: PreviewFrame, PlayControls, useStudio
- **GOTCHA**: Show FPS badge from postMessage metrics
- **VALIDATE**: Load in browser, hardcoded scene renders

Hardcoded sample scene (Babylon.js):
```javascript
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.ArcRotateCamera('camera', 0, 1, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);
const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
BABYLON.MeshBuilder.CreateBox('box', {}, scene);
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
```

---

### Task 12: CREATE `src/components/studio/tabs/CodeTab.tsx`

- **IMPLEMENT**: Monaco editor with Babylon.js code
- **PATTERN**: Dynamic import, controlled component
- **IMPORTS**: Editor from @monaco-editor/react (dynamic)
- **GOTCHA**: Use `useEffect` for loading state to avoid hydration issues
- **VALIDATE**: Editor loads and displays code

Props (from context):
- `code: string`
- `onChange: (code: string) => void`
- `onRun: () => void`

---

### Task 13: CREATE `src/app/api/studio/assets/route.ts`

- **IMPLEMENT**: GET endpoint for querying user's Asset Hatch assets
- **PATTERN**: Mirror `/api/projects/[id]/assets` pattern
- **IMPORTS**: prisma, auth, NextResponse
- **GOTCHA**: Query across ALL user's projects (not just one)
- **VALIDATE**: `curl localhost:3000/api/studio/assets` returns assets

Query params:
- `type?: '2d' | '3d' | 'all'`
- `projectId?: string` (optional filter)
- `search?: string`
- `limit?: number` (default 50)
- `offset?: number`

---

### Task 14: CREATE `src/components/studio/AssetBrowser.tsx`

- **IMPLEMENT**: Grid of assets with detail panel
- **PATTERN**: Follow AssetsPanel.tsx structure
- **IMPORTS**: Asset types, thumbnail components
- **GOTCHA**: "Use in Game" button does nothing in Phase 2 (placeholder)
- **VALIDATE**: `bun run typecheck`

---

### Task 15: CREATE `src/components/studio/tabs/AssetsTab.tsx`

- **IMPLEMENT**: Wrapper fetching assets and rendering browser
- **PATTERN**: SWR or useEffect fetch
- **IMPORTS**: AssetBrowser, loading skeleton
- **GOTCHA**: Show "Create New Asset" → navigate to Asset Hatch
- **VALIDATE**: Assets display in browser

---

### Task 16: CREATE `src/components/studio/index.ts`

- **IMPLEMENT**: Barrel export for all studio components
- **PATTERN**: Standard barrel export
- **IMPORTS**: N/A
- **GOTCHA**: Export all public components
- **VALIDATE**: `bun run typecheck`

```typescript
export { StudioLayout } from './StudioLayout';
export { StudioProvider, useStudio } from './StudioProvider';
export { StudioHeader } from './StudioHeader';
export { ChatPanel } from './ChatPanel';
export { WorkspacePanel } from './WorkspacePanel';
export { PreviewTab } from './tabs/PreviewTab';
export { CodeTab } from './tabs/CodeTab';
export { AssetsTab } from './tabs/AssetsTab';
```

---

### Task 17: UPDATE `src/app/studio/[id]/page.tsx`

- **IMPLEMENT**: Replace placeholder with full StudioLayout
- **PATTERN**: Server component fetching game, client wrapper
- **IMPORTS**: StudioLayout, StudioProvider, auth, prisma
- **GOTCHA**: Handle 404 if game not found or not owned
- **VALIDATE**: Navigate to `/studio/[validId]` - full UI loads

---

### Task 18: ADD Mobile Responsive Styles

- **IMPLEMENT**: Mobile layout showing chat-only with desktop prompt
- **PATTERN**: CSS media queries or `useMediaQuery` hook
- **IMPORTS**: N/A
- **GOTCHA**: Below 48rem, workspace hidden per spec
- **VALIDATE**: Resize browser < 768px, see mobile layout

---

## TESTING STRATEGY

### Unit Tests

No unit tests for Phase 2 - UI components are verified manually.

### Integration Tests

Create basic render tests for new components:

```typescript
// src/tests/integration/studio-ui.test.tsx
describe('StudioLayout', () => {
  it('renders two panels', () => { ... });
  it('switches tabs correctly', () => { ... });
});
```

### Edge Cases

- Game not found (404 page)
- User doesn't own game (redirect to dashboard)
- No assets in Asset Hatch (empty state)
- Very long game names (truncation)
- Monaco loading failure (fallback)
- Iframe sandbox security violations (error boundary)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
bun run typecheck
bun run lint
```

### Level 2: Build Verification

```bash
bun run build
```

### Level 3: Integration Tests

```bash
# Existing tests still pass
bun run test src/tests/integration/

# New studio UI tests (create in implementation)
bun run test src/tests/integration/studio-ui.test.tsx
```

### Level 4: Manual Verification

1. **Layout Test**:
   - Navigate to `/studio/[validGameId]`
   - Verify two-panel layout appears
   - Drag resize handle - panels resize
   - Click Preview/Code/Assets tabs - content switches

2. **Preview Test**:
   - Preview tab shows Babylon.js scene (spinning cube)
   - Play/Pause buttons work
   - Restart button reloads scene
   - Fullscreen button expands iframe

3. **Code Test**:
   - Code tab shows Monaco editor
   - Editor displays Babylon.js code
   - Syntax highlighting works
   - "Run" button refreshes preview

4. **Assets Test**:
   - Assets tab shows user's approved assets
   - Grid displays thumbnails
   - Click asset shows detail panel
   - "Create New Asset" links to Asset Hatch

5. **Responsive Test**:
   - Resize browser to < 768px
   - Only chat panel visible
   - "Switch to desktop" message shown

### Level 5: Browser DevTools Check

- No console errors
- No React hydration warnings
- Network tab shows asset thumbnails loading
- Performance: FPS badge shows 60 in preview

---

## ACCEPTANCE CRITERIA

- [ ] Feature implements all specified functionality
- [ ] All validation commands pass with zero errors
- [ ] Two-panel resizable layout works correctly
- [ ] Tab navigation (Preview | Code | Assets) switches content
- [ ] Preview iframe displays hardcoded Babylon.js scene
- [ ] Play/Pause/Restart controls work
- [ ] Monaco editor loads and displays code
- [ ] Asset browser shows user's Asset Hatch assets
- [ ] Mobile layout shows chat-only with desktop prompt
- [ ] No regressions in existing Asset Hatch functionality
- [ ] Code follows project conventions (~200 lines per file)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms full UI works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **react-resizable-panels for layout**: Industry standard, lightweight, works with React 19.

2. **Monaco dynamic import**: Prevents 3MB+ bundle size from affecting initial load.

3. **Hardcoded sample scene**: Phase 2 shows static content - AI generation comes in Phase 3.

4. **Asset browser queries all projects**: Games can use assets from any user project, not just one.

5. **Chat disabled in Phase 2**: Prevents confusion - full chat comes in Phase 3 with tools.

### Risks

- Monaco editor React 19 compatibility - mitigated by using latest @monaco-editor/react
- Babylon.js in iframe security - mitigated by strict sandbox
- Asset browser performance with many assets - mitigated by lazy loading + virtualization

### Confidence Score: 8/10

High confidence due to:
- Existing UI patterns to follow (ChatInterface, AssetsPanel)
- Specs are detailed with component interfaces
- No complex AI integration yet

Minor uncertainty around:
- Monaco React 19 compatibility edge cases
- Babylon.js iframe postMessage reliability
- Mobile responsive edge cases
