# Active State - Asset Hatch Development

**Last Updated:** 2026-01-03
**Current Phase:** PR Cleanup & Deployment Prep
**Status:** ✅ ALL TASKS COMPLETE - LINT CLEAN



---

## 🎯 Latest Session Summary (2026-01-03)

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

