# Asset Hatch - Flux.2 Dev Prompt Engineering Guide

## Overview

Asset Hatch uses **Black Forest Labs Flux.2 Dev** as the primary image generation model via OpenRouter, with support for Flux.2 Flex, Pro, and Max for different quality/speed tradeoffs. This guide details how to engineer prompts specifically for Asset Hatch's game asset generation workflow.

## Key Differences from Other Models

### Flux.2 Dev Strengths for Game Assets
- **Excellent consistency** when given detailed specifications
- **Strong text rendering** (important for UI elements)
- **Clean, sharp edges** ideal for pixel art and stylized assets
- **Fast inference** (good for iteration and batch processing)
- **No negative prompts** - frame everything positively
- Supports up to **8 reference images** for style anchoring
- Supports up to **32K token prompts** (plenty of context)

### What to Avoid
- Negative prompts (not supported)
- Vague descriptors ("good", "nice", "cool")
- Overly long prompts (diminishing returns after ~150 words)
- Generic quality tags ("masterpiece", "4K", "8K")

---

## Asset Hatch Integration Points

### 1. Style Anchor System

When Asset Hatch stores a style anchor:

```json
{
  "style_anchor": {
    "reference_image_id": "ref_001",
    "style_keywords": "16-bit pixel art, SNES RPG style, limited 16-color palette",
    "lighting_keywords": "flat lighting, even illumination",
    "color_palette": ["#2C3E50", "#E74C3C", "#F39C12", "#ECF0F1"],
    "flux_model": "black-forest-labs/flux-2-dev",
    "reference_images": ["style-test.png"]
  }
}
```

**Every generation prompt** includes these anchor elements automatically.

### 2. Meta-Prompt System

Asset Hatch's backend runs a meta-prompt that transforms user specifications into Flux-optimized prompts:

```
USER INPUT:
- Game type: farming_sim
- Art style: pixel_art
- Resolution: 32x32
- Character: farmer with straw hat
- Animation: idle pose
- Custom note: "like Stardew Valley"

↓ META-PROMPT ↓

FLUX OPTIMIZED PROMPT:
pixel art sprite of a farmer character wearing a straw hat, 
idle standing pose, 32x32 sprite, Stardew Valley-inspired 16-bit style, 
limited 16-color palette, front-facing view, 
white background, game-ready asset, matching style reference image
```

### 3. Reference Image Integration

Asset Hatch passes the style anchor image(s) to Flux via API:

```python
# Conceptual API call
response = openrouter.post(
  model="black-forest-labs/flux-2-dev",
  prompt=optimized_prompt,
  images=[style_test_base64],  # Style anchor image
  image_detail="high",
  width=512,  # Generate at 2x
  height=512
)
```

---

## Prompt Template by Asset Type

### Template Structure Formula

```
[asset_type] [subject] [pose/state] [resolution] [style_keywords] 
[style_anchor_reference] [color_specification] [view_direction] 
[background_type] [consistency_markers]
```

**Key rule:** Word order = priority. First 5 words carry highest weight.

---

## Character Sprites

### Standard Character Sprite

```
[asset type] pixel art sprite of [character description], 
[pose/action], [resolution] sprite, [era/style], 
[color palette note], [view direction], 
[background], [consistency notes], game-ready asset
```

**Example (from Asset Hatch planning):**
```
pixel art sprite of a farmer character with straw hat and overalls, 
idle standing pose, 32x32 sprite, Stardew Valley 16-bit style, 
limited 16-color palette using warm earth tones, front-facing view, 
white background, consistent with style reference image, game-ready asset
```

### Multi-Pose Character (Same Session)

When generating multiple poses of the same character, include **full description every time**:

```
pixel art sprite of [complete character description], 
[new pose/action different from previous], [same specs as before], 
matching the established character design, game-ready asset
```

**Example:**
```
pixel art sprite of a farmer character with straw hat and blue overalls, 
walking pose mid-stride facing left, 32x32 sprite, Stardew Valley 16-bit style, 
limited 16-color palette, side-facing view, white background, 
consistent with established character design and style reference, game-ready asset
```

### Pro Tip: Character Registry in Asset Hatch

Store in memory:
```json
{
  "characters": {
    "farmer": {
      "base_description": "farmer character with straw hat, weathered blue overalls, brown boots",
      "color_hex": {
        "hat": "#D4AF37",
        "overalls": "#003366",
        "boots": "#8B4513"
      },
      "style_keywords": "16-bit pixel art, Stardew Valley style",
      "poses_generated": ["idle", "walk_left", "walk_right"]
    }
  }
}
```

Then reference in prompts: "the established farmer character (straw hat, blue overalls, brown boots #003366)"

---

## Sprite Sheets (Animation Frames)

### Grid Format Specification

```
sprite sheet of [character], [X] frames arranged [arrangement type], 
[animation type] animation, [resolution] per frame, 
consistent proportions, evenly spaced, [style], 
[view], [background], game-ready asset
```

**Arrangement types:**
- "horizontally in a single row"
- "in a 2x4 grid (2 rows, 4 columns)"
- "vertically stacked"
- "in 4 rows of 2 frames each"

### Walk Cycle Example

```
sprite sheet of farmer character with straw hat and blue overalls, 
8 frames arranged horizontally in a single row, walk cycle animation 
showing contact, passing, and aerial positions, 32x32 per frame, 
consistent proportions throughout, evenly spaced and aligned, 
16-bit pixel art Stardew Valley style, side view, white background, 
game-ready asset
```

### Idle/Breathing Animation

```
sprite sheet of warrior character in silver armor, 
4 frames arranged horizontally, idle breathing animation with subtle 
chest rise and fall, 32x32 per frame, consistent character design 
across frames, 16-bit SNES RPG style, front-facing view, 
white background, game-ready asset
```

### Attack Sequence

```
sprite sheet of knight character, 8 frames arranged horizontally, 
sword attack animation showing wind-up, mid-swing strike, and recovery poses, 
64x64 per frame, consistent lighting and proportions, side view, 
medieval fantasy pixel art style, white background, game-ready asset
```

### Frame Consistency Essentials

**Always include in sprite sheet prompts:**
- "consistent proportions throughout"
- "evenly spaced frames"
- "uniform grid alignment"
- "same character design across all frames"
- "matching lighting in each frame"
- "sequential poses showing [animation type] progression"

---

## Tilesets

### Seamless Tileset Base

```
seamless tileset of [terrain/element type], [X]x[X] tile size, 
[view angle], includes edge pieces and corner variations, 
[color specification], [style], consistent lighting, 
tileable pattern, game-ready asset
```

### Ground/Grass Tileset

```
seamless pixel art tileset for platformer game, grass ground tiles 
with dirt edges, 32x32 tile size, side-view perspective, 
includes center fill tiles, edge tiles (top, bottom, left, right), 
inner corners, outer corners, and transitions, 16-bit style, 
consistent top-down lighting, tileable pattern, game-ready asset
```

### Water Tiles

```
seamless water tileset with subtle animated wave pattern, 
32x32 tile size, top-down view, includes shore transition tiles 
where water meets grass, gentle blue-green color palette, 
RPG tileset style, tileable pattern, game-ready asset
```

### Forest/Terrain

```
seamless forest ground tileset, 32x32 tile size, top-down view, 
includes grass center, dirt edges, forest litter, transition tiles, 
corner variations, nature colors, consistent lighting from above, 
RPG style, tileable pattern, game-ready asset
```

**Critical for tilesets:** Use "seamless", "tileable", and "includes edge pieces and corner variations"

---

## UI Elements

### Buttons

```
game UI button element, [shape], [color/gradient], 
'[BUTTON TEXT]' in [font style], [size specification], 
[additional details], clean sharp edges, centered on white background, 
game HUD style, production-ready asset
```

**Example:**
```
game UI button element, rounded rectangle shape, gradient from bright blue #00D9FF 
to darker blue #0066CC, 'PLAY' in bold white sans-serif font, 256x64 pixels, 
slight beveled 3D effect, clean sharp edges, centered on white background, 
game HUD style, production-ready asset
```

### Health/Status Bars

```
horizontal [health/mana] bar UI element, [fill color] at [X]% fill, 
[frame style] border, [size], [decorative elements if any], 
game HUD style, isolated on white background, production-ready asset
```

### Menu Panels

```
game menu panel frame, [style] border, [size specification], 
empty transparent center for game content, [decorative elements], 
[color scheme], game UI style, isolated on white background, 
production-ready asset
```

---

## Icons (Inventory/Skills/Status)

### Item Icon

```
[item type] inventory icon, [item visual description], 
[art style] game icon style, [color palette/HEX], 
clean outline, centered on white background, 16x16 or 32x32 pixel size, 
game asset style, production-ready
```

**Example:**
```
healing potion inventory icon, red potion bottle with golden cork and glowing 
liquid visible inside, stylized fantasy RPG icon style, colors #FF3333 and #FFD700, 
clean black outline, centered on white background, 32x32 pixel size, 
game asset style, production-ready
```

### Ability/Spell Icon

```
[element/ability] spell icon, [visual representation of effect], 
circular frame with decorative border, [art style] fantasy game icon, 
bold [color], crisp edges, centered on white background, 32x32 pixels, 
production-ready asset
```

### Status Effect Icon

```
[status effect name] status effect icon, [visual indicator of effect], 
[art style] game status icon, [color scheme], 
circular or square shape, crisp outline, centered on white background, 
32x32 pixels, production-ready asset
```

---

## Color Control in Prompts

### Hex Code Specification

Place hex codes **adjacent to the element they color**:

```
farmer wearing blue #003366 overalls and hat with gold #D4AF37 trim
```

NOT:
```
farmer in colors #003366 and #D4AF37 with blue overalls and gold hat
```

### Palette Specification

```
limited color palette using these specific colors: #2C3E50, #E74C3C, 
#F39C12, #ECF0F1, with all shades derived from these base colors
```

### Console-Specific Palettes

- **NES (8-bit):** "NES palette, 25 on-screen colors, 4 colors per sprite"
- **SNES (16-bit):** "SNES palette, 16 colors per sprite, limited color palette"
- **Game Boy:** "Game Boy monochrome, 4-shade green palette"
- **Master System:** "Sega Master System palette, 64 available colors"

---

## Lighting Keywords

### For Pixel Art (Recommended)

```
flat lighting, even illumination, no dramatic shadows, 
simple shading, game-ready lighting
```

### For Illustrated Assets

```
soft diffused light, studio lighting, gentle shadows, consistent direction
```

### By Asset Type

| Asset Type | Lighting Keywords |
|------------|-------------------|
| Sprites | "flat lighting", "even illumination", "minimal shadows" |
| UI elements | "uniform lighting", "no shadows", "clean bright" |
| Icons | "soft diffused light", "studio lighting" |
| Backgrounds | "atmospheric lighting", "ambient light", "soft shadows" |
| Tilesets | "consistent top-down lighting", "even illumination" |

---

## Perspective/View Keywords

### Top-Down (RPG/Strategy)
```
top-down view, bird's-eye perspective, overhead angle, 
RPG world view, looking straight down
```

### Side-View (Platformer)
```
side view, profile perspective, 2D side-scroller style, 
platformer view, horizontal plane
```

### Isometric
```
isometric view, 2.5D perspective, 2:1 ratio isometric, 
strategy game isometric view, angled perspective
```

### Front-Facing (Portraits/UI)
```
front view, facing toward camera, straight-on perspective, 
portrait orientation
```

---

## Reference Image Usage in Asset Hatch

### How Style Anchor Works

1. **User uploads style reference image**
2. **Asset Hatch analyzes:** color palette, art style, proportions
3. **Every generation prompt includes:** "matching the style of the reference image"
4. **Flux.2 can see the image:** And uses it for visual consistency

### Prompt Integration

```
[standard asset prompt] + 
"visually consistent with the provided style reference image" +
"matching the color palette and art style of the reference"
```

### Multiple Reference Images

Asset Hatch can store and pass **up to 8 reference images**:

```json
{
  "reference_images": [
    {"type": "style_anchor", "path": "style-test.png"},
    {"type": "character_example", "path": "hero-example.png"},
    {"type": "palette_reference", "path": "colors.png"}
  ]
}
```

Then prompt includes:
```
matching style from reference image 1, using character proportions from reference 2, 
using exact color palette from reference 3
```

---

## Meta-Prompt Template for Asset Hatch

This is how Asset Hatch's backend transforms user selections → Flux prompts:

```
[SYSTEM PROMPT TO BACKEND]

Take these Asset Hatch project inputs and create an optimized Flux.2 Dev prompt.

INPUTS:
- Asset type: [type]
- Game type: [type]
- Art style: [style]
- Base resolution: [res]
- Mood: [mood]
- Theme: [theme]
- Color palette: [colors/HEX codes]
- Custom notes: [user input]
- Style anchor keywords: [extracted from reference image]

OUTPUT PROMPT STRUCTURE:
1. Asset type + subject (highest priority)
2. Pose/action/state (if relevant)
3. Resolution specification
4. Style keywords from anchor
5. Color palette (with HEX codes if specified)
6. View/perspective
7. Lighting keywords
8. Background specification
9. Consistency markers
10. Game-ready marker

EXAMPLE OUTPUT:
"pixel art sprite of [subject], [pose], [resolution] sprite, 
[style keywords], [color note], [view], [background], 
consistent with style reference image, game-ready asset"

RULES:
- Never use negative prompts
- Put most important elements first
- Keep under 150 words
- Include "game-ready asset" at end
- Reference style anchor if provided
- Include specific HEX codes if palette specified
```

---

## Model Selection in Asset Hatch

### Flux.2 Dev (Recommended for v1)
```
Model: black-forest-labs/flux-2-dev
Speed: Fast (good for iteration)
Quality: Excellent for game assets
Cost: Low
Use: Production game assets
```

### Flux.2 Flex
```
Model: black-forest-labs/flux-2-flex
Speed: Medium
Quality: High (slightly better than Dev)
Cost: Medium
Use: Assets requiring higher detail
```

### Flux.2 Pro
```
Model: black-forest-labs/flux-2-pro
Speed: Slow
Quality: Very High (best available)
Cost: High
Use: Final polish, premium assets
```

### User Selection Flow

```
Asset Hatch UI:
┌─────────────────────────────┐
│ Generation Settings         │
│                             │
│ Model: [Dropdown]           │
│  ├─ Flux.2 Dev (default)    │
│  ├─ Flux.2 Flex             │
│  ├─ Flux.2 Pro              │
│  └─ Flux.2 Max              │
│                             │
│ Speed/Quality Slider        │
│ [■────────────]             │
│  Fast        Detailed       │
└─────────────────────────────┘
```

---

## Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Frames inconsistent | Missing full character description | Include complete desc in every frame prompt |
| Wrong frame count | Vague grid specification | Use explicit: "exactly 8 frames horizontally" |
| Anti-aliased pixel art | Missing Flux keywords | Add: "crisp pixel edges", "hard edges", "aliased" |
| Text rendered poorly | Text too small/complex | Use clear text, medium size, bold font styles |
| Color mismatch | Not using HEX codes | Specify exact HEX: color #003366, not "blue" |
| Tiles don't match edges | Missing seamless keyword | Use "seamless", "tileable", "edge-matching" |
| Background issues | Vague background spec | Specify exact: "white background", "transparent" |
| Inconsistent style | No style anchor reference | Include: "matching style reference image" |

---

## Batch Generation Best Practices

### Sequential Generation Pattern

```
1. Generate first asset (e.g., character idle pose)
2. Record successful seed and prompt
3. For next asset of same character:
   - Include full character description (unchanged)
   - Describe new pose/animation
   - Reference same style keywords
   - (optionally use same seed for slight variations)
4. Repeat for all poses/animations

Asset Hatch stores:
{
  "character_farmer": {
    "base_prompt": "[full character description]",
    "successful_seed": 12345,
    "animations": {
      "idle": { "prompt_suffix": "idle standing pose", "seed": 12345 },
      "walk": { "prompt_suffix": "walking pose mid-stride", "seed": 12346 },
      "work": { "prompt_suffix": "working animation bending over", "seed": 12347 }
    }
  }
}
```

### Consistency Maintenance

Asset Hatch automatically:
1. ✅ Includes style anchor keywords in every prompt
2. ✅ Includes character registry details in every character prompt
3. ✅ Logs successful seeds for consistency
4. ✅ Warns if major changes (art style, palette) are made mid-project
5. ✅ Allows regeneration with same seed for exact reproduction

---

## Environment Variables for Flux.2

```env
OPENROUTER_API_KEY=your_key_here

# Optional overrides
FLUX_MODEL_PRIMARY=black-forest-labs/flux-2-dev
FLUX_MAX_TOKENS=32000
FLUX_TEMPERATURE=0.7  # Creative but focused
FLUX_TIMEOUT=120  # seconds
```

---

## API Integration Example

```typescript
// Asset Hatch API route for generation
async function generateAsset(projectId: string, assetSpec: AssetSpec) {
  // Get style anchor from project memory
  const styleAnchor = await memory.getFile(projectId, 'style-anchor.json')
  
  // Build optimized prompt
  const prompt = buildFlux2Prompt({
    assetType: assetSpec.type,
    subject: assetSpec.name,
    styleKeywords: styleAnchor.style_keywords,
    colorPalette: styleAnchor.color_palette,
    specifications: assetSpec.specs
  })
  
  // Call OpenRouter Flux.2 Dev
  const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux-2-dev',
      prompt: prompt,
      images: [styleAnchor.reference_image_base64],  // Style anchor image
      size: '512x512',
      n: 1
    })
  })
  
  const imageData = await response.json()
  
  // Save to IndexedDB
  await db.saveAsset(projectId, {
    name: assetSpec.name,
    imageBlob: imageData.data[0].b64_json,
    prompt: prompt,
    model: 'flux-2-dev'
  })
  
  return imageData
}
```

---

## Quality Checklist

Before exporting assets, verify:

- [ ] All assets use consistent style keywords from anchor
- [ ] Colors match palette (use HEX codes)
- [ ] Character designs consistent across animations
- [ ] Grid alignment correct on sprite sheets
- [ ] Tilesets have proper edge matching
- [ ] UI elements readable and clean
- [ ] Icons distinctive and clear
- [ ] Background specifications followed
- [ ] Lighting consistent within category
- [ ] Resolution correct for each asset type

---

## Future Model Support

Asset Hatch's architecture allows easy addition of new models:

```typescript
interface ImageGenerationProvider {
  modelId: string
  provider: 'openrouter' | 'replicate' | 'together'
  costPer1kTokens: number
  speedRating: number  // 1-10
  qualityRating: number  // 1-10
  maxContextImages: number
  supportsNegativePrompts: boolean
}

const supportedModels: ImageGenerationProvider[] = [
  { modelId: 'black-forest-labs/flux-2-dev', ... },
  { modelId: 'black-forest-labs/flux-2-pro', ... },
  // Add DALL-E 3, Midjourney, SD 3.5, etc. as available
]
```

Users can select different models per project or even per asset based on complexity/budget.

---

*This guide is the complete reference for using Flux.2 models within Asset Hatch's prompt engineering system. The meta-prompt system automatically applies these principles to transform user specifications into optimal Flux.2 prompts.*
