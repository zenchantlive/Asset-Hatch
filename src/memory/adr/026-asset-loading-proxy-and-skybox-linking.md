# ADR-026: Asset Loading Proxy + Skybox Auto-Linking

**Status:** Accepted
**Date:** 2026-01-19
**Deciders:** User + Assistant

## Context
Preview asset loading failed due to iframe `srcdoc` origin (`null`) blocking cookies, unsigned R2 URLs returning 400, and skybox assets not appearing in the game manifest. The system prompt claimed skyboxes were available, but `ASSETS.load` and manifest types did not support them.

## Decision
1. Add a resolver + proxy pipeline for asset loading, with token-based access for iframe requests.
2. Default R2 signed URL TTL to 900s when env is unset.
3. Add explicit skybox support in manifest + loader (PhotoDome), and auto-link skyboxes on generation and on manifest load for legacy projects.

## Consequences
### Positive
- Assets load reliably in preview without CORS/auth issues.
- Skyboxes appear in AVAILABLE ASSETS and render via PhotoDome.
- Diagnostics show upstream host/path and request IDs for failures.

### Negative
- Added proxy token flow and extra endpoints to maintain.
- Slightly more logic in manifest load path to auto-link skyboxes.

### Mitigations
- Keep token TTL short and scoped to gameId + key.
- Maintain debugging headers for proxy failures.
