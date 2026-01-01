# Asset Hatch - Flux.2 Handbook Integration Guide

## Overview

Asset Hatch uses the principles from the **Flux.2 Pro Prompting Handbook** (adapted for Flux.2 Dev) to automatically engineer game asset prompts. This document shows how the handbook's guidance integrates into Asset Hatch's meta-prompt system.

---

## Handbook Concepts → Asset Hatch Implementation

### 1. Core Architecture Understanding

**From Handbook:**
> "Word order determines priority. Place the most important elements first. The first 5-10 words carry the highest weight in generation."

**Asset Hatch Implementation:**
```typescript
// Meta-prompt builder respects word order priority
function buildPrompt(assetSpec) {
  const parts = [
    // PRIORITY 1: Asset type and subject (first 5 words)
    `${assetSpec.assetType} of ${assetSpec.subject}`,
    
    // PRIORITY 2: Pose/action/state
    assetSpec.pose ? `${assetSpec.pose}` : '',
    
    // PRIORITY 3: Resolution and style
    `${assetSpec.resolution} sprite, ${assetSpec.styleKeywords}`,
    
    // PRIORITY 4-5: Colors, view, lighting, background
    assetSpec.colors ? `${assetSpec.colors}` : '',
    assetSpec.viewDirection ? `${assetSpec.viewDirection} view` : '',
    assetSpec.lightingKeywords,
    assetSpec.background,
    
    // PRIORITY 6: Consistency and quality markers
    'consistent with style reference image, game-ready asset'
  ]
  
  return parts.filter(Boolean).join(', ')
}
```

### 2. Universal Formula Application

**From Handbook:**
```
[Subject] + [View/Perspective] + [Style/Era] + [Color Specification] + 
[Background] + [Quality Markers]
```

**Asset Hatch Templates (All Follow This Order):**

**Character Sprites:**
```
[asset type: pixel art sprite] of [subject: farmer with straw hat] 
[pose: idle stance] [resolution: 32x32 sprite] [style: SNES RPG style] 
[colors: limited 16-color palette] [view: front-facing] 
[background: white background] [quality: game-ready asset]
```

**Sprite Sheets:**
```
[asset type: sprite sheet] of [subject: farmer character] 
[arrangement: 8 frames arranged horizontally] [animation: walk cycle] 
[resolution: 32x32 per frame] [style: 16-bit pixel art] 
[consistency: matching lighting, consistent proportions] 
[background: white background] [quality: game-ready asset]
```

**Tilesets:**
```
[asset type: seamless tileset] of [subject: grass terrain] 
[size: 32x32 tile size] [view: top-down view] 
[components: includes edge pieces and corners] [style: RPG style] 
[consistency: tileable pattern] [quality: game-ready asset]
```

---

## Handbook Decision Tree → Asset Hatch Templates

### Asset Type → Template Mapping

Asset Hatch's planning agent uses the handbook's decision tree to suggest templates:

| Asset Type | Handbook Template | Asset Hatch Action |
|------------|------|-------|
| Character Sprite | Character Sprites (Single Frame) | Uses character template from planning |
| Sprite Sheet | Sprite Sheets (Animation Frames) | Uses animation specifications from plan |
| Tileset | Tilesets | Uses environment specifications |
| UI Element | UI Elements | Uses UI template with text handling |
| Icon | Icons | Uses icon-specific template |
| Background | Backgrounds/Environments | Uses background template |

### Example: Planning to Prompt Generation

**User Input (from Planning):**
```
Game type: farming_sim
Art style: pixel_art
Base resolution: 32x32
Character: farmer with straw hat
Animation state: idle pose
Custom: "like Stardew Valley"
```

**Meta-prompt Processing:**

Step 1: Select template (Character Sprites)
```
[asset_type] pixel art sprite of [character description],
[pose/action], [resolution] sprite, [era-style],
[color palette], [view direction],
[white/transparent background], game-ready asset
```

Step 2: Fill in from planning data
```
- asset_type = "pixel art sprite"
- character description = "farmer with straw hat and overalls"
- pose/action = "idle standing pose"
- resolution = "32x32 sprite"
- era-style = "Stardew Valley 16-bit style" (from custom note)
- color palette = "limited 16-color palette" (from style anchor)
- view direction = "front-facing view"
- background = "white background"
```

Step 3: Add style anchor reference
```
matching style from reference image, consistent color palette
```

Step 4: Final Flux.2 prompt
```
pixel art sprite of a farmer character wearing a straw hat and overalls,
idle standing pose, 32x32 sprite, Stardew Valley 16-bit style,
limited 16-color palette, front-facing view, white background,
matching style from reference image, consistent with established design,
game-ready asset
```

---

## Handbook Style Control → Asset Hatch Style Anchor

### Pixel Art Keywords Integration

**From Handbook:**
> "Essential pixel art modifiers: 'pixel-perfect edges', 'no anti-aliasing', 'hard edges', 'limited color palette', '[console]-style'"

**Asset Hatch Implementation:**
```json
{
  "style_anchor": {
    "art_style": "pixel_art",
    "era_reference": "16-bit / SNES",
    "style_keywords": [
      "16-bit pixel art",
      "SNES RPG style",
      "pixel-perfect edges",
      "hard pixel edges",
      "no anti-aliasing",
      "crisp pixels",
      "limited 16-color palette"
    ],
    "reference_image": "style-test.png"
  }
}
```

Every asset generated includes these keywords automatically.

### Color Control with HEX Codes

**From Handbook:**
> "Place HEX codes adjacent to the element they color"

**Asset Hatch Implementation:**
```typescript
function applyColorPalette(prompt: string, palette: HexPalette) {
  // If palette has specific colors for specific elements, apply them
  // Example: palette = { "hat": "#D4AF37", "overalls": "#003366" }
  
  const coloredPrompt = prompt
    .replace('hat', `hat with color #D4AF37`)
    .replace('overalls', `overalls using #003366`)
  
  return coloredPrompt
}
```

Character registry in project memory:
```json
{
  "characters": {
    "farmer": {
      "hat": "#D4AF37",
      "overalls": "#003366",
      "boots": "#8B4513"
    }
  }
}
```

When generating: `"farmer character with straw hat #D4AF37, blue overalls #003366, brown boots #8B4513"`

---

## Handbook Lighting Keywords → Asset Hatch Defaults

**From Handbook:**

| Asset Type | Lighting Keywords |
|-----------|------------------|
| Sprites | "flat lighting", "even illumination", "minimal shadows" |
| UI elements | "uniform lighting", "no shadows", "clean" |
| Icons | "soft diffused light", "studio lighting" |
| Tilesets | "consistent top-down lighting", "even illumination" |

**Asset Hatch Implementation:**
```typescript
const lightingDefaults = {
  "characters": "flat lighting, even illumination, minimal shadows",
  "environment": "consistent top-down lighting, even illumination",
  "props": "flat lighting, even illumination",
  "ui": "uniform lighting, no shadows, clean",
  "icons": "soft diffused light, studio lighting"
}

// Applied automatically based on asset category
const finalPrompt = `${basePrompt}, ${lightingDefaults[category]}`
```

---

## Handbook Sprite Sheet Guidance → Asset Hatch Animation Generation

### Frame Consistency Essentials

**From Handbook:**
> "Always include in sprite sheet prompts: 'consistent proportions throughout', 'evenly spaced frames', 'uniform grid alignment', 'same character design across all frames', 'matching lighting in each frame'"

**Asset Hatch Implementation:**
```typescript
function buildSpriteSheetPrompt(
  character: CharacterSpec,
  animation: AnimationSpec,
  frameCount: number
) {
  return `
    sprite sheet of ${character.description},
    ${frameCount} frames arranged horizontally,
    ${animation.type} animation,
    ${character.resolution} per frame,
    consistent proportions throughout,
    evenly spaced frames,
    uniform grid alignment,
    same character design across all frames,
    matching lighting in each frame,
    ${character.styleKeywords},
    ${character.viewDirection} view,
    white background,
    game-ready asset
  `
}
```

When user specifies "walk cycle animation" in planning, Asset Hatch adds:
```
"walk cycle animation showing contact, passing, and aerial positions"
```

---

## Handbook Tiling Patterns → Asset Hatch Tileset Generation

**From Handbook:**
> "Required for tileable assets: 'seamless pattern', 'seamless tileset', 'repeating pattern', 'tileable', 'edge-matching tiles'"

**Asset Hatch Implementation:**
```typescript
function buildTilesetPrompt(terrainType: string, tileSize: number) {
  return `
    seamless pixel art tileset for platformer game,
    ${terrainType} tiles,
    ${tileSize}x${tileSize} tile size,
    side-view perspective,
    includes edge pieces and corner variations,
    inner corner tiles, outer corner tiles, transition tiles,
    consistent lighting,
    tileable pattern,
    repeating seamless design,
    edge-matching for seamless tiling,
    game-ready asset
  `
}
```

Stores in generation-log:
```json
{
  "asset": "grass_tileset",
  "prompt_keywords": [
    "seamless", "tileable", "edge-matching", 
    "includes edges, corners, transitions"
  ],
  "requires_post_processing": true
}
```

---

## Handbook Text Rendering → Asset Hatch UI Elements

**From Handbook:**
> "Flux.2 Pro has production-ready text rendering. Use quotation marks for exact text"

**Asset Hatch Implementation:**
```typescript
function buildUIButtonPrompt(buttonSpec: UIButtonSpec) {
  return `
    game UI button element,
    ${buttonSpec.shape} shape,
    gradient from ${buttonSpec.color1} to ${buttonSpec.color2},
    '${buttonSpec.text}' in ${buttonSpec.fontStyle} font,
    clean edges,
    game UI style,
    centered on white background
  `
}
```

Example for PLAY button:
```
game UI button element, rounded rectangle shape, 
gradient from bright blue #00D9FF to darker blue #0066CC, 
'PLAY' in bold white sans-serif font, clean edges, 
game UI style, centered on white background, production-ready asset
```

---

## Handbook Consistency System → Asset Hatch Character Registry

**From Handbook:**
> "Always include in every prompt for the same character: Complete physical description, Exact outfit description with HEX colors, Distinctive features, Art style keywords"

**Asset Hatch Implementation:**
```json
{
  "character_registry": {
    "hero_knight": {
      "physical_description": "young adult with blonde hair, fair skin, athletic build",
      "outfit": {
        "armor": "silver plate armor #C0C0C0",
        "cape": "red cloth cape #8B0000",
        "boots": "brown leather boots #8B4513"
      },
      "distinctive_features": "scar over left eye, gold cross pendant",
      "style_keywords": "16-bit pixel art, SNES RPG style, limited 16-color palette",
      "last_successful_seed": 12345,
      "animations": ["idle", "walk_left", "walk_right", "attack", "hurt"]
    }
  }
}
```

When generating new animation for hero_knight:
```typescript
const registryEntry = characterRegistry["hero_knight"]
const prompt = `
  pixel art sprite of ${registryEntry.physical_description},
  wearing ${registryEntry.outfit.armor} armor, ${registryEntry.outfit.cape} cape,
  ${registryEntry.outfit.boots} boots, with ${registryEntry.distinctive_features},
  ${newAnimationSpec},
  32x32 sprite,
  ${registryEntry.style_keywords},
  front-facing view, white background,
  consistent with established character design,
  game-ready asset
`
```

---

## Handbook Seed Control → Asset Hatch Reproducibility

**From Handbook:**
> "Use seed parameter for reproducible results. Maintain a seed registry"

**Asset Hatch Implementation:**
```json
{
  "generation_registry": [
    {
      "asset_id": "farmer_idle",
      "character": "farmer",
      "animation": "idle",
      "prompt": "[full prompt]",
      "seed": 42,
      "timestamp": "2025-01-15T10:30:00Z",
      "model": "flux-2-dev",
      "success": true
    },
    {
      "asset_id": "farmer_walk_left",
      "character": "farmer",
      "animation": "walk_left",
      "prompt": "[full prompt]",
      "seed": 43,  // Sequential for consistency
      "timestamp": "2025-01-15T10:31:00Z",
      "model": "flux-2-dev",
      "success": true
    }
  ]
}
```

Users can:
- View successful seeds per asset
- Regenerate with exact same seed for reproduction
- Use sequential seeds for animation frame consistency

---

## Handbook Prompt Length Guidelines → Asset Hatch Optimization

**From Handbook:**

| Asset Type | Recommended Length |
|----------|--------|
| Icons/simple assets | 15-30 words |
| Character sprites | 30-50 words |
| Sprite sheets | 40-60 words |
| Tilesets | 30-50 words |
| Complex scenes | 50-80 words |

**Asset Hatch Implementation:**
```typescript
function validatePromptLength(prompt: string, assetType: string) {
  const wordCount = prompt.split(' ').length
  
  const limits = {
    'icon': { min: 15, max: 35 },
    'character_sprite': { min: 30, max: 60 },
    'sprite_sheet': { min: 40, max: 70 },
    'tileset': { min: 30, max: 60 },
    'ui_element': { min: 25, max: 50 }
  }
  
  const limit = limits[assetType]
  if (wordCount > limit.max) {
    return { valid: false, message: `Prompt too long (${wordCount} words, max ${limit.max})` }
  }
  return { valid: true }
}
```

Asset Hatch warns if generated prompts exceed optimal length and suggests condensation.

---

## Handbook Common Pitfalls → Asset Hatch Prevention

### Pitfall 1: Frames Not Evenly Spaced

**From Handbook:**
> Solution: Add "evenly spaced frames", "uniform grid", "consistent spacing", "aligned to grid"

**Asset Hatch Prevention:**
```typescript
// Always included for sprite sheets
const spriteSheetKeywords = [
  "evenly spaced frames",
  "uniform grid alignment", 
  "consistent spacing",
  "aligned to grid"
]
```

### Pitfall 2: Character Changes Between Frames

**From Handbook:**
> Solution: Include complete character description in every prompt

**Asset Hatch Prevention:**
- Character registry system stores full description once
- Every animation frame for that character includes full description
- System warns if character details changed between frames

### Pitfall 3: Anti-Aliased Pixel Art

**From Handbook:**
> Solution: Add "no anti-aliasing", "hard pixel edges", "crisp pixels"

**Asset Hatch Prevention:**
- Pixel art style anchor automatically includes:
  ```
  "pixel-perfect edges", "hard pixel edges", 
  "no anti-aliasing", "crisp pixels"
  ```

### Pitfall 4: Photorealistic Instead of Stylized

**From Handbook:**
> Solution: Avoid "realistic", "photorealistic". Use "stylized", "game art style"

**Asset Hatch Prevention:**
```typescript
// Meta-prompt system filters out forbidden words
const forbiddenWords = [
  "photorealistic", "realistic", "4K", "8K", 
  "photography", "cinematic", "volumetric"
]

function sanitizePrompt(prompt: string) {
  forbiddenWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) {
      console.warn(`⚠️ Removed forbidden word: ${word}`)
      prompt = prompt.replace(new RegExp(word, 'gi'), '')
    }
  })
  return prompt
}
```

---

## Handbook Quality Keywords → Asset Hatch Final Markers

**From Handbook:**
> "Effective Quality Control: Be specific about desired outcome rather than using generic quality tags"

**Asset Hatch Implementation:**

Instead of generic tags, Asset Hatch uses:
```
"clean edges, polished finish, crisp details, game-ready asset"
```

NOT:
```
"masterpiece, best quality, 8k, ultra HD"
```

All prompts end with:
```typescript
const qualityMarker = "game-ready asset"  // Specific and proven effective
```

---

## Handbook No-Negative-Prompts Principle → Asset Hatch Framing

**From Handbook:**
> "The model does NOT support negative prompts—all instructions must be framed positively"

**Asset Hatch Implementation:**

```typescript
// WRONG (Flux.2 doesn't support this)
"pixel art sprite, no blur, no smooth, no gradient"

// RIGHT (Flux.2 supports this)
"pixel art sprite with crisp pixels, hard edges, flat colors"
```

Meta-prompt system actively converts negative framings:

```typescript
function convertToPositiveFraming(prompt: string) {
  const negativePatterns = {
    "no blur": "sharp focus, crisp edges",
    "no gradient": "flat colors, solid fills",
    "no anti-aliasing": "aliased edges, hard pixels",
    "no shadows": "flat lighting, even illumination",
    "no background": "isolated on white background"
  }
  
  let converted = prompt
  Object.entries(negativePatterns).forEach(([negative, positive]) => {
    if (prompt.includes(negative)) {
      converted = converted.replace(negative, positive)
    }
  })
  return converted
}
```

---

## Complete Example: Handbook → Asset Hatch Flow

### Step 1: User Creates Project (Planning Phase)
```
Game type: farming_sim
Art style: pixel_art
Resolution: 32x32
First asset: farmer character, idle pose
```

### Step 2: Planning Agent References Templates
- Handbook says: Character Sprites template
- Asset Hatch template selected

### Step 3: Style Anchor Created (Style Phase)
- User uploads style reference image
- Asset Hatch extracts:
  - Dominant colors → Hex codes
  - Art style → Keywords from handbook
  - Lighting approach → Handbook defaults for pixel art

### Step 4: Meta-Prompt Generates (Generation Phase)

**Handbook formula applied:**
```
[Subject: farmer character] +
[Pose: idle standing] +
[Style: 16-bit pixel art, SNES RPG style] +
[Color: limited 16-color palette] +
[View: front-facing] +
[Background: white] +
[Quality markers: game-ready asset]
```

**Asset Hatch final prompt:**
```
pixel art sprite of a farmer character with straw hat and overalls,
idle standing pose, 32x32 sprite, Stardew Valley 16-bit style,
limited 16-color palette with warm earth tones,
front-facing view, white background,
flat lighting, even illumination, crisp pixel edges,
matching style reference image,
consistent with established design,
game-ready asset
```

### Step 5: Flux.2 Dev Generates Image
- Handbook principles applied throughout
- Seed recorded for reproducibility
- Image saved to IndexedDB

### Step 6: Multiple Animations (Consistency)
- Character registry stores complete description
- Next animation includes full description again
- Same style keywords applied
- Seed tracked for consistency

---

## Reference: Quick Handbook Lookup in Asset Hatch

When building prompts, Asset Hatch can reference the handbook:

```typescript
const handBook = {
  templates: {
    character_sprite: "pixel art sprite of [character], [pose], [resolution], [style], [colors], [view], [background], [quality]",
    sprite_sheet: "sprite sheet of [character], [X] frames [arrangement], [animation], [resolution] per frame, consistent proportions...",
    tileset: "seamless tileset of [terrain], [size], [view], includes edge pieces and corners...",
    ui_element: "game UI [element type], [design style], [colors], [text], clean edges, game UI style...",
    icon: "[icon type] icon, [object description], [art style], [colors], clean outline..."
  },
  styleKeywords: {
    pixelArt: ["pixel-perfect edges", "hard pixel edges", "no anti-aliasing", "crisp pixels", "limited palette"],
    lighting: {
      sprites: ["flat lighting", "even illumination", "minimal shadows"],
      icons: ["soft diffused light", "studio lighting"]
    }
  },
  forbiddenWords: ["photorealistic", "realistic", "4K", "8K", "cinematic"],
  qualityMarkers: ["clean edges", "polished finish", "crisp details", "game-ready asset"]
}
```

---

## Summary

The Flux.2 Pro Prompting Handbook is **fully integrated** into Asset Hatch through:

1. **Template System** — All handbook templates implemented as Asset Hatch templates
2. **Style Control** — Handbook's pixel art and style keywords automated
3. **Color Handling** — HEX code system follows handbook's adjacent placement principle
4. **Consistency** — Handbook's character registry and seed control implemented
5. **Error Prevention** — Common pitfalls from handbook addressed automatically
6. **Quality Standards** — Handbook's proven quality markers used throughout
7. **Prompt Optimization** — Word order priority, length guidelines, positive framing all applied

Asset Hatch transforms handbook guidance into **automated, fool-proof prompt engineering** for game assets.
