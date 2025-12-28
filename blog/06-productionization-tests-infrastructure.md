---
title: "Part 6: Productionization - Tests & Infrastructure"
series: "Building Asset Hatch with AI Agents"
part: 6
date: 2025-12-26
updated: 2025-12-27
tags: [Testing, Jest, Flux.2, Prompt Engineering, Infrastructure, Next.js]
reading_time: "12 min"
status: published
---

# Part 6: Productionization - Tests & Infrastructure

**Previously:** Solved the hybrid persistence architecture. Dexie for client, Prisma for server, sync between them.

**Now:** Time to build the generation infrastructure and make this production-ready.

## The Test-First Pivot

After two architectural crises (CopilotKit failure, IndexedDB in Node.js), I decided: **no more surprises**. Every API route gets integration tests *before* building complex features on top.

### Jest + Next.js 16 Configuration Hell

**Attempt 1:**

```bash
bun add -D jest @testing-library/react @testing-library/jest-dom
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // For React component tests
};
```

**Run tests:**

```
Error: Cannot find module 'server-only'
  from node_modules/next/dist/client/components/headers.js
```

**Problem:** Next.js 16 has React Server Components. Some modules are `'use client'`, some are `'use server'`. Jest's single `testEnvironment` can't handle both.

**Attempt 2: Environment per file**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node', // Default to node
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
};
```

```typescript
// __tests__/components/QualitiesBar.test.tsx
/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
// ...
```

**Result:** ✅ Works! API routes use `node`, React components use `jsdom`.

### Integration Test Pattern

```typescript
// __tests__/api/chat/route.test.ts
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route';
import { prisma } from '@/lib/prisma';

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    memoryFile: {
      upsert: jest.fn(),
    },
  },
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates quality when AI calls updateQuality tool', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Set art style to pixel art' },
        ],
        qualities: {},
        projectId: 'test-project-id',
      }),
    });

    (prisma.project.update as jest.Mock).mockResolvedValue({
      id: 'test-project-id',
      artStyle: 'Pixel Art',
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'test-project-id' },
      data: expect.objectContaining({
        artStyle: 'Pixel Art',
      }),
    });
  });

  it('updates plan when AI calls updatePlan tool', async () => {
    const planMarkdown = '# Asset Plan\n## Characters\n- Farmer';

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Show me a plan' },
        ],
        projectId: 'test-project-id',
      }),
    });

    (prisma.memoryFile.upsert as jest.Mock).mockResolvedValue({
      id: 'file-id',
      content: planMarkdown,
    });

    const response = await POST(request as any);

    expect(prisma.memoryFile.upsert).toHaveBeenCalled();
  });
});
```

**Coverage:**
- ✅ `/api/chat` - Tool calling, quality updates, plan updates
- ✅ `/api/analyze-style` - Style keyword extraction
- ✅ `/api/generate` - Prompt building, OpenRouter integration

**Total:** 8 integration tests across 3 API routes

## Generation Infrastructure (The P0 Build)

With tests in place, I implemented the complete generation workflow:

### 1. Prompt Templates by Asset Type

```typescript
// lib/prompt-templates.ts
export const CHARACTER_SPRITE_TEMPLATE = (
  description: string,
  qualities: Qualities,
  styleKeywords: string
) => {
  // First 5 words carry highest weight in Flux.2
  return [
    `${qualities.art_style} sprite of`,    // Art style
    description,                             // Character details
    `${qualities.perspective} view,`,       // Perspective
    `${qualities.base_resolution},`,        // Resolution
    styleKeywords,                           // Style anchor keywords
    qualities.mood,                          // Mood
    qualities.theme,                         // Theme
  ].filter(Boolean).join(' ');
};

// Examples for each asset type:
// - CHARACTER_SPRITE_TEMPLATE
// - ENVIRONMENT_TILESET_TEMPLATE
// - UI_ELEMENT_TEMPLATE
// - ICON_TEMPLATE
// - PROP_TEMPLATE
// - ANIMATION_SPRITESHEET_TEMPLATE
```

**Why templates?**
- Word order matters (Flux.2 weighs first 5 words heaviest)
- Consistency across all assets
- Easy to A/B test prompt improvements

### 2. Prompt Builder with Priority Ordering

```typescript
// lib/prompt-builder.ts
export function buildAssetPrompt(
  asset: ParsedAsset,
  project: Project,
  styleAnchor: StyleAnchor,
  characterRegistry?: CharacterRegistry
): string {
  const qualities = extractQualities(project);

  // Select template based on asset type
  const template = getTemplateForAssetType(asset.assetType);

  // Build description
  const description = asset.assetType === 'character' && characterRegistry
    ? `${asset.name} character with ${characterRegistry.base_description}`
    : asset.description;

  // Generate prompt
  const prompt = template(description, qualities, styleAnchor.style_keywords);

  // Validate length (Flux.2 limit: 256 tokens)
  if (prompt.split(' ').length > 200) {
    console.warn('Prompt may exceed token limit:', prompt.length);
  }

  return prompt;
}
```

### 3. Plan Parser (Composite vs Granular)

```typescript
// lib/plan-parser.ts
export function parsePlan(
  planMarkdown: string,
  mode: 'composite' | 'granular' = 'composite'
): ParsedAsset[] {
  const lines = planMarkdown.split('\n');
  const assets: ParsedAsset[] = [];

  let currentCategory: Category | null = null;

  for (const line of lines) {
    // Parse headers: ## Characters
    if (line.startsWith('## ')) {
      currentCategory = extractCategory(line);
      continue;
    }

    // Parse entities: - **Farmer** (Player character)
    if (line.startsWith('- **')) {
      const match = line.match(/- \*\*(.+?)\*\* \((.+?)\)/);
      if (!match) continue;

      const [_, name, description] = match;

      // Auto-detect asset type
      const assetType = inferAssetType(currentCategory, name, description);

      // Handle animations
      if (description.includes('animation') || description.includes('frames')) {
        if (mode === 'composite') {
          // One sprite sheet with all frames
          assets.push({
            name: `${name} Sprite Sheet`,
            assetType: 'character-sprite-sheet',
            category: currentCategory!,
            description,
            frames: extractFrameCount(description),
          });
        } else {
          // Individual frames
          const frames = extractFrameCount(description);
          for (let i = 0; i < frames; i++) {
            assets.push({
              name: `${name} Frame ${i + 1}`,
              assetType: 'character-sprite',
              category: currentCategory!,
              description: `${description} (frame ${i + 1})`,
            });
          }
        }
      } else {
        assets.push({
          name,
          assetType,
          category: currentCategory!,
          description,
        });
      }
    }
  }

  return assets;
}
```

**Why composite by default?**
- Game engines expect sprite sheets
- 1 API call instead of 4 (cheaper, faster)
- LLM-friendly (AI coding agents can see full sheet)

### 4. Image Utilities

```typescript
// lib/image-utils.ts
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function base64ToBlob(base64: string): Promise<Blob> {
  const res = await fetch(base64);
  return res.blob();
}

export async function extractColorPalette(imageBlob: Blob): Promise<string[]> {
  const img = new Image();
  img.src = URL.createObjectURL(imageBlob);

  await new Promise(resolve => (img.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Simple color quantization (production would use ColorThief)
  const colors = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  // Return top 8 colors by frequency
  return Array.from(colors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
}
```

### 5. Generation API Route

```typescript
// app/api/generate/route.ts
export async function POST(req: Request) {
  const { projectId, assetId } = await req.json();

  // 1. Load context from Prisma (server-side)
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const styleAnchor = await prisma.styleAnchor.findFirst({ where: { projectId } });
  const planFile = await prisma.memoryFile.findFirst({
    where: { projectId, fileName: 'entities.json' },
  });

  const plan = parsePlan(planFile.content);
  const asset = plan.find(a => a.id === assetId);

  // 2. Build prompt
  const prompt = buildAssetPrompt(asset, project, styleAnchor);

  // 3. Generate with Flux.2
  const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux.2-dev',
      prompt,
      images: [styleAnchor.reference_image_base64], // Style anchor!
      n: 1,
      size: project.baseResolution || '1024x1024',
    }),
  });

  const data = await response.json();
  const imageUrl = data.data[0].url;

  // 4. Download and save
  const imageBlob = await fetch(imageUrl).then(r => r.blob());

  await prisma.generatedAsset.create({
    data: {
      projectId,
      assetId,
      image_blob: Buffer.from(await imageBlob.arrayBuffer()),
      prompt_used: prompt,
      status: 'generated',
      generation_metadata: JSON.stringify({
        model: 'flux.2-dev',
        seed: data.data[0].seed,
        cost: calculateCost(project.baseResolution),
      }),
    },
  });

  return Response.json({ success: true, assetId });
}
```

## Multi-Mode Planning UI

One last architectural decision: **Keep users in one page, switch modes** instead of navigating between separate pages.

```
┌────────────────────────────────────────────┐
│ [Plan] [Style] [Generation]  📄 Files [▼] │ ← Tabs
├────────────────┬───────────────────────────┤
│                │                           │
│  Chat (Left)   │   Right Panel (Mode)      │
│                │                           │
│  - User msgs   │   Plan Mode:              │
│  - AI msgs     │   └─ Markdown preview     │
│  - Tools       │                           │
│                │   Style Mode:             │
│  (Persists     │   └─ Image upload        │
│   across       │   └─ Keyword editor       │
│   modes)       │   └─ Color palette        │
│                │                           │
│                │   Generation Mode:        │
│                │   └─ Asset queue          │
│                │   └─ Progress tracking    │
└────────────────┴───────────────────────────┘
```

**Why?**
- Consistent UX (don't lose chat context)
- Natural workflow (continue conversation across phases)
- No page transitions (faster, smoother)
- File menu accessible (see saved files anytime)

**Implementation:**

```typescript
// app/project/[id]/planning/page.tsx
export default function PlanningPage({ params }: { params: { id: string } }) {
  const [mode, setMode] = useState<'plan' | 'style' | 'generation'>('plan');

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left: Chat (always visible) */}
      <ChatInterface projectId={params.id} />

      {/* Right: Mode-specific panel */}
      <div>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="generation">Generation</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'plan' && <PlanPreview />}
        {mode === 'style' && <StyleAnchorEditor />}
        {mode === 'generation' && <GenerationQueue />}
      </div>
    </div>
  );
}
```

## The Results

**Test Coverage:**
- 8 integration tests
- 100% coverage on API routes
- ✅ All passing

**Generation Infrastructure:**
- 6 prompt templates
- Priority-ordered prompt builder
- Plan parser (composite + granular modes)
- Image utilities (blob conversion, color extraction)
- Full `/api/generate` route

**Architecture:**
- Single-page multi-mode UI
- Hybrid persistence working smoothly
- ~2,904 lines of production code added in one day

**Commits:**

```bash
commit a4846e7 - Complete P0 generation infrastructure
commit bb2833b - Add plan parser and multi-mode planning page
commit f401d5a - Add style phase AI tools and integration
commit 0345fda - Complete core AI integration
```

---

## What I Learned

**1. Tests prevent architecture surprises**

After CopilotKit and IndexedDB failures, tests gave confidence each piece worked before building on it.

**2. Prompt engineering is software engineering**

Templates, priority ordering, token limits—it's not just "vibes," it's architecture.

**3. Word order matters in image models**

Flux.2 weighs first 5 words heaviest. `"pixel art sprite of farmer"` beats `"a farmer sprite in pixel art style"`.

**4. Composite > Granular by default**

Game devs expect sprite sheets. LLMs can see full sheets better. Fewer API calls.

**5. Style anchors are critical**

Without reference images, every asset looks different. With them, consistency jumps dramatically.

**6. Multi-mode beats multi-page**

Keeping users in one context with mode switching is smoother than full-page navigations.

---

## Coming Next

In [Part 7: Reflections](07-reflections-lessons-learned.md), the final post.

What worked. What didn't. What I'd change. Advice for anyone building with AI agents in 2025.

**Spoiler:** AI-first development is real, but not in the way the marketing says it is.

---

**Commit References:**
- `a4846e7` - Complete P0 generation infrastructure implementation
- `bb2833b` - Add plan parser and multi-mode planning page
- `f401d5a` - Add style phase AI tools and integration
- `0345fda` - Complete core AI integration

**Files Created:**
- `/lib/prompt-templates.ts` - 6 asset-type templates
- `/lib/prompt-builder.ts` - Priority-ordered generation
- `/lib/plan-parser.ts` - Markdown → ParsedAsset[]
- `/lib/image-utils.ts` - Blob/base64, color extraction
- `/app/api/generate/route.ts` - Generation endpoint
- `/__tests__/**/*.test.ts` - 8 integration tests

**Total Lines Added:** ~2,904

---

**Previous:** [← Part 5: The Architecture](05-the-architecture-hybrid-persistence.md)
**Next:** [Part 7: Reflections →](07-reflections-lessons-learned.md)
