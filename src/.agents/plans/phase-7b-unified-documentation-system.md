# Feature: Phase 7b - Unified Documentation System for Assets↔Game Context Bridge

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Phase 7b implements a **Unified Documentation System** that allows living documents to flow between Asset Hatch and Hatch Studios tabs, enabling AI tools in both modes to read and write shared context. This mirrors how Asset Hatch already uses markdown/JSON documents (`entities.json`, `style-anchor.json`) to maintain context between planning/style/generation phases.

**The Problem:**
- `project-context.json` exists in MemoryFile but isn't accessible to AI tools
- AI in Game tab can't read what was discussed in Assets tab
- AI in Assets tab can't document decisions that would help Game tab
- No tools exist for AI to read/write shared documents

**The Solution:**
Create a set of **shared living documents** that both tabs can read/write:
1. `game-design.md` - Game concept, mechanics, design decisions
2. `asset-inventory.md` - Characters, environments, items with relationships
3. `scene-notes.md` - Level design, placement hints, camera positions
4. `development-log.md` - AI decisions, code patterns, gotchas discovered

These become the "shared brain" between Assets and Game modes.

## User Story

As a game developer using Hatch Studios,
I want AI-generated assets to automatically populate a shared document that the Game tab AI can read,
So that when I switch to coding my game, the AI already knows about my characters, their animations, and how they're intended to be used.

As an AI assistant in the Game tab,
I want to be able to read and write documentation about game design decisions,
So that I can record patterns and decisions that help future AI sessions.

## Problem Statement

**Current State:**
```
Assets Tab:
  ├── Chat records: conversation.json
  ├── Plan: entities.json
  └── Style: style-anchor.json
       ↓ (gap - nothing shared)
Game Tab:
  ├── Chat: isolated
  └── Code: isolated
```

**The Gap:**
- `project-context.json` exists in database but:
  - Not exposed as AI tools (read/write)
  - Not included in memory-files schema
  - Not passed to AI in useful format
  - No structure for AI to understand/document relationships

**Consequence:**
Every time user switches tabs, AI loses all context. Must re-explain game concept, character details, etc.

## Solution Statement

Implement a **Unified Documentation System** with:

1. **Shared Memory File Types** - Add to Zod schema:
   - `game-design.md` - Game concept, target audience, key features
   - `asset-inventory.md` - Characters, environments, their properties
   - `scene-notes.md` - Level design, placement hints
   - `development-log.md` - AI decisions, patterns, gotchas

2. **AI Tools for Both Tabs**:
   - `readSharedDoc(tool: "game-design" | "asset-inventory" | "scene-notes" | "development-log")`
   - `updateSharedDoc(tool: string, content: string, append: boolean)`

3. **Auto-Population Triggers**:
   - When 3D asset completes → append to `asset-inventory.md`
   - When game concept defined → write to `game-design.md`
   - When code patterns discovered → append to `development-log.md`

4. **Context Injection**:
   - System prompt reads relevant docs
   - AI starts with full context awareness

## Feature Metadata

**Feature Type**: New Capability (Architecture Extension)
**Estimated Complexity**: Medium-High
**Primary Systems Affected**:
- MemoryFile schema and API (`/api/projects/[id]/memory-files`)
- Game tools (`/lib/studio/game-tools.ts`)
- Chat integration (`/api/studio/chat/route.ts`)
- Babylon system prompt (`/lib/studio/babylon-system-prompt.ts`)
- Asset generation hooks (for auto-population)

**Dependencies**: None (uses existing infrastructure)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

| File | Lines | Relevance |
|------|-------|-----------|
| `src/app/api/projects/[id]/memory-files/route.ts` | 1-175 | **CRITICAL** - MemoryFile API, Zod schema (line 96-103) |
| `src/lib/types/shared-context.ts` | 1-100 | **CRITICAL** - UnifiedProjectContext type, patterns to follow |
| `src/app/api/projects/[id]/context/route.ts` | 1-232 | Context API pattern, empty context fallback |
| `src/lib/studio/game-tools.ts` | 1-1090 | **CRITICAL** - Tool pattern, factory function at line 1056 |
| `src/app/api/studio/chat/route.ts` | 1-140 | Chat integration, projectContext parsing (line 56-67) |
| `src/lib/studio/babylon-system-prompt.ts` | 1-231 | System prompt template, asset section |
| `src/prisma/schema.prisma` | 127-138 | MemoryFile model, unique constraint on projectId_type |
| `src/memory/MEMORY_SYSTEM.md` | 1-411 | **CRITICAL** - Living document pattern for AI context |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/studio/shared-doc-tools.ts` | AI tools for reading/writing shared documents |
| `src/lib/studio/doc-templates.ts` | Templates for each shared document type |
| `src/lib/studio/doc-auto-populator.ts` | Triggers to auto-populate docs on events |
| `src/types/shared-documents.ts` | TypeScript interfaces for document content |

### Files to UPDATE

| File | Changes |
|------|---------|
| `src/app/api/projects/[id]/memory-files/route.ts` | Add new memory file types to Zod schema |
| `src/lib/studio/game-tools.ts` | Add shared doc tools to createGameTools() |
| `src/lib/studio/babylon-system-prompt.ts` | Inject shared docs into system prompt |
| `src/app/api/studio/chat/route.ts` | Fetch and pass shared docs to system prompt |
| `src/lib/types/shared-context.ts` | Add document type references |

### Pattern Reference: AI Tool Creation (from `src/lib/studio/game-tools.ts:58-93`)

```typescript
export const createSceneTool = (gameId: string) => {
  return tool({
    description: 'Create a new scene/level for the game...',
    inputSchema: createSceneSchema,
    execute: async ({ name, orderIndex }: CreateSceneInput) => {
      // Implementation
      return { success: true, message: `Created scene "${name}"` };
    },
  });
};
```

### Pattern Reference: System Prompt Injection (from `src/app/api/studio/chat/route.ts:98-108`)

```typescript
// Build extended context with project context
let systemPromptContext = JSON.stringify(gameContext, null, 2);
if (projectContext?.gameConcept) {
  systemPromptContext += `\n\nPROJECT CONTEXT:\n${projectContext.gameConcept}`;
  // ... add characters, keyFeatures
}
```

---

## UNIFIED DOCUMENTATION ARCHITECTURE

### Document Types and Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED DOCUMENTATION SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    Auto-populate    ┌─────────────────────┐    │
│  │  Asset Hatch    │ ─────────────────▶  │  asset-inventory.md │    │
│  │  (Assets Tab)   │                     │  (Markdown)         │    │
│  └─────────────────┘                     └──────────┬──────────┘    │
│         │                                             │              │
│         │ User defines                               │              │
│         │ game concept                              │              │
│         ▼                                             ▼              │
│  ┌─────────────────┐                     ┌─────────────────────┐    │
│  │  game-design.md │ ◀────────────────── │  Hatch Studios      │    │
│  │  (Markdown)     │    AI documents     │  (Game Tab)         │    │
│  └────────┬────────┘    decisions        └─────────────────────┘    │
│           │                                               │          │
│           │ AI reads to                                 │          │
│           │ understand context                          │          │
│           ▼                                               ▼          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  AI CONTEXT (System Prompt)                  │    │
│  │  "You are building a game where:                            │    │
│  │   - Concept: [game-design.md]                               │    │
│  │   - Assets: [asset-inventory.md]                            │    │
│  │   - Scenes: [scene-notes.md]                                │    │
│  │   - Patterns: [development-log.md]"                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Document Specifications

#### 1. `game-design.md`
**Purpose**: High-level game design document
**Written By**: User (via Assets tab chat) or AI (when user describes game)
**Read By**: Both tabs (AI uses this to understand the game)

```markdown
# Game Design Document

## Concept
A brief description of the game concept and vision.

## Target Audience
Who is this game for?

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Gameplay Mechanics
Describe core mechanics.

## Visual Style
Reference to style anchor and visual direction.

## Notes
Additional design notes.
```

#### 2. `asset-inventory.md`
**Purpose**: Living inventory of all assets with relationships
**Written By**: Asset Hatch (auto-populated on generation) + AI (add notes)
**Read By**: Game tab AI (to understand what assets exist and how to use them)

```markdown
# Asset Inventory

## Characters
### Knight (ID: knight-001)
- **Description**: A brave knight in shining armor
- **Animations**: idle, walk, attack, die
- **Asset ID**: generated-3d-asset-123
- **Notes**: Use for player character. Attack animation starts at frame 30.

### Goblin (ID: goblin-002)
- **Description**: Small green goblin with club
- **Animations**: idle, walk, attack
- **Asset ID**: generated-3d-asset-456
- **Notes**: Use for enemy. Spawn in groups of 3-5.

## Environments
### Forest Skybox (ID: forest-sky)
- **Type**: skybox
- **Asset ID**: generated-3d-asset-789
- **Notes**: Use for outdoor scenes only.

## Items
[... item entries ...]
```

#### 3. `scene-notes.md`
**Purpose**: Level design notes, camera positions, placement hints
**Written By**: Game tab AI (as it designs levels)
**Read By**: Game tab AI (continuity across sessions)

```markdown
# Scene Notes

## Main Level (Scene 1)
### Recommended Camera
- ArcRotateCamera
- Radius: 25
- Height Offset: 8
- Rotation Offset: 180

### Player Start Position
- x: 0
- y: 0
- z: 0

### Recommended Asset Placements
- Knight at (0, 0, 0) - Player start
- Ground plane at (0, -0.5, 0)
- Trees around perimeter

## Level 2
[... scene notes ...]
```

#### 4. `development-log.md`
**Purpose**: AI decisions, code patterns, gotchas discovered
**Written By**: Game tab AI (auto-record decisions)
**Read By**: Game tab AI (continuity, avoid repeating mistakes)

```markdown
# Development Log

## 2026-01-18
### Decision: Multi-file Structure
We split the game into:
- main.js: Engine setup
- player.js: Player creation
- level.js: Level geometry
- game.js: Game loop
Reason: AI SDK requires multi-file structure.

### Gotcha: Physics Initialization
Havok physics must be initialized AFTER the scene is created.
Code: `const havokInstance = await HavokPhysics();`
Then: `scene.enablePhysics(gravity, new BABYLON.HavokPlugin(true, havokInstance));`

### Pattern: Asset Loading
Always load assets AFTER the scene is ready.
Use: `BABYLON.SceneLoader.ImportMeshAsync("", url, scene).then((result) => {...});`
```

---

## PATTERNS TO FOLLOW

### Memory File Pattern (from `src/app/api/projects/[id]/memory-files/route.ts:94-107`)

```typescript
const memoryFileSchema = z.object({
  type: z.enum([
    'project.json',
    'entities.json',
    'style-anchor.json',
    'generation-log.json',
    'conversation.json',
    'style-draft',
    // ADD:
    'game-design.md',
    'asset-inventory.md',
    'scene-notes.md',
    'development-log.md',
  ]),
  content: z.string()...,
});
```

### Tool Factory Pattern (from `src/lib/studio/game-tools.ts:1056-1089`)

```typescript
export function createGameTools(gameId: string) {
  return {
    // Existing tools...
    createScene: createSceneTool(gameId),
    // ... etc
    
    // NEW: Shared document tools
    readSharedDoc: readSharedDocTool(gameId),
    updateSharedDoc: updateSharedDocTool(gameId),
  };
}
```

### Chat Context Injection (from `src/app/api/studio/chat/route.ts:98-108`)

```typescript
// Fetch shared documents
const sharedDocs = await fetchSharedDocuments(projectId);

// Build context string
let contextString = `GAME DESIGN:\n${docs['game-design.md'] || '(No design document)'}`;
contextString += `\n\nASSET INVENTORY:\n${docs['asset-inventory.md'] || '(No inventory)'}`;
contextString += `\n\nSCENE NOTES:\n${docs['scene-notes.md'] || '(No notes)'}`;
contextString += `\n\nDEVELOPMENT LOG:\n${docs['development-log.md'] || '(No log)'}`;

// Inject into system prompt
const systemPrompt = getBabylonSystemPrompt(gameId, contextString, linkedAssets);
```

---

## IMPLEMENTATION PLAN

### Phase 1: Document Schema & Templates

Define document types and create templates.

**Tasks:**

- **UPDATE** `src/app/api/projects/[id]/memory-files/route.ts`
  - **LOCATION**: Lines 96-103 (Zod schema)
  - **ADD**: New document types to enum
  - **VALIDATE**: `bun run typecheck`

```typescript
type: z.enum([
  'project.json',
  'entities.json',
  'style-anchor.json',
  'generation-log.json',
  'conversation.json',
  'style-draft',
  // NEW:
  'game-design.md',
  'asset-inventory.md',
  'scene-notes.md',
  'development-log.md',
]),
```

- **CREATE** `src/lib/studio/doc-templates.ts`
  - **PURPOSE**: Initial templates for each document type
  - **FUNCTIONS**: `getGameDesignTemplate()`, `getAssetInventoryTemplate()`, etc.
  - **PATTERN**: Return markdown strings with placeholders

```typescript
export function getGameDesignTemplate(): string {
  return `# Game Design Document

## Concept
_Brief description of your game..._

## Target Audience
_Who is this game for?_

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Gameplay Mechanics
_Describe core gameplay..._

## Visual Style
_Reference style anchor or describe visual direction..._
`;
}
```

- **CREATE** `src/types/shared-documents.ts`
  - **PURPOSE**: TypeScript interfaces for document parsing
  - **INTERFACES**: `GameDesignDoc`, `AssetInventoryDoc`, `SceneNotesDoc`, `DevLogDoc`

### Phase 2: Shared Document Tools

Create AI SDK tools for reading and writing shared documents.

**Tasks:**

- **CREATE** `src/lib/studio/shared-doc-tools.ts`
  - **PATTERN**: Follow `src/lib/studio/game-tools.ts:58-93`
  - **TOOLS**: `readSharedDocTool`, `updateSharedDocTool`

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getDocTemplates } from './doc-templates';

// Input schema
const readSharedDocSchema = z.object({
  documentType: z.enum([
    'game-design.md',
    'asset-inventory.md',
    'scene-notes.md',
    'development-log.md',
  ]),
});

const updateSharedDocSchema = z.object({
  documentType: z.enum([
    'game-design.md',
    'asset-inventory.md',
    'scene-notes.md',
    'development-log.md',
  ]),
  content: z.string(),
  append: z.boolean().default(false),
});

export const readSharedDocTool = (gameId: string) => {
  return tool({
    description: 'Read a shared document to understand project context. Use this at the start of conversation to understand the game design, assets, and previous decisions.',
    inputSchema: readSharedDocSchema,
    execute: async ({ documentType }) => {
      // Get game with projectId
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { project: true },
      });
      
      if (!game?.projectId) {
        return { success: false, error: 'Game not linked to project' };
      }
      
      // Fetch from MemoryFile
      const memoryFile = await prisma.memoryFile.findUnique({
        where: { projectId_type: { projectId: game.projectId, type: documentType } },
      });
      
      if (!memoryFile) {
        // Return template for new document
        const templates = getDocTemplates();
        return {
          success: true,
          content: templates[documentType],
          isNew: true,
          documentType,
        };
      }
      
      return {
        success: true,
        content: memoryFile.content,
        isNew: false,
        documentType,
        updatedAt: memoryFile.updatedAt.toISOString(),
      };
    },
  });
};

export const updateSharedDocTool = (gameId: string) => {
  return tool({
    description: 'Update a shared document with new information. Use append=true to add entries (like development log). Use append=false to replace the entire document.',
    inputSchema: updateSharedDocSchema,
    execute: async ({ documentType, content, append }) => {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { project: true },
      });
      
      if (!game?.projectId) {
        return { success: false, error: 'Game not linked to project' };
      }
      
      let finalContent: string;
      
      if (append) {
        // Get existing content
        const existing = await prisma.memoryFile.findUnique({
          where: { projectId_type: { projectId: game.projectId, type: documentType } },
        });
        
        const existingContent = existing?.content || '';
        finalContent = `${existingContent}\n\n${content}`;
      } else {
        finalContent = content;
      }
      
      // Upsert MemoryFile
      await prisma.memoryFile.upsert({
        where: { projectId_type: { projectId: game.projectId, type: documentType } },
        update: { content: finalContent },
        create: {
          projectId: game.projectId,
          type: documentType,
          content: finalContent,
        },
      });
      
      return {
        success: true,
        message: `Updated ${documentType}`,
        documentType,
        contentLength: finalContent.length,
      };
    },
  });
};

export function createSharedDocTools(gameId: string) {
  return {
    readSharedDoc: readSharedDocTool(gameId),
    updateSharedDoc: updateSharedDocTool(gameId),
  };
}
```

### Phase 3: Babylon System Prompt Integration

Update system prompt to include shared documents.

**Tasks:**

- **CREATE** `src/lib/studio/shared-doc-formatter.ts`
  - **PURPOSE**: Format shared docs for system prompt
  - **FUNCTION**: `formatSharedDocsForPrompt(docs: Record<string, string>): string`

```typescript
export function formatSharedDocsForPrompt(docs: Record<string, string>): string {
  const sections: string[] = [];
  
  if (docs['game-design.md']) {
    sections.push(`## GAME DESIGN\n${docs['game-design.md']}`);
  }
  
  if (docs['asset-inventory.md']) {
    sections.push(`## ASSET INVENTORY\n${docs['asset-inventory.md']}`);
  }
  
  if (docs['scene-notes.md']) {
    sections.push(`## SCENE NOTES\n${docs['scene-notes.md']}`);
  }
  
  if (docs['development-log.md']) {
    sections.push(`## DEVELOPMENT LOG\n${docs['development-log.md']}`);
  }
  
  if (sections.length === 0) {
    return '\n\nNo shared documents yet. Ask the user about the game concept and assets.';
  }
  
  return '\n\n' + sections.join('\n\n---\n\n');
}
```

- **UPDATE** `src/lib/studio/babylon-system-prompt.ts`
  - **LOCATION**: Around line 105-130 (AVAILABLE ASSETS section)
  - **ADD**: Shared documents section after current assets

```typescript
AVAILABLE ASSETS:
${currentAssets ? currentAssets.map((a) => "- " + a.key + ": " + a.type + ", \"" + a.name + "\"").join("\n") || "- No assets linked yet" : "- No assets linked yet"}

${sharedDocsSection || ""}
```

### Phase 4: Chat Route Integration

Update chat route to fetch and inject shared docs.

**Tasks:**

- **UPDATE** `src/app/api/studio/chat/route.ts`
  - **LOCATION**: After line 67 (projectContext parsing)
  - **ADD**: Fetch shared documents from project

```typescript
// Fetch shared documents for context
let sharedDocs: Record<string, string> = {};
if (game.projectId) {
  const docTypes = ['game-design.md', 'asset-inventory.md', 'scene-notes.md', 'development-log.md'];
  
  for (const docType of docTypes) {
    const memoryFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId: game.projectId, type: docType } },
    });
    
    if (memoryFile) {
      sharedDocs[docType] = memoryFile.content;
    }
  }
}

// Build context string
const contextString = formatSharedDocsForPrompt(sharedDocs);

// Pass to system prompt
const systemPrompt = getBabylonSystemPrompt(gameId, contextString, linkedAssets);
```

### Phase 5: Auto-Population Triggers

Automatically populate `asset-inventory.md` when assets complete.

**Tasks:**

- **CREATE** `src/lib/studio/doc-auto-populator.ts`
  - **PURPOSE**: Functions to append asset info to inventory
  - **FUNCTIONS**: `appendAssetToInventory()`, `recordDevelopmentDecision()`

```typescript
export async function appendAssetToInventory(
  projectId: string,
  asset: {
    name: string;
    type: string;
    assetId: string;
    animations?: string[];
    description?: string;
  }
): Promise<void> {
  const entry = `
### ${asset.name} (ID: ${asset.assetId})
- **Type**: ${asset.type}
- **Description**: ${asset.description || 'No description'}
- **Animations**: ${asset.animations?.join(', ') || 'None'}
- **Asset ID**: ${asset.assetId}
`;

  // Fetch existing inventory
  const existing = await prisma.memoryFile.findUnique({
    where: { projectId_type: { projectId, type: 'asset-inventory.md' } },
  });

  const existingContent = existing?.content || '# Asset Inventory\n\n(Coming soon)';
  const newContent = `${existingContent}\n${entry}`;

  await prisma.memoryFile.upsert({
    where: { projectId_type: { projectId, type: 'asset-inventory.md' } },
    update: { content: newContent },
    create: {
      projectId,
      type: 'asset-inventory.md',
      content: newContent,
    },
  });
}
```

- **INTEGRATE** with asset generation completion
  - Find where 3D asset generation completes
  - Call `appendAssetToInventory()` after approval

### Phase 6: Testing & Validation

**Tasks:**

- **CREATE** `src/lib/studio/shared-doc-tools.test.ts`
  - Test `readSharedDocTool` with existing/non-existing docs
  - Test `updateSharedDocTool` with append mode
  - Test `createSharedDocTools` factory

- **CREATE** `src/lib/studio/shared-doc-formatter.test.ts`
  - Test formatting with various doc combinations
  - Test empty docs case

---

## STEP-BY-STEP TASKS

### Task 1.1: UPDATE memory-files route schema

- **ACTION**: Modify `src/app/api/projects/[id]/memory-files/route.ts`
- **LOCATION**: Lines 96-103
- **ADD**: New document types to enum
- **VALIDATE**: `bun run typecheck`

### Task 1.2: CREATE doc-templates.ts

- **ACTION**: Create new file
- **TARGET**: `src/lib/studio/doc-templates.ts`
- **OUTPUT**: 4 template functions returning markdown strings
- **VALIDATE**: `bun run typecheck`

### Task 1.3: CREATE shared-documents.ts types

- **ACTION**: Create new file
- **TARGET**: `src/types/shared-documents.ts`
- **OUTPUT**: TypeScript interfaces for document parsing
- **VALIDATE**: `bun run typecheck`

### Task 2.1: CREATE shared-doc-tools.ts

- **ACTION**: Create new file
- **TARGET**: `src/lib/studio/shared-doc-tools.ts`
- **PATTERN**: Follow game-tools.ts pattern (lines 58-93)
- **VALIDATE**: `bun run typecheck && bun run lint`

### Task 2.2: UPDATE game-tools.ts

- **ACTION**: Modify `src/lib/studio/game-tools.ts`
- **LOCATION**: Line 1056 (createGameTools function)
- **ADD**: `readSharedDoc` and `updateSharedDoc` to returned object
- **VALIDATE**: `bun run typecheck`

### Task 3.1: CREATE shared-doc-formatter.ts

- **ACTION**: Create new file
- **TARGET**: `src/lib/studio/shared-doc-formatter.ts`
- **OUTPUT**: `formatSharedDocsForPrompt()` function
- **VALIDATE**: `bun run typecheck`

### Task 3.2: UPDATE babylon-system-prompt.ts

- **ACTION**: Modify `src/lib/studio/babylon-system-prompt.ts`
- **LOCATION**: Around line 105-130
- **ADD**: Shared docs section in template
- **VALIDATE**: `bun run typecheck`

### Task 4.1: UPDATE studio chat route

- **ACTION**: Modify `src/app/api/studio/chat/route.ts`
- **LOCATION**: After line 67
- **ADD**: Fetch shared docs, format, inject into system prompt
- **PATTERN**: Use prisma to fetch from MemoryFile
- **VALIDATE**: `bun run typecheck`

### Task 5.1: CREATE doc-auto-populator.ts

- **ACTION**: Create new file
- **TARGET**: `src/lib/studio/doc-auto-populator.ts`
- **OUTPUT**: Functions to append assets/logs to documents
- **VALIDATE**: `bun run typecheck`

### Task 5.2: INTEGRATE auto-population

- **ACTION**: Find asset generation completion point
- **ADD**: Call `appendAssetToInventory()` after asset approval
- **PATTERN**: Look in `src/app/api/projects/[id]/3d-assets/` routes

### Task 6.1: WRITE shared-doc-tools tests

- **ACTION**: Create `src/lib/studio/shared-doc-tools.test.ts`
- **COVERAGE**: Tool execution with mocked Prisma
- **VALIDATE**: `bun run test -- shared-doc-tools`

### Task 6.2: RUN full validation

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
- `src/lib/studio/shared-doc-tools.ts` - Tool execution
- `src/lib/studio/shared-doc-formatter.ts` - Formatting
- `src/lib/studio/doc-templates.ts` - Template generation

**Mock strategy:**
- Mock `prisma.memoryFile.findUnique()` and `upsert()`
- Mock `prisma.game.findUnique()` for game→project lookup

**Example test:**
```typescript
describe('readSharedDocTool', () => {
  it('should return template for non-existing document', async () => {
    prisma.game.findUnique.mockResolvedValue({ 
      id: 'game-1', 
      projectId: 'proj-1',
    });
    prisma.memoryFile.findUnique.mockResolvedValue(null);
    
    const tool = readSharedDocTool('game-1');
    const result = await tool.execute({ documentType: 'game-design.md' });
    
    expect(result.success).toBe(true);
    expect(result.isNew).toBe(true);
    expect(result.content).toContain('Game Design Document');
  });
  
  it('should return existing content', async () => {
    prisma.game.findUnique.mockResolvedValue({ 
      id: 'game-1', 
      projectId: 'proj-1',
    });
    prisma.memoryFile.findUnique.mockResolvedValue({
      content: '# Existing content',
      updatedAt: new Date(),
    });
    
    const tool = readSharedDocTool('game-1');
    const result = await tool.execute({ documentType: 'game-design.md' });
    
    expect(result.success).toBe(true);
    expect(result.isNew).toBe(false);
    expect(result.content).toBe('# Existing content');
  });
});
```

### Integration Tests

- Test complete flow: read doc → update doc → read again
- Test append mode in updateSharedDoc
- Test chat route integration with shared docs

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Game not linked to project | Return error "Game not linked" |
| MemoryFile create fails | Try-catch, return error |
| Empty content | Allow (user might want to clear) |
| Very large content | Zod validation already limits to 10MB |

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
bun run test -- shared-doc-tools
bun run test -- shared-doc-formatter

# Full test suite
bun run test:ci
```

### Level 3: Integration Tests

```bash
# Start dev server
bun dev

# Test API directly
# 1. Create project
# 2. Call GET /api/projects/[id]/memory-files?type=game-design.md
# 3. Should return template
# 4. Call POST to update
# 5. Call GET again - should return updated content

# Test in UI
# 1. Open Assets tab
# 2. Describe game concept
# 3. Check game-design.md was created
# 4. Switch to Game tab
# 5. Call readSharedDoc tool
# 6. Verify AI has game context
```

### Level 4: Manual Validation

1. Create new project
2. In Assets tab, describe a game concept
3. Generate some 3D assets
4. Switch to Game tab
5. Ask AI: "What kind of game am I building?"
6. Verify AI can answer based on shared docs
7. Ask AI to document a code pattern
8. Verify it writes to development-log.md
9. Refresh page, ask again
10. Verify persistence across sessions

### Level 5: Additional Validation

```bash
# Prisma Studio - verify MemoryFile entries
bunx prisma studio
# Check MemoryFile table for:
# - game-design.md
# - asset-inventory.md
# - scene-notes.md
# - development-log.md
```

---

## ACCEPTANCE CRITERIA

- [ ] New memory file types (`game-design.md`, `asset-inventory.md`, `scene-notes.md`, `development-log.md`) added to Zod schema
- [ ] AI tools `readSharedDoc` and `updateSharedDoc` available in Game tab
- [ ] AI can read shared documents to understand game context
- [ ] AI can write to shared documents (new content and append mode)
- [ ] Babylon system prompt includes shared document context
- [ ] Auto-population triggers when assets are generated/approved
- [ ] All validation commands pass with zero errors
- [ ] Unit tests cover shared doc tools
- [ ] Documentation templates provided for new documents
- [ ] No regressions in existing functionality

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

1. **Markdown Format**: Using markdown for shared documents follows the MEMORY_SYSTEM.md pattern. It's AI-readable and human-friendly.

2. **MemoryFile Infrastructure**: Reusing existing MemoryFile table instead of creating new tables. This is already set up for atomic upserts.

3. **Separate Document Types**: Instead of one big `project-context.json`, using 4 separate documents allows:
   - Incremental updates (only update what's changed)
   - Selective reading (AI can read just what it needs)
   - Clearer separation of concerns

4. **Append Mode for Logs**: Development log and asset inventory use append mode by default, allowing incremental growth.

### Trade-offs Considered

| Alternative | Why Rechosen |
|-------------|--------------|
| Single `project-context.json` | Already exists but not useful for AI. Needed AI tools. |
| Database tables for documents | Overkill. MemoryFile already exists and works. |
| Only auto-population | User needs ability to add manual notes. |
| One shared document | Hard to manage. Splitting by purpose is cleaner. |

### Future Considerations (Phase 8+)

- **Cross-reference linking**: `asset-inventory.md` entries could link to `scene-notes.md` placements
- **Version history**: MemoryFile could track document versions
- **Conflict detection**: Warn if both tabs edited same doc simultaneously
- **Export**: Bundle all shared docs with game export
- **Template gallery**: Pre-built game design templates for common genres

---

## Confidence Score: 9/10

**Rationale:**
- Strong foundation exists (MemoryFile, game-tools pattern)
- Clear pattern to follow (MEMORY_SYSTEM.md for AI documentation)
- Scope is well-defined
- Minimal risk - uses existing infrastructure

**No Known Risks:**
- MemoryFile infrastructure proven
- Tool pattern established in game-tools.ts
- Chat integration already supports context injection

**One Uncertainty:**
- Asset generation completion hook location needs verification during implementation
- Mitigation: Can trigger manually, auto-population is enhancement not requirement

---

## FILES TOOL REFERENCE

### Quick Reference: Where to Make Changes

```
src/
├── app/api/projects/[id]/memory-files/route.ts
│   └── Line 96-103: Add new document types to Zod enum
│
├── lib/studio/
│   ├── doc-templates.ts                    [NEW]
│   ├── shared-doc-tools.ts                 [NEW]
│   ├── shared-doc-formatter.ts             [NEW]
│   ├── doc-auto-populator.ts               [NEW]
│   ├── game-tools.ts                       Line 1056: Add tools to factory
│   └── babylon-system-prompt.ts            Line ~110: Inject shared docs
│
├── app/api/studio/chat/route.ts
│   └── After line 67: Fetch and inject shared docs
│
├── types/
│   └── shared-documents.ts                 [NEW]
│
└── prisma/
    └── schema.prisma                       No changes (uses existing MemoryFile)
```
