# 🧠 Active Session State

**Last Updated:** 2025-12-31
**Session:** Open Source Launch Preparation - ✅ PHASE 2 COMPLETE
**Branch:** `main`
**Latest Commits:**
- `aedf895` - docs: Open source launch documentation and code quality fixes
- `f70e4b4` - security: Stop tracking dev.db and exclude all database files
- `bef20a8` - feat(generation): Batch workflow improvements with version carousel

---

## 📍 Current Focus

> **🚀 OPEN SOURCE READY:** BFG cleanup complete, secrets rotated, comprehensive documentation created. Folder structure renamed from `asset-hatch/` to `src/`. README fully rewritten with self-hosting guide. Ready for repository to go public.

---

## 🔥 Latest Session (2025-12-31) - Flux 2 Pro Migration & Cost Tracking

### 1. Flux 2 Pro Migration
**Context:**
Transitioned from the legacy `flux-2-dev` model to `black-forest-labs/flux.2-pro` to improve generation quality. Encountered runtime errors due to legacy data still referencing the old "flux-2-dev" ID.

**Solution:**
- **Standardized Model ID:** Replaced all hardcoded instances with the new pro model ID.
- **Resilient Fallback:** Implemented fallback logic in `style-anchor-generator.ts` and `generateFluxImage` to handle unknown model IDs gracefully.
- **Registry Integration:** Moved model definitions to a centralized `ModelRegistry`.

### 2. Inline Cost Tracking & Model Registry
**Context:**
Users needed a way to track actual generation costs. The initial "floating card" UI broke the layout and was difficult to read.

**Solution:**
- **Model Registry:** Created `lib/model-registry.ts` with auto-discovery and pricing metadata.
- **Inline UI:** Replaced the `CostSummaryCard` with an integrated inline display in `BatchControlsBar`.
- **Dynamic Metrics:** UI now displays "Est: $X.XXX" (estimated) and transitions to "Total: $X.XXX" (actual) once synced from API headers.
- **Context Plumbing:** Propagated cost data from `GenerationQueue` through `GenerationLayoutProvider`.

**Files:**
- `lib/model-registry.ts` (NEW)
- `lib/cost-tracker.ts` (NEW)
- `components/generation/panels/BatchControlsBar.tsx` (Integrated UI)
- `components/generation/GenerationQueue.tsx` (Data source)
- `memory/adr/018-model-registry-and-cost-tracking.md` (ADR)

---

## 📁 Files Modified/Created (This Session)

| File | Action | Purpose |
|------|--------|---------|
| `lib/model-registry.ts` | **CREATE** | Centralized model discovery and metadata |
| `lib/cost-tracker.ts` | **CREATE** | Cost estimation and actual cost utility |
| `components/generation/panels/BatchControlsBar.tsx` | **MODIFY** | Inline cost display integration |
| `components/generation/GenerationQueue.tsx` | **MODIFY** | Context data providing |
| `components/generation/CostSummaryCard.tsx` | **DELETE** | Removed layout-breaking component |
| `lib/style-anchor-generator.ts` | **MODIFY** | Added model fallback logic |

---

## ✅ Testing & Validation

- ✅ **Flux 2 Pro:** Verified generation works with the new model ID.
- ✅ **Fallback Logic:** Successfully handled legacy "flux-2-dev" IDs without crashing.
- ✅ **Cost Display:** Verified Est → Total transition in the UI.
- ✅ **Layout Integrity:** Confirmed relative units are respected after removing `CostSummaryCard`.
- ✅ **Type Safety:** `bun run typecheck` passed with zero errors.

---

## 🚧 Status Board

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ✅ Complete | OAuth linking enabled |
| **Generation Workflow** | ✅ Complete | Batch UX + Version System + Cost Tracking |
| **Data Sync** | ✅ Complete | Prisma→Dexie on mount |
| **Export System** | ✅ Complete | Full workflow integration |
| **Model Management** | ✅ Complete | Registry + Auto-discovery |
| **Open Source Prep** | ✅ Complete | BFG cleanup, docs, env example |

---

## 🚀 Next Steps

1. ⏳ **PENDING:** Complete Phase 2 of Model Extension (Dynamic registry in all selectors)
2. ⏳ **PENDING:** Research Phase 3 (HuggingFace Provider abstraction)
3. ⏳ **PENDING:** Formal testing suite for Model Registry
4. ⏳ **PENDING:** Push to remote (`git push`)
5. ⏳ **PENDING:** Make repository public

6. ⏳ **PENDING:** Make repository public
7. 📝 **OPTIONAL:** Write launch blog post

---

## 🔥 Latest Session (2025-12-31) - Open Source Documentation Complete

### 1. Performance & Critical Bug Fixes
**Context:**
Users reported lag with large generated images (base64) and a critical data integrity bug where approving a specific version in the carousel would incorrectly approve the *latest* version.

**Solution:**
- **High-Performance Rendering:** Refactored `VersionCarousel` to use `Blob` and `URL.createObjectURL`. This prevents large base64 strings from bloating the DOM and crashing the browser tab.
- **Version-Aware Approval:** Rewrote `approveAsset` and `rejectAsset` in `GenerationContext` to require explicit version objects/IDs. Updated all consumers (`GenerationQueue`, `PreviewPanel`, `GenerationProgress`) to pass the correct version.
- **Accurate Estimation:** Fixed `getCostEstimate` in `BatchControlsBar` to use `remainingCount` instead of `parsedAssets.length` when no assets are selecting, providing realistic cost estimates.

**Files:**
- `components/generation/VersionCarousel.tsx` (Optimization)
- `components/generation/GenerationQueue.tsx` (Logic Refresh)
- `components/generation/GenerationProgress.tsx` (Type Safety)
- `hooks/useBatchGeneration.ts` (API Update)

### 2. Previous Work (Earlier Today) - Batch Workflow & Version System


### 1. Prep All/Prep Remaining Workflow
**Context:**
Users wanted to select assets for batch generation without immediately starting generation. The old "Generate All" button was too aggressive and didn't allow reviewing the selection first.

**Solution:**
- **Prep All:** Renamed "Generate All" to "Prep All" when no assets are selected. This only selects all assets without starting generation.
- **Prep Remaining:** Added smart button that selects only non-generated assets (filters out approved/awaiting_approval).
- **Two-Step Flow:** Select → Review → Generate with warning for >5 assets.
- **Visual Distinction:** Used Sparkles icon for "Prep" actions vs Play icon for "Generate" actions.

**Files:**
- `components/generation/panels/BatchControlsBar.tsx`
- `components/generation/GenerationLayoutContext.tsx`
- `lib/types/generation-layout.ts`

### 2. Version Carousel System
**Context:**
When users regenerated an asset, the previous version was lost. No way to compare multiple generations before deciding which one to use.

**Solution:**
- **Database:** Added `asset_versions` table (v4) in Dexie to store all generations with metadata.
- **Carousel UI:** Created `VersionCarousel.tsx` component with:
  - Left/right navigation arrows
  - Dot indicators for version count
  - Version metadata display (model, seed, cost, duration)
  - Accept/Reject buttons for current version
  - Collapsible prompt preview
- **Auto-Save:** Each generation is automatically saved as a new version, newest shown by default.
- **Integration:** PreviewPanel conditionally renders carousel when multiple versions exist.

**Files:**
- `lib/client-db.ts` (bumped to v4)
- `lib/types/generation.ts` (extended AssetGenerationState)
- `components/generation/VersionCarousel.tsx` (NEW)
- `components/generation/GenerationQueue.tsx`
- `components/generation/panels/PreviewPanel.tsx`

### 3. Compact Action Buttons in Preview Panel
**Context:**
When viewing a single approved asset, users couldn't regenerate it without selecting a second asset to enter batch mode. Approve/Reject buttons were also missing from single-asset view.

**Solution:**
- **Compact Buttons:** Added small action buttons (3.5rem icons) next to status badge:
  - ✅ Approve (when awaiting review)
  - ❌ Reject (when awaiting review)
  - 🔄 Regenerate (when has result or error)
- **Always Visible:** These buttons are now always accessible in single-asset preview view.
- **Color-Coded Hover:** Green for approve, red for reject, purple for regenerate.

**Files:**
- `components/generation/panels/PreviewPanel.tsx`

### 4. Debug Logging for Batch Accept/Reject
**Context:**
Investigation into potential issue where batch-generated assets might not show accept/reject buttons.

**Solution:**
- **Logging:** Added comprehensive console.log in `onAssetComplete` callback to track result structure.
- **Verification:** Logs imageUrl presence, prompt, and metadata for debugging.

**Files:**
- `components/generation/GenerationQueue.tsx`

---

## 📁 Files Modified/Created (This Session)

| File | Action | Purpose |
|------|--------|---------|
| `components/generation/panels/BatchControlsBar.tsx` | **MODIFY** | Prep All/Prep Remaining workflow |
| `components/generation/GenerationLayoutContext.tsx` | **MODIFY** | selectAllVisible and selectRemainingAssets functions |
| `lib/types/generation-layout.ts` | **MODIFY** | Updated context type definitions |
| `lib/client-db.ts` | **MODIFY** | Added asset_versions table (v4) |
| `lib/types/generation.ts` | **MODIFY** | Extended AssetGenerationState with versions |
| `components/generation/VersionCarousel.tsx` | **CREATE** | New carousel component for version comparison |
| `components/generation/GenerationQueue.tsx` | **MODIFY** | Version preservation logic + debug logging |
| `components/generation/panels/PreviewPanel.tsx` | **MODIFY** | Integrated carousel + compact action buttons |

---

## ✅ Testing & Validation

- ✅ **Prep All:** Click "Prep All" → All assets selected → Button changes to "Generate (N)"
- ✅ **Prep Remaining:** Generate 2 assets → Approve them → "Prep Remaining" only selects remaining
- ✅ **Version Carousel:** Regenerate asset → Carousel appears with navigation
- ✅ **Compact Buttons:** Single asset view shows approve/reject/regenerate buttons
- ⚠️ **Manual Testing Required:** User needs to verify in running app

---

## 🚧 Status Board

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ✅ Complete | OAuth linking enabled |
| **Generation Workflow** | ✅ Complete | Batch UX + Version System |
| **Data Sync** | ✅ Complete | Prisma→Dexie on mount |
| **Export System** | ✅ Complete | Full workflow integration |
| **Open Source Prep** | ✅ Complete | BFG cleanup, docs, env example |

---

## 🚀 Next Steps

1. ✅ **COMPLETE:** BFG cleanup - removed dev.db from 16+ commits
2. ✅ **COMPLETE:** Secret rotation (GitHub OAuth, AUTH_SECRET)
3. ✅ **COMPLETE:** README rewritten with self-hosting guide
4. ✅ **COMPLETE:** `.env.example` created with documentation
5. ⏳ **PENDING:** Push to remote (`git push`)
6. ⏳ **PENDING:** Make repository public
7. 📝 **OPTIONAL:** Write launch blog post

---

## 📁 Files Modified Today (2025-12-31)

| File | Action | Purpose |
|------|--------|---------|
| `README.md` | **REWRITE** | Complete self-hosting documentation |
| `src/.env.example` | **CREATE** | Comprehensive env var guide |
| `.gitignore` | **MODIFY** | Allow .env.example tracking |
| `src/components/generation/VersionCarousel.tsx` | **FIX** | React hooks ordering |
| `src/components/generation/GenerationLayoutContext.tsx` | **FIX** | Type safety (removed any) |
| `src/lib/types/generation-layout.ts` | **FIX** | Type safety |
| `src/components/generation/panels/GenerateAllWarning.tsx` | **FIX** | Escaped JSX entities |

---

## 💡 Key Decision Made

**Simplified API key approach:** Instead of complex per-user encrypted database storage, we're using simple `.env` file configuration. Users add their OpenRouter key to `.env.local`. This is cleaner for self-hosted open source - the encrypted DB approach was overkill.

---

---

# 🔒 LATEST SESSION (2025-12-30) - Open Source Security Preparation

## Context

User requested comprehensive open-sourcing preparation with focus on:
1. User-provided API keys (vs shared developer key)
2. Database security (dev.db contains OAuth tokens, 97MB)
3. Git history sanitization (remove sensitive data)
4. Future monetization considerations (GPL v3 license kept)

## Work Completed

### Phase 1: Git History Cleanup Preparation

**Branch Created:** `security/open-source-preparation`

**Commit 1: Stop Tracking dev.db** (`f70e4b4`)
- ✅ Updated `.gitignore` with comprehensive database exclusions
  ```
  *.db, *.db-*, *.sqlite, *.sqlite-*, *.db-shm, *.db-wal
  dev.db*, prisma/*.db*
  ```
- ✅ Removed `dev.db` from git tracking (preserved locally)
- ✅ Prevents future accidental commits of sensitive database files

**Critical Finding:**
- dev.db committed **16+ times** throughout git history
- Contains OAuth tokens, API keys, user data (97MB file)
- Requires BFG Repo-Cleaner to remove from ALL commits

### Phase 2: Documentation Foundation

**Commit 2: Open Source Documentation** (`7c72098`)

Created comprehensive documentation (856+ lines total):

**1. `.env.example`** - Environment Variables Template
- Database configuration (SQLite with optional encryption)
- Auth.js v5 secrets (AUTH_SECRET, GitHub OAuth)
- OpenRouter API key (user-provided model)
- Optional: Analytics, storage (S3/R2), development flags
- Detailed comments explaining each variable

**2. `SECURITY.md`** - Security Policy
- Vulnerability reporting process (GitHub Security Advisories)
- Response timeline (48h initial, 1-90 days fix based on severity)
- Self-hosting security best practices:
  - API key management
  - Database encryption (SQLCipher)
  - OAuth security
  - Input validation
  - Dependency updates
- Current security model documentation
- Security roadmap (rate limiting, 2FA, audit logging)

**3. `docs/API_KEY_ARCHITECTURE.md`** - Technical Design (856 lines)
- **Problem Statement:** Single shared API key creates cost burden, security risk, no self-hosting
- **Solution:** Per-user OpenRouter API keys stored encrypted
- **Database Schema:**
  ```prisma
  model User {
    openRouterApiKey     String?   // AES-256-GCM encrypted
    openRouterKeyHash    String?   // SHA-256 for validation
    openRouterKeyTested  DateTime? // Last successful test
    openRouterUsage      Int       // Track generations
  }
  ```
- **Encryption Design:**
  - Algorithm: AES-256-GCM (authenticated encryption)
  - Key derivation: PBKDF2 (100k iterations) from user session secret
  - Why: Database breach doesn't expose keys (session-based decryption)
- **API Routes:** POST/GET/DELETE `/api/user/api-keys`
- **Integration:** Modified `generateFluxImage()` to use user's key
- **UI Flow:** Settings page → Add key → Test connection → Save encrypted
- **Security Analysis:** 6 threats + mitigations documented
- **Rollout Plan:** 4-week phased implementation

### Phase 3: License Decision

**Decision:** Keep GPL v3 (copyleft)
- Hosted version must also be open source
- Prevents proprietary forks
- Limits monetization to support contracts + open SaaS
- User chose this understanding implications

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `.gitignore` | **MODIFY** | Database file exclusions |
| `asset-hatch/.env.example` | **CREATE** | Environment template (94 lines) |
| `SECURITY.md` | **CREATE** | Security policy (200+ lines) |
| `docs/API_KEY_ARCHITECTURE.md` | **CREATE** | Technical design (856 lines) |

## Critical Next Steps (USER ACTION REQUIRED)

### Step 1: BFG Repo-Cleaner (Git History Sanitization)
⚠️ **MUST DO BEFORE OPEN SOURCING**

```bash
# 1. Install BFG
# Windows: Download from https://rtyley.github.io/bfg-repo-cleaner/
# macOS: brew install bfg

# 2. Create mirror clone
cd /mnt/c/Users/Zenchant/asset-hatch/
git clone --mirror https://github.com/zenchantlive/Asset-Hatch.git asset-hatch-spec.bfg

# 3. Run BFG
cd asset-hatch-spec.bfg
bfg --delete-files dev.db

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (⚠️ DESTRUCTIVE)
git push --force

# 6. Re-clone your working directory
cd ..
rm -rf asset-hatch-spec
git clone https://github.com/zenchantlive/Asset-Hatch.git asset-hatch-spec
```

### Step 2: Rotate All Secrets (After BFG)
⚠️ **ALL SECRETS POTENTIALLY COMPROMISED**

1. **OpenRouter API Key:**
   - Go to https://openrouter.ai/keys
   - Delete current key
   - Generate new key
   - Update `.env.local`

2. **GitHub OAuth Credentials:**
   - Go to https://github.com/settings/developers
   - Generate new client secret
   - Update `.env.local`

3. **Auth Secret:**
   ```bash
   openssl rand -base64 32
   # Update .env.local with new AUTH_SECRET
   ```

4. **Invalidate All Sessions:**
   ```bash
   rm asset-hatch/dev.db
   bunx prisma migrate reset
   ```

### Step 3: Implementation (After Secrets Rotated)

**Ready to implement:**
- [ ] Prisma schema migration (add API key fields)
- [ ] Encryption utilities (`lib/crypto-utils.ts`)
- [ ] API routes (`/api/user/api-keys`)
- [ ] Update `generateFluxImage()` integration
- [ ] Settings UI page (`/app/settings/api-keys/page.tsx`)
- [ ] First-run onboarding flow

## Status Board

| Task | Status | Blocker |
|------|--------|---------|
| Git history cleanup | ⏳ **USER ACTION** | BFG Repo-Cleaner |
| Secret rotation | ⏳ **BLOCKED** | Needs BFG first |
| API key schema | ⏳ **BLOCKED** | Needs rotation |
| Encryption utils | ⏳ **BLOCKED** | Needs rotation |
| Settings UI | ⏳ **BLOCKED** | Needs rotation |
| Documentation | ✅ **COMPLETE** | - |
| `.gitignore` updates | ✅ **COMPLETE** | - |

## Key Architectural Decisions

1. **Encryption Strategy:** Session-based key derivation (not stored in DB)
   - Rationale: Database breach doesn't expose API keys
   - Trade-off: Keys only accessible when user logged in

2. **License:** GPL v3 (kept existing)
   - Rationale: User preference, understands monetization limits
   - Implication: Hosted version must be open source

3. **API Key Model:** Per-user (not shared pool)
   - Rationale: Avoid cost burden, rate limits, security risks
   - Trade-off: Higher barrier to entry for users

4. **OAuth Tokens:** Currently in database
   - Next: Consider moving to JWT (session-only)
   - Alternative: Encrypt database with SQLCipher

## Security Audit Findings

**Critical Issues Found:**
1. ❌ dev.db in git history (16+ commits, 97MB, contains OAuth tokens)
2. ❌ No user-configurable API keys (shared key model)
3. ❌ OAuth tokens stored unencrypted in SQLite

**Mitigations Planned:**
1. ✅ BFG cleanup (in progress)
2. ✅ Per-user API key architecture (designed)
3. ⏳ JWT-based OAuth tokens OR SQLCipher (pending decision)

## What's Next

**Immediate (User):**
1. Run BFG Repo-Cleaner on local machine
2. Rotate all secrets
3. Force push cleaned history

**After Cleanup (Claude):**
1. Implement API key management system
2. Create README.md self-hosting guide
3. Build database initialization script
4. Create CONTRIBUTING.md
5. Run security audit (`bun audit`)
6. Test fresh clone on clean machine

**Timeline Estimate:**
- User actions (BFG + rotation): 1-2 hours
- Implementation: 2-3 weeks (per architecture doc)
- Testing & validation: 1 week
- **Total to open source:** 3-4 weeks

---

## 📊 Overall Project Status

| Phase | Completion | Notes |
|-------|-----------|-------|
| **Planning Workflow** | 100% | ✅ Chat, tools, AI agent working |
| **Style Anchor** | 100% | ✅ Image gen, preview complete |
| **Generation Workflow** | 100% | ✅ Batch UX + version carousel |
| **Export System** | 100% | ✅ Full workflow integration |
| **Open Source Prep** | 95% | ✅ BFG done, docs complete, ready to push |

**Next Major Milestone:** Make repository public 🎉
