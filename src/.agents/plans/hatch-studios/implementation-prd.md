# Hatch Studios Implementation PRD

**Version:** 1.1  
**Date:** 2026-01-18  
**Status:** Phase 4B In Progress - Frontend Integration Required

**Current Phase:** 4B - Multi-File Frontend Integration  
**Blocking Issue:** UI still uses single-file model; backend multi-file support exists but not connected

---

## 1. Executive Summary

Hatch Studios is an AI-powered game creation platform that transforms natural language descriptions into playable Babylon.js games. It integrates with Asset Hatch, allowing users to create 3D assets and games in a seamless, bidirectional workflow.

**Core Value Proposition:** "Roblox for adults, NLP-first, any visual style." Non-developers can describe their game vision and watch it come to life, while developers can access the code for fine-tuning.

**MVP Goal:** Ship a functional game studio where users can:
1. Describe a game in natural language
2. See AI generate running Babylon.js code
3. Use assets from Asset Hatch or create new ones
4. Export playable games

---

## 2. Mission

**Mission Statement:** Democratize game development by enabling anyone to create professional-quality 3D games through conversation.

**Core Principles:**
1. **NLP-First** - Natural language is the primary interface
2. **Novice-Friendly** - Hide complexity, show results
3. **Bidirectional** - Assets ↔ Games seamlessly
4. **AI-Managed** - Scenes, code, and complexity handled by AI
5. **Quality Without Limits** - Consistent code, unlimited creativity

---

## 3. Target Users

### Primary Persona: Creative Non-Developer
- **Profile:** Adult with game ideas but no coding skills
- **Technical Level:** Uses apps comfortably, never programmed
- **Pain Points:** "I have great game ideas but can't code them"
- **Goal:** See their game vision come to life

### Secondary Persona: Indie Developer
- **Profile:** Some coding experience, wants rapid prototyping
- **Technical Level:** Can read/edit code
- **Pain Points:** "Babylon.js is powerful but has a learning curve"
- **Goal:** Fast iteration on game mechanics

---

## 4. MVP Scope

### ✅ In Scope (Core Functionality)
- ✅ NLP-based game creation via chat
- ✅ Live preview in sandboxed iframe
- ✅ AI-managed multi-scene support
- ✅ Asset Hatch integration (query, load assets)
- ✅ Code generation following best practices
- ✅ Game state persistence (autosave)
- ✅ Export as standalone HTML

### ✅ In Scope (Technical)
- ✅ Prisma schema for games/scenes
- ✅ AI SDK v6 tools for game creation
- ✅ Babylon.js code generation skill
- ✅ Havok physics (Cannon fallback)
- ✅ Desktop-first responsive UI

### ❌ Out of Scope (Future Phases)
- ❌ Visual scene editor (Phase 2)
- ❌ Phone-specific game creation mode
- ❌ Multiplayer networking
- ❌ Asset marketplace integration
- ❌ Cloud hosting for games
- ❌ Custom physics engine support

---

## 5. User Stories

### Story 1: Basic Game Creation
> As a **creative non-developer**, I want to **describe my game idea in chat**, so that **I can see a playable version without coding**.

**Example:** User: "Make a platformer where a knight jumps between floating islands."  
**Result:** AI generates scene with platforms, player movement, and jumping.

### Story 2: Asset Integration
> As a **user with Asset Hatch assets**, I want to **use my 3D models in my game**, so that **my game has custom characters and props**.

**Example:** User has a "Dragon" model in Asset Hatch. Says "Add my dragon as an enemy."  
**Result:** AI loads the dragon, places it in scene, adds patrol behavior.

### Story 3: Game Iteration
> As a **game creator**, I want to **ask for changes in natural language**, so that **I can refine my game without learning code**.

**Example:** User: "Make the jump higher and add a double jump."  
**Result:** AI updates the code, preview hot-reloads.

### Story 4: Code Access
> As a **developer**, I want to **see and edit the generated code**, so that **I can fine-tune mechanics**.

**Example:** User toggles Code tab, edits jump velocity, clicks Run.  
**Result:** Preview updates with changes.

### Story 5: Scene Management
> As a **game creator**, I want to **describe multiple scenes**, so that **my game can have levels and menus**.

**Example:** User: "When the player reaches the flag, go to a victory screen."  
**Result:** AI creates second scene, adds transition logic.

### Story 6: Export
> As a **game creator**, I want to **export my game as a file**, so that **I can share it with others**.

**Example:** User clicks Export → receives single HTML file  
**Result:** Game runs offline in any browser.

---

## 6. Core Architecture & Patterns

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      HATCH STUDIOS                           │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ Chat Panel  │───▶│ AI + Tools  │───▶│ Preview Iframe  │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│                    ┌─────────────┐                           │
│                    │  Prisma DB  │                           │
│                    └─────────────┘                           │
│                           │                                   │
│                           ▼                                   │
│               ┌───────────────────────┐                      │
│               │  Asset Hatch Assets   │                      │
│               └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns
- **Spec-Driven Development** - Implement from specs, not ad-hoc
- **TDD for Critical Paths** - Tests first for data integrity
- **Tool-Based AI** - AI SDK v6 tools for all mutations
- **~200 Line Files** - Keep code organized and readable
- **Best Practices Injection** - AI always follows code standards

### Directory Structure (New)
```
src/
├── app/
│   └── studio/
│       ├── page.tsx              # Studio list
│       ├── new/
│       │   └── page.tsx          # New game creation
│       └── [id]/
│           └── page.tsx          # Game editor
├── components/
│   └── studio/
│       ├── StudioLayout.tsx
│       ├── ChatPanel.tsx
│       ├── PreviewTab.tsx
│       ├── CodeTab.tsx
│       └── AssetsTab.tsx
├── lib/
│   ├── studio/
│   │   ├── state.ts              # Studio state management
│   │   ├── tools.ts              # AI game tools
│   │   └── babylon-skill.ts      # Skill loader
│   └── ...
└── api/
    └── studio/
        ├── games/
        ├── chat/
        ├── preview/
        └── export/
```

---

## 7. Tools/Features

### AI Game Tools (from spec #4)

| Tool | Purpose |
|------|---------|
| `createScene` | Create new scene/level |
| `switchScene` | Change active scene |
| `placeAsset` | Add asset to scene |
| `setCamera` | Configure camera type |
| `enablePhysics` | Enable Havok/Cannon |
| `updateCode` | Update scene code |
| `addBehavior` | Add movement/AI to asset |
| `addInteraction` | Add click/proximity triggers |
| `listUserAssets` | Query Asset Hatch library |
| `createAsset` | Trigger Asset Hatch creation |

### UI Features

| Feature | Description |
|---------|-------------|
| Two-Panel Layout | Chat + Workspace (resizable) |
| Preview Tab | Sandboxed iframe with play controls |
| Code Tab | Monaco editor (hidden by default) |
| Assets Tab | Browse Asset Hatch library |
| Hot Reload | Preview updates on code change |

---

## 8. Technology Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Prisma + Neon
- **AI:** OpenRouter + AI SDK v6

### Game Engine
- **Engine:** Babylon.js 7.x
- **Physics:** Havok (primary), Cannon.js (fallback)
- **Preview:** Sandboxed iframe with srcdoc

### UI
- **Components:** shadcn/ui
- **Styling:** Tailwind CSS (relative units)
- **Editor:** Monaco (dynamic import)
- **Panels:** react-resizable-panels

---

## 9. Security & Configuration

### Authentication
- Existing Auth.js integration (GitHub, credentials)
- All studio routes require authenticated session
- Game data scoped to user

### Configuration
```env
# Existing (reused)
DATABASE_URL=...
OPENROUTER_API_KEY=...

# No new env vars for MVP
```

### Security Scope
- ✅ User data isolation
- ✅ Sandboxed preview (no localStorage access)
- ❌ Content moderation (future)
- ❌ Rate limiting (future)

---

## 10. API Specification

See **[3-api-endpoints.spec.md](./specs/hatch-studios/3-api-endpoints.spec.md)** for full details.

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/studio/games` | GET, POST | List/create games |
| `/api/studio/games/[id]` | GET, PATCH, DELETE | Game CRUD |
| `/api/studio/chat` | POST | Streaming chat with tools |
| `/api/studio/preview` | POST | Generate preview HTML |
| `/api/studio/export` | POST | Export game bundle |
| `/api/studio/assets` | GET | Query Asset Hatch library |

---

## 11. Success Criteria

### MVP Success Definition
A user can describe a simple game and export a working version without touching code.

### Functional Requirements
- ✅ Create game from text description
- ✅ Preview runs in browser
- ✅ Load Asset Hatch assets
- ✅ Multiple scenes work
- ✅ Export produces runnable HTML
- ✅ State persists across sessions

### Quality Indicators
- Preview loads < 3 seconds
- Code follows best practices structure
- No uncaught errors in preview
- Files under ~200 lines

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Database schema and API shell

**Deliverables:**
- ✅ Prisma models: `Game`, `GameScene`, `CodeVersion`, `GameAssetRef`
- ✅ Basic API routes (CRUD only, no chat)
- ✅ Route structure `/studio/[id]`
- ✅ Empty UI layout (components shell)

**Spec References:**
- [2-data-model.spec.md](./specs/hatch-studios/2-data-model.spec.md)
- [3-api-endpoints.spec.md](./specs/hatch-studios/3-api-endpoints.spec.md)
- [1-hatch-studios-architecture.spec.md](./specs/hatch-studios/1-hatch-studios-architecture.spec.md)

**Validation:**
- Run `prisma migrate dev` successfully
- All CRUD endpoints return expected data
- TDD tests pass for data integrity

---

### Phase 2: UI & Preview (Week 2-3)
**Goal:** Working UI with static preview

**Deliverables:**
- ✅ Two-panel layout (chat + workspace)
- ✅ Tab navigation (Preview | Code | Assets)
- ✅ Preview iframe with sample Babylon.js scene
- ✅ Monaco editor integration
- ✅ Asset browser (query only)

**Spec References:**
- [7-ui-ux.spec.md](./specs/hatch-studios/7-ui-ux.spec.md)
- [5-asset-integration.spec.md](./specs/hatch-studios/5-asset-integration.spec.md)

**Validation:**
- Layout renders correctly at all breakpoints
- Preview displays hardcoded scene
- Assets from Asset Hatch appear in browser

---

### Phase 3: AI Tools & Chat (Week 3-4)
**Goal:** Working chat with game generation

**Deliverables:**
- ✅ All 10+ game tools implemented
- ✅ Streaming chat route
- ✅ Tool execution updates game state
- ✅ Preview hot-reload on code change
- ✅ Best practices always in system prompt

**Spec References:**
- [4-game-tools.spec.md](./specs/hatch-studios/4-game-tools.spec.md)
- [6-babylon-skill.spec.md](./specs/hatch-studios/6-babylon-skill.spec.md)
- [babylon-best-practices.md](./specs/hatch-studios/babylon-best-practices.md)

**Validation:**
- User can describe game, see result
- Tools execute without errors
- Code follows best practices structure
- TDD tests pass for tool execution

---

### Phase 4A: Multi-File & Planning Backend (Week 4-5) ✅ COMPLETE
**Goal:** Database models, AI tools, and planning UI infrastructure

**Key Decisions Made (2026-01-17 Session):**
- **Two-Phase Workflow:** Planning → Building (no style phase for games)
- **Multi-File Architecture:** Games have multiple .js files executed in order
- **Plan as Markdown:** AI generates markdown document listing features + files
- **Keep AI SDK v6:** Decided against OpenCode SDK (designed for file-system coding, not in-memory)
- **Error Fix Flow:** User-initiated (button) rather than auto-fix

**Deliverables:**
- ✅ `GamePlan` Prisma model for storing plan markdown
- ✅ `GameFile` Prisma model for multi-file support
- ✅ Planning tools (`updatePlan`, `getPlan`)
- ✅ File management tools (`createFile`, `updateFile`, `deleteFile`, `listFiles`, `reorderFiles`)
- ✅ Planning page UI at `/studio/[gameId]/plan`
- ✅ Plan preview component with "Accept Plan" flow
- ✅ Error-fix button in preview (requests AI to fix)
- ✅ Fixed critical bugs (const reassignment, FK relations, UI desync)

**Status:** Backend infrastructure complete. **Migration required:** Run `bunx prisma migrate dev --name "add-game-plan-and-files"`

---

### Phase 4B: Multi-File Frontend Integration (Week 5) 🔄 IN PROGRESS
**Goal:** Connect multi-file backend to UI - files must be visible and functional

**Current Problem:** Backend is complete but UI still operates on single-file model. When AI calls `createFile`, files are saved to DB but UI doesn't display them.

**Critical Gaps:**
- ❌ **No API endpoint** to fetch GameFiles for a game
- ❌ **CodeTab** still reads from single `code` string in context (not GameFiles)
- ❌ **PreviewFrame** still uses single code string (not concatenated GameFiles)
- ❌ **StudioProvider** tracks `code: string` instead of `files: GameFile[]`
- ❌ **No file loading** on page mount - files exist in DB but never loaded into UI
- ❌ **ChatPanel tool handlers** don't update file state when `createFile`/`updateFile` called
- ❌ **PlayControls** still in UI (user doesn't want play/pause/restart buttons)

**Deliverables:**
- [ ] API endpoint: `GET /api/studio/games/[id]/files` - Fetch all GameFiles for a game
- [ ] Update `StudioProvider` to track `files: GameFile[]` instead of `code: string`
- [ ] Load files from API on page mount in `GameEditorPage`
- [ ] Update `CodeTab` to display files (file explorer + Monaco tabs)
- [ ] Update `PreviewFrame` to concatenate files in `orderIndex` order
- [ ] Update `ChatPanel` tool handlers to refresh files when `createFile`/`updateFile`/`deleteFile` called
- [ ] Remove `PlayControls` component from `PreviewTab`
- [ ] File concatenation logic: `files.sort((a,b) => a.orderIndex - b.orderIndex).map(f => f.content).join('\n\n')`

**Validation:**
- AI creates file → File appears in CodeTab file explorer
- AI updates file → CodeTab shows updated content
- Preview shows concatenated code from all files
- Files persist across page reloads

**New Database Models:**
```prisma
model GamePlan {
  id          String   @id @default(uuid())
  gameId      String   @unique
  content     String   @db.Text  // Markdown
  status      String   // 'draft' | 'accepted' | 'rejected'
}

model GameFile {
  id          String   @id @default(uuid())
  gameId      String
  name        String   // "main.js", "player.js"
  content     String   @db.Text
  orderIndex  Int      // Execution order
  @@unique([gameId, name])
}
```

**New Routing:**
```
/studio                    # Game list
/studio/new                # Create new game
/studio/[id]/plan          # Planning phase (NEW)
/studio/[id]               # Building phase (existing)
```

**Validation:**
- Planning chat generates plan markdown
- Plan preview renders features + files
- Accept Plan transitions to building phase
- File tools create/update/delete files correctly
- Error-fix button sends prompt to chat

---

### Phase 5: Activity Log & File Explorer UI (Week 5-6)
**Goal:** Visual feedback for AI actions and file navigation

**Prerequisites:** Phase 4B must be complete (files must be functional first)

**Deliverables:**
- [ ] Activity log panel showing tool call history
- [ ] File explorer sidebar in Code tab (enhancement of Phase 4B file display)
- [ ] Tab bar for open files in Monaco (multiple file editing)
- [ ] File execution order visualization
- [ ] Per-file version history view

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ WORKSPACE                                               │
├──────────────┬──────────────────────────────────────────┤
│ FILE EXPLORER│ [main.js] [player.js] [enemies.js]      │
│              │────────────────────────────────────────────│
│ ▸ main.js    │ // Player controls                       │
│ ▸ player.js  │ class Player {                           │
│ ▸ enemies.js │   constructor(scene) {                   │
│              │     this.mesh = BABYLON.MeshBuilder...   │
│              │   }                                       │
│              │ }                                         │
├──────────────┴──────────────────────────────────────────┤
│ ACTIVITY LOG                                            │
│ ✓ Created main.js (2s ago)                             │
│ ✓ Created player.js (1s ago)                           │
│ ⏳ Creating enemies.js...                               │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 6: Export & Polish (Week 6-7)
**Goal:** Complete MVP with export and final polish

**Deliverables:**
- [ ] Export as single HTML (concatenate all files)
- [ ] Export as ZIP with file structure
- [ ] Autosave every 30s
- [ ] Code history viewer (diff between versions)
- [ ] Mobile planning mode (ideation only)
- [ ] Loading states and skeleton UI
- [ ] Keyboard shortcuts (Cmd+S to save, Cmd+Enter to run)

**Export Strategy:**
```javascript
// Single HTML export concatenates files in order:
const combinedCode = files
  .sort((a, b) => a.orderIndex - b.orderIndex)
  .map(f => f.content)
  .join('\n\n');
```

---

### Phase 7: Testing & Documentation (Week 7-8)
**Goal:** Production-ready with tests and docs

**Deliverables:**
- [ ] Integration tests for chat → tool → DB flow
- [ ] Unit tests for file management tools
- [ ] E2E test: "Create game from description"
- [ ] User documentation (how to use Hatch Studios)
- [ ] Technical documentation (architecture decisions)

---

## 13. Future Considerations

### Phase 2+ Features (Post-MVP)
- Visual scene editor (drag-and-drop meshes)
- Phone-specific game creation mode
- Asset marketplace integration
- Cloud game hosting (play.hatchstudios.com)
- Multiplayer networking support
- WebXR/VR game creation

### Integration Opportunities
- WebXR for VR games
- Mobile export (via Capacitor)
- GLTF Pipeline improvements
- Blender MCP integration for asset creation

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI generates bad code | Game crashes | Best practices always in prompt, error handling |
| Babylon.js learning curve | Slow development | Skill references, templates |
| Preview security | XSS potential | Strict sandbox, no same-origin APIs |
| Scope creep | MVP delayed | Clear spec boundaries, defer non-MVP |
| Asset loading failures | Broken games | Graceful fallbacks, error states |

---

## 15. Appendix

### Related Documents
- [SPEC-FRAMEWORK.md](./specs/hatch-studios/SPEC-FRAMEWORK.md) - How specs work
- [prd-alignment.md](../../../.gemini/antigravity/brain/312c83a2-6ab3-4741-9113-3b260fe09e7b/prd-alignment.md) - Decision log

### Spec File Index

| # | Spec | Purpose |
|---|------|---------|
| 0 | [SPEC-FRAMEWORK.md](./specs/hatch-studios/SPEC-FRAMEWORK.md) | Development process |
| 1 | [1-hatch-studios-architecture.spec.md](./specs/hatch-studios/1-hatch-studios-architecture.spec.md) | Routes, state, components |
| 2 | [2-data-model.spec.md](./specs/hatch-studios/2-data-model.spec.md) | Prisma schema |
| 3 | [3-api-endpoints.spec.md](./specs/hatch-studios/3-api-endpoints.spec.md) | API routes |
| 4 | [4-game-tools.spec.md](./specs/hatch-studios/4-game-tools.spec.md) | AI tools |
| 5 | [5-asset-integration.spec.md](./specs/hatch-studios/5-asset-integration.spec.md) | Asset Hatch integration |
| 6 | [6-babylon-skill.spec.md](./specs/hatch-studios/6-babylon-skill.spec.md) | Code generation skill |
| 7 | [7-ui-ux.spec.md](./specs/hatch-studios/7-ui-ux.spec.md) | UI design |
| 8 | [babylon-best-practices.md](./specs/hatch-studios/babylon-best-practices.md) | Code standards |

---

## 16. Session Notes

### Session: 2026-01-17 - Architecture Refinement & Critical Bug Fixes

**Duration:** ~2 hours
**Focus:** Clarifying architecture decisions, fixing critical bugs, implementing multi-file support

#### What We Did

**1. Architecture Analysis**
- Deep dive into existing Hatch Studios codebase (29 untracked files)
- Identified 5 critical bugs, 3 high-severity issues, 5+ medium issues
- Mapped complete data flow: AI Tool → Database → UI

**2. Key Decisions Made**
- **Planning Phase:** Two-phase workflow (Plan → Build), no style phase
- **Multi-File:** Essential for MVP - games need multiple .js files
- **AI Framework:** Keep Vercel AI SDK v6 (OpenCode SDK doesn't fit our use case)
- **Error Handling:** User-initiated fix button, not auto-fix
- **Single Scene for MVP:** Multi-scene deferred to future phase

**3. Critical Bugs Fixed**
- `game-tools.ts:549-575`: Fixed const reassignment in `generateCameraSetupCode`
- `Prisma schema`: Added FK relation for `AssetPlacement.assetRefId`
- `ChatPanel.tsx`: Fixed UI desync - `switchScene` now loads scene code

**4. New Features Implemented**
- `GamePlan` model in Prisma schema
- `GameFile` model for multi-file support
- 7 new AI tools: `createFile`, `updateFile`, `deleteFile`, `listFiles`, `reorderFiles`, `updatePlan`, `getPlan`
- Planning page at `/studio/[gameId]/plan`
- Planning layout with chat + plan preview
- Error-fix button in PreviewFrame
- Plan API endpoint

#### Files Created/Modified

**Created:**
- `src/app/studio/[id]/plan/page.tsx` - Planning page route
- `src/components/studio/planning/GamePlanningLayout.tsx` - Planning UI
- `src/components/studio/planning/GamePlanChat.tsx` - Planning chat
- `src/components/studio/planning/GamePlanPreview.tsx` - Plan preview
- `src/components/studio/planning/index.ts` - Barrel export
- `src/app/api/studio/games/[id]/plan/route.ts` - Plan API

**Modified:**
- `src/prisma/schema.prisma` - Added GamePlan, GameFile, fixed FK relations
- `src/lib/studio/game-tools.ts` - Fixed camera code gen, added file/plan tools
- `src/lib/studio/schemas.ts` - Added file/plan schemas
- `src/lib/studio/context.ts` - Added error fix request mechanism
- `src/components/studio/StudioProvider.tsx` - Added refreshGame, loadSceneCode, error fix
- `src/components/studio/ChatPanel.tsx` - Fixed desync, added file tool handlers
- `src/components/studio/PreviewFrame.tsx` - Added error overlay with fix button
- `src/components/studio/tabs/PreviewTab.tsx` - Integrated error fix callback

#### What's Next (Priority Order)

**IMMEDIATE (Phase 4B - Frontend Integration):**
1. **Run Prisma Migration** - `cd src && bunx prisma migrate dev --name "add-game-plan-and-files"`
2. **Create Files API Endpoint** - `GET /api/studio/games/[id]/files` to fetch GameFiles
3. **Update StudioProvider** - Replace `code: string` with `files: GameFile[]` state
4. **Load Files on Mount** - Fetch files in `GameEditorPage` and pass to `StudioProvider`
5. **Update PreviewFrame** - Concatenate files in orderIndex order instead of single code string
6. **Update CodeTab** - Display file explorer sidebar + Monaco with file tabs
7. **Update ChatPanel Tool Handlers** - Refresh files state when `createFile`/`updateFile`/`deleteFile` called
8. **Remove PlayControls** - Delete component and remove from `PreviewTab`

**NEXT (Phase 5 - UI Enhancements):**
9. **Test Planning Flow** - Verify planning chat → plan preview → accept → redirect works
10. **Activity Log UI** - Show tool call history below preview
11. **File Explorer UI** - Enhanced sidebar in Code tab (already started in Phase 4B)
12. **Export Functionality** - Combine files into single HTML for export
13. **Integration Tests** - Test chat → tool → DB → UI flow

#### Technical Debt

- `Game.activeSceneId` still not a FK (intentional - avoid circular reference)
- localStorage for chat history (should be moved to server)
- No validation that `activeSceneId` belongs to the game in API layer
- PreviewFrame reloads entire iframe on code change (no hot-reload)

#### User Action Required

Before testing, run:
```bash
cd src && bunx prisma migrate dev --name "add-game-plan-and-files"
```

---

### Session: 2026-01-18 - Phase 4 Status Assessment & Frontend Integration Gap

**Duration:** ~30 minutes
**Focus:** Identifying gap between backend implementation and frontend integration

#### Current State Analysis

**What Was Built (Phase 4A - Backend):**
- ✅ Prisma models: `GamePlan`, `GameFile` (migration pending)
- ✅ 7 AI tools: `createFile`, `updateFile`, `deleteFile`, `listFiles`, `reorderFiles`, `updatePlan`, `getPlan`
- ✅ Planning page UI at `/studio/[gameId]/plan`
- ✅ Error-fix button in preview

**What's Missing (Phase 4B - Frontend Integration):**
- ❌ **No API endpoint** to fetch GameFiles - files exist in DB but can't be loaded
- ❌ **UI still single-file** - `CodeTab` and `PreviewFrame` use `code: string` from context
- ❌ **No file state management** - `StudioProvider` tracks single code string, not files array
- ❌ **No file loading** - Page doesn't fetch files on mount
- ❌ **Tool handlers incomplete** - `ChatPanel` doesn't update file state when tools execute
- ❌ **PlayControls still present** - User doesn't want play/pause/restart buttons

#### Root Cause

Backend infrastructure was built (Phase 4A) but frontend was never updated to use it. The UI still operates on the old single-file model where:
- `StudioProvider` has `code: string` 
- `CodeTab` displays this single string
- `PreviewFrame` executes this single string
- No mechanism exists to load/display multiple files

#### Required Changes

1. **State Management:** `StudioProvider` needs `files: GameFile[]` instead of `code: string`
2. **Data Loading:** `GameEditorPage` must fetch files from API and pass to provider
3. **API Endpoint:** Create `GET /api/studio/games/[id]/files` endpoint
4. **Preview Logic:** `PreviewFrame` must concatenate files in `orderIndex` order
5. **Code Display:** `CodeTab` needs file explorer + Monaco tabs for multiple files
6. **Tool Integration:** `ChatPanel` must refresh files when file tools execute
7. **UI Cleanup:** Remove `PlayControls` component

#### Phase Status

- **Phase 4A (Backend):** ✅ Complete
- **Phase 4B (Frontend Integration):** 🔄 In Progress - **BLOCKING MVP**
- **Phase 5 (UI Enhancements):** ⏸️ Blocked until 4B complete
