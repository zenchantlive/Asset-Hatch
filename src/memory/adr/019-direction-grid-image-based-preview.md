# ADR-019: Image-Based DirectionGrid Preview for Moveable Assets

**Status:** Accepted
**Date:** 2025-12-31
**Deciders:** User, Claude Code

---

## Context

The initial DirectionGrid implementation (ADR-016 phases 1-11) used an icon-based selection interface where users clicked compass arrows to select directions for generation. However, user testing revealed critical UX issues:

1. **Disconnected UI:** Direction grid was a separate section below the main preview image, creating cognitive overhead
2. **No visual feedback:** Users couldn't see what was already generated vs. what was pending
3. **No generate buttons:** Users had no way to actually trigger generation from the grid
4. **Screen takeover:** Clicking direction children in the queue took over the entire screen with standard preview
5. **Poor sizing:** Grid too large, couldn't see prompt preview area without scrolling

User feedback: *"the direction variants should be a part of the main image's card... give each direction a card... this would replace the current image at the top with the direction grid"*

---

## Decision

**Redesign DirectionGrid as an image-based 3x3 preview grid that completely replaces the standard preview for moveable assets.**

### Architecture Changes

1. **Grid Layout:**
   - 3x3 CSS Grid with 8 directional cells + 1 center cell
   - Center cell: Active direction shown at larger size (main preview)
   - Surrounding cells: 8 directional previews (smaller)
   - Each cell shows actual generated image or empty state with generate button

2. **Context Updates:**
   - Added `addAsset(asset: ParsedAsset)` function to `GenerationContextValue`
   - Modified `generateImage` to accept optional `providedAsset` parameter
   - On-demand creation of direction children when user clicks generate

3. **UI Controls:**
   - Grid size toggle: Small (max-w-sm) / Medium (max-w-md) / Large (max-w-2xl)
   - Individual maximize: Inline enlarged preview below grid (not modal)
   - Batch selection: Ctrl/Cmd+Click or right-click
   - Generate buttons: Individual per direction + batch bar

4. **Integration:**
   - PreviewPanel conditionally renders DirectionGrid for `mobility.type === 'moveable'`
   - CategoryQueuePanel selects parent when clicking direction children (prevents screen takeover)

---

## Consequences

### Positive

* **Single-source preview:** Direction grid IS the preview, reducing cognitive load
* **Visual state clarity:** Users immediately see which directions are generated/pending
* **Actionable UI:** Generate buttons directly on each direction card
* **Compact layout:** Entire workflow fits on screen without scrolling
* **No screen takeover:** Direction children stay within grid context
* **Flexible sizing:** User controls grid size based on screen real estate
* **On-demand creation:** Direction assets only created when user clicks generate (reduces memory)

### Negative

* **More complex component:** DirectionGrid is now 500+ lines (was ~200)
* **State management overhead:** Multiple state variables for grid size, maximize, selection
* **Race condition risk:** Required fixing async state update timing with `providedAsset` pattern

### Neutral / Trade-offs

* **Replaces standard preview:** Moveable assets don't use VersionCarousel (acceptable trade-off)
* **Center cell always active:** No "preview all at once" mode (9 images simultaneously)
* **Inline maximize:** Takes vertical space below grid (alternative was modal popup)

---

## Alternatives Considered

### Alternative 1: Icon-based grid with modal previews
* **Pros:** Simpler implementation, kept standard preview separate
* **Cons:** User explicitly rejected this, cognitive overhead of two preview areas
* **Why rejected:** User feedback: "direction variants should be part of the main image's card"

### Alternative 2: Lightbox modal for maximized view
* **Pros:** Doesn't take up vertical space, familiar pattern
* **Cons:** Breaks page flow, requires extra click to dismiss
* **Why rejected:** User wanted inline enlarged view: "show a larger version of the selected created generation"

### Alternative 3: 4-direction grid only (no diagonals)
* **Pros:** Simpler 2x2 grid, less screen space
* **Cons:** Limits user flexibility, 8-DIR assets need diagonals
* **Why rejected:** User wanted "all 8 directions always visible"

### Alternative 4: Fixed grid size
* **Pros:** Simpler implementation, no size state management
* **Cons:** Doesn't adapt to different screen sizes or user preferences
* **Why rejected:** Needed responsive sizing to prevent scrolling

---

## Implementation Notes

### Key Files

1. **DirectionGrid.tsx** (NEW)
   - 3x3 CSS Grid with `grid-cols-3` layout
   - `getOrCreateDirectionChild()` creates direction variants on-demand
   - `handleGenerateDirection()` calls `generateImage(dirAsset.id, dirAsset)`
   - Grid size state: `'small' | 'medium' | 'large'`
   - Maximize state: `maximizedDirection: Direction | null`

2. **GenerationQueue.tsx**
   - Added `addAsset` function using `setParsedAssets`
   - Modified `generateImage` signature: `(assetId: string, providedAsset?: ParsedAsset)`
   - Exposed `addAsset` in context value

3. **PreviewPanel.tsx**
   - Conditional rendering: `asset.mobility.type === 'moveable'` → DirectionGrid

4. **CategoryQueuePanel.tsx**
   - Direction children click handler: `selectAsset(asset, 'queue')` (selects parent)

5. **types/generation.ts**
   - Updated `GenerationContextValue` interface with `addAsset` and modified `generateImage`

### Race Condition Pattern

**Problem:** `addAsset` updates React state asynchronously, but `generateImage` needs the asset immediately.

**Solution:**
```typescript
// DirectionGrid
const dirAsset = getOrCreateDirectionChild(direction)
await generateImage(dirAsset.id, dirAsset) // Pass asset directly

// GenerationQueue
const generateImage = async (assetId: string, providedAsset?: ParsedAsset) => {
  const asset = providedAsset || parsedAssets.find(a => a.id === assetId)
  // Uses provided asset if available, bypassing lookup
}
```

### Styling Conventions

- All dimensions use `rem` units (gap-2, p-2, text-xs, w-8, h-8)
- Loading indicators match batch panel: `w-8 h-8 text-purple-500 animate-spin`
- Grid size classes: `max-w-sm` (small), `max-w-md` (medium), `max-w-2xl` (large)
- Compact spacing throughout to fit on screen without scrolling

---

## Review Schedule

Review after initial user testing of multi-directional asset workflow. Specifically:

- [ ] Test on-demand direction creation (no pre-creation lag)
- [ ] Verify all 8 directions generate correctly
- [ ] Test grid sizing on different screen sizes
- [ ] Verify inline maximize doesn't cause scroll issues
- [ ] Test batch generation of 4+ directions

---

## References

* ADR-016: Generation UI Batch Redesign (phases 1-11 of Direction Selection UX)
* User feedback: "direction variants should be a part of the main image's card"
* React async state update pattern: https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state
* CSS Grid 3x3 layout: https://css-tricks.com/snippets/css/complete-guide-grid/
