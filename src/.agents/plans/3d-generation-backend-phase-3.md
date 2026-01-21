# Feature: 3D Asset Generation Backend (Phase 3)

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement the backend API infrastructure for 3D asset generation using the Tripo3D API. This feature enables the generation of 3D meshes from text prompts, automatic rigging for character models, and animation retargeting. It completes the 3D mode workflow by bridging the planning phase (Phase 2) with a fully functional generation system.

This phase includes:
- Task creation and submission to Tripo3D API
- Status polling infrastructure for long-running tasks
- Task chain orchestration (generation → rigging → animation)
- Database persistence for task tracking and model URLs
- Error handling and retry logic

## User Story

As a game developer using Asset Hatch in 3D mode
I want to generate 3D models with automatic rigging and animations from my asset plan
So that I can quickly prototype game characters and props without manual 3D modeling work

## Problem Statement

Phase 2 completed the planning experience with [RIG]/[STATIC] tag parsing and AI-driven plan generation. However, there's no backend to actually generate the 3D assets. Users can create plans but cannot execute them. The system needs:

1. **API Integration**: Connect to Tripo3D's REST API for mesh generation
2. **Task Management**: Handle async task submission and status polling
3. **Pipeline Orchestration**: Chain tasks (generate → rig → animate) automatically
4. **State Persistence**: Track task IDs and model URLs in the database
5. **Error Resilience**: Handle API failures, rate limits, and task failures

## Solution Statement

Create four new API routes that mirror the 2D generation pattern but adapted for 3D workflows:

1. **POST /api/generate-3d** - Submit 3D generation task to Tripo API
2. **GET /api/generate-3d/[taskId]/status** - Poll task status
3. **POST /api/generate-3d/rig** - Submit auto-rigging task
4. **POST /api/generate-3d/animate** - Submit animation retargeting task

These routes will use the existing `Generated3DAsset` Prisma model (already in schema.prisma) and follow the established patterns from `/api/generate` (2D generation). The implementation will leverage Tripo3D's task-based API with status polling similar to how 2D generation works with OpenRouter.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**:
- API routes (new: app/api/generate-3d/*)
- Database (existing: Generated3DAsset model)
- Type system (existing: lib/types/3d-generation.ts)

**Dependencies**:
- Tripo3D API (external service)
- Prisma 7.2.0 (PostgreSQL adapter)
- Next.js App Router 16.1.1
- TypeScript 5.x

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `lib/types/3d-generation.ts` (lines 1-299) - Complete type definitions for Tripo API, task types, and 3D asset state machine
- `lib/schemas-3d.ts` (lines 1-107) - Zod validation schemas for 3D mode tools
- `lib/3d-plan-parser.ts` (lines 1-256) - Parser for extracting [RIG]/[STATIC] tags and animation requirements
- `lib/chat-tools-3d.ts` (lines 1-237) - 3D-specific AI tools and system prompt
- `app/api/generate/route.ts` (lines 1-287) - 2D generation pattern to mirror
- `lib/openrouter-image.ts` (lines 1-213) - Reference for API client structure (authentication, error handling)
- `prisma/schema.prisma` (lines 166-184) - Generated3DAsset model definition
- `app/api/chat/route.ts` (lines 61-66) - 3D mode detection pattern

### New Files to Create

- `app/api/generate-3d/route.ts` - Main generation endpoint (submit text_to_model task)
- `app/api/generate-3d/[taskId]/status/route.ts` - Status polling endpoint
- `app/api/generate-3d/rig/route.ts` - Auto-rigging endpoint
- `app/api/generate-3d/animate/route.ts` - Animation retargeting endpoint
- `lib/tripo-client.ts` - Tripo3D API client utility (similar to openrouter-image.ts)
- `app/api/generate-3d/__tests__/route.test.ts` - Unit tests for generation route

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tripo3D API Overview](https://platform.tripo3d.ai/docs/introduction)
  - Specific section: Task submission and polling patterns
  - Why: Core API integration patterns
- [Tripo3D Authentication](https://platform.tripo3d.ai/docs/quick-start)
  - Specific section: Bearer token authentication (`Authorization: Bearer tsk-***`)
  - Why: Required for all API requests
- [Tripo3D Generation Endpoint](https://platform.tripo3d.ai/docs/generation)
  - Specific section: `text_to_model` task type and parameters
  - Why: Primary model generation endpoint
- [Tripo3D Animation](https://platform.tripo3d.ai/docs/animation)
  - Specific section: `animate_rig` and `animate_retarget` workflows
  - Why: Character rigging and animation pipeline

**API Endpoint Pattern (from web search)**:
```bash
# Base endpoint
https://api.tripo3d.ai/v2/openapi/task

# Authentication
Authorization: Bearer tsk-***

# Example: Text-to-model task
curl https://api.tripo3d.ai/v2/openapi/task \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${APIKEY}" \
  -d '{"type": "text_to_model", "prompt": "a small cat"}'
```

### Patterns to Follow

**API Route Structure** (from `app/api/generate/route.ts`):
```typescript
// 1. Auth check with session
const session = await auth();
let userApiKey: string | null = null;
if (session?.user?.id) {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openRouterApiKey: true },
  });
  userApiKey = user?.openRouterApiKey || null;
}

// 2. Request body validation with TypeScript interface
interface GenerateRequest {
  projectId: string;
  asset: ParsedAsset;
}
const body: GenerateRequest = await request.json();

// 3. Database operations with Prisma
const project = await prisma.project.findUnique({
  where: { id: projectId },
});

// 4. API call with error handling
try {
  const result = await generateFluxImage({ /* ... */ });
} catch (error) {
  console.error('❌ Generation error:', error);
  return NextResponse.json(
    { error: 'Generation failed', details: error.message },
    { status: 500 }
  );
}

// 5. Return JSON response
return NextResponse.json({
  success: true,
  asset: { id, imageUrl, metadata }
});
```

**Naming Conventions**:
- API routes: kebab-case (`generate-3d`, not `generate3d`)
- Prisma fields: camelCase (`draftTaskId`, `riggedModelUrl`)
- Type definitions: PascalCase (`Generated3DAsset`, `TripoTask`)
- Functions: camelCase (`submitTripoTask`, `pollTaskStatus`)

**Error Handling Pattern** (from `lib/openrouter-image.ts:142-146`):
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  console.error('❌ API error:', response.status, errorData);
  throw new Error(`Tripo error ${response.status}: ${JSON.stringify(errorData)}`);
}
```

**Logging Pattern** (from `app/api/generate/route.ts:54-59`):
```typescript
console.log('🎨 Starting asset generation:', {
  projectId,
  assetId: asset.id,
  assetName: asset.name,
  model: modelKey,
});
```

**Environment Variable Pattern** (from `.env.example` and `lib/openrouter-image.ts:91`):
```typescript
const TRIPO_API_KEY = apiKey || process.env.TRIPO_API_KEY;
if (!TRIPO_API_KEY) {
  throw new Error('TRIPO_API_KEY not configured');
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Tripo Client Utility

Create reusable Tripo3D API client module following the same pattern as `lib/openrouter-image.ts`. This utility will handle authentication, request formatting, error handling, and response parsing for all Tripo API interactions.

**Tasks:**
- Set up base HTTP client with authentication
- Implement task submission function
- Implement status polling function
- Add TypeScript interfaces for requests/responses

### Phase 2: Core Generation Endpoint

Implement the main 3D generation route that accepts an asset from the plan, submits a `text_to_model` task to Tripo, and persists the task ID in the database. This mirrors the 2D generation flow but adapted for async task submission.

**Tasks:**
- Create POST /api/generate-3d route
- Validate request body with Zod schemas
- Submit text_to_model task via Tripo client
- Create Generated3DAsset database record
- Return task ID for status polling

### Phase 3: Status Polling Infrastructure

Implement the status polling route that clients use to check task progress. This route queries the Tripo API and updates the database when tasks complete, enabling the UI to display progress bars and handle completed assets.

**Tasks:**
- Create GET /api/generate-3d/[taskId]/status route
- Poll Tripo API for task status
- Update database on task completion
- Return status with progress percentage
- Handle task failure scenarios

### Phase 4: Rigging and Animation Endpoints

Implement the rigging and animation routes that chain additional tasks after mesh generation. These routes are called by the UI (or automatically) once a draft model is generated and the asset has `shouldRig: true`.

**Tasks:**
- Create POST /api/generate-3d/rig route
- Create POST /api/generate-3d/animate route
- Implement task chaining logic
- Update database with rigged/animated model URLs
- Add validation for rigging prerequisites

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: CREATE `lib/tripo-client.ts`

- **IMPLEMENT**: Tripo3D API client utility with authentication and error handling
- **PATTERN**: Mirror `lib/openrouter-image.ts:84-212` structure (authentication, fetch, error handling)
- **IMPORTS**: None (this is a base utility)
- **GOTCHA**: API key starts with "tsk-" prefix (from web search), validate this in code
- **VALIDATE**: `bun run typecheck` (no errors)

**Implementation Details**:
```typescript
// Create interfaces for:
// - TripoTaskRequest (type, prompt, optional params)
// - TripoTaskResponse (task_id, status, output)
// - TripoStatusResponse (status, progress, output)

// Create functions:
// - submitTripoTask(apiKey, request): Promise<TripoTask>
// - pollTripoTaskStatus(apiKey, taskId): Promise<TripoTask>
// - downloadModelFile(url): Promise<Buffer> (for future use)

// Base endpoint constant:
const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi/task';

// Authentication header format:
headers: { 'Authorization': `Bearer ${apiKey}` }
```

### Task 2: UPDATE `.env.example`

- **IMPLEMENT**: Add TRIPO_API_KEY environment variable
- **PATTERN**: Follow existing OpenRouter pattern in `.env.example`
- **IMPORTS**: N/A
- **GOTCHA**: Document that key starts with "tsk-" prefix
- **VALIDATE**: Manual inspection (check key is documented)

**Add this line**:
```bash
# Tripo3D API Key (get from https://platform.tripo3d.ai)
# Key format: tsk-***
TRIPO_API_KEY="tsk-your_api_key_here"
```

### Task 3: CREATE `app/api/generate-3d/route.ts`

- **IMPLEMENT**: Main 3D generation endpoint (POST handler)
- **PATTERN**: Mirror `app/api/generate/route.ts:26-87` (auth, validation, API call, database save)
- **IMPORTS**:
  - `prisma` from `@/lib/prisma`
  - `auth` from `@/auth`
  - `submitTripoTask` from `@/lib/tripo-client`
  - Types from `@/lib/types/3d-generation`
- **GOTCHA**: Don't return full prompt in response (token limit), only task ID
- **VALIDATE**: `bun run typecheck && bun run lint` (zero errors)

**Request body interface**:
```typescript
interface Generate3DRequest {
  projectId: string;
  assetId: string;
  prompt: string;
  shouldRig?: boolean;
  animations?: AnimationPreset[];
}
```

**Flow**:
1. Get session and user's TRIPO_API_KEY (BYOK)
2. Validate projectId exists in database
3. Submit text_to_model task via Tripo client
4. Create Generated3DAsset record with status 'queued'
5. Return { taskId, status: 'queued' }

### Task 4: CREATE `app/api/generate-3d/[taskId]/status/route.ts`

- **IMPLEMENT**: Status polling endpoint (GET handler with dynamic route)
- **PATTERN**: Similar to `app/api/assets/[id]/route.ts:1-50` (dynamic route, database fetch, API call)
- **IMPORTS**:
  - `prisma` from `@/lib/prisma`
  - `pollTripoTaskStatus` from `@/lib/tripo-client`
  - Types from `@/lib/types/3d-generation`
- **GOTCHA**: Update database ONLY when status changes to 'success' or 'failed'
- **VALIDATE**: `bun run typecheck && bun run lint`

**Flow**:
1. Extract taskId from route params: `params.taskId`
2. Find Generated3DAsset by draftTaskId
3. Poll Tripo API for status
4. If status === 'success', update database with model URL
5. If status === 'failed', update status and error message
6. Return { taskId, status, progress, output }

### Task 5: CREATE `app/api/generate-3d/rig/route.ts`

- **IMPLEMENT**: Auto-rigging endpoint (POST handler)
- **PATTERN**: Follow `app/api/generate-3d/route.ts` structure but with different task type
- **IMPORTS**: Same as Task 3
- **GOTCHA**: Rigging requires a completed draft model URL (validate this exists)
- **VALIDATE**: `bun run typecheck && bun run lint`

**Request body interface**:
```typescript
interface RigRequest {
  projectId: string;
  assetId: string;
  draftModelUrl: string; // URL from completed text_to_model task
}
```

**Flow**:
1. Validate draftModelUrl exists
2. Submit animate_rig task via Tripo client
3. Update Generated3DAsset with rigTaskId
4. Update status to 'rigging'
5. Return { taskId, status: 'rigging' }

### Task 6: CREATE `app/api/generate-3d/animate/route.ts`

- **IMPLEMENT**: Animation retargeting endpoint (POST handler)
- **PATTERN**: Follow `app/api/generate-3d/rig/route.ts` structure
- **IMPORTS**: Same as Task 3
- **GOTCHA**: Animation requires a rigged model (validate riggedModelUrl exists)
- **VALIDATE**: `bun run typecheck && bun run lint`

**Request body interface**:
```typescript
interface AnimateRequest {
  projectId: string;
  assetId: string;
  riggedModelUrl: string;
  animationPreset: AnimationPreset; // e.g., 'preset:walk'
}
```

**Flow**:
1. Validate riggedModelUrl exists
2. Submit animate_retarget task via Tripo client
3. Update Generated3DAsset animationTaskIds JSON field
4. Update status to 'animating'
5. Return { taskId, status: 'animating' }

### Task 7: ADD error handling to all routes

- **IMPLEMENT**: Consistent error handling across all new routes
- **PATTERN**: Follow `app/api/generate/route.ts:276-285` error handling
- **IMPORTS**: None (modify existing files)
- **GOTCHA**: Always return user-friendly error messages, log detailed errors
- **VALIDATE**: Manual testing with invalid inputs

**Error handling template**:
```typescript
try {
  // ... route logic
} catch (error) {
  console.error('❌ 3D generation error:', error);
  return NextResponse.json(
    {
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}
```

### Task 8: CREATE `app/api/generate-3d/__tests__/route.test.ts`

- **IMPLEMENT**: Unit tests for main generation route
- **PATTERN**: Follow `app/api/generate/__tests__/route.test.ts` structure
- **IMPORTS**: Jest, Node test environment, mocked prisma/auth
- **GOTCHA**: Mock Tripo API calls, don't make real API requests
- **VALIDATE**: `bun run test:ci` (all tests pass)

**Test cases**:
1. Returns 400 if projectId missing
2. Returns 404 if project not found
3. Submits task and creates database record
4. Returns task ID and status
5. Handles API errors gracefully

### Task 9: UPDATE `app/api/chat/route.ts`

- **IMPLEMENT**: Add reference to new 3D generation endpoints in system prompt
- **PATTERN**: Update `get3DSystemPrompt` function in `lib/chat-tools-3d.ts:35-73`
- **IMPORTS**: None (modify existing file)
- **GOTCHA**: Don't change existing 2D prompts
- **VALIDATE**: `bun run typecheck && bun run lint`

**Add to system prompt**:
```typescript
// In lib/chat-tools-3d.ts, update get3DSystemPrompt:
GENERATION WORKFLOW:
Once plan is finalized, assets will be generated via:
1. POST /api/generate-3d - Submit text_to_model task
2. GET /api/generate-3d/[taskId]/status - Poll until complete
3. POST /api/generate-3d/rig - Auto-rig characters (if [RIG] tag)
4. POST /api/generate-3d/animate - Apply animation presets
```

### Task 10: ADD JSDoc comments to all new files

- **IMPLEMENT**: Comprehensive JSDoc headers and function comments
- **PATTERN**: Follow JSDoc style in `lib/openrouter-image.ts:1-12` and `lib/types/3d-generation.ts:1-9`
- **IMPORTS**: None (modify existing files)
- **GOTCHA**: Explain WHY not just WHAT (architectural decisions)
- **VALIDATE**: `bun run typecheck` (no errors)

**Example header**:
```typescript
/**
 * Tripo3D API Client for Asset Hatch
 *
 * Handles all interactions with Tripo's 3D generation API including:
 * - Task submission (text_to_model, animate_rig, animate_retarget)
 * - Status polling with progress tracking
 * - Error handling and retry logic
 *
 * @see https://platform.tripo3d.ai/docs for API documentation
 * @see lib/types/3d-generation.ts for type definitions
 */
```

---

## TESTING STRATEGY

Based on existing test patterns in `app/api/generate/__tests__/route.test.ts` and `app/api/export/__tests__/route.test.ts`.

### Unit Tests

**Scope**: All API routes and the Tripo client utility

**Framework**: Jest with Node.js test environment (not jsdom)

**Fixtures**:
- Mock TripoTask responses for all task states (queued, running, success, failed)
- Mock Generated3DAsset database records
- Mock authentication sessions with/without BYOK keys

**Test Structure**:
```typescript
describe('POST /api/generate-3d', () => {
  it('submits text_to_model task and creates database record', async () => {
    // Mock prisma.project.findUnique
    // Mock submitTripoTask
    // Mock prisma.generated3DAsset.create
    // Assert response contains taskId
  });

  it('handles missing projectId with 400 error', async () => {
    // Assert response is 400 with error message
  });

  it('uses user API key when available (BYOK)', async () => {
    // Mock session with openRouterApiKey
    // Assert submitTripoTask called with user's key
  });
});
```

### Integration Tests

**Scope**: End-to-end task chain (generation → rigging → animation)

**Manual Testing Steps**:
1. Start dev server: `bun dev`
2. Create project in 3D mode
3. Finalize plan with [RIG] asset
4. Submit generation task: `POST /api/generate-3d`
5. Poll status until complete: `GET /api/generate-3d/[taskId]/status`
6. Verify database record has draftModelUrl
7. Submit rigging task: `POST /api/generate-3d/rig`
8. Poll status until complete
9. Verify database record has riggedModelUrl
10. Submit animation task: `POST /api/generate-3d/animate`
11. Poll status until complete
12. Verify database record has animatedModelUrls JSON

### Edge Cases

**Specific edge cases that must be tested**:

1. **Task Failures**: Tripo API returns status='failed'
   - Expected: Database updated with status='failed' and error message

2. **API Rate Limits**: Tripo returns 429 Too Many Requests
   - Expected: Route returns 429 with retry-after header

3. **Expired Task IDs**: Polling a task that no longer exists (24h expiration)
   - Expected: Route returns 404 with helpful error message

4. **Concurrent Polling**: Multiple clients polling same taskId
   - Expected: Database updates are atomic, no race conditions

5. **Missing TRIPO_API_KEY**: Environment variable not set
   - Expected: Route returns 500 with clear error message

6. **Invalid Model URLs**: Rigging/animation called with non-existent URLs
   - Expected: Route returns 400 with validation error

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# TypeScript type checking
cd /mnt/c/Users/Zenchant/Asset-Hatch/src
bun run typecheck

# ESLint
bun run lint

# Expected: Zero errors, zero warnings
```

### Level 2: Unit Tests

```bash
# Run all tests
bun run test:ci

# Run only 3D generation tests
bun test app/api/generate-3d/__tests__

# Expected: All tests pass, coverage >80%
```

### Level 3: Integration Tests

```bash
# Start dev server
bun dev

# In separate terminal, test endpoints with curl:

# 1. Submit generation task
curl -X POST http://localhost:3000/api/generate-3d \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": "test-project-123",
    "assetId": "asset-456",
    "prompt": "a low poly knight character in T-pose",
    "shouldRig": true,
    "animations": ["preset:idle", "preset:walk"]
  }'

# Expected: { "taskId": "tripo-task-abc", "status": "queued" }

# 2. Poll task status
curl http://localhost:3000/api/generate-3d/tripo-task-abc/status

# Expected: { "taskId": "...", "status": "running", "progress": 45 }

# 3. Check database record
bunx prisma studio
# Navigate to Generated3DAsset table
# Verify record exists with status='generating'
```

### Level 4: Manual Validation

**Feature-specific manual testing steps**:

1. **Create 3D Project**:
   - Go to http://localhost:3000
   - Create new project, select "3D Mode"
   - Enter planning phase

2. **Finalize Plan**:
   - Chat with AI to create plan with [RIG] character
   - Call finalizePlan3D tool
   - Verify phase transitions to 'generation'

3. **Generate Asset**:
   - Open browser devtools Network tab
   - Trigger generation (will need UI, or use curl)
   - Monitor POST /api/generate-3d request
   - Verify 200 response with taskId

4. **Poll Status**:
   - Monitor repeated GET /api/generate-3d/[taskId]/status requests
   - Wait for status to change from 'queued' → 'running' → 'success'
   - Verify progress percentage updates

5. **Verify Database**:
   - Open Prisma Studio: `bunx prisma studio`
   - Navigate to Generated3DAsset table
   - Verify record has draftModelUrl populated

6. **Test Rigging** (if shouldRig=true):
   - Submit POST /api/generate-3d/rig with draftModelUrl
   - Poll status until complete
   - Verify riggedModelUrl populated

7. **Test Animation**:
   - Submit POST /api/generate-3d/animate with riggedModelUrl
   - Poll status until complete
   - Verify animatedModelUrls JSON field

### Level 5: Additional Validation (Optional)

**If MCP servers available**:
- Use Perplexity MCP to verify Tripo API documentation accuracy
- Use Desktop Commander MCP to run curl tests in parallel

---

## ACCEPTANCE CRITERIA

- [ ] All 4 API routes created and functional (generate-3d, status, rig, animate)
- [ ] Tripo client utility handles authentication and error cases
- [ ] Database records created/updated correctly at each pipeline stage
- [ ] Status polling returns accurate progress and completion status
- [ ] Task chaining works (generation → rigging → animation)
- [ ] BYOK support allows users to use their own Tripo API keys
- [ ] All validation commands pass with zero errors
- [ ] Unit test coverage >80% for new code
- [ ] Manual integration test completes successfully
- [ ] No regressions in existing 2D generation functionality
- [ ] Error messages are user-friendly and actionable
- [ ] API rate limits are handled gracefully
- [ ] Task failures are logged and persisted to database

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1-10)
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully (Levels 1-4)
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works end-to-end
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] JSDoc comments added to all public functions
- [ ] Environment variables documented in .env.example

---

## NOTES

### Key Design Decisions

**1. Task-Based Architecture**:
- Tripo uses async tasks that can take 10-60 seconds to complete
- Client must poll for status (no webhooks available)
- This matches the existing 2D generation pattern where images also take time

**2. Database-First Approach**:
- All task IDs and URLs stored in Generated3DAsset model
- Database acts as cache to reduce API polling
- Client can resume from database if page refreshes

**3. BYOK Support**:
- Users can bring their own Tripo API key (stored in User.tripoApiKey)
- Falls back to environment TRIPO_API_KEY if user key not available
- Enables cost control and rate limit management per user

**4. Task Chain Orchestration**:
- Each step (generate/rig/animate) is a separate API route
- UI (or backend scheduler) responsible for chaining
- Allows user control over which steps to execute
- Enables retry of individual steps without rerunning entire chain

**5. Error Handling Strategy**:
- All errors logged to console with emoji prefixes (🎨 ✅ ❌)
- User-facing errors are generic, detailed errors in logs
- Failed tasks stored in database for debugging
- Retry logic handled by client, not server

### Trade-offs

**Option A: Webhooks**
- Pro: Real-time updates without polling
- Con: Tripo doesn't support webhooks (as of 2026-01-12)
- Decision: Use polling with exponential backoff

**Option B: Server-Side Orchestration**
- Pro: Backend handles entire chain automatically
- Con: More complex state machine, harder to debug
- Decision: Client-side orchestration for Phase 3, server-side for future

**Option C: Store Models in Database**
- Pro: Models available offline
- Con: Large binary data (5-50MB GLB files), database bloat
- Decision: Store URLs only, download on demand

### Future Enhancements

**Phase 4 (Future)**:
- Server-side task orchestration (auto-chain generation → rig → animate)
- Background job queue (Bull/BullMQ) for reliable processing
- Model caching layer (S3/R2) for faster downloads
- Batch generation (multiple assets in parallel)
- Cost tracking per asset (similar to GenerationCost model for 2D)
- Preview thumbnail generation (rendered 2D images of 3D models)
- Model optimization (LOD generation, compression)

### Resources

- [Tripo3D Platform](https://platform.tripo3d.ai)
- [Tripo3D API Documentation](https://platform.tripo3d.ai/docs/introduction)
- [Bearer Token Authentication](https://platform.tripo3d.ai/docs/quick-start)
- [Text-to-3D Generation](https://www.tripo3d.ai/features/text-to-3d-model)
- [AI Auto-Rigging](https://www.tripo3d.ai/features/ai-auto-rigging)

---

**END OF IMPLEMENTATION PLAN**
