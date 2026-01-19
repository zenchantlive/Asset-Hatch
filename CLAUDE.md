# CLAUDE.md

## Memory System (ALWAYS DO THIS)
**Before working**: Read `src/memory/active_state.md`, `src/memory/PROJECT_ARCHITECTURE.md`, `src/memory/system_patterns.md`
**Before committing**: Update `src/memory/active_state.md`, add patterns to `src/memory/system_patterns.md`, create ADR for big decisions in `src/memory/adr/`

## Commands
```bash
cd asset-hatch/src
bun dev                 # Dev server
bun build && bun start  # Production
bun run lint            # ESLint
bun run typecheck       # Type check
bun run test            # Jest watch
bunx prisma studio      # DB GUI
```

## Tech Stack (One-liner)
Next.js 16 + React 19 + TypeScript strict | Tailwind v4 + shadcn/ui | Vercel AI SDK v6 + OpenRouter (Gemini + Flux) | Tripo3D + Three.js + Babylon.js | Prisma (SQLite/Neon) + Dexie (IndexedDB cache)

## Architecture Summary
- **Asset Hatch**: Planning → Style Anchor (2D) → Generation (2D/3D) → Export
- **Hatch Studios**: Plan → Code → Preview (Babylon.js), shared context with Asset Hatch
- **Dual DB**: Prisma = server truth, Dexie = client cache. API routes use Prisma, components use Dexie.
- **AI Tools**: Chat calls `streamText()` with tools → tool executes → streams back via SSE

## Critical Gotchas
1. **WSL2 Split**: User runs `bun` in Windows PowerShell, Claude operates in WSL2 - user runs commands manually
2. **AI SDK v6 Tool Detection**: Use `useRef` for `processedIds` Set to prevent infinite loops
3. **Token Limits**: Never return base64 in tool results - return ID, fetch image separately
4. **Prisma ↔ Client**: Map `art_style` → `artStyle` between layers
5. **CI/CD Build Config**: Vercel uses BOTH `vercel.json` AND `package.json` scripts. Always grep for failing commands across ALL config files before fixing. Use `/debug-ci` command.
6. **Preview iframe auth**: `srcdoc` iframe runs at origin `null`; cookies aren't available. Asset proxy must support token-based access and CORS headers.
7. **R2 signed URLs**: `R2_SIGNED_URL_TTL` should be set; fallback signing defaults to 900s when unset.

## Code Rules
- `"use client"` only when hooks are needed
- No `any` or `unknown` types
- Avoid type assertions (`as any`, `@ts-ignore`)
- Add brief comments only when logic is non-obvious
- Reuse existing code, keep files short and focused
- Use `cn()` for conditional Tailwind classes

## Git Commits (Blog Notebook Strategy)
Format: `type(scope): Title`

Body must include:
- **Story of Collaboration**: What did user ask? How did we iterate?
- **Decisions Made**: Why this architecture?
- **Challenges**: What was hard?

This feeds our "Building in Public" blog - be honest, vulnerable, and technically detailed.

## Blog Voice
Humorous, narrative-driven, technically honest. Admit mistakes. Highlight "loops" (recursive errors, ironic moments). Not corporate marketing - developer diary.

## Airweave MCP (Semantic Search)
**When to use**: Search codebase context (docs, design docs, implementation notes) when you need semantic understanding beyond grep.

```typescript
// Use Airweave when searching for:
// - "how does generation work?" (conceptual search)
// - "where is the auth logic?" (semantic find)
// - "find the cost tracking code" (description-based find)
// - "summaize commits from [today's date]"
// - "detail the [pr number] and comments and the commits"

// Default search: hybrid (semantic + keyword)
// Returns ranked results with relevance scores
```

**Collection ID:** `c3a49bac-31ef-4319-a343-eba9972701ee`

**When to prefer Airweave over grep:**
| Scenario | Tool |
|----------|------|
| Exact function/variable name | `grep` or `serena_search_for_pattern` |
| "Find where X is defined" | LSP (`lsp_find_references`) |
| Conceptual search ("how does Y work") | **Airweave** |
| Multi-concept query ("auth + error handling") | **Airweave** |
| Design docs, decisions, patterns | **Airweave** |
| Github Querey | **Airweave** |
