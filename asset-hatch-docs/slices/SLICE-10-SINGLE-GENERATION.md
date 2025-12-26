# Slice 10: Generate ONE Asset and See It

## User Story
**As a user, I can click "Generate" on a single asset and see the generated image appear.**

## What This Slice Delivers
- OpenRouter API integration for Flux.2
- Prompt builder using style anchor
- Single asset generation
- Generated image display
- Asset storage in IndexedDB

## Acceptance Criteria
- [ ] Asset list visible on generation page
- [ ] Each asset has a "Generate" button
- [ ] Click generate → see loading state
- [ ] Generated image appears after ~10-30 seconds
- [ ] Image saved to IndexedDB
- [ ] Can view generated image at full size

## Files Created/Modified
```
app/
├── api/
│   └── generation/route.ts          # NEW: Image generation API
└── project/[id]/generation/page.tsx # MODIFY: Add asset list + generation

components/
└── generation/
    └── AssetCard.tsx                # NEW: Single asset with generate button

lib/
├── db.ts                            # MODIFY: Add assets table
└── prompt-builder.ts                # NEW: Build prompts for Flux.2
```

## This Is the Critical Slice

This slice proves the core value proposition works. Take your time and test thoroughly.

## Prompt for AI Agent

```
Add single asset generation with Flux.2 via OpenRouter.

DATABASE UPDATE (lib/db.ts):
Add assets table:

```typescript
export interface Asset {
  id: string;
  project_id: string;
  entity_id: string;  // Links to entity in entities.json
  category: 'characters' | 'environment' | 'props' | 'ui' | 'icons';
  name: string;
  image_blob: Blob;
  prompt_used: string;
  seed: number;
  approved: boolean;
  created_at: string;
}

// Update schema version
this.version(3).stores({
  projects: 'id, phase, created_at',
  memory_files: 'id, project_id, type, updated_at',
  assets: 'id, project_id, entity_id, category, created_at'
});
```

PROMPT BUILDER (lib/prompt-builder.ts):
Create prompt following Flux.2 guidelines from your spec docs:

```typescript
interface PromptInput {
  entity: {
    category: string;
    name: string;
    description: string;
    specifications: string[];
  };
  styleAnchor: {
    art_style: string;
    style_description: string;
    color_palette: string[];
  };
  qualities: {
    base_resolution: string;
    perspective: string;
  };
}

export function buildPrompt(input: PromptInput): string {
  const { entity, styleAnchor, qualities } = input;
  
  // Template based on category
  const categoryTemplates = {
    characters: `${styleAnchor.art_style} sprite of ${entity.description}, ${qualities.base_resolution} resolution, ${qualities.perspective} view, ${entity.specifications.join(', ')}, using colors ${styleAnchor.color_palette.slice(0, 3).join(' ')}, white background, game-ready asset`,
    
    environment: `${styleAnchor.art_style} tileset of ${entity.description}, ${qualities.base_resolution} tiles, seamless edges, ${styleAnchor.style_description}, using colors ${styleAnchor.color_palette.slice(0, 3).join(' ')}, game-ready asset`,
    
    props: `${styleAnchor.art_style} game prop ${entity.name}, ${entity.description}, ${qualities.base_resolution}, ${styleAnchor.style_description}, centered on white background, game-ready asset`,
    
    ui: `game UI element ${entity.name}, ${entity.description}, ${styleAnchor.art_style} style, clean edges, ${styleAnchor.color_palette[0]} accent color, white background, game UI asset`,
    
    icons: `${styleAnchor.art_style} game icon of ${entity.description}, ${qualities.base_resolution}, clear silhouette, ${styleAnchor.color_palette.slice(0, 2).join(' ')} colors, centered, transparent background ready, game icon asset`
  };
  
  return categoryTemplates[entity.category] || categoryTemplates.props;
}
```

GENERATION API (app/api/generation/route.ts):
Create POST endpoint for image generation:

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt, seed } = await request.json();
  
  const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux-schnell',  // Fast model for testing
      prompt: prompt,
      n: 1,
      size: '512x512',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }
  
  const data = await response.json();
  return NextResponse.json({ 
    image_url: data.data[0].url,
    seed: seed 
  });
}
```

Note: Using flux-schnell for speed. Can switch to flux-2-dev later.

ASSET CARD (components/generation/AssetCard.tsx):
Display single entity with generation:

- Entity name (bold)
- Category badge
- Description (smaller text)
- "Generate" button
- Loading state: spinner + "Generating..."
- After generation: show image thumbnail
- Click thumbnail: show full size modal

Props:
- entity: Entity object
- asset: Asset | null (generated asset if exists)
- onGenerate: () => void
- isGenerating: boolean

GENERATION PAGE (app/project/[id]/generation/page.tsx):
- Load entities from entities.json
- Load existing assets from assets table
- Display list of AssetCard components
- Match assets to entities by entity_id
- Handle generate click:
  1. Set loading state for that entity
  2. Build prompt using buildPrompt()
  3. Call /api/generation with prompt
  4. Fetch image from returned URL
  5. Convert to Blob
  6. Save to assets table
  7. Update UI to show generated image

VERIFY:
1. Go to generation page (after confirming style)
2. See list of entities from plan
3. Click "Generate" on one entity
4. See loading spinner
5. After 10-30 seconds, see generated image
6. Image matches the style (colors, art style)
7. Refresh page - generated image still there
8. Click image - see full size
```

## GATE CHECK: Generation Produces Styled Output

After this slice works, validate:

1. [ ] Generated image uses colors from style anchor
2. [ ] Art style matches style description
3. [ ] Resolution looks correct
4. [ ] Image is game-asset quality (not photo-realistic)

If images don't match style, adjust prompt builder before continuing.

## How to Verify

1. Go to generation page
2. See asset list from plan
3. Click "Generate" on first asset
4. See loading indicator
5. Image appears (10-30 seconds)
6. Image has correct colors from palette
7. Image matches art style
8. Refresh - image persists

## What NOT to Build Yet
- No approve/regenerate (Slice 11)
- No batch generation (Slice 12)
- No progress bar (Slice 13)

## Troubleshooting

If generation fails:
1. Check OPENROUTER_API_KEY is valid
2. Check console for API errors
3. Try simpler prompt
4. Check OpenRouter dashboard for rate limits

If style doesn't match:
1. Add more color HEX codes directly in prompt
2. Add style keywords earlier in prompt
3. Be more specific about art style

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- [ ] **GATE VALIDATED: Generated assets match style**
- Date: ___
