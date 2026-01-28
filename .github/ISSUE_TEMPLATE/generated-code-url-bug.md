---
name: Bug Report - Generated Code URL Handling
about: AI-generated asset loading code may have URL issues
title: "[BUG] Generated code in sync-tools.ts may not handle proxy URLs correctly"
labels: bug, ai-generated-code, assets
---

## Description

When the AI generates asset loading code via the `syncAsset` tool, the generated code may not correctly handle proxy URLs for asset loading.

## Affected File

`src/lib/studio/sync-tools.ts` - `generateAssetLoadingCode()` function

## The Issue

The function generates code like:
```javascript
BABYLON.SceneLoader.ImportMeshAsync("", "${modelUrl}", scene)
```

If `modelUrl` is a proxy URL with query parameters (e.g., `/api/studio/assets/proxy?gameId=...&token=...`), this may work in some cases but could fail if the URL contains special characters or if Babylon.js handles the URL differently.

## Suggested Fix

1. For proxy URLs, ensure the URL is properly encoded
2. Consider using data URL format when the URL contains query parameters
3. Add logging to verify what URL is being used in generated code

## Related Issue

This is related to but distinct from the `parseUrlParts()` bug in `asset-loader.ts`. Both issues stem from how proxy URLs with query parameters are handled.
