# Feature: Phase 6B - Shared Context & Unified UI for Hatch Studios

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

**Goal:** Single unified view with tab-based navigation for Hatch Studios. Shared context document that persists between Asset and Game modes. Context-aware AI that knows your game regardless of which tab you're in.

### What is Phase 6B?

Phase 6B implements the "Shared Context & Unified UI" architecture for Hatch Studios, bridging the gap between Asset Hatch (2D/3D asset generation) and Hatch Studios (game creation):

1. **Unified Project View**: Replace separate `/project/[id]/planning` and `/studio/[id]` routes with single `/project/[id]` view containing top-level [🎨 Assets] [🎮 Game] tabs

2. **Shared Context Document**: Store game concept, character descriptions, environment notes, and key decisions in `project-context.json` (MemoryFile type) that persists regardless of which tab is active

3. **Tab-Aware AI Context**: When in Assets tab, AI knows about planning/generation. When in Game tab, AI knows about code/gameplay. User never has to re-explain the game idea when switching tabs.

4. **Visual Differentiation**: Assets tab uses purple gradient accent, Game tab uses blue gradient accent

### User Story

```
As a game developer using both Asset Hatch and Hatch Studios
I want to describe my game once and have that context available whether I'm generating assets or writing code
So that I don't have to repeat myself and the AI understands my game vision across both workflows
```

## Problem Statement

Currently, Asset Hatch and Hatch Studios operate as separate experiences:
- Assets workflow: `/project/[id]/planning` → ChatInterface → GenerationQueue
- Game workflow: `/studio/[id]` → ChatPanel → CodeTab/PreviewTab

**Problems:**
1. Users must re-explain their game concept when switching from assets to game creation
2. No shared state between the two workflows
3. Two separate URLs, two separate chat histories, two separate contexts
4. Asset manifest exists but isn't shared with game creation context
5. AI cannot help with assets when coding, or vice versa

## Solution Statement

Create a unified project architecture:

1. **Single Entry Point**: `/project/[id]` renders unified view with top-level [Assets] [Game] tabs
2. **Shared Context Document**: `project-context.json` stored in MemoryFile, containing:
   - Game concept and vision
   - Character descriptions with asset references
   - Environment/level notes
   - Key decisions made
3. **Context-Aware Chat**: Both chat interfaces (Assets ChatInterface, Game ChatPanel) receive project context
4. **Visual Theme Switching**: CSS variables for purple (Assets) vs blue (Game) accents based on active tab

## Feature Metadata

**Feature Type**: Enhancement (New Capability atop existing architecture)
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- Frontend: `src/components/studio/`, `src/app/project/[id]/`
- Backend: `src/app/api/projects/[id]/context/`
- Types: `src/lib/types/unified-project.ts`
- Database: `MemoryFile` model (no schema change needed)

**Dependencies**: None (uses existing Prisma, React, Next.js patterns)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - YOU MUST READ THESE BEFORE IMPLEMENTING!

| File | Lines | Relevance |
|------|-------|-----------|
| `src/.agents/plans/hatch-studios/implementation-prd.md` | 1-315 | Phase 6B spec - architecture diagram, type definitions, API requirements |
| `src/lib/types/unified-project.ts` | 1-205 | Existing types for AssetManifest, ProjectStatus, SyncAssetsResponse to extend |
| `src/prisma/schema.prisma` | 82-125, 248-280 | Project model with gameId, assetManifest; Game model with projectId |
| `src/components/studio/ChatPanel.tsx` | 1-394 | Pattern for chat with gameId, tool handling, localStorage persistence |
| `src/app/api/studio/chat/route.ts` | 1-94 | Chat API that receives gameId, builds system prompt |
| `src/lib/studio/babylon-system-prompt.ts` | 1-210 | System prompt generation - WHERE to inject project context |
| `src/app/project/[id]/planning/page.tsx` | 1-639 | Assets workflow - ChatInterface usage, mode tabs |
| `src/components/studio/WorkspacePanel.tsx` | 1-59 | Tab switching pattern (preview/code/assets) |
| `src/components/studio/StudioLayout.tsx` | 1-66 | Two-panel layout pattern |
| `src/components/studio/StudioProvider.tsx` | 1-301 | Context pattern, activeTab state management |
| `src/components/studio/StudioHeader.tsx` | 1-115 | Header with tabs - visual styling pattern |
| `src/app/api/projects/route.ts` | 1-219 | Project creation with startWith option - API pattern |
| `src/components/studio/planning/GamePlanningLayout.tsx` | 1-144 | Game planning layout pattern |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/types/shared-context.ts` | TypeScript interfaces for UnifiedProjectContext |
| `src/app/api/projects/[id]/context/route.ts` | GET/POST endpoints for context document |
| `src/components/studio/UnifiedProjectView.tsx` | Main unified view with Assets/Game tabs |
| `src/components/studio/SharedContextIndicator.tsx` | "Synced" badge showing context state |
| `src/components/studio/AssetsTabContent.tsx` | Existing planning/generation UI wrapped for unified view |
| `src/components/studio/GameTabContent.tsx` | Existing studio UI wrapped for unified view |

### Files to Modify

| File | Purpose |
|------|---------|
| `src/app/project/[id]/page.tsx` | Replace with new unified entry point |
| `src/app/api/studio/chat/route.ts` | Accept and use projectContext in system prompt |
| `src/components/studio/ChatPanel.tsx` | Add projectContext prop, load context on mount |
| `src/components/studio/StudioHeader.tsx` | Add visual theming for Assets/Game tabs |
| `src/app/globals.css` | Add CSS variables for purple/blue tab themes |

### Patterns to Follow

#### Naming Conventions
- Components: PascalCase (`UnifiedProjectView`, `SharedContextIndicator`)
- Files: kebab-case for non-components (`project-context.json`)
- Functions: camelCase (`handleTabChange`, `loadProjectContext`)
- Types: PascalCase (`UnifiedProjectContext`, `SharedContextState`)

#### Error Handling Pattern (from API routes)
```typescript
// src/app/api/studio/chat/route.ts:83-91
catch (error) {
  console.error('Studio Chat API error:', error);
  return new Response(
    JSON.stringify({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error',
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

#### Emoji Logging Pattern (from API routes)
```typescript
// Console log prefixes for scannability
console.log('🎨 Starting operation:', { context })
console.log('📤 Submitting to external API...')
console.log('✅ Success:', result)
console.error('❌ Error:', error)
```

#### React Context Pattern (from StudioProvider)
```typescript
// src/lib/studio/context.ts:65-80
export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
}
```

#### API Route Pattern (from projects/route.ts)
```typescript
// GET - Fetch all projects
export async function GET(): Promise<NextResponse<...>> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // Query
    const projects = await prisma.project.findMany({...});
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 });
  }
}
```

#### Component Props Pattern
```typescript
// Destructure props: ({ prop1, prop2 }) not (props)
interface UnifiedProjectViewProps {
  projectId: string;
  initialContext?: UnifiedProjectContext;
}

export function UnifiedProjectView({ projectId, initialContext }: UnifiedProjectViewProps) {
  // ...
}
```

#### TypeScript Strict Mode
- No implicit `any` - always define types
- No `as any` or `@ts-ignore`
- Use interfaces for object shapes
- Explicit return types for exported functions

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Set up types and API endpoints for shared context document.

**Tasks:**
- Define UnifiedProjectContext type
- Create context API endpoints (GET/POST)
- Add context loading to ChatPanel

### Phase 2: Core Implementation

Create unified view component and integrate into routing.

**Tasks:**
- Create UnifiedProjectView component with tab navigation
- Create AssetsTabContent and GameTabContent wrappers
- Replace /project/[id]/page.tsx entry point
- Add visual theming (purple/blue)

### Phase 3: Integration

Connect all pieces and add polish.

**Tasks:**
- Add SharedContextIndicator badge
- Ensure context persists across tab switches
- Update PRD status

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task Format Guidelines

Keywords for clarity:
- **CREATE**: New files or components
- **UPDATE**: Modify existing files
- **ADD**: Insert new functionality into existing code
- **REMOVE**: Delete deprecated code
- **REFACTOR**: Restructure without changing behavior
- **MIRROR**: Copy pattern from reference

---

### Phase 1: Foundation

#### TASK 1: CREATE UnifiedProjectContext type definition

- **FILE**: `src/lib/types/shared-context.ts`
- **IMPLEMENT**: Create TypeScript interfaces for the shared context document
- **PATTERN**: Mirror `src/lib/types/unified-project.ts` (lines 8-20 for CreateProjectData pattern)
- **IMPORTS**: None (self-contained types)
- **GOTCHA**: Use `projectId: string` not UUID directly, keep optional fields optional
- **VALIDATE**: `bun run typecheck`

```typescript
// Content to implement:
export interface UnifiedProjectContext {
  projectId: string;
  gameId?: string;  // Linked game (populated when game created)
  
  // Planning (written during asset planning OR game planning)
  gameConcept: string;           // "A top-down RPG where players explore..."
  targetAudience: string;
  keyFeatures: string[];
  
  // Assets (from asset generation)
  characters: Array<{
    name: string;
    description: string;
    animations: string[];
    assetId?: string;  // Reference to GeneratedAsset/Generated3DAsset
  }>;
  environments: Array<{
    name: string;
    type: "interior" | "exterior" | "skybox";
    assetId?: string;
  }>;
  
  // Game (from game development)
  scenes: Array<{
    name: string;
    description: string;
  }>;
  
  // Sync metadata
  lastUpdatedBy: "assets" | "game";
  updatedAt: string;
}

export interface GetContextResponse {
  success: boolean;
  context?: UnifiedProjectContext;
  error?: string;
}

export interface UpdateContextInput {
  context: Partial<UnifiedProjectContext>;
}

export interface UpdateContextResponse {
  success: boolean;
  message: string;
}
```

---

#### TASK 2: CREATE Context API endpoints

- **FILE**: `src/app/api/projects/[id]/context/route.ts`
- **IMPLEMENT**: GET and POST endpoints for project context CRUD
- **PATTERN**: Mirror `src/app/api/projects/route.ts` (lines 49-79 for GET, 86-218 for POST structure)
- **IMPORTS**:
  - `NextRequest`, `NextResponse` from 'next/server'
  - `auth` from '@/auth'
  - `prisma` from '@/lib/prisma'
  - `UnifiedProjectContext`, types from '@/lib/types/shared-context'
  - `z` from 'zod'
- **GOTCHA**: Must check user ownership of project, use `projectId` from params not body
- **VALIDATE**: `bun run typecheck && bun run lint`

```typescript
// Content to implement:
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { UnifiedProjectContext, GetContextResponse, UpdateContextResponse } from '@/lib/types/shared-context';

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
    environments: z.array(z.object({
      name: z.string(),
      type: z.enum(['interior', 'exterior', 'skybox']),
      assetId: z.string().optional(),
    })).optional(),
    scenes: z.array(z.object({
      name: z.string(),
      description: z.string(),
    })).optional(),
    lastUpdatedBy: z.enum(['assets', 'game']).optional(),
  }),
});

/**
 * GET /api/projects/[id]/context
 * Fetch the shared context document for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetContextResponse>> {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch context from MemoryFile
    const memoryFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'project-context.json' } },
    });

    if (!memoryFile) {
      // Return empty context structure
      const emptyContext: UnifiedProjectContext = {
        projectId,
        gameConcept: '',
        targetAudience: '',
        keyFeatures: [],
        characters: [],
        environments: [],
        scenes: [],
        lastUpdatedBy: 'assets',
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, context: emptyContext });
    }

    const context = JSON.parse(memoryFile.content) as UnifiedProjectContext;
    return NextResponse.json({ success: true, context });

  } catch (error) {
    console.error('Failed to fetch project context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/context
 * Update the shared context document for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateContextResponse>> {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updates = parsed.data.context;

    // Fetch existing context
    const existingFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'project-context.json' } },
    });

    let existingContext: UnifiedProjectContext = {
      projectId,
      gameConcept: '',
      targetAudience: '',
      keyFeatures: [],
      characters: [],
      environments: [],
      scenes: [],
      lastUpdatedBy: 'assets',
      updatedAt: new Date().toISOString(),
    };

    if (existingFile) {
      existingContext = JSON.parse(existingFile.content);
    }

    // Merge updates
    const mergedContext: UnifiedProjectContext = {
      ...existingContext,
      ...updates,
      projectId, // Ensure projectId never changes
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: updates.lastUpdatedBy || 'assets',
    };

    // Upsert MemoryFile
    await prisma.memoryFile.upsert({
      where: { projectId_type: { projectId, type: 'project-context.json' } },
      update: {
        content: JSON.stringify(mergedContext),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: 'project-context.json',
        content: JSON.stringify(mergedContext),
      },
    });

    console.log('✅ Project context updated:', { projectId, updatedBy: mergedContext.lastUpdatedBy });

    return NextResponse.json({
      success: true,
      message: 'Context updated successfully',
    });

  } catch (error) {
    console.error('Failed to update project context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update context' },
      { status: 500 }
    );
  }
}
```

---

#### TASK 3: UPDATE ChatPanel to accept projectContext prop

- **FILE**: `src/components/studio/ChatPanel.tsx`
- **IMPLEMENT**: Add projectContext prop, load context on mount, pass to API
- **PATTERN**: Use existing pattern at lines 33-38 (chatId), lines 216-248 (useEffect for persistence)
- **IMPORTS**: Add `UnifiedProjectContext` from '@/lib/types/shared-context'
- **GOTCHA**: Don't break existing gameId functionality - context is optional enhancement
- **VALIDATE**: `bun run typecheck && bun run lint`

Changes to make:

1. Add to interface (line 13-15):
```typescript
interface ChatPanelProps {
  gameId: string;
  projectContext?: UnifiedProjectContext;  // NEW
}
```

2. Add context loading in component (after line 37 console.log):
```typescript
// Load project context on mount
useEffect(() => {
  if (!gameId) return;
  
  const loadContext = async () => {
    try {
      // Extract projectId from gameId (gameId format: UUID)
      // Need to fetch game first to get projectId, or pass projectId directly
      // For now, we'll accept projectId as separate prop or derive from context
      console.log('🎨 ChatPanel: projectContext available:', !!projectContext);
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  };
  
  loadContext();
}, [gameId, projectContext]);
```

3. Modify sendMessage body (around line 266-271):
```typescript
// Pass projectContext in body when available
const messageBody = { 
  gameId,
  ...(projectContext && { projectContext: JSON.stringify(projectContext) })
};

sendMessage(
  { text: input },
  { body: messageBody }
);
```

---

#### TASK 4: UPDATE studio chat API to use projectContext

- **FILE**: `src/app/api/studio/chat/route.ts`
- **IMPLEMENT**: Read projectContext from request body, inject into system prompt
- **PATTERN**: Use existing pattern at lines 56-64 (gameContext building)
- **IMPORTS**: Add `UnifiedProjectContext` from '@/lib/types/shared-context'
- **GOTCHA**: projectContext may be undefined for backward compatibility
- **VALIDATE**: `bun run typecheck && bun run lint`

Changes to make:

1. Update line 18 to extract projectContext:
```typescript
const { messages, gameId, projectContext: projectContextJson } = await req.json();
```

2. Parse projectContext (after line 53 game fetch):
```typescript
// Parse project context if provided
let projectContext: UnifiedProjectContext | undefined;
if (projectContextJson) {
  try {
    projectContext = typeof projectContextJson === 'string' 
      ? JSON.parse(projectContextJson) 
      : projectContextJson;
  } catch (error) {
    console.warn('Failed to parse projectContext:', error);
  }
}
```

3. Update system prompt building (lines 61-64):
```typescript
// Build context for system prompt
const gameContext = {
  id: gameId,
  name: game.name,
  activeSceneId: game.activeSceneId,
};

// Add project context if available
let systemPromptContext = JSON.stringify(gameContext, null, 2);
if (projectContext?.gameConcept) {
  systemPromptContext += `\n\nPROJECT CONTEXT:\n${projectContext.gameConcept}`;
  if (projectContext.characters?.length) {
    systemPromptContext += `\nCharacters: ${projectContext.characters.map(c => c.name).join(', ')}`;
  }
}

const systemPrompt = getBabylonSystemPrompt(
  gameId,
  systemPromptContext  // Changed from JSON.stringify(gameContext, null, 2)
);
```

---

### Phase 2: Core Implementation

#### TASK 5: CREATE UnifiedProjectView component

- **FILE**: `src/components/studio/UnifiedProjectView.tsx`
- **IMPLEMENT**: Main component with [Assets] [Game] tab navigation
- **PATTERN**: Mirror `src/components/studio/StudioLayout.tsx` (layout), `src/components/studio/StudioHeader.tsx` (tabs)
- **IMPORTS**:
  - React hooks
  - `useStudio` from '@/lib/studio/context' (existing context for game)
  - Components to wrap: ChatInterface, GenerationQueue, ChatPanel, CodeTab, PreviewTab
- **GOTCHA**: Must work with both authenticated game creation AND asset-only projects
- **VALIDATE**: `bun run typecheck && bun run lint`

```typescript
// Content to implement:
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

// Tab type
type UnifiedTab = 'assets' | 'game';

interface UnifiedProjectViewProps {
  projectId: string;
  initialContext?: UnifiedProjectContext;
}

export function UnifiedProjectView({ projectId, initialContext }: UnifiedProjectViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UnifiedTab>('assets');
  const [projectContext, setProjectContext] = useState<UnifiedProjectContext | undefined>(initialContext);
  const [isLoading, setIsLoading] = useState(false);

  // Load context from API
  const loadContext = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/context`);
      const data = await response.json();
      if (data.success && data.context) {
        setProjectContext(data.context);
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }, [projectId]);

  // Load context on mount
  useEffect(() => {
    if (!initialContext) {
      loadContext();
    }
  }, [projectId, initialContext, loadContext]);

  // Handle tab change
  const handleTabChange = (tab: UnifiedTab) => {
    setActiveTab(tab);
    // Update URL without full navigation
    router.push(`/project/${projectId}?tab=${tab}`, { scroll: false });
  };

  // Save context when updated
  const saveContext = useCallback(async (updates: Partial<UnifiedProjectContext>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: updates }),
      });
      const data = await response.json();
      if (data.success) {
        setProjectContext(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : undefined);
      }
    } catch (error) {
      console.error('Failed to save context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with tab navigation */}
      <header className="h-14 border-b border-studio-panel-border bg-studio-panel-bg flex items-center justify-between px-4">
        {/* Left: Project name */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">
            {projectContext?.gameConcept || 'Project'}
          </h1>
        </div>

        {/* Center: Tab navigation */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => handleTabChange('assets')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'assets'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            🎨 Assets
          </button>
          <button
            onClick={() => handleTabChange('game')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'game'
                ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            🎮 Game
          </button>
        </nav>

        {/* Right: Context indicator */}
        <div className="flex items-center gap-2">
          {projectContext && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              🔄 Synced
            </span>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'assets' ? (
          <AssetsTabContent
            projectId={projectId}
            projectContext={projectContext}
            onContextUpdate={saveContext}
          />
        ) : (
          <GameTabContent
            projectId={projectId}
            projectContext={projectContext}
          />
        )}
      </div>
    </div>
  );
}

// Placeholder components - to be implemented in subsequent tasks
interface AssetsTabContentProps {
  projectId: string;
  projectContext?: UnifiedProjectContext;
  onContextUpdate: (updates: Partial<UnifiedProjectContext>) => void;
}

function AssetsTabContent({ projectId, projectContext, onContextUpdate }: AssetsTabContentProps) {
  // This will wrap existing planning/generation UI
  // For now, redirect to existing planning page
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">Assets Tab - Implementation pending</p>
    </div>
  );
}

interface GameTabContentProps {
  projectId: string;
  projectContext?: UnifiedProjectContext;
}

function GameTabContent({ projectId, projectContext }: GameTabContentProps) {
  // This will wrap existing studio UI
  // For now, redirect to existing studio page
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">Game Tab - Implementation pending</p>
    </div>
  );
}
```

---

#### TASK 6: CREATE /project/[id]/page.tsx entry point

- **FILE**: `src/app/project/[id]/page.tsx`
- **IMPLEMENT**: Server component that fetches project and renders UnifiedProjectView
- **PATTERN**: Mirror `src/app/studio/[id]/page.tsx` (lines 51-112)
- **IMPORTS**:
  - `notFound`, `redirect` from 'next/navigation'
  - `auth` from '@/auth'
  - `prisma` from '@/lib/prisma'
  - `UnifiedProjectView` from '@/components/studio/UnifiedProjectView'
  - `UnifiedProjectContext` from '@/lib/types/shared-context'
- **GOTCHA**: Handle both projects with and without linked games
- **VALIDATE**: `bun run typecheck && bun run lint`

```typescript
// Content to implement:
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UnifiedProjectView } from '@/components/studio/UnifiedProjectView';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Fetch project context from MemoryFile
 */
async function fetchProjectContext(projectId: string): Promise<UnifiedProjectContext | undefined> {
  try {
    const memoryFile = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'project-context.json' } },
    });

    if (!memoryFile) return undefined;

    return JSON.parse(memoryFile.content) as UnifiedProjectContext;
  } catch (error) {
    console.error('Failed to fetch project context:', error);
    return undefined;
  }
}

/**
 * Unified Project View Page
 * Replaces separate /project/[id]/planning and /studio/[id] routes
 */
export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { id: projectId } = await params;
  const { tab } = await searchParams;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch project with ownership verification
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      game: {
        select: {
          id: true,
          name: true,
          phase: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch shared context
  const context = await fetchProjectContext(projectId);

  // Serialize for client
  const initialContext: UnifiedProjectContext | undefined = context ? {
    ...context,
    updatedAt: new Date(context.updatedAt).toISOString(),
  } : undefined;

  return (
    <UnifiedProjectView
      projectId={projectId}
      initialContext={initialContext}
    />
  );
}
```

---

#### TASK 7: ADD CSS variables for tab theming

- **FILE**: `src/app/globals.css`
- **IMPLEMENT**: Add CSS custom properties for purple (assets) and blue (game) themes
- **PATTERN**: Follow existing pattern at lines 292-298 (aurora colors)
- **GOTCHA**: Ensure variables are defined in :root for global access
- **VALIDATE**: Manual browser check

Add to `:root` section:
```css
/* Tab theme colors */
--tab-assets-primary: oklch(0.6 0.25 280);
--tab-assets-bg: oklch(0.6 0.25 280 / 0.1);
--tab-game-primary: oklch(0.6 0.25 220);
--tab-game-bg: oklch(0.6 0.25 220 / 0.1);
```

---

#### TASK 8: UPDATE StudioHeader for visual theming

- **FILE**: `src/components/studio/StudioHeader.tsx`
- **IMPLEMENT**: Add styling for unified tabs (purple/blue accents)
- **PATTERN**: Use existing tab styling at lines 86-97, enhance with theme colors
- **IMPORTS**: May need to import CSS variables or use inline styles
- **GOTCHA**: Keep existing functionality, just enhance visuals
- **VALIDATE**: `bun run typecheck && bun run lint`

Enhance the tab navigation section (lines 84-98):
```typescript
// Replace with themed tabs
<nav className="flex items-center gap-1">
  {(['preview', 'code', 'assets'] as const).map((tab) => {
    const isActive = activeTab === tab;
    const isAssets = tab === 'assets';
    
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          isActive
            ? isAssets
              ? 'bg-tab-assets-bg text-tab-assets-primary border border-tab-assets-primary/30'
              : 'bg-tab-game-bg text-tab-game-primary border border-tab-game-primary/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    );
  })}
</nav>
```

---

### Phase 3: Integration

#### TASK 9: CREATE SharedContextIndicator component

- **FILE**: `src/components/studio/SharedContextIndicator.tsx`
- **IMPLEMENT**: Badge showing sync status between Assets and Game contexts
- **PATTERN**: Mirror `SyncStatusBanner.tsx` pattern from dashboard
- **GOTCHA**: Keep it simple - just visual indicator
- **VALIDATE**: `bun run typecheck && bun run lint`

```typescript
// Content to implement:
'use client';

interface SharedContextIndicatorProps {
  lastUpdatedBy?: 'assets' | 'game';
  updatedAt?: string;
  className?: string;
}

export function SharedContextIndicator({ 
  lastUpdatedBy, 
  updatedAt,
  className = '' 
}: SharedContextIndicatorProps) {
  if (!lastUpdatedBy) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        📝 No context
      </span>
    );
  }

  const timeAgo = updatedAt 
    ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        🔄 Synced
      </span>
      <span className={`text-xs px-2 py-0.5 rounded ${
        lastUpdatedBy === 'assets' 
          ? 'bg-purple-500/20 text-purple-400' 
          : 'bg-blue-500/20 text-blue-400'
      }`}>
        {lastUpdatedBy === 'assets' ? '🎨 Assets' : '🎮 Game'}
      </span>
      {timeAgo && (
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      )}
    </div>
  );
}
```

---

#### TASK 10: UPDATE PRD status

- **FILE**: `src/.agents/plans/hatch-studios/implementation-prd.md`
- **IMPLEMENT**: Update Phase 6b status from "In Progress" to reflect completion
- **PATTERN**: Follow existing format at lines 38-42
- **GOTCHA**: Don't change other sections, just update status
- **VALIDATE**: Manual review

Update lines 5-6:
```
**Date:** 2026-01-18
**Status:** Phase 6b Complete
```

Update lines 40-42:
```
| 6b | Shared Context & Unified UI | ✅ Complete - Tab navigation, shared context API, context-aware chat |
```

---

## TESTING STRATEGY

### Unit Tests

Scope: Type definitions, API route validation, component props

**Test Files Pattern** (if tests exist for similar features):
- `src/tests/lib/types/shared-context.test.ts` - Type validation
- `src/tests/app/api/projects.*.test.ts` - API endpoint tests

**Coverage Target**: 80% for new code

### Integration Tests

Scope:
1. Context CRUD via API (GET → POST → GET should return merged data)
2. Tab switching preserves context
3. Chat API receives and uses projectContext

**Manual Testing Steps**:
1. Create new project via dashboard
2. Navigate to `/project/[id]`
3. Verify Assets tab loads correctly
4. Create game via "Create Game" flow
5. Switch to Game tab
6. Verify chat receives project context
7. Update context in one tab, verify shows "Synced" in other

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Project without linked game | Game tab shows "Create Game" CTA |
| MemoryFile not found | API returns empty context structure |
| Invalid JSON in MemoryFile | API catches error, returns empty context |
| User not project owner | API returns 401/404 |
| Network error loading context | Component shows error state, allows retry |

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# TypeScript type checking
cd src && bun run typecheck

# ESLint with auto-fix
cd src && bun run lint --fix
```

### Level 2: Unit Tests

```bash
# Run tests (if any exist for new code)
cd src && bun run test
```

### Level 3: Integration Tests

```bash
# Build verification
cd src && bun build
```

### Level 4: Manual Validation

**Checklist**:
- [ ] Navigate to `/project/[id]` - Unified view loads
- [ ] Click [🎮 Game] tab - Game content appears
- [ ] Click [🎨 Assets] tab - Assets content appears
- [ ] Check browser console - No errors
- [ ] Create game via flow - Game tab activates
- [ ] Send message in Game chat - Works (tests API)
- [ ] Context indicator shows "Synced"

### Level 5: Additional Validation

```bash
# Check for any TypeScript errors in changed files
cd src && npx tsc --noEmit
```

---

## ACCEPTANCE CRITERIA

- [ ] UnifiedProjectView component renders with Assets/Game tabs
- [ ] Context API endpoints (GET/POST) work correctly
- [ ] ChatPanel accepts and passes projectContext to API
- [ ] Studio chat API uses projectContext in system prompt
- [ ] Visual theming (purple Assets, blue Game) is applied
- [ ] Context persists when switching tabs
- [ ] SharedContextIndicator badge shows sync status
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] `bun build` completes successfully
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
- [ ] PRD updated with completion status

---

## NOTES

### Design Decisions

1. **Context Storage**: Chose MemoryFile over separate table because:
   - Already exists for entities.json, conversation_history.json
   - JSON storage allows flexible schema evolution
   - Single query fetches entire context

2. **Tab Navigation**: Single-page tab switching vs separate routes:
   - Better UX (no full page reload)
   - Context persists in memory
   - URL query param for tab state (shareable links)

3. **Optional projectContext**: Made prop optional for backward compatibility:
   - Existing games without context still work
   - Gradual adoption path

### Trade-offs

- **Context Size**: Large contexts increase token usage in chat. Solution: Trim to essential fields for AI context, full context available for UI.
- **Tab Switching Overhead**: Loading full chat history on tab switch. Solution: Cache chat in localStorage, restore on tab activation.

### Future Work (Phase 7-9)

- Phase 7: Asset loading in preview via `ASSETS.load()` global
- Phase 8: AI asset workflow with version sync UI
- Phase 9: Export bundling assets + code

---

## Report

**Feature**: Phase 6B - Shared Context & Unified UI for Hatch Studios

**Full Path**: `.agents/plans/hatch-studios/phase-6b-shared-context-unified-ui.md`

**Complexity Assessment**: Medium - Requires coordination across frontend (tabs, context, theming) and backend (API endpoints) but builds on existing patterns.

**Key Implementation Risks**:
1. Chat API projectContext integration may conflict with existing gameId flow - mitigated by making optional
2. Visual theming requires CSS variable integration - straightforward pattern following existing aurora theme

**Estimated Confidence Score for One-Pass Success**: 8/10

The foundation is solid:
- ✅ Unified project schema (Phase 6) complete
- ✅ 1:1 Project-Game relations working
- ✅ Asset manifest implemented
- ✅ ChatPanel and API infrastructure exists
- Only missing: context document API, unified view component, tab-aware chat context
