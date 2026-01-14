# Feature: 3D Mode Phase 5+ - Remaining UI & Asset Management

The following plan should be complete, but it's important to validate documentation and codebase patterns and task sanity before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Complete the remaining 3D asset generation workflow features: rigging/animation UI with polling, approval/reject workflow, batch export, and asset management (regenerate, variations, history). These build on the existing Phase 3-4 foundation.

## User Story

As a **3D game developer**  
I want to **rig, animate, approve, and batch export my generated 3D assets**  
So that **I can efficiently produce animation-ready GLB files for my game**

## Problem Statement

The 3D generation flow is incomplete:
- Rigging UI exists but doesn't poll for completion
- Animation UI is stubbed but non-functional
- No approval/reject workflow (can't save/reject generated assets)
- No batch export (only individual GLB downloads)
- No asset management (can't regenerate or create variations)

## Solution Statement

Build on existing infrastructure to complete the generation workflow:
1. Add polling loops for rigging and animation tasks (mirrors draft generation pattern)
2. Create approval UI mirroring 2D `AssetApprovalCard`
3. Build batch export with ZIP + manifest.json
4. Add regeneration and variation generation capabilities

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: Medium-High  
**Primary Systems Affected**: GenerationQueue3D, API routes, Prisma schema, Export Panel  
**Dependencies**: JSZip (already installed), Tripo3D API

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING

- [GenerationQueue3D.tsx](file:///c:/Users/Zenchant/Asset-Hatch/src/components/3d/generation/GenerationQueue3D.tsx) (lines 226-293) - `pollTaskStatus` pattern to mirror for rigging/animation
- [GenerationQueue3D.tsx](file:///c:/Users/Zenchant/Asset-Hatch/src/components/3d/generation/GenerationQueue3D.tsx) (lines 369-410) - `handleRig` stub to complete
- [AssetApprovalCard.tsx](file:///c:/Users/Zenchant/Asset-Hatch/src/components/generation/AssetApprovalCard.tsx) (lines 1-132) - 2D approval pattern to mirror
- [ExportPanel.tsx](file:///c:/Users/Zenchant/Asset-Hatch/src/components/export/ExportPanel.tsx) (lines 1-231) - 2D batch export pattern
- [export/route.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/app/api/export/route.ts) (lines 1-230) - ZIP generation with JSZip
- [rig/route.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/app/api/generate-3d/rig/route.ts) (lines 1-175) - Existing rigging API
- [animate/route.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/app/api/generate-3d/animate/route.ts) (lines 1-205) - Existing animation API
- [3d-generation.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/types/3d-generation.ts) (lines 1-300) - All 3D type definitions
- [schema.prisma](file:///c:/Users/Zenchant/Asset-Hatch/src/prisma/schema.prisma) (lines 183-211) - Generated3DAsset model

### New Files to Create

- `src/components/3d/generation/Asset3DApprovalCard.tsx` - 3D approval UI component
- `src/components/3d/export/ExportPanel3D.tsx` - 3D batch export panel
- `src/app/api/export-3d/route.ts` - 3D batch export API endpoint

### Relevant Documentation

- [Tripo3D Task Types](https://platform.tripo3d.ai/docs) - `animate_rig`, `animate_retarget` task outputs
- [@react-three/drei](https://github.com/pmndrs/drei) - GLB loaders and orbit controls

### Patterns to Follow

**Polling Pattern** (from GenerationQueue3D.tsx lines 227-293):
```typescript
const pollTaskStatus = useCallback(
  async (assetId: string, taskId: string) => {
    const pollInterval = setInterval(async () => {
      const response = await fetch(`/api/generate-3d/${taskId}/status`);
      const data = await response.json();
      if (data.status === "success" && modelUrl) {
        clearInterval(pollInterval);
        // Update state with URL
      } else if (data.status === "failed") {
        clearInterval(pollInterval);
        // Update state with error
      }
    }, 2000);
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000); // 5min timeout
  },
  []
);
```

**Approval Card Pattern** (from AssetApprovalCard.tsx):
```tsx
interface AssetApprovalCardProps {
  asset: ParsedAsset
  result: GeneratedAssetResult
  onApprove: () => void
  onReject: () => void
  onRegenerate: () => void
}
```

**Asset State Pattern** (from GenerationQueue3D.tsx):
```typescript
interface Asset3DState {
  status: Asset3DStatus;
  progress: number;
  draftTaskId?: string;
  rigTaskId?: string;
  animationTaskIds?: Record<string, string>;
  draftModelUrl?: string;
  riggedModelUrl?: string;
  animatedModelUrls?: Record<string, string>;
  error?: string;
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Rigging UI Completion

Complete the rigging flow that's currently stubbed.

**Tasks:**
- Add `pollRigTask` function (mirrors `pollTaskStatus`)
- Update `handleRig` to call `pollRigTask` after API submission
- Extract rigged model URL from Tripo response
- Update download dropdown to include rigged model

### Phase 2: Animation UI

Add animation preset selection and multi-task polling.

**Tasks:**
- Create `handleAnimate` function accepting preset array
- Create `pollAnimationTask` for each animation
- Build multi-select animation preset UI
- Track animated model URLs per preset

### Phase 3: Approval Workflow

Add approve/reject/regenerate functionality for 3D assets.

**Tasks:**
- Create `Asset3DApprovalCard.tsx` component
- Add `approvalStatus` to asset state  
- Implement approval handlers
- Persist approved status to Prisma

### Phase 4: Batch Export

Enable ZIP download of all approved 3D assets.

**Tasks:**
- Create `ExportPanel3D.tsx` component
- Create `/api/export-3d` endpoint
- Download GLBs via CORS proxy
- Generate manifest-3d.json
- Bundle with JSZip

---

## STEP-BY-STEP TASKS

### UPDATE `GenerationQueue3D.tsx` - Add Rig Polling

- **IMPLEMENT**: Add `pollRigTask` function after `pollTaskStatus` (line ~293)
  ```typescript
  // Poll rigging task until complete
  const pollRigTask = useCallback(
    async (assetId: string, taskId: string) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/generate-3d/${taskId}/status`);
          if (!response.ok) throw new Error(`Status check failed`);
          const data = await response.json();
          
          // Extract rigged model URL from Tripo response
          const riggedUrl = 
            data.output?.model?.url ||
            data.output?.pbr_model ||
            null;
          
          if (data.status === "success" && riggedUrl) {
            clearInterval(pollInterval);
            setAssetStates((prev) => {
              const next = new Map(prev);
              const current = prev.get(assetId);
              next.set(assetId, {
                ...current,
                status: "rigged",
                progress: 100,
                rigTaskId: taskId,
                riggedModelUrl: riggedUrl,
              } as Asset3DState);
              return next;
            });
          } else if (data.status === "failed") {
            clearInterval(pollInterval);
            setAssetStates((prev) => {
              const next = new Map(prev);
              next.set(assetId, {
                ...prev.get(assetId),
                status: "failed",
                error: data.error || "Rigging failed",
              } as Asset3DState);
              return next;
            });
          } else {
            // Still running - update progress
            setAssetStates((prev) => {
              const next = new Map(prev);
              const current = prev.get(assetId);
              next.set(assetId, {
                ...current,
                status: "rigging",
                progress: data.progress || 0,
                rigTaskId: taskId,
              } as Asset3DState);
              return next;
            });
          }
        } catch (err) {
          console.error("Rig polling error:", err);
        }
      }, 2000);
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    },
    []
  );
  ```
- **PATTERN**: Mirror `pollTaskStatus` at line 227
- **IMPORTS**: No new imports needed
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Complete handleRig

- **IMPLEMENT**: Update `handleRig` function (line ~370) to start polling
  ```typescript
  // After line 397: console.log("Rig task submitted:", data.taskId);
  // Add:
  pollRigTask(selectedAssetId, data.taskId);
  ```
- **PATTERN**: Same as `handleGenerate` calling `pollTaskStatus`
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Add Animation Handler

- **IMPLEMENT**: Add `handleAnimate` function after `handleRig`
  ```typescript
  // Handle applying selected animations to rigged model
  const handleAnimate = useCallback(async () => {
    if (!selectedAssetId || !selectedAssetState?.riggedModelUrl) return;
    if (selectedAnimations.size === 0) return;

    setAssetStates((prev) => {
      const next = new Map(prev);
      const current = prev.get(selectedAssetId);
      next.set(selectedAssetId, { ...current, status: "animating", progress: 0 } as Asset3DState);
      return next;
    });

    // Submit animation tasks for each selected preset
    for (const preset of selectedAnimations) {
      try {
        const response = await fetch("/api/generate-3d/animate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            assetId: selectedAssetId,
            riggedModelUrl: selectedAssetState.riggedModelUrl,
            animationPreset: preset,
          }),
        });

        if (!response.ok) {
          throw new Error(`Animation submission failed: ${response.statusText}`);
        }

        const data = await response.json();
        // Start polling for this animation task
        pollAnimationTask(selectedAssetId, preset, data.taskId);
      } catch (err) {
        console.error(`Animation ${preset} error:`, err);
      }
    }
  }, [selectedAssetId, selectedAssetState, selectedAnimations, projectId]);
  ```
- **PATTERN**: Similar to `handleRig`, but iterates over presets
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Add Animation Polling

- **IMPLEMENT**: Add `pollAnimationTask` function after `pollRigTask`
  ```typescript
  // Poll animation task until complete
  const pollAnimationTask = useCallback(
    async (assetId: string, preset: AnimationPreset, taskId: string) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/generate-3d/${taskId}/status`);
          if (!response.ok) throw new Error(`Status check failed`);
          const data = await response.json();
          
          const animatedUrl = 
            data.output?.model?.url ||
            data.output?.pbr_model ||
            null;
          
          if (data.status === "success" && animatedUrl) {
            clearInterval(pollInterval);
            setAssetStates((prev) => {
              const next = new Map(prev);
              const current = prev.get(assetId);
              const existingAnimUrls = current?.animatedModelUrls || {};
              next.set(assetId, {
                ...current,
                status: "complete",
                progress: 100,
                animatedModelUrls: { ...existingAnimUrls, [preset]: animatedUrl },
              } as Asset3DState);
              return next;
            });
          } else if (data.status === "failed") {
            clearInterval(pollInterval);
            setAssetStates((prev) => {
              const next = new Map(prev);
              next.set(assetId, {
                ...prev.get(assetId),
                status: "failed",
                error: data.error || `Animation ${preset} failed`,
              } as Asset3DState);
              return next;
            });
          }
        } catch (err) {
          console.error("Animation polling error:", err);
        }
      }, 2000);
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    },
    []
  );
  ```
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Add "Apply Animations" Button

- **IMPLEMENT**: Add button after animations dropdown (line ~672)
  ```tsx
  {/* Apply Animations Button */}
  {selectedAnimations.size > 0 && selectedAssetState?.status === "rigged" && (
    <Button 
      onClick={handleAnimate} 
      className="bg-yellow-600 hover:bg-yellow-500"
    >
      <Play className="h-4 w-4 mr-2" />
      Apply {selectedAnimations.size} Animation{selectedAnimations.size > 1 ? 's' : ''}
    </Button>
  )}
  ```
- **VALIDATE**: `bun run typecheck && bun run lint`

---

### CREATE `Asset3DApprovalCard.tsx`

- **CREATE**: `src/components/3d/generation/Asset3DApprovalCard.tsx`
- **IMPLEMENT**: Approval card for 3D assets
  ```typescript
  /**
   * Asset3DApprovalCard Component
   *
   * Displays a generated 3D asset with approval controls.
   * Similar to 2D AssetApprovalCard but with ModelViewer instead of image.
   */

  'use client'

  import { Check, X, RotateCcw, Box } from 'lucide-react'
  import { Button } from '@/components/ui/button'
  import { ModelViewer } from './ModelViewer'
  import type { Parsed3DAsset } from '@/lib/3d-plan-parser'

  interface Asset3DApprovalCardProps {
    asset: Parsed3DAsset
    modelUrl: string
    promptUsed: string
    onApprove: () => void
    onReject: () => void
    onRegenerate: () => void
  }

  export function Asset3DApprovalCard({
    asset,
    modelUrl,
    promptUsed,
    onApprove,
    onReject,
    onRegenerate,
  }: Asset3DApprovalCardProps) {
    return (
      <div className="glass-panel p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white/90">{asset.name}</h3>
            <p className="text-sm text-white/60">{asset.category}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRegenerate}
            className="text-xs"
            title="Regenerate with same prompt"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        </div>

        {/* Approval Buttons */}
        <div className="flex gap-3">
          <Button onClick={onApprove} className="flex-1 aurora-gradient font-semibold">
            <Check className="w-4 h-4 mr-2" />
            Approve & Save
          </Button>
          <Button onClick={onReject} variant="destructive" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>

        {/* 3D Model Preview */}
        <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10">
          <ModelViewer modelUrl={modelUrl} className="h-full" />
        </div>

        {/* Prompt Used */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/10">
          <p className="text-xs text-white/60 mb-1 font-semibold">Prompt Used:</p>
          <p className="text-sm text-white/80 font-mono">{promptUsed}</p>
        </div>

        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/60">GLB Model</span>
          <span className={`px-2 py-0.5 text-xs rounded ${
            asset.shouldRig ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {asset.shouldRig ? 'Riggable' : 'Static'}
          </span>
        </div>
      </div>
    )
  }
  ```
- **PATTERN**: Mirrors `AssetApprovalCard.tsx` structure
- **VALIDATE**: `bun run typecheck`

---

### UPDATE Prisma Schema - Add approvalStatus

- **UPDATE**: `src/prisma/schema.prisma` (line ~203)
  ```prisma
  model Generated3DAsset {
    // ... existing fields ...
    
    // Add after errorMessage field:
    approvalStatus    String?  // 'pending' | 'approved' | 'rejected'
    approvedAt        DateTime?
  }
  ```
- **VALIDATE**: `bunx prisma db push`

---

### CREATE `ExportPanel3D.tsx`

- **CREATE**: `src/components/3d/export/ExportPanel3D.tsx`
- **IMPLEMENT**: Batch export panel for 3D assets (mirrors ExportPanel.tsx)
- **IMPORTS**: Button, lucide icons, db client
- **VALIDATE**: `bun run typecheck`

---

### CREATE `/api/export-3d/route.ts`

- **CREATE**: `src/app/api/export-3d/route.ts`
- **IMPLEMENT**: ZIP generation with GLB files + manifest
  - Fetch approved 3D assets from Prisma
  - Download GLB files via CORS proxy
  - Generate manifest-3d.json with metadata
  - Bundle with JSZip
  - Return ZIP blob
- **PATTERN**: Mirrors `/api/export/route.ts`
- **VALIDATE**: `bun run typecheck`

---

## TESTING STRATEGY

### Unit Tests

Test 3D plan parser additions and type definitions using existing Bun test framework.

### Manual Validation

1. **Rigging Flow**
   - Generate 3D asset with [RIG] tag
   - Click "Auto-Rig" button
   - Verify progress indicator shows during rigging
   - Verify rigged model URL appears in download dropdown

2. **Animation Flow**
   - After rigging completes, select 2+ animation presets
   - Click "Apply Animations"
   - Verify each animation task polls to completion
   - Verify animated model URLs appear in download dropdown

3. **Approval Flow**
   - Generate 3D asset
   - Approval card should appear
   - Click "Approve" - verify asset saved to database with 'approved' status
   - Click "Reject" on another - verify state resets for regeneration

4. **Batch Export**
   - Approve 3+ 3D assets
   - Navigate to export panel
   - Click "Download Asset Pack"
   - Verify ZIP contains all GLB files + manifest-3d.json

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```powershell
bun run typecheck
bun run lint
```

### Level 2: Database
```powershell
bunx prisma db push
bunx prisma generate
```

### Level 3: Manual Testing
- Start dev server: `bun run dev`
- Create 3D project
- Test generate → rig → animate → approve → export flow

---

## ACCEPTANCE CRITERIA

- [ ] Rigging button triggers poll and shows progress
- [ ] Rigged model URL appears in download dropdown
- [ ] Animation UI allows multi-select presets
- [ ] "Apply Animations" triggers tasks for each preset
- [ ] Approval card shows for generated/rigged/complete assets
- [ ] Approve persists asset to database
- [ ] Reject resets state for regeneration
- [ ] Regenerate clears URLs and restarts generation
- [ ] Batch export generates ZIP with all approved GLBs
- [ ] manifest-3d.json includes asset metadata
- [ ] All typecheck and lint commands pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Manual testing confirms feature works
- [ ] No linting or type checking errors
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

1. **Polling Approach**: Reuse existing `pollTaskStatus` pattern rather than WebSockets for simplicity
2. **Animation Multi-Task**: Each animation preset is a separate Tripo task, polled independently
3. **Approval Status**: Add to existing Asset3DState rather than creating separate approval state
4. **Export Strategy**: Download GLBs server-side via CORS proxy rather than client-side

### Tripo API Considerations

- Tripo task output structure varies by task type
- `animate_rig` returns model URL in `output.model.url` or `output.pbr_model`
- `animate_retarget` returns animated GLB in same structure
- URLs expire after 24 hours - prompt user to export quickly

### Skybox Consideration

Tripo3D does not support skybox generation. For skybox feature, would need to integrate Blockade Labs Skybox AI API as a separate service. This is deferred to post-MVP.

### Additional Asset Types (Environment Props, Items)

These can be handled by the existing text-to-model workflow:
- Add new categories to the 3D plan parser
- Props and items don't require rigging
- Add `[PROP]` and `[ITEM]` tags as aliases for `[STATIC]`
