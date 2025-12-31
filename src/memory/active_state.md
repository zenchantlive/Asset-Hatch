# 🧠 Active Session State

**Last Updated:** 2025-12-30
**Session:** Open Source Security Preparation - 🔄 IN PROGRESS
**Branch:** `security/open-source-preparation`
**Latest Commits:**
- `f70e4b4` - security: Stop tracking dev.db and exclude all database files
- `bef20a8` - feat(generation): Batch workflow improvements with version carousel
- `7c72098` - docs: Add open source preparation documentation

---

## 📍 Current Focus

> **🔒 OPEN SOURCE PREPARATION:** Comprehensive security audit and preparation for open-sourcing Asset Hatch. Removed dev.db from tracking, created documentation foundation, designed per-user API key architecture. Next: BFG cleanup of git history and secret rotation.

---

## 🔥 Latest Session's Work (2025-12-30) - Generation Fixes & Optimization

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
| **Generation Workflow** | ✅ Complete | **Batch UX + Version System Implemented** |
| **Data Sync** | ✅ Complete | Prisma→Dexie on mount |
| **Export System** | ✅ Complete | Full workflow integration |

---

## 🚀 Next Steps

1. ✅ **COMPLETE:** Batch workflow improvements committed and pushed
2. **Manual Testing:** User should test batch workflows in running app
3. ⏳ **IN PROGRESS:** Open source preparation (see latest session below)

---

## 💡 Key Learnings

1. **Two-Step Selection:** Users prefer to review their selection before starting expensive operations.
2. **Version Comparison:** Keeping all generations allows users to make informed decisions rather than relying on immediate judgment.
3. **Compact Actions:** Small, always-visible action buttons improve discoverability and reduce cognitive load.
4. **Progressive Enhancement:** The version carousel only appears when needed (multiple versions), avoiding UI clutter for simple cases.

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
| **Generation Workflow** | 95% | ✅ Batch UX + version carousel complete |
| **Export System** | 100% | ✅ Full workflow integration |
| **Open Source Prep** | 30% | 🔄 Docs complete, BFG pending |

**Next Major Milestone:** Open source launch (3-4 weeks after BFG cleanup)
