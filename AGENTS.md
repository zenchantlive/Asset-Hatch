# AGENTS.md - Guide for AI Coding Agents

This document provides guidelines for AI agents working on the Asset-Hatch codebase.

**IMPORTANT:** This project includes **Hatch Studios** - an AI-powered game creation extension. Read `src/.agents/plans/hatch-studios/implementation-prd.md` and `src/memory/active_state.md` for current implementation status.

## Quick Reference Commands

```bash
# Development (run in PowerShell, not WSL)
cd asset-hatch/src
bun dev              # Start dev server (localhost:3000)
bun build            # Build for production
bun start            # Start production server

# Code Quality
bun run lint         # ESLint
bun run typecheck    # TypeScript strict checking
bun run lint --fix   # Auto-fix linting issues

# Testing
bun run test              # Jest watch mode
bun run test:ci           # CI mode with coverage (no watch)
bun run test:coverage     # Coverage report only
bun run test -- <pattern> # Run specific test file
bun run test -- --testPathPattern="chat"  # Run tests matching pattern

# Database
bunx prisma studio   # Open database GUI
bunx prisma generate # Generate Prisma client
bunx prisma db push  # Push schema changes (dev)
bunx prisma migrate dev  # Create migrations (prod)

# Build verification
bun run lint && bun run typecheck && bun run test:ci
```

## Project Overview

**Asset Hatch:** AI-powered 2D/3D game asset generation
**Hatch Studios:** AI-powered game creation extension (generates Babylon.js code from natural language)

### Hatch Studios Architecture
- **Multi-file game structure**: main.js → player.js → level.js → game.js (sorted by orderIndex)
- **Shared context document**: `project-context.json` persists between Assets and Game tabs
- **Tab-based navigation**: [🎨 Assets] [🎮 Game] with context-aware AI
- **Preview iframe**: Pre-loaded Babylon.js libraries (babylon.js, babylon.gui, loaders, materials)

### Current Phase (2026-01-17)
- **Phase 6b**: Shared Context & Unified UI (IN PROGRESS)
- **Open Issue**: API parameter mismatch - ChatPanel sending to `/api/chat` instead of `/api/studio/chat`

## Code Style Guidelines

### TypeScript
- **Strict mode enabled**: No implicit `any`, strict null checks
- **Never use `any`, `unknown`, or type assertions** (`as any`, `@ts-ignore`)
- **Use `const` over `let`** (immutability by default)
- **Interface over `type`** for object shapes (use `type` for unions/intersections)
- **Explicit return types** for all exported functions
- **Use Zod** for runtime validation (AI tool input schemas, API validation)

### React Components
- **Server Components by default**: Only add `"use client"` when hooks or browser APIs are needed
- **Functional components only**: No class components
- **Destructure props**: `({ prop1, prop2 })` not `(props)`
- **Hooks at top level**: Never call hooks conditionally
- **Early returns** for conditional rendering
- **Use Radix UI primitives** for accessible interactive components

### Imports & Organization
```typescript
// Order: 1. React/Next.js imports, 2. Third-party, 3. Internal
import React from "react"
import { useState, useCallback } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// Use @/ alias for internal imports
import { generateAssetPrompt } from "@/lib/prompt-templates"
```

### Styling (Tailwind CSS)
- **Utility-first**: Avoid custom CSS unless necessary
- **Use `cn()` helper** for conditional classes: `cn("base-class", condition && "conditional")`
- **rem units for dimensions** (not px): `h-4` = `1rem`, `p-2` = `0.5rem`
- **CSS variables for theming**: Prefix with `--aurora-` or `--glass-`
- **Mobile-first**: Default styles for mobile, `md:` and `lg:` for larger screens

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatInterface.tsx` |
| Hooks | camelCase + `use` prefix | `useAssetGeneration.ts` |
| Non-component files | kebab-case | `active-state.md` |
| Functions | camelCase | `handleSendMessage` |
| Constants | SCREAMING_SNAKE_CASE | `QUALITY_OPTIONS` |
| Types/Interfaces | PascalCase | `ProjectQualities` |
| CSS classes | kebab-case | `.glass-panel` |

### Error Handling
- **Never use empty catch blocks**: `catch (e) { /* log error */ }`
- **Use emoji logging** in API routes for scannability:
  ```typescript
  console.log('🎨 Starting operation:', { context })
  console.log('📤 Submitting to external API...')
  console.error('❌ Error:', error)
  ```
- **Throw descriptive errors**: `throw new Error("Failed to fetch: ${reason}")`

## Architecture Patterns

### Dual Persistence
- **Prisma (SQLite/PostgreSQL)**: Server-side source of truth for API routes
- **Dexie (IndexedDB)**: Client-side state and caching for UI components
- **Never bypass Prisma in API routes** for authoritative data

### Vercel AI SDK v6
- Use `streamText()` for chat endpoints
- **Tool detection gotcha**: Use `useRef` for `processedIds` Set to prevent infinite loops
- **Token limits**: Never return base64 in tool results—return ID, fetch image separately

### Database Schema Changes
- **For 1:1 relations**: Only ONE side defines `fields` and `references`
- **Prisma adapter pattern**: Use `PrismaPg` for PostgreSQL with connection pooling
- **Seed scripts**: Load `.env.local` explicitly with `dotenv`

### File Organization
```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (server-only)
│   └── [route]/      # Page routes
├── components/
│   ├── ui/           # Primitive components (Button, Input)
│   └── [feature]/    # Feature-specific components
├── lib/              # Utilities and clients
│   ├── [domain].ts   # Domain-specific logic
│   └── utils.ts      # Shared utilities
├── hooks/            # React hooks
├── types/            # TypeScript types
└── memory/           # AI-readable documentation
```

## Critical Gotchas

1. **WSL2 + Windows Split**: User runs `bun` in PowerShell, Claude operates in WSL2—user manually runs commands
2. **AI SDK v6 Tool Loops**: Use `useRef` for `processedIds` to prevent infinite tool calls
3. **Base64 on Large Blobs**: Process buffers in 16KB chunks to avoid stack overflow
4. **Vercel Build Config**: Lives in BOTH `vercel.json` AND `package.json`—grep both when debugging
5. **Glassmorphism Visibility**: Invisible without colored background—add gradient to `:root`
6. **React State Race Conditions**: Pass object directly to callbacks, don't look up from state

## Git Commit Format

```
type(scope): Title

Body with:
- Story of Collaboration (what user asked, iterations)
- Decisions Made (why this architecture)
- Challenges (what was hard)
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Testing Patterns

### Test Setup
- Tests use `jest` with `node` environment for integration tests
- **Mock external dependencies**: Prisma (via `prismaMock`), NextAuth, OpenRouter
- **Environment guards**: Check `typeof window !== 'undefined'` for browser-only mocks
- **Coverage threshold**: 80% for all metrics (branches, functions, lines, statements)

### Writing Tests
```typescript
describe("Feature", () => {
  beforeEach(() => { /* reset mocks */ })
  afterEach(() => { /* cleanup */ })

  it("should handle expected behavior", async () => {
    // Arrange
    const input = { ... }
    // Act
    const result = await functionUnderTest(input)
    // Assert
    expect(result).toMatchObject({ expected: "output" })
  })
})
```

## Memory System (Required)

**Before working**: Read these files (in order):
1. `src/memory/MEMORY_SYSTEM.md` - How to use the system
2. `src/memory/project_brief.md` - Project overview
3. `src/memory/active_state.md` - Current session status
4. `src/memory/PROJECT_ARCHITECTURE.md` - Full architecture
5. `src/memory/system_patterns.md` - Standards & gotchas

**After significant work**:
1. Update `active_state.md` (progress, next steps)
2. Add patterns to `system_patterns.md`
3. Create ADR for architectural decisions in `src/memory/adr/`

## Tech Stack Reference

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI SDK | Vercel AI SDK v6 |
| AI Provider | OpenRouter (Gemini, Flux) |
| Database | SQLite (Prisma) + IndexedDB (Dexie) |
| Auth | Auth.js (NextAuth v5) |
| Runtime | Bun |

## Cursor/Editor Rules

This project uses VS Code with Tailwind CSS IntelliSense. For Cursor IDE:
- `.cursor/rules/` directory contains project-specific rules
- Enable TypeScript strict mode in settings
- Configure `@/` path alias for imports
- ESLint and Prettier configured via `eslint.config.mjs`
