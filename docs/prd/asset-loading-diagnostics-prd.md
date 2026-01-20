# PRD: Asset Loading Reliability & Diagnostics (Hatch Studios)

## 1. Executive Summary
Asset loading in the Hatch Studios Babylon.js preview is unreliable and opaque. Assets fail silently or return null, while the system hides URL resolution and error provenance. This PRD defines a production-grade asset loading architecture, diagnostics layer, and minimal refactor plan that eliminate silent failure modes and make backend errors visible without leaking sensitive details.

The core value proposition: developers can load approved assets by stable keys and always receive either a valid mesh/transform or a typed, actionable error within a bounded time. The platform owns URL signing and cache policy; scene code never hard-codes storage URLs. The IDE exposes a debuggable asset registry and activity log so failures are explainable and reversible.

MVP goal: ship a deterministic `ASSETS.load` contract, backend resolve/signing layer, and developer-facing diagnostics panel so assets either render or fail with clear remediation steps.

## 2. Mission
Deliver a robust asset loading pipeline that is predictable, diagnosable, and secure for in-browser Babylon.js games.

Core principles:
- Determinism over convenience: every asset load resolves or rejects within a defined SLA.
- Separation of concerns: asset identity, URL signing, and mesh instantiation are distinct layers.
- Secure by default: scene code never touches raw storage URLs.
- Debuggability: failures are visible, structured, and attributable.
- Compatibility: minimal changes to existing game file structure and runtime globals.

## 3. Target Users
- Primary persona: game developer using Asset Hatch to generate and load 3D assets in the studio preview.
- Secondary persona: platform engineer maintaining asset storage and signing pipeline.
- Technical comfort: intermediate to advanced JavaScript/TypeScript and Babylon.js familiarity.

Key needs and pain points:
- Need to load assets by stable identifiers without guessing URL formats.
- Need fast, actionable error messages when loads fail.
- Need clear asset registry visibility in the IDE (keys, types, status, source).
- Need predictable scaling/normalization behavior.

## 4. MVP Scope
### Core Functionality
- ✅ Define `ASSETS.load(key, scene, options)` contract with typed errors and timeout.
- ✅ Backend asset resolver that maps keys/IDs to a signed URL or data URL.
- ✅ IDE-visible asset registry view (key, id, type, status, source).
- ✅ Structured logging for asset load attempts with correlation IDs.
- ✅ Clear failure surface in preview (console + IDE panel).

### Technical
- ✅ Enforce: no raw storage URLs in user scene code.
- ✅ Add asset load timeout (default 8s, configurable).
- ✅ Provide `ASSETS.getInfo(key)` with non-sensitive metadata.

### Integration
- ✅ Keep multi-file runtime architecture (main.js/player.js/level.js/game.js).
- ✅ Maintain existing manifest API shape with versioned enhancements.

### Out of Scope
- ❌ Full export bundling of assets + code.
- ❌ Offline asset caching in IndexedDB for preview.
- ❌ Asset version conflict UI (planned Phase 2+).
- ❌ Automatic asset normalization in the editor UI (future).

## 5. User Stories
1. As a developer, I want `ASSETS.load("explorer_starship")` to either return a mesh or fail with a reason so I can fix it quickly.
   - Example: returns `AssetLoadError` with code `URL_EXPIRED` and remediation.
2. As a developer, I want to see available asset keys and status in the IDE so I do not guess key names.
   - Example: registry shows `ringed_gas_giant` as approved and linked.
3. As a platform engineer, I want all asset loads to go through a resolver so URL signing is centralized.
   - Example: signed URLs are generated per request with TTL and logging.
4. As a developer, I want a clear log entry when an asset fails so I can report it with context.
   - Example: log includes requestId, key, resolved source, and failure stage.
5. As a developer, I want an explicit timeout if an asset stalls so I can avoid frozen scenes.
   - Example: `ASSETS.load` rejects after 8s with `TIMEOUT`.
6. As a platform engineer, I want to avoid leaking storage URLs to client code.
   - Example: only signed URLs or data URLs returned, never raw bucket paths.

## 6. Core Architecture & Patterns
High-level architecture:
- Asset identity layer: stable key/ID mapping stored in manifest/DB.
- Resolver layer: server endpoint resolves key -> signed URL or data URL.
- Loader layer: `ASSETS.load` handles fetch/import, timeout, and typed errors.
- Diagnostics layer: structured logs, IDE registry, and preview overlay.

Directory touch points (reference):
- `src/lib/studio/asset-loader.ts` (ASSETS helper)
- `src/app/api/studio/assets/route.ts` (manifest)
- `src/app/api/studio/assets/resolve/route.ts` (new resolver)
- `src/components/studio/AssetBrowser.tsx` (registry view)

Design patterns:
- Typed errors (`AssetLoadError` with `code`, `stage`, `details`).
- Correlation ID per load attempt propagated to logs and UI.
- No direct URL usage in game files; use `ASSETS` APIs only.
- Normalization policy stored as metadata, not hard-coded in scene code.

## 7. Tools/Features
### `ASSETS` API (Client)
- `ASSETS.load(key: string, scene: BABYLON.Scene, options?: LoadOptions): Promise<BABYLON.TransformNode>`
  - Options: `timeoutMs`, `cachePolicy`, `onProgress`.
- `ASSETS.getInfo(key: string): AssetInfo | null`
  - Returns safe metadata (name, type, bounding hints, version, source).
- `ASSETS.list(): AssetInfo[]`
  - Returns registry entries visible in the IDE and tools.

### Diagnostics
- IDE Asset Registry panel with filter by status/type.
- Preview overlay on failure: non-blocking banner with error code.
- Structured logs in console and server: `ASSET_LOAD_START`, `ASSET_LOAD_RESOLVE`, `ASSET_LOAD_FAIL`.

### Normalization Policy (MVP)
- Optional `normalization` metadata in manifest: targetSize, unitScale, pivot hints.
- `ASSETS.load` applies normalization only when metadata exists.

## 8. Technology Stack
- Frontend: Next.js 16.1, React 19, TypeScript strict.
- 3D runtime: Babylon.js.
- Backend: Next.js API routes with Prisma (SQLite/Neon).
- Storage: Cloudflare R2 or CDN-backed object store.
- Validation: Zod for input/output schemas in API routes.

## 9. Security & Configuration
- Authentication: existing session/auth for studio endpoints.
- Configuration: storage keys, signing TTL, and resolver base URL in env vars.
- Security scope:
  - In scope: signed URL generation, access control to asset metadata.
  - Out of scope: public asset sharing and cross-project access.
- Deployment: ensure CORS policy only allows studio origin and asset proxy route.

## 10. API Specification
### GET /api/studio/assets
Returns asset manifest and registry metadata.

Response (200):
```json
{
  "version": "1.1",
  "assets": {
    "explorer_starship": {
      "id": "uuid",
      "type": "3d",
      "status": "approved",
      "source": "generated",
      "normalization": { "targetSize": 4 }
    }
  }
}
```

### POST /api/studio/assets/resolve
Resolves a key to a signed URL or data URL.

Request:
```json
{ "key": "explorer_starship" }
```

Response (200):
```json
{
  "key": "explorer_starship",
  "url": "https://signed.example/glb?...",
  "expiresAt": "2026-01-18T12:34:56Z",
  "requestId": "req_123"
}
```

Response (404):
```json
{ "error": "ASSET_NOT_FOUND", "requestId": "req_123" }
```

### POST /api/studio/assets/log
Optional logging endpoint for client-side errors.

## 11. Success Criteria
MVP success definition: asset loads are deterministic, debuggable, and secure in the preview environment.

Functional requirements:
- ✅ `ASSETS.load` resolves or rejects within timeout for 95% of loads.
- ✅ Failure logs include asset key, stage, and correlation ID.
- ✅ No user code references raw storage URLs.
- ✅ IDE displays asset registry with status and type.

Quality indicators:
- Mean time to diagnose failed load under 5 minutes.
- No silent failures observed in playtests.
- Error rate visible in logs and dashboard.

User experience goals:
- Clear error banner with remediation hints in preview.
- Registry view is discoverable within 2 clicks.

## 12. Implementation Phases
### Phase 1: Contract + Telemetry (1-2 weeks)
- ✅ Define `AssetLoadError` types and `ASSETS.load` timeout behavior.
- ✅ Add resolver endpoint stub with Zod validation.
- ✅ Add logging with correlation IDs.
Validation: synthetic test assets load/fail with correct error codes.

### Phase 2: Resolver + Registry (1-2 weeks)
- ✅ Implement resolver mapping key -> signed URL/data URL.
- ✅ Extend manifest to include normalization metadata.
- ✅ Add IDE registry panel with status indicators.
Validation: real assets load through resolver; registry reflects DB state.

### Phase 3: Hardening + UX (1 week)
- ✅ Add preview overlay/banner for failures.
- ✅ Add server-side monitoring log aggregation.
- ✅ Add lint rule or guard to prevent raw URL usage in game files.
Validation: manual QA covers slow network, expired URL, missing asset.

## 13. Future Considerations
- Client-side caching via IndexedDB for offline preview.
- Asset version conflict UI and snapshotting.
- Automated normalization in editor with per-asset metadata.
- Export pipeline that bundles assets with code.

## 14. Risks & Mitigations
1. Risk: Signed URLs expire before load completes.
   - Mitigation: resolver returns TTL and loader retries once if expired.
2. Risk: Registry metadata becomes stale.
   - Mitigation: registry fetch on preview load and on asset sync events.
3. Risk: Normalization metadata incorrect for complex hierarchies.
   - Mitigation: allow per-asset overrides and surface warnings in registry.
4. Risk: Increased backend load from resolver calls.
   - Mitigation: short-lived caching and batch resolve endpoint.
5. Risk: Sensitive URL leakage in logs.
   - Mitigation: log redaction and store only host + asset ID.

## 15. Appendix
- Related docs: `src/memory/active_state.md`, `src/memory/PROJECT_ARCHITECTURE.md`.
- Current issue: asset load fails due to signed URL expiration and opaque `ASSETS.load` failures.
- Key existing files: `src/lib/studio/asset-loader.ts`, `src/app/api/studio/assets/route.ts`.
