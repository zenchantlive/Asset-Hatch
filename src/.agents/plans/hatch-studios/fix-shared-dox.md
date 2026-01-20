Feature: Fix Shared Documents Initialization for Asset Gen Chat
The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.
Pay special attention to naming of existing utils types and models. Import from the right files etc.
Feature Description
Fix a critical bug where Asset Gen Chat cannot access shared documents (game-design.md, asset-inventory.md, scene-notes.md, development-log.md). The AI reports "Game not linked to project" even when the user expects documents to exist.
Root Causes Identified:
1. Type Mismatch: Asset Gen Chat passes projectId to createSharedDocTools() which expects gameId
2. Schema Mismatch: Frontend sends "both" but API schema only accepts "assets" | "game"
3. Initialization Gap: Shared docs only initialized for "game" flow, not "both"
User Story
As a user who creates a project with "Both" or "Game First" option
I want to access shared documents from Asset Gen Chat
So that my asset planning can reference and update game design documents, keeping everything synchronized
Problem Statement
When user creates a new project and goes to Asset Hatch chat, the AI says "Game not linked to project" when trying to read shared documents. This happens because:
1. Frontend sends startWith: "both" but API schema rejects it (defaults to "assets")
2. initializeSharedDocuments() only called when startWith === "game"
3. createSharedDocTools() expects gameId but Asset Gen Chat passes projectId
4. Tool queries Game.findUnique() with projectId → returns null → triggers error
Solution Statement
1. Add "both" to the startWith enum in project creation schema
2. Initialize shared documents for both "game" AND "both" flows
3. Create project-scoped variants of shared doc tools that accept projectId directly
4. Update Asset Gen Chat to use project-scoped tools instead of game-scoped tools
Feature Metadata
Feature Type: Bug Fix
Estimated Complexity: Medium
Primary Systems Affected:
- src/app/api/projects/route.ts - Project creation API
- src/lib/studio/shared-doc-tools.ts - AI SDK tools
- src/app/api/chat/route.ts - Asset Gen Chat API
Dependencies: None (uses existing Prisma, Zod, Vercel AI SDK patterns)
---
CONTEXT REFERENCES
Relevant Codebase Files YOU MUST READ THESE FILES BEFORE IMPLEMENTING!
| File | Lines | Why |
|------|-------|-----|
| src/app/api/projects/route.ts | 18-22, 114, 146-196 | Schema definition, POST handler, initialization logic |
| src/lib/studio/shared-doc-tools.ts | 1-230 | Tool implementations, error paths |
| src/app/api/chat/route.ts | 24-25, 368 | Shared doc tools import and usage |
| src/components/dashboard/NewProjectDialog.tsx | 49, 61 | Frontend sends startWith values |
New Files to Create
None required. This is a bug fix in existing files.
Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!
- Vercel AI SDK Tools (https://sdk.vercel.ai/docs/reference/ai-sdk-core#tool-calling) - Tool execution patterns
- Zod Enum Documentation (https://zod.dev/?id=enums) - Enum schema patterns
Patterns to Follow
Error Handling Pattern (from shared-doc-tools.ts lines 66-84):
try {
  // Query database
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { projectId: true },
  });
  if (!game?.projectId) {
    console.warn('⚠️ Game not linked to project:', gameId);
    return {
      success: false,
      error: '🚨 GAME NOT LINKED TO PROJECT\n\n...',
      documentType,
      requiresProjectLink: true,
    };
  }
} catch (error) {
  console.error('❌ Failed to read shared doc:', error);
  return { success: false, error: 'Failed to read document', documentType };
}
Logging Pattern (from codebase):
console.log('📖 Reading shared doc:', documentType);
console.warn('⚠️ Game not linked to project:', gameId);
console.error('❌ Failed to read shared doc:', error);
Zod Schema Pattern (from route.ts lines 18-22):
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["2d", "3d", "hybrid"]).default("2d"),
  startWith: z.enum(["assets", "game"]).default("assets"),
});
---
IMPLEMENTATION PLAN
Phase 1: Foundation
Update the project creation schema to accept "both" and fix initialization logic.
Phase 2: Core Implementation
Create project-scoped shared doc tools that accept projectId directly.
Phase 3: Integration
Update Asset Gen Chat to use project-scoped tools.
Phase 4: Testing & Validation
Verify the fix with lint, typecheck, and manual testing.
---
STEP-BY-STEP TASKS
Task 1: UPDATE src/app/api/projects/route.ts
- IMPLEMENT: Add "both" to the startWith enum and fix initialization logic
- PATTERN: route.ts:18-22 (current enum definition)
- IMPORTS: No new imports needed
- GOTCHA: 
  - The frontend defaults to "both" but current schema defaults to "assets"
  - Need to handle both "game" AND "both" for shared doc initialization
- VALIDATE: bun run typecheck
Changes Required:
// Line 21: Change from:
startWith: z.enum(["assets", "game"]).default("assets"),
// To:
startWith: z.enum(["assets", "game", "both"]).default("assets"),
// Lines 175-196: Change from:
if (startWith === "game") {
  const game = await prisma.game.create({
    data: {
      userId: userId,
      name: ${name} Game,
      phase: "planning",
      projectId: project.id,
    },
  });
  gameId = game.id;
  // Initialize shared documents for the project (game-design.md, asset-inventory.md, etc.)
  await initializeSharedDocuments(project.id);
  // Update project with game reference
  await prisma.project.update({
    where: { id: project.id },
    data: {
      gameId: game.id,
      phase: "building",
    },
  });
}
// To:
if (startWith === "game" || startWith === "both") {
  // For "both" mode, we still create the game so it can be linked
  const game = await prisma.game.create({
    data: {
      userId: userId,
      name: ${name} Game,
      phase: startWith === "both" ? "planning" : "planning",
      projectId: project.id,
    },
  });
  gameId = game.id;
  // Initialize shared documents for the project (game-design.md, asset-inventory.md, etc.)
  await initializeSharedDocuments(project.id);
  // Update project with game reference
  await prisma.project.update({
    where: { id: project.id },
    data: {
      gameId: game.id,
      phase: startWith === "both" ? "assets" : "building",
    },
  });
}
---
Task 2: UPDATE src/lib/studio/shared-doc-tools.ts
- IMPLEMENT: Add project-scoped tool variants that accept projectId directly
- PATTERN: shared-doc-tools.ts:55-124 (existing readSharedDocTool implementation)
- IMPORTS: No new imports needed
- GOTCHA: 
  - Don't break existing game-scoped tools (used by Game Mode chat)
  - Keep duplicate logic or refactor to share common query logic
- VALIDATE: bun run typecheck
Add after line 230 (after createSharedDocTools):
// =============================================================================
// PROJECT-SCOPED TOOLS (for Asset Gen Chat)
// =============================================================================
/**
 * Create AI tool for reading shared documents by project ID
 * Used by Asset Gen Chat when no game exists yet
 */
export const readSharedDocToolByProject = (projectId: string) => {
  return tool({
    description:
      'Read a shared document to understand project context. Use this at the start of conversations to understand the game design, assets, and previous decisions. Available documents: game-design.md, asset-inventory.md, scene-notes.md, development-log.md.',
    inputSchema: readSharedDocSchema,
    execute: async ({ documentType }) => {
      try {
        console.log('📖 [Project] Reading shared doc:', documentType);
        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true },
        });
        if (!project) {
          console.warn('⚠️ [Project] Project not found:', projectId);
          return {
            success: false,
            error: 'Project not found',
            documentType,
          };
        }
        // Fetch from MemoryFile
        const memoryFile = await prisma.memoryFile.findUnique({
          where: {
            projectId_type: { projectId, type: documentType },
          },
        });
        if (!memoryFile) {
          // Return template for new document
          const template = getDocTemplate(documentType as SharedDocumentType);
          console.log('📝 [Project] Returning template for new doc:', documentType);
          return {
            success: true,
            content: template,
            isNew: true,
            documentType,
            message: Document "" doesn't exist yet. Here's a template to get started.,
          };
        }
        console.log('✅ [Project] Found shared doc:', documentType);
        return {
          success: true,
          content: memoryFile.content,
          isNew: false,
          documentType,
          updatedAt: memoryFile.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('❌ [Project] Failed to read shared doc:', error);
        return {
          success: false,
          error: 'Failed to read document',
          documentType,
        };
      }
    },
  });
};
/**
 * Create AI tool for updating shared documents by project ID
 * Used by Asset Gen Chat when no game exists yet
 */
export const updateSharedDocToolByProject = (projectId: string) => {
  return tool({
    description:
      'Update a shared document with new information. Use append=true to add entries (for development-log.md). Use append=false to replace the entire document (for game-design.md, scene-notes.md). This persists context between sessions.',
    inputSchema: updateSharedDocSchema,
    execute: async ({ documentType, content, append }) => {
      try {
        console.log('✍️ [Project] Updating shared doc:', documentType, 'append:', append);
        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true },
        });
        if (!project) {
          console.warn('⚠️ [Project] Project not found:', projectId);
          return {
            success: false,
            error: 'Project not found',
            documentType,
          };
        }
        let finalContent: string;
        if (append) {
          // Get existing content and append
          const existing = await prisma.memoryFile.findUnique({
            where: { projectId_type: { projectId, type: documentType } },
          });
          const existingContent = existing?.content || '';
          finalContent = existingContent
            ? ${existingContent}\n\n
            : content;
        } else {
          finalContent = content;
        }
        // Upsert MemoryFile
        await prisma.memoryFile.upsert({
          where: { projectId_type: { projectId, type: documentType } },
          update: {
            content: finalContent,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            type: documentType,
            content: finalContent,
          },
        });
        console.log('✅ [Project] Updated shared doc:', documentType);
        return {
          success: true,
          message: append
            ? Appended content to ""
            : Updated "",
          documentType,
          contentLength: finalContent.length,
        };
      } catch (error) {
        console.error('❌ [Project] Failed to update shared doc:', error);
        return {
          success: false,
          error: 'Failed to update document',
          documentType,
        };
      }
    },
  });
};
/**
 * Create all shared document tools for a project
 * Use this when you have projectId but not gameId (Asset Gen Chat)
 */
export function createSharedDocToolsByProject(projectId: string) {
  return {
    readSharedDoc: readSharedDocToolByProject(projectId),
    updateSharedDoc: updateSharedDocToolByProject(projectId),
  };
}
---
Task 3: UPDATE src/app/api/chat/route.ts
- IMPLEMENT: Import and use project-scoped tools instead of game-scoped tools
- PATTERN: route.ts:24-25 (current imports), route.ts:368 (current usage)
- IMPORTS: Add createSharedDocToolsByProject import
- GOTCHA: 
  - The tools are created per-request using the projectId
  - Don't confuse with createSharedDocTools which expects gameId
- VALIDATE: bun run typecheck
Changes Required:
Line 25: Change from:
import { createSharedDocTools } from '@/lib/studio/shared-doc-tools';
To:
import { createSharedDocToolsByProject } from '@/lib/studio/shared-doc-tools';
Line 368: Change from:
...createSharedDocTools(projectId),
To:
...createSharedDocToolsByProject(projectId),
---
Task 4: VALIDATE changes
# Run type checking
bun run typecheck
# Run linting
bun run lint
# Verify no syntax errors
---
TESTING STRATEGY
Unit Tests
No unit tests required for this bug fix (existing test patterns are for more complex features). Focus on manual validation.
Integration Tests
Manual testing via:
1. Frontend: Create project with "Both" option
2. Frontend: Navigate to Asset Gen Chat
3. AI: Try reading shared documents (should work, not show "Game not linked" error)
4. AI: Try updating shared documents (should persist to MemoryFile)
Edge Cases
| Edge Case | Expected Behavior |
|-----------|-------------------|
| Create project with "Assets First" | Shared docs NOT initialized (correct, no game mode expected) |
| Create project with "Game First" | Shared docs initialized, tools work |
| Create project with "Both" | Shared docs initialized, tools work |
| Existing project without game | Tools should handle gracefully |
---
VALIDATION COMMANDS
Level 1: Syntax & Style
cd src
bun run typecheck
bun run lint
Level 2: No Additional Tests
No unit tests exist for this code path. Manual validation required.
Level 3: Manual Validation
1. Start dev server: bun dev
2. Open browser to http://localhost:3000
3. Click "New Project"
4. Select "Both" option
5. Create project
6. Navigate to Asset Gen Chat
7. Ask: "What shared documents exist for this project?"
8. Verify AI responds with document templates (not "Game not linked" error)
---
ACCEPTANCE CRITERIA
- [ ] Schema accepts "both" as valid startWith value
- [ ] Shared documents initialized for both "game" AND "both" flows
- [ ] Asset Gen Chat uses project-scoped tools that accept projectId
- [ ] AI can read shared documents without "Game not linked" error
- [ ] AI can update shared documents successfully
- [ ] bun run typecheck passes with zero errors
- [ ] bun run lint passes with zero errors
---
COMPLETION CHECKLIST
- [ ] All 3 tasks completed in order
- [ ] Task 1: Schema updated for "both" option
- [ ] Task 2: Project-scoped tools added
- [ ] Task 3: Asset Gen Chat uses project-scoped tools
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Manual validation confirms fix works
---
NOTES
Design Decision: Project-Scoped vs Game-Scoped Tools
We chose to create separate tool functions (readSharedDocToolByProject) rather than modifying existing functions to accept either projectId or gameId because:
1. Clarity: It's immediately obvious which variant to use
2. Type Safety: No union types that could cause confusion
3. Maintainability: Changes to game-scoped tools won't affect asset chat and vice versa
4. Minimal Code Duplication: The logic is identical, just the initial lookup differs
Future Enhancement
If both Asset Gen and Game Mode need to share tools, we could refactor to:
function createSharedDocTools(params: { projectId: string } | { gameId: string }) {
  // Extract projectId from either source, then share implementation
}
But for now, explicit separation is clearer.
Files Modified
1. src/app/api/projects/route.ts - Schema and initialization logic
2. src/lib/studio/shared-doc-tools.ts - Project-scoped tool variants
3. src/app/api/chat/route.ts - Import and usage update
---
Confidence Score: 9/10
All root causes identified with specific code locations. Fix approach is minimal and surgical. No architectural changes required.
Report:
- Summary: Fix shared documents initialization bug by adding "both" to schema, expanding initialization logic, and creating project-scoped tool variants for Asset Gen Chat.
- Full Path: .agents/plans/fix-shared-docs-initialization.md
- Complexity: Medium (3 files, straightforward changes)
- Key Risks: None identified - changes are isolated and follow existing patterns
