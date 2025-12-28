# ADR 009: Individual Asset Generation Workflow

**Date:** 2025-12-27
**Status:** ✅ Implemented
**Deciders:** Zenchant (User), Claude (Implementation)
**Tags:** #generation #ux #workflow

---

## Context

After implementing the basic generation queue UI and prompt generation system, we needed to decide on the user workflow for actually generating, reviewing, and approving assets. The initial implementation had batch controls with a "Generate All" button, but the user wanted a more controlled, per-asset approach.

### User Requirements
1. Generate assets individually (not all at once)
2. Preview generated images before saving
3. Approve or reject each image
4. View all approved assets in a dedicated panel
5. Regenerate or edit prompts for individual assets

### Existing Patterns
- **Style Anchor Flow**: User uploads reference → AI generates style anchor image → User approves/rejects → Saved to database
- **Files Panel**: Slide-out panel showing memory files with detail view
- **Prompt Preview**: Editable prompt generation with character count

---

## Decision

We will implement an **individual asset generation workflow** with an approval step for each generated image, inspired by the style anchor approval flow.

### Workflow Steps

```
1. User clicks "Generate Prompt" → Prompt appears with editing capability
2. User clicks "Generate Image" → API generates image using prompt + style anchor
3. Generated image shows in "Awaiting Approval" section (right panel)
4. User clicks "Approve" → Asset saves to Dexie database
   OR
   User clicks "Reject" → Asset can be regenerated with different settings
5. Approved assets appear in "Assets Panel" (slide-out like Files panel)
```

### Key Components

#### 1. Asset State Machine
```typescript
type AssetGenerationState =
  | { status: 'pending' }                              // Not started
  | { status: 'generating'; progress?: number }        // In progress
  | { status: 'awaiting_approval'; result: GeneratedAssetResult }
  | { status: 'approved'; result: GeneratedAssetResult }
  | { status: 'rejected' }
  | { status: 'error'; error: Error }
```

#### 2. AssetApprovalCard Component
- Large image preview
- Approve/Reject buttons at top (user requirement)
- Prompt used for generation
- Metadata (model, seed, cost, duration)
- Regenerate option

#### 3. Assets Panel
- Slide-out panel (48rem width)
- Grid display of approved assets
- Click for detail view with full prompt and metadata
- Edit prompt and regenerate functionality (TODO)

#### 4. Integration Points
- **GenerationQueue Context**: Manages `assetStates` Map and handlers
- **GenerationProgress**: Shows awaiting approval cards with scrollable area
- **Planning Page**: Assets button in header next to Files button

---

## Rationale

### Why Individual vs Batch?

**Chosen: Individual Generation** ✅

**Reasons:**
1. **User Control**: User can review each asset before committing storage
2. **Cost Management**: Prevents burning API credits on unwanted variations
3. **Iterative Refinement**: Can edit prompts and regenerate without restarting entire batch
4. **Consistent with Style Anchor**: Matches existing approval pattern users already know
5. **Better Feedback Loop**: Immediate visual confirmation of what prompt parameters produce

**Alternative Considered: Batch Generation** ❌

Would have meant:
- Generate all assets at once
- Auto-save all results
- Review afterward with delete option
- Higher risk of wasted API calls
- Less control over individual results

### Why Approval Step?

**Chosen: Explicit Approve/Reject** ✅

**Reasons:**
1. **Quality Gate**: Prevents saving suboptimal results
2. **Character Consistency**: For characters, user can reject if doesn't match character description
3. **Prompt Refinement**: Rejection enables prompt tweaking and regeneration
4. **Cost Awareness**: User sees cost before committing to save
5. **Matches Existing Pattern**: Style anchor has same approval flow

**Alternative Considered: Auto-Save All** ❌

Would have meant:
- No review step
- All generated assets automatically saved
- User would need to delete bad results
- Harder to maintain character consistency
- More database clutter

### Why Assets Panel?

**Chosen: Dedicated Slide-Out Panel** ✅

**Reasons:**
1. **Consistent UX**: Matches Files panel pattern users already understand
2. **Focused View**: Dedicated space for reviewing all generated work
3. **Accessible Everywhere**: Available from all tabs (Plan, Style, Generation)
4. **Detail View**: Click to see full prompt, metadata, and large preview
5. **Management Hub**: Central place for regeneration and prompt editing

**Alternative Considered: In-Line Gallery** ❌

Would have meant:
- Gallery embedded in GenerationQueue component
- Only accessible in Generation tab
- Harder to review multiple assets side-by-side
- Less space for metadata display

---

## Implementation Details

### State Management

**Context Pattern**: All state managed in `GenerationQueue` context
```typescript
interface GenerationContextValue {
  assetStates: Map<string, AssetGenerationState>
  generateImage: (assetId: string) => Promise<void>
  approveAsset: (assetId: string) => Promise<void>
  rejectAsset: (assetId: string) => void
  // ...
}
```

**Why Context?**
- Shared state across AssetTree, PromptPreview, GenerationProgress, Assets Panel
- Avoid prop drilling through multiple component layers
- Centralized handlers for state transitions

### Data Flow

```
User Action → Context Handler → API Call → State Update → UI Re-render
    ↓              ↓                ↓           ↓              ↓
Generate Image → generateImage() → /api/generate → assetStates.set() → AssetApprovalCard shows
    ↓              ↓                ↓           ↓              ↓
Approve → approveAsset() → Dexie write → assetStates.set('approved') → Assets Panel loads
```

### Style Anchor Integration

**Critical Feature**: Pass style anchor image with every generation request

```typescript
const styleAnchor = await db.style_anchors
  .where('project_id')
  .equals(projectId)
  .first()

await fetch('/api/generate', {
  body: JSON.stringify({
    styleAnchorImageUrl: styleAnchor?.reference_image_blob
  })
})
```

**Why?**
- Flux.2 supports image conditioning for visual consistency
- Ensures all assets match the approved style anchor
- Critical for maintaining cohesive art direction

### Database Schema

**Dexie Storage**:
```typescript
{
  id: string
  project_id: string
  asset_id: string
  variant_id: string
  image_blob: Blob              // Actual image data
  image_base64: string          // Cached for display
  prompt_used: string
  generation_metadata: {
    model: string
    seed: number
    cost: number
    duration_ms: number
  }
  status: 'approved'           // Only approved assets in DB
  created_at: string
  updated_at: string
}
```

**Why Both Blob and Base64?**
- `image_blob`: Proper type for database storage, future API upload
- `image_base64`: Fast display without conversion, already in memory

---

## Consequences

### Positive ✅

1. **Better User Control**: Approve/reject each asset individually
2. **Cost Efficiency**: Don't pay for unwanted variations
3. **Quality Assurance**: Visual review before committing to database
4. **Consistent UX**: Matches style anchor approval pattern
5. **Flexible Iteration**: Easy to regenerate with tweaked prompts
6. **Character Consistency**: Can reject if character doesn't match description
7. **Transparent Costs**: See generation cost before approving
8. **Organized Assets**: Dedicated panel for all approved work

### Negative ❌

1. **More Clicks**: Each asset requires approve/reject action
2. **Slower Overall**: Can't fire-and-forget an entire batch
3. **More State Management**: Tracking individual asset states adds complexity
4. **Approval Fatigue**: For large projects, many approval clicks needed

### Mitigations

1. **Keyboard Shortcuts** (Future): Add hotkeys for approve/reject
2. **Batch Approval Option** (Future): Select multiple + approve all
3. **Smart Defaults** (Future): Auto-approve if confidence score > threshold
4. **Generation Presets** (Future): Save successful prompts for reuse

---

## Alternatives Considered

### Option A: Batch Generation with Auto-Save ❌

**Approach**: Generate all assets, auto-save, user reviews and deletes bad ones

**Pros:**
- Faster for large batches
- Less user interaction required
- Simpler state management

**Cons:**
- Wastes API credits on bad results
- Database cluttered with rejected assets
- No pre-save quality gate
- Harder to track which assets need regeneration

**Why Rejected**: User explicitly requested individual generation with approval

### Option B: Queue-Based Background Generation ❌

**Approach**: User queues many assets, they generate in background, notifications on completion

**Pros:**
- User can continue working
- Good for very large batches
- Efficient resource usage

**Cons:**
- Complex background job system needed
- User might miss completion notifications
- Harder to track progress
- Approval workflow unclear

**Why Rejected**: Too complex for current scope, user wants immediate feedback

### Option C: In-Line Approval (No Separate Panel) ❌

**Approach**: Show approval UI directly in AssetTree items

**Pros:**
- No context switching
- All info in one place
- Simpler navigation

**Cons:**
- Cramped UI in asset tree
- Can't review multiple approved assets easily
- Harder to compare different assets
- No dedicated management space

**Why Rejected**: User wanted "asset menu just like files menu" for approved assets

---

## Related ADRs

- **ADR 007: Hybrid Persistence Model** - Why Dexie for approved assets
- **ADR 008: Style Anchor Image Generation** - Pattern this workflow follows
- **ADR 006: Generation Architecture** - Overall generation system design

---

## Implementation Checklist

- [x] Define AssetGenerationState type
- [x] Add assetStates Map to GenerationQueue context
- [x] Implement generateImage() function
- [x] Implement approveAsset() function with Blob conversion
- [x] Implement rejectAsset() function
- [x] Create AssetApprovalCard component
- [x] Update GenerationProgress to show approval cards
- [x] Make approval area scrollable
- [x] Move approve buttons to top of card
- [x] Create AssetsPanel component
- [x] Add Assets button to planning page
- [x] Integrate style anchor image in generation requests
- [x] Fix field naming consistency (imageUrl)
- [x] Add debug logging for troubleshooting
- [x] Test complete workflow: generate → approve → view in panel

---

## Future Enhancements

### Phase 3B (Next)
1. Implement regeneration handlers in AssetsPanel
2. Implement edit prompt handlers in AssetsPanel
3. Add cost estimation before generation
4. Add character registry validation warnings

### Phase 4 (Later)
5. Keyboard shortcuts for approve/reject
6. Batch approval for multiple assets
7. Export approved assets to sprite sheets
8. Generation presets (save successful prompts)
9. Confidence scores with auto-approve threshold
10. Background generation queue for large batches

---

## Lessons Learned

1. **User Clarity is Key**: Initial "prompt generation wiring" request was ambiguous. User clarification led to much better understanding of desired workflow.

2. **Existing Patterns Matter**: Reusing the style anchor approval pattern made the UX intuitive and implementation faster.

3. **Field Naming Consistency**: Small inconsistencies (image_url vs imageUrl) can break entire features. Strict naming conventions prevent this.

4. **Type Safety Catches Bugs**: TypeScript interfaces caught the field naming issue before runtime.

5. **Scrollable Areas Need Testing**: Initial approval area wasn't scrollable, causing UX issues. Always test overflow scenarios.

6. **Approval Button Placement**: User preference for buttons at top (not bottom) shows importance of accessibility testing.

7. **Style Anchor Integration**: Passing reference image to Flux.2 dramatically improves visual consistency - critical for game assets.

---

**Status:** ✅ Implemented and Tested
**Next Review:** After Phase 3B features (regeneration, edit prompt, cost estimation)
