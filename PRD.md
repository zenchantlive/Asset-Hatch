# Product Requirements Document: R2 Asset Storage Migration

## 1. Executive Summary
Asset Hatch currently stores and serves 3D asset data in the database as base64 strings, and several API endpoints return those blobs directly. This inflates data transfer costs and risks exceeding Neon transfer quotas. The proposed MVP migrates 3D asset binaries to Cloudflare R2, serving assets via URLs and optionally signed URLs, while minimizing breaking changes by keeping API contracts backward-compatible where possible.

The core value proposition is to reduce database transfer costs, improve asset delivery performance with CDN caching, and establish a scalable storage layer for 3D assets. The MVP goal is to store and serve GLB files from R2 while keeping Babylon preview and game runtime loading stable and fast.

## 2. Mission
Deliver a low-cost, scalable asset storage solution using Cloudflare R2 that eliminates large binary payloads from API responses and reduces Neon transfer usage without breaking existing client workflows.

Core principles:
- Minimize breaking changes
- URL-first asset delivery
- Transparent migration from base64 storage
- Strong caching defaults
- Clear operational visibility

## 3. Target Users
Primary personas:
- Indie creators using Asset Hatch to generate and preview 3D assets
- Internal developers and maintainers operating the Hatch Studios stack

Technical comfort level:
- Moderate: familiar with web apps, not necessarily infrastructure

Key needs and pain points:
- Reliable asset loading in Babylon.js previews and game runtime
- Predictable, low storage and transfer costs
- Simple operational model for asset storage

## 4. MVP Scope
### In Scope
**Core Functionality**
- ✅ Store newly approved 3D assets in Cloudflare R2
- ✅ Persist canonical R2 URLs for assets in the database
- ✅ Serve assets to Babylon.js via URLs (not base64)
- ✅ Optional signed URL generation for private buckets

**Technical**
- ✅ R2 integration using S3-compatible SDK
- ✅ CDN/cache headers for R2 object delivery
- ✅ Migration path for existing base64 data
- ✅ Backward-compatible API response behavior (opt-in for base64)

**Integration**
- ✅ Update asset approval flow to upload to R2
- ✅ Update asset manifest to prefer URLs
- ✅ Logging for upload failures and fallback behavior

**Deployment**
- ✅ Environment variables for R2 credentials and bucket

### Out of Scope
- ❌ Full client UI redesign
- ❌ Offline-first asset loading
- ❌ Asset versioning and diffing
- ❌ Multi-region storage replication

## 5. User Stories
1. As a creator, I want my assets to load quickly in the preview, so that I can iterate faster.
   - Example: Preview loads a GLB from a CDN URL instead of a base64 payload.
2. As an admin, I want to reduce Neon transfer costs, so that the project stays within budget.
   - Example: Asset APIs return URLs by default, not base64 blobs.
3. As a developer, I want a migration path from existing assets, so that users are not broken.
   - Example: Base64 remains available behind a query flag during transition.
4. As a creator, I want rigs and animations to work as before, so that asset behavior is unchanged.
   - Example: Babylon imports GLB from URL and plays animation groups normally.
5. As a developer, I want to easily change storage provider settings, so that ops can scale.
   - Example: R2 bucket and credentials are configured by env vars.
6. As a product owner, I want visibility into asset storage usage, so that cost can be managed.
   - Example: Log storage sizes and upload success/failure.

## 6. Core Architecture & Patterns
High-level architecture:
- Asset binaries stored in Cloudflare R2
- Application DB stores asset metadata and URLs
- API responses default to URL delivery; base64 optional

Key patterns:
- URL-first asset delivery
- Optional signed URL for access control
- Backward-compatible API responses via query param or feature flag
- Cache-control headers for CDN efficiency

## 7. Tools/Features
### Feature: R2 Upload on Asset Approval
- Upload GLB to R2 during asset approval
- Store resulting URL in `GameAssetRef.glbUrl`
- Fallback to original URL if upload fails

### Feature: URL-first Asset Manifest
- Asset manifest includes `urls.glb` and `urls.model` from R2
- Optional `urls.glbData` only when explicitly requested

### Feature: Optional Signed URLs
- If configured, generate signed URL for asset fetch
- Use in manifest or runtime loader

### Feature: Migration Utility
- Script to read existing base64 data, upload to R2, and clear DB field

## 8. Technology Stack
Backend:
- Next.js 16.1 (App Router)
- TypeScript 5 (strict)
- Prisma 7.2

Storage:
- Cloudflare R2 (S3-compatible)
- Optional CDN (Cloudflare) for public caching

Libraries:
- `@aws-sdk/client-s3` or `@aws-sdk/lib-storage` for S3 API

## 9. Security & Configuration
Authentication:
- Existing Auth.js session checks remain

Configuration (env vars):
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL` (if public)
- `R2_SIGNED_URL_TTL` (optional)

Security scope:
- Signed URLs for private buckets
- Avoid returning base64 blobs by default

Deployment considerations:
- Ensure Vercel environment variables configured
- Ensure R2 bucket CORS allows GET from app domain

## 10. API Specification
### GET /api/studio/assets
- Default: return URLs only
- Optional: `?includeGlbData=1` returns base64 data

Example response (URL-first):
```json
{
  "success": true,
  "assets": [
    {
      "id": "...",
      "name": "Knight",
      "type": "3d",
      "thumbnailUrl": "https://.../thumb.png",
      "modelUrl": "https://cdn.example.com/assets/knight.glb",
      "riggedModelUrl": "https://cdn.example.com/assets/knight.glb"
    }
  ]
}
```

### GET /api/studio/games/[id]/assets
- Default: manifest URLs only
- Optional: `?includeGlbData=1`

### POST /api/generate-3d/approve
- Upload to R2 and store URL in DB
- If upload fails, keep original URL and log

## 11. Success Criteria
- ✅ Babylon preview loads assets via URL without regressions
- ✅ Neon transfer reduced by >80% on asset endpoints
- ✅ Asset approval reliably uploads to R2
- ✅ Base64 payloads only returned when explicitly requested
- ✅ Caching headers applied to R2 objects

## 12. Implementation Phases
### Phase 1: R2 Integration
Goal: Store assets in R2 and serve URLs
Deliverables:
- ✅ R2 upload helper
- ✅ Environment variable support
- ✅ Store R2 URL in DB
Validation:
- Upload succeeds in dev and production

### Phase 2: URL-first API Responses
Goal: Reduce transfer and payload size
Deliverables:
- ✅ Default URL-only responses
- ✅ `includeGlbData` opt-in
Validation:
- Existing UI remains functional
- Transfer reduced

### Phase 3: Migration
Goal: Move existing base64 assets to R2
Deliverables:
- ✅ Migration script
- ✅ Remove glbData after upload
Validation:
- All migrated assets still load

## 13. Future Considerations
- Asset deduplication via hash
- Multi-bucket tiering (hot/cold storage)
- Background revalidation and integrity checks
- Offline asset packs

## 14. Risks & Mitigations
1. **Breaking clients that rely on base64**
   - Mitigation: Use `includeGlbData` opt-in during transition
2. **R2 upload failures**
   - Mitigation: Fallback to original URLs + logging
3. **Signed URL expiration**
   - Mitigation: Use longer TTLs and caching for previews
4. **CORS misconfiguration**
   - Mitigation: Provide default CORS policy in setup docs

## 15. Appendix
- Related files:
  - `src/app/api/studio/assets/route.ts`
  - `src/app/api/studio/games/[id]/assets/route.ts`
  - `src/app/api/generate-3d/approve/route.ts`
  - `src/lib/studio/asset-loader.ts`
  - `src/lib/studio/types.ts`
