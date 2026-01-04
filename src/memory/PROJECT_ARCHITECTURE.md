# Asset Hatch - Complete Project Architecture

**Created:** 2025-12-26
**Purpose:** Comprehensive understanding of the entire system
**Status:** Planning Phase P1 (80% complete)

---

## Project Vision

**Asset Hatch** is an AI-powered game asset generation tool that transforms natural conversation into complete game asset packs.

### The Core Innovation
Instead of:
- ❌ Manual specification documents
- ❌ Complex forms and dropdowns
- ❌ Trial-and-error generation

Users get:
- ✅ Natural conversation with AI
- ✅ AI actively builds specifications
- ✅ Guided workflow through phases
- ✅ Complete asset pack as output

---

## Four-Phase Workflow

```
┌─────────────────┐
│  1. PLANNING    │ ← Current Focus (P1)
│  (Chat-driven)  │   User describes game → AI builds asset plan
└─────────────────┘
         ↓
┌─────────────────┐
│  2. STYLE       │   Upload references → AI extracts style
│  (Visual)       │   Generate style anchor image
└─────────────────┘
         ↓
┌─────────────────┐
│  3. GENERATION  │   AI generates each asset
│  (Automated)    │   Using style anchor + specifications
└─────────────────┘
         ↓
┌─────────────────┐
│  4. EXPORT      │   Organize assets → Generate sprite sheets
│  (Packaging)    │   Download as ZIP
└─────────────────┘
```

---

## Phase 1: Planning (Current State)

### The Goal
Transform vague game ideas into actionable asset specifications through AI conversation.

### What Should Happen

**User Interaction:**
```
User: "I'm making a cozy farming game"
  ↓
AI thinks: "farming game → likely needs..."
  ↓
AI calls: updateQuality(game_genre="Farming Simulator")
AI calls: updateQuality(mood="Cozy")
AI calls: updateQuality(theme="Rural")
  ↓
AI responds: "I've set your genre to Farming Simulator with a cozy mood.
              What art style are you thinking?"
  ↓
UI updates: Dropdowns show selected values
```

**Continuous Iteration:**
```
User: "Maybe pixel art with a top-down view"
  ↓
AI calls: updateQuality(art_style="Pixel Art")
AI calls: updateQuality(perspective="Top-down")
  ↓
User: "Show me what assets I'll need"
  ↓
AI calls: updatePlan(markdown with full asset list)
  ↓
Right panel shows formatted plan
```

**Finalization:**
```
User: "Perfect, let's use this plan"
  ↓
AI calls: finalizePlan()
  ↓
System saves to DB → Navigates to Style Anchor phase
```

### The Seven Quality Parameters

These guide ALL future generation:

| Parameter | Purpose | Examples |
|-----------|---------|----------|
| **art_style** | Visual style | Pixel Art (8-bit), Pixel Art (16-bit), Hand-painted 2D, Vector/Flat, Voxel |
| **base_resolution** | Asset size | 32x32, 64x64, 128x128 |
| **perspective** | Camera angle | Top-down, Side-view, Isometric, First-person |
| **game_genre** | Game type | Platformer, RPG, Strategy, Farming Sim |
| **theme** | Setting/world | Sci-Fi, Fantasy, Modern, Post-apocalyptic |
| **mood** | Emotional tone | Dark, Cozy, Intense, Whimsical |
| **color_palette** | Color scheme | Vibrant, Muted, Monochrome, Pastel |

### The Asset Plan Structure

Saved as `entities.json` in IndexedDB:

```markdown
# Asset Plan for [Game Name]

## Characters
- **Farmer** (Player character)
  - Animations: idle, walk (4 directions), use_tool
  - Views: north, south, east, west
  - Special: Tool-holding variants

- **Chicken** (Livestock)
  - Animations: idle, walk, peck
  - States: normal, sleeping
  
## Environments
- **Farm Tileset** (16x16 tiles)
  - Ground: dirt, grass, plowed_soil
  - Water: pond tiles (9-slice)
  - Fences: horizontal, vertical, corners
  
## Items & Props
- **Tools**
  - Hoe, Watering Can, Axe (16x16 each)
  
- **Crops**
  - Carrot (growth stages: seed, sprout, growing, ready)
  
## UI Elements
- **Inventory Grid** (32x32 slots)
- **Health/Energy Bars**
- **Day/Night Indicator**
```

This becomes the blueprint for Phase 3 (Generation). Source of truth for API generation is stored in Prisma/SQLite under the `MemoryFile` model.

---

## Technology Stack

### Frontend
- **Next.js 16.1.1** (App Router, Turbopack)
- **React 19.2.3** (Client components for interactivity)
- **TypeScript** (Type safety)
- **Tailwind CSS + shadcn/ui** (Styling with glassmorphism theme)

### AI Integration
- **Vercel AI SDK v6** (streamText, tool execution)
- **@ai-sdk/react** (useChat hook)
- **OpenRouter** (Model provider gateway)
- **Gemini 3 Pro Preview** (Current model for chat/tools)
- **Flux.2 Pro** (Future model for image generation)

### Data Layer (Hybrid Persistence)
- **IndexedDB (Dexie v4.2.1)**: Client-side database for UI state and local caching.
- **SQLite (Prisma v7.2.0)**: Server-side database for authoritative data required by API routes.

### Development Environment
- **Bun** (Package manager, runtime, dev server)
- **WSL2** (Linux environment for Claude Code)
- **Windows 11** (User's dev machine running bun dev)

---

## Data Architecture

### Database Schema (v2)

#### Projects Table
```typescript
{
  id: string;              // UUID
  name: string;            // "My Farming Game"
  description?: string;    // Optional user notes
  phase: 'planning' | 'style' | 'generation' | 'export';
  
  // Quality parameters (set in Planning phase)
  art_style?: string;
  base_resolution?: string;
  perspective?: string;
  game_genre?: string;
  theme?: string;
  mood?: string;
  color_palette?: string;
  
  created_at: string;      // ISO timestamp
  updated_at: string;
}
```

#### Memory Files Table
```typescript
{
  id: string;              // Auto-increment
  project_id: string;      // Foreign key to projects
  file_name: string;       // e.g., "entities.json", "conversation_history.json"
  content: string;         // JSON or text content
  created_at: string;
}
```

### File Organization

```
asset-hatch/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts           # AI chat endpoint with tools
│   ├── project/
│   │   └── [id]/
│   │       ├── planning/
│   │       │   └── page.tsx       # Planning Phase UI
│   │       ├── style/
│   │       │   └── page.tsx       # Style Anchor Phase (future)
│   │       ├── generate/
│   │       │   └── page.tsx       # Generation Phase (future)
│   │       └── export/
│   │           └── page.tsx       # Export Phase (future)
│   ├── layout.tsx                 # Root layout (no providers now)
│   └── page.tsx                   # Home page / project list
├── components/
│   ├── planning/
│   │   ├── ChatInterface.tsx      # AI chat UI
│   │   ├── QualitiesBar.tsx       # Quality parameter dropdowns
│   │   └── PlanPreview.tsx        # Markdown plan display
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── db.ts                      # Dexie database instance
│   └── db-utils.ts                # Helper functions (saveMemoryFile, etc.)
└── memory/                        # Project documentation (for AI context)
    ├── active_state.md
    ├── MOCK_VS_REAL_AUDIT.md
    ├── AI_SDK_V6_GUIDE.md
    ├── TOOL_EXECUTION_TEST_PLAN.md
    ├── PROJECT_ARCHITECTURE.md    # This file
    └── adr/
        ├── 001-use-copilotkit.md  # (superseded)
        ├── 005-replace-copilotkit-with-vercel-ai-sdk.md
        ├── 006-generation-architecture.md
        ├── 007-hybrid-persistence-model.md
        ├── 008-style-anchor-image-generation.md
        ├── 009-individual-asset-generation-workflow.md
        ├── 010-api-route-consolidation.md
        ├── 011-ui-refinements-and-data-sync.md
        ├── 012-hybrid-session-persistence.md
        └── 013-security-hardening-oauth-and-consistency.md
```

---

## AI Integration Deep Dive

### The Chat Flow

```
┌─────────────────────────────────────────────────────┐
│ User types message in ChatInterface                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ useChat hook (from @ai-sdk/react)                   │
│ - Manages messages state                            │
│ - Handles streaming responses                       │
│ - Triggers onToolCall callback                      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ POST /api/chat with body:                           │
│ {                                                    │
│   messages: [...],  // Full conversation history    │
│   qualities: {...}, // Current quality parameters   │
│   projectId: "..."  // Current project UUID         │
│ }                                                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ API Route Processing:                               │
│ 1. Extract messages, qualities, projectId           │
│ 2. convertToModelMessages(messages) [ASYNC!]        │
│ 3. Build system prompt with current context         │
│ 4. Call streamText() with OpenRouter                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ OpenRouter → Gemini 3 Pro Preview                   │
│ - Receives system prompt + conversation             │
│ - Has access to 3 tools (updateQuality, etc.)       │
│ - Decides whether to call tools or respond with text│
└─────────────────────────────────────────────────────┘
                      ↓
         ┌───────────┴───────────┐
         ↓                       ↓
┌─────────────────┐    ┌─────────────────────┐
│ AI calls tool   │    │ AI responds w/ text │
└─────────────────┘    └─────────────────────┘
         ↓                       ↓
┌─────────────────┐    ┌─────────────────────┐
│ Tool executes   │    │ Text streams to UI  │
│ on server       │    │ via SSE             │
└─────────────────┘    └─────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Tool result sent back to AI                         │
│ AI may call more tools or generate text response    │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ toUIMessageStreamResponse() streams back to client  │
│ - Text parts                                        │
│ - Reasoning parts (AI thinking)                     │
│ - Tool call parts                                   │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ Frontend receives stream:                           │
│ - Updates messages array in real-time               │
│ - Triggers onToolCall for each tool execution       │
│ - Extracts text/reasoning for display               │
└─────────────────────────────────────────────────────┘
```

### The Three Tools

#### Tool 1: updateQuality
**Purpose:** Set individual quality parameters
**When AI should call:** User mentions any preference about art style, genre, mood, etc.
**Effect:** Updates qualities state → QualitiesBar dropdowns update

```typescript
updateQuality: tool({
  description: 'Update a specific quality parameter...',
  inputSchema: z.object({
    qualityKey: z.enum(['art_style', 'base_resolution', ...]),
    value: z.string().min(1),
  }),
  execute: async ({ qualityKey, value }) => ({
    success: true,
    message: `Updated ${qualityKey} to "${value}"`,
    qualityKey,
    value,
  }),
})
```

#### Tool 2: updatePlan
**Purpose:** Create/update the complete asset plan
**When AI should call:** User asks for asset list, or AI has enough info to draft one
**Effect:** Updates planMarkdown state → PlanPreview pane shows markdown

```typescript
updatePlan: tool({
  description: 'Update the asset plan markdown...',
  parameters: z.object({
    planMarkdown: z.string().min(10),
  }),
  execute: async ({ planMarkdown }) => ({
    success: true,
    message: 'Plan updated successfully',
    planMarkdown,
  }),
})
```

#### Tool 3: finalizePlan
**Purpose:** Mark planning complete, save to DB, transition to next phase
**When AI should call:** User explicitly approves the plan
**Effect:** Saves entities.json + qualities to DB, navigates to /style

```typescript
finalizePlan: tool({
  description: 'Mark planning phase as complete...',
  parameters: z.object({}),
  execute: async () => ({
    success: true,
    message: 'Phase finalized',
  }),
})
```

---

## The Critical Question: Are Tools Working?

### What We Know ✅
- Chat sends messages successfully
- AI responds with streaming text
- Reasoning parts display (AI thinking process visible)
- Tool definitions are correct (Zod schemas, execute functions)
- Callbacks are wired up (onToolCall → onQualityUpdate → setQualities)

### What We DON'T Know ❓
- **Is the AI actually CALLING the tools?**
  - Or is it just responding with text like "I recommend pixel art"?
  
- **If tools ARE called, do they update the UI?**
  - Do the quality dropdowns actually change?
  - Does the plan preview pane actually populate?

### How to Find Out
Run the tests in `TOOL_EXECUTION_TEST_PLAN.md`:
1. Check browser console for 🔧 logs
2. Type "I want a pixel art platformer"
3. See if dropdowns update

---

## System Prompt Strategy

### Current Approach: "Agentic AI"

```typescript
system: `You are a proactive Game Design Agent.

YOUR BEHAVIORAL PROTOCOLS:
1. BE AGENTIC: Do not wait for permission.
   - User: "I want pixel art"
   - You: [Call updateQuality] immediately

2. BE ITERATIVE: Update plan continuously.
   - Use updatePlan early and often

3. BE TRANSPARENT: Mention when you perform actions.
   - "I've set the art style to Pixel Art. Let's list characters next."
`
```

### Why This Matters
Without "agentic" prompting, AI might:
- ❌ "I recommend setting the art style to Pixel Art" (just talking)
- ❌ Wait for user to explicitly say "set it to pixel art"
- ❌ Generate asset lists as text instead of using updatePlan tool

With "agentic" prompting, AI should:
- ✅ Immediately call updateQuality when preference mentioned
- ✅ Proactively draft plans with updatePlan
- ✅ Take action without asking permission first

---

## Success Metrics

### Planning Phase P1 Complete When:
- [ ] User describes game → AI sets quality parameters automatically
- [ ] Dropdowns update in real-time as AI makes suggestions
- [ ] User asks for asset list → AI generates plan with updatePlan
- [ ] Plan appears in preview pane with proper markdown formatting
- [ ] User approves → Plan saves to DB, navigation to /style works
- [ ] Process feels conversational, not like filling a form

### Overall Project Complete When:
- [ ] Planning Phase P1 (current) - 80% done
- [ ] Style Anchor Phase P2 - 0% done
- [ ] Generation Phase P3 - 0% done
- [ ] Export Phase P4 - 0% done

**Current Overall Completion: ~45%**

---

## Known Limitations & Future Work

### Current Limitations
1. **No visual feedback when tools execute** - User can't see tools being called
2. **No conversation persistence** - Conversations don't save to DB yet
3. **No error retry logic** - If API fails, no automatic retry
4. **No plan editing** - Can't manually edit generated plan (future slice)
5. **No multi-project management** - Basic list exists but limited features

### Phase 2 (Style Anchor) Requirements
- Reference image upload
- Image analysis / style extraction
- Style anchor image generation (Flux.2 Pro)
- Style approval workflow
- Style guide document generation

### Phase 3 (Generation) Requirements
- Asset generation queue system
- Replicate API integration
- Generation status tracking
- Preview gallery with thumbnails
- Regeneration for individual assets

### Phase 4 (Export) Requirements
- Asset organization by category
- Sprite sheet generation
- Multiple export formats (PNG, spritesheet, JSON metadata)
- ZIP download functionality

---

## Development Workflow

### Current Branch Strategy
- **main**: Stable, deployed code
- **feat/migrate-to-vercel-ai-sdk**: Recent migration work (ready to merge)
- Future feature branches: `feat/style-anchor`, `feat/generation`, etc.

### Testing Locally
```bash
# User runs (Windows PowerShell):
cd asset-hatch
bun dev

# Opens localhost:3000
# Creates test project
# Tests planning phase
```

### AI Development (WSL2)
```bash
# Claude Code can run:
cd /mnt/c/Users/Zenchant/asset-hatch/asset-hatch-spec/asset-hatch
bun dev        # Start dev server
bun build      # Build for production
# Git operations, file edits, etc.
```

---

## Key Takeaways

1. **The Goal:** Transform natural conversation into complete game asset specifications
2. **The Challenge:** Make AI ACTIVELY use tools, not just talk about using them
3. **Current Status:** Chat works, but tool execution needs verification
4. **Next Step:** Run Test 1 from TOOL_EXECUTION_TEST_PLAN.md
5. **Success Looks Like:** User says "pixel art platformer" → Dropdowns auto-fill → Plan generates → Everything saved

---

**This document provides complete context for understanding Asset Hatch's architecture, current state, and path forward.**

**For testing tool execution:** See `TOOL_EXECUTION_TEST_PLAN.md`
**For AI SDK v6 reference:** See `AI_SDK_V6_GUIDE.md`
**For migration details:** See `adr/005-replace-copilotkit-with-vercel-ai-sdk.md`
