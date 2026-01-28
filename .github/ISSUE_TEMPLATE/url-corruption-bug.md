---
name: Bug Report - Asset URL Corruption
about: Assets from R2/S3 not displaying in game preview iframe
title: "[BUG] Asset URLs with query parameters are corrupted in iframe preview"
labels: bug, critical, iframe, assets
---

## Description

Assets from R2/S3 are not displaying in the Hatch Studios game preview iframe. The agent reports resolving URLs successfully, but the GLB files don't load.

## Root Cause

The `parseUrlParts()` function in `src/lib/studio/asset-loader.ts` doesn't handle proxy URLs with query parameters correctly.

### The Bug

When the resolve API returns a proxy URL like:
```
http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz
```

The `parseUrlParts()` function splits it at the last `/`:
- `root = "http://localhost:3000/api/studio/assets/"`
- `file = "proxy?gameId=abc&key=knight&token=xyz"`

Then `SceneLoader.ImportMeshAsync("", root, file, scene, null, ".glb")` constructs:
```
http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz.glb
```

**The `.glb` extension is appended AFTER the query parameters**, corrupting the URL.

### Expected vs Actual

- **Expected**: `http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz`
- **Actual**: `http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz.glb`

## Affected Files

1. `src/lib/studio/asset-loader.ts` - `parseUrlParts()` function and `resolveAssetUrl()` usage
2. `src/lib/studio/sync-tools.ts` - `generateAssetLoadingCode()` may have similar issue

## Reproduction Steps

1. Create a project with 3D assets
2. Approve assets (uploads to R2)
3. Create a game and link assets
4. Open Hatch Studios → Preview tab
5. Write code using `ASSETS.load("knight", scene)`
6. Observe assets don't appear in preview

## Suggested Fix

For URLs containing query parameters, use the data URL format:
```javascript
BABYLON.SceneLoader.ImportMeshAsync("", "", proxyUrl, scene, null, ".glb")
```

This passes the full URL as the filename with empty root, which Babylon.js handles correctly.

Alternative: Strip query parameters before parsing, then re-append them after.
