# Mock vs Real Implementation Audit

**Last Updated:** 2025-12-27
**Status:** Style Anchor Image Generation - ✅ 100% COMPLETE
**Branch:** feat/generation-queue-ui

---

## 🟢 Fully Implemented (Real)

### Core Infrastructure
- ✅ **Next.js 16.1.1 (Turbopack)** - Production app router
- ✅ **Hybrid Persistence Layer** - Prisma/SQLite (Server) + Dexie (Client)
- ✅ **Tailwind CSS + shadcn/ui** - Component library with glassmorphism theme
- ✅ **Bun** - Package manager and runtime (Windows + WSL environment)

- ✅ **Hybrid Persistence** - Prisma/SQLite as server source of truth; Dexie as client cache
- ✅ **Projects table** - Schema migrated to Prisma with relational integrity
- ✅ **Memory files table** - Support for storing plans and conversation history (Prisma-backed)
- ✅ **Style anchors table** - Images stored as Bytes in Prisma; dual-write from UI
- ✅ **Character registry table** - Server-side storage for animation consistency
- ✅ **Generated assets table** - Stored in Prisma for generation pipeline access
- ✅ **Database utilities** - Refactored to use Prisma for server operations and `client-db.ts` for UI state.

### UI Components
- ✅ **ChatInterface** - Aurora styling, streaming responses, reasoning display, tool execution
- ✅ **QualitiesBar** - 7 quality dropdowns with game designer terminology
- ✅ **PlanPreview** - Markdown rendering with empty state
- ✅ **StylePreview** - Collapsible details, generated image display, proceed button
- ✅ **Select component** - Radix UI with glassmorphism styling
- ✅ **Two-column planning layout** - 50/50 split with sticky qualities bar

### AI Integration - Vercel AI SDK v6 ✅ COMPLETE
- ✅ **OpenRouter Provider** - Official @openrouter/ai-sdk-provider@1.5.4
- ✅ **Chat API Route** - /app/api/chat/route.ts with streamText + 7 Zod tools
- ✅ **ChatInterface Hook** - useChat from @ai-sdk/react@3.0.3
- ✅ **Message Conversion** - convertToModelMessages for UIMessage → ModelMessage
- ✅ **Streaming Responses** - toUIMessageStreamResponse() with SSE
- ✅ **Tool Calling** - All 7 tools working (3 planning + 4 style)
- ✅ **Context Passing** - Via request body (qualities, projectId)
- ✅ **Reasoning Display** - AI thinking process visible in chat
- ✅ **Part-based Rendering** - Extracts text from message.parts array
- ✅ **Tool Part Detection** - AI SDK v6 `tool-{toolName}` format handled

### Style Anchor Image Generation ✅ COMPLETE (NEW)
- ✅ **OpenRouter Flux.2 Integration** - Correct model IDs (flux-dev, flux.2-pro)
- ✅ **Image Response Parsing** - Extracts from `message.images[].image_url.url`
- ✅ **Token Limit Avoidance** - Returns styleAnchorId, client fetches image separately
- ✅ **/api/generate-style** - Builds optimized Flux prompt, calls OpenRouter
- ✅ **/api/style-anchor** - GET endpoint for client to fetch image by ID
- ✅ **ChatInterface Tool Detection** - Detects `tool-generateStyleAnchor` parts
- ✅ **useRef for Deduplication** - Prevents infinite fetch loops

### Planning Phase Code
- ✅ **Tool Definitions** - 3 planning tools + 4 style tools with Zod schemas
- ✅ **Context Sharing** - Via body params instead of useCopilotReadable
- ✅ **Plan Approval Workflow** - Saves to DB, switches to style mode (stays on same page)
- ✅ **Enhanced System Prompt** - Structured instructions for AI with plan format
- ✅ **Plan Parser** - Parse markdown → ParsedAsset[] with composite/granular modes
- ✅ **Multi-Mode UI** - Tab navigation [Plan] [Style] [Generation] with file viewer
- ✅ **Style Phase Tools** - updateStyleDraft, generateStyleAnchor, finalizeStyle
- ✅ **AI-to-UI Data Flow** - Complete integration ChatInterface → Planning page → StylePreview

---

## ✅ AI Integration - 100% COMPLETE & VERIFIED

### What Works (Tested & Confirmed) ✅
- ✅ Chat sends messages successfully
- ✅ AI responds with streaming text
- ✅ Reasoning parts display (AI thought process visible)
- ✅ **Tool execution WORKS** (7 tools total)
- ✅ **Quality dropdowns update automatically** when AI suggests values
- ✅ **Plan preview pane updates** with generated markdown
- ✅ **Style draft updates from AI** (styleKeywords, lightingKeywords, colorPalette)
- ✅ **Style anchor image generation** via Flux.2
- ✅ **Image displays in StylePreview** after generation
- ✅ **Tab navigation working** - Switch between Plan/Style/Generation modes
- ✅ **File viewer menu** - Shows saved entities.json and other memory files
- ✅ Context passed correctly (qualities, projectId)
- ✅ Loading states functional
- ✅ No critical console errors
- ✅ **Multi-step tool calling** with stepCountIs(10)
- ✅ **Flexible parameter handling** for Gemini's format

### Model Configuration
- **Chat/Tools:** `google/gemini-3-pro-preview` via OpenRouter
- **Image Gen:** `black-forest-labs/flux-dev` or `flux.2-pro` via OpenRouter

---

## 🔴 Deprecated - CopilotKit Integration (ABANDONED)

### Reason for Abandonment
After 8 debugging attempts and 4+ hours:
1. `message.isResultMessage is not a function` error persists
2. Known bugs in CopilotKit v1.50.1 `appendMessage` function
3. Limited OpenRouter compatibility
4. Smaller community and slower bug fixes

**Decision:** Successfully replaced with Vercel AI SDK v6 (see ADR-005)

---

## 🟢 Style Anchor Image Generation - 100% COMPLETE ✅ (NEW SECTION)

### What Worked
- ✅ **OpenRouter chat/completions endpoint** with `modalities: ['image', 'text']`
- ✅ **Correct model IDs:** `black-forest-labs/flux-dev`, `black-forest-labs/flux.2-pro`
- ✅ **Image extraction from `message.images`** array
- ✅ **Separate fetch pattern** - Return ID to LLM, client fetches image via API
- ✅ **AI SDK v6 part detection** - `tool-generateStyleAnchor` type
- ✅ **useRef for processed IDs** - Prevents infinite loops

### What Didn't Work (Debugging History)

| Attempt | What Was Tried | Outcome | Root Cause |
|---------|----------------|---------|------------|
| 1 | `/api/v1/images/generations` | 405 error | Endpoint deprecated in OpenRouter |
| 2 | Model ID `flux.2-dev` | 400 error | Correct ID is `flux-dev` (no `.2`) |
| 3 | Parse image from `message.content` | Empty string | Image is in `message.images` array |
| 4 | Return imageUrl in tool result | Token limit exceeded | 2MB base64 = 1M+ tokens |
| 5 | Detect `part.type === 'tool-result'` | Never matched | AI SDK v6 uses `tool-{name}` format |
| 6 | Access `part.output` | Always undefined | Property is named `result` |
| 7 | `processedIds` Set inside useEffect | Infinite loop | Set resets on every render |

### Key Implementation Details

```typescript
// OpenRouter Flux.2 response structure:
message.images[0].image_url.url  // Where the base64 image lives

// AI SDK v6 tool part detection:
if (part.type === 'tool-generateStyleAnchor') {
  const result = part.result;  // NOT part.output
}

// Preventing infinite loops:
const processedIds = useRef(new Set<string>());  // Persists across renders
```

---

## 🟢 P0 Generation Infrastructure - COMPLETE ✅

### Image Utilities (lib/image-utils.ts)
- ✅ **blobToBase64()** - Convert Blob → base64 data URL for API calls
- ✅ **base64ToBlob()** - Convert base64 → Blob for IndexedDB storage
- ✅ **prepareStyleAnchorForAPI()** - Cache base64 encoding, avoid repeated conversion
- ✅ **extractColorPalette()** - Canvas-based color extraction (8 colors from image)
- ✅ **resizeImage()** - Pixel-perfect resizing with sharp edges
- ✅ **rgbToHex()** - Color conversion utilities

### Prompt Templates (lib/prompt-templates.ts)
- ✅ **buildCharacterSpritePrompt()** - Single pose sprite template
- ✅ **buildSpriteSheetPrompt()** - Animation frames with grid specification
- ✅ **buildTilesetPrompt()** - Seamless terrain with edge variations
- ✅ **buildUIElementPrompt()** - Buttons, bars, panels
- ✅ **buildIconPrompt()** - Inventory/skill icons
- ✅ **buildBackgroundPrompt()** - Environment scenes
- ✅ **Lighting keywords mapping** - By asset type (flat, soft, atmospheric)
- ✅ **Perspective keywords mapping** - By game type (top-down, side-view, isometric)
- ✅ **Consistency marker generation** - Auto-add based on context

### Prompt Builder (lib/prompt-builder.ts)
- ✅ **buildAssetPrompt()** - Main generation entry point
- ✅ **Priority-ordered construction** - First 5 words carry highest weight
- ✅ **Quality integration** - Combines project qualities + style anchor + character registry
- ✅ **calculateGenerationSize()** - 2x resolution strategy for pixel-perfect results
- ✅ **estimateBatchCost()** - Cost estimation per model
- ✅ **FLUX_MODELS config** - Correct OpenRouter model IDs

### Generation APIs
- ✅ **/api/generate** - Asset generation with Flux.2
- ✅ **/api/generate-style** - Style anchor reference image generation
- ✅ **/api/style-anchor** - Fetch style anchor by ID for client display
- ✅ **/api/analyze-style** - Vision model for style extraction

---

## 🔴 Not Implemented (Future Phases)

### Generation Phase (UI Needed)
- ✅ Generation API complete (/api/generate with Flux.2)
- ✅ Prompt builder complete (6 templates, priority ordering)
- ✅ Plan parser complete (markdown → ParsedAsset[])
- ❌ Asset generation queue UI integration
- ❌ Batch generation with progress tracking
- ❌ Preview gallery with approval workflow

### Export Phase (Slice 13-15)
- ❌ Asset organization
- ❌ Sprite sheet generation
- ❌ Zip download
- ❌ Export formats

### Advanced Features
- ❌ Style anchor regenerate button
- ❌ Plan templates library
- ❌ Multi-project management (beyond basic list)
- ❌ Cost estimation display

---

## 📊 Completeness Metrics

| Category | Implemented | Blocked/Partial | Not Started | Total | % Complete |
|----------|-------------|-----------------|-------------|-------|------------|
| Planning Phase | 12 | 0 | 0 | 12 | **100%** ✅ |
| AI Integration (Vercel SDK) | 11 | 0 | 0 | 11 | **100%** ✅ |
| Database | 8 | 0 | 2 | 10 | **80%** |
| Style Anchor Phase | 6 | 0 | 0 | 6 | **100%** ✅ |
| Generation Phase | 4 | 0 | 2 | 6 | **67%** ⬆️ |
| Export Phase | 0 | 0 | 3 | 3 | **0%** |

**Overall Project Completion: ~85%** ⬆️ (up from 75%!)

**New This Session:**
- Style anchor image generation via Flux.2
- /api/style-anchor fetch endpoint
- ChatInterface tool part detection fix
- StylePreview collapsible details + image display
- Infinite loop prevention with useRef

---

## ✅ All Blockers Resolved

### ~~Token Limit Error on Style Anchor~~ (RESOLVED)
   - **Impact:** Generation failed with 1M+ tokens
   - **Root Cause:** Returning 2MB base64 image in tool result
   - **Resolution:** Return only styleAnchorId, client fetches via separate API
   - **Outcome:** Generation works, images display correctly

### ~~AI SDK v6 Tool Detection Failed~~ (RESOLVED)
   - **Impact:** Tool results not detected, image not displayed
   - **Root Cause:** Looking for `tool-result` type, actual is `tool-{name}`
   - **Resolution:** Changed to check `part.type === 'tool-generateStyleAnchor'`
   - **Outcome:** Tool detection works correctly

### ~~Infinite Fetch Loop~~ (RESOLVED)
   - **Impact:** Hundreds of API requests, browser slowdown
   - **Root Cause:** processedIds Set created inside useEffect, reset each render
   - **Resolution:** Changed to useRef to persist across renders
   - **Outcome:** Single fetch per style anchor, no loops

---

## 🎉 Success Summary

**Style Anchor Phase:** ✅ **100% COMPLETE**
- Style keywords/lighting collected from chat
- AI generates reference image via Flux.2
- Image stored in Prisma, displayed in StylePreview
- No blockers remaining

**Critical Learnings Documented:**
- OpenRouter uses `message.images` for image data, not `content`
- AI SDK v6 uses `tool-{name}` format, not `tool-result`
- Use `part.result`, not `part.output`
- Use `useRef` for state that should persist across renders in effects

**See ADR-008 for complete technical documentation.**

---

**Status:** Style Anchor Phase is **100% complete and working**. Ready for Generation Queue integration.
