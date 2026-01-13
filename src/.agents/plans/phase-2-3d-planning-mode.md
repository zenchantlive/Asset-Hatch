# Feature: Phase 2 - 3D Planning Mode

The following plan should be complete, but it's important to validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Add 3D-specific planning chat experience to Asset Hatch. When a project is in 3D mode, the AI uses a modified system prompt that generates plans with `[RIG]`/`[STATIC]` tags instead of 2D mobility tags (`[MOVEABLE:N]`). A new 3D plan parser extracts rigging requirements and animation metadata from these plans.

## User Story

As a game developer creating a 3D project
I want the AI to plan assets with 3D-specific metadata like rigging and animation requirements
So that I can generate 3D meshes that are properly prepared for the full Tripo3D pipeline

## Problem Statement

The existing chat system prompt and plan parser are designed for 2D sprites. They use `[STATIC]`, `[MOVEABLE:4/8]`, and `[ANIM:N]` tags that don't make sense for 3D models. 3D assets need different metadata: should the mesh be rigged? What animation presets should be applied?

## Solution Statement

1. Create 3D-specific AI SDK tools (`updateQuality3D`, `updatePlan3D`, `finalizePlan3D`) as parallel implementations
2. Create a 3D-specific system prompt for the chat route that instructs the AI to use `[RIG]` and `[STATIC]` tags
3. Create a new 3D plan parser (`lib/3d-plan-parser.ts`) that extracts these tags and animation requirements
4. Add conditional logic to the chat route to select 3D prompt and tools when `project.mode === '3d'`
5. Create Zod schemas for 3D-specific tool inputs

> [!IMPORTANT]
> **2D Code Isolation:** All changes are additive. The existing 2D tools (`updateQuality`, `updatePlan`, `finalizePlan`, etc.) remain completely untouched. The chat route uses conditional logic to select the appropriate toolset based on project mode.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Chat API, Plan Parsing
**Dependencies**: Phase 1 types (`lib/types/3d-generation.ts`)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- [route.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/app/api/chat/route.ts) (lines 83-134) - Current 2D system prompt with mobility tags
- [plan-parser.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/plan-parser.ts) (full file) - 2D plan parsing logic to mirror
- [plan-parser.test.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/plan-parser.test.ts) (full file) - Test patterns to follow
- [3d-generation.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/types/3d-generation.ts) (lines 114-149) - Animation presets, types
- [schemas.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/schemas.ts) - Existing Zod schema patterns

### New Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| `lib/3d-plan-parser.ts` | Parse 3D plan markdown into structured assets | ~150 |
| `lib/3d-plan-parser.test.ts` | Unit tests for 3D parser | ~200 |
| `lib/schemas-3d.ts` | Zod schemas for 3D AI SDK tools | ~80 |

### Files to Modify

| File | Changes |
|------|---------|
| `app/api/chat/route.ts` | Add 3D system prompt, 3D tools, conditional mode selection |


### Patterns to Follow

**Naming Conventions:**
- Files: `kebab-case` (e.g., `3d-plan-parser.ts`)
- Zod schemas: `camelCase` (e.g., `updatePlan3DSchema`)
- Types: `PascalCase` (e.g., `Parsed3DAsset`)
- Test files: `*.test.ts` using `bun:test` framework

**Test Pattern (from `plan-parser.test.ts`):**
```typescript
import { describe, test, expect } from 'bun:test';

describe('parse3DPlan', () => {
    const projectId = 'test-project';

    test('parses [RIG] tagged assets', () => {
        const markdown = `...`;
        const assets = parse3DPlan(markdown, { projectId });
        expect(assets[0].shouldRig).toBe(true);
    });
});
```

**Error Handling:** Match existing plan-parser approach - return empty array for invalid input

---

## IMPLEMENTATION PLAN

### Phase 2A: Create 3D Zod Schemas

Create schemas for 3D-specific AI SDK tools in a separate file to maintain isolation from 2D code.

**Tasks:**
- Create `lib/schemas-3d.ts` with schemas for 3D tools
- `updateQuality3DSchema` - mesh style, texture quality, rig preferences
- `updatePlan3DSchema` - 3D plan markdown
- `finalizePlan3DSchema` - transition to 3D generation

### Phase 2B: Create 3D Plan Parser

Create a new parser specifically for 3D plans that extracts `[RIG]`/`[STATIC]` tags and animation requirements.

**Tasks:**
- Create `lib/3d-plan-parser.ts` with `parse3DPlan()` function
- Handle `[RIG]` tag extraction (indicates mesh should be auto-rigged)
- Handle `[STATIC]` tag for non-rigged props/environment
- Extract animation requirements from sub-items (e.g., "Animations: idle, walk, run")
- Return `Parsed3DAsset[]` compatible with existing generation queue

### Phase 2C: Create Unit Tests

Comprehensive unit tests following existing patterns.

**Tasks:**
- Create `lib/3d-plan-parser.test.ts`
- Test `[RIG]` tag parsing
- Test `[STATIC]` tag parsing
- Test animation extraction
- Test edge cases (empty input, malformed markdown)

### Phase 2D: Add 3D AI SDK Tools to Chat Route

Add 3D-specific tools that the AI can call to act on behalf of the user.

**Tasks:**
- Fetch project mode from database in chat route
- Create 3D system prompt (no direction tags, add rig/animate metadata)
- Create 3D tool definitions:
  - `updateQuality3D` - Sets mesh style, texture quality, rig/animation prefs
  - `updatePlan3D` - Saves 3D plan markdown with [RIG]/[STATIC] tags
  - `finalizePlan3D` - Transitions directly to 3D generation phase
- Use conditional to select appropriate prompt + tools based on `project.mode`
- 2D tools remain in place and unchanged

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `lib/3d-plan-parser.ts`

**IMPLEMENT:**
```typescript
/**
 * 3D Plan Parser for Asset Hatch
 * Parses markdown plans for 3D mode into Parsed3DAsset[]
 */

import type { AnimationPreset } from '@/lib/types/3d-generation';

export interface Parsed3DAsset {
  id: string;
  category: string;
  name: string;
  description: string;
  shouldRig: boolean;
  animationsRequested: AnimationPreset[];
}

export interface Parse3DPlanOptions {
  projectId: string;
}

export function parse3DPlan(
  planMarkdown: string,
  options: Parse3DPlanOptions
): Parsed3DAsset[] {
  // Implementation mirrors plan-parser.ts structure
}
```

**PATTERN:** Mirror [plan-parser.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/plan-parser.ts) structure
**IMPORTS:** `AnimationPreset` from `@/lib/types/3d-generation`
**GOTCHA:** Animation presets must match exact strings: `preset:idle`, `preset:walk`, etc.
**VALIDATE:** `bun run typecheck`

---

### Task 2: CREATE `lib/3d-plan-parser.test.ts`

**IMPLEMENT:** Unit tests using `bun:test` framework

```typescript
import { describe, test, expect } from 'bun:test';
import { parse3DPlan } from './3d-plan-parser';

describe('parse3DPlan', () => {
    const projectId = 'test-project';

    test('parses [RIG] tagged character as riggable', () => {
        const markdown = `
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose
  - Animations: idle, walk, run
        `;
        const assets = parse3DPlan(markdown, { projectId });
        
        expect(assets.length).toBe(1);
        expect(assets[0].name).toBe('Knight Character');
        expect(assets[0].shouldRig).toBe(true);
        expect(assets[0].animationsRequested).toContain('preset:idle');
    });

    test('parses [STATIC] tagged prop as non-riggable', () => {
        const markdown = `
## Props
- [STATIC] Treasure Chest
  - Description: Wooden chest with gold trim
        `;
        const assets = parse3DPlan(markdown, { projectId });
        
        expect(assets[0].shouldRig).toBe(false);
        expect(assets[0].animationsRequested).toEqual([]);
    });
});
```

**PATTERN:** Follow [plan-parser.test.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/plan-parser.test.ts) structure
**VALIDATE:** `bun test lib/3d-plan-parser.test.ts`

---

### Task 3: UPDATE `app/api/chat/route.ts`

**IMPLEMENT:**
1. Fetch project mode at start of handler
2. Create `const system3DPrompt` with 3D-specific instructions
3. Use conditional: `const systemPrompt = project.mode === '3d' ? system3DPrompt : system2DPrompt`

**3D System Prompt Content:**
```typescript
const system3DPrompt = `You are a proactive 3D Game Asset Planner.

CURRENT PROJECT CONTEXT:
- Project ID: ${projectId}
- Mode: 3D
- Current Qualities: ${JSON.stringify(qualities)}

YOUR BEHAVIORAL PROTOCOLS:
1. **BE AGENTIC:** Do not wait for permission. If the user implies a preference, set it immediately using tools.
2. **BE ITERATIVE:** Update the plan continuously.

3D ASSET PLAN FORMAT REQUIREMENTS:
Each asset bullet must specify:
- [RIG] - If the asset should be auto-rigged (characters/creatures with humanoid skeleton)
- [STATIC] - Non-rigged props/environmental assets

For [RIG] assets, specify animations needed:
- Animations: idle, walk, run, jump, climb, dive

CORRECT FORMAT EXAMPLE:
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose for rigging
  - Animations: idle, walk, run, attack

## Props  
- [STATIC] Treasure Chest
  - Description: Wooden chest with gold trim

## Environment
- [STATIC] Stone Pillar
  - Description: Ancient stone pillar with ivy

PRO-TIP: Include "T-pose" or "A-pose" in character descriptions for best rigging results.`;
```

**PATTERN:** Match existing system prompt structure in lines 83-134
**GOTCHA:** Must fetch project from DB to get mode field
**VALIDATE:** `bun run typecheck && bun run lint`

---

### Task 0: CREATE `lib/schemas-3d.ts`

**IMPLEMENT:** Zod schemas for 3D-specific AI SDK tools

```typescript
import { z } from 'zod';

/**
 * 3D-specific Zod schemas for AI SDK tools
 * Parallel to schemas.ts for 2D - kept separate for isolation
 */

// Mesh style options matching Tripo3D capabilities
export const meshStyleSchema = z.enum(['realistic', 'stylized', 'low_poly', 'voxel']);

// Texture quality options
export const textureQualitySchema = z.enum(['draft', 'standard', 'high']);

// Animation presets from Tripo3D
export const animationPresetSchema = z.enum([
  'preset:idle',
  'preset:walk', 
  'preset:run',
  'preset:jump',
  'preset:climb',
  'preset:dive',
]);

/**
 * Update 3D quality parameters
 * Unlike 2D which has art_style/resolution, 3D has mesh_style/texture_quality
 */
export const updateQuality3DSchema = z.object({
  meshStyle: meshStyleSchema.optional().describe('Visual style of generated meshes'),
  textureQuality: textureQualitySchema.optional().describe('Texture resolution level'),
  defaultShouldRig: z.boolean().optional().describe('Default rigging preference for characters'),
  defaultAnimations: z.array(animationPresetSchema).optional().describe('Default animations to apply'),
});

export type UpdateQuality3DInput = z.infer<typeof updateQuality3DSchema>;

/**
 * Update the 3D asset plan
 * Accepts markdown with [RIG]/[STATIC] tags
 */
export const updatePlan3DSchema = z.object({
  planMarkdown: z.string().min(10).describe('Full markdown content of 3D asset plan with [RIG]/[STATIC] tags'),
});

export type UpdatePlan3DInput = z.infer<typeof updatePlan3DSchema>;

/**
 * Finalize 3D plan and transition to generation
 * Skips style phase - goes directly to 3D generation
 */
export const finalizePlan3DSchema = z.object({});

export type FinalizePlan3DInput = z.infer<typeof finalizePlan3DSchema>;
```

**PATTERN:** Mirror [schemas.ts](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/schemas.ts) structure
**VALIDATE:** `bun run typecheck`

---

## TESTING STRATEGY

### Unit Tests

| Test File | Command | Coverage |
|-----------|---------|----------|
| `lib/3d-plan-parser.test.ts` | `bun test lib/3d-plan-parser.test.ts` | Parser logic |

**Test Cases:**
1. `[RIG]` tag extraction → `shouldRig: true`
2. `[STATIC]` tag extraction → `shouldRig: false`
3. Animation extraction from "Animations:" line
4. Multiple assets in one plan
5. Empty/malformed input → empty array

### Integration Tests

No new integration tests for Phase 2. Chat route changes verified via manual testing.

### Manual Verification

> [!IMPORTANT]
> These manual tests require a running dev server with database access.

**Test 1: 3D Planning Chat**
1. Run `bun dev` in `src/` directory
2. Create a new project and select **3D mode** during creation
3. Navigate to planning phase
4. Type: "I need a fantasy knight character and a treasure chest"
5. **Verify:** AI responds with plan using `[RIG]` and `[STATIC]` tags
6. **Verify:** No 2D direction tags (N/S/E/W) appear
7. **Verify:** Knight has "Animations:" line listing presets

**Test 2: Plan Parsing**
1. Finalize a plan with one `[RIG]` character and one `[STATIC]` prop
2. Navigate to generation phase
3. **Verify:** Asset queue shows both items
4. **Verify:** Character shows rigging badge/indicator

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
cd src && bun run typecheck && bun run lint
```

### Level 2: Unit Tests
```bash
cd src && bun test lib/3d-plan-parser.test.ts
```

### Level 3: Full Test Suite
```bash
cd src && bun run typecheck && bun run lint && bun test
```

---

## ACCEPTANCE CRITERIA

- [x] Phase 1 deliverables exist (types, tripo client, schema) - **VERIFIED**
- [ ] `lib/schemas-3d.ts` created with `updateQuality3DSchema`, `updatePlan3DSchema`, `finalizePlan3DSchema`
- [ ] `lib/3d-plan-parser.ts` created and exports `parse3DPlan()` function
- [ ] `lib/3d-plan-parser.test.ts` has >80% coverage on parser logic
- [ ] `[RIG]` tag correctly sets `shouldRig: true`
- [ ] `[STATIC]` tag correctly sets `shouldRig: false`
- [ ] Animation extraction converts "idle, walk, run" to `['preset:idle', 'preset:walk', 'preset:run']`
- [ ] Chat route has 3D tools: `updateQuality3D`, `updatePlan3D`, `finalizePlan3D`
- [ ] Chat route uses 3D system prompt + tools when `project.mode === '3d'`
- [ ] 3D system prompt does NOT include 2D mobility tags
- [ ] 2D tools remain completely unchanged
- [ ] `bun run typecheck && bun run lint` passes
- [ ] Unit tests pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Unit tests pass
- [ ] No linting or type checking errors
- [ ] Manual testing confirms 3D planning works

---

## NOTES

### Design Decisions

1. **Separate Parser File:** The 3D parser is a separate file rather than adding mode logic to the existing parser. This keeps both files focused and under the ~200 line target.

2. **Animation Preset Normalization:** The parser converts human-readable animation names ("idle", "walk") to Tripo preset format ("preset:idle", "preset:walk") during parsing, not at generation time.

3. **No Style Phase Changes:** The 3D workflow skips the style anchor phase for MVP. Users go directly from planning to generation since Tripo generates the style internally.

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM inconsistent tag format | Clear format examples in prompt, parser handles variations |
| Animation name mismatches | Normalize to standard preset format in parser |

### Confidence Score

**8/10** - High confidence for one-pass implementation. Phase 1 foundation is solid, patterns are well-established in existing 2D code, and scope is focused on parsing logic only.
