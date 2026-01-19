# Active State

## Current Session (2026-01-19)

---

## 🟢 RESOLVED: Asset Loading Reliability + Skybox Pipeline

### Implementation Summary

1. **Asset Loading Reliability**
   * **The Issue**: Preview iframe could not load assets due to CORS, auth, and unsigned R2 URLs.
   * **The Fix**: Added resolver + proxy pipeline with token support for `srcdoc` iframe, CORS headers, and default signed URL TTL.
   * **Runtime Support**: ASSETS.load now supports timeouts, typed errors, and resolver handshake.

2. **Havok Preload + Prompt Alignment**
   * **The Issue**: Havok was undefined in preview; physics aggregates threw errors.
   * **The Fix**: Preloaded Havok in preview libraries and enforced async init + readiness gating in the system prompt.

3. **Skybox Auto-Linking + PhotoDome**
   * **The Issue**: Skyboxes were not in the asset manifest and never appeared in AVAILABLE ASSETS.
   * **The Fix**: Added skybox type support in manifest + loader (PhotoDome), and auto-linked skyboxes at generation and on game manifest load for legacy projects.

### What Worked ✓

- **Proxy-based loading** - Assets load in `srcdoc` iframe without CORS failures.
- **Signed R2 URLs** - Default TTL ensures R2 fetches succeed when env unset.
- **Skybox visibility** - Skyboxes now show in AVAILABLE ASSETS and render via PhotoDome.

---

## Instructions for Next AI Session

### Use the Lattice Protocol

**Read `.claude/commands/validation/lattice.md` BEFORE making any architectural decisions.**

This is mandatory. The protocol provides:
- First-principles decomposition framework
- Dynamic perspective generation (4-7 viewpoints)
- Tension resolution methodology
- Anti-pattern detection

### Develop Powerful Personas (Meta-Creation)

Create 3-5 discipline-specific personas for this problem. Examples:

1. **CloudFront Signed URL Expert** - Understands URL expiration, policy construction, edge cache behavior
2. **Game Asset Pipeline Architect** - How games actually ship with 3D assets (bundling, CDN, versioning)
3. **Babylon.js Loading Specialist** - `ASSETS.load()`, `ImportMeshAsync`, async loading patterns, caching
4. **Security/Crypto Boundary Analyst** - Token expiration, CORS, origin restrictions, replay attacks

Reference these personas throughout your analysis. Each should:
- Ask 3-5 specific questions about the problem
- Identify what others would miss
- Have explicit blind spots documented

### Push Back on Our Architecture

Question these assumptions:

1. **"We need to store URLs at all"** - Why not download and re-host? What are the tradeoffs?
2. **"CloudFront is the right CDN"** - What about R2, Backblaze, or self-hosted?
3. **"ASSETS.load is the solution"** - Is this abstraction helping or hiding problems?
4. **"Tripo3D URLs are the source of truth"** - What if we fetched and cached on our infrastructure?
5. **"One-time download on approval"** - Should we refresh URLs periodically?

### Specific Questions to Answer

1. **Short-term fix**: Validate proxy + resolver diagnostics with `/debug-asset-loading`.
2. **Medium-term solution**: Evaluate asset cache strategy (IndexedDB) for offline preview.
3. **Asset inclusion**: Ensure skybox generation always produces a GameAssetRef.
4. **Cache strategy**: Consider bundling assets for export pipeline.

---

## Next Actions

### Phase 10: Permanent Asset Hosting (Required Fix)

**Goal**: Assets load reliably, URLs don't expire.

**Options to Evaluate**:
1. **Proxy + Refresh**: Use resolver + proxy for iframe-safe fetches
2. **Download + Upload**: On approval, download GLB from Tripo3D, upload to R2, store permanent URL
3. **Client Cache**: Download to IndexedDB on first load, use cached version

**Files likely involved**:
- `src/app/api/generate-3d/approve/route.ts` - Add download/upload logic
- `src/lib/studio/asset-loader.ts` - Update ASSETS.load to handle permanent URLs
- `src/app/api/studio/games/[id]/assets/route.ts` - Return permanent URLs
- Maybe new R2/S3 upload utility

---

## What Actually Happened in This Session

### Timeline

1. **Added resolver + proxy for asset loading** ✓
2. **Resolved iframe CORS/auth issues with proxy token** ✓
3. **Defaulted R2 signed URL TTL when env missing** ✓
4. **Preloaded Havok + updated physics prompt** ✓
5. **Enabled skybox type + auto-linking** ✓

### Key Learnings

- **Iframe auth matters** - `srcdoc` has origin `null`, requiring token-based proxy access.
- **R2 signing required** - unsigned R2 URLs return 400; default TTL fixes this.
- **Skybox must be linked** - auto-linking is needed for AVAILABLE ASSETS to include skybox.

### Console Evidence

```
✅ [ASSETS] Loaded 3D asset: ringed_gas_giant
✅ [ASSETS] Loaded 3D asset: explorer_starship_"vector"
✅ [ASSETS] Loaded 3D asset: iron_asteroid_alpha
✅ PhotoDome skybox visible in preview
```

---

## For Reference

### Key Files Modified This Session

| File | Change |
|------|--------|
| `src/lib/studio/asset-loader.ts` | Resolver handshake, timeouts, skybox support |
| `src/app/api/studio/assets/proxy/route.ts` | Proxy with CORS + diagnostics |
| `src/app/api/studio/assets/resolve/route.ts` | Resolver with proxy token |
| `src/lib/studio/preview-libraries.ts` | Havok preload |
| `src/app/api/generate-skybox/route.ts` | Auto-link skybox to game |

### Commands

```bash
bun dev              # Dev server (restart after code changes)
bun run lint         # ESLint
bun run typecheck    # TypeScript
bunx prisma studio   # Database GUI
```

### Tech Stack Reminder

- Next.js 16 + React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui
- Vercel AI SDK v6 + OpenRouter (Gemini)
- Prisma (Neon PostgreSQL) + Dexie (IndexedDB cache)
