# Asset Hatch - Workflow & User Flows

## The 4-Phase Workflow

Asset Hatch projects progress through 4 distinct phases: Planning, Style, Generation, and Export.

```
┌──────────────┐    ┌────────────┐    ┌──────────────┐    ┌────────┐
│   PLANNING   │───▶│   STYLE    │───▶│ GENERATION   │───▶│ EXPORT │
│              │    │            │    │              │    │        │
│ Define game  │    │ Anchor     │    │ Create all   │    │ Save & │
│ Build asset  │    │ visual     │    │ assets with  │    │ Share  │
│ list         │    │ style      │    │ consistency  │    │        │
└──────────────┘    └────────────┘    └──────────────┘    └────────┘
     ↑                                                            │
     │_____________ Can Return to Earlier Phases ________________│
```

Each phase can be revisited with warnings about consequences.

---

## Phase 1: Planning

**Objectives:**
- User describes their game
- AI asks clarifying questions
- Asset list is built and approved

**Key Activities:**
1. User provides game concept description
2. AI infers qualities and asks clarifying questions
3. User answers questions
4. AI builds asset list incrementally
5. User refines asset list
6. User approves plan

**Duration:** 10-20 minutes typical

**Entry Points:**
- New project from scratch
- Use a game type template
- Load existing project (resume planning)

**Exit Condition:**
- User clicks "Approve Plan"
- All required qualities are set
- Asset plan is comprehensive

**UI Elements:**
- Chat interface for agent conversation
- Qualities dropdown bar (showing what's set)
- Plan preview panel (showing assets as they're added)
- "Approve Plan" button (enabled when ready)

**Data Saved:**
- Conversation history
- All quality settings
- Asset plan (entities.json)
- project.json

---

## Phase 2: Style Anchoring

**Objectives:**
- User establishes a visual style reference
- System locks style for consistency
- User is ready for generation

**Key Activities:**
1. User uploads a style reference image
   - Can be existing game art they like
   - Can be an AI-generated test image
   - Can be a custom art piece
2. System analyzes image and extracts style rules
3. User confirms or refines style description
4. System locks style (can still edit but with warning)

**Duration:** 5-10 minutes

**Style Anchor Elements:**
- Reference image (PNG/JPG)
- Art style description (e.g., "Pixel art, NES-style")
- Color palette extraction
- Visual rules (what to enforce across all assets)
- Generation prompt template for this style

**UI Elements:**
- Image upload area
- Style reference display
- Editable style description field
- Generated prompt preview
- "Confirm Style" button

**Data Saved:**
- style-anchor.json with all style rules
- style-test.png (reference image)
- Update style-anchor.json locked_at timestamp

**Editing Style Later:**
- If user returns to style phase from generation
- Shows warning: "Changing style might require regenerating assets"
- Can edit style description
- Existing generated assets remain (for reference)

---

## Phase 3: Asset Generation

**Objectives:**
- Generate all assets in the plan
- Ensure consistency with style anchor
- Allow user to approve/regenerate individual assets

**Key Activities:**
1. System queues all assets from plan
2. For each asset:
   - Generate prompt based on:
     - Asset specification from plan
     - Style anchor image and rules
     - Project context (style, palette, etc.)
   - Call image generation API (Nano Banana Pro)
   - Display result
   - Allow user to:
     - Approve (move to next)
     - Regenerate (create new version)
     - Edit specification and regenerate
3. All assets complete
4. System shows summary: "45 assets generated"

**Batch Generation Options:**
- Generate all at once
- Generate by category (characters first, then environment, etc.)
- Generate individual assets on-demand
- Regenerate specific asset if unhappy

**UI Elements:**
- Generation progress bar
- Current asset being generated (with preview)
- Approve/Regenerate buttons
- Edit spec modal (for customizing before regenerate)
- Generate Categories panel (select which to generate)
- Generated assets gallery (scrollable preview)

**Live Preview Behavior:**
- As each asset completes, add to preview gallery
- Show in category organization
- Highlight new additions
- Allow selection to view full size

**Data Saved:**
- All generated images to IndexedDB
- generation-log.json with full history
- Asset metadata (dimensions, frame info, etc.)
- Regeneration attempts tracked

**Time Estimate:**
- Depends on asset count
- Typical: 30 seconds - 2 minutes per asset
- 50 assets = 25-100 minutes total

---

## Phase 4: Export

**Objectives:**
- Package all assets for use
- Provide manifest files for AI agent integration
- Allow download and deployment

**Key Activities:**
1. System organizes assets by category
2. Generates manifest.json with metadata
3. Packages everything into downloadable format
4. User downloads/saves assets
5. User integrates into game engine or AI workflow

**Export Package Contents:**
```
game-make-export-[project-id].zip
├── assets/
│   ├── characters/
│   │   ├── farmer-idle.png
│   │   ├── farmer-walk-1.png
│   │   └── ...
│   ├── environment/
│   │   ├── farm-tileset.png
│   │   └── ...
│   ├── props/
│   ├── ui/
│   └── icons/
├── manifest.json          # AI-readable asset metadata
├── README.md              # Asset guide
└── project.json           # Project settings reference
```

**Manifest.json Structure:**
```json
{
  "project": {
    "name": "Cozy Farm",
    "game_type": "farming_sim",
    "art_style": "pixel_art",
    "base_resolution": 32,
    "theme": "pastoral",
    "mood": "cheerful"
  },
  "assets": {
    "characters": [
      {
        "id": "char_1",
        "name": "Farmer Player",
        "file": "characters/farmer-idle.png",
        "dimensions": [32, 32],
        "animations": {
          "idle": { "frames": 1 },
          "walk": { "frames": 4, "directions": 4 },
          "work": { "frames": 8 }
        }
      }
    ],
    "environment": [...],
    "props": [...],
    "ui": [...],
    "icons": [...]
  },
  "style": {
    "description": "Pixel art inspired by Stardew Valley",
    "color_palette": ["#2d3436", "#d63031", "#fdcb6e"],
    "visual_rules": [...]
  }
}
```

**Export Options:**
- Download as ZIP
- Share as URL (if deployed)
- Copy individual asset
- Export as Godot resource (.tres)
- Export as Unity sprite atlas (future)

**UI Elements:**
- Export button
- Format selection (ZIP, etc.)
- Download progress
- Share link (if deployed)
- Copy asset paths
- View manifest preview

**Data Saved:**
- Export metadata
- When exported
- Export format used
- User feedback on export

---

## Complete User Journeys

### Journey 1: New Project from Scratch

```
1. USER CLICKS "New Project"
   ↓
2. PLANNING PHASE
   - Empty chat interface loads
   - User types game description
   - Agent asks clarifying questions (3-10 exchanges)
   - Agent builds asset list incrementally
   - User refines plan
   - User clicks "Approve Plan"
   ↓
3. STYLE PHASE
   - User uploads style reference image
   - System shows style analysis
   - User confirms style description
   - User clicks "Confirm Style"
   ↓
4. GENERATION PHASE
   - System queues all assets
   - Assets generate one by one (or in batches)
   - User sees progress
   - User approves/regenerates as desired
   - When all complete: "45 assets ready"
   ↓
5. EXPORT PHASE
   - User clicks "Export Project"
   - System packages assets + manifest
   - User downloads ZIP
   - User extracts and uses in game engine
   ↓
6. (Optional) BACK TO GENERATION
   - User wants to tweak an asset
   - Goes back to generation phase
   - Regenerates that specific asset
   - Returns to export
```

### Journey 2: Using a Template

```
1. USER CLICKS "Use Template"
   ↓
2. TEMPLATE SELECTION
   - User picks from: Platformer, RPG, Puzzle, Farming, etc.
   ↓
3. PLANNING PHASE (Accelerated)
   - Template description sent as initial message
   - Agent responds with template-specific questions
   - Pre-filled qualities and asset list appear
   - User confirms or customizes
   - Fewer exchanges than scratch project
   ↓
4-6. [Same as Journey 1: Style → Generation → Export]
```

### Journey 3: Returning to Existing Project

```
1. USER CLICKS "Open Project"
   ↓
2. PROJECT LOADED
   - Planning interface shows previous conversation
   - Asset plan visible
   - Chat history restored
   ↓
3. USER CAN:
   a) Resume planning (edit plan, ask more questions)
   b) Move to style (if planning approved)
   c) Go to generation (if style set)
   d) Go to export (if generation complete)
   ↓
4. [Continue based on choice]
```

### Journey 4: Editing Plan After Generation

```
1. USER IS IN GENERATION/EXPORT PHASE
   ↓
2. USER CLICKS "Back to Planning"
   ↓
3. WARNING MODAL
   "Editing your plan may require regenerating assets.
    Changes to settings or entities could affect consistency."
   [Cancel] [Continue to Edit]
   ↓
4. PLANNING INTERFACE
   - Chat history restored
   - Plan shown in edit mode
   - User makes changes
   ↓
5. SYSTEM DETECTS CHANGES
   - New entities? → Needs generation
   - Removed entities? → Assets marked for deletion
   - Settings changed? → May need style refresh
   ↓
6. USER CLICKS "Approve Plan"
   ↓
7. REGENERATE AFFECTED ASSETS
   - Only regenerate what changed
   - Keep unchanged assets
   - Merge back together
```

---

## UI Phase Indicators

Throughout the workflow, a phase indicator shows user progress:

```
Planning ───▶ Style ───▶ Generation ───▶ Export
   ✓ DONE        ✓ DONE        IN PROGRESS      PENDING
```

Or:

```
Planning ───▶ Style ───▶ Generation ───▶ Export
   ✓ DONE        IN PROGRESS        (not yet)     (not yet)
```

Clicking a completed phase returns user to that phase with warning if needed.

---

## Time Estimates

Typical project timelines:

| Phase | Duration | Notes |
|-------|----------|-------|
| Planning | 15-30 min | Varies by user familiarity and game complexity |
| Style | 5-10 min | Quick if using existing image |
| Generation | 30 min - 2 hours | Depends on asset count (50 assets = ~60 min) |
| Export | 1-2 min | Just packaging |
| **Total** | **1-3 hours** | Complete project from concept to export |

For simple projects (puzzle game, 20 assets): ~1 hour total
For complex projects (RPG, 80+ assets): ~2-3 hours total

---

## Error Handling & Recovery

### If Generation Fails
- Show error message
- Allow retry on individual asset
- Keep successful assets
- Provide API error details for debugging

### If User Loses Connection
- IndexedDB persists all progress
- Connection returns: right where they left off
- Generation can resume from last asset

### If Image Generation API Rate-Limited
- Queue remaining assets
- Show message: "Generating... 5 remaining (1 min wait)"
- Resume when rate limit resets

### If User Leaves Mid-Generation
- Assets generated so far are saved
- Can return and continue
- Can finish generation at any time

---

## Accessibility & Mobility

### For AI Agents Using Asset Hatch
Potential future MCP/API interface:

```javascript
// Agent creates project
const project = await gameMake.createProject({
  name: "Adventure Game",
  game_type: "platformer",
  description: "A side-scrolling platformer with pixel art"
})

// Agent gets plan suggestions
const suggestions = await gameMake.getPlanSuggestions(project.id)

// Agent approves plan
await gameMake.approvePlan(project.id, customizedPlan)

// Agent sets style
await gameMake.setStyle(project.id, styleDescription)

// Agent generates assets
const assets = await gameMake.generateAssets(project.id)

// Agent gets manifest for integration
const manifest = await gameMake.exportManifest(project.id)

// Agent uses manifest to build game
// "Here are the assets. I see farmer-walk.png is 32x32 with 4 frames..."
```

**Current v1:** UI-first, humans can hand assets to agents manually
**Future:** API layer for direct agent integration
