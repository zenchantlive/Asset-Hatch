# Feature: 3D Mode UI - Complete Phase 4 Implementation

The following plan covers **EVERYTHING** needed for a fully functional 3D mode UI, not just the GenerationQueue. This includes mode selection, theming, phase-specific UI adaptations, and all user-facing elements.

## Feature Description

Implement a complete 3D asset generation UI that runs parallel to the existing 2D workflow. Users can create 3D projects, plan 3D assets with [RIG]/[STATIC] tags, preview GLB models in real-time, apply animations, and export rigged characters - all with a visually distinct UI theme that signals "3D mode."

## User Story

As a game developer creating a 3D game,
I want to select "3D Mode" when creating a project and use a tailored UI with 3D previews and animation controls,
So that I can generate rigged, animated 3D characters without leaving Asset Hatch.

## Problem Statement

Phase 3 completed the backend (API routes, Tripo client, database schema) but **zero UI exists** for 3D mode. The current planning page, generation queue, and all components assume 2D sprite generation. Users have no way to:
- Select 3D mode when creating a project
- Distinguish 3D projects visually from 2D projects
- Preview GLB model files
- Apply animations to rigged characters
- See 3D-appropriate quality options (mesh style, texture quality)

## Solution Statement

Build a parallel 3D UI layer that conditionally renders based on `project.mode`. Reuse the 4-phase workflow (Planning → Style → Generation → Export) but adapt each phase:
- **Planning**: Use 3D chat tools (already done), show [RIG]/[STATIC] tags in preview
- **Style**: Either skip or adapt for "reference image upload" (TBD)
- **Generation**: New 3D-specific queue with Three.js model viewer
- **Export**: GLB download with animation metadata

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: High  
**Primary Systems Affected**: 
- Project creation flow (mode selection)
- Planning UI (qualities, plan preview)
- Generation UI (queue, viewer, controls)
- Export UI (GLB packaging)
- Theming system (CSS variables)

**Dependencies**:
- Three.js (`three@^0.160.0`)
- `@react-three/fiber@^8.15.0`
- `@react-three/drei@^9.88.0`
- Backend Phase 3 (✅ complete)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**Phase Discovery & Planning Context:**
- `src/.agents/plans/3d-mode-prd.md` (lines 1-476) - Complete PRD, reference for all decisions
- `src/memory/active_state.md` (lines 1-80) - Phase 3 completion status, what's next
- `prisma/schema.prisma` (lines 103-110, 162-185) - Project.mode field, Generated3DAsset model

**Existing UI Patterns (2D) to Mirror:**
- `app/project/[id]/planning/page.tsx` (lines 1-450) - Main planning page, 4-mode switching logic
- `components/planning/QualitiesBar.tsx` - Quality parameter UI (need 3D variant)
- `components/planning/PlanPreview.tsx` - Markdown preview (need [RIG] tag rendering)
- `components/generation/GenerationQueue.tsx` - 2D queue pattern (adapt for 3D)
- `components/generation/GenerationLayoutContext.tsx` - Shared state pattern
- `components/export/ExportPanel.tsx` (lines 1-300) - Export UI (add GLB support)

**3D Backend (Phase 3 - ✅ Complete):**
- `lib/types/3d-generation.ts` (lines 1-285) - ALL 3D TypeScript types
- `lib/3d-plan-parser.ts` (lines 1-260) - [RIG]/[STATIC] parsing logic
- `lib/chat-tools-3d.ts` (lines 1-240) - 3D AI tools (already integrated)
- `lib/tripo-client.ts` (lines 1-180) - Tripo API client functions
- `app/api/generate-3d/route.ts` - Main generation endpoint
- `app/api/generate-3d/[taskId]/status/route.ts` - Status polling endpoint
- `app/api/generate-3d/rig/route.ts` - Rigging endpoint
- `app/api/generate-3d/animate/route.ts` - Animation endpoint

**Client Database & Sync:**
- `lib/client-db.ts` (lines 27-77) - Dexie schema with generated_3d_assets table
- `lib/sync.ts` (lines 99-103) - Mode field mapping (2D/3D)

**Theming & Styling:**
- `app/globals.css` (lines 121-156) - Current theme variables (--aurora-*, --glass-*)
- `components/ui/*` - shadcn/ui primitives (reuse for 3D components)

### New Files to Create

**1. Mode Selection (Phase 4.1 - Foundation)**
- `components/dashboard/CreateProjectModal.tsx` - New modal with 2D/3D toggle
- `components/ui/ModeToggle.tsx` - Reusable 2D/3D switch component
- `components/dashboard/ProjectModeIndicator.tsx` - Badge showing mode on project cards

**2. 3D Theming (Phase 4.2 - Visual Identity)**
- `app/globals-3d.css` - 3D-specific CSS variables (cyan/teal accents)
- `lib/theme-utils.ts` - Helper to apply `data-mode="3d"` attribute

**3. Planning Phase UI (Phase 4.3 - Plan Preview)**
- `components/planning/PlanPreview3D.tsx` - Renders [RIG]/[STATIC] tags with icons
- `components/planning/QualitiesBar3D.tsx` - 3D quality dropdowns (mesh style, texture quality)

**4. Generation Phase UI (Phase 4.4 - Core 3D UX)**
- `components/generation/GenerationQueue3D.tsx` - 3D-specific queue component
- `components/generation/ModelViewer.tsx` - Three.js GLB viewer with orbit controls
- `components/generation/AnimationControls.tsx` - Animation preset selector
- `components/generation/AssetCard3D.tsx` - 3D asset status card
- `components/generation/StatusPolling.tsx` - Polling hook with exponential backoff
- `components/generation/CostEstimator3D.tsx` - 3D credit cost calculator

**5. Export Phase UI (Phase 4.5 - GLB Download)**
- `components/export/ExportPanel3D.tsx` - 3D-specific export with GLB packaging

### Relevant Documentation - READ BEFORE IMPLEMENTING!

**Three.js Integration:**
- [Three.js Fundamentals](https://threejs.org/manual/#en/fundamentals)
  - Section: Loading GLB models with GLTFLoader
  - Why: Shows proper loader setup and disposal patterns
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
  - Section: Your first scene
  - Why: React-specific patterns for Three.js
- [@react-three/drei Helpers](https://github.com/pmndrs/drei#examples)
  - Section: `<OrbitControls />` and `<Environment />`
  - Why: Essential helpers for camera and lighting

**Tripo3D API (Backend Context):**
- [Tripo3D API Docs](https://platform.tripo3d.ai/docs/introduction)
  - Section: Task status polling
  - Why: Understand task lifecycle for UI status mapping
- [Animation Presets](https://platform.tripo3d.ai/docs/animations)
  - Section: Available presets
  - Why: UI labels for animation selector

**Prisma Schema Context:**
- Review `Generated3DAsset` model in `prisma/schema.prisma`
- Understand task chain: `draftTaskId` → `rigTaskId` → `animationTaskIds`
- UI must visualize this pipeline

### Patterns to Follow

**Mode Detection Pattern** (from sync.ts:103):
```typescript
mode: (projectData.mode === '3d' ? '3d' : '2d') as '2d' | '3d'
```

**Conditional Component Rendering** (NEW - to add in planning page):
```typescript
{project.mode === '3d' ? (
  <GenerationQueue3D projectId={projectId} />
) : (
  <GenerationQueue projectId={projectId} /> // Existing 2D queue
)}
```

**Status Polling Pattern** (from PRD exponential backoff):
```typescript
// Initial: 5s, multiplier: 1.5x, max: 30s
let interval = 5000;
const maxInterval = 30000;
const multiplier = 1.5;

const poll = async () => {
  const status = await fetch(`/api/generate-3d/${taskId}/status`);
  if (status.data.status === 'running') {
    interval = Math.min(interval * multiplier, maxInterval);
    setTimeout(poll, interval);
  }
};
```

**3D Quality Dropdown Pattern** (mirror QualitiesBar.tsx structure):
```typescript
const MESH_STYLE_OPTIONS = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'stylized', label: 'Stylized' },
  { value: 'low_poly', label: 'Low Poly' },
  { value: 'voxel', label: 'Voxel' },
];
```

**Three.js Cleanup Pattern** (CRITICAL - prevent memory leaks):
```typescript
useEffect(() => {
  const loader = new GLTFLoader();
  loader.load(modelUrl, (gltf) => {
    scene.add(gltf.scene);
  });

  return () => {
    // Dispose of geometries and materials
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  };
}, [modelUrl]);
```

---

## IMPLEMENTATION PLAN

### Phase 4.1: Foundation - Mode Selection & Project Setup

**Goal**: Enable users to choose 2D or 3D mode when creating a project, and persist this choice to the database.

**Tasks:**
1. Add mode selection to CreateProjectButton dialog
2. Update project creation API to accept mode parameter
3. Add mode indicator to project cards
4. Validate mode propagation through sync layer

**Deliverables:**
- Modal with 2D/3D toggle
- Mode badge on project cards
- Mode persisted in Prisma + Dexie

---

### Phase 4.2: Visual Identity - 3D Theming

**Goal**: Create a visually distinct theme for 3D mode so users can instantly recognize they're in 3D workflow.

**Tasks:**
1. Define 3D color palette (cyan/teal vs current purple)
2. Create CSS variables for 3D theme
3. Add `data-mode` attribute to planning page
4. Apply theme conditionally based on project mode

**Deliverables:**
- `globals-3d.css` with 3D color scheme
- Dynamic theme application
- Theme toggle utility function

---

### Phase 4.3: Planning Phase UI

**Goal**: Adapt planning UI to show 3D-specific quality options and render [RIG]/[STATIC] tags.

**Tasks:**
1. Create QualitiesBar3D with mesh style/texture quality dropdowns
2. Create PlanPreview3D to render [RIG] tags with visual indicators
3. Integrate 3D components conditionally in planning page
4. Test AI tool integration (already working via chat-tools-3d.ts)

**Deliverables:**
- 3D quality parameter UI
- [RIG]/[STATIC] tag rendering with icons
- Conditional component mounting

---

### Phase 4.4: Generation Phase UI (Core 3D UX)

**Goal**: Build the 3D generation experience - model viewer, animation controls, status polling, queue management.

**Tasks:**
1. Install Three.js dependencies
2. Create ModelViewer component with GLB loading
3. Create AnimationControls for preset selection
4. Create GenerationQueue3D with task chain visualization
5. Implement status polling with exponential backoff
6. Add cost estimation for 3D credits
7. Create AssetCard3D for individual asset status

**Deliverables:**
- Working GLB model preview
- Animation selector UI
- Real-time status updates
- Cost estimation display
- Batch generation controls

---

### Phase 4.5: Export Phase UI

**Goal**: Enable GLB download with animation metadata.

**Tasks:**
1. Create ExportPanel3D component
2. Add GLB file packaging logic
3. Include animation metadata in export manifest
4. Support multi-file export (rigged + animated variants)

**Deliverables:**
- GLB download functionality
- Export manifest with animation data
- Multi-variant export support

---

### Phase 4.6: Style Phase Decision (Optional/TBD)

**Goal**: Decide whether to skip style phase for 3D or adapt it for reference images.

**Tasks:**
1. Research Tripo image_to_model capabilities
2. Either skip style phase for 3D or create StylePreview3D
3. Update phase navigation logic

**Deliverables:**
- Decision documented
- Style phase handling for 3D mode

---

## STEP-BY-STEP TASKS

### 🔧 Phase 4.1: Foundation - Mode Selection

#### Task 1.1: CREATE components/ui/ModeToggle.tsx

**IMPLEMENT**:
- Reusable toggle component for 2D/3D mode selection
- Visual states: 2D (sprite icon), 3D (cube icon)
- Controlled component pattern

**PATTERN**: Mirror existing UI button toggle pattern from planning toolbar (lines 145-155 in page.tsx)

**IMPORTS**:
```typescript
import { useState } from 'react';
import { Layers, Box } from 'lucide-react'; // Icons
import { cn } from '@/lib/utils';
```

**GOTCHA**: Use `data-state` attribute for styling (shadcn convention)

**VALIDATE**: `bun run typecheck && bun run lint`

---

#### Task 1.2: UPDATE components/dashboard/CreateProjectButton.tsx

**IMPLEMENT**:
- Add mode state: `const [mode, setMode] = useState<'2d' | '3d'>('2d')`
- Integrate ModeToggle component in dialog
- Pass mode to API in handleCreate body

**PATTERN**: Existing dialog structure (lines 74-120)

**IMPORTS**:
```typescript
import { ModeToggle } from '@/components/ui/ModeToggle';
```

**GOTCHA**: Include mode in JSON.stringify body at line 51

**VALIDATE**: Create test project, verify mode in DB

---

#### Task 1.3: UPDATE app/api/projects/route.ts

**IMPLEMENT**:
- Accept `mode?: '2d' | '3d'` in request body
- Default to '2d' if not provided
- Pass mode to Prisma create operation

**PATTERN**: Existing POST handler pattern

**IMPORTS**: None (Prisma already imported)

**GOTCHA**: Validate mode enum before DB write

**VALIDATE**: `bun run test src/__tests__/api/projects.test.ts`

---

#### Task 1.4: CREATE components/dashboard/ProjectModeIndicator.tsx

**IMPLEMENT**:
- Badge component showing "2D" or "3D" mode
- Different colors: purple for 2D, cyan for 3D
- Props: `mode: '2d' | '3d'`

**PATTERN**: Badge component from components/ui/badge.tsx

**IMPORTS**:
```typescript
import { Badge } from '@/components/ui/badge';
import { Layers, Box } from 'lucide-react';
```

**VALIDATE**: Visual check on dashboard

---

### 🎨 Phase 4.2: Visual Identity - 3D Theming

#### Task 2.1: CREATE app/globals-3d.css

**IMPLEMENT**:
- Define 3D color palette using oklch colors
- Cyan/teal aurora variants instead of purple
- Apply via `[data-mode="3d"]` attribute selector

**PATTERN**: Mirror structure of globals.css (lines 121-156)

**EXAMPLE**:
```css
[data-mode="3d"] {
  --aurora-1: oklch(0.40 0.20 200 / 0.4); /* Cyan */
  --aurora-2: oklch(0.35 0.15 180 / 0.4); /* Teal */
  --aurora-3: oklch(0.45 0.20 220 / 0.3); /* Blue-cyan */
  --aurora-4: oklch(0.30 0.15 190 / 0.3); /* Deep teal */
}
```

**GOTCHA**: Import in app/layout.tsx after globals.css

**VALIDATE**: Visual inspection in browser DevTools

---

#### Task 2.2: CREATE lib/theme-utils.ts

**IMPLEMENT**:
- `applyModeTheme(mode: '2d' | '3d')` - sets `data-mode` on document.body
- Call on planning page mount based on project.mode

**PATTERN**: Simple DOM manipulation utility

**IMPORTS**: None

**GOTCHA**: Call in useEffect to avoid SSR issues

**VALIDATE**: Check `document.body.dataset.mode` in console

---

#### Task 2.3: UPDATE app/project/[id]/planning/page.tsx

**IMPLEMENT**:
- Load project.mode from Dexie on mount
- Call `applyModeTheme(project.mode)` in useEffect
- Cleanup on unmount (reset to 2d)

**PATTERN**: Existing useEffect at lines 47-70

**IMPORTS**:
```typescript
import { applyModeTheme } from '@/lib/theme-utils';
```

**GOTCHA**: Add cleanup function to reset theme

**VALIDATE**: Toggle between 2D/3D projects, observe color changes

---

### 📋 Phase 4.3: Planning Phase UI

#### Task 3.1: CREATE components/planning/QualitiesBar3D.tsx

**IMPLEMENT**:
- Dropdown for `meshStyle` (realistic, stylized, low_poly, voxel)
- Dropdown for `textureQuality` (draft, standard, high)
- Same collapsible bar pattern as QualitiesBar.tsx

**PATTERN**: Mirror QualitiesBar.tsx structure (lines 1-200)

**IMPORTS**:
```typescript
import { meshStyleSchema, textureQualitySchema } from '@/lib/schemas-3d';
```

**GOTCHA**: Save to MemoryFile with key `${projectId}-quality-3d`

**VALIDATE**: Check memory_files table after update

---

#### Task 3.2: CREATE components/planning/PlanPreview3D.tsx

**IMPLEMENT**:
- Parse markdown with parse3DPlan from lib/3d-plan-parser.ts
- Render [RIG] tags with rigging icon (🦴 or <User />)
- Render [STATIC] tags with cube icon (<Box />)
- Show animation requirements below rigged assets

**PATTERN**: PlanPreview.tsx markdown rendering (lines 1-150)

**IMPORTS**:
```typescript
import { parse3DPlan } from '@/lib/3d-plan-parser';
import { User, Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
```

**GOTCHA**: Use custom renderer for list items to inject icons

**VALIDATE**: Paste example plan from PRD, verify tags render

---

#### Task 3.3: UPDATE app/project/[id]/planning/page.tsx

**IMPLEMENT**:
- Load project.mode from Dexie state
- Conditionally render QualitiesBar3D if mode === '3d'
- Conditionally render PlanPreview3D if mode === '3d'

**PATTERN**: Existing conditional rendering for mobile (lines 290-350)

**IMPORTS**:
```typescript
import { QualitiesBar3D } from '@/components/planning/QualitiesBar3D';
import { PlanPreview3D } from '@/components/planning/PlanPreview3D';
```

**GOTCHA**: Ensure both 2D and 3D components receive same props

**VALIDATE**: Switch between 2D/3D projects, verify correct UI

---

### 🎮 Phase 4.4: Generation Phase UI (Core 3D UX)

#### Task 4.1: INSTALL Three.js dependencies

**IMPLEMENT**:
- Run: `bun add three @react-three/fiber @react-three/drei`
- Run: `bun add -d @types/three`

**VALIDATE**: `bun run typecheck` passes

---

#### Task 4.2: CREATE components/generation/ModelViewer.tsx

**IMPLEMENT**:
- Canvas with OrbitControls from @react-three/drei
- GLTFLoader to load model from URL
- Environment lighting preset
- Proper disposal on unmount

**PATTERN**: Follow Three.js cleanup pattern (see above)

**IMPORTS**:
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
```

**GOTCHA**: ALWAYS dispose geometries/materials to prevent memory leak

**VALIDATE**: Load sample GLB URL, verify model renders

---

#### Task 4.3: CREATE hooks/useStatusPolling.ts

**IMPLEMENT**:
- Custom hook for polling task status
- Exponential backoff: 5s → 1.5x → max 30s
- Stop polling when status is 'success' or 'failed'

**PATTERN**: Exponential backoff pattern (see above)

**IMPORTS**:
```typescript
import { useState, useEffect, useRef } from 'react';
import type { TripoTask } from '@/lib/types/3d-generation';
```

**GOTCHA**: Use useRef for interval to prevent stale closures

**VALIDATE**: Unit test with mock fetch

---

#### Task 4.4: CREATE components/generation/AnimationControls.tsx

**IMPLEMENT**:
- Checkbox list of animation presets
- Multi-select support
- Labels from ANIMATION_PRESET_LABELS

**PATTERN**: Multi-select checkbox pattern (shadcn checkbox)

**IMPORTS**:
```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { ANIMATION_PRESETS, ANIMATION_PRESET_LABELS } from '@/lib/types/3d-generation';
```

**GOTCHA**: Return `AnimationPreset[]` type

**VALIDATE**: Select animations, verify array output

---

#### Task 4.5: CREATE components/generation/AssetCard3D.tsx

**IMPLEMENT**:
- Card showing asset name, status, progress
- Status badges: queued (gray), generating (blue), rigging (purple), complete (green)
- Progress bar when status is 'running'
- ModelViewer preview when model URL available
- AnimationControls when rigged

**PATTERN**: AssetApprovalCard.tsx structure (components/generation/)

**IMPORTS**:
```typescript
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ModelViewer } from './ModelViewer';
import { AnimationControls } from './AnimationControls';
import { useStatusPolling } from '@/hooks/useStatusPolling';
```

**GOTCHA**: Poll status only when status is queued/running

**VALIDATE**: Mock asset data, verify UI states

---

#### Task 4.6: CREATE components/generation/CostEstimator3D.tsx

**IMPLEMENT**:
- Calculate credits based on:
  - Draft: 10-20 credits
  - Rigging: 25 credits
  - Animation: 10 credits each
- Display total estimated cost
- Props: `assetCount`, `rigCount`, `animationCount`

**PATTERN**: Simple calculation component

**IMPORTS**:
```typescript
import { AlertCircle } from 'lucide-react';
```

**GOTCHA**: Cite PRD pricing table (lines 461-467)

**VALIDATE**: Verify math with example: 1 rigged + 2 animations = 10+25+20 = 55 credits

---

#### Task 4.7: CREATE components/generation/GenerationQueue3D.tsx

**IMPLEMENT**:
- Parse plan with parse3DPlan
- Map assets to AssetCard3D components
- Batch "Generate All" button
- CostEstimator3D header
- Status summary (X queued, Y complete, Z failed)

**PATTERN**: GenerationQueue.tsx structure (existing 2D)

**IMPORTS**:
```typescript
import { parse3DPlan } from '@/lib/3d-plan-parser';
import { AssetCard3D } from './AssetCard3D';
import { CostEstimator3D } from './CostEstimator3D';
import { db } from '@/lib/client-db';
import type { Generated3DAsset } from '@/lib/types/3d-generation';
```

**GOTCHA**: Read generated_3d_assets from Dexie, not generated_assets

**VALIDATE**: Load 3D project, verify queue displays

---

#### Task 4.8: UPDATE app/project/[id]/planning/page.tsx

**IMPLEMENT**:
- Conditionally render GenerationQueue3D when mode === 'generation' && project.mode === '3d'
- Keep existing GenerationQueue for 2D

**PATTERN**: Existing mode conditional (lines 290-350)

**IMPORTS**:
```typescript
import { GenerationQueue3D } from '@/components/generation/GenerationQueue3D';
```

**GOTCHA**: Pass same projectId prop to both components

**VALIDATE**: Switch to generation mode in 3D project, verify 3D queue shows

---

### 📦 Phase 4.5: Export Phase UI

#### Task 5.1: CREATE components/export/ExportPanel3D.tsx

**IMPLEMENT**:
- List completed 3D assets
- Group by rigged/static
- Show animation count
- Download button → calls `/api/export-3d`
- Generate manifest.json with animation metadata

**PATTERN**: ExportPanel.tsx structure (existing)

**IMPORTS**:
```typescript
import { db } from '@/lib/client-db';
import { Download } from 'lucide-react';
import type { Generated3DAsset } from '@/lib/types/3d-generation';
```

**GOTCHA**: Include `animated_model_urls` in manifest

**VALIDATE**: Export 3D project, verify GLB files download

---

#### Task 5.2: CREATE app/api/export-3d/route.ts

**IMPLEMENT**:
- Fetch generated_3d_assets for project
- Download GLB files from Tripo URLs
- Package into ZIP with manifest.json
- Return ZIP as blob

**PATTERN**: app/api/export/route.ts (existing 2D export)

**IMPORTS**:
```typescript
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
```

**GOTCHA**: Tripo URLs expire after 24h - warn user if expired

**VALIDATE**: Postman test with projectId

---

#### Task 5.3: UPDATE app/project/[id]/planning/page.tsx

**IMPLEMENT**:
- Conditionally render ExportPanel3D when mode === 'export' && project.mode === '3d'

**PATTERN**: Existing export conditional (lines 290-350)

**IMPORTS**:
```typescript
import { ExportPanel3D } from '@/components/export/ExportPanel3D';
```

**VALIDATE**: Navigate to export phase in 3D project

---

### 🧪 Phase 4.6: Testing & Validation

#### Task 6.1: CREATE __tests__/components/generation/ModelViewer.test.tsx

**IMPLEMENT**:
- Test model loading
- Test disposal on unmount
- Mock Three.js GLTFLoader

**PATTERN**: Existing component tests

**VALIDATE**: `bun run test`

---

#### Task 6.2: CREATE __tests__/hooks/useStatusPolling.test.ts

**IMPLEMENT**:
- Test exponential backoff intervals
- Test polling stop on success
- Mock fetch responses

**PATTERN**: Existing hook tests

**VALIDATE**: `bun run test`

---

#### Task 6.3: MANUAL END-TO-END TEST

**IMPLEMENT**:
1. Create new 3D project
2. Plan rigged character with animations
3. Generate asset
4. Poll until complete
5. Preview model in viewer
6. Apply animation
7. Export GLB

**VALIDATE**: Full workflow completes without errors

---

## TESTING STRATEGY

### Unit Tests

**Scope**: All new components and utilities

**Framework**: Jest + React Testing Library (existing setup)

**Test Files**:
- `ModeToggle.test.tsx`
- `QualitiesBar3D.test.tsx`
- `PlanPreview3D.test.tsx`
- `ModelViewer.test.tsx`
- `useStatusPolling.test.ts`
- `theme-utils.test.ts`

**Coverage Target**: >80% on new code

---

### Integration Tests

**Scope**: API route interactions, database operations

**Test Files**:
- `app/api/export-3d/__tests__/route.test.ts`
- `app/api/generate-3d/__tests__/integration.test.ts`

**Coverage**: Full task chain (draft → rig → animate)

---

### Manual Testing Checklist

- [ ] Create 3D project from dashboard
- [ ] Mode indicator shows on project card
- [ ] 3D theme applies (cyan accents visible)
- [ ] Plan with [RIG] tags renders correctly
- [ ] Quality dropdowns save to database
- [ ] Generate button triggers task submission
- [ ] Status polling updates in real-time
- [ ] Model viewer displays GLB file
- [ ] Animation selector works
- [ ] Export downloads valid GLB
- [ ] Switch between 2D/3D projects (no cross-contamination)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run typecheck   # TypeScript compilation
bun run lint        # ESLint checks
```

**Expected**: 0 errors, 0 warnings

---

### Level 2: Unit Tests

```bash
bun run test        # Run all tests
bun run test:coverage # Check coverage
```

**Expected**: All tests pass, >80% coverage on new files

---

### Level 3: Build Verification

```bash
bun run build       # Production build
```

**Expected**: Build succeeds, bundle size reasonable (<500KB increase)

---

### Level 4: Manual Validation

**Test Plan**:
1. Start dev server: `bun dev`
2. Open http://localhost:3000
3. Create new 3D project
4. Verify mode selection works
5. Navigate to planning
6. Verify 3D theme applied
7. Test plan generation with AI
8. Verify [RIG] tags render
9. Navigate to generation
10. Verify 3D queue shows
11. Test model viewer with sample GLB
12. Test animation controls
13. Navigate to export
14. Verify GLB download

**Expected**: All interactions work, no console errors

---

## ACCEPTANCE CRITERIA

- [ ] Users can select 2D or 3D mode when creating a project
- [ ] 3D projects display with distinct visual theme (cyan/teal accents)
- [ ] Planning phase shows 3D-specific quality options
- [ ] [RIG]/[STATIC] tags render with visual indicators
- [ ] Generation phase displays 3D queue with model previews
- [ ] GLB models load and display in Three.js viewer
- [ ] Animation presets can be selected and applied
- [ ] Status polling updates in real-time with exponential backoff
- [ ] Cost estimation shows 3D credit calculations
- [ ] Export phase downloads GLB files with animation metadata
- [ ] All validation commands pass (typecheck, lint, test, build)
- [ ] No regressions in existing 2D workflow
- [ ] Memory leaks prevented (Three.js disposal verified)
- [ ] Responsive on mobile (3D viewer adapts to viewport)

---

## COMPLETION CHECKLIST

- [ ] All Phase 4.1 tasks completed (mode selection)
- [ ] All Phase 4.2 tasks completed (theming)
- [ ] All Phase 4.3 tasks completed (planning UI)
- [ ] All Phase 4.4 tasks completed (generation UI)
- [ ] All Phase 4.5 tasks completed (export UI)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual E2E test completed
- [ ] All validation commands passing
- [ ] No console errors in production build
- [ ] Performance validated (60fps model viewer)
- [ ] Accessibility checked (keyboard navigation)
- [ ] Code reviewed for quality

---

## NOTES

### Design Decisions

**1. Why separate GenerationQueue3D instead of conditionals?**
- Different data models (Generated3DAsset vs GeneratedAsset)
- Different UI requirements (model viewer vs sprite preview)
- Cleaner separation of concerns
- Easier to test independently

**2. Why skip style phase for 3D?**
- Tripo3D works best with text prompts, not style references
- Style anchor is 2D-specific (pixel art consistency)
- 3D has inherent "mesh style" quality setting
- Can revisit if image_to_model support added later

**3. Why exponential backoff polling?**
- Tripo tasks can take 60-120s to complete
- Reduces server load vs constant 5s polling
- Better user experience (less network activity)
- Standard practice for async task APIs

### Trade-offs

**Memory Management**:
- Three.js can leak memory if not disposed properly
- CRITICAL to test disposal on unmount
- Consider implementing model caching for repeat views

**Bundle Size**:
- Three.js + React Three Fiber ≈ 600KB uncompressed
- Use code splitting: `const ModelViewer = dynamic(() => import('./ModelViewer'))`
- Only load 3D libs when in 3D mode

**Offline Support**:
- 3D models from Tripo CDN require network
- Could cache in IndexedDB for offline (future enhancement)
- For now, require network for 3D workflow

### Future Enhancements (Post-MVP)

- [ ] Image-to-3D generation support
- [ ] High-quality refinement step
- [ ] Custom animation upload
- [ ] Multiple camera angles in viewer
- [ ] Bone visualization overlay
- [ ] Texture editing/painting
- [ ] LOD generation
- [ ] Multi-model batch generation
- [ ] R2/S3 permanent storage
- [ ] Animation preview with timeline

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Three.js bundle size too large | Medium | High | Code splitting, lazy loading |
| Memory leaks from model viewer | High | High | Thorough disposal testing, leak detection tools |
| Tripo URLs expire before export | Medium | Medium | Warn user, show expiry countdown |
| Polling overwhelms server | Low | Medium | Exponential backoff, rate limiting |
| GLB files too large to download | Low | Medium | Stream from CDN, show download progress |

---

## CONFIDENCE SCORE

**8/10** - High confidence for one-pass implementation success

**Reasoning**:
- Backend Phase 3 is complete and tested ✅
- Existing 2D UI patterns provide clear blueprint
- Three.js integration well-documented
- Clear acceptance criteria and validation plan

**Risks**:
- Three.js memory management requires careful testing
- Animation preview complexity may need iteration
- Polling UX polish may require user feedback

**Recommendation**: Proceed with implementation. Monitor Three.js memory usage closely during development.
