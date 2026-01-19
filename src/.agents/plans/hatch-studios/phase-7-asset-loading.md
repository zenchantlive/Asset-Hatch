# Feature: Phase 7 - Asset Loading in Preview

**Phase 7 of Hatch Studios Implementation** - Load linked assets in game preview via `ASSETS` global helper.

---

## Executive Summary

Implement asset loading capability in the Babylon.js preview iframe by passing the project's asset manifest to `PreviewFrame` and exposing an `ASSETS` global helper that AI-generated code can use to load linked assets.

**Key Pattern**: Mirror the existing `generateAssetLoadingCode()` pattern from `sync-tools.ts` but expose it as a runtime API (`ASSETS.load()`) inside the preview iframe.

---

## User Story

As a game developer using Hatch Studios,
I want to use linked assets in my Babylon.js code via `ASSETS.load("name", scene)`,
So that I can build games using AI-generated assets without manually handling URL references.

---

## Problem Statement

Currently in Phase 6, assets can be linked to games via `GameAssetRef` and the asset manifest, but:
1. The preview iframe has no knowledge of available assets
2. AI-generated code cannot load assets - it only builds with primitives
3. No runtime API exists for asset loading in the preview

**Current limitation**: AI prompt says "ASSUME NO EXTERNAL ASSETS ARE AVAILABLE" - Phase 7 removes this limitation for linked assets.

---

## Solution Statement

1. **Pass asset manifest to PreviewFrame** - Add `assetManifest?: AssetManifest` prop
2. **Create ASSETS global helper** - Inject JavaScript into iframe that provides:
   - `ASSETS.load(name, scene)` - Load asset by manifest key, return mesh/texture
   - `ASSETS.getInfo(name)` - Get asset metadata (URLs, animations, etc.)
   - `ASSETS.list()` - Get all available asset names
3. **Update babylon-system-prompt.ts** - Include linked assets in system prompt with usage examples
4. **Update PreviewTab.tsx** - Fetch asset data and pass to PreviewFrame
5. **Update StudioProvider** - Add asset loading and state management

---

## Feature Metadata

| Property | Value |
|----------|-------|
| **Feature Type** | Enhancement |
| **Estimated Complexity** | Medium |
| **Primary Systems Affected** | `PreviewFrame.tsx`, `PreviewTab.tsx`, `babylon-system-prompt.ts`, `StudioProvider.tsx` |
| **Dependencies** | Phase 6 complete (AssetManifest, GameAssetRef exist) |
| **New Dependencies** | None (uses existing patterns) |

---

## Context References

### Files to READ Before Implementing

| File | Lines | Why |
|------|-------|-----|
| `src/components/studio/PreviewFrame.tsx` | 1-230 | Current iframe implementation - will add ASSETS injection |
| `src/lib/types/unified-project.ts` | 23-86 | `AssetManifest`, `AssetManifestEntry` interfaces |
| `src/lib/studio/sync-tools.ts` | 231-276 | `generateAssetLoadingCode()` pattern to mirror |
| `src/components/studio/tabs/PreviewTab.tsx` | 1-89 | Where PreviewFrame is used - need to pass assets |
| `src/lib/studio/babylon-system-prompt.ts` | 101-108 | ASSET STRATEGY section - update with linked assets |
| `src/prisma/schema.prisma` | 338-375 | `GameAssetRef` model for fetching assets |

### Files to CREATE

| File | Purpose |
|------|---------|
| `src/lib/studio/asset-loader.ts` | `ASSETS` global helper implementation (shared between client and iframe) |
| `src/lib/studio/types.ts` (update) | Add `AssetInfo` type for runtime asset representation |

### Files to UPDATE

| File | Changes |
|------|---------|
| `src/components/studio/PreviewFrame.tsx` | Add `assetManifest` prop, inject ASSETS script |
| `src/components/studio/tabs/PreviewTab.tsx` | Fetch asset refs, construct AssetManifest, pass to PreviewFrame |
| `src/lib/studio/babylon-system-prompt.ts` | Add linked assets section to system prompt |
| `src/components/studio/StudioProvider.tsx` | Add asset loading state and methods |

### Patterns to Follow

**Error Handling Pattern** (from `PreviewFrame.tsx:113-134`):
```javascript
// Capture errors and show in overlay
window.addEventListener('error', function(e) {
  const errorEl = document.getElementById('error-overlay');
  errorEl.textContent = 'Error: ' + e.message;
  errorEl.classList.add('show');
});
```

**Asset Loading Pattern** (from `sync-tools.ts:231-276`):
```typescript
function generateAssetLoadingCode(assetRef, sceneName): string {
  switch (assetRef.assetType) {
    case "model":
    case "3d":
      return `BABYLON.SceneLoader.ImportMeshAsync("", "${modelUrl}", scene)...`;
    case "texture":
    case "2d":
      return `new BABYLON.Texture("${modelUrl}", scene);`;
    case "skybox":
      return `BABYLON.CubeTexture.CreateFromPrefixedURL("${modelUrl}/", scene);`;
  }
}
```

**Iframe Script Injection Pattern** (from `PreviewFrame.tsx:87-146`):
```typescript
const iframeContent = `
<!DOCTYPE html>
<html>
<head>...scripts...</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script>
    // Inject ASSETS global before user code
    ${assetScript}
    // Execute user code
    ${concatenatedCode}
  </script>
</body>
</html>
`;
```

---

## Implementation Plan

### Phase 1: Type Definitions & Asset Loader Foundation

**Goal**: Define runtime asset types and create the ASSETS helper that will be injected into the iframe.

#### 1.1 Add AssetInfo Type

**File**: `src/lib/studio/types.ts`

```typescript
/**
 * Runtime asset info - extracted from AssetManifest for iframe use
 */
export interface AssetInfo {
  /** Manifest key (e.g., "knight", "forest_sky") */
  key: string;
  /** Asset type */
  type: "2d" | "3d";
  /** Human-readable name */
  name: string;
  /** Asset URLs */
  urls: {
    thumbnail?: string;
    model?: string;
    glb?: string;
  };
  /** Generation metadata */
  metadata: {
    prompt?: string;
    style?: string;
    animations?: string[];
    poses?: string[];
  };
}

/**
 * Map AssetManifestEntry to AssetInfo for runtime use
 */
export function manifestEntryToAssetInfo(
  key: string,
  entry: import("@/lib/types/unified-project").AssetManifestEntry
): AssetInfo {
  return {
    key,
    type: entry.type,
    name: entry.name,
    urls: entry.urls,
    metadata: entry.metadata,
  };
}
```

#### 1.2 Create ASSETS Global Helper

**File**: `src/lib/studio/asset-loader.ts`

```typescript
/**
 * ASSETS Global Helper for Preview Iframe
 *
 * Provides runtime API for loading linked assets in Babylon.js preview.
 * This file is used in two ways:
 * 1. As TypeScript types for StudioProvider (full imports)
 * 2. As raw JavaScript string injected into iframe (no imports)
 *
 * IMPORTANT: When modifying, ensure the JavaScript version works standalone.
 */

import type { AssetInfo } from "./types";

/**
 * Generate JavaScript code for ASSETS global helper
 * This is injected into the iframe before user code executes
 */
export function generateAssetLoaderScript(assets: AssetInfo[]): string {
  const assetsJson = JSON.stringify(assets, null, 2);
  
  return `
(function() {
  'use strict';
  
  // Asset registry - populated from parent
  const ASSET_REGISTRY = new Map();
  
  // Initialize registry with assets
  ${assetsJson}.forEach(function(asset) {
    ASSET_REGISTRY.set(asset.key, asset);
  });
  
  /**
   * ASSETS global helper for loading linked assets in preview
   */
  window.ASSETS = {
    /**
     * Load an asset by key and return the Babylon.js mesh/texture
     * @param key - Asset manifest key (e.g., "knight", "forest_sky")
     * @param scene - Babylon.js scene to load into
     * @returns Promise<Mesh|Texture|null>
     */
    load: function(key, scene) {
      var asset = ASSET_REGISTRY.get(key);
      if (!asset) {
        console.warn('[ASSETS] Asset not found: ' + key);
        return Promise.resolve(null);
      }
      
      var url = asset.urls.glb || asset.urls.model;
      
      if (!url) {
        console.warn('[ASSETS] No model URL for asset: ' + key);
        return Promise.resolve(null);
      }
      
      // Handle 3D models
      if (asset.type === '3d' || asset.metadata.animations) {
        return BABYLON.SceneLoader.ImportMeshAsync('', url.split('/').slice(0, -1).join('/') + '/', url.split('/').pop(), scene)
          .then(function(result) {
            console.log('[ASSETS] Loaded 3D asset: ' + key);
            // Store metadata on first mesh
            if (result.meshes[0] && asset.metadata.animations) {
              result.meshes[0].metadata = result.meshes[0].metadata || {};
              result.meshes[0].metadata.animations = asset.metadata.animations;
            }
            return result.meshes[0];
          })
          .catch(function(error) {
            console.error('[ASSETS] Failed to load 3D asset: ' + key, error);
            return null;
          });
      }
      
      // Handle 2D textures
      if (asset.type === '2d') {
        var texture = new BABYLON.Texture(url, scene);
        console.log('[ASSETS] Loaded 2D asset: ' + key);
        return Promise.resolve(texture);
      }
      
      console.warn('[ASSETS] Unknown asset type: ' + asset.type);
      return Promise.resolve(null);
    },
    
    /**
     * Get asset metadata by key
     * @param key - Asset manifest key
     * @returns AssetInfo or undefined
     */
    getInfo: function(key) {
      return ASSET_REGISTRY.get(key);
    },
    
    /**
     * List all available asset keys
     * @returns Array of asset keys
     */
    list: function() {
      return Array.from(ASSET_REGISTRY.keys());
    },
    
    /**
     * Get all assets as array
     * @returns Array of AssetInfo
     */
    all: function() {
      return Array.from(ASSET_REGISTRY.values());
    }
  };
  
  console.log('[ASSETS] Initialized with ' + ASSET_REGISTRY.size + ' assets');
})();
  `.trim();
}

/**
 * Validate asset data structure (for debugging)
 */
export function validateAssetInfo(asset: unknown): asset is AssetInfo {
  if (!asset || typeof asset !== 'object') return false;
  const a = asset as Record<string, unknown>;
  return (
    typeof a.key === 'string' &&
    typeof a.name === 'string' &&
    typeof a.type === 'string' &&
    a.type === '2d' || a.type === '3d'
  );
}
```

---

### Phase 2: Update PreviewFrame to Accept and Inject Assets

**Goal**: Modify PreviewFrame to accept asset manifest and inject ASSETS script.

#### 2.1 Update PreviewFrame Props Interface

**File**: `src/components/studio/PreviewFrame.tsx` (lines 27-40)

```typescript
interface PreviewFrameProps {
    /** Array of game files to execute in order (sorted by orderIndex) */
    files: GameFileData[];
    /** Optional asset manifest for ASSETS global helper */
    assetManifest?: import('@/lib/types/unified-project').AssetManifest;
    /** Whether the scene should be playing */
    isPlaying: boolean;
    // ... existing props
}
```

#### 2.2 Update Asset Loader Script Generation

**File**: `src/components/studio/PreviewFrame.tsx` (after line 83, before `// Build the HTML document`)

Add after the scriptTags const:

```typescript
import { generateAssetLoaderScript, manifestEntryToAssetInfo } from '@/lib/studio/asset-loader';
import type { AssetManifest, AssetManifestEntry } from '@/lib/types/unified-project';

// ... existing code

/**
 * Convert AssetManifest to AssetInfo array for iframe
 */
function convertManifestToAssetInfo(manifest: AssetManifest): AssetInfo[] {
  return Object.entries(manifest.assets).map(([key, entry]) =>
    manifestEntryToAssetInfo(key, entry)
  );
}

// Inside component, after scriptTags:
const assetScript = props.assetManifest
  ? generateAssetLoaderScript(convertManifestToAssetInfo(props.assetManifest))
  : '// No assets available';
```

#### 2.3 Inject ASSETS Script Before User Code

**File**: `src/components/studio/PreviewFrame.tsx` (line 128 area)

Modify the script section:

```typescript
    // Execute user code (concatenated from multiple files)
    try {
      // ASSETS global injected before user code
      ${assetScript}
      
      // User code executes after ASSETS is available
      ${concatenatedCode}
    } catch (error) {
```

---

### Phase 3: Update PreviewTab to Fetch and Pass Assets

**Goal**: Fetch linked GameAssetRefs, build AssetManifest, pass to PreviewFrame.

#### 3.1 Create API Endpoint for Asset Manifest

**File**: `src/app/api/studio/games/[id]/assets/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AssetManifest } from '@/lib/types/unified-project';

/**
 * GET /api/studio/games/[id]/assets
 * Returns asset manifest for linked assets
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id: gameId } = await params;

  // Fetch game with asset references
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      assetRefs: true,
    },
  });

  if (!game) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Build asset manifest from GameAssetRefs
  const assets: AssetManifest['assets'] = {};
  
  for (const ref of game.assetRefs) {
    const key = ref.manifestKey || ref.assetId;
    assets[key] = {
      id: ref.assetId,
      type: ref.assetType as '2d' | '3d',
      name: ref.assetName,
      version: ref.lockedVersionId ? 1 : 0,
      urls: {
        thumbnail: ref.thumbnailUrl || undefined,
        model: ref.modelUrl || undefined,
        glb: ref.glbUrl || undefined,
      },
      metadata: {
        // Note: In a full implementation, you'd fetch from GeneratedAsset table
        // For now, these are placeholders
        prompt: undefined,
        style: undefined,
        animations: [],
        poses: [],
      },
      linkedAt: ref.createdAt.toISOString(),
      lockedVersion: ref.lockedVersionId ? 1 : undefined,
    };
  }

  const manifest: AssetManifest = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    assets,
    syncState: {
      status: 'clean',
      pendingAssets: [],
      lastSync: null,
    },
  };

  return NextResponse.json(manifest);
}
```

#### 3.2 Update PreviewTab to Fetch and Pass Asset Manifest

**File**: `src/components/studio/tabs/PreviewTab.tsx`

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStudio } from '@/lib/studio/context';
import { PreviewFrame } from '../PreviewFrame';
import type { AssetManifest } from '@/lib/types/unified-project';

export function PreviewTab() {
    const { files, isPlaying, previewKey, requestErrorFix, game } = useStudio();
    const [fps, setFps] = useState<number>(0);
    const [hasError, setHasError] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [assetManifest, setAssetManifest] = useState<AssetManifest | null>(null);

    // Fetch asset manifest on mount
    useEffect(() => {
        if (!game?.id) return;
        
        async function fetchAssets() {
            try {
                const response = await fetch(`/api/studio/games/${game.id}/assets`);
                if (response.ok) {
                    const manifest = await response.json();
                    setAssetManifest(manifest);
                }
            } catch (error) {
                console.warn('[PreviewTab] Failed to fetch asset manifest:', error);
            }
        }
        
        fetchAssets();
    }, [game?.id]);

    // ... existing handlers

    return (
        <div className="h-full flex flex-col preview-container relative">
            {/* Controls bar */}
            <div className="h-12 border-b border-studio-panel-border px-4 flex items-center justify-between bg-studio-panel-bg">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {files.length} file{files.length !== 1 ? 's' : ''}
                    </span>
                    {/* Asset count indicator */}
                    {assetManifest && Object.keys(assetManifest.assets).length > 0 && (
                        <span className="text-xs text-purple-400">
                            {Object.keys(assetManifest.assets).length} asset{Object.keys(assetManifest.assets).length !== 1 ? 's' : ''}
                        </span>
                    )}
                    {/* FPS Badge */}
                    {isReady && !hasError && (
                        <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs font-mono text-green-400">
                            {fps || '60'} FPS
                        </div>
                    )}
                </div>
                {/* ... existing status indicators */}
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-studio-preview-bg relative">
                <PreviewFrame
                    files={files}
                    assetManifest={assetManifest || undefined}
                    isPlaying={isPlaying}
                    previewKey={previewKey}
                    onReady={handleReady}
                    onError={handleError}
                    onRequestFix={handleRequestFix}
                />
            </div>
        </div>
    );
}
```

---

### Phase 4: Update Babylon System Prompt

**Goal**: Include linked assets in system prompt so AI knows what assets are available.

**File**: `src/lib/studio/babylon-system-prompt.ts` (lines 101-108 area)

Replace the ASSET STRATEGY section:

```typescript
ASSET STRATEGY (IMPORTANT):
- Linked assets from the project are AVAILABLE via the ASSETS global
- Use ASSETS.load("assetKey", scene) to load 3D models and textures
- Linked assets have been curated by the user and are ready to use
- ASSETS.list() returns all available asset keys
- ASSETS.getInfo("key") returns metadata (animations, poses, etc.)

AVAILABLE ASSETS:
${currentAssets ? currentAssets.map((a) => `- ${a.key}: ${a.type}, "${a.name}"`).join('\n') || '- No assets linked yet' : '- No assets linked yet'}

EXAMPLE USAGE:
\`\`\`javascript
// Load 3D character
const knight = await ASSETS.load("knight", scene);
knight.position = new BABYLON.Vector3(0, 0, 0);

// Get asset info
const info = ASSETS.getInfo("knight");
console.log("Available animations:", info.metadata.animations);

// List all assets
console.log("Available assets:", ASSETS.list());
\`\`\`

If the user has linked assets, use ASSETS.load() instead of building with primitives.
If no assets are linked, fall back to building with Babylon.js primitives.
```

Add `currentAssets` parameter to the function signature:

```typescript
export function getBabylonSystemPrompt(
  gameId: string,
  currentContext?: string,
  currentAssets?: Array<{ key: string; type: string; name: string; metadata: Record<string, unknown> }>
): string {
```

---

### Phase 5: Update Chat Route to Pass Assets

**File**: `src/app/api/studio/chat/route.ts`

Update the chat route to fetch and pass assets to the system prompt:

```typescript
// Fetch linked assets for system prompt
let linkedAssets: Array<{ key: string; type: string; name: string; metadata: Record<string, unknown> }> = [];

if (game.projectId) {
  // Fetch asset refs for this game
  const assetRefs = await prisma.gameAssetRef.findMany({
    where: { gameId: game.id },
    select: {
      manifestKey: true,
      assetType: true,
      assetName: true,
    },
  });
  
  linkedAssets = assetRefs.map(ref => ({
    key: ref.manifestKey || ref.assetName.toLowerCase().replace(/\s+/g, '_'),
    type: ref.assetType,
    name: ref.assetName,
    metadata: {},
  }));
}

// Generate system prompt with assets
const systemPrompt = getBabylonSystemPrompt(
  game.id,
  currentContext,
  linkedAssets
);
```

---

## Step-by-Step Tasks

### Task 1: CREATE asset-loader.ts

- **File**: `src/lib/studio/asset-loader.ts`
- **Implement**: `generateAssetLoaderScript()` and `manifestEntryToAssetInfo()` functions
- **Pattern**: Mirror `sync-tools.ts:231-276` but generate runtime JS instead of string template
- **Validate**: Run `bun run typecheck` after creation

### Task 2: UPDATE types.ts

- **File**: `src/lib/studio/types.ts`
- **Add**: `AssetInfo` interface and `manifestEntryToAssetInfo` function
- **Validate**: `bun run typecheck`

### Task 3: UPDATE PreviewFrame.tsx

- **File**: `src/components/studio/PreviewFrame.tsx`
- **Add**: `assetManifest` prop
- **Add**: Import `generateAssetLoaderScript` and `manifestEntryToAssetInfo`
- **Modify**: Inject ASSETS script before user code
- **Validate**: `bun run lint && bun run typecheck`

### Task 4: CREATE assets API route

- **File**: `src/app/api/studio/games/[id]/assets/route.ts`
- **Implement**: GET endpoint returning AssetManifest from GameAssetRefs
- **Validate**: `bun run typecheck`

### Task 5: UPDATE PreviewTab.tsx

- **File**: `src/components/studio/tabs/PreviewTab.tsx`
- **Add**: Fetch asset manifest on mount
- **Pass**: Asset manifest to PreviewFrame
- **Display**: Asset count indicator
- **Validate**: `bun run lint && bun run typecheck`

### Task 6: UPDATE babylon-system-prompt.ts

- **File**: `src/lib/studio/babylon-system-prompt.ts`
- **Modify**: Add `currentAssets` parameter
- **Update**: ASSET STRATEGY section with ASSETS usage examples
- **Validate**: `bun run typecheck`

### Task 7: UPDATE chat route

- **File**: `src/app/api/studio/chat/route.ts`
- **Add**: Fetch GameAssetRefs for the game
- **Pass**: Linked assets to `getBabylonSystemPrompt`
- **Validate**: `bun run typecheck`

### Task 8: VERIFY end-to-end

- Run `bun dev`
- Create a project with assets
- Create a game linked to the project
- Verify assets appear in preview (check console for `[ASSETS] Initialized`)
- Test `ASSETS.load()` in the browser console

---

## Testing Strategy

### Unit Tests

**Test `asset-loader.ts`**:
```typescript
describe('asset-loader', () => {
  it('should generate valid JavaScript for ASSETS global', () => {
    const script = generateAssetLoaderScript([
      { key: 'knight', type: '3d', name: 'Knight', urls: { glb: 'https://example.com/knight.glb' }, metadata: { animations: ['idle', 'walk'] } },
    ]);
    expect(script).toContain('window.ASSETS');
    expect(script).toContain('load: function');
    expect(script).toContain('knight');
  });

  it('should handle empty asset list', () => {
    const script = generateAssetLoaderScript([]);
    expect(script).toContain('window.ASSETS');
    expect(script).toContain('ASSET_REGISTRY.size');
  });
});
```

### Integration Tests

**Test PreviewFrame with assets**:
- Mock API response with sample asset manifest
- Verify ASSETS is available in iframe after load
- Test `ASSETS.list()` returns correct keys

**Test system prompt with assets**:
- Call `getBabylonSystemPrompt` with sample assets
- Verify output contains asset list
- Verify examples are present

### Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| No assets linked | ASSETS global exists but is empty |
| Asset with missing GLB URL | `ASSETS.load()` logs warning, returns null |
| Asset with unknown type | Logs warning, returns null |
| Loading non-existent asset | Returns null, logs warning |

---

## Validation Commands

### Level 1: Syntax & Style
```bash
cd src
bun run lint
bun run typecheck
```

### Level 2: Unit Tests
```bash
cd src
bun run test -- --testPathPattern="asset-loader"
```

### Level 3: Build Verification
```bash
cd src
bun run build
```

### Level 4: Manual Testing Steps
1. Start dev server: `cd src && bun dev`
2. Open http://localhost:3000
3. Create a project and generate an asset
4. Create a game (link to project)
5. Open browser DevTools Console
6. Type `ASSETS.list()` - should show asset key
7. Type `ASSETS.getInfo('your-asset')` - should show asset metadata

### Level 5: API Test
```bash
# Test asset endpoint
curl http://localhost:3000/api/studio/games/{gameId}/assets
# Should return JSON with asset manifest
```

---

## Acceptance Criteria

- [ ] `ASSETS.load(key, scene)` works for 3D models (returns mesh)
- [ ] `ASSETS.load(key, scene)` works for 2D textures (returns texture)
- [ ] `ASSETS.getInfo(key)` returns asset metadata
- [ ] `ASSETS.list()` returns array of asset keys
- [ ] Babylon system prompt includes linked assets
- [ ] AI can generate code using `ASSETS.load()` without errors
- [ ] No regressions in existing preview functionality
- [ ] All validation commands pass
- [ ] TypeScript strict mode passes

---

## Completion Checklist

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met

---

## Notes

### Design Decisions

1. **ASSETS global vs Module Pattern**: Using global `window.ASSETS` because:
   - Simpler for AI to understand and use
   - No module imports needed in user code
   - Consistent with Babylon.js globals (BABYLON)

2. **Async load()**: Returns Promise because `ImportMeshAsync` is async
   - AI can use `await ASSETS.load(...)` pattern

3. **Null on failure**: `ASSETS.load()` returns `null` on error rather than throwing
   - Prevents preview crash on asset load failure
   - Allows graceful fallback in AI-generated code

### Future Enhancements (Phase 8)

- Version conflict detection and UI
- Auto-sync asset updates to game
- Asset placement presets (position/rotation/scale)

### Known Limitations

- Assets must be pre-linked via Project → Game flow
- No runtime asset upload in preview (future Phase 9)
- GLB URLs must be CORS-enabled for Babylon.js loader

---

## Confidence Score: 9/10

All patterns exist in codebase:
- `generateAssetLoadingCode()` provides template
- `PreviewFrame` already injects scripts
- API route pattern established for game files

Low risk - mostly wiring existing patterns together.
