# PRD: 3D Asset Generation Mode

**Version:** 1.0  
**Date:** 2026-01-12  
**Status:** Draft  

---

## 1. Executive Summary

Asset Hatch is an AI-powered game asset generation tool that currently supports 2D sprite generation. This PRD defines the requirements for adding a **3D Asset Generation Mode** that enables indie game developers to create rigged, animated 3D character meshes through natural language conversation.

The core value proposition is extending Asset Hatch's conversational AI workflow to 3D assets: users describe their game characters, the AI generates production-ready GLB/FBX models with optional rigging and preset animations, all through the same intuitive planning → style → generation → export flow.

**MVP Goal:** Enable users to generate a single rigged 3D character with preset animations (idle, walk, run) through the existing Asset Hatch workflow, integrated with Tripo3D API.

---

## 2. Mission

**Product Mission Statement:**  
Empower indie game developers to create professional 3D game assets without 3D modeling skills, using natural conversation and AI-assisted workflows.

**Core Principles:**
1. **Parallel Mode, Not Replacement** - 3D mode exists alongside 2D, not replacing it
2. **Same Workflow, Different Output** - Planning → Style → Generation → Export UX remains consistent
3. **Progressive Enhancement** - Start with mesh, optionally add rigging, then animations
4. **Manual Testing First** - Every feature must be manually testable before automation
5. **Small, Focused Files** - Code organized into ~200-line functional modules

---

## 3. Target Users

**Primary Persona: Indie 3D Game Developer**
- Solo or small team (1-5 people)
- Making 3D games in Unity/Unreal/Godot
- Limited or no 3D modeling experience
- Comfortable with game engines but not Blender/Maya
- Needs: Quick character prototypes, consistent art style, animation-ready models

**Secondary Persona: Game Jam Participant**
- 48-72 hour time constraint
- Needs rapid asset creation
- Prioritizes speed over quality
- Needs: Draft quality models fast, basic animations

**Technical Comfort Level:** Intermediate (can integrate GLB files, understands rigging concepts)

---

## 4. MVP Scope

### In Scope (MVP)

**Core Functionality:**
- ✅ Mode toggle (2D/3D) at project creation (Phase 1)
- ✅ 3D-specific planning chat with [RIG]/[STATIC] tags (Phase 2)
- ✅ Text-to-3D mesh generation via Tripo API - **Backend complete** (Phase 3)
- ✅ Task status polling with progress indicator - **Backend complete** (Phase 3)
- ⏳ Basic 3D model preview (Three.js viewer) - Phase 4
- ✅ Rigging workflow (rig check → auto-rig) - **Backend complete** (Phase 3)
- ✅ Preset animation retargeting (idle, walk, run) - **Backend complete** (Phase 3)
- ⏳ GLB export download - Phase 5

**Technical:**
- ✅ Tripo3D API client with async task polling (Phase 3)
- ✅ Database schema for 3D assets (Prisma) (Phase 1)
- ✅ 3D plan parser (no direction variants) (Phase 2)
- ⏳ Model streaming from Tripo CDN (no local caching) - Phase 4 UI

### Out of Scope (Future)

**Deferred Features:**
- ❌ Image-to-3D generation
- ❌ Model refinement (high-quality upscale)
- ❌ Custom animation upload
- ❌ Texture editing/painting
- ❌ LOD generation
- ❌ Multi-model batch generation
- ❌ IndexedDB caching for offline
- ❌ R2/S3 permanent storage
- ❌ Animation preview with bone visualization

---

## 5. User Stories

### Primary User Stories

**US-1: Mode Selection**
> As a game developer, I want to choose between 2D and 3D mode when creating a project, so that I get the appropriate workflow for my game type.

*Example:* User clicks "New Project", sees toggle for "2D Sprites" vs "3D Models", selects 3D, project created in 3D mode.

**US-2: 3D Asset Planning**
> As a game developer, I want to describe my 3D characters to an AI, so that it generates a structured plan with rigging requirements.

*Example:* User types "I need a fantasy knight character that can walk and fight", AI responds with plan showing `[RIG] Knight - Animations: idle, walk, attack`.

**US-3: Mesh Generation**
> As a game developer, I want to generate a 3D mesh from my plan, so that I can see my character come to life.

*Example:* User clicks "Generate" on Knight asset, sees "Generating..." status, after 60s sees 3D preview of knight mesh.

**US-4: Rigging**
> As a game developer, I want to auto-rig my generated character, so that I can apply animations.

*Example:* User clicks "Rig" on generated mesh, sees "Rigging..." status, after 30s sees "Ready for Animation" badge.

**US-5: Animation Application**
> As a game developer, I want to apply preset animations to my rigged character, so that I get animation-ready assets.

*Example:* User selects "Walk" and "Idle" animations, clicks "Apply", sees animated preview in Three.js viewer.

**US-6: Export**
> As a game developer, I want to download my animated 3D model as GLB, so that I can import it into my game engine.

*Example:* User clicks "Export", downloads `knight_rigged_animated.glb`.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│   API Routes    │────▶│  Tripo3D API    │
│  (React + 3js)  │◀────│   (Polling)     │◀────│  (Async Tasks)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│   IndexedDB     │     │   Neon Postgres │
│   (UI State)    │     │   (Metadata)    │
└─────────────────┘     └─────────────────┘
```

### Directory Structure (New Files)

```
src/
├── lib/
│   ├── types/
│   │   ├── tripo-api.ts      # API types
│   │   ├── 3d-asset.ts       # Asset interfaces
│   │   └── animation.ts      # Animation types
│   ├── tripo/
│   │   ├── client.ts         # Base HTTP
│   │   ├── tasks.ts          # Task CRUD
│   │   ├── polling.ts        # Async polling
│   │   ├── mesh.ts           # Mesh generation
│   │   ├── rig.ts            # Rigging
│   │   └── animate.ts        # Animation
│   └── parsing/
│       ├── 3d-plan-parser.ts
│       ├── 3d-tag-extractor.ts
│       └── animation-extractor.ts
├── app/api/
│   └── generate-3d/
│       ├── route.ts
│       ├── [taskId]/route.ts
│       ├── rig/route.ts
│       └── animate/route.ts
└── components/3d/
    ├── ModelViewer.tsx
    ├── ModelLoader.tsx
    ├── AnimationControls.tsx
    └── ... (8 small components)
```

### Key Patterns

- **Async Task Chain:** draft → refine → rig → animate (each is separate Tripo task)
- **Polling with Backoff:** 5s initial, 1.5x multiplier, 30s max interval
- **CDN Streaming:** Models loaded directly from Tripo URLs (no local storage)
- **Small Files:** Each file ~200 lines, single responsibility

---

## 7. Tools/Features

### 7.1 Tripo API Client

**Purpose:** Wrapper for Tripo3D REST API with async task management

**Operations:**
- `createTask(type, params)` - Submit generation task
- `getTaskStatus(taskId)` - Check task progress
- `pollUntilComplete(taskId)` - Wait with backoff

### 7.2 3D Plan Parser

**Purpose:** Extract 3D asset specs from AI-generated markdown

**Features:**
- Parse [RIG]/[STATIC] tags
- Extract animation requirements
- No direction variants (unlike 2D)

### 7.3 Model Viewer

**Purpose:** Display GLB models with animation playback

**Features:**
- GLB loading via Three.js
- Orbit camera controls
- Animation selector dropdown
- Play/pause controls

---

## 8. Technology Stack

### Backend
- **Runtime:** Next.js 16 (App Router)
- **Database:** Prisma 7 + Neon Postgres
- **API Client:** Native fetch with Tripo3D REST API
- **Auth:** Auth.js v5

### Frontend
- **Framework:** React 19
- **3D Rendering:** Three.js + @react-three/fiber + @react-three/drei
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State:** React hooks + IndexedDB (Dexie)

### External Services
- **3D Generation:** Tripo3D API (https://api.tripo3d.ai/v2/openapi)
- **LLM:** OpenRouter (Gemini 3 Pro for chat)

### New Dependencies
```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "@types/three": "^0.160.0"
}
```

---

## 9. Security & Configuration

### Authentication
- Tripo API key stored in environment variable `TRIPO_API_KEY`
- BYOK (Bring Your Own Key) support via user settings

### Configuration
```env
# Required for 3D mode
TRIPO_API_KEY=your-tripo-api-key

# Existing
OPENROUTER_API_KEY=...
POSTGRES_PRISMA_URL=...
```

### Security Scope
- ✅ API key validated before 3D operations
- ✅ Rate limiting on generation endpoints
- ❌ Per-user credit tracking (future)
- ❌ Abuse detection (future)

---

## 10. API Specification

### POST /api/generate-3d

**Purpose:** Submit mesh generation task

**Request:**
```json
{
  "projectId": "uuid",
  "assetId": "uuid", 
  "prompt": "Fantasy knight in T-pose",
  "shouldRig": true,
  "animations": ["preset:idle", "preset:walk"]
}
```

**Response:**
```json
{
  "taskId": "tripo-task-uuid",
  "status": "queued"
}
```

### GET /api/generate-3d/[taskId]

**Purpose:** Check task status

**Response:**
```json
{
  "taskId": "...",
  "status": "success",
  "output": {
    "modelUrl": "https://cdn.tripo3d.ai/...",
    "renderedImage": "https://..."
  }
}
```

### POST /api/generate-3d/rig

**Purpose:** Submit rigging task

**Request:**
```json
{
  "draftTaskId": "tripo-task-uuid"
}
```

### POST /api/generate-3d/animate

**Purpose:** Apply animation preset

**Request:**
```json
{
  "rigTaskId": "tripo-task-uuid",
  "animation": "preset:walk"
}
```

---

## 11. Success Criteria

### MVP Success Definition
A user can generate a single rigged, animated 3D character through the full workflow and export it as GLB.

### Functional Requirements
- ✅ Mode toggle works and persists
- ✅ 3D planning generates [RIG]/[STATIC] plans
- ✅ Mesh generation completes within 120s
- ✅ Rigging succeeds on T-pose characters
- ✅ Animation preview plays in browser
- ✅ GLB export downloads valid file

### Quality Indicators
- Zero TypeScript errors
- Zero ESLint warnings
- Unit test coverage >80% on new code
- Manual testing checklist complete

---

## 12. Implementation Phases

### Phase 1: Foundation (1 Session)
**Goal:** Types, API client, database schema, mode toggle

**Deliverables:**
- ✅ `lib/types/` with 3D interfaces
- ✅ `lib/tripo/` client with polling
- ✅ Prisma schema for Generated3DAsset
- ✅ Mode toggle in project creation

**Validation:** `bun run typecheck && bun run lint` passes

---

### Phase 2: Planning (1 Session)
**Goal:** 3D-specific chat experience

**Deliverables:**
- ✅ 3D system prompt (no directions, adds rig tags)
- ✅ 3D plan parser
- ✅ Unit tests for parser

**Validation:** AI generates [RIG]/[STATIC] plans from chat

---

### Phase 3: Generation Backend (2 Sessions) ✅ COMPLETE
**Goal:** Full API route coverage

**Deliverables:**
- ✅ `/api/generate-3d/route.ts` - Main generation endpoint
- ✅ `/api/generate-3d/[taskId]/status/route.ts` - Status polling with DB updates
- ✅ `/api/generate-3d/rig/route.ts` - Auto-rigging endpoint
- ✅ `/api/generate-3d/animate/route.ts` - Animation retargeting endpoint
- ✅ `lib/tripo-client.ts` - Shared API utilities
- ✅ Unit tests (`__tests__/route.test.ts`) - 6 test cases
- ⏳ Integration tests - Deferred to Phase 4 (manual testing priority)

**Validation:** ✅ All routes created, typecheck + lint passing, ready for UI integration

**Date Completed:** 2026-01-12
**Commit:** `bfaf48f` on branch `3d-gen-phase-3-apis`

---

### Phase 4: UI (2 Sessions)
**Goal:** 3D preview and workflow UI

**Deliverables:**
- ✅ ModelViewer with Three.js
- ✅ Generation queue for 3D
- ✅ Animation picker
- ✅ 3D generation page

**Validation:** End-to-end manual test passes

---

### Phase 5: Export (1 Session)
**Goal:** Download 3D assets

**Deliverables:**
- ✅ Export API route
- ✅ GLB download from CDN
- ✅ Export manifest

**Validation:** Downloaded GLB imports into Blender

---

## 13. Future Considerations

### Post-MVP Enhancements
- Image-to-3D generation
- Model refinement (high-quality)
- Custom animation upload
- Texture painting
- LOD generation

### Integration Opportunities
- Unity package for direct import
- Unreal plugin
- Blender add-on

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tripo API rate limits unknown | Generation queues | Implement retry with backoff, show queue position |
| Rigging fails on complex meshes | ~20% failure rate | Show clear error, suggest "T-pose" in prompt |
| Large GLB files slow to load | Poor UX | Stream from CDN, show loading skeleton |
| Tripo URLs expire after 24h | Data loss | Prompt user to approve/export within session |
| Three.js bundle size | Slow initial load | Dynamic import, code splitting |

---

## 15. Appendix

### Related Documents
- [Implementation Plan](file:///C:/Users/Zenchant/.gemini/antigravity/brain/d3e911b6-db2c-46a0-bd93-dc7b1300dcf9/implementation_plan.md)
- [Tripo3D API Docs](https://platform.tripo3d.ai/docs/introduction)
- [Three.js Documentation](https://threejs.org/docs/)

### Tripo3D Pricing (Credits)
| Task | Credits |
|------|---------|
| Text-to-3D (draft) | 10-20 |
| Refinement | ~100 |
| Rigging | 25 |
| Animation (each) | 10 |

### Animation Presets Available
- `preset:idle`
- `preset:walk`
- `preset:run`
- `preset:jump`
- `preset:climb`
- `preset:dive`
