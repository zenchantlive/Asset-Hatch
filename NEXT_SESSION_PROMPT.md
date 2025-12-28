# Next Session: Generation Phase - Prompt Wiring & UI Layout

**Branch:** `feat/generation-queue-ui`
**Last Session:** 2025-12-27
**Status:** Memory Files API Complete, Generation Core Pending

---

## 🎯 Session Goal

Wire up asset prompt generation and fix Generation tab UI layout to complete Phase 3A of the generation workflow.

---

## ✅ What's Already Working

1. **Plan Loading** - GenerationQueue loads plan from `/api/projects/[id]/memory-files` without 404 errors
2. **Files Panel** - Slide-out panel shows entities.json and style-draft with preview
3. **Asset Tree** - Hierarchical display of parsed assets in GenerationQueue
4. **Batch Generation Hook** - `useBatchGeneration` with pause/resume/progress tracking
5. **API Endpoints** - `/api/generate` and `/api/generate-style` using shared OpenRouter utility
6. **Style Anchor** - E2E flow with Flux.2 image generation working

---

## 🚧 Critical Blockers (This Session)

### 1. **Prompt Generation Wiring** ⚠️ HIGH PRIORITY

**Problem:**
- Asset cards show "Prompt preview will appear here" placeholder
- No actual prompt generation happening
- User cannot view/edit prompts before generation

**What Needs to be Done:**

#### A. Add Prompt Generation Button to AssetCard
**File:** `components/generation/AssetCard.tsx`

```typescript
// Add button that calls buildAssetPrompt()
<button
  onClick={() => handleGeneratePrompt(asset)}
  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded text-sm"
>
  Generate Prompt
</button>
```

#### B. Wire Up Prompt Builder
**File:** `components/generation/GenerationQueue.tsx` or `AssetCard.tsx`

```typescript
import { buildAssetPrompt } from '@/lib/prompt-builder'

const handleGeneratePrompt = async (asset: ParsedAsset) => {
  // Fetch project qualities and style anchor
  const project = await db.projects.get(projectId)
  const styleAnchor = await db.style_anchors
    .where('project_id')
    .equals(projectId)
    .first()

  // Build the prompt
  const prompt = buildAssetPrompt(asset, {
    qualities: project.qualities,
    styleAnchor: {
      styleKeywords: styleAnchor.style_keywords,
      lightingKeywords: styleAnchor.lighting_keywords,
      colorPalette: JSON.parse(styleAnchor.color_palette),
    },
  })

  // Store in state for preview/edit
  setAssetPrompts(prev => ({ ...prev, [asset.id]: prompt }))
}
```

#### C. Add Prompt Preview/Edit Area
**File:** `components/generation/AssetCard.tsx`

```typescript
{assetPrompts[asset.id] && (
  <div className="mt-3 p-3 bg-black/20 rounded border border-white/5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-white/60">Generated Prompt</span>
      <button
        onClick={() => setEditingPrompt(asset.id)}
        className="text-xs text-purple-400 hover:text-purple-300"
      >
        Edit
      </button>
    </div>

    {editingPrompt === asset.id ? (
      <textarea
        value={assetPrompts[asset.id]}
        onChange={(e) => updatePrompt(asset.id, e.target.value)}
        className="w-full bg-black/30 text-white/90 text-xs p-2 rounded"
        rows={4}
      />
    ) : (
      <p className="text-xs text-white/80">{assetPrompts[asset.id]}</p>
    )}
  </div>
)}
```

#### D. Connect Generate Button to API
**File:** `hooks/useBatchGeneration.ts`

```typescript
// Modify startBatch to accept custom prompts
const startBatch = async (
  assets: ParsedAsset[],
  model: string,
  customPrompts?: Record<string, string> // NEW
) => {
  for (const asset of assets) {
    const prompt = customPrompts?.[asset.id] || buildAssetPrompt(asset, ...)

    // Call /api/generate with the prompt
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        assetId: asset.id,
        prompt,
        model,
      }),
    })
    // ... handle response
  }
}
```

**Expected Outcome:**
- User clicks "Generate Prompt" → Prompt appears in preview
- User can edit prompt before generation
- User clicks "Generate Asset" → API called with custom/edited prompt

---

### 2. **Generation Tab UI Layout Fix** ⚠️ HIGH PRIORITY

**Problem:**
- Generation tab still shows chat interface on left side
- Not ideal for focused generation workflow
- Should be full-width with Asset Queue | Generation Progress split

**What Needs to be Done:**

#### Fix Planning Page Layout
**File:** `app/project/[id]/planning/page.tsx`

**Current Code (Lines ~179-216):**
```typescript
<div className="flex-1 flex overflow-hidden relative z-10">
  <div className="w-1/2 flex flex-col border-r border-white/5">
    <ChatInterface />  {/* ← ALWAYS VISIBLE */}
  </div>

  <div className="w-1/2 flex flex-col relative">
    {mode === 'plan' && <PlanPreview />}
    {mode === 'style' && <StylePreview />}
    {mode === 'generation' && <GenerationQueue />}
  </div>
</div>
```

**Required Change:**
```typescript
<div className="flex-1 flex overflow-hidden relative z-10">
  {mode === 'generation' ? (
    // Full-width GenerationQueue (already has internal 50/50 split)
    <GenerationQueue projectId={params.id as string} />
  ) : (
    // Keep 50/50 split for Plan and Style modes
    <>
      <div className="w-1/2 flex flex-col border-r border-white/5">
        <ChatInterface
          qualities={qualities}
          projectId={typeof params.id === 'string' ? params.id : ''}
          onQualityUpdate={handleQualityUpdate}
          onPlanUpdate={handlePlanUpdate}
          onPlanComplete={handleApprovePlan}
          onStyleDraftUpdate={handleStyleDraftUpdate}
          onStyleAnchorGenerated={handleStyleAnchorGenerated}
          onStyleFinalized={handleStyleFinalized}
        />
      </div>

      <div className="w-1/2 flex flex-col relative">
        {mode === 'plan' && (
          <PlanPreview
            markdown={planMarkdown}
            onEdit={handleEditPlan}
            onApprove={handleApprovePlan}
            isLoading={isApproving}
          />
        )}

        {mode === 'style' && (
          <StylePreview
            styleDraft={styleDraft}
            generatedAnchor={generatedAnchor}
            isGenerating={isGeneratingStyle}
            onFinalize={handleStyleFinalized}
          />
        )}
      </div>
    </>
  )}
</div>
```

**Expected Outcome:**
- When user switches to Generation tab → Chat disappears, GenerationQueue takes full width
- GenerationQueue already has correct internal layout: Asset Tree (left) | Progress (right)
- Plan and Style tabs remain unchanged with chat visible

---

## 📁 Key Files Reference

### Files to Modify (Priority Order)
1. `components/generation/AssetCard.tsx` - Add prompt generation button + preview
2. `components/generation/GenerationQueue.tsx` - Wire up prompt builder logic
3. `hooks/useBatchGeneration.ts` - Accept custom prompts parameter
4. `app/project/[id]/planning/page.tsx` - Fix layout conditional rendering

### Utilities Available
- `lib/prompt-builder.ts` - `buildAssetPrompt()` function (already exists)
- `lib/prompt-templates.ts` - Template system by asset type (already exists)
- `lib/client-db.ts` - Dexie database for client-side data
- `lib/db-utils.ts` - Helper functions for Dexie operations

---

## 🧪 Testing Checklist

After implementation, verify:

1. **Prompt Generation:**
   - [ ] Click "Generate Prompt" on asset card → Prompt appears
   - [ ] Prompt includes style keywords, colors, perspective, lighting
   - [ ] Can edit prompt in preview area
   - [ ] Edited prompt persists in state

2. **Layout Fix:**
   - [ ] Switch to Generation tab → Chat disappears
   - [ ] GenerationQueue takes full width
   - [ ] Asset Tree visible on left, Progress on right
   - [ ] Switch back to Plan/Style → Chat reappears

3. **Generation Flow:**
   - [ ] Generate prompt → Edit if needed → Click "Generate Asset"
   - [ ] API receives custom prompt
   - [ ] Image generation starts with correct prompt

---

## 💾 Memory System

**Read Before Starting:**
- `memory/active_state.md` - Current session status
- `memory/GENERATION_WORKFLOW_GAPS.md` - Complete specs for all pending features
- `memory/PROJECT_ARCHITECTURE.md` - System architecture overview

**Update After Session:**
- `memory/active_state.md` - Mark prompt generation + layout as complete
- Document any new patterns or decisions

---

## 🎨 Code Style Reminders

- Add detailed inline comments explaining logic
- Use TypeScript strict mode (no `any` types)
- Follow React Hook patterns (useCallback for stable references)
- Maintain glassmorphism aesthetic (bg-white/5, backdrop-blur, etc.)
- Keep files focused and readable (split into smaller components if >300 lines)

---

## 🚀 Quick Start Commands

```bash
# Navigate to project
cd /mnt/c/Users/Zenchant/asset-hatch/asset-hatch-spec/asset-hatch

# Check current branch
git status

# Run dev server (user will run in Windows PowerShell)
bun dev

# Type check
bun run typecheck

# Lint
bun run lint
```

---

## 📊 Success Criteria

This session is complete when:

✅ Asset cards have "Generate Prompt" button
✅ Clicking button generates prompt using `buildAssetPrompt()`
✅ Prompt appears in editable preview area
✅ Custom/edited prompts can be passed to generation API
✅ Generation tab takes full width (no chat visible)
✅ Asset Queue and Generation Progress visible in 50/50 split
✅ Type checks pass
✅ Lint passes
✅ User can successfully generate asset with custom prompt

---

**IMPORTANT:** User runs `bun dev` in Windows PowerShell. Claude Code operates in WSL2. Don't try to start dev server yourself - just make file changes and let user test.

**Ready to start?** Read `memory/active_state.md` and `memory/GENERATION_WORKFLOW_GAPS.md` first, then begin with prompt generation wiring in `AssetCard.tsx`.
