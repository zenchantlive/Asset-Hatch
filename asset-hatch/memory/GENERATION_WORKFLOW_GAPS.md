# Generation Workflow - Missing Logic Analysis

**Created:** 2025-12-26
**Status:** Planning Phase
**Purpose:** Document critical gaps identified between Plan agent analysis and FLUX2 prompt engineering requirements

---

## 🔴 Critical Missing Components

### 1. Style Anchor Extraction & Storage

**What's Missing:**
- **HOW** to extract style keywords from reference image
- Automated color palette extraction from image
- Lighting keywords analysis
- Storage structure for style anchor data

**Required Implementation:**
```typescript
interface StyleAnchor {
  reference_image_id: string;
  reference_image_blob: Blob;
  reference_image_base64: string;  // ← For API calls
  style_keywords: string;  // e.g., "16-bit pixel art, SNES RPG style"
  lighting_keywords: string;  // e.g., "flat lighting, even illumination"
  color_palette: string[];  // HEX codes: ["#2C3E50", "#E74C3C", ...]
  flux_model: string;  // "black-forest-labs/flux-2-dev"
  created_at: string;
}
```

**Options for Extraction:**
1. **Manual User Input** (Phase 1) - User fills style keywords, picks colors from image
2. **Vision API Analysis** (Phase 2) - Use OpenRouter vision model to analyze image
3. **Hybrid** - AI suggests, user confirms/edits

**Blocker Level:** 🔴 **HIGH** - Can't generate consistent assets without this

---

### 2. Character Registry System

**What's Missing:**
- Database table for character definitions
- Base description storage
- Successful seed tracking
- Pose history tracking
- Color HEX code mapping per character element

**Required Implementation:**
```typescript
interface CharacterRegistry {
  character_id: string;
  project_id: string;
  name: string;  // "farmer", "warrior", etc.
  base_description: string;  // "farmer character with straw hat, weathered blue overalls, brown boots"
  color_hex: Record<string, string>;  // { hat: "#D4AF37", overalls: "#003366", boots: "#8B4513" }
  style_keywords: string;  // "16-bit pixel art, Stardew Valley style"
  successful_seed: number;  // First successful generation seed
  poses_generated: string[];  // ["idle", "walk_left", "walk_right", "work"]
  animations: {
    [pose: string]: {
      prompt_suffix: string;  // "idle standing pose"
      seed: number;  // Seed used for this pose
      asset_id: string;  // Link to generated asset
    }
  };
  created_at: string;
  updated_at: string;
}
```

**Why Needed:**
- **Consistency**: Full character description must be included in EVERY pose prompt
- **Batch Generation**: Allows sequential generation with character context
- **Reproducibility**: Store successful seeds for exact reproduction
- **Avoid Duplicates**: Track what poses already generated

**Blocker Level:** 🟡 **MEDIUM** - Can work without it initially, but quality suffers

---

### 3. Seed Management System

**What's Missing:**
- Seed storage per generated asset
- Optional seed reuse for variants
- UI controls for "Generate with same seed" vs "New seed"
- Exact reproduction capability

**Required Fields in GeneratedAsset:**
```typescript
interface GeneratedAssetDB {
  // ... existing fields
  generation_metadata: {
    model: string;
    seed: number;  // ← STORE THIS
    prompt_used: string;
    cost: number;
    duration: number;
  };
  reproducible: boolean;  // Can this be regenerated with same seed?
}
```

**UI Impact:**
```
┌────────────────────────────────────┐
│ Farmer - Walking Animation         │
│ [✓] Use same seed as idle pose     │  ← NEW CONTROL
│ [Generate]  [Regenerate Exact]     │
└────────────────────────────────────┘
```

**Blocker Level:** 🟢 **LOW** - Nice to have, not critical for v1

---

### 4. Prompt Generation Priority System

**What's Missing:**
- **Word order prioritization** - First 5 words carry highest weight
- Structured template builder (not just string concatenation)
- Asset-type-specific template selection

**Current Approach (Wrong):**
```typescript
// ❌ WRONG - No priority order
const prompt = `${asset.description} ${qualities.art_style} ${qualities.theme} ${styleAnchor.keywords}`;
```

**Correct Approach:**
```typescript
// ✅ CORRECT - Priority-ordered builder
function buildPrompt(asset: Asset, qualities: ProjectQualities, styleAnchor: StyleAnchor): string {
  const parts = [];

  // 1. Asset type + subject (HIGHEST PRIORITY)
  parts.push(`${asset.type} of ${asset.name}`);

  // 2. Pose/action/state (if relevant)
  if (asset.variant.pose) {
    parts.push(asset.variant.pose);
  }

  // 3. Resolution specification
  parts.push(`${qualities.base_resolution} sprite`);

  // 4. Style keywords from anchor
  parts.push(styleAnchor.style_keywords);

  // 5. Color palette (with HEX codes)
  if (styleAnchor.color_palette.length > 0) {
    parts.push(`limited color palette using ${styleAnchor.color_palette.join(', ')}`);
  }

  // 6. View/perspective
  parts.push(getPerspectiveKeywords(qualities.perspective));

  // 7. Lighting keywords
  parts.push(getLightingKeywords(asset.type));

  // 8. Background specification
  parts.push('white background');

  // 9. Consistency markers
  parts.push('consistent with style reference image');

  // 10. Game-ready marker
  parts.push('game-ready asset');

  return parts.join(', ');
}
```

**Blocker Level:** 🔴 **HIGH** - Incorrect prompts = inconsistent results

---

### 5. Asset Type-Specific Templates

**What's Missing:**
- Template selection logic based on asset.type
- Different structures for:
  - Character sprites (single pose)
  - Sprite sheets (animation frames with grid spec)
  - Tilesets (seamless, tileable, edge variations)
  - UI elements (clean edges, centered)
  - Icons (crisp outline, specific size)

**Required Templates:**

```typescript
const TEMPLATE_CHARACTER_SPRITE = `
pixel art sprite of {character_description},
{pose}, {resolution} sprite, {style_keywords},
{color_palette}, {view_direction},
white background, consistent with style reference image, game-ready asset
`;

const TEMPLATE_SPRITE_SHEET = `
sprite sheet of {character_description},
{frame_count} frames arranged {arrangement_type}, {animation_type} animation,
{resolution} per frame, consistent proportions throughout, evenly spaced and aligned,
{style_keywords}, {view_direction}, white background, game-ready asset
`;

const TEMPLATE_TILESET = `
seamless tileset of {terrain_type}, {tile_size} tile size,
{view_angle}, includes edge pieces and corner variations,
{color_palette}, {style_keywords}, consistent lighting,
tileable pattern, game-ready asset
`;

const TEMPLATE_UI_ELEMENT = `
game UI {element_type}, {shape}, {color_specification},
'{text}' in {font_style}, {size_specification},
clean sharp edges, centered on white background,
game HUD style, production-ready asset
`;

const TEMPLATE_ICON = `
{item_type} inventory icon, {visual_description},
{style_keywords} game icon style, {color_palette},
clean outline, centered on white background, {icon_size} pixel size,
game asset style, production-ready
`;
```

**Blocker Level:** 🔴 **HIGH** - Wrong template = wrong output format

---

### 6. Lighting & Perspective Keyword Mappings

**What's Missing:**
- Automated keyword selection based on asset type and game perspective
- Lookup tables for lighting by asset type
- Lookup tables for perspective by game type

**Required Implementation:**

```typescript
const LIGHTING_KEYWORDS: Record<AssetType, string> = {
  'character-sprite': 'flat lighting, even illumination, minimal shadows',
  'sprite-sheet': 'flat lighting, even illumination, minimal shadows',
  'ui-element': 'uniform lighting, no shadows, clean bright',
  'icon': 'soft diffused light, studio lighting',
  'background': 'atmospheric lighting, ambient light, soft shadows',
  'tileset': 'consistent top-down lighting, even illumination',
};

const PERSPECTIVE_KEYWORDS: Record<GamePerspective, string> = {
  'top-down': 'top-down view, bird\'s-eye perspective, overhead angle, RPG world view',
  'side-view': 'side view, profile perspective, 2D side-scroller style, platformer view',
  'isometric': 'isometric view, 2.5D perspective, 2:1 ratio isometric, strategy game view',
  'front-facing': 'front view, facing toward camera, straight-on perspective',
};

function getLightingKeywords(assetType: AssetType): string {
  return LIGHTING_KEYWORDS[assetType] || 'even lighting';
}

function getPerspectiveKeywords(perspective: GamePerspective): string {
  return PERSPECTIVE_KEYWORDS[perspective] || 'side view';
}
```

**Blocker Level:** 🟡 **MEDIUM** - Results less polished without this

---

### 7. Consistency Marker System

**What's Missing:**
- Automatic inclusion of consistency phrases based on context
- Character reference tracking ("matching the established farmer character")
- Style anchor reference ("consistent with style reference image")

**Required Logic:**

```typescript
function getConsistencyMarkers(
  asset: Asset,
  characterRegistry: CharacterRegistry | null
): string[] {
  const markers = [];

  // Always reference style anchor
  markers.push('consistent with style reference image');

  // If character already generated, reference it
  if (characterRegistry && characterRegistry.poses_generated.length > 0) {
    markers.push(`matching the established ${characterRegistry.name} character design`);
  }

  // If sprite sheet, add frame consistency
  if (asset.type === 'sprite-sheet') {
    markers.push('consistent proportions throughout');
    markers.push('evenly spaced frames');
    markers.push('uniform grid alignment');
  }

  // If tileset, add seamless markers
  if (asset.type === 'tileset') {
    markers.push('seamless');
    markers.push('tileable');
    markers.push('edge-matching');
  }

  // Always end with game-ready
  markers.push('game-ready asset');

  return markers;
}
```

**Blocker Level:** 🟡 **MEDIUM** - Improves quality significantly

---

### 8. Image Storage & Base64 Conversion

**What's Missing:**
- Blob → Base64 conversion for API calls
- Base64 → Blob conversion for storage
- Reference image encoding for every generation

**Required Utilities:**

```typescript
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return await response.blob();
}

async function prepareStyleAnchorForAPI(styleAnchor: StyleAnchor): Promise<string> {
  // If not already base64, convert
  if (!styleAnchor.reference_image_base64) {
    styleAnchor.reference_image_base64 = await blobToBase64(styleAnchor.reference_image_blob);
  }
  return styleAnchor.reference_image_base64;
}
```

**API Integration:**
```typescript
const styleAnchorBase64 = await prepareStyleAnchorForAPI(styleAnchor);

const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
  method: 'POST',
  body: JSON.stringify({
    model: 'black-forest-labs/flux-2-dev',
    prompt: optimizedPrompt,
    images: [styleAnchorBase64],  // ← Style anchor as base64
    size: '512x512',
    n: 1
  })
});
```

**Blocker Level:** 🔴 **HIGH** - Can't call API without this

---

### 9. Resolution Strategy (2x Generation)

**What's Missing:**
- Generate at 2x resolution for pixel-perfect results
- Downscaling logic after generation
- Size calculation based on base_resolution quality param

**Required Logic:**

```typescript
function calculateGenerationSize(baseResolution: string): { width: number; height: number } {
  // Parse base resolution (e.g., "32x32", "64x64")
  const [baseWidth, baseHeight] = baseResolution.split('x').map(Number);

  // Generate at 2x for pixel-perfect downscaling
  return {
    width: baseWidth * 2,
    height: baseHeight * 2,
  };
}

async function generateAndDownscale(
  prompt: string,
  baseResolution: string,
  styleAnchor: StyleAnchor
): Promise<Blob> {
  const genSize = calculateGenerationSize(baseResolution);

  // Generate at 2x
  const generatedImage = await callFluxAPI(prompt, styleAnchor, genSize);

  // Downscale to base resolution for pixel-perfect result
  const downscaled = await downscaleImage(generatedImage, baseResolution);

  return downscaled;
}
```

**Blocker Level:** 🟡 **MEDIUM** - Pixel art quality suffers without this

---

### 10. Batch Generation Sequential Pattern

**What's Missing:**
- Sequential workflow with full character description
- Automatic character context injection
- Seed reuse option for variants

**Required Workflow:**

```typescript
async function batchGenerateCharacterPoses(
  characterId: string,
  poses: string[],
  useConsistentSeed: boolean = false
): Promise<GeneratedAsset[]> {
  const character = await db.getCharacterRegistry(characterId);
  const results: GeneratedAsset[] = [];

  let seedToUse = character.successful_seed;

  for (const pose of poses) {
    // Build prompt with FULL character description + new pose
    const prompt = buildCharacterPosePrompt({
      base_description: character.base_description,
      color_hex: character.color_hex,
      pose: pose,
      style_keywords: character.style_keywords,
    });

    // Generate with optional seed reuse
    const generated = await generateAsset(prompt, {
      seed: useConsistentSeed ? seedToUse : undefined,
    });

    // Store successful seed from first generation
    if (results.length === 0 && !character.successful_seed) {
      character.successful_seed = generated.metadata.seed;
      await db.updateCharacterRegistry(character);
    }

    // Track pose in character registry
    character.poses_generated.push(pose);
    character.animations[pose] = {
      prompt_suffix: pose,
      seed: generated.metadata.seed,
      asset_id: generated.id,
    };
    await db.updateCharacterRegistry(character);

    results.push(generated);
  }

  return results;
}
```

**Blocker Level:** 🟢 **LOW** - Can generate one-by-one without this

---

### 11. Cost Estimation & Model Selection

**What's Missing:**
- Cost tracking per model
- User-selectable model per asset (Dev vs Flex vs Pro)
- Cost estimation before batch generation
- Budget alerts

**Required Implementation:**

```typescript
interface ModelConfig {
  modelId: string;
  provider: 'openrouter';
  costPerImage: number;  // USD
  speedRating: number;  // 1-10
  qualityRating: number;  // 1-10
  maxContextImages: number;
  supportsNegativePrompts: boolean;
}

const FLUX_MODELS: ModelConfig[] = [
  {
    modelId: 'black-forest-labs/flux-2-dev',
    provider: 'openrouter',
    costPerImage: 0.04,  // Example pricing
    speedRating: 9,
    qualityRating: 7,
    maxContextImages: 8,
    supportsNegativePrompts: false,
  },
  {
    modelId: 'black-forest-labs/flux-2-pro',
    provider: 'openrouter',
    costPerImage: 0.15,  // Example pricing
    speedRating: 5,
    qualityRating: 10,
    maxContextImages: 8,
    supportsNegativePrompts: false,
  },
];

function estimateBatchCost(assetCount: number, model: ModelConfig): number {
  return assetCount * model.costPerImage;
}
```

**UI Addition:**
```
┌─────────────────────────────────────────┐
│ Generation Queue (24 assets)            │
│                                         │
│ Model: [Flux.2 Dev ▼]                   │
│ Estimated Cost: $0.96                   │  ← NEW
│ Estimated Time: ~8 minutes              │  ← NEW
│                                         │
│ [Generate All] [Generate Selected]      │
└─────────────────────────────────────────┘
```

**Blocker Level:** 🟢 **LOW** - Nice to have for user transparency

---

### 12. Quality Checklist Validation

**What's Missing:**
- Pre-export validation checks
- Consistency verification across assets
- Automated quality warnings

**Required Checks:**

```typescript
interface QualityCheck {
  passed: boolean;
  warning?: string;
}

function validateAssetQuality(
  assets: GeneratedAsset[],
  styleAnchor: StyleAnchor,
  characterRegistry: CharacterRegistry[]
): QualityCheck[] {
  const checks: QualityCheck[] = [];

  // Check 1: All assets use consistent style keywords
  const uniqueStyles = new Set(assets.map(a => a.prompt_used.includes(styleAnchor.style_keywords)));
  checks.push({
    passed: uniqueStyles.size === 1,
    warning: uniqueStyles.size > 1 ? 'Some assets may have inconsistent style keywords' : undefined,
  });

  // Check 2: Character designs consistent across animations
  for (const character of characterRegistry) {
    const characterAssets = assets.filter(a => a.asset_id.includes(character.name));
    const allHaveBaseDescription = characterAssets.every(a =>
      a.prompt_used.includes(character.base_description)
    );
    checks.push({
      passed: allHaveBaseDescription,
      warning: !allHaveBaseDescription ? `${character.name} may have inconsistent design across poses` : undefined,
    });
  }

  // Check 3: Colors match palette
  const paletteHex = styleAnchor.color_palette.join('|');
  const allUsePalette = assets.every(a =>
    styleAnchor.color_palette.some(hex => a.prompt_used.includes(hex))
  );
  checks.push({
    passed: allUsePalette,
    warning: !allUsePalette ? 'Some assets may not use specified color palette' : undefined,
  });

  return checks;
}
```

**Blocker Level:** 🟢 **LOW** - Nice to have for quality assurance

---

### 13. Warning System for Mid-Project Changes

**What's Missing:**
- Detect when user changes art_style or color_palette mid-project
- Warn about consistency implications
- Offer to regenerate existing assets with new settings

**Required Logic:**

```typescript
function detectQualityChanges(
  newQualities: ProjectQualities,
  existingAssets: GeneratedAsset[]
): { changed: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (existingAssets.length === 0) {
    return { changed: false, warnings };
  }

  const firstAsset = existingAssets[0];
  const firstPrompt = firstAsset.prompt_used;

  // Check if art_style changed
  if (!firstPrompt.includes(newQualities.art_style)) {
    warnings.push(`⚠️ Art style changed from previous generations. Existing ${existingAssets.length} assets may not match new style.`);
  }

  // Check if color_palette changed
  if (!firstPrompt.includes(newQualities.color_palette)) {
    warnings.push(`⚠️ Color palette changed. Existing assets may have different colors.`);
  }

  return {
    changed: warnings.length > 0,
    warnings,
  };
}
```

**UI Modal:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Quality Settings Changed            │
│                                         │
│ You've changed the art style from       │
│ "Pixel Art" to "Hand-Drawn".            │
│                                         │
│ 12 assets were already generated with   │
│ the old style. They may not match       │
│ new generations.                        │
│                                         │
│ [Continue]  [Regenerate All]  [Cancel]  │
└─────────────────────────────────────────┘
```

**Blocker Level:** 🟡 **MEDIUM** - Prevents user confusion

---

## 📊 Implementation Priority Matrix

| Component | Blocker Level | Effort | User Value | Priority |
|-----------|---------------|--------|------------|----------|
| **Prompt Priority System** | 🔴 HIGH | Medium | Critical | **P0** |
| **Asset Type Templates** | 🔴 HIGH | High | Critical | **P0** |
| **Image Base64 Conversion** | 🔴 HIGH | Low | Critical | **P0** |
| **Style Anchor Storage** | 🔴 HIGH | Medium | Critical | **P0** |
| **Lighting/Perspective Mappings** | 🟡 MEDIUM | Low | High | **P1** |
| **Consistency Markers** | 🟡 MEDIUM | Low | High | **P1** |
| **Character Registry** | 🟡 MEDIUM | High | High | **P1** |
| **Warning System** | 🟡 MEDIUM | Medium | Medium | **P2** |
| **Resolution 2x Strategy** | 🟡 MEDIUM | Medium | Medium | **P2** |
| **Batch Sequential Pattern** | 🟢 LOW | Medium | Medium | **P2** |
| **Seed Management** | 🟢 LOW | Low | Low | **P3** |
| **Cost Estimation** | 🟢 LOW | Low | Low | **P3** |
| **Quality Checklist** | 🟢 LOW | Medium | Low | **P3** |

---

## 🎯 Minimum Viable Generation (P0 Only)

To get generation working, we MUST implement:

1. **Prompt Priority Builder** - `lib/prompt-builder.ts`
   - Priority-ordered template system
   - Word order optimization

2. **Asset Type Templates** - `lib/prompt-templates.ts`
   - Character sprite template
   - Sprite sheet template
   - Tileset template
   - UI/Icon templates

3. **Image Conversion Utils** - `lib/image-utils.ts`
   - `blobToBase64()`
   - `base64ToBlob()`
   - `prepareStyleAnchorForAPI()`

4. **Style Anchor Storage** - `lib/db.ts` schema v3
   - Add `style_anchors` table
   - Store reference image + extracted data

**Estimated P0 Effort:** 12-16 hours

---

## 🔮 Future Enhancements (P1-P3)

### P1 (Next Sprint)
- Character registry system for consistency
- Lighting/perspective keyword mappings
- Consistency marker automation
- Warning system for quality changes

### P2 (Later)
- Resolution 2x generation strategy
- Batch sequential generation workflow
- Advanced seed management

### P3 (Nice to Have)
- Cost estimation & model selection UI
- Quality checklist validation
- Export validation system

---

**Next Steps:**
1. Review this analysis with user
2. Confirm P0 scope is acceptable for v1
3. Begin implementing P0 components
4. Design Style Anchor extraction UI (manual vs AI-assisted)

