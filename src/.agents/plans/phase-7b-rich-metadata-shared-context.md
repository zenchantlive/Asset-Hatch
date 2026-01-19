# Feature: Phase 7b - Rich Metadata & Shared Context

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Phase 7b implements **real metadata population** in the shared context API and establishes the **shared document architecture** that bridges Asset Hatch and Hatch Studios. This phase ensures that when assets are generated, their rich metadata (characters, environments, animations) automatically populates the shared context document, enabling the AI to have full awareness of project assets regardless of which tab (Assets or Game) is active.

**Key Deliverables:**
1. Rich metadata in context API responses (populated from generated assets)
2. Auto-population of characters/environments when assets complete
3. Shared document sync between Assets and Game tabs
4. Tab-aware chat context with full project awareness

## User Story

As a game developer using Hatch Studios,
I want my generated assets' metadata (characters, animations, environments) to automatically appear in the shared context,
So that the AI assistant knows about my assets regardless of whether I'm in the Assets or Game tab.

## Problem Statement

Currently, the shared context document exists but is **empty** - it has no data flowing into it. When users generate assets:
- Characters, environments, and animations are NOT automatically added to context
- The AI in the Game tab has no knowledge of what assets exist
- Users must manually re-explain their game concept when switching tabs

## Solution Statement

Implement a **rich metadata pipeline** that:
1. Listens for asset generation completion events
2. Extracts metadata (names, animations, descriptions) from generated assets
3. Auto-populates the `UnifiedProjectContext` in `MemoryFile`
4. Provides the context to both Assets tab (planning) and Game tab (coding) chat interfaces

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: 
- Context API (`/api/projects/[id]/context`)
- Shared context types (`shared-context.ts`)
- Asset generation hooks
- Chat integration (`/api/studio/chat`)
- Babylon system prompt

**Dependencies**: 
- Phase 6b completed (context API exists)
- Asset generation completion events (need to identify hook)
- Prisma with MemoryFile model (exists)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

| File | Lines | Relevance |
|------|-------|-----------|
| `src/lib/types/shared-context.ts` | 1-100 | **CRITICAL** - Type definitions for UnifiedProjectContext, GetContextResponse, UpdateContextInput |
| `src/app/api/projects/[id]/context/route.ts` | 1-232 | **CRITICAL** - GET/POST context API, validation schema, empty context fallback |
| `src/lib/types/unified-project.ts` | 1-205 | AssetManifest, AssetManifestEntry types for metadata structure |
| `src/lib/studio/babylon-system-prompt.ts` | 1-231 | System prompt template - needs context injection |
| `src/app/api/studio/chat/route.ts` | - | Chat route - needs context parameter |
| `src/prisma/schema.prisma` | 80-126 | Project model with assetManifest field |
| `src/prisma/schema.prisma` | 207-241 | Generated3DAsset model - has animationTaskIds, riggedModelUrl fields |
| `src/lib/studio/sync-tools.ts` | 1-293 | Sync tools - shows how asset data flows to games |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/studio/context-enricher.ts` | Service to populate context with rich metadata from assets |
| `src/hooks/useProjectContext.ts` | React hook for accessing/updating project context in UI |
| `src/components/shared/ContextIndicator.tsx` | UI component showing sync status between tabs |

### Files to UPDATE

| File | Changes |
|------|---------|
| `src/app/api/projects/[id]/context/route.ts` | Add `enrichContextWithAssets()` call to GET response |
| `src/lib/types/shared-context.ts` | Add optional `metadataVersion` field for cache invalidation |
| `src/lib/studio/babylon-system-prompt.ts` | Add `includeContextInPrompt()` helper function |
| `src/app/api/studio/chat/route.ts` | Fetch context and pass to `getBabylonSystemPrompt()` |
| `src/components/studio/ChatPanel.tsx` | Pass `projectId` to chat for context awareness |

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Vercel AI SDK v6 streamText](https://ai.sdk.vercel.com/docs/reference/ai-sdk-core stream-text)
  - Specific section: Tool execution and context injection
  - Why: Needed to pass context to AI tools
- [Next.js App Router API Routes](https://nextjs.org/docs/app/api-reference/file-conventions/route)
  - Specific section: Route handlers with params Promise
  - Why: Context route already uses this pattern, need to extend

---

## PATTERNS TO FOLLOW

### TypeScript Interface Pattern (from `src/lib/types/shared-context.ts:13-75`)

```typescript
export interface UnifiedProjectContext {
  projectId: string;
  gameId?: string;
  gameConcept: string;
  targetAudience: string;
  keyFeatures: string[];
  characters: Array<{
    name: string;
    description: string;
    animations: string[];
    assetId?: string;
  }>;
  environments: Array<{
    name: string;
    type: "interior" | "exterior" | "skybox";
    assetId?: string;
  }>;
  scenes: Array<{
    name: string;
    description: string;
  }>;
  lastUpdatedBy: "assets" | "game";
  updatedAt: string;
}
```

### API Route Pattern (from `src/app/api/projects/[id]/context/route.ts:65-122`)

```typescript
// GET with empty context fallback
export async function GET(...) {
  const memoryFile = await prisma.memoryFile.findUnique({
    where: { projectId_type: { projectId, type: "project-context.json" } },
  });

  if (!memoryFile) {
    const emptyContext: UnifiedProjectContext = {
      projectId,
      gameConcept: "",
      targetAudience: "",
      keyFeatures: [],
      characters: [],
      environments: [],
      scenes: [],
      lastUpdatedBy: "assets",
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, context: emptyContext });
  }

  const context = JSON.parse(memoryFile.content) as UnifiedProjectContext;
  return NextResponse.json({ success: true, context });
}
```

### Zod Validation Schema Pattern (from `src/app/api/projects/[id]/context/route.ts:21-55`)

```typescript
const updateContextSchema = z.object({
  context: z.object({
    gameConcept: z.string().optional(),
    targetAudience: z.string().optional(),
    keyFeatures: z.array(z.string()).optional(),
    characters: z.array(z.object({
      name: z.string(),
      description: z.string(),
      animations: z.array(z.string()),
      assetId: z.string().optional(),
    })).optional(),
    // ... more fields
  }),
});
```

### Emoji Logging Pattern (from `src/lib/studio/sync-tools.ts:64`)

```typescript
console.log("🔄 Syncing asset:", assetRefId);
// ...
console.log("✅ Updated existing placement:", placementId);
console.error("❌ Failed to sync asset:", error);
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Context Enrichment Service

Create the service that populates context with rich metadata from generated assets.

**Tasks:**

- **CREATE** `src/lib/studio/context-enricher.ts`
  - **PURPOSE**: Central service for enriching UnifiedProjectContext with asset metadata
  - **FUNCTION**: `enrichContextWithAssets(projectId: string, context: UnifiedProjectContext): Promise<UnifiedProjectContext>`
  - **IMPORTS**: `prisma` from `@/lib/prisma`, `UnifiedProjectContext` from `@/lib/types/shared-context`
  - **GOTCHA**: Handle cases where asset IDs reference both GeneratedAsset and Generated3DAsset
  - **PATTERN**: Follow `src/lib/studio/sync-tools.ts:57-156` for async asset fetching

- **IMPLEMENT** `getCharactersFrom3DAssets()` helper
  - Query `prisma.generated3DAsset.findMany({ where: { projectId } })`
  - Extract: name (from `name` field), animations (from `animationTaskIds` JSON), description (from `promptUsed`)
  - Map to `UnifiedProjectContext.characters` format

- **IMPLEMENT** `getEnvironmentsFromAssets()` helper
  - Query `prisma.generated3DAsset.findMany({ where: { projectId, assetType: "skybox" } })`
  - Also check `prisma.generatedAsset` for 2D environments
  - Map to `UnifiedProjectContext.environments` format with type classification

- **IMPLEMENT** `mergeEnrichedContext()` helper
  - Preserve existing context fields (gameConcept, targetAudience, keyFeatures)
  - Only update characters/environments from asset metadata
  - Set `lastUpdatedBy: "assets"` when enriching

### Phase 2: Core Integration - Context API Enhancement

Update the context API to return enriched data.

**Tasks:**

- **UPDATE** `src/app/api/projects/[id]/context/route.ts`
  - **LOCATION**: GET handler (lines 65-122)
  - **CHANGE**: After fetching context from MemoryFile, call `enrichContextWithAssets()` before returning
  - **PATTERN**: Wrap in try/catch, fall back to non-enriched context if enrichment fails
  - **VALIDATE**: `bun run typecheck` to ensure types align

```typescript
// Add after line 113 (after JSON.parse)
const enrichedContext = await enrichContextWithAssets(projectId, context);
return NextResponse.json({ success: true, context: enrichedContext });
```

- **UPDATE** `src/lib/types/shared-context.ts`
  - **ADD**: `metadataVersion?: string` field to `UnifiedProjectContext` for cache invalidation
  - **ADD**: Export type for context enrichment result

### Phase 3: Chat Integration - System Prompt with Context

Inject shared context into the Babylon.js system prompt for the Game tab.

**Tasks:**

- **CREATE** `src/lib/studio/context-prompt.ts`
  - **PURPOSE**: Helper to format context for inclusion in system prompt
  - **FUNCTION**: `formatContextForPrompt(context: UnifiedProjectContext): string`
  - **OUTPUT**: Markdown-formatted string for system prompt insertion

```typescript
export function formatContextForPrompt(context: UnifiedProjectContext): string {
  if (!context.gameConcept) return "No context available";

  return `
# PROJECT CONTEXT
${context.gameConcept ? `## Game Concept\n${context.gameConcept}` : ""}

${context.characters.length > 0 ? `## Characters\n${context.characters.map(c => `- ${c.name}: ${c.description} (animations: ${c.animations.join(", ")})`).join("\n")}` : ""}

${context.environments.length > 0 ? `## Environments\n${context.environments.map(e => `- ${e.name} (${e.type})`).join("\n")}` : ""}
  `.trim();
}
```

- **UPDATE** `src/lib/studio/babylon-system-prompt.ts`
  - **ADD**: New optional parameter `projectContext?: UnifiedProjectContext`
  - **ADD**: If `projectContext` provided, insert formatted context after "CURRENT CONTEXT" section (around line 180)
  - **PATTERN**: Use conditional template string insertion

```typescript
// Around line 178-181
CURRENT CONTEXT:
- Game ID: ${gameId}
${currentContext ? `- Game State: ${currentContext}` : ""}
${projectContext ? formatContextForPrompt(projectContext) : ""}
```

- **UPDATE** `src/app/api/studio/chat/route.ts`
  - **ADD**: Fetch project context before calling `streamText()`
  - **CODE**: Call `GET /api/projects/[id]/context` internally or via prisma
  - **PASS**: Pass context to `getBabylonSystemPrompt(gameId, currentState, assets, context)`

### Phase 4: UI Integration - Context Indicator Component

Create UI component to show context sync status.

**Tasks:**

- **CREATE** `src/hooks/useProjectContext.ts`
  - **PURPOSE**: React hook for fetching and managing project context in components
  - **FUNCTIONS**:
    - `useProjectContext(projectId)` - returns context, loading, error, refetch
    - `useUpdateProjectContext()` - returns mutation function
  - **PATTERN**: Follow `src/lib/studio/context.ts:74-80` for hook pattern

```typescript
export function useProjectContext(projectId: string) {
  const { data, error, isLoading, refetch } = useSWR(
    `/api/projects/${projectId}/context`,
    fetcher
  );
  return {
    context: data?.context,
    isLoading,
    error,
    refetch,
  };
}
```

- **CREATE** `src/components/shared/ContextIndicator.tsx`
  - **PURPOSE**: Visual indicator showing context sync status between tabs
  - **PROPS**: `projectId`, `activeTab: "assets" | "game"`
  - **UI**: Show "🔄 Synced" badge when context has data, "⚠️ Empty" when no context
  - **STYLING**: Purple for assets tab, Blue for game tab (per PRD)

- **UPDATE** `src/components/studio/ChatPanel.tsx`
  - **ADD**: Accept `projectId` prop
  - **FETCH**: Use `useProjectContext(projectId)` to get context
  - **PASS**: Pass context to chat API for system prompt enrichment
  - **GOTCHA**: Only fetch context once on mount, not on every message

### Phase 5: Testing & Validation

Ensure the implementation works end-to-end.

**Tasks:**

- **CREATE** `src/lib/studio/context-enricher.test.ts`
  - Test `enrichContextWithAssets()` with mocked Prisma data
  - Test that existing context fields are preserved
  - Test empty asset case (returns original context)

- **CREATE** `src/lib/studio/context-prompt.test.ts`
  - Test `formatContextForPrompt()` with various context states
  - Test empty context returns fallback string

- **VALIDATE** existing tests still pass:
  ```bash
  bun run test:ci
  bun run typecheck
  bun run lint
  ```

---

## STEP-BY-STEP TASKS

### Task 1.1: CREATE context-enricher.ts foundation

- **ACTION**: Create new file
- **TARGET**: `src/lib/studio/context-enricher.ts`
- **PATTERN**: Follow `src/lib/studio/sync-tools.ts:1-50` for imports and structure
- **VALIDATE**: `bun run typecheck`

```typescript
import { prisma } from "@/lib/prisma";
import type { UnifiedProjectContext } from "@/lib/types/shared-context";

export async function enrichContextWithAssets(
  projectId: string,
  context: UnifiedProjectContext
): Promise<UnifiedProjectContext> {
  // Implementation in Phase 1
}
```

### Task 1.2: IMPLEMENT character extraction

- **ACTION**: Add function to context-enricher.ts
- **PATTERN**: Query pattern from `src/lib/studio/sync-tools.ts:67-70`
- **VALIDATE**: Check Prisma query compiles

```typescript
async function getCharactersFrom3DAssets(projectId: string) {
  const assets = await prisma.generated3DAsset.findMany({
    where: { projectId },
    select: { name: true, promptUsed: true, animationTaskIds: true },
  });
  
  return assets.map(asset => ({
    name: asset.name || "Unnamed Character",
    description: asset.promptUsed?.substring(0, 200) || "",
    animations: parseAnimationTaskIds(asset.animationTaskIds),
    assetId: asset.id,
  }));
}
```

### Task 1.3: IMPLEMENT environment extraction

- **ACTION**: Add function to context-enricher.ts
- **PATTERN**: Filter by assetType or metadata
- **VALIDATE**: TypeScript strict mode passes

### Task 1.4: IMPLEMENT merge logic

- **ACTION**: Complete `enrichContextWithAssets()` function
- **LOGIC**: Merge extracted data with existing context
- **VALIDATE**: `bun run typecheck`

### Task 2.1: UPDATE context GET route

- **ACTION**: Modify `src/app/api/projects/[id]/context/route.ts`
- **LOCATION**: After line 113, before return
- **CODE**: Call enricher, handle errors gracefully
- **VALIDATE**: `bun run typecheck && bun run lint`

### Task 2.2: ADD metadataVersion field

- **ACTION**: Update `src/lib/types/shared-context.ts`
- **ADD**: `metadataVersion?: string` to interface
- **VALIDATE**: Import in route file compiles

### Task 3.1: CREATE context-prompt.ts

- **ACTION**: Create `src/lib/studio/context-prompt.ts`
- **OUTPUT**: Markdown-formatted context string
- **VALIDATE**: Unit tests for formatting

### Task 3.2: UPDATE babylon-system-prompt.ts

- **ACTION**: Add projectContext parameter and formatting
- **LOCATION**: Around line 178-181
- **VALIDATE**: `bun run typecheck`

### Task 3.3: UPDATE studio chat route

- **ACTION**: Fetch context and pass to system prompt
- **PATTERN**: Internal API call or direct Prisma query
- **VALIDATE**: `bun run typecheck`

### Task 4.1: CREATE useProjectContext hook

- **ACTION**: Create `src/hooks/useProjectContext.ts`
- **PATTERN**: SWR or React Query for data fetching
- **VALIDATE**: TypeScript compiles

### Task 4.2: CREATE ContextIndicator component

- **ACTION**: Create `src/components/shared/ContextIndicator.tsx`
- **STYLING**: Per PRD (purple assets, blue game)
- **VALIDATE**: `bun run lint`

### Task 4.3: INTEGRATE ChatPanel with context

- **ACTION**: Update ChatPanel to accept/use projectId
- **PATTERN**: Follow existing chat integration pattern
- **VALIDATE**: `bun run typecheck`

### Task 5.1: WRITE context-enricher tests

- **ACTION**: Create `src/lib/studio/context-enricher.test.ts`
- **COVERAGE**: Main function and helpers
- **VALIDATE**: `bun run test -- context-enricher`

### Task 5.2: WRITE context-prompt tests

- **ACTION**: Create `src/lib/studio/context-prompt.test.ts`
- **COVERAGE**: Formatting edge cases
- **VALIDATE**: `bun run test -- context-prompt`

### Task 5.3: RUN full validation suite

- **ACTION**: Execute all validation commands
- **VALIDATE**:
  ```bash
  bun run lint
  bun run typecheck
  bun run test:ci
  ```

---

## TESTING STRATEGY

### Unit Tests

**Files to test:**
- `src/lib/studio/context-enricher.ts` - Main enrichment logic
- `src/lib/studio/context-prompt.ts` - Context formatting

**Mock strategy:**
- Mock `prisma.generated3DAsset.findMany()` with sample data
- Mock `prisma.generatedAsset.findMany()` for 2D assets

**Example test:**
```typescript
describe("enrichContextWithAssets", () => {
  it("should preserve existing gameConcept", async () => {
    const context: UnifiedProjectContext = {
      projectId: "test",
      gameConcept: "My RPG game",
      // ... other required fields
    };
    
    prisma.generated3DAsset.findMany.mockResolvedValue([]);
    
    const result = await enrichContextWithAssets("test", context);
    
    expect(result.gameConcept).toBe("My RPG game");
  });
});
```

### Integration Tests

- Test context API GET returns enriched data
- Test that missing assets don't break context
- Test chat route includes context in system prompt

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No assets generated yet | Return context with empty arrays |
| Asset has no animations | Return empty animations array |
| Asset name is null | Use fallback "Unnamed Character" |
| Context fetch fails | Fall back to non-enriched context |
| Large number of assets | Pagination not needed (assume < 100 assets) |

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Linting
cd src && bun run lint

# Type checking
bun run typecheck

# Formatting
cd src && bun run format
```

### Level 2: Unit Tests

```bash
# Run specific tests
bun run test -- context-enricher
bun run test -- context-prompt

# Full test suite
bun run test:ci
```

### Level 3: Integration Tests

```bash
# Start dev server (manual)
bun dev

# Test API endpoint
curl http://localhost:3000/api/projects/[project-id]/context

# Verify response contains:
# - gameConcept preserved
# - characters array (may be empty)
# - environments array (may be empty)
```

### Level 4: Manual Validation

1. Create a new project
2. Generate some 3D assets with animations
3. Navigate to Game tab
4. Open chat and verify context is visible in system prompt (debug mode)
5. Switch between tabs and confirm context persists

### Level 5: Additional Validation (Optional)

```bash
# Prisma Studio - verify MemoryFile content
bunx prisma studio
```

---

## ACCEPTANCE CRITERIA

- [ ] Context API returns enriched data with character/environment metadata
- [ ] Existing context fields (gameConcept, targetAudience) are preserved during enrichment
- [ ] Chat system prompt includes project context when available
- [ ] UI indicator shows sync status between Assets and Game tabs
- [ ] All validation commands pass with zero errors
- [ ] Unit tests cover main enrichment logic
- [ ] No regressions in existing functionality
- [ ] TypeScript strict mode passes

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **Context stored in MemoryFile**: Following Phase 6b architecture, context persists as `project-context.json` in MemoryFile table. This allows both tabs to read/write the same document.

2. **Enrichment on READ, not WRITE**: Instead of enriching context when assets are generated (which would require modifying generation workflows), we enrich on every READ. This is simpler and ensures context is always up-to-date.

3. **Preserve user edits**: The enricher only adds characters/environments from assets - it never overwrites gameConcept, targetAudience, or keyFeatures which are user-provided.

### Trade-offs Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Enrich on asset generation | Would require modifying generation hooks, higher risk |
| Separate context table | MemoryFile pattern already established, no need for new table |
| Real-time WebSocket sync | Overkill for this use case; polling via SWR sufficient |

### Future Considerations (Phase 8+)

- Context could be used to automatically suggest asset usage in game code
- Version conflict detection when assets update
- Export bundle could include context document
- Multi-user collaboration context sharing

---

## Confidence Score: 8/10

**Rationale:**
- Strong foundation exists (context API, types, MemoryFile)
- Clear patterns to follow from sync-tools.ts
- Scope is well-defined and manageable
- Risk: Unknown asset generation completion hooks (may need additional research)

**Mitigation:** If generation hooks are unavailable, implement polling-based enrichment as fallback.
