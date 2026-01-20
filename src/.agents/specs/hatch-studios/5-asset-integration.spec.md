# Asset Integration Specification

**Status:** Draft  
**Dependencies:** 1-hatch-studios-architecture.spec.md, 4-game-tools.spec.md  
**Implements PRD Section:** 8

---

## 1. Purpose

Defines how Hatch Studios discovers, queries, and uses assets from Asset Hatch. Covers asset manifest format, cross-project references, and real-time sync when new assets are created.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: Query all user's Asset Hatch assets
- FR-002: Filter by project, type (2d/3d), category
- FR-003: Display asset thumbnails and metadata
- FR-004: Load 3D assets into Babylon.js scene
- FR-005: Detect when new assets are created during session
- FR-006: Cache asset metadata to reduce API calls

### 2.2 Non-Functional Requirements

- NFR-001: Asset list query < 500ms
- NFR-002: GLB load < 3s for typical model
- NFR-003: Thumbnail lazy loading

---

## 3. Technical Design

### 3.1 Asset Manifest Format

When AI or UI queries assets, return this format:

```typescript
interface AssetManifest {
  assets: AssetEntry[];
  totalCount: number;
  hasMore: boolean;
}

interface AssetEntry {
  // Identity
  id: string;
  projectId: string;
  projectName: string;
  
  // Display
  name: string;
  description: string;
  thumbnailUrl: string;
  
  // Type
  type: '2d' | '3d';
  category: string;      // 'character', 'prop', 'environment', etc.
  
  // 3D-specific
  glbUrl?: string;
  riggedModelUrl?: string;
  animations?: {
    name: string;        // 'idle', 'walk', etc.
    url: string;
  }[];
  isRigged?: boolean;
  
  // 2D-specific
  imageUrl?: string;
  dimensions?: { width: number; height: number };
  
  // Game hint
  suggestedRole?: string;  // 'player', 'enemy', 'decoration'
}
```

### 3.2 Cross-Project Reference

Games can reference assets from any of user's Asset Hatch projects:

```
Game (Hatch Studios)
  └── assetRefs[]
        ├── { assetId: "abc", projectId: "project-1" }  // Knight from RPG project
        └── { assetId: "xyz", projectId: "project-2" }  // Tree from Nature project
```

Asset resolution:
1. Check if asset reference exists in game
2. If not, add GameAssetRef record
3. Cache metadata (name, thumbnailUrl, glbUrl)
4. Use cached data for display

### 3.3 Asset Loading in Babylon.js

Generated code pattern for loading assets:

```typescript
// Template for asset loading (injected by AI)
async function loadAsset(
  scene: BABYLON.Scene,
  assetUrl: string,
  instanceName: string
): Promise<BABYLON.AbstractMesh> {
  const result = await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    assetUrl,
    "",
    scene
  );
  
  const root = result.meshes[0];
  root.name = instanceName;
  
  // Store animations for later use
  if (result.animationGroups.length > 0) {
    root.metadata = { animations: {} };
    result.animationGroups.forEach(group => {
      root.metadata.animations[group.name] = group;
    });
  }
  
  return root;
}
```

### 3.4 Real-Time Sync

When user creates new asset in Asset Hatch during game session:

**Option A: Polling (MVP)**
- Studio polls `/api/studio/assets` every 30s
- Compare with cached list
- Show "New assets available" notification

**Option B: Server-Sent Events (Future)**
- Asset Hatch sends event on asset creation
- Studio receives real-time notification

### 3.5 Normalization at Load Time

Extract metadata from GLB file in Babylon.js:

```typescript
// After loading asset
function extractAssetMetadata(mesh: BABYLON.AbstractMesh) {
  const boundingInfo = mesh.getBoundingInfo();
  return {
    boundingBox: {
      min: boundingInfo.boundingBox.minimumWorld,
      max: boundingInfo.boundingBox.maximumWorld,
    },
    dimensions: {
      width: boundingInfo.boundingBox.extendSize.x * 2,
      height: boundingInfo.boundingBox.extendSize.y * 2,
      depth: boundingInfo.boundingBox.extendSize.z * 2,
    },
    origin: mesh.position.clone(),
  };
}
```

---

## 4. Interface Contract

### 4.1 Asset Query API

```typescript
// GET /api/studio/assets

interface AssetQueryParams {
  type?: '2d' | '3d' | 'all';
  projectId?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Returns AssetManifest
```

### 4.2 Asset Browser Component Props

```typescript
interface AssetBrowserProps {
  onSelectAsset: (asset: AssetEntry) => void;
  selectedAssetId?: string;
  filter?: {
    type?: '2d' | '3d';
    projectId?: string;
  };
}
```

---

## 5. Implementation Notes

1. **Reuse Asset Hatch queries** - Don't duplicate DB logic
2. **Proxy through Studio API** - All asset queries go through `/api/studio/assets`
3. **CORS proxy for GLB** - Use existing `/api/proxy-model` pattern
4. **Lazy load thumbnails** - Only load visible thumbnails
5. **Cache aggressively** - Assets rarely change mid-session

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] Asset query returns correct user assets
- [ ] Cross-project asset reference linking
- [ ] Asset cache invalidation

### 6.2 Manual Verification

- [ ] Asset browser displays all user assets
- [ ] 3D asset loads in Babylon.js preview
- [ ] Animations play correctly
- [ ] New assets appear after polling

### 6.3 Integration Check

- [ ] placeAsset tool uses asset integration correctly
- [ ] Asset browser works in Studio UI

---

## 7. Open Questions

None - ready for review.
