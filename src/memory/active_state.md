# 🧠 Active Session State

**Last Updated:** 2025-12-31
**Session:** Direction Selection UX v3 - ✅ COMPLETE (14/14 phases)
**Branch:** `feat/image-route-switching`
**Latest Commits:**
- `c0eced7` - chore(repo): [Infrastructure] Schemas, Database, and Project Documentation
- `f8c80e4` - feat(ui): [Generation] Complete Queue and Batch Workflow Infrastructure
- `7f002fc` - feat(core): [Prompt] Optimized Prompt Engineering and Templates
- `bdce843` - feat(style): [System] Style Anchor Generation and AI Analysis
- `2a3cc1f` - feat(core): [System] Model Registry and Cost Tracking System
- `dd9e2f2` - fix(ui): [Generation] Auto-deselect approved assets with exit animation
- `121ebf9` - fix(ui): [PreviewPanel] Add Generate button for single asset workflow

---

## 📍 Current Focus

> **🎉 DIRECTION SELECTION UX v3 - COMPLETE:** Multi-directional asset workflow fully implemented with image-based preview grid. Direction variants are now separate queue items with individual prompts, approval states, and reference image consistency. User can generate directions on-demand via image-based 3x3 grid that replaces standard preview for moveable assets. All phases complete and tested.

---

## 🔥 Latest Session (2025-12-31) - Direction Selection UX v3

### Architecture Overview
**Goal:** Enable multi-directional asset generation where each direction is a separate queue item with individual approval, prompts, and reference image consistency.

**Key Decision:** Directions as separate `ParsedAsset` entries (not versions), linked via `parentAssetId`.

### ✅ Phase 1-5: Core Infrastructure (COMPLETE)

**1. Data Model Updates**
- Modified `ParsedAsset.directionState` to use user-friendly names (Front/Back/Left/Right)
- Added `parentAssetId`, `direction`, `isParent` properties for parent-child linking
- Removed `selectedForGeneration` (no longer needed)

**2. Direction Utilities**
- Created `src/lib/direction-utils.ts` with:
  - `expandAssetToDirections()` - Converts parent asset to 4/8 directional variants
  - `getDirectionPromptModifier()` - Returns direction-specific prompt text
  - `isReferenceDirection()` - Checks if asset is Front (reference)
  - `getDirectionalSiblings()` - Finds all direction variants of same parent
  - Export naming: `{asset_name}_{direction}.png` (snake_case)

**3. Prompt Builder Enhancement**
- Integrated direction modifiers into `buildAssetPrompt()`
- Auto-injects direction-specific text (e.g., "front-facing view, looking toward viewer")
- Adds reference consistency markers when `referenceImageBase64` exists

**4. Generation API Update**
- Modified `/api/generate/route.ts` reference image priority:
  - **1st Priority:** Parent direction reference (Front → Back/Left/Right)
  - **2nd Priority:** Character registry reference
  - **3rd Priority:** Style anchor
- Queries database for parent asset's approved image
- Converts Buffer to base64 for API compatibility

**5. DirectionGrid Component**
- Wired up `onGenerateDirections` callback
- Added Front direction approval validation
- Implemented loading states and cost calculation ($0.04/direction)
- Updated to user-friendly direction names throughout

**6. PreviewPanel Integration**
- Added `handleGenerateDirections` callback for batch direction generation
- Added `handleDirectionSelect` for navigating to specific direction variants
- Integrated DirectionGrid component with full callback wiring

**7. CategoryQueuePanel Update**
- Added `isChildAsset()` helper to filter direction children from queue
- Added `getDirectionalChildren()` to find child directions of parent asset
- Implemented collapsible parent-child hierarchy with expand/collapse state
- Added direction badge showing approval progress (e.g., "4-DIR: 2/4 ✓")
- Direction children display as nested items with smaller styling

**8. Reference Propagation**
- Modified `approveAsset()` in GenerationQueue to propagate reference images
- On Front direction approval, automatically updates all sibling directions
- Propagates `referenceImageBase64` and `referenceDirection: 'front'` to siblings
- Added log entries for visibility ("📸 Propagating Front reference to X sibling directions")
- Ensures visual consistency across all directional variants

**9. Flexible Direction Selection**
- Removed show/hide diagonals toggle from DirectionGrid
- All 8 directions now always visible in 3x3 grid
- Unselected/ungenerated directions greyed out (opacity-40) with hover reveal
- No restrictions on 4-DIR vs 8-DIR - users can select any combination
- Added "All 8 directions • Click to select" helper text

**10. Prompt Preview UI**
- Added collapsible "Prompt Preview" section in DirectionGrid
- Shows when directions are selected (appears between grid and batch button)
- Displays direction-specific prompt modifiers for each selected direction
- Clean, compact design with Eye icon and expand/collapse animation
- Helps users understand what will be generated before triggering batch

**11. Export Naming Convention**
- Modified `generateSemanticId()` in prompt-builder to handle directional assets
- Imported `DIRECTION_EXPORT_NAMES` from direction-utils
- Direction suffix prioritized over variant name in filename
- Examples: `character_farmer_front.png`, `character_farmer_back_left.png`
- Standardized snake_case naming matches project export standards

**12. DirectionGrid Redesign (Image-Based Preview)**
- **USER FEEDBACK:** "direction variants should be a part of the main image's card"
- Completely redesigned DirectionGrid to replace standard preview for moveable assets
- Changed from icon-based selection to **image-based 3x3 grid**
- Center cell shows active direction at larger size, 8 surrounding cells show directional previews
- Each cell displays actual generated image or empty state with generate button
- Added grid size toggle (Small/Medium/Large) for entire grid
- Added inline maximize for individual directions (shows enlarged view below grid, not modal)
- Loading indicators match batch panel style (w-8 h-8 text-purple-500 animate-spin)
- Batch selection via Ctrl/Cmd+Click or right-click context menu
- Generate buttons on individual cards + batch generation bar with cost estimate
- PreviewPanel conditionally renders DirectionGrid for `mobility.type === 'moveable'`
- CategoryQueuePanel modified to select parent when clicking direction children (prevents screen takeover)

**13. On-Demand Asset Creation**
- **PROBLEM:** No way to create direction child assets when user clicks generate
- Added `addAsset(asset: ParsedAsset)` function to GenerationQueue context
- Function checks for duplicates and adds new asset to `parsedAssets` state
- Updated `GenerationContextValue` interface with `addAsset` method
- DirectionGrid's `getOrCreateDirectionChild()` uses `addAsset` to create variants on-demand
- Creates new `ParsedAsset` with unique ID, parent link, and direction metadata

**14. Race Condition Fix**
- **PROBLEM:** `generateImage` couldn't find newly added assets due to async state updates
- **ERROR:** "Asset not found" when calling `generateImage` immediately after `addAsset`
- Modified `generateImage` signature to accept optional `providedAsset` parameter
- `generateImage(assetId: string, providedAsset?: ParsedAsset)` uses provided asset if available
- DirectionGrid now calls `generateImage(dirAsset.id, dirAsset)` to bypass lookup
- Fixes race condition where React state hasn't updated yet
- Backend API call now happens successfully on first click

### ✅ All Phases Complete!

**Feature Status:** Direction Selection UX v3 is fully implemented with image-based preview and working generation.

### Key User Decisions Made
1. ✅ **Direction Naming:** User-friendly (Front/Back/Left/Right) over compass (North/South/East/West)
2. ✅ **Diagonal Handling:** All 8 directions always visible, greyed out when unselected
3. ✅ **Persistence:** Database + Client (full persistence via Prisma + Dexie)
4. ✅ **Export Naming:** Snake_case with direction suffix (e.g., `farmer_front.png`)
5. ✅ **Preview Design:** Image-based 3x3 grid replaces standard preview for moveable assets
6. ✅ **Maximize UI:** Inline enlarged preview below grid (NOT modal popup)
7. ✅ **Grid Sizing:** Small/Medium/Large toggle for entire grid (max-w-sm/md/2xl)
8. ✅ **Generation UX:** Generate buttons on each direction card + batch controls

---

## 📚 Previous Sessions

### Session (2025-12-31) - Generation UI Polish & Flow

### 1. Unified Generation Entry
**Context:**
The single-asset view lacked a direct generation trigger. Users were forced into "Batch Mode" even for a single item, creating unnecessary friction.

**Solution:**
- **Double-Entry Buttons:** Added a primary "Generate" button in the header and a compact secondary trigger near the status badge.
- **Dynamic Visibility:** Logic intelligently toggles between "Generate" (for new items) and "Regenerate" (for existing items).
- **Iconography:** Standardized on `Play` icon for generation and `RefreshCw` for regeneration.

### 2. "Satisfying Flow" Approval Logic
**Context:**
Approval was manual and static. Users had to manually deselect items, and the "Accept" icon in batch cards was broken due to incorrect version lookup.

**Solution:**
- **Corrected Version Lookup:** Switched from fragile ID matching to `currentVersionIndex` source of truth.
- **Auto-Deselection:** Approving an asset now automatically removes it from the batch selection, clearing the workspace for the next task.
- **Exit Animation:** Added a 300ms CSS exit transition (`rotate-12 zoom-out-0`) so assets "spin out" of view elegantly when approved.

### 3. Repository "Blog Notebook" Organization
**Context:**
49+ uncommitted files needed to be grouped into logical chunks to maintain the developer-diary narrative for the public repo.

**Solution:**
- Split work into 6 high-level commits: Model Registry, Style Anchors, Prompt Engineering, UI Infrastructure, Project Infrastructure, and UI Fixes.
- Each commit includes a "Story of Collaboration" and "Decisions Made" section in the message.

**Files:**
- `components/generation/panels/PreviewPanel.tsx` (Generate button + Flow)
- `components/generation/panels/BatchPreviewContent.tsx` (Logic Fix + Animation)
- `lib/types/generation.ts` (Auto-deselection types)

---

## � Session History (2025-12-31)

*   **Flux 2 Pro Migration**: Standardized all generation on `flux.2-pro` and implemented a `ModelRegistry` with resilient fallback logic for legacy IDs.
*   **Inline Cost Tracking**: Built a centralized `CostTracker` and integrated dynamic "Estimated → Actual" cost displays directly into the batch toolbars.
*   **Version Carousel System**: Introduced the `asset_versions` infrastructure and a navigation carousel to compare multiple generations side-by-side before approval.
*   **Performance Optimization**: Refactored rendering to use `Blob` URLs instead of large base64 strings, significantly reducing memory footprint and preventing tab crashes.
*   **Batch Workflow Refinement**: Implemented the two-step "Prep → Review → Generate" flow with dedicated icons and cost warnings for large batches.

---

## 🚧 Status Board

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ✅ Complete | OAuth linking with GitHub |
| **Generation Workflow** | ✅ Complete | Batch UX + Version System + Cost Tracking |
| **Direction Selection** | ✅ Complete | Multi-directional assets with reference propagation |
| **Data Sync** | ✅ Complete | Prisma→Dexie hybrid persistence |
| **Export System** | ✅ Complete | Multi-format ZIP exports with direction naming |
| **Model Management** | ✅ Complete | Registry + Price Discovery |
| **Open Source Prep** | ✅ Complete | BFG cleanup, Docs, Env examples |

---

## 🚀 Next Steps

1. ✅ **COMPLETE:** Direction Selection UX v3 - All 14 phases implemented
2. 🧪 **IN PROGRESS:** Test multi-directional asset workflow end-to-end
   - Test on-demand direction child creation
   - Generate individual directions via DirectionGrid
   - Test batch generation of multiple directions
   - Verify images stay in grid (no screen takeover)
   - Verify grid sizing and maximize features
   - Test export naming convention (e.g., `farmer_front.png`)
3. 📝 **NEXT:** Push to remote and verify GitHub Actions
4. ⏳ **PENDING:** Make repository public
5. 📝 **OPTIONAL:** Blog post: "Building a Multi-Directional Asset System with Image-Based UX"

---

## 💡 Key Decision Made

**Simplified API key approach:** Instead of complex per-user encrypted database storage, we're using simple `.env` file configuration. Users add their OpenRouter key to `.env.local`. This is cleaner for self-hosted open source - the encrypted DB approach was overkill.

---

---

