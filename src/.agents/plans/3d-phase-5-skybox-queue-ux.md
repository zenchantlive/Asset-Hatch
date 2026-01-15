# Feature: 3D Mode Phase 5 - Skybox, Queue Management & UX Polish

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Complete Phase 5 of 3D asset generation with four key features:
1. **Skybox Generation** - Generate equirectangular skybox images using existing image models, with spherical 3D preview
2. **Add Assets to Queue** - Manual form to add assets dynamically with AI assistance option
3. **Prompt Editing** - Inline editable prompt before generation
4. **Educational Tooltips** - Tooltips on status badges and action buttons

Note: Batch Export is already complete (ExportPanel3D.tsx + /api/export-3d).

## User Story

As a **3D game developer**
I want to **generate skyboxes, add custom assets to my queue, and customize prompts before generation**
So that **I have full creative control over my 3D asset pack with proper environmental backgrounds**

## Problem Statement

The 3D generation workflow is missing:
- Skybox/environment generation (critical for complete game asset packs)
- Ability to add assets beyond what's in the parsed plan
- Prompt customization before generation (currently uses description verbatim)
- Educational context for UI elements (users don't know what buttons do)

## Solution Statement

1. **Skybox**: Use existing Gemini 3 Pro Image model with equirectangular prompting, create `SkyboxViewer` component for spherical preview
2. **Add Assets**: Simple form with name/description/type, AI assist button that helps write descriptions
3. **Prompt Editing**: Inline textarea in AssetDetailPanel3D, pass custom prompt to handleGenerate
4. **Tooltips**: Use shadcn/ui Tooltip component on StatusBadge and action buttons

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: GenerationQueue3D, AssetDetailPanel3D, AssetActions3D, new SkyboxViewer
**Dependencies**: @react-three/drei (already installed), existing model-registry.ts

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING

- `src/components/3d/generation/GenerationQueue3D.tsx` - Main queue container, add skybox section here
- `src/components/3d/generation/AssetDetailPanel3D.tsx` (lines 117-142) - Header area where prompt editor goes
- `src/components/3d/generation/AssetActions3D.tsx` (lines 51-84) - StatusBadge to add tooltips
- `src/components/3d/generation/ModelViewer.tsx` - Pattern for SkyboxViewer (Three.js Canvas setup)
- `src/lib/model-registry.ts` (lines 123-139) - `google/gemini-3-pro-image-preview` model entry
- `src/app/api/generate/route.ts` - 2D image generation pattern to mirror for skybox
- `src/lib/3d-plan-parser.ts` - Parsed3DAsset structure for new manual assets
- `src/components/ui/tooltip.tsx` - shadcn/ui Tooltip component (if exists, else need to add)

### New Files to Create

- `src/components/3d/generation/SkyboxViewer.tsx` - Spherical equirectangular image viewer
- `src/components/3d/generation/SkyboxSection.tsx` - Skybox generation UI section
- `src/components/3d/generation/AddAssetForm.tsx` - Manual asset addition form
- `src/app/api/generate-skybox/route.ts` - Skybox generation API endpoint

### Relevant Documentation

- [Three.js Equirectangular Texture](https://threejs.org/docs/#api/en/textures/Texture) - For skybox sphere mapping
- [@react-three/drei Environment](https://github.com/pmndrs/drei#environment) - May provide skybox utilities
- [shadcn/ui Tooltip](https://ui.shadcn.com/docs/components/tooltip) - Tooltip component pattern

### Patterns to Follow

**Three.js Spherical Skybox Pattern**:
```typescript
// Camera inside sphere looking outward
<Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
  <mesh scale={[-1, 1, 1]}> {/* Inverted sphere */}
    <sphereGeometry args={[500, 60, 40]} />
    <meshBasicMaterial map={texture} side={THREE.BackSide} />
  </mesh>
  <OrbitControls enableZoom={false} enablePan={false} />
</Canvas>
```

**Existing Image Generation Pattern** (from generate/route.ts):
```typescript
const { projectId, asset, modelKey = defaultModelId, customPrompt } = body;
// Uses generateFluxImage from lib/openrouter-image.ts
```

**Asset State Pattern** (from 3d-queue-types.ts):
```typescript
interface Asset3DState {
  status: Asset3DStatus;
  progress: number;
  draftModelUrl?: string;
  // ...
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Skybox Infrastructure

Create skybox generation backend and spherical viewer component.

**Tasks:**
- Create `/api/generate-skybox` route using existing image generation utilities
- Build `SkyboxViewer.tsx` component with spherical mapping
- Add skybox type to asset state management

### Phase 2: Skybox UI Integration

Integrate skybox generation into the queue UI.

**Tasks:**
- Create `SkyboxSection.tsx` with model selector and prompt input
- Add skybox section to `GenerationQueue3D.tsx` layout
- Wire up generation, polling, and preview display

### Phase 3: Add Asset Form

Enable manual asset addition to the queue.

**Tasks:**
- Create `AddAssetForm.tsx` with name, description, RIG/STATIC toggle
- Add AI assistance button that helps write descriptions
- Integrate form into AssetTree3D or as modal trigger

### Phase 4: Prompt Editing

Add inline prompt editing in detail panel.

**Tasks:**
- Add editable textarea in `AssetDetailPanel3D.tsx`
- Pass custom prompt to `handleGenerate` function
- Show prompt preview with edit capability

### Phase 5: Educational Tooltips

Add tooltips to improve UX understanding.

**Tasks:**
- Install/verify shadcn/ui Tooltip component
- Add tooltips to StatusBadge in AssetDetailPanel3D
- Add tooltips to action buttons in AssetActions3D

---

## STEP-BY-STEP TASKS

### CREATE `/api/generate-skybox/route.ts`

- **IMPLEMENT**: Skybox generation endpoint using existing image utilities
  ```typescript
  // Similar to /api/generate but with skybox-specific prompting
  // Default model: google/gemini-3-pro-image-preview
  // Prompt template: "equirectangular 360 panorama skybox for video game, seamless wrap, 2:1 aspect ratio, {userPrompt}"
  ```
- **PATTERN**: Mirror `app/api/generate/route.ts` structure
- **IMPORTS**: `generateFluxImage` from `@/lib/openrouter-image`, `getModelById` from `@/lib/model-registry`
- **VALIDATE**: `bun run typecheck`

---

### CREATE `SkyboxViewer.tsx`

- **IMPLEMENT**: Spherical viewer for equirectangular images
  ```typescript
  "use client";
  import { Canvas } from "@react-three/fiber";
  import { OrbitControls } from "@react-three/drei";
  import * as THREE from "three";

  interface SkyboxViewerProps {
    imageUrl: string;
    className?: string;
  }

  // Render camera INSIDE an inverted sphere textured with the skybox image
  // OrbitControls with enableZoom={false}, enablePan={false}
  // User can look around 360 degrees
  ```
- **PATTERN**: Similar to `ModelViewer.tsx` canvas setup
- **GOTCHA**: Sphere must be inverted (scale={[-1, 1, 1]}) for interior viewing
- **VALIDATE**: `bun run typecheck`

---

### CREATE `SkyboxSection.tsx`

- **IMPLEMENT**: Skybox generation UI section
  ```typescript
  // Contains:
  // - Prompt input textarea
  // - Model selector dropdown (getImageGenerationModels())
  // - Generate button
  // - SkyboxViewer preview when generated
  // - Download button for generated image
  ```
- **IMPORTS**: Model selector from existing pattern in generation components
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Add Skybox Section

- **IMPLEMENT**: Add skybox state and section to layout (after line ~640)
  ```typescript
  // Add state:
  const [skyboxImageUrl, setSkyboxImageUrl] = useState<string | null>(null);
  const [skyboxGenerating, setSkyboxGenerating] = useState(false);

  // Add to render (before or after asset detail panel):
  <SkyboxSection
    projectId={projectId}
    onGenerated={setSkyboxImageUrl}
    isGenerating={skyboxGenerating}
    setIsGenerating={setSkyboxGenerating}
    generatedUrl={skyboxImageUrl}
  />
  ```
- **VALIDATE**: `bun run typecheck`

---

### CREATE `AddAssetForm.tsx`

- **IMPLEMENT**: Manual asset addition form
  ```typescript
  interface AddAssetFormProps {
    onAdd: (asset: Parsed3DAsset) => void;
    projectId: string;
  }

  // Form fields:
  // - name (text input)
  // - description (textarea with AI assist button)
  // - shouldRig (toggle: RIG / STATIC)
  // - category dropdown (Characters, Props, Environment, Custom)

  // AI Assist button: Opens simple prompt to help write description
  // Calls existing chat API with system prompt for asset descriptions
  ```
- **PATTERN**: Use existing Button, Input components from shadcn/ui
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Add Asset Form Integration

- **IMPLEMENT**: Add handler to insert new assets into parsedAssets state
  ```typescript
  const handleAddAsset = useCallback((newAsset: Parsed3DAsset) => {
    setParsedAssets(prev => [...prev, newAsset]);
    // Optionally select the new asset
    setSelectedAssetId(newAsset.id);
  }, []);
  ```
- **IMPLEMENT**: Add button to open AddAssetForm (in AssetTree3D header or as floating action)
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `AssetDetailPanel3D.tsx` - Inline Prompt Editing

- **IMPLEMENT**: Add editable prompt textarea (after description, line ~141)
  ```typescript
  // Add state:
  const [customPrompt, setCustomPrompt] = useState<string>(
    asset.description || `A 3D model of ${asset.name}`
  );

  // Add UI (after description):
  <div className="mt-3">
    <label className="text-xs text-white/50 mb-1 block">Generation Prompt</label>
    <textarea
      value={customPrompt}
      onChange={(e) => setCustomPrompt(e.target.value)}
      className="w-full bg-black/20 rounded-lg p-3 text-sm text-white/80 border border-white/10 resize-none"
      rows={3}
    />
  </div>
  ```
- **IMPLEMENT**: Pass customPrompt via props or callback to parent for handleGenerate
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `GenerationQueue3D.tsx` - Use Custom Prompt

- **IMPLEMENT**: Update handleGenerate to accept customPrompt parameter
  ```typescript
  const handleGenerate = useCallback(async (customPrompt?: string) => {
    // Use customPrompt if provided, else fall back to description
    const prompt = customPrompt || selectedAsset?.description || `A 3D model of ${selectedAsset?.name}`;
    // ... rest of generation logic
  }, [/* deps */]);
  ```
- **VALIDATE**: `bun run typecheck`

---

### ADD Tooltip Component (if not exists)

- **CHECK**: If `src/components/ui/tooltip.tsx` exists
- **IF NOT**: Run `bunx shadcn@latest add tooltip` or create manually
- **VALIDATE**: Import works

---

### UPDATE `AssetDetailPanel3D.tsx` - Status Badge Tooltips

- **IMPLEMENT**: Wrap StatusBadge with Tooltip
  ```typescript
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

  // Tooltip messages for each status:
  const STATUS_TOOLTIPS: Record<Asset3DStatus, string> = {
    ready: "Asset is ready to generate. Click Generate to start.",
    generating: "3D model is being created by Tripo AI...",
    generated: "Draft model complete. You can now rig or approve.",
    rigging: "Adding skeleton and bones for animation...",
    rigged: "Model has skeleton. Select animations to apply.",
    animating: "Applying animation presets to rigged model...",
    complete: "All processing complete. Approve to add to export.",
    failed: "An error occurred. Check the error message below.",
  };

  // Wrap badge:
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <StatusBadge status={assetState.status} progress={assetState.progress} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{STATUS_TOOLTIPS[assetState.status]}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
  ```
- **VALIDATE**: `bun run typecheck`

---

### UPDATE `AssetActions3D.tsx` - Button Tooltips

- **IMPLEMENT**: Add tooltips to Generate, Auto-Rig, Animations, Approve/Reject buttons
  ```typescript
  // Example for Generate button:
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onGenerate} className="bg-cyan-600 hover:bg-cyan-500">
          <Play className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </TooltipTrigger>
      <TooltipContent>Start generating 3D model from the prompt</TooltipContent>
    </Tooltip>
  </TooltipProvider>

  // Tooltip messages:
  // Generate: "Start generating 3D model from the prompt"
  // Auto-Rig: "Add skeleton and bones for animation support"
  // Animations: "Select animation presets to apply"
  // Apply Animations: "Apply selected animations to rigged model"
  // Approve: "Save this model to your export pack"
  // Reject: "Discard this model and regenerate"
  ```
- **VALIDATE**: `bun run typecheck && bun run lint`

---

## TESTING STRATEGY

### Manual Validation

1. **Skybox Generation**
   - Navigate to 3D project generation tab
   - Find skybox section
   - Enter prompt like "fantasy floating islands sunset sky"
   - Select Gemini 3 Pro Image model
   - Click Generate
   - Verify spherical 360 preview works (can look around)
   - Verify download works

2. **Add Asset Form**
   - Click "Add Asset" button
   - Fill in name, description
   - Toggle RIG/STATIC
   - Optionally use AI assist for description
   - Submit and verify asset appears in queue

3. **Prompt Editing**
   - Select an asset from queue
   - See prompt textarea in detail panel
   - Edit the prompt
   - Click Generate
   - Verify the custom prompt was used (check API logs or resulting model)

4. **Tooltips**
   - Hover over status badges - verify tooltip appears
   - Hover over action buttons - verify tooltips appear
   - Check tooltip content is helpful and accurate

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
bun run typecheck
bun run lint
```

### Level 2: Unit Tests
```bash
bun run test
```

### Level 3: Manual Testing
- Start dev server: `bun dev`
- Create or open 3D project
- Test all four features in Generation tab

---

## ACCEPTANCE CRITERIA

- [ ] Skybox generation works with Gemini 3 Pro Image (default)
- [ ] Model selector allows choosing other image models
- [ ] SkyboxViewer renders spherical 360 preview (look-around controls)
- [ ] Skybox image can be downloaded
- [ ] Add Asset form creates new assets in queue
- [ ] AI assist button helps write asset descriptions
- [ ] Prompt editing inline in detail panel works
- [ ] Custom prompts are used when generating
- [ ] Status badge tooltips explain each status
- [ ] Action button tooltips explain what each does
- [ ] All typecheck and lint commands pass
- [ ] No regressions in existing 3D workflow

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Manual testing confirms all features work
- [ ] No linting or type checking errors

---

## NOTES

### Design Decisions

1. **Skybox via Existing Image Models**: Using Gemini 3 Pro Image instead of a dedicated skybox API (like Blockade Labs) keeps the stack simple and leverages existing infrastructure. User testing showed good results with "skybox for video game" prompting.

2. **Spherical Preview**: Camera inside inverted sphere with equirectangular texture provides authentic skybox preview experience. User can look around 360 degrees.

3. **Inline Prompt Editing**: Chosen over modal because user prefers seeing prompt alongside asset details. Can edit and generate without extra clicks.

4. **AI Assist for Add Asset**: Rather than full AI chat, a simple "help me write this description" button reduces complexity while adding value.

### Skybox Prompt Template

The API should prepend skybox-specific instructions:
```
equirectangular 360 panorama skybox for video game, seamless horizontal wrap, 2:1 aspect ratio, [user prompt], no visible seams at edges
```

### Future Considerations

- Skybox could be added to batch export (as texture file)
- Multiple skybox variations per project
- Skybox style consistency with 3D assets (use style anchor?)
