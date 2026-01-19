# Plan: Asset Loading Reliability + Skybox Pipeline

## Goal
Make asset loading deterministic in preview (CORS-safe, signed URLs, clear errors) and ensure skyboxes auto-appear in AVAILABLE ASSETS.

## Scope
- ASSETS.load contract improvements (timeouts, typed errors, resolver handshake)
- Proxy-based asset fetch to avoid iframe CORS
- Ensure Havok is preloaded in preview and prompt enforces readiness gating
- Skybox support (PhotoDome) + manifest auto-linking

## Steps
1. Add resolver endpoint for asset keys and implement proxy-based loading from preview.
2. Add proxy with CORS headers and signed URL support.
3. Add asset loader error reporting + diagnostics surface in preview.
4. Ensure Havok is preloaded and prompt enforces correct physics init pattern.
5. Add skybox type support in manifest + loader (PhotoDome).
6. Auto-link skybox assets on generation and on game manifest load for legacy projects.

## Validation
- Assets load in preview without CORS errors.
- Proxy returns 200 for GLB fetch; signed URLs generated if needed.
- Havok is defined in preview; physics aggregates only after readiness.
- Skybox appears via ASSETS.load using PhotoDome.
- AVAILABLE ASSETS includes skybox without manual sync.
