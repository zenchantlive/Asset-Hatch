# Active State

## Current Session (2026-01-20)

### Chat Model Switcher
Added a model switcher dropdown to all chat interfaces (Planning, Studio, Game Planning). Users can now select from multiple AI models (MiniMax, Gemini, etc.) directly from the chat input area.

**Implementation:**
- Created `ChatModelSwitcher.tsx` component with compact dropdown UI
- Integrated into `ChatInterface.tsx`, `ChatPanel.tsx`, `GamePlanChat.tsx`
- Updated `model-registry.ts` with 5 chat models (MiniMax M2.1 as default)
- Updated API routes to accept `model` parameter in request body
- Dropdown opens upward (bottom-full) to avoid clipping at screen bottom

**Debug Journey:** Component wasn't visible initially due to Turbopack cache corruption. Fixed by clearing `.next` and regenerating Prisma client.

**Stage:** ✅ Completed

### Chat UX Polish + Shared Components
Unified message rendering, actions, prompt chips, pinned context, and quick-fix bars across Planning, Studio, and Studio planning chats. Added shared message parsing utilities and auto-scroll behavior that pauses when users scroll mid-stream.

**Stage:** Completed

 during streaming, reset-chat history action (preserving context), retry behavior to remove last user+assistant before resending, and queued message visibility with edit/delete controls across Planning, Studio, and Studio planning chats.

### Project-Game Linking Bug Fix
Fixed regression where "Go to Game" button showed "No Game Yet" even after creating project with "Both Together" option.

**Root Cause:** Conditional game creation logic broke the invariant that project and game should always be linked.

**Fix Applied:**
- Backend: Removed conditional game creation. Now ALWAYS creates project + game in single atomic transaction
- API: Added explicit `select` for `gameId` in `/api/projects/[id]` GET route
- Frontend: Changed redirect to unified project page with tab param

**Files Modified:**
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/components/dashboard/NewProjectDialog.tsx`

**Stage:** ✅ Completed (pushed to `feat/byok-tripo-api-key`)

### Skybox Generation Reliability
Expanded OpenRouter image parsing to read image data from `message.content`/`annotations` and blocked 3D generation from running on skybox assets.

**Stage:** In Progress

### BYOK Expansion: Tripo API Key
Added "Bring Your Own Key" support for Tripo3D API, mirroring the existing OpenRouter BYOK pattern.

**Completed:**
- Added `tripoApiKey` field to User model in schema.prisma
- Added Tripo key validation in `/api/settings` (validates tsk_ prefix)
- Extended API response to include `hasTripoKey` and `tripoKeyPreview`
- Refactored ApiKeySettings.tsx to support both OpenRouter and Tripo keys
- Updated settings page with Tripo section and instructions
- Enabled BYOK in `/api/generate-3d` route (user key → env fallback)

**Debug Session (2026-01-20):**
User reported 3D generation failing with 500 error. Root cause analysis:

1. **Initial misdirection**: User said Tripo keys start with `tsk-` (hyphen) - we changed all validation to match
2. **Still failing**: Key saved but Tripo API returned 401 Authentication failed
3. **Added debug logging**: Traced BYOK retrieval chain (session → user → key source)
4. **Discovered real issue**: Tripo docs confirm keys start with `tsk_` (UNDERSCORE), not `tsk-` (hyphen)
5. **User had wrong key**: Was copying Client ID (`tsk-...`) instead of API Key (`tsk_...`)
6. **Fixed validation order**: Reverted to `tsk_` prefix, ensured BYOK takes priority over env var

**Key Learnings:**
- Always verify API documentation before trusting user assumptions
- Tripo API keys: `tsk_***` (underscore) | Client IDs: `tcli_***`
- Old validation was creating actual tasks to test keys (wasteful!) - now uses `/user/balance` endpoint

**Files Modified:**
- `src/prisma/schema.prisma`
- `src/app/api/settings/route.ts`
- `src/components/settings/ApiKeySettings.tsx`
- `src/app/settings/page.tsx`
- `src/app/api/generate-3d/route.ts`
- `src/lib/tripo-client.ts`

**Stage:** ✅ Completed and tested

**Trello MCP (Next Session Requirement):**
- Use Trello MCP (if available) to manage tasks throughout the next session (pull next tasks, update progress, move cards, add labels).

**Next Tasks (from Trello):**
- Preview screenshot capture (user + AI flow) (`Chat Backlog`) — scheduled for the session after next
- Auto-fix game preview errors (`Gen Backlog`)
- Skybox generation quality tuning (`Gen Backlog`)
- ✅ BYOK expansion: Tripo API key + settings (`Manual Test` → Done)
- ✅ Project-Game linking: "Go to Game" button always works (`Manual Test` → Done)

---

## Branch Status
- **Current:** `feat/byok-tripo-api-key`
- **Base:** `base/hatch-studios`
- **Main:** `main`

**Recent Commits:**
- `ab6f184` - fix: always create project and game together
- `bf6ac23` - fix: include gameId in GET /api/projects/[id] response

---

## Architecture Quick Reference

### 4 Phases
Planning → Style Anchor → Generation → Export

### Dual Database Pattern
| Layer | Storage | Purpose |
|-------|---------|---------|
| Server | Neon PostgreSQL (Prisma) | User accounts, projects, metadata, style anchors |
| Client | IndexedDB (Dexie) | Generated images (2MB each), offline cache |

### Style Anchor System
- **Definition:** Visual consistency anchor for all generated assets
- **Stored in:** `StyleAnchor` table (Prisma)
- **Contains:** `styleKeywords`, `lightingKeywords`, `colorPalette`, `referenceImageBase64`
- **Applied to:** 2D sprites, 3D models, **skyboxes** (as of this session)

### Data Flow: Image Generation
```
POST /api/generate → OpenRouter → Returns image URL
    ↓
Server saves METADATA to Neon (no blob)
    ↓
Client downloads image → Stores in IndexedDB
    ↓
UI displays from IndexedDB
```

### Data Flow: Export
```
User clicks Export → Client reads IndexedDB → Sends base64 to /api/export → ZIP returned
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/style-anchor-generator.ts` | Core style anchor generation |
| `lib/skybox-prompts.ts` | FLUX2-optimized skybox prompt builder |
| `app/api/generate-skybox/route.ts` | Skybox generation endpoint |
| `app/api/generate/route.ts` | 2D asset generation |
| `app/api/generate-3d/route.ts` | 3D model generation (Tripo3D) |

---

## Session History (Summarized)

### 2026-01-16
- Mobile 3D UI rework (2-tab navigation, scrolling fixes)
- Vercel deploy fix (Prisma provider mismatch)

### 2026-01-14
- AssetsPanel consolidation and refactoring
- 3D security fixes (auth on all API routes)

### 2026-01-13
- 3D generation Phase 4-6: UI, animation playback, persistence
- Tripo3D CORS proxy implementation

### 2026-01-12
- 3D generation backend (Tripo3D API integration)
- Planning mode with [RIG]/[STATIC] tag parsing
- PR merges: demo account, 2D art styles, Vercel deploy prep

### 2026-01-02
- Mobile Planning/Style UX redesign (slide-out panels)
- Lint cleanup, Next.js Image migrations

### Pre-2026
- Turso → Neon PostgreSQL migration
- IndexedDB for image storage (cost reduction)
- OAuth, authentication, initial 2D generation flow

---

## Environment Variables

```bash
# Required
POSTGRES_PRISMA_URL="postgresql://..."
AUTH_SECRET="..."
OPENROUTER_API_KEY="sk-or-v1-..."

# Optional
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
TRIPO_API_KEY="..."

# Storage (R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_BASE_URL="..."
R2_SIGNED_URL_TTL="..."
ASSET_PROXY_SECRET="..."
```

---

## Known Patterns

1. **Token Limits:** Never return base64 in tool results - return ID, fetch separately
2. **AI SDK v6:** Use `useRef(new Set())` for processed IDs to prevent infinite loops
3. **WSL2 Split:** User runs `bun` in PowerShell, Claude operates in WSL2
4. **CI/CD:** Check BOTH `vercel.json` AND `package.json` for build commands

---

**END OF ACTIVE STATE**
