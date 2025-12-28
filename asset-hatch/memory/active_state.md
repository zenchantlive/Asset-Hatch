# 🧠 Active Session State

**Last Updated:** 2025-12-27
**Session:** Generation Queue UI - Phase 1 UI Components ✅ COMPLETE
**Branch:** feat/generation-queue-ui

---

## 📍 Current Focus

> **✅ GENERATION QUEUE UI - PHASE 1 COMPLETE:** Built complete UI layer for generation phase. Created 4 major components (AssetTree, PromptPreview, BatchControls, GenerationProgress) and wired them into GenerationQueue layout. All TypeScript strict, ESLint clean, fully commented. Uses React Context for state management, useMemo for performance, refs to avoid stale closures. Ready for integration into planning page. Next: Integrate into planning page and test end-to-end workflow.

---

## 🚧 Status Board

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Planning Phase P1** | ✅ Complete | Chat, tools, plan generation working |
| **AI SDK v6 Migration** | ✅ Complete | All tool execution issues resolved |
| **Database Schema v3** | ✅ Complete | style_anchors, character_registry, generated_assets tables |
| **Image Utilities** | ✅ Complete | Blob ↔ base64 conversion, color extraction |
| **Prompt Templates** | ✅ Complete | 6 asset-type templates with priority ordering |
| **Prompt Builder** | ✅ Complete | buildAssetPrompt() with quality integration |
| **AI Style Extraction** | ✅ Complete | Vision API route /api/analyze-style |
| **Style Anchor Editor** | ✅ Complete | UI component with AI suggestions |
| **Generation API** | ✅ Complete | /api/generate route with Flux.2 integration |
| **Plan Parser** | ✅ Complete | Parse markdown → ParsedAsset[], composite/granular modes |
| **Multi-Mode Planning Page** | ✅ Complete | Tab navigation, file viewer menu, mode switching |
| **Style Phase AI Tools** | ✅ Complete | 4 tools integrated with ChatInterface |
| **Hybrid Persistence** | ✅ Complete | Prisma + Dexie sync for StyleAnchors |
| **Test Coverage** | ✅ Complete | Integration tests for all API routes |
| **Generation Queue UI** | 🟢 85% Complete | All components built & wired, pending planning page integration |

---

## 🎯 Critical Architectural Decisions

### **1. Single-Page Multi-Mode Design** ✅ DECIDED
**Decision:** Keep user on `/project/[id]/planning` page, switch right panel modes instead of navigating to separate pages.

**Implementation:**
```
┌────────────────────────────────────────────┐
│ [Plan] [Style] [Generation]  📄 Files [▼] │ ← Tab navigation
│  Chat (Left)   │   Right Panel (Mode)      │
│                │   - Plan Mode: markdown   │
│                │   - Style Mode: keywords  │
│                │   - Gen Mode: queue       │
└────────────────────────────────────────────┘
```

**Why:**
- Consistent UX - user stays in same chat context
- Natural workflow - continue conversation across phases
- No page transitions - faster, smoother
- File menu accessible - saved files visible at all times

---

### **2. Flexible Editing with Version Tracking** ✅ DECIDED
**Decision:** User can edit plan/style at any time. System tracks versions and marks affected assets as "outdated".

**Implementation:**
```typescript
interface MemoryFile {
  version: number;        // Increments on save
  updated_at: string;     // Last edit timestamp
}

interface GeneratedAsset {
  plan_version: number;   // Links to entities.json version
  style_version: number;  // Links to style-anchor version
  status: 'generated' | 'outdated' | 'approved';
}
```

**Workflow:**
1. User edits plan after generating 5 assets
2. System shows warning: "This affects 5 existing assets"
3. User chooses: Mark as outdated / Regenerate now / Cancel
4. If marked outdated: Assets get status = 'outdated'
5. Generation queue shows: ⚠️ warnings on outdated assets
6. User can regenerate individually or batch

**Why:**
- Flexibility - users can iterate freely
- No data loss - old assets kept until user decides
- Clear visibility - warnings show impact
- User control - regenerate when ready, not forced

---

### **3. Composite Sprite Sheets (DEFAULT)** ✅ DECIDED
**Decision:** Default generation creates composite sprite sheets (multiple poses in one image), not individual frames.

**Example:**
```
Input: "Farmer - Idle (4-direction)"

DEFAULT (Composite):
┌────────┬────────┬────────┬────────┐
│ Front  │ Left   │ Right  │ Back   │  ← ONE image
│  Idle  │  Idle  │  Idle  │  Idle  │
└────────┴────────┴────────┴────────┘
Prompt: "sprite sheet of farmer, 4 frames arranged horizontally,
         idle animation, front/left/right/back views"

OPTION (Granular - Studio Mode):
Image 1: Farmer Idle Front (separate)
Image 2: Farmer Idle Left (separate)
Image 3: Farmer Idle Right (separate)
Image 4: Farmer Idle Back (separate)
```

**Why DEFAULT is composite:**
- Standard game dev format (sprite sheets are industry norm)
- More efficient (1 API call vs 4)
- Lower cost (1 generation vs 4)
- LLM-friendly (when users give assets to AI coding agents later, they can see whole sheet)
- Game engines expect sprite sheets

**When to use GRANULAR:**
- Professional studios wanting individual asset control
- Manual editing of each variant
- Precise approval/rejection per pose

**Implementation:**
```typescript
// Project setting or generation page toggle
const [generationMode, setGenerationMode] = useState<'composite' | 'granular'>('composite');

// Plan parser expands based on mode:
if (generationMode === 'composite') {
  // "Idle (4-direction)" → ONE sprite-sheet task with 4 frames
} else {
  // "Idle (4-direction)" → FOUR character-sprite tasks
}
```

---

### **4. Style Anchor Image Upload - CRITICAL** ✅ DECIDED
**Decision:** Style anchor reference image upload is REQUIRED (or highly recommended) for visual consistency.

**Why Critical:**
- Flux.2 uses reference images for style consistency
- Every generation sends: `{ prompt, images: [styleAnchorBase64] }`
- Without reference image: each asset looks different
- With reference image: consistent art style across all assets

**Workflow:**
1. User uploads reference image OR describes style to AI
2. AI analyzes image (vision model) → suggests keywords
3. Client extracts color palette from image
4. User edits AI suggestions
5. Saves StyleAnchor to Hybrid Storage (Prisma + Dexie cache)
6. All generations include this image as reference via Prisma lookup

**Implementation:**
- `StyleAnchorEditor` component handles upload + AI analysis
- `/api/analyze-style` uses GPT-4o vision to extract keywords
- `lib/image-utils.ts` extracts color palette via canvas
- Every `/api/generate` call includes `images: [styleAnchorBase64]`

---

## 🏗️ Architecture Summary

### **Database Schema v3**
```typescript
// New tables in IndexedDB:
style_anchors: {
  reference_image_blob: Blob,
  reference_image_base64: string, // Cached for API
  style_keywords: string,
  lighting_keywords: string,
  color_palette: string[], // HEX codes
}

character_registry: {
  base_description: string, // FULL description for consistency
  successful_seed: number,
  poses_generated: string[],
  animations: Record<string, { seed, asset_id }>,
}

generated_assets: {
  image_blob: Blob,
  prompt_used: string,
  plan_version: number,
  style_version: number,
  status: 'generated' | 'outdated' | 'approved',
  generation_metadata: { model, seed, cost, duration_ms },
}
```

### **Prompt Generation Flow**
```
1. Parse plan → ParsedAsset[]
2. For each asset:
   - Load project qualities
   - Load style anchor
   - Load character registry (if character)
   - buildAssetPrompt() → priority-ordered prompt
3. Call /api/generate with prompt + style anchor image
4. Save GeneratedAsset to IndexedDB
5. Update character registry with seed
```

### **Prompt Priority (CRITICAL)**
Per FLUX2_PROMPT_ENGINEERING.md: **First 5 words carry highest weight**

```typescript
// ✅ CORRECT: Asset type + subject first
"pixel art sprite of farmer character with straw hat, idle pose, 32x32..."

// ❌ WRONG: Resolution/technical details first
"32x32 pixel art idle farmer with straw hat sprite..."
```

Templates ensure correct priority ordering.

---

## 📦 Files Implemented (P0)

### Created (7 new files)
1. **lib/db.ts** - Schema v3 with 3 new tables (MODIFIED)
2. **lib/image-utils.ts** - Blob/base64 conversion, color extraction
3. **lib/prompt-templates.ts** - 6 asset-type templates
4. **lib/prompt-builder.ts** - Priority-ordered prompt generation
5. **app/api/analyze-style/route.ts** - AI vision analysis
6. **components/style/StyleAnchorEditor.tsx** - Style anchor UI
7. **app/api/generate/route.ts** - Generation API with Flux.2 (Prisma refactor)
8. **app/api/style-anchors/route.ts** - Style anchor storage API
9. **lib/client-db.ts** - Renamed from db.ts, client-only Dexie
10. **lib/prisma.ts** - Prisma client singleton

### Documentation (2 files)
8. **memory/GENERATION_WORKFLOW_GAPS.md** - 13 critical gaps identified
9. **memory/P0_GENERATION_IMPLEMENTATION_SUMMARY.md** - Complete guide

**Total:** 2,904 lines added

---

## 🎯 Next Steps

### **Completed This Session ✅**
1. ✅ **Generation UI Components** - 4 major components + integration
   - `components/generation/BatchControls.tsx` (155 lines) - Toolbar with controls
   - `components/generation/GenerationProgress.tsx` (295 lines) - Progress panel with ETA
   - Wired all components into `GenerationQueue.tsx` two-panel layout
   - Updated `lib/types/generation.ts` to add `assetId` to GenerationLogEntry
   - All TypeScript strict mode, ESLint clean, no any/unknown types
   - Used refs to avoid stale closures, useMemo for performance
   - setInterval pattern for ETA updates (time-based subscription)

2. ✅ **Plan parser** - `lib/plan-parser.ts` (462 lines)
   - Parse entities.json markdown → ParsedAsset[]
   - Handle composite vs granular mode
   - Expand animations (4-direction → 4 frames or 4 tasks)
   - Auto-detect asset types from category and name

4. ✅ **Hybrid Persistence & Stability**
   - Separated persistence into `client-db.ts` (Dexie) and `prisma` (SQLite).
   - Created `/api/style-anchors` for server-side persistence.
   - Fixed Jest environments: `node` default, `jsdom` for UI.
   - Unified TS types in `tsconfig.json` to prevent library resolution errors.

2. ✅ **Multi-mode planning page** - `/app/project/[id]/planning/page.tsx`
   - Tab navigation: [Plan] [Style] [Generation]
   - Right panel mode state with conditional rendering
   - File viewer menu in top-right dropdown
   - StyleAnchorEditor integrated in Style mode

3. ✅ **Style phase AI tools** - Complete integration
   - 4 new Zod tools: updateStyleKeywords, updateLightingKeywords, updateColorPalette, saveStyleAnchor
   - ChatInterface handles all style tool responses
   - StyleAnchorEditor pre-fills with AI suggestions
   - Full data flow: AI tools → ChatInterface → Planning page → StyleAnchorEditor

### **Next Priority**
1. **Create generation queue UI** - New components
   - Asset queue tree (showing parsed assets from plan)
   - Prompt editor (for reviewing/editing prompts)
   - Generation status tracking (pending, generating, complete)
   - Integration with `/api/generate` route

### **Future Phases**
- P1: Character registry UI, warning system
- P2: Batch generation workflow, cost estimation
- P3: Export phase, quality validation

---

## 📊 Project Completion

| Phase | Completion | Status |
|-------|-----------|--------|
| Planning Phase P1 | 100% | ✅ Complete |
| AI SDK v6 Migration | 100% | ✅ Complete |
| P0 Generation Backend | 100% | ✅ Complete |
| Plan Parser | 100% | ✅ Complete |
| Multi-Mode UI | 100% | ✅ Complete |
| Style Anchor Phase | 100% | ✅ Complete |
| Generation Phase | 85% | 🟢 Backend + UI done, integration pending |
| Export Phase | 0% | 🔴 Not started |

**Overall: ~80%** ⬆️ (up from 75%)

---

## 🔑 Critical Implementation Notes

### **Tool Execution (AI SDK v6)**
```typescript
// ALWAYS include for tool execution:
stopWhen: stepCountIs(10)

// ALWAYS use correct properties:
toolCall.input (not .args)
inputSchema (not parameters)

// Handle flexible parameter formats (Gemini)
if (input.qualityKey) { /* expected */ }
else { Object.entries(input).forEach(...) } /* actual */
```

### **Character Consistency**
```typescript
// MUST include FULL description in EVERY pose:
"pixel art sprite of farmer character with straw hat,
weathered blue overalls, brown boots, [NEW POSE]"
//                     ^--- Same base description ---^
```

### **Image Conversion**
```typescript
// Store as Blob in IndexedDB (efficient)
image_blob: Blob

// Convert to base64 for API calls (Flux.2 requirement)
images: [await blobToBase64(styleAnchor.reference_image_blob)]

// Cache base64 in database to avoid repeated conversion
reference_image_base64: string
```

---

**Status:** P0 generation infrastructure complete. Ready to build UI integration and plan parser.

