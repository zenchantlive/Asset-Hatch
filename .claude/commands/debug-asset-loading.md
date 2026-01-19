---
description: Diagnose asset loading failures in Hatch Studios preview
argument-hint: [game-id]
---

# Debug Asset Loading

## Goal
Quickly identify whether asset load failures are caused by manifest data, resolver/proxy auth, R2 signing, or Babylon loader behavior.

## Inputs
- Optional `game-id` argument. If omitted, use the current game id from context.

## Steps

### 1) Check manifest availability
```bash
curl -s "http://localhost:3000/api/studio/games/$GAME_ID/assets" | head -n 40
```
- Confirm the expected asset key exists.
- For skyboxes, confirm `type: "skybox"` or `metadata.skybox`.

### 2) Resolve an asset URL
```bash
curl -s -X POST "http://localhost:3000/api/studio/assets/resolve" \
  -H "Content-Type: application/json" \
  -d '{"gameId":"'$GAME_ID'","key":"<asset_key>"}'
```
- Expect `{ url, source, requestId }`.

### 3) Proxy fetch diagnostics
```bash
curl -I "http://localhost:3000/api/studio/assets/proxy?gameId=$GAME_ID&key=<asset_key>&token=<token>"
```
- Check response headers:
  - `X-Asset-Proxy-Status`
  - `X-Asset-Proxy-Upstream`
  - `X-Asset-Proxy-Path`

### 4) Browser console markers
- Look for:
  - `[ASSETS] Loaded 3D asset: <key>`
  - `[ASSETS] LOAD_FAILED (load)`
  - `Unable to find a plugin to load` (extension issue)

### 5) Known root causes
- `401` proxy: missing/invalid token or session not available in iframe.
- `400` upstream R2: unsigned or malformed URL; check signing and path.
- CORS errors: proxy missing `Access-Control-Allow-Origin`.
- Plugin errors: missing `.glb` plugin extension in ImportMeshAsync.

## Expected Outcome
A specific failure stage + actionable fix (auth, signing, manifest, loader).
