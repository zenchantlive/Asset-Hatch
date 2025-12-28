# ADR-006: Generation Architecture and Workflow Design

**Status:** Accepted
**Date:** 2025-12-26
**Deciders:** Development Team

---

## Context

After completing Planning Phase P1 with AI SDK v6, we needed to design the complete architecture for asset generation. This includes:

1. **Multi-phase workflow** - How users progress from planning → style definition → generation
2. **Generation granularity** - Individual assets vs composite sprite sheets
3. **Version management** - How to handle plan/style changes after generation
4. **Style consistency** - How to ensure all generated assets match visually
5. **UI architecture** - Page structure and navigation patterns

**Key Requirements:**
- User must be able to iterate on plan/style without losing work
- Generated assets must be visually consistent
- Workflow should feel natural and conversational
- Support both professional studios and indie developers
- Generated assets will be given to AI coding agents (with vision) for game development

**Technical Constraints:**
- Flux.2 requires reference images for style consistency
- IndexedDB for client-side storage
- Next.js 16 App Router
- Must minimize API costs

---

## Decision

We will implement a **single-page multi-mode architecture** with **composite sprite sheet generation** as default and **flexible version-tracked editing**.

### Key Architectural Decisions:

#### 1. Single-Page Multi-Mode Design
Keep user on `/project/[id]/planning` page throughout all phases. Switch right panel modes instead of navigating between pages.

**Modes:**
- **Plan Mode** - Markdown plan preview with AI chat assistance
- **Style Mode** - Style keywords, color palette, reference image upload
- **Generation Mode** - Asset queue and prompt editor

**Navigation:**
- Tab-based: [Plan] [Style] [Generation]
- Saved files menu: Top-right dropdown showing entities.json, style-anchor.json
- Chat remains on left throughout entire workflow

#### 2. Composite Sprite Sheets (DEFAULT)
Generate multi-pose sprite sheets (one image with multiple frames) instead of individual images.

**Example:**
```
Input: "Farmer - Idle (4-direction)"
Output: ONE image with 4 frames (Front, Left, Right, Back)
```

**Granular mode available** for professional studios wanting individual control.

#### 3. Flexible Editing with Version Tracking
User can edit plan or style at any time. System tracks versions and marks affected generated assets as "outdated".

**Workflow:**
1. User edits plan after generating 5 assets
2. System warns: "This affects 5 existing assets"
3. User chooses: Mark as outdated / Regenerate now / Cancel
4. Generation queue shows warnings on outdated assets
5. User can regenerate individually or in batch

#### 4. Style Anchor Image Upload (REQUIRED)
Every generation includes a reference image sent to Flux.2 for visual consistency.

**Flow:**
1. User uploads reference image
2. AI vision model analyzes → suggests style keywords
3. Client extracts color palette
4. User edits suggestions
5. All generations include this image as reference

---

## Consequences

### Positive

* ✅ **Consistent UX** - User stays in same context, natural conversation flow
* ✅ **Flexibility** - Can iterate freely without losing work
* ✅ **Visual consistency** - Style anchor ensures all assets match
* ✅ **Cost efficient** - Composite sprites reduce API calls (1 vs 4+ per character)
* ✅ **Industry standard** - Sprite sheets are what game engines expect
* ✅ **LLM-friendly** - AI coding agents can process composite sheets
* ✅ **Professional support** - Granular mode available for studios
* ✅ **No data loss** - Version tracking keeps old assets until user decides
* ✅ **Clear visibility** - Warnings show impact of changes

### Negative

* ❌ **Complexity** - Version tracking adds implementation complexity
* ❌ **Storage overhead** - Storing multiple versions increases IndexedDB usage
* ❌ **Learning curve** - Users must understand composite vs granular modes
* ❌ **Migration effort** - Requires updating existing planning page architecture

### Neutral / Trade-offs

* ⚖️ **Single page vs multiple** - Faster UX but more complex state management
* ⚖️ **Composite vs granular** - Default optimizes for common case, option for edge case
* ⚖️ **Reference image required** - Extra step but critical for quality

---

## Alternatives Considered

### Alternative 1: Separate Pages for Each Phase
* **Pros:**
  - Simpler state management
  - Clear visual separation of phases
  - Easier to implement initially
* **Cons:**
  - Context lost between pages
  - Navigation friction
  - Chat history not continuous
  - Separate file menus needed
* **Why rejected:** Breaks conversation flow, worse UX

### Alternative 2: Lock Plan After First Generation
* **Pros:**
  - No version tracking needed
  - Simpler implementation
  - No "outdated" asset states
* **Cons:**
  - Too restrictive
  - Users can't iterate
  - Forces new project for minor changes
  - Poor user experience
* **Why rejected:** Users must be able to iterate freely

### Alternative 3: Granular Generation as Default
* **Pros:**
  - Maximum control per asset
  - Precise approval/rejection
  - Easy to replace individual frames
* **Cons:**
  - 4x more API calls
  - 4x higher cost
  - Not industry standard format
  - Inefficient for common use case
* **Why rejected:** Optimizes for edge case instead of common case

### Alternative 4: Auto-Regenerate on Plan Change
* **Pros:**
  - Always up-to-date
  - No manual regeneration needed
  - No "outdated" state
* **Cons:**
  - Expensive (unexpected API costs)
  - No user control
  - Might regenerate assets user was happy with
  - Could waste budget
* **Why rejected:** User should control when to spend money

### Alternative 5: No Reference Image (Text-Only Prompts)
* **Pros:**
  - Simpler workflow
  - No image upload step
  - Faster style definition
* **Cons:**
  - Inconsistent visual style across assets
  - Each generation looks different
  - Colors/style drift
  - Poor quality results
* **Why rejected:** Visual consistency is critical

---

## Implementation Notes

### Database Schema v3
```typescript
// MemoryFile with versioning
interface MemoryFile {
  version: number;        // Increments on save
  updated_at: string;     // Last edit timestamp
}

// GeneratedAsset links to plan/style versions
interface GeneratedAsset {
  plan_version: number;   // Which entities.json
  style_version: number;  // Which style-anchor
  status: 'generated' | 'outdated' | 'approved';
}

// StyleAnchor with reference image
interface StyleAnchor {
  reference_image_blob: Blob;
  reference_image_base64: string; // Cached for API
  style_keywords: string;
  lighting_keywords: string;
  color_palette: string[];
}
```

### Prompt Generation Flow
```
1. Parse plan → ParsedAsset[]
2. For each asset:
   - Determine type (character-sprite vs sprite-sheet)
   - Load project qualities, style anchor, character registry
   - buildAssetPrompt() with priority ordering
3. Call /api/generate:
   - Send prompt + style anchor image
   - Flux.2 generates with reference
4. Save GeneratedAsset with version links
5. Update character registry with seed
```

### Composite vs Granular Mode
```typescript
// Project setting (persisted in IndexedDB)
interface Project {
  generation_mode: 'composite' | 'granular';
}

// Plan parser behavior:
if (mode === 'composite') {
  // "Idle (4-direction)" → ONE sprite-sheet with 4 frames
  return {
    type: 'sprite-sheet',
    frameCount: 4,
    arrangement: 'horizontally in a single row',
  };
} else {
  // "Idle (4-direction)" → FOUR individual character-sprite tasks
  return [
    { type: 'character-sprite', pose: 'idle', direction: 'front' },
    { type: 'character-sprite', pose: 'idle', direction: 'left' },
    { type: 'character-sprite', pose: 'idle', direction: 'right' },
    { type: 'character-sprite', pose: 'idle', direction: 'back' },
  ];
}
```

### UI Component Structure
```
/app/project/[id]/planning/page.tsx
├─ [Plan] [Style] [Generation] tabs
├─ Chat (Left - persistent)
├─ Right Panel (mode-dependent):
│  ├─ Plan Mode: PlanPreview
│  ├─ Style Mode: StyleAnchorEditor
│  └─ Generation Mode: GenerationQueue
└─ Files Menu (Top-right dropdown)
```

### Files Implemented (P0)
- `lib/db.ts` - Schema v3
- `lib/image-utils.ts` - Blob/base64 conversion
- `lib/prompt-templates.ts` - 6 asset-type templates
- `lib/prompt-builder.ts` - Priority-ordered prompts
- `app/api/analyze-style/route.ts` - AI vision analysis
- `components/style/StyleAnchorEditor.tsx` - Style UI
- `app/api/generate/route.ts` - Flux.2 generation

### Files Needed (Next Phase)
- `lib/plan-parser.ts` - Markdown → ParsedAsset[]
- Updated `app/project/[id]/planning/page.tsx` - Tab navigation
- New components for generation queue UI

---

## Review Schedule

**Review after:** Generation Phase UI is complete and tested with real users

**Specific review points:**
- Is composite sprite sheet format working well for users?
- Do users understand version tracking and outdated assets?
- Is single-page architecture better than multi-page?
- Should granular mode be promoted or remain hidden?
- Is reference image upload UX smooth enough?

---

## References

### Internal Documentation
- ADR-005: Replace CopilotKit with Vercel AI SDK
- memory/GENERATION_WORKFLOW_GAPS.md - 13 critical gaps identified
- memory/P0_GENERATION_IMPLEMENTATION_SUMMARY.md - Implementation guide
- asset-hatch-docs/07-FLUX2_PROMPT_ENGINEERING.md - Prompt optimization

### External Resources
- [Flux.2 Documentation](https://blackforestlabs.ai/flux-2/)
- [OpenRouter Image Generation API](https://openrouter.ai/docs/images)
- [Sprite Sheet Best Practices](https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-and-animations)

### Design Inspiration
- Claude Code (single-page multi-mode interface)
- Cursor (tab-based navigation with persistent context)
- Figma (version history with restore capability)
- GitHub Desktop (diff view for changes)

---

## Key Learnings

### Critical Implementation Details

1. **Word Order Priority**
   - Flux.2: First 5 words carry highest weight
   - Templates ensure asset type + subject come first
   - "pixel art sprite of farmer..." vs "32x32 pixel art..."

2. **Character Consistency**
   - MUST include full base_description in EVERY pose
   - Store in character_registry
   - Track successful_seed for reproducibility

3. **Image Conversion**
   - Store as Blob in IndexedDB (efficient)
   - Convert to base64 for API calls (Flux.2 requirement)
   - Cache base64 to avoid repeated conversion

4. **Version Tracking**
   - Link GeneratedAssets to specific plan/style versions
   - Mark as 'outdated' when source changes
   - User controls regeneration timing

---

**Status:** Accepted. P0 backend implementation complete. UI integration in progress.

