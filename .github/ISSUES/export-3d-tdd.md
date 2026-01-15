# Export Fix - GitHub Issue Draft

Create this issue on GitHub: https://github.com/zenchantlive/Asset-Hatch/issues/new

---

## Title:
fix(export): Add 3D asset support to export (TDD)

## Body:

### Problem

Approved 3D assets (skyboxes, 3D models) are NOT being added to the export package. Only 2D assets currently work.

### Asset Types That Need Export Support

| Asset Type | Storage Location | Current Export Status |
|------------|------------------|----------------------|
| 2D Assets | Dexie (IndexedDB) | ✅ Works |
| Skyboxes | Prisma (Postgres) + Image URL | ❌ Not exported |
| 3D Models (GLB) | Prisma (URLs) | ❌ Not exported |
| Rigged Models | Prisma (URLs) | ❌ Not exported |
| Animated Models | Prisma (URLs) | ❌ Not exported |

### Implementation Approach: TDD

**Phase 1: Write Failing Tests**
```typescript
describe('Export All Asset Types', () => {
  it('should include approved 2D assets in ZIP');
  it('should include approved skybox images in ZIP');
  it('should include approved 3D model GLBs in ZIP');
  it('should include rigged model GLBs if available');
  it('should include animated model GLBs by preset name');
  it('should generate correct metadata.json with all asset types');
  it('should handle mixed 2D and 3D projects');
});
```

**Phase 2: Make Tests Pass**
1. Update `/api/export/route.ts` to fetch 3D assets from Prisma
2. Add URL download logic for external assets
3. Update `ExportPanel.tsx` to handle 3D mode

### Expected ZIP Structure (3D Mode)

```
export-[projectId].zip
├── metadata.json
├── skybox/
│   └── [projectId]-skybox.jpg
├── models/
│   ├── [assetId]/
│   │   ├── draft.glb
│   │   ├── rigged.glb (if available)
│   │   └── animations/
│   │       ├── walk.glb
│   │       └── idle.glb
```

### Acceptance Criteria

- [ ] All test cases pass
- [ ] Skybox exports as JPEG in `skybox/` folder
- [ ] 3D models export as GLB with proper naming
- [ ] Animated models organized by preset name
- [ ] metadata.json includes 3D asset metadata

### Labels
bug, enhancement, tdd
