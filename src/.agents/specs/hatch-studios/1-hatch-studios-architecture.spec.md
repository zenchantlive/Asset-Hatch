# Hatch Studios Architecture Specification

**Status:** Draft  
**Dependencies:** None (foundation spec)  
**Implements PRD Section:** 3, 6, 10

---

## 1. Purpose

Defines the core architecture for Hatch Studios: routing structure, state management, component hierarchy, and how it integrates alongside Asset Hatch as a separate but connected product.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: Studio SHALL exist at `/studio/[id]` route, separate from Asset Hatch `/project/[id]`
- FR-002: Studio SHALL maintain game state (code, assets, scenes) across sessions
- FR-003: Studio SHALL provide bidirectional navigation to/from Asset Hatch
- FR-004: Studio SHALL support hot-reload of game preview on code changes
- FR-005: Studio SHALL preserve game state when user creates new assets
- FR-006: Studio SHALL work without requiring existing assets (allow primitives/procedural)

### 2.2 Non-Functional Requirements

- NFR-001: Initial page load < 3s on average connection
- NFR-002: Code-to-preview update < 2s
- NFR-003: Game state autosave every 30s or on significant change
- NFR-004: Support mobile viewport (responsive, but desktop-first)

---

## 3. Technical Design

### 3.1 Route Structure

```
/                           # Homepage with Asset Hatch + Studios entry points
├── /project/[id]/...       # Asset Hatch (existing)
└── /studio/
    ├── /studio/new         # Create new game (or from assets)
    └── /studio/[id]        # Game editor
        ├── ?tab=preview    # Default - live game preview
        ├── ?tab=code       # Babylon Playground (Monaco)
        └── ?tab=assets     # Asset library browser
```

### 3.2 Component Hierarchy

```
StudioLayout
├── StudioHeader
│   ├── ProjectTitle (editable)
│   ├── TabNav [Preview | Code | Assets]
│   └── ActionButtons [Save | Export | Switch to Asset Hatch]
│
├── StudioWorkspace (flex container)
│   ├── ChatPanel (left, resizable)
│   │   ├── MessageThread
│   │   ├── MessageInput
│   │   └── ToolCallIndicator
│   │
│   └── WorkPanel (right)
│       ├── PreviewTab
│       │   ├── GameIframe (sandboxed)
│       │   ├── PlayControls [Play | Pause | Restart]
│       │   └── PerformanceMonitor (FPS, memory)
│       │
│       ├── CodeTab
│       │   ├── MonacoEditor
│       │   └── FileTabs (if multi-file)
│       │
│       └── AssetsTab
│           ├── AssetSearch
│           ├── AssetGrid (thumbnails)
│           └── AssetDetail (preview, metadata)
│
└── StudioFooter (optional)
    └── StatusBar (generation status, autosave indicator)
```

### 3.3 State Management

```typescript
// Primary state shape
interface StudioState {
  // Identity
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Game Code
  code: string;                    // Current Babylon.js code
  codeHistory: CodeVersion[];      // Undo/redo stack
  
  // Scenes (AI-managed)
  scenes: Scene[];                 // Multiple scenes supported
  activeSceneIndex: number;
  
  // Assets Used
  assetRefs: AssetReference[];     // Links to Asset Hatch assets
  
  // UI State
  activeTab: 'preview' | 'code' | 'assets';
  panelSizes: { chat: number; work: number };
  
  // Preview State
  previewStatus: 'idle' | 'loading' | 'running' | 'error';
  previewError?: string;
  
  // Chat
  messages: Message[];
  isGenerating: boolean;
}

interface Scene {
  id: string;
  name: string;
  code: string;          // Scene-specific code
  assetPlacements: AssetPlacement[];
}

interface AssetReference {
  assetId: string;       // Asset Hatch asset ID
  projectId: string;     // Asset Hatch project ID
  name: string;
  thumbnailUrl: string;
  glbUrl: string;
  type: '2d' | '3d';
}

interface AssetPlacement {
  assetRefId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}
```

### 3.4 State Persistence

| Data | Storage | Sync Strategy |
|------|---------|---------------|
| Game metadata | Prisma (PostgreSQL) | Server-authoritative |
| Code content | Prisma | Debounced autosave (30s) |
| Asset references | Prisma | Immediate on change |
| Chat messages | Prisma | Immediate |
| UI preferences | localStorage | Client-only |

### 3.5 Preview Iframe Architecture

```html
<!-- Sandboxed iframe for game execution -->
<iframe
  sandbox="allow-scripts allow-same-origin"
  srcdoc="[generated HTML with Babylon.js]"
/>
```

Communication via `postMessage`:
- Parent → Iframe: `{ type: 'RELOAD', code: '...' }`
- Iframe → Parent: `{ type: 'ERROR', message: '...' }`
- Iframe → Parent: `{ type: 'READY' }`
- Iframe → Parent: `{ type: 'METRICS', fps: 60, memory: 128 }`

---

## 4. Interface Contract

### 4.1 StudioProvider Context

```typescript
interface StudioContextValue {
  // State
  state: StudioState;
  
  // Actions
  updateCode: (code: string) => void;
  createScene: (name: string) => Scene;
  switchScene: (sceneId: string) => void;
  addAssetRef: (asset: AssetReference) => void;
  removeAssetRef: (assetId: string) => void;
  
  // Preview
  reloadPreview: () => void;
  
  // Persistence
  save: () => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}
```

### 4.2 Navigation Helpers

```typescript
// Switch to Asset Hatch to create new asset
function navigateToAssetHatch(projectId?: string): void;

// Return to Studio with newly created assets
function returnToStudio(studioId: string, newAssetIds: string[]): void;
```

---

## 5. Implementation Notes

1. **Reuse existing patterns** from Asset Hatch (ChatInterface, QualitiesBar structure)
2. **Monaco Editor** - dynamic import to avoid bundle bloat
3. **Iframe sandbox** - strict CSP, no localStorage access from game
4. **AI tools** live in `/api/studio/chat/route.ts`, similar pattern to existing chat
5. **Asset Hatch integration** - share authentication, project context via URL params

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] Studio state persistence (save/load game)
- [ ] Code version history (undo/redo)
- [ ] Asset reference linking (add/remove)
- [ ] Scene creation and switching

### 6.2 Manual Verification

- [ ] Preview iframe loads and displays Babylon.js scene
- [ ] Hot-reload works on code change
- [ ] Panel resizing works correctly
- [ ] Responsive layout on tablet viewport

### 6.3 Integration Check

- [ ] Navigation to/from Asset Hatch preserves context
- [ ] New assets appear in Studio asset browser immediately
- [ ] Chat history persists across page refresh

---

## 7. Open Questions

None - ready for review.
