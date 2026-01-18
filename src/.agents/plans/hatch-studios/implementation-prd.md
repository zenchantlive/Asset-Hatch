# Hatch Studios Implementation PRD

**Version:** 2.1  
**Date:** 2026-01-18  
**Status:** Phase 6 Complete, Phase 6b Complete

---

## Executive Summary

**Goal:** AI-powered game creation platform with unified asset-game workflow.

**MVP Requirements:**
- Describe game in natural language → AI generates Babylon.js code
- Use assets from Asset Hatch
- Edit code, export playable games

**Architecture Shift (Phase 6b):**
- Single unified view with tab-based navigation
- Shared context document that persists between Asset and Game modes
- Context-aware AI that knows what you're building regardless of current tab
- AI can create assets AND code in same conversation (future capability)

---

## Implementation Status

### ✅ Complete (Ready to Use)

| Phase | What | Key Files Created |
|-------|------|-------------------|
| 1-3 | Foundation, UI, AI Tools | `game-tools.ts`, schemas, chat route |
| 4A | Multi-file backend | `GamePlan`, `GameFile` models, file tools |
| 4B | Connect multi-file backend to UI | Files load in CodeTab ✓ |
| 5 | Activity Log & UI | `ActivityLog.tsx`, `FileTabs.tsx`, `FileVersionHistory.tsx` |
| 6 | Unified Project Schema | `assetManifest`, `gameId`, `projectId`, sync fields |
| 6b | Shared Context & Unified UI | ✅ Complete - Tab navigation, shared context API, context-aware chat |

### 📋 Planned

| Phase | What | Key Output |
|-------|------|------------|
| 7 | Asset Loading in Preview | `ASSETS.load()` global helper |
| 8 | AI Asset Workflow | System prompt updates, version sync UI |
| 9 | Export & Polish | Bundle assets + code |

### ❌ Removed / Deferred

| Item | Reason |
|------|--------|
| "Both Together" start path | No screen real estate for dual interfaces. AI will create both through tools as a future capability, not upfront choice. |

---

## Phase 6 Complete Summary

**Unified project architecture with bidirectional linking:**

- 1:1 relation between Project and Game via unique FKs
- JSON-based asset manifest for tracking linked assets
- Sync endpoints for pending asset integration
- Version locking on asset references

**Files:** `unified-project.ts`, `sync-tools.ts`, status/sync API routes, NewProjectDialog, UnifiedProjectCard, SyncStatusBanner, useProjectSync hook

---

## Phase 6b: Shared Context & Unified UI (IN PROGRESS)

**Goal:** Single unified view with tab-based navigation. Shared context document that persists between Asset and Game modes. Context-aware AI that knows your game regardless of which tab you're in.

### Architecture Shift

```
┌─────────────────────────────────────────────────────────────┐
│  Unified Project View                                       │
├─────────────────────────────────────────────────────────────┤
│  [🎨 Assets] [🎮 Game]  ← Top-level tab switch             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Assets View (when Assets tab active)                  │  │
│  │ [📋 Plan] [🎨 Style] [⚡ Generate]                   │  │
│  │   ↓         ↓           ↓                            │  │
│  │  Chat →    Anchor →    Asset Grid                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Game View (when Game tab active)                      │  │
│  │ [📋 Plan] [💻 Code] [▶️ Preview]                     │  │
│  │   ↓         ↓           ↓                            │  │
│  │  Chat →    Files →     Game iframe                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SHARED CONTEXT DOCUMENT                               │  │
│  │ • Game concept & vision (persisted regardless of tab) │  │
│  │ • Character descriptions                              │  │
│  │ • Environment/level notes                             │  │
│  │ • Key decisions made                                  │  │
│  │ • Auto-synced between Asset and Game contexts         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1. Shared Context Document

**Storage:** MemoryFile with type: `"project-context.json"`

```typescript
interface UnifiedProjectContext {
  projectId: string;
  gameId?: string;  // Linked game (populated when game created)
  
  // Planning (written during asset planning OR game planning)
  gameConcept: string;           // "A top-down RPG where players explore..."
  targetAudience: string;
  keyFeatures: string[];
  
  // Assets (from asset generation)
  characters: Array<{
    name: string;
    description: string;
    animations: string[];
    assetId?: string;  // Reference to GeneratedAsset/Generated3DAsset
  }>;
  environments: Array<{
    name: string;
    type: "interior" | "exterior" | "skybox";
    assetId?: string;
  }>;
  
  // Game (from game development)
  scenes: Array<{
    name: string;
    description: string;
  }>;
  
  // Sync metadata
  lastUpdatedBy: "assets" | "game";
  updatedAt: string;
}
```

### 2. Tab-Aware Chat Context

When chat loads, it includes relevant shared context:

```typescript
// Assets tab → AI knows about planning/generation
chatContext = {
  gameConcept: "...",  
  characters: [...],
  mode: "assets",
  phase: "planning" | "style" | "generation",
};

// Game tab → AI knows about coding
chatContext = {
  gameConcept: "...",  // From shared context!
  characters: [...],   // From shared context!
  mode: "game",
  phase: "plan" | "code" | "preview",
};

// KEY: User never has to re-explain the game idea when switching tabs
```

### 3. Start Path Options (Revised)

| Option | Behavior |
|--------|----------|
| **Assets First** | Create Project → Assets tab → Generate assets → User clicks "Create Game" → Game tab appears |
| **Game First** | Create Project → Game tab → Code game → Assets tab available anytime |

**"Both Together" Removed:** AI will create both through tools as a future capability (Phase 8+), not upfront choice.

### 4. Required Changes

#### Schema Changes
```prisma
// Add to MemoryFile type enum or create new type
// MemoryFile type: "project-context.json"
```

#### API Endpoints Needed

| Endpoint | Purpose |
|----------|---------|
| `GET /api/projects/[id]/context` | Read shared context |
| `POST /api/projects/[id]/context` | Update shared context |
| `POST /api/projects/[id]/game` | Create game from project (Game First flow) |

#### UI Components Needed

| Component | Purpose |
|-----------|---------|
| `UnifiedProjectView.tsx` | Main view with tab navigation |
| `AssetsTabContent.tsx` | Existing planning/generation UI |
| `GameTabContent.tsx` | Existing code/preview UI |
| `SharedContextIndicator.tsx` | Shows "🔄 Synced" when context is shared |

#### Chat Integration

1. Modify `ChatPanel.tsx` to accept `projectContext` prop
2. Update `babylon-system-prompt.ts` to include context when in Assets tab
3. Auto-populate first message: "I want to build [gameConcept]. Here are my assets: [...]"

### 5. Future: AI Creates Both (Phase 8+)

When AI has asset-generation tools AND code tools in same conversation:

```typescript
// Future system prompt capability:
SYSTEM: "You have access to both asset generation and game coding tools.
The user wants a knight character - generate the 3D model first, 
then write code to load it in the scene."
```

**Requires:**
- Asset generation tools exposed to Studio chat
- Sync between Asset Hatch generation and Game preview
- Version conflict resolution UI

### 6. Visual Differentiation

```
Assets tab:    Purple gradient border when active, purple accent
Game tab:      Blue gradient border when active, blue accent

Context indicator: "🔄 Synced" badge when both tabs have contributed
```

---

## Phase 7: Asset Loading in Preview

**Goal:** Load linked assets in game preview via `ASSETS` global.

### Pattern

```javascript
// In preview iframe
const knight = await ASSETS.load("knight", scene);
knight.position = new BABYLON.Vector3(5, 0, 10);

// Skybox
const skyMat = new BABYLON.StandardMaterial("sky", scene);
skyMat.reflectionTexture = new BABYLON.CubeTexture(
  ASSETS.getInfo("forest_sky").url.replace('.jpg', ''), scene
);
```

### Tasks

- Pass manifest to PreviewFrame
- Create `ASSETS` global helper
- Update babylon-system-prompt with asset info

---

## Phase 8: AI Integration

**Goal:** AI knows about assets and handles version conflicts.

### System Prompt Addition

```
CURRENT ASSETS (3 linked):
- knight: 3D, animations: idle, walk, attack

Use ASSETS.load("name", scene) to load assets.
```

### Version Conflict UI

```
⚠️ Asset Updates Available
• treasure_chest: v1 → v2 (new animation)
[Review Changes] [Sync All] [Keep Current]
```

---

## Phase 9: Export & Polish

- Export bundles linked assets with game
- Loading states, keyboard shortcuts
- Mobile planning mode

---

## Related Files Reference

| Purpose | File |
|---------|------|
| Schema | `src/prisma/schema.prisma` |
| AI Tools | `src/lib/studio/game-tools.ts` |
| System Prompt | `src/lib/studio/babylon-system-prompt.ts` |
| Preview | `src/components/studio/PreviewFrame.tsx` |
| Asset API | `src/app/api/studio/assets/route.ts` |
| Export Pattern | `src/components/export/ExportPanel.tsx` |
| Shared Context Types | `src/lib/types/unified-project.ts` |
| Sync Tools | `src/lib/studio/sync-tools.ts` |

---

## Current Blocker: None

Phase 4B (files not loading) is resolved. Phase 6b work is underway.
