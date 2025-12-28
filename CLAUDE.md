# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asset Hatch** is an AI-powered game asset planning and generation tool that transforms natural conversation into complete, production-ready game asset packs. The application guides users through a four-phase workflow: Planning → Style Anchor → Generation → Export.

### Core Innovation
- Natural AI conversation replaces manual specification documents
- AI actively builds asset specifications using tool calling
- Style anchor ensures visual consistency across all generated assets
- Complete sprite sheets with metadata export

## Common Development Commands

### Development
```bash
bun dev              # Start Next.js dev server (localhost:3000)
bun build            # Build for production
bun start            # Start production server
```

### Code Quality
```bash
bun run lint         # Run ESLint
bun run typecheck    # TypeScript type checking (no emit)
```

### Testing
```bash
bun run test         # Run Jest in watch mode
bun run test:ci      # Run tests in CI mode with coverage
bun run test:coverage # Generate coverage report
```

### Database
```bash
bunx prisma generate     # Generate Prisma client
bunx prisma migrate dev  # Run migrations (development)
bunx prisma studio       # Open Prisma Studio GUI
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 with App Router
- **React**: 19.2.3 (functional components only)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4 with oklch colors, glassmorphism + aurora gradients
- **UI Components**: shadcn/ui + Radix UI primitives
- **Typography**: Outfit font (geometric, modern aesthetic)

### AI Integration
- **Framework**: Vercel AI SDK v6 (`ai`, `@ai-sdk/react`)
- **Provider**: OpenRouter (`@openrouter/ai-sdk-provider`)
- **Chat Model**: `google/gemini-3-pro-preview` (via OpenRouter)
- **Image Generation**: `black-forest-labs/flux.2-pro`, `black-forest-labs/flux.2-pro`
- **Vision**: GPT-4o for style extraction

### Data Layer
- **Server Database**: Prisma 7.2.0 with SQLite (via libsql adapter)
- **Client Cache**: Dexie.js 4.2.1 (IndexedDB wrapper)
- **Persistence Model**: Hybrid dual-write pattern (Prisma = source of truth, Dexie = cache)
- **Schemas**: Zod v4 for runtime validation

### Package Manager
- **Primary**: Bun (user preference, `bun.lock` present)
- **Note**: User runs Bun in Windows PowerShell, Claude Code operates in WSL2

## Project Architecture

### Four-Phase Workflow

```
┌─────────────────┐
│  1. PLANNING    │  User describes game → AI builds asset plan
│  (Chat-driven)  │  Tools: updateQuality, updatePlan, finalizePlan
└─────────────────┘
         ↓
┌─────────────────┐
│  2. STYLE       │  Upload references → AI extracts style → Generate anchor image
│  (Visual)       │  Tools: updateStyleDraft, generateStyleAnchor, finalizeStyle
└─────────────────┘
         ↓
┌─────────────────┐
│  3. GENERATION  │  AI generates each asset using style anchor + specifications
│  (Automated)    │  Queue system with batch generation via Flux.2
└─────────────────┘
         ↓
┌─────────────────┐
│  4. EXPORT      │  Organize → Generate sprite sheets → Download ZIP
│  (Packaging)    │  Multiple formats supported
└─────────────────┘
```

### Hybrid Persistence Model

**Critical Understanding**: This project uses TWO databases simultaneously:

1. **Prisma (SQLite)** - Server-side source of truth
   - Used by API routes (`/app/api/*`)
   - Authoritative for all data
   - Location: `dev.db` in root directory
   - Schema: `prisma/schema.prisma`

2. **Dexie (IndexedDB)** - Client-side cache
   - Used by React components
   - Enables offline support and fast UI updates
   - Schema: `lib/client-db.ts`
   - Auto-syncs with Prisma via API calls

**When to use which**:
- API routes: Always use Prisma (`import { prisma } from '@/lib/prisma'`)
- Client components: Use Dexie (`import { db } from '@/lib/client-db'`)
- Data flow: Client writes to Dexie → API writes to Prisma → Subsequent reads from Dexie

### Database Schema

**Core Models** (Prisma):
- `Project`: Main entity with quality parameters (artStyle, perspective, gameGenre, etc.)
- `MemoryFile`: Stores JSON content (entities.json, conversation history, etc.)
- `StyleAnchor`: Reference image + style keywords for consistent generation
- `CharacterRegistry`: Tracks character descriptions, colors, successful seeds
- `GeneratedAsset`: Stores generated images as Blobs with metadata

**Quality Parameters** (7 parameters guide all generation):
- `art_style`: "Pixel Art", "Low Poly 3D", "Vector", "Hand-drawn"
- `base_resolution`: "32x32", "64x64", "128x128"
- `perspective`: "Top-down", "Side-view", "Isometric", "First-person"
- `game_genre`: "Platformer", "RPG", "Strategy", "Farming Sim"
- `theme`: "Sci-Fi", "Fantasy", "Modern", "Post-apocalyptic"
- `mood`: "Dark", "Cozy", "Intense", "Whimsical"
- `color_palette`: "Vibrant", "Muted", "Monochrome", "Pastel"

### AI SDK v6 Integration

**Key Concept**: Vercel AI SDK v6 uses tool calling for structured agent behavior.

**Chat Flow**:
```
User types message → useChat hook (client)
                  → POST /api/chat (server)
                  → streamText() with tools
                  → OpenRouter Gemini
                  → Tool execution or text response
                  → Stream back to client (SSE)
                  → UI updates in real-time
```

**Tool Pattern**:
```typescript
// In /app/api/chat/route.ts
tools: {
  updateQuality: tool({
    description: 'Update a specific quality parameter',
    inputSchema: updateQualitySchema,  // Zod schema
    execute: async ({ qualityKey, value }) => {
      // 1. Update Prisma (source of truth)
      await prisma.project.update({ ... });
      // 2. Return result (client updates Dexie via callback)
      return { success: true, qualityKey, value };
    }
  })
}
```

**Critical AI SDK v6 Patterns**:
- Tool part type format: `part.type === 'tool-{toolName}'` (NOT `'tool-result'`)
- Tool result property: `part.result` (NOT `part.output`)
- Use `useRef` to persist state across renders (prevents infinite loops)
- Never return large data (like base64 images) in tool results (token limit issue)

### File Organization

```
asset-hatch/
├── app/
│   ├── api/                        # API routes (use Prisma)
│   │   ├── chat/route.ts          # AI chat with tools (Planning + Style phases)
│   │   ├── generate/route.ts      # Asset generation endpoint
│   │   ├── generate-style/route.ts # Style anchor image generation
│   │   ├── style-anchor/route.ts  # Fetch style anchor by ID
│   │   └── analyze-style/route.ts # Vision API for style extraction
│   ├── project/[id]/
│   │   └── planning/page.tsx      # Planning phase UI (multi-mode)
│   ├── layout.tsx                 # Root layout (Outfit font, theme provider)
│   ├── page.tsx                   # Home page / project list
│   └── globals.css                # Tailwind base + custom theme
├── components/
│   ├── planning/
│   │   ├── ChatInterface.tsx      # AI chat UI with useChat hook
│   │   ├── QualitiesBar.tsx       # Quality parameter dropdowns
│   │   ├── PlanPreview.tsx        # Markdown plan display
│   │   └── PromptPreview.tsx      # Asset prompt editor
│   ├── generation/
│   │   ├── GenerationQueue.tsx    # Queue UI with batch controls
│   │   └── AssetCard.tsx          # Individual asset status card
│   ├── style/
│   │   └── StylePreview.tsx       # Style anchor image display
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── client-db.ts               # Dexie database (IndexedDB)
│   ├── prisma.ts                  # Prisma client with libsql adapter
│   ├── schemas.ts                 # Zod schemas for validation
│   ├── types.ts                   # TypeScript interfaces
│   ├── prompt-builder.ts          # Asset prompt generation
│   ├── prompt-templates.ts        # Templates by asset type
│   ├── plan-parser.ts             # Parse markdown → structured data
│   ├── image-utils.ts             # Blob ↔ base64 conversion
│   └── utils.ts                   # General utilities (cn, etc.)
├── memory/                        # AI context files (read these!)
│   ├── PROJECT_ARCHITECTURE.md    # Complete system overview
│   ├── active_state.md            # Current session status
│   ├── system_patterns.md         # Standards and gotchas
│   ├── project_brief.md           # Mission, stack, goals
│   └── MEMORY_SYSTEM.md           # How memory system works
└── prisma/
    └── schema.prisma              # Database schema (SQLite)
```

## Critical Implementation Patterns

### 1. Component Structure
- All components using hooks MUST have `"use client"` directive
- Server Components by default, only add `"use client"` when needed
- Functional components only (no class components)
- Destructure props: `({ prop1, prop2 })` not `(props)`

### 2. State Management
- Local state first (`useState`), lift up only when necessary
- Props drilling initially, Context API only for deep trees
- Hybrid persistence: Dexie for client, Prisma for server

### 3. Styling Conventions
- Tailwind utility-first approach
- Use `cn()` utility for conditional classes (from `lib/utils.ts`)
- rem units for dimensions (not px)
- Mobile-first responsive design
- CSS variables for theming (prefix: `--aurora-`, `--glass-`)

### 4. OpenRouter Integration

**Image Generation**:
```typescript
// CORRECT model IDs
'black-forest-labs/flux.2-pro'     // Fast development
'black-forest-labs/flux.2-pro'   // High quality

// Endpoint
POST https://openrouter.ai/api/v1/chat/completions

// Required params
{
  model: 'black-forest-labs/flux.2-pro',
  messages: [{ role: 'user', content: prompt }],
  modalities: ['image', 'text']  // REQUIRED for image gen
}

// Image location in response
response.choices[0].message.images[0].image_url.url
```

### 5. Prisma 7 with libsql Adapter

**Setup Pattern**:
```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaLibSql({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter });
```

**Windows WSL2 Compatibility**:
- Project uses `@libsql/win32-x64-msvc` for native Windows support
- `DATABASE_URL` env var format: `file:./dev.db` (local SQLite)

## Known Gotchas and Solutions

### Development Environment
**Issue**: WSL2 + Windows hybrid environment
- User runs `bun dev` in Windows PowerShell (native)
- Claude Code operates in WSL2 (Linux)
- **Solution**: User manually runs `bun` commands, Claude uses file operations

### AI SDK v6 Tool Detection
**Issue**: Infinite loops when detecting tool calls in useEffect
- **Cause**: `processedIds` Set recreated on every render
- **Solution**: Use `useRef` to persist Set across renders
```typescript
const processedIds = useRef(new Set<string>());
if (!processedIds.current.has(id)) {
  processedIds.current.add(id);
  // Process...
}
```

### Token Limit with Images
**Issue**: Returning base64 images in tool results causes 1M+ token error
- **Cause**: 2MB base64 image = ~1M tokens
- **Solution**: Return only ID in tool result, fetch image via separate endpoint
```typescript
// Tool returns
return { styleAnchorId: 'abc-123' };

// Client fetches separately
fetch(`/api/style-anchor?id=${styleAnchorId}`)
```

### Glassmorphism Visibility
**Issue**: Glass effects invisible on white background
- **Cause**: `backdrop-filter: blur()` requires colored background
- **Solution**: Add aurora gradient to `body` in `globals.css`

### Prisma Field Naming
**Issue**: Prisma uses camelCase, client uses snake_case
- **Cause**: Different conventions between layers
- **Solution**: Map fields explicitly
```typescript
const fieldMap = {
  'art_style': 'artStyle',
  'base_resolution': 'baseResolution',
  // ...
};
```

## Testing Strategy

### Test Organization
- **Unit tests**: Components and utilities (Jest + React Testing Library)
- **Integration tests**: API routes (Jest with `node` environment)
- **UI tests**: Component rendering (Jest with `jsdom` environment)

### Environment Guards
```typescript
// In jest.setup.js - guard window-only mocks
if (typeof window !== 'undefined') {
  // IndexedDB mocks, etc.
}
```

### Running Tests
```bash
bun run test              # Watch mode (interactive)
bun run test:ci           # CI mode (single run + coverage)
bun run test:coverage     # Coverage report only
```

## Memory System (AI Context Persistence)

**Critical**: This project uses a memory system to maintain context across sessions.

**Before starting work**:
1. Read `memory/active_state.md` - Current status and next steps
2. Read `memory/PROJECT_ARCHITECTURE.md` - Complete system overview
3. Read `memory/system_patterns.md` - Standards and gotchas

**When ending a session**:
1. Update `memory/active_state.md` with progress
2. Add any new patterns to `memory/system_patterns.md`
3. Create ADR in `memory/adr/` for significant decisions

**Purpose**: Prevents session amnesia, ensures continuity across AI conversations.

## Architecture Decisions (ADRs)

Key decisions documented in `memory/adr/`:
- **ADR-005**: Replaced CopilotKit with Vercel AI SDK v6
- **ADR-006**: Generation architecture (composite sprites default)
- **ADR-007**: Hybrid Persistence Model (Prisma + Dexie)
- **ADR-008**: Style Anchor Image Generation via OpenRouter Flux.2

## Current Project Status

**Completion**: ~85% overall

| Phase | Status | Notes |
|-------|--------|-------|
| Planning Phase | ✅ 100% | Chat, tools, plan generation working |
| Style Anchor Phase | ✅ 100% | Image generation, preview display complete |
| Generation Phase | 🟢 85% | Backend + UI built, integration pending |
| Export Phase | 🔴 0% | Not started |

**Recent Work** (as of 2025-12-27):
- Completed style anchor image generation via OpenRouter Flux.2
- Fixed AI SDK v6 tool part detection issues
- Resolved token limit error with separate image fetch endpoint
- Implemented collapsible StylePreview with image display

**Next Priorities**:
1. Integrate GenerationQueue UI into planning page
2. Build character registry warning system
3. Implement batch generation workflow
4. Add cost estimation for generation queue

## Important Links

- **Project Repository**: Private (zenchantlive/Asset-Hatch)
- **Framework Docs**: https://nextjs.org/docs
- **AI SDK Docs**: https://sdk.vercel.ai/docs
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Prisma Docs**: https://www.prisma.io/docs

## Development Tips

1. **Use game designer terminology** in UI (not artist terms)
   - ✅ "Pixel Art", "Low Poly 3D"
   - ❌ "Watercolor", "3D Painted"

2. **AI should be agentic** (proactive, not reactive)
   - User: "I want pixel art" → AI immediately calls `updateQuality`
   - Don't wait for explicit permission to use tools

3. **Glassmorphism aesthetic** (soft, ethereal, not cyberpunk neon)
   - Deep purple/blue backgrounds with aurora accents
   - Subtle borders, backdrop blur, gentle animations

4. **Type safety is critical**
   - All schemas defined with Zod
   - Strict TypeScript mode enabled
   - No implicit `any` types

5. **Performance matters**
   - 60fps animations (use CSS transforms)
   - <2s page loads
   - Avoid unnecessary re-renders (useCallback, useMemo)
