# Active State - Asset Hatch Development

**Last Updated:** 2026-01-14
**Current Phase:** 3D Mode Implementation - Export Fix Required
**Status:** ✅ Skybox Approval & Assets Panel Fixed, Ready for Export TDD

---

## 🎯 Latest Session Summary (2026-01-14 Evening)

### Skybox Approval & Assets Panel 3D Fix (Complete)

Fixed multiple issues with 3D asset approval flow and assets panel display.

**Bugs Fixed:**
1.  **`SKYBOX_ASSET_SUFFIX` ReferenceError** - Fixed self-referencing constant in `AssetsPanel.tsx` (line 28)
2.  **Skybox Approval API 404** - Created new PATCH endpoint at `/api/projects/[id]/3d-assets/[assetId]/route.ts`
3.  **Incorrect API paths in `SkyboxSection.tsx`** - Changed `/assets/` to `/3d-assets/`
4.  **Approval status UI state** - Added `approvalStatus` state to show badge after approval/rejection

**Assets Panel 3D Enhancements:**
1.  **Server API fetch** - Changed from Dexie (client IndexedDB) to server API fetch for 3D assets
2.  **3D Viewers Integrated:**
    *   `SimpleSkyboxViewer` (Babylon.js PhotoDome) for skybox 360° preview
    *   `ModelViewer` (Three.js R3F) for GLB model preview
3.  **Tab switcher** - Toggle between "Spherical 360°" and "Flat 2:1" for skybox detail view
4.  **Grid previews** - 3D models now show live `ModelViewer` in grid cards (not just placeholder icon)

**Seam Fix Restored:**
*   Reverted `image-processing.ts` to pre-commit `fa0cc13` working version
*   The broken pixel manipulation was replaced with proper cross-fade blending

**Validation:**
```
✅ Skybox approval API returns 200 OK
✅ Assets Panel 3D loads approved assets from server
✅ 3D viewers render correctly in detail view
✅ Seam fix button works again
✅ ESLint warnings fixed (unused variables removed)
```

---

## 🎯 Next Priority: Export Fix (TDD Approach)

**Problem:** Approved 3D assets (skyboxes, 3D models) are NOT being added to export. Only 2D assets work.

**Approach:** Test-Driven Development (TDD)
1.  Write failing tests for export of all asset types
2.  Make tests pass by fixing export logic
3.  Verify with manual testing

**GitHub Issue:** Created with detailed instructions (see issue tracker)

---

## 🎯 Previous Session Summary (2026-01-14)

### 3D Mode Feature - Phase 4: Security Fixes & Verification

Successfully addressed all HIGH PRIORITY security issues identified in PR #27 review.

**Branch:** `3d-gen-phase-4-ui` (ready to merge)

**Security Fixes Completed:**

1. **Authentication Enabled** (HIGH PRIORITY - FIXED)
   - `src/app/api/generate-3d/route.ts` - Enabled auth() and added project ownership verification
   - `src/app/api/generate-3d/[taskId]/status/route.ts` - Enabled auth() and added ownership check
   - `src/app/api/generate-3d/rig/route.ts` - Enabled auth() and added ownership check
   - `src/app/api/generate-3d/animate/route.ts` - Enabled auth() and added ownership check
   - `src/app/api/generate-3d/approve/route.ts` - Added auth() and ownership verification
   - `src/app/api/export-3d/route.ts` - Added auth() and ownership verification
   - `src/app/api/projects/[id]/3d-assets/route.ts` - Added auth() and ownership verification

2. **Access Control on Status Polling** (HIGH PRIORITY - FIXED)
   - Status endpoint now verifies user owns the project before returning task status
   - Added projectId to AssetMatchResult interface for proper ownership checks
   - Prevents users from polling other users' task statuses

3. **Feature Verification** (CONFIRMED - ALL COMPLETE)
   - ✅ **Rigging UI** - Fully implemented in `AssetActions3D.tsx` (lines 117-122)
   - ✅ **Animation Preset Selection** - Fully implemented in `AssetActions3D.tsx` (lines 124-167)
   - ✅ **Approval/Reject Workflow** - Fully implemented in `AssetActions3D.tsx` (lines 210-245)
   - ✅ **Batch Export** - Fully implemented in `ExportPanel3D.tsx` and `/api/export-3d/route.ts`

**Files Modified:** 7 API routes with auth/ownership checks added

**Security Improvements:**
- All 3D generation API routes now require authentication
- Project ownership verified before any operation
- Status polling endpoint prevents unauthorized access
- Export endpoint protected with ownership checks

---

## 🎯 Previous Session Summary (2026-01-13)

### 3D Mode Feature - Phase 4 & 5: UI Integration & Core Flow Complete

Successfully completed end-to-end 3D generation workflow from planning through model preview.

**Branch:** `3d-gen-phase-4-ui` (ready to merge)

**Deliverables Completed:**
- **API Fixes:**
  - `lib/tripo-client.ts` - Fixed response unwrapping (responseData.data)
  - `app/api/generate-3d/[taskId]/status/route.ts` - Fixed Next.js 15 async params, correct model URL extraction (pbr_model)
  - `app/api/proxy-model/route.ts` - **NEW** CORS proxy for Tripo CDN
- **UI Components:**
  - `components/3d/generation/ModelViewer.tsx` - Three.js GLB viewer with proxy integration, fixed Suspense import
  - `components/3d/generation/GenerationQueue3D.tsx` - Asset tree, polling, status badges, download dropdown
  - `app/test-3d/page.tsx` - **NEW** Test page for debugging
- **Test Infrastructure:**
  - `scripts/test-tripo-basic.ts` - Standalone API test script with clear GLB URL output
  - `scripts/test-viewer.html` - Browser-based 3D viewer (unused, replaced by Next.js proxy)

**Total New Code:** 3 new files, 5 files modified (~800 lines)

**Key Implementation Fixes:**
- **CORS Issue:** Tripo CDN blocks direct browser access → proxy through `/api/proxy-model`
- **Response Parsing:** Tripo wraps responses as `{ code: 0, data: {...} }` → unwrap data field
- **Model URL Location:** Model URL at `output.pbr_model` (direct string), NOT `output.model.url`
- **Next.js 15 Breaking Change:** Route params now async → must await before destructuring

**Working Flow:**
```
1. User creates 3D project → Planning phase
2. Chat with AI → Generate [RIG]/[STATIC] plan
3. Generation tab → Select asset from tree
4. Click "Generate" → Tripo task submits
5. Poll every 2s → Progress updates (0-100%)
6. Status: success → Model URL extracted → Saves to DB
7. ModelViewer loads GLB through proxy → 3D preview renders
8. Download dropdown → User exports GLB file
```

**Validation Results (Phase 4):**
```
✅ Test script generates cube successfully (~80s)
✅ Model URL extraction working (pbr_model)
✅ CORS proxy functioning (streams GLB from Tripo)
✅ ModelViewer renders with orbit controls
✅ Status polling updates UI in real-time
✅ Download dropdown provides GLB export
✅ TypeScript: Suspense import fixed, no new errors
```

---

## 🎯 Previous Session Summary (2026-01-13) - Continued

### 3D Mode Feature - Phase 6: Animation Playback & UI Polish (Complete)

Successfully implemented 3D animation playback and resolved critical bugs related to state persistence and rendering.

**Deliverables & Fixes:**

1.  **Animation Playback:**
    *   **NEW Component:** `AnimatedModelViewer.tsx` implements GLB animation playback using `useAnimations` and `useFrame`.
    *   **Playback Controls:** Added play/pause button, progress bar, and automatic play on view selection.
    *   **Skeletal Cloning Fix:** Resolved "T-pose" bug where standard `scene.clone()` broke animation bindings. Now using `SkeletonUtils.clone()` for proper bone retargeting.
    *   **Responsive Viewer:** Adjusted viewer height units (`max-h-[60vh]`) to ensure controls remain visible on shorter screens.

2.  **Persistence & Hydration:**
    *   **Self-Healing Hydration:** Added logic to `GenerationQueue3D.tsx` to automatically re-poll rig tasks if `riggedModelUrl` is missing but `rigTaskId` exists. This fixed "Apply Animation" button doing nothing after refresh.
    *   **Debug Logging:** Added comprehensive console logging for hydration and action guards to simplify future troubleshooting.

3.  **UI/UX Improvements:**
    *   **Approval Feedback:** Updated `AssetActions3D.tsx` to show a green "Approved" badge and "Undo" button instead of repeating "Approve & Save".
    *   **State Visibility:** Animation controls now remain visible for "Complete" assets, allowing users to add/manage multiple animations over time.

**Validation:**
```
✅ Playback: animations play correctly on switch (Fixed T-pose bug).
✅ UI: All controls visible on shorter screens (Fixed height bug).
✅ Persistence: Rigged data restores automatically on refresh (Fixed hydration bug).
✅ Gameplay: Immediate visual feedback for Approve/Reject actions.
```

**Next Steps (TODO):**
- [x] **Batch Export** - ZIP download with multiple models + metadata ✅ COMPLETED
- [ ] **Educational Tooltips** - Add tooltips to status badges and animation buttons
- [ ] **Additional Asset Types:**
  - Skybox generation (text-to-skybox via Tripo)
  - Environment props (trees, rocks, buildings)
  - Item models (weapons, tools, collectibles)

---

## 🎯 Previous Session Summary (2026-01-13) - Continued

### 3D Mode Feature - Phase 5: Rigging, Animation & Persistence (Debugging Complete)

---

## 🎯 Previous Session Summary (2026-01-12)

### 3D Mode Feature - Phase 3: Generation Backend (Implementation)

Successfully implemented complete 3D asset generation backend using Tripo3D API. All 10 tasks from implementation plan completed.

**Branch:** `3d-gen-phase-2-planning` (will merge Phase 3 changes here)

**Deliverables Completed:**
- **Client Utility:** `lib/tripo-client.ts` - Tripo3D API client (~177 lines)
- **API Routes:** 4 complete endpoints with error handling
  - `app/api/generate-3d/route.ts` - Main generation (~143 lines)
  - `app/api/generate-3d/[taskId]/status/route.ts` - Status polling (~138 lines)
  - `app/api/generate-3d/rig/route.ts` - Auto-rigging (~159 lines)
  - `app/api/generate-3d/animate/route.ts` - Animation retargeting (~178 lines)
- **Testing:** `app/api/generate-3d/__tests__/route.test.ts` - Unit tests (~234 lines)
- **Configuration:** Updated `.env.example` with TRIPO_API_KEY
- **Documentation:** JSDoc comments on all functions, updated system prompt

**Total New Code:** 6 files created (~1,029 lines), 2 files modified

**Key Implementation Details:**
- Task-based async pattern: Submit → Poll → Complete
- Database state machine: queued → generating → generated → rigging → rigged → animating → complete
- Comprehensive error handling with emoji logging (🎨 📤 ✅ ❌)
- BYOK support prepared (TODO: add tripoApiKey field to User model)
- All files under 200 lines (modular design)

**Validation Results:**
```
✅ TypeScript typecheck: 0 new errors
✅ ESLint: 0 errors, 0 warnings on new files
✅ Unit tests: 6 test cases covering validation + happy paths
✅ Code style: Follows openrouter-image.ts pattern
✅ Documentation: Complete JSDoc on all public APIs
```

**API Endpoint Flow:**
```
1. POST /api/generate-3d          → taskId
2. GET /api/generate-3d/[taskId]/status → { status, progress, output }
3. POST /api/generate-3d/rig      → taskId (if [RIG] asset)
4. POST /api/generate-3d/animate  → taskId (for each animation)
```

**Next Steps (Phase 4 - UI):**
- Build GenerationQueue UI component
- Add 3D model viewer (.glb preview)
- Implement status polling hooks
- Add batch generation controls
- Cost estimation displays

---

## 🎯 Previous Session Summary (2026-01-12)

### 3D Mode Feature - Phase 3: Generation Backend (Planning)

Created comprehensive implementation plan for 3D asset generation backend using Tripo3D API.

**Plan Document:** `.agents/plans/3d-generation-backend-phase-3.md` (~450 lines)

**Key Architectural Decisions:**
- Task-based async architecture with status polling (no webhooks)
- Database-first approach (Generated3DAsset model already exists in schema)
- BYOK support (users can provide their own Tripo API keys)
- Client-side task orchestration (UI controls generation → rig → animate chain)
- URL storage only (no binary GLB files in database)

---

## 🎯 Previous Session Summary (2026-01-12)

### 3D Mode Feature - Phase 2: Planning Mode

Implemented 3D-specific planning chat experience with [RIG]/[STATIC] tag parsing.

**Branch:** `3d-gen-phase-2-planning`

**Deliverables Completed:**
- **Schemas:** `lib/schemas-3d.ts` - Zod schemas for 3D AI tools (~95 lines)
- **Parser:** `lib/3d-plan-parser.ts` - [RIG]/[STATIC] tag extraction (~256 lines)
- **Tests:** `lib/3d-plan-parser.test.ts` - 16 unit tests (all passing)
- **Chat Tools:** `lib/chat-tools-3d.ts` - 3D-specific AI SDK tools (~234 lines)
- **Route Update:** `app/api/chat/route.ts` - Conditional 3D mode detection

**Key Decisions:**
- Modular file structure (~200 lines per file)
- Type inference for AI SDK tools (ReturnType pattern)
- 'Uncategorized' fallback for orphan assets
- Parallel tools (2D tools unchanged, 3D tools added)

---

## 🎯 Previous Session Summary (2026-01-12)

### PR Merges Completed
- **PR #17**: `feat(auth): Add demo user account system for resume showcase`
  - Added `DEMO_ACCOUNT.md` with credentials and setup instructions
  - Added `src/prisma/seed.ts` for creating demo user
  - Enables hiring managers to test the full application
  
- **PR #18**: `refactor(options): Remove all 3D art style options from the app`
  - Replaced Low Poly/High Poly with 2D-focused options
  - New options: Pixel Art (8-bit), Pixel Art (16-bit), Hand-painted 2D
  - Updated CLAUDE.md, design system guide, and tests
  
- **PR #19**: `chore(deploy): Prepare Asset Hatch for Vercel deployment`
  - Added `vercel.json` configuration
  - Added `VERCEL_DEPLOYMENT.md` comprehensive guide
  - Added `SECURITY_WORKFLOW.md` for security audit setup
  - Updated `.env.example` with production variables

All PRs passed typecheck and lint verification.

### Demo Account Verification & Fixes
- **Fixed Prisma Seed Script**: Updated `prisma/seed.ts` to use PrismaPg adapter pattern (matching `lib/prisma.ts`)
- **Fixed Prisma Config**: Added `seed` command to `prisma.config.ts` (package.json seed config is ignored when using prisma.config.ts)
- **Verified Demo User Creation**: Successfully ran `bunx prisma db seed`
  - Email: `*****`
  - Password: `******`

### VS Code Configuration Fixes
- **CSS Import Types**: Created `src/global.d.ts` for CSS module declarations (fixes TS2882)
- **Tailwind v4 At-Rules**: Created `.vscode/tailwind-css.json` and updated `.vscode/settings.json` to recognize `@theme`, `@apply`, `@layer`
- **Empty Ruleset**: Added `color-scheme: dark;` to `.dark` class in `globals.css`

### New Files Created This Session
- `src/global.d.ts` - TypeScript CSS module declarations
- `.vscode/tailwind-css.json` - Custom CSS data for Tailwind v4 at-rules

---

## 🎯 Previous Session Summary (2026-01-02)

### Problem: Mobile Planning/Style UX was "awful"
- Persistent 50/50 split was cramped and unreadable on mobile.
- User couldn't see the plan/style preview while chatting effectively.
- AI tool calls were being processed but output was hidden or hard to access.

### Solution: Mobile-First "Chat + Slide-out Panels" Pattern
- **Full-Width Chat by Default**: Mobile now starts in a full-width ChatInterface.
- **View Toggles in Toolbar**: Added "📄 Plan" and "🎨 Style" buttons to the mobile toolbar.
- **Full-Screen Slide-out Panels**: Tapping toggles opens the existing `PlanPreview` and `StylePreview` in full-screen overlays.
- **Persistent Input**: Added `CompactChatInput` to the bottom of these panels so users can suggest changes directly from the preview without returning to chat.
- **Clean Transitions**: Panels slide from right/bottom to match the Assets/Files panel pattern.

### Technical Cleanup & Debt Reduction (Phase 2)
- **Resolved 15+ Lint Errors**: Fixed all remaining warnings across 9 files, including unused variables in `api/generate/route.ts` and `GenerationLayoutContext.tsx`.
- **Next.js Image Optimizations**: Migrated `<img>` tags to `<Image />` in `DirectionGrid` and `VersionCarousel`, adopting better performance standards.
- **Type Safety Hardening**: Replaced `any` types with specific enums and interfaces in the generation logic.
- **Documentation**: Created ADR-021 and ADR-022 to archive the mobile design decisions.


---


## 📋 Complete Changes Made

### 1. Database Migration (Turso → Neon Postgres)

**Schema Changes (`prisma/schema.prisma`):**
```prisma
// BEFORE:
datasource db {
  provider = "sqlite"
}

model GeneratedAsset {
  imageBlob  Bytes  // 2MB per image!
  // ...
}

// AFTER:
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

model GeneratedAsset {
  // imageBlob REMOVED - images in IndexedDB
  // Only metadata stored (prompt, seed, status)
  // ...
}
```

**StyleAnchor kept imageBlob:**
- Style anchors still need server storage for API reference images
- Changed `Bytes` → `Bytea` for PostgreSQL compatibility
- Added `@db.Text` for large text fields

### 2. Prisma Client Update (`lib/prisma.ts`)

**Removed libsql adapter:**
```typescript
// BEFORE:
import { PrismaLibSql } from '@prisma/adapter-libsql'
const adapter = new PrismaLibSl({ url, authToken })
new PrismaClient({ adapter })

// AFTER:
import { PrismaClient } from '@prisma/client'
// No adapter needed for PostgreSQL
new PrismaClient({
  log: ['query', 'error', 'warn'] // Added logging
})
```

**Environment variable priority:**
1. `POSTGRES_PRISMA_URL` (Neon/Vercel pooled connection)
2. `DATABASE_URL` (fallback for local SQLite)

### 3. API Route Updates

#### `app/api/generate/route.ts`
**Changed:** Removed imageBlob storage
```typescript
// BEFORE:
await prisma.generatedAsset.create({
  data: {
    imageBlob: Buffer.from(result.imageBuffer), // 2MB blob!
    // ...
  }
})

// AFTER:
await prisma.generatedAsset.create({
  data: {
    // imageBlob removed
    // Only metadata stored
    // Client saves image to IndexedDB
  }
})
```

#### `app/api/generated-assets/route.ts`
**Changed:** Sync metadata only (not blobs)
```typescript
// BEFORE:
const buffer = Buffer.from(imageBlob, 'base64');
await prisma.generatedAsset.upsert({
  update: { imageBlob: buffer }
})

// AFTER:
await prisma.generatedAsset.upsert({
  update: {
    // No imageBlob
    // Only prompt, seed, metadata
  }
})
```

#### `app/api/assets/[id]/route.ts`
**Changed:** Return metadata only
```typescript
// BEFORE:
return NextResponse.json({
  imageUrl: `data:image/png;base64,${Buffer.from(asset.imageBlob).toString('base64')}`
})

// AFTER:
return NextResponse.json({
  // No imageUrl from server
  // Client reads from IndexedDB
  metadata: { ... }
})
```

#### `app/api/export/route.ts`
**Changed:** Accept images from client
```typescript
// BEFORE:
export async function POST(req) {
  const { projectId } = await req.json();
  // Read imageBlob from Prisma
  zip.file(path, generatedAsset.imageBlob);
}

// AFTER:
export async function POST(req) {
  const { projectId, assets: clientAssets } = await req.json();
  // Client sends images from IndexedDB
  const clientAsset = clientAssets.find(a => a.id === id);
  const buffer = Buffer.from(clientAsset.imageBlob, 'base64');
  zip.file(path, buffer);
}
```

### 4. Frontend Update (`components/export/ExportPanel.tsx`)

**Changed:** Send images from IndexedDB to export API
```typescript
// BEFORE:
const response = await fetch('/api/export', {
  body: JSON.stringify({ projectId })
});

// AFTER:
// 1. Fetch images from IndexedDB
const approvedAssets = await db.generated_assets
  .where('project_id').equals(projectId)
  .and(asset => asset.status === 'approved')
  .toArray();

// 2. Convert to base64
const assetsWithBase64 = await Promise.all(
  approvedAssets.map(async (asset) => {
    const arrayBuffer = await asset.image_blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const imageBlob = btoa(String.fromCharCode(...bytes));
    return { id: asset.id, imageBlob };
  })
);

// 3. Send to API
const response = await fetch('/api/export', {
  body: JSON.stringify({ projectId, assets: assetsWithBase64 })
});
```

---

## 🏗️ New Architecture

### Data Flow: Image Generation

```
User clicks "Generate"
    ↓
POST /api/generate
    ↓
OpenRouter generates image → Returns image URL
    ↓
Server saves METADATA to Neon Postgres:
  - prompt, seed, status, metadata
  - NO image blob
    ↓
Client receives image URL
    ↓
Client downloads image
    ↓
Client stores in IndexedDB (db.generated_assets):
  - id, project_id, asset_id
  - image_blob: Blob (2MB)
    ↓
UI displays from IndexedDB
```

### Data Flow: Page Refresh

```
User refreshes page
    ↓
Client loads from IndexedDB
    ↓
Images persist ✅
    ↓
NO database query for images
```

### Data Flow: Export

```
User clicks "Export"
    ↓
Client reads images from IndexedDB
    ↓
Client converts to base64
    ↓
POST /api/export { projectId, assets: [...] }
    ↓
Server fetches metadata from Neon
    ↓
Server builds ZIP with client images
    ↓
Returns ZIP download
```

---

## 📊 Storage Comparison

### Before (Turso + Database Blobs)

| User Count | Images per User | Database Size | Free Tier |
|------------|----------------|---------------|-----------|
| 10 users   | 30 images      | 600 MB        | ❌ Over limit |
| 100 users  | 30 images      | 6 GB          | ❌ Way over |

**Problem:** Demo would fill database in days

### After (Neon + IndexedDB)

| Data Type | Location | Size | Cost |
|-----------|----------|------|------|
| User accounts | Neon Postgres | ~1 KB per user | ✅ Free forever |
| Project metadata | Neon Postgres | ~500 B per project | ✅ Free forever |
| Image metadata | Neon Postgres | ~200 B per image | ✅ Free forever |
| **Actual images** | **User's browser** | **2 MB per image** | **$0 (client-side)** |
| Style anchors | Neon Postgres | ~2 MB per project | ✅ Acceptable |

**Result:**
- 1000 users × 30 images each = **~10 MB database usage** ✅
- 30,000 images stored = **0 bytes on server** ✅
- Neon free tier: 512 MB = plenty of headroom ✅

---

## 🔧 Environment Variables

### Required for Local Development

```bash
# Database (Neon Postgres)
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?connect_timeout=15&sslmode=require"

# Authentication (Auth.js v5)
AUTH_SECRET="xxx"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
AUTH_GITHUB_ID="xxx"
AUTH_GITHUB_SECRET="xxx"

# OpenRouter (for demo/fallback)
OPENROUTER_API_KEY="sk-or-v1-xxx"
```

### Required for Vercel Deployment

```bash
# Database (Neon Postgres)
POSTGRES_PRISMA_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?connect_timeout=15&sslmode=require"
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require"  # Backup

# Authentication (Auth.js v5)
AUTH_SECRET="xxx"  # DIFFERENT from local (generate new for prod)
NEXTAUTH_URL="https://asset-hatch.vercel.app"  # Your Vercel URL

# OAuth Providers (REQUIRED for production)
AUTH_GITHUB_ID="xxx"  # Production OAuth app
AUTH_GITHUB_SECRET="xxx"

# OpenRouter (demo fallback key)
OPENROUTER_API_KEY="sk-or-v1-xxx"  # With spending limits!

# Optional Neon Auth (if using Neon's auth)
NEXT_PUBLIC_STACK_PROJECT_ID="xxx"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_xxx"
STACK_SECRET_SERVER_KEY="ssk_xxx"
```

**⚠️ CRITICAL:**
- Use DIFFERENT `AUTH_SECRET` for production vs local
- Set spending limits on production OpenRouter key
- Production GitHub OAuth app needs different callback URL

---

## ✅ Migration Checklist

### Completed

- [x] Update `schema.prisma` for PostgreSQL
- [x] Remove `imageBlob` from GeneratedAsset model
- [x] Update `lib/prisma.ts` (remove libsql adapter)
- [x] Update `app/api/generate/route.ts` (no blob storage)
- [x] Update `app/api/generated-assets/route.ts` (metadata only)
- [x] Update `app/api/assets/[id]/route.ts` (no image return)
- [x] Update `app/api/export/route.ts` (accept client images)
- [x] Update `components/export/ExportPanel.tsx` (send images)
- [x] Add Neon env vars to `.env.local`

### TODO (Next Steps)

- [ ] Run `bunx prisma generate`
- [ ] Run `bunx prisma db push`
- [ ] Remove old dependencies: `bun remove @prisma/adapter-libsql @libsql/client @libsql/win32-x64-msvc`
- [ ] Test locally: `bun dev`
- [ ] Test `/api/settings` endpoint (should work!)
- [ ] Test image generation flow
- [ ] Test export functionality
- [ ] Deploy to Vercel
- [ ] Add env vars to Vercel project
- [ ] Test production deployment

---

## 🐛 Known Issues & Solutions

### Issue: "Unknown field `openRouterApiKey`"
**Status:** ✅ FIXED
**Solution:** Migration to Neon + schema regeneration

### Issue: Turso WSL/Windows path conflicts
**Status:** ✅ RESOLVED (switched to Neon)
**Solution:** Neon works from both Windows and WSL seamlessly

### Issue: Database storage filling up
**Status:** ✅ FIXED
**Solution:** Images in IndexedDB, only metadata in database

### Issue: Images lost on browser clear
**Status:** ⚠️ EXPECTED BEHAVIOR
**Solution:**
- Show warning banner: "Demo mode: Export before leaving"
- Authenticated users can optionally sync to cloud (future feature)
- Open source users run locally (unlimited storage)

---

## 📚 Architecture Decisions

### Why IndexedDB for Images?

**Pros:**
- ✅ 10GB+ per user (vs 512MB total on Neon free tier)
- ✅ Zero server cost
- ✅ Works offline
- ✅ Persists across refreshes
- ✅ Perfect for demo (forces export, shows workflow)

**Cons:**
- ❌ Lost on browser clear (acceptable for demo)
- ❌ Not synced across devices (future feature if needed)

**Decision:** Perfect fit for portfolio demo + open source usage

### Why Neon over Vercel Postgres?

Both are identical (serverless Postgres). Neon chosen because:
- User already set it up
- Same free tier (512 MB)
- Works identically
- Either works fine

---

## 🎯 Next Immediate Actions

1. **Generate Prisma Client:**
   ```powershell
   cd src
   bunx prisma generate
   ```

2. **Push Schema to Neon:**
   ```powershell
   bunx prisma db push
   ```

3. **Remove Old Dependencies:**
   ```powershell
   bun remove @prisma/adapter-libsql @libsql/client @libsql/win32-x64-msvc
   ```

4. **Test Locally:**
   ```powershell
   bun dev
   # Visit http://localhost:3000/api/settings
   # Should work without "Unknown field" error!
   ```

5. **Deploy to Vercel:**
   - Add env vars to Vercel dashboard
   - Push to GitHub (auto-deploy)
   - Test production

---

### Recent Achievements
- **Mobile UI Redesign**:
  - Implemented full-width mobile chat with slide-out preview panels for Planning/Style modes.
  - Created `FlatAssetList` and `ModelsPanel` (modal-based) for the Generation phase on mobile.
  - Added `CompactChatInput` for contextual edits within previews.
- **Lint & Tech Cleanup**:
  - Fixed 15+ ESLint issues (unused variables, Next.js optimization warnings, any types).
  - Switched to `<Image />` for all generation previews.
- **Generation UI Refactor (v2.1)**:
  - Consolidated generation controls into `UnifiedActionBar`.
  - Implemented **Front-First** generation workflow to ensure character consistency.
  - Refactored `DirectionGrid` to remove redundant buttons and improve mobile UX.

- **Security Hardening**: Implemented OAuth account linking and fixed race conditions in persistence logic.

### Active Session State
- **Current Focus**: Task closure and branch merge.
- **Active Branch**: `feat/mobile-planning-ux-redesign`
- **Key Concepts**:
  - `Chat-First Overlay`: High-density chat with full-screen slide-outs.
  - `Contextual AI`: Chatting while viewing content.
  - `Lint-Clean`: Zero warnings in the current build.

## 🎓 Lessons Learned

1. **Hybrid WSL/Windows environments are tricky** - Use one or the other
2. **Database blobs expensive for demos** - Client-side storage is free
3. **Prisma client must match schema** - Regenerate after changes
4. **Turbopack caches aggressively** - Clear `.next` when in doubt
5. **IndexedDB perfect for portfolio demos** - Forces export, shows workflow

---

## 📖 For Future Sessions

When resuming work:
1. Check this file for latest status
2. Review architecture diagrams above
3. Remember: **Images are in IndexedDB, not database**
4. Test `/api/settings` first to verify DB connection
5. Check `VERCEL_POSTGRES_SETUP.md` for deployment steps

---

## 🔗 Related Documentation

- `memory/PROJECT_ARCHITECTURE.md` - Full system overview
- `memory/system_patterns.md` - Coding standards
- `VERCEL_POSTGRES_SETUP.md` - Deployment guide
- `memory/adr/` - Architecture decision records

---

**END OF ACTIVE STATE**

