# Feature: Hatch Studios Phase 3 - AI Tools & Chat

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Phase 3 implements the core AI chat functionality for Hatch Studios—a Babylon.js game studio where users describe game ideas in natural language and AI generates executable code through structured tools. This phase creates a streaming chat API route with 10+ game management tools, integrates with the Phase 2 UI, implements a Babylon.js code generation skill, and ensures all generated code follows best practices for performance and maintainability.

**Goal**: Users can describe a game, watch AI generate code via tools, and see the game running in the preview iframe with hot-reload capability.

## User Story

As a **game creator**
I want to **describe my game idea in chat and watch AI generate Babylon.js code through tools**
So that **I can create playable games without writing code myself**

## Problem Statement

Phase 1 established the database schema and Phase 2 built the UI layout, but the chat panel is just a placeholder. Users cannot actually communicate with an AI to generate game code. The studio needs a fully functional AI chat system that understands game development patterns and generates high-quality, executable Babylon.js code through structured tool calls.

## Solution Statement

Create a streaming chat API route using Vercel AI SDK v6 with 10+ game-specific tools that mutate game state (scenes, assets, code, camera, physics). Implement onToolCall callback in ChatPanel to update UI in real-time. Create a Babylon.js code generation system prompt that ensures best practices for performance, scene organization, and asset loading. Integrate the chat system with Phase 2's PreviewTab for hot-reload on code updates.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: AI chat API route, ChatPanel component, Babylon.js code generation system prompt, StudioProvider state management
**Dependencies**: Phase 1 (database schema), Phase 2 (UI layout with PreviewTab)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/app/api/chat/route.ts` (full file) - **WHY**: Complete AI SDK v6 streaming chat example with tools, convertToModelMessages, system prompt, stopWhen configuration
- `src/components/planning/ChatInterface.tsx` (full file) - **WHY**: useChat hook implementation, onToolCall pattern, message parts extraction, tool result handling
- `src/lib/chat-tools-3d.ts` (full file) - **WHY**: Pattern for creating AI SDK tools with Zod schemas, factory function export
- `src/lib/schemas.ts` (lines 1-85) - **WHY**: Zod schema examples for tools (updateQualitySchema, updatePlanSchema, finalizePlanSchema)
- `src/lib/schemas-3d.ts` (full file) - **WHY**: 3D-specific schemas showing nested parameters and enum patterns
- `src/components/studio/ChatPanel.tsx` (from Phase 2) - **WHY**: Placeholder chat component that needs to be converted to full useChat implementation
- `src/components/studio/PreviewTab.tsx` (from Phase 2) - **WHY**: Preview iframe with postMessage for hot-reload updates
- `src/components/studio/StudioProvider.tsx` (from Phase 2) - **WHY**: Context provider for studio state management
- `src/prisma/schema.prisma` (lines 1-219) - **WHY**: Game, GameScene, CodeVersion models for data persistence
- `src/memory/AI_SDK_V6_GUIDE.md` (full file) - **WHY**: Complete AI SDK v6 patterns and gotchas
- `src/memory/system_patterns.md` (lines 1-449) - **WHY**: Coding standards, component structure, testing patterns, UX patterns
- `src/memory/PROJECT_ARCHITECTURE.md` (lines 1-613) - **WHY**: Complete system architecture, data flow patterns, tool integration patterns

### New Files to Create

**API Routes**
- `src/app/api/studio/chat/route.ts` - Streaming chat with game generation tools
- `src/app/api/studio/preview/route.ts` - Generate preview HTML with Babylon.js code
- `src/app/api/studio/code/route.ts` - Update scene code directly

**Components**
- `src/components/studio/ChatPanel.tsx` - Full useChat implementation (not placeholder)
- `src/lib/studio/game-tools.ts` - All game tool definitions with Zod schemas
- `src/lib/studio/babylon-system-prompt.ts` - System prompt for code generation with best practices
- `src/lib/studio/code-generator.ts` - Utility for generating Babylon.js code snippets
- `src/lib/studio/babylon-skill.ts` - Skill loader for AI to access code patterns

**Tests**
- `src/tests/integration/studio-chat.test.ts` - Integration tests for chat API
- `src/tests/integration/studio-tools.test.ts` - Integration tests for game tools

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Babylon.js Official Documentation](https://doc.babylonjs.com/) - **WHY**: Complete API reference for game development
  - Specific sections: Scene structure, Physics, Cameras, Optimization
  - Code examples: [Summer Festival Example](https://github.com/BabylonJS/SummerFestival), [TypeScript Starter](https://github.com/pandadelphin/babylonjs-typescript-webpack-starter)
- [Vercel AI SDK v6 Documentation](https://sdk.vercel.ai/docs) - **WHY**: Complete reference for tool calling, streaming, patterns
  - Specific sections: [Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling), [System Prompts](https://sdk.vercel.ai/docs/ai-sdk-core/system-prompts)
- [AI SDK v6 Breaking Changes](https://v6.ai-sdk.dev/docs/announcing-ai-sdk-6-beta) - **WHY**: Understanding v6 differences from v3/v4
  - Key changes: separate @ai-sdk/react package, message parts array, onToolCall callback pattern

### Patterns to Follow

**AI SDK v6 Tool Definition Pattern:**
```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'Clear description for AI',
  inputSchema: z.object({
    param1: z.string().describe('What this parameter does'),
    param2: z.enum(['option1', 'option2']).describe('Valid options'),
  }),
  execute: async ({ param1, param2 }) => {
    // Server-side execution
    return { success: true, result: 'Something' };
  },
});
```

**API Route Pattern (streamText with tools):**
```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { messages, gameId } = await req.json();
    
    // CRITICAL: Convert UIMessages to ModelMessages
    const modelMessages = await convertToModelMessages(messages);
    
    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,
      system: 'System prompt here...',
      stopWhen: stepCountIs(10), // CRITICAL: Enables tool execution
      tools: {
        myTool: tool({ ... }),
      },
    });
    
    // CRITICAL: Use toUIMessageStreamResponse()
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**ChatPanel Pattern (useChat with onToolCall):**
```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export function ChatPanel({ gameId }) {
  const [input, setInput] = useState("");
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/studio/chat',
    body: { gameId }, // Context passed with each message
    onToolCall: ({ toolCall }) => {
      // Handle tool execution results
      if (toolCall.toolName === 'myTool') {
        const { param1, param2 } = toolCall.args;
        // Update UI state
      }
    },
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input }, { body: { gameId } });
      setInput("");
    }
  };
  
  const isLoading = status === 'in_progress';
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages display */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => {
          const textParts = msg.parts?.filter(p => 
            p.type === 'text' || p.type === 'reasoning'
          ) || [];
          const text = textParts.map(p => p.text).join('');
          return text ? <div key={msg.id}>{text}</div> : null;
        })}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit}>
        <textarea 
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />
        </form>
    </div>
  );
}
```

**Naming Conventions:**
```typescript
// Tools: camelCase with descriptive names
createScene, switchScene, placeAsset, setCamera, enablePhysics, updateCode, addBehavior, addInteraction

// API Routes: kebab-case directories
app/api/studio/chat/route.ts, app/api/studio/preview/route.ts

// Components: PascalCase with .tsx extension
ChatPanel.tsx, StudioProvider.tsx

// Schemas: camelCase with "Schema" suffix
createSceneSchema, placeAssetSchema, setCameraSchema
```

**Babylon.js Code Best Practices (from research):**
```typescript
// ✅ DO: Use TransformNode for containers (not empty meshes)
const container = new BABYLON.TransformNode("container", scene);
container.addChild(mesh1);

// ✅ DO: Use ArcRotateCamera for orbiting/editing
const camera = new BABYLON.ArcRotateCamera("camera", Math.PI/3, Math.PI/4, 10, BABYLON.Vector3.Zero(), scene);

// ✅ DO: Use onBeforeRenderObservable for performance updates
scene.onBeforeRenderObservable.add(callback);

// ✅ DO: Freeze materials for static objects
material.freeze();

// ✅ DO: Use instances for repeated geometry
const mesh = BABYLON.Mesh.CreateBox("box", {}, scene);
const instance = mesh.createInstance("instance", new BABYLON.Vector3(x, y, z));

// ✅ DO: Skip pointer move picking for performance
scene.skipPointerMovePicking = true;
```

---

## IMPLEMENTATION PLAN

### Phase 3A: Tool Schemas & Validation

Define all Zod schemas for game tool inputs.

**Tasks:**
- Create game-tools.ts with all tool Zod schemas
- Define tool parameter types
- Export tool input types

### Phase 3B: Babylon.js System Prompt

Create comprehensive system prompt for code generation with best practices.

**Tasks:**
- Create babylon-system-prompt.ts
- Include scene structure patterns
- Include camera setup guidelines
- Include physics integration patterns
- Include performance optimization rules
- Include asset loading patterns

### Phase 3C: Game Tools Implementation

Implement all 10+ game management tools.

**Tasks:**
- Implement createScene tool (create new scene/level)
- Implement switchScene tool (change active scene)
- Implement placeAsset tool (add asset to scene)
- Implement setCamera tool (configure camera)
- Implement enablePhysics tool (enable Havok/Cannon)
- Implement updateCode tool (update scene code)
- Implement addBehavior tool (add movement/AI to asset)
- Implement addInteraction tool (add click/proximity triggers)
- Implement listUserAssets tool (query Asset Hatch library)
- Implement createAsset tool (trigger Asset Hatch generation)
- Export tools as factory function

### Phase 3D: Chat API Route

Create streaming chat endpoint with game tools.

**Tasks:**
- Create /api/studio/chat/route.ts
- Use streamText with convertToModelMessages
- Configure stopWhen for tool execution
- Integrate game tools
- Build system prompt with Babylon best practices
- Handle tool execution errors
- Return toUIMessageStreamResponse
- Add maxDuration for streaming

### Phase 3E: ChatPanel Component

Replace placeholder with full useChat implementation.

**Tasks:**
- Update ChatPanel.tsx to use useChat hook
- Implement onToolCall handler for all game tools
- Update studio context state on tool results
- Handle message streaming and display
- Add loading states and error handling
- Manage chat history persistence

### Phase 3F: Preview Hot-Reload Integration

Connect code updates to preview refresh.

**Tasks:**
- Update PreviewTab to listen for code changes
- Use postMessage to trigger preview reload
- Handle preview errors and display in UI

### Phase 3G: Code Generation Skill

Create skill for AI to access Babylon.js code patterns.

**Tasks:**
- Create babylon-skill.ts
- Define skill interface for AI SDK
- Include code templates for common patterns
- Include error handling examples
- Export skill for API route

### Phase 3H: Integration Testing

Write integration tests for chat and tools.

**Tasks:**
- Create studio-chat.test.ts
- Test tool execution
- Test streaming responses
- Test error handling
- Test preview hot-reload flow

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: CREATE `src/lib/studio/schemas.ts`

- **IMPLEMENT**: Define all Zod schemas for game tools
- **PATTERN**: Mirror `src/lib/schemas.ts` structure
- **IMPORTS**: `import { z } from 'zod';`
- **GOTCHA**: Use .describe() on all parameters - AI reads these descriptions
- **VALIDATE**: `bun run typecheck`

```typescript
import { z } from 'zod';

// =============================================================================
// SCENE MANAGEMENT TOOLS
// =============================================================================

export const createSceneSchema = z.object({
  name: z.string().min(1).describe('Name for the new scene'),
  orderIndex: z.number().int().default(0).describe('Order index in game (0 for first scene)'),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;

export const switchSceneSchema = z.object({
  sceneId: z.string().describe('ID of the scene to switch to'),
});

export type SwitchSceneInput = z.infer<typeof switchSceneSchema>;

// =============================================================================
// ASSET MANAGEMENT TOOLS
// =============================================================================

export const placeAssetSchema = z.object({
  assetId: z.string().describe('ID of the asset from Asset Hatch'),
  sceneId: z.string().describe('ID of the scene to place the asset in'),
  position: z.object({
    x: z.number().describe('X position'),
    y: z.number().describe('Y position'),
    z: z.number().describe('Z position'),
  }),
  rotation: z.object({
    x: z.number().describe('X rotation in degrees'),
    y: z.number().describe('Y rotation in degrees'),
    z: z.number().describe('Z rotation in degrees'),
  }),
  scale: z.object({
    x: z.number().default(1).describe('X scale factor'),
    y: z.number().default(1).describe('Y scale factor'),
    z: z.number().default(1).describe('Z scale factor'),
  }),
});

export type PlaceAssetInput = z.infer<typeof placeAssetSchema>;

// =============================================================================
// CAMERA SETUP TOOLS
// =============================================================================

export const setCameraSchema = z.object({
  type: z.enum(['ArcRotateCamera', 'UniversalCamera', 'FollowCamera']).describe('Camera type to use'),
  target: z.string().optional().describe('Target object to follow (for FollowCamera)'),
});

export type SetCameraInput = z.infer<typeof setCameraSchema>;

// =============================================================================
// PHYSICS SETUP TOOLS
// =============================================================================

export const enablePhysicsSchema = z.object({
  engine: z.enum(['Havok', 'Cannon']).describe('Physics engine to use'),
  gravity: z.object({
    x: z.number().default(0).describe('Gravity on X axis'),
    y: z.number().default(-9.81).describe('Gravity on Y axis (default Earth gravity)'),
    z: z.number().default(0).describe('Gravity on Z axis'),
  }),
});

export type EnablePhysicsInput = z.infer<typeof enablePhysicsSchema>;

// =============================================================================
// CODE MANAGEMENT TOOLS
// =============================================================================

export const updateCodeSchema = z.object({
  sceneId: z.string().describe('ID of the scene to update code for'),
  code: z.string().min(10).describe('Babylon.js code to update scene with'),
});

export type UpdateCodeInput = z.infer<typeof updateCodeSchema>;

// =============================================================================
// BEHAVIOR & INTERACTION TOOLS
// =============================================================================

export const addBehaviorSchema = z.object({
  assetId: z.string().describe('ID of the asset to add behavior to'),
  behaviorType: z.enum(['playerMovement', 'patrol', 'chase', 'idle']).describe('Type of behavior'),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe('Behavior parameters'),
});

export type AddBehaviorInput = z.infer<typeof addBehaviorSchema>;

export const addInteractionSchema = z.object({
  assetId: z.string().describe('ID of the asset to add interaction to'),
  interactionType: z.enum(['click', 'proximity', 'collision']).describe('Type of interaction'),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe('Interaction parameters'),
});

export type AddInteractionInput = z.infer<typeof addInteractionSchema>;

// =============================================================================
// ASSET QUERY TOOLS
// =============================================================================

export const listUserAssetsSchema = z.object({
  type: z.enum(['2d', '3d', 'all']).default('all').describe('Filter by asset type'),
  search: z.string().optional().describe('Search query for asset names'),
  limit: z.number().min(1).max(100).default(50).describe('Maximum number of assets to return'),
});

export type ListUserAssetsInput = z.infer<typeof listUserAssetsSchema>;

export const createAssetSchema = z.object({
  type: z.enum(['2d', '3d']).describe('Type of asset to create'),
  name: z.string().min(1).describe('Name for the new asset'),
  description: z.string().min(10).describe('Description of the asset'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
```

---

### Task 2: CREATE `src/lib/studio/game-tools.ts`

- **IMPLEMENT**: Define all game tool functions using AI SDK tool() helper
- **PATTERN**: Mirror `src/lib/chat-tools-3d.ts` structure
- **IMPORTS**: `import { tool } from 'ai';`, `import { prisma } from '@/lib/prisma';`
- **GOTCHA**: Each tool must interact with database (Prisma) and return structured results
- **VALIDATE**: `bun run typecheck`

```typescript
import { tool } from 'ai';
import { prisma } from '@/lib/prisma';
import {
  createSceneSchema,
  switchSceneSchema,
  placeAssetSchema,
  setCameraSchema,
  enablePhysicsSchema,
  updateCodeSchema,
  addBehaviorSchema,
  addInteractionSchema,
  listUserAssetsSchema,
  createAssetSchema,
  type CreateSceneInput,
  type SwitchSceneInput,
  type PlaceAssetInput,
  type SetCameraInput,
  type EnablePhysicsInput,
  type UpdateCodeInput,
  type AddBehaviorInput,
  type AddInteractionInput,
  type ListUserAssetsInput,
  type CreateAssetInput,
} from '@/lib/studio/schemas';

// =============================================================================
// CREATE SCENE TOOL
// =============================================================================

export const createSceneTool = (gameId: string) => {
  return tool({
    description: 'Create a new scene/level for the game. Use this when the user wants to add a new level or screen.',
    inputSchema: createSceneSchema,
    execute: async ({ name, orderIndex }: CreateSceneInput) => {
      try {
        // Create new scene in database
        const scene = await prisma.gameScene.create({
          data: {
            gameId,
            name,
            orderIndex,
            code: '', // Empty code initially
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Created scene "${name}" (ID: ${scene.id})`,
          sceneId: scene.id,
          name,
          orderIndex,
        };
      } catch (error) {
        console.error('Failed to create scene:', error);
        return { success: false, error: 'Failed to create scene' };
      }
    },
  });
};

// =============================================================================
// SWITCH SCENE TOOL
// =============================================================================

export const switchSceneTool = (gameId: string) => {
  return tool({
    description: 'Switch to a different scene in the game. Updates the activeSceneId on the game.',
    inputSchema: switchSceneSchema,
    execute: async ({ sceneId }: SwitchSceneInput) => {
      try {
        // Update game's active scene
        await prisma.game.update({
          where: { id: gameId },
          data: { activeSceneId: sceneId },
        });

        return {
          success: true,
          message: `Switched to scene ${sceneId}`,
        };
      } catch (error) {
        console.error('Failed to switch scene:', error);
        return { success: false, error: 'Failed to switch scene' };
      }
    },
  });
};

// =============================================================================
// PLACE ASSET TOOL
// =============================================================================

export const placeAssetTool = (gameId: string) => {
  return tool({
    description: 'Place an asset in a scene at a specific position, rotation, and scale.',
    inputSchema: placeAssetSchema,
    execute: async ({ assetId, sceneId, position, rotation, scale }: PlaceAssetInput) => {
      try {
        // Create asset placement record
        const placement = await prisma.assetPlacement.create({
          data: {
            sceneId,
            assetRefId: assetId,
            positionX: position.x,
            positionY: position.y,
            positionZ: position.z,
            rotationX: rotation.x,
            rotationY: rotation.y,
            rotationZ: rotation.z,
            scaleX: scale.x,
            scaleY: scale.y,
            scaleZ: scale.z,
          },
        });

        return {
          success: true,
          message: `Placed asset ${assetId} in scene ${sceneId}`,
          placementId: placement.id,
          position,
          rotation,
          scale,
        };
      } catch (error) {
        console.error('Failed to place asset:', error);
        return { success: false, error: 'Failed to place asset' };
      }
    },
  });
};

// =============================================================================
// SET CAMERA TOOL
// =============================================================================

export const setCameraTool = (gameId: string) => {
  return tool({
    description: 'Configure the camera type and target for the game scene.',
    inputSchema: setCameraSchema,
    execute: async ({ type, target }: SetCameraInput) => {
      try {
        // Get current active scene
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { scenes: true },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        const activeSceneId = game.activeSceneId;
        if (!activeSceneId) {
          return { success: false, error: 'No active scene' };
        }

        const scene = game.scenes.find(s => s.id === activeSceneId);
        if (!scene) {
          return { success: false, error: 'Active scene not found' };
        }

        // Update scene code to configure camera
        const cameraCode = generateCameraSetupCode(type, target);
        await prisma.gameScene.update({
          where: { id: activeSceneId },
          data: { code: cameraCode },
        });

        return {
          success: true,
          message: `Camera set to ${type}${target ? ` targeting ${target}` : ''}`,
          type,
          target,
        };
      } catch (error) {
        console.error('Failed to set camera:', error);
        return { success: false, error: 'Failed to set camera' };
      }
    },
  });
};

// =============================================================================
// ENABLE PHYSICS TOOL
// =============================================================================

export const enablePhysicsTool = (gameId: string) => {
  return tool({
    description: 'Enable or configure physics for the game scene. Use Havok (recommended) or Cannon.js (fallback) physics engine.',
    inputSchema: enablePhysicsSchema,
    execute: async ({ engine, gravity }: EnablePhysicsInput) => {
      try {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        const activeSceneId = game.activeSceneId;
        if (!activeSceneId) {
          return { success: false, error: 'No active scene' };
        }

        const scene = await prisma.gameScene.findUnique({
          where: { id: activeSceneId },
        });

        // Generate physics setup code
        const physicsCode = generatePhysicsSetupCode(engine, gravity);

        await prisma.gameScene.update({
          where: { id: activeSceneId },
          data: { code: physicsCode },
        });

        return {
          success: true,
          message: `Physics enabled with ${engine} engine`,
          engine,
          gravity,
        };
      } catch (error) {
        console.error('Failed to enable physics:', error);
        return { success: false, error: 'Failed to enable physics' };
      }
    },
  });
};

// =============================================================================
// UPDATE CODE TOOL
// =============================================================================

export const updateCodeTool = (gameId: string) => {
  return tool({
    description: 'Update the Babylon.js code for a specific scene.',
    inputSchema: updateCodeSchema,
    execute: async ({ sceneId, code }: UpdateCodeInput) => {
      try {
        // Update scene code in database
        await prisma.gameScene.update({
          where: { id: sceneId },
          data: { 
            code,
            updatedAt: new Date(),
          },
        });

        // Create code version record for history
        await prisma.codeVersion.create({
          data: {
            gameId,
            code,
            description: 'Code update via chat',
            trigger: 'updateCode',
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Updated code for scene ${sceneId}`,
          sceneId,
          code,
        };
      } catch (error) {
        console.error('Failed to update code:', error);
        return { success: false, error: 'Failed to update code' };
      }
    },
  });
};

// =============================================================================
// ADD BEHAVIOR TOOL
// =============================================================================

export const addBehaviorTool = (gameId: string) => {
  return tool({
    description: 'Add behavior (movement, AI patrol, chase, idle) to an asset in the scene.',
    inputSchema: addBehaviorSchema,
    execute: async ({ assetId, behaviorType, parameters }: AddBehaviorInput) => {
      try {
        // Generate behavior code snippet
        const behaviorCode = generateBehaviorCode(behaviorType, parameters);

        // Update placement with behavior code
        // Note: This would need AssetPlacement to support behavior metadata
        // For MVP, we'll inline this into scene code

        return {
          success: true,
          message: `Added ${behaviorType} behavior to asset ${assetId}`,
          assetId,
          behaviorType,
          parameters,
          behaviorCode,
        };
      } catch (error) {
        console.error('Failed to add behavior:', error);
        return { success: false, error: 'Failed to add behavior' };
      }
    },
  });
};

// =============================================================================
// ADD INTERACTION TOOL
// =============================================================================

export const addInteractionTool = (gameId: string) => {
  return tool({
    description: 'Add interaction triggers (click, proximity, collision) to an asset in the scene.',
    inputSchema: addInteractionSchema,
    execute: async ({ assetId, interactionType, parameters }: AddInteractionInput) => {
      try {
        // Generate interaction code snippet
        const interactionCode = generateInteractionCode(interactionType, parameters);

        // Update placement with interaction code
        // Note: For MVP, inline this into scene code

        return {
          success: true,
          message: `Added ${interactionType} interaction to asset ${assetId}`,
          assetId,
          interactionType,
          parameters,
          interactionCode,
        };
      } catch (error) {
        console.error('Failed to add interaction:', error);
        return { false, error: 'Failed to add interaction' };
      }
    },
  });
};

// =============================================================================
// LIST USER ASSETS TOOL
// =============================================================================

export const listUserAssetsTool = (gameId: string) => {
  return tool({
    description: 'Query the user\'s Asset Hatch library for available assets to use in the game.',
    inputSchema: listUserAssetsSchema,
    execute: async ({ type, search, limit }: ListUserAssetsInput) => {
      try {
        // Get game to verify ownership
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        // Query user's Asset Hatch assets
        const assets = await prisma.generated3DAsset.findMany({
          where: {
            projectId: game.userId,
            approvalStatus: 'approved',
            ...(type !== 'all' && type === '3d' ? { type: '3d' } : {}),
            ...(search && { name: { contains: search } }),
          },
          take: limit,
        });

        // Transform to simplified format for AI
        const simplifiedAssets = assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          glbUrl: asset.riggedModelUrl || asset.draftModelUrl,
          thumbnailUrl: asset.thumbnailUrl,
        }));

        return {
          success: true,
          message: `Found ${simplifiedAssets.length} ${type === '3d' ? '3D' : '2D'} assets`,
          assets: simplifiedAssets,
        };
      } catch (error) {
        console.error('Failed to list assets:', error);
        return { success: false, error: 'Failed to list assets' };
      }
    },
  });
};

// =============================================================================
// CREATE ASSET TOOL
// =============================================================================

export const createAssetTool = (gameId: string) => {
  return tool({
    description: 'Trigger Asset Hatch generation to create a new asset for use in the game.',
    inputSchema: createAssetSchema,
    execute: async ({ type, name, description }: CreateAssetInput) => {
      try {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        // For MVP, return instruction to use Asset Hatch UI
        // In full implementation, would call Asset Hatch API

        return {
          success: true,
          message: `To create ${type} asset "${name}", navigate to Asset Hatch and use the 3D Generation phase`,
          type,
          name,
          description,
          actionUrl: `/projects/${game.userId}/3d-generation?project_id=${gameId}`,
        };
      } catch (error) {
        console.error('Failed to create asset:', error);
        return { success: false, error: 'Failed to create asset' };
      }
    },
  });
};

// =============================================================================
// CODE GENERATION HELPERS (INTERNAL)
// =============================================================================

function generateCameraSetupCode(type: string, target?: string): string {
  const cameraCode = `
// Camera Setup: ${type}${target ? ` targeting ${target}` : ''}
const scene = new BABYLON.Scene(engine);
${target ? `const target = scene.getMeshByName('${target}');` : ''}

switch (type) {
  case 'ArcRotateCamera':
    camera = new BABYLON.ArcRotateCamera('camera', Math.PI/3, Math.PI/4, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    break;
  case 'UniversalCamera':
    camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 10, -30), scene);
    camera.lockedTarget = ${target ? `scene.getMeshByName('${target}')` : 'null'};
    camera.fov = 0.47350045992678597;
    break;
  case 'FollowCamera':
    camera = new BABYLON.FollowCamera('camera', new BABYLON.Vector3(0, 10, -10), scene);
    camera.radius = 30;
    camera.heightOffset = 10;
    camera.lockedTarget = ${target ? `scene.getMeshByName('${target}')` : 'null'};
    break;
}

return camera;`;

  return cameraCode.trim();
}

function generatePhysicsSetupCode(engine: string, gravity: any): string {
  const { x: gx, y: gy, z: gz } = gravity;
  const physicsCode = `
// Physics Setup: ${engine}
const gravity = new BABYLON.Vector3(${gx}, ${gy}, ${gz});

${engine === 'Havok' ? `
// Enable Havok physics (recommended)
import HavokPhysics from "@babylonjs/havok";
const physicsPlugin = new HavokPhysics();
scene.enablePhysics(gravity, physicsPlugin);
` : `
// Enable Cannon.js physics (fallback)
var physicsPlugin = new BABYLON.CannonJSPlugin();
scene.enablePhysics(gravity, physicsPlugin);
`}

return physicsCode.trim();
}

function generateBehaviorCode(behaviorType: string, parameters: any): string {
  // Generate behavior code based on type
  // This is a simplified MVP implementation
  const code = `// ${behaviorType} behavior for asset\n` +
    JSON.stringify(parameters, null, 2);
  
  return code.trim();
}

function generateInteractionCode(interactionType: string, parameters: any): string {
  // Generate interaction code based on type
  // This is a simplified MVP implementation
  const code = `// ${interactionType} interaction\n` +
    JSON.stringify(parameters, null, 2);
  
  return code.trim();
}

// =============================================================================
// EXPORT FACTORY FUNCTION
// =============================================================================

/**
 * Create all game tools for a given project
 *
 * @param gameId - Current game ID
 * @returns Record of game tools for AI SDK
 */
export function createGameTools(gameId: string) {
  return {
    createScene: createSceneTool(gameId),
    switchScene: switchSceneTool(gameId),
    placeAsset: placeAssetTool(gameId),
    setCamera: setCameraTool(gameId),
    enablePhysics: enablePhysicsTool(gameId),
    updateCode: updateCodeTool(gameId),
    addBehavior: addBehaviorTool(gameId),
    addInteraction: addInteractionTool(gameId),
    listUserAssets: listUserAssetsTool(gameId),
    createAsset: createAssetTool(gameId),
  };
}
```

---

### Task 3: CREATE `src/lib/studio/babylon-system-prompt.ts`

- **IMPLEMENT**: Create comprehensive system prompt for Babylon.js code generation
- **PATTERN**: Follow AI SDK v6 system prompt best practices
- **IMPORTS**: None (pure string template)
- **GOTCHA**: Must include best practices from research - TransformNode, ArcRotateCamera, performance optimization
- **VALIDATE**: `bun run typecheck`

```typescript
/**
 * Babylon.js System Prompt for Hatch Studios
 *
 * Provides comprehensive guidelines for generating high-quality,
 * performant, and maintainable Babylon.js game code.
 */

export function getBabylonSystemPrompt(gameId: string, currentContext?: string): string {
  return `You are an expert Babylon.js game developer. Your goal is to generate high-quality, executable game code based on user requirements.

CRITICAL ARCHITECTURE RULES:
1. Use ES6 module imports: import { Engine, Scene, MeshBuilder, etc. } from '@babylonjs/core'
2. Use TransformNode for containers (NOT empty meshes)
3. Use ArcRotateCamera for editing/game preview (NOT FollowCamera for gameplay)
4. Use onBeforeRenderObservable for performance updates (NOT registerBeforeRender)
5. Freeze materials for static objects to reduce shader recompilation
6. Use instances for repeated geometry to reduce draw calls
7. Skip pointer move picking with scene.skipPointerMovePicking = true for performance
8. Enable Havok physics (WASM-based, 10-50x faster than Ammo.js)
9. Always dispose of unused resources to prevent memory leaks
10. Never create new objects in render loop (reuse objects)

SCENE STRUCTURE:
- Create ONE Scene per level
- Use descriptive variable names (playerMesh, groundPlane, scene, camera)
- Group related objects with TransformNode
- Use AssetContainer for loading and managing game assets between scenes
- Set scene.autoClear = false for multi-scene games

CODE GENERATION:
- Generate COMPLETE, RUNNABLE code (not fragments)
- Include all necessary imports at the top
- Add inline comments explaining non-obvious logic
- Handle errors gracefully with try-catch blocks
- Use TypeScript strict type annotations
- Follow project's existing code style (camelCase for variables, PascalCase for classes)

CAMERA SETUP:
Default to ArcRotateCamera for editing/game preview:
- Alpha: Math.PI/3, Beta: Math.PI/4, Radius: 10, Target: BABYLON.Vector3.Zero()
- Attach to canvas with camera.attachControl(canvas, true)
- For follow camera (advanced), set radius: 30, heightOffset: 10

PHYSICS SETUP:
- Enable Havok physics (recommended over Cannon.js)
- Set gravity to new BABYLON.Vector3(0, -9.81, 0) for Earth-like gravity
- Use physics impostors for collisions (BoxImpostor for ground, CylinderImpostor for player)
- Enable physics only on objects that need it (not everything)

ASSET LOADING:
- Use SceneLoader.ImportMeshAsync for loading GLB/GLTF models
- Handle loading errors with try-catch
- Set isPickable = false on imported assets (unless interactive)
- Use TransformNode instead of adding directly to scene for better organization

PERFORMANCE OPTIMIZATION:
- Use instances for repeated objects (trees, coins, bullets)
- Use LOD (Level of Detail) for distant objects
- Freeze materials for static objects
- Use texture atlases when possible
- Minimize draw calls by avoiding unnecessary updates

INTERACTIONS & EVENTS:
- Use onPointerObservable for pointer events (down, up, move, pick)
- Use onKeyboardObservable for keyboard input
- Use ActionManager for mesh-specific interactions (click, hover)
- Use registerBeforeRender for physics/camera updates

CODE QUALITY STANDARDS:
- Max ~200 lines per file (modular components)
- Use functional programming patterns
- Avoid global variables (use scene, camera local variables)
- Use descriptive names (not x, y, z unless coordinates)
- Add JSDoc comments for public functions

CURRENT CONTEXT:
- Game ID: ${gameId}
${currentContext ? `- Previous context: ${currentContext}` : ''}

WHEN TO USE TOOLS:
- User asks to create a new level/scene → use createScene
- User asks to switch scenes/levels → use switchScene
- User mentions adding an object → use placeAsset
- User asks about camera settings → use setCamera
- User mentions physics/gravity → use enablePhysics
- User wants to change code directly → use updateCode
- User describes behaviors (patrol, chase) → use addBehavior
- User describes interactions (click triggers) → use addInteraction
- User asks what assets are available → use listUserAssets
- User wants to create new asset → use createAsset

ALWAYS RETURN COMPLETE, EXECUTABLE CODE.
`;
```

---

### Task 4: CREATE `src/app/api/studio/chat/route.ts`

- **IMPLEMENT**: Create streaming chat API route with game tools
- **PATTERN**: Mirror `src/app/api/chat/route.ts` structure
- **IMPORTS**: `import { openrouter } from '@openrouter/ai-sdk-provider';`, `import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';`, `import { auth } from '@/auth';`, `import { prisma } from '@/lib/prisma';`
- **GOTCHA**: CRITICAL - Use `stopWhen: stepCountIs(10)` to enable tool execution. Use `toUIMessageStreamResponse()` not `toDataStreamResponse()`. Must `await convertToModelMessages(messages)`.
- **VALIDATE**: `bun run typecheck`

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createGameTools } from '@/lib/studio/game-tools';
import { getBabylonSystemPrompt } from '@/lib/studio/babylon-system-prompt';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, gameId } = await req.json();

    // Validate gameId
    if (!gameId || typeof gameId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'gameId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the game
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with current context
    const gameContext = {
      id: gameId,
      name: game.name,
      activeSceneId: game.activeSceneId,
    };
    const systemPrompt = getBabylonSystemPrompt(
      gameId,
      JSON.stringify(gameContext, null, 2)
    );

    // Convert UIMessages to ModelMessages (CRITICAL - MUST BE AWAITED)
    const modelMessages = await convertToModelMessages(messages);

    // Get game tools
    const gameTools = createGameTools(gameId);

    // Stream response with tools
    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,
      system: systemPrompt,
      stopWhen: stepCountIs(15), // Allow up to 15 tool calls per request
      tools: gameTools,
    });

    // CRITICAL: Use toUIMessageStreamResponse()
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Studio Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

### Task 5: UPDATE `src/components/studio/ChatPanel.tsx`

- **IMPLEMENT**: Replace placeholder with full useChat implementation
- **PATTERN**: Mirror `src/components/planning/ChatInterface.tsx` structure
- **IMPORTS**: `import { useChat } from '@ai-sdk/react';`, `import { useState } from 'react';`
- **GOTCHA**: Must pass body with gameId to sendMessage. Handle all 10+ game tools in onToolCall. Extract text from message parts.
- **VALIDATE**: `bun run typecheck`

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import type { UIMessage } from '@ai-sdk/react';

interface ChatPanelProps {
  gameId: string;
}

export function ChatPanel({ gameId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  
  const chatId = `studio-chat-${gameId}`;

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    id: chatId,
    api: '/api/studio/chat',
    body: { gameId }, // Pass gameId with every message
    onToolCall: ({ toolCall }) => {
      console.log('🎮 Tool called:', toolCall.toolName, toolCall.args);
      
      // Handle game tool results
      switch (toolCall.toolName) {
        case 'createScene':
          // Update studio state or trigger scene refresh
          console.log('✅ Scene created:', toolCall.args);
          break;
        case 'switchScene':
          // Update active scene in preview
          console.log('🔄 Scene switched:', toolCall.args.sceneId);
          break;
        case 'placeAsset':
          // Update preview with asset placement
          console.log('📍 Asset placed:', toolCall.args);
          break;
        case 'setCamera':
          // Update preview with camera change
          console.log('📷 Camera set:', toolCall.args);
          break;
        case 'enablePhysics':
          // Update preview with physics enabled
          console.log('⚡ Physics enabled:', toolCall.args);
          break;
        case 'updateCode':
          // Trigger preview hot-reload with new code
          console.log('💾 Code updated:', toolCall.args.sceneId);
          break;
        case 'addBehavior':
          // Log behavior addition
          console.log('🤖 Behavior added:', toolCall.args);
          break;
        case 'addInteraction':
          // Log interaction addition
          console.log('🖱️ Interaction added:', toolCall.args);
          break;
        case 'listUserAssets':
          // Display available assets in chat
          console.log('📦 Assets found:', toolCall.args.assets);
          break;
        case 'createAsset':
          // Show navigation instruction to Asset Hatch
          console.log('➕ Create asset:', toolCall.args);
          break;
        default:
          console.warn('⚠️ Unknown tool:', toolCall.toolName);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input }, { body: { gameId } });
      setInput("");
    }
  };

  const isLoading = status === 'in_progress';

  return (
    <div className="flex flex-col h-full">
      {/* Messages display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-90">
            <h3 className="text-2xl font-heading font-bold mb-3">
              What are we building?
            </h3>
            <p className="text-muted-foreground max-w-sm text-base">
              Describe your game idea. I'll help you create scenes, add assets, set up physics, and generate all the code.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Extract text from parts (AI SDK v6 pattern)
            const parts = message.parts as Array<{ type: string; text?: string } | undefined;
            const textParts = parts?.filter(p => 
              p.type === 'text' || p.type === 'reasoning'
            ) || [];
            const text = textParts.map(p => p.text).join('');
            
            // Skip messages with no text content
            if (!textContent && textParts.length === 0) return null;

            return (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "aurora-gradient text-white"
                      : "glass-panel aurora-glow-hover"
                  }`}
                >
                  <div className="text-sm leading-relaxed prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                    {text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 relative max-w-3xl mx-auto w-full items-end"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            placeholder="Describe your game idea or ask me to create a scene..."
            disabled={isLoading}
            className="flex-1 glass-panel px-4 py-3 rounded-xl border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-base resize-none custom-scrollbar bg-transparent placeholder:text-muted-foreground outline-none"
            minRows={1}
            maxRows={10}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 rounded-xl aurora-gradient text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 6: CREATE `src/tests/integration/studio-chat.test.ts`

- **IMPLEMENT**: Integration tests for chat API and tools
- **PATTERN**: Mirror existing integration test structure
- **IMPORTS**: Jest test utilities from existing tests
- **GOTCHA**: Test both successful tool execution and error handling
- **VALIDATE**: `bun run test src/tests/integration/studio-chat.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { POST } from 'node-fetch';

describe('Studio Chat API', () => {
  beforeEach(() => {
    // Setup test mocks
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await POST('http://localhost:3000/api/studio/chat', {
        messages: [],
        gameId: 'test-id',
      });
      expect(response.status).toBe(401);
    });

    it('should return 404 if game not found', async () => {
      // Implement test
    });
  });

  describe('Tool Execution', () => {
    it('should execute createScene tool successfully', async () => {
      // Implement test
    });

    it('should execute updateCode tool and update database', async () => {
      // Implement test
    });

    it('should handle tool execution errors', async () => {
      // Implement test
    });
  });

  describe('Streaming', () => {
    it('should stream text responses', async () => {
      // Implement test
    });

    it('should stream tool call parts', async () => {
      // Implement test
    });
  });
});
```

---

### Task 7: VERIFY PHASE 1 DATABASE MIGRATION

- **IMPLEMENT**: Run Prisma migration if not already applied
- **PATTERN**: Standard Prisma migration workflow
- **IMPORTS**: None
- **GOTCHA**: User needs to manually run migration in their environment
- **VALIDATE**: Check database tables exist

**NOTE**: If Phase 1 migration was not applied, run:
```bash
bun prisma migrate dev --name add-hatch-studios-models
```

---

### Task 8: RUN VALIDATION COMMANDS

- **IMPLEMENT**: Execute all validation commands
- **PATTERN**: Run commands in order from validation section
- **GOTCHA**: All commands must pass with zero errors

**Commands:**
```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Build check
bun run build
```

---

## TESTING STRATEGY

### Integration Tests

Using Jest with Prisma mocks for testing chat API and tool execution.

**Test Coverage:**
1. Authentication enforcement (401, 404)
2. Tool execution (createScene, switchScene, placeAsset, etc.)
3. Streaming responses (text, tool calls)
4. Error handling (invalid inputs, database errors)
5. Database updates (scene code, game active scene)

### Manual Testing

1. **Chat Flow Test**:
   - Start a new game
   - Type: "Create a platformer scene with a player"
   - Verify createScene tool executes
   - Verify preview updates with new scene

2. **Code Generation Test**:
   - Type: "Add a spinning cube to the scene"
   - Verify updateCode tool executes
   - Verify preview hot-reloads with new code

3. **Asset Placement Test**:
   - Type: "Place the dragon asset at position (0, 0, 0)"
   - Verify placeAsset tool executes
   - Verify asset appears in preview

4. **Multiple Scenes Test**:
   - Type: "Create a second scene called 'Level 2'"
   - Verify createScene tool executes
   - Type: "Switch to Level 2"
   - Verify switchScene tool executes
   - Verify preview shows different scene

### Edge Cases

- User sends empty message
- AI calls tool with invalid parameters
- Network timeout during tool execution
- Multiple rapid tool calls
- Very long code generation (token limits)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
bun run typecheck
bun run lint
```

### Level 2: Build Verification

```bash
bun run build
```

### Level 3: Integration Tests

```bash
# Run studio chat tests
bun run test src/tests/integration/studio-chat.test.ts

# Run all integration tests
bun run test src/tests/integration/
```

### Level 4: Manual Validation

**Chat Flow Test:**
1. Create new game: Navigate to `/studio/new`, create game
2. Open game: Navigate to `/studio/[id]`, verify chat panel loads
3. Create scene: Type "Create a scene called 'Main Level'", verify tool executes
4. Switch scenes: Type "Switch scenes to see them", verify works
5. Update code: Type "Update the scene code", verify preview reloads

**Code Generation Test:**
1. Simple generation: Type "Add a box to the scene", verify box appears
2. Complex generation: Type "Create a platformer with player movement", verify complete scene
3. Camera test: Type "Set camera to follow player", verify camera behavior

**Error Handling Test:**
1. Invalid gameId: Test with non-existent game ID, verify 404
2. Unauthorized access: Try accessing game without auth, verify 401
3. Tool error: Trigger tool with bad parameters, verify error handling

---

## ACCEPTANCE CRITERIA

- [ ] Feature implements all specified functionality
- [ ] All validation commands pass with zero errors
- [ ] 10+ game tools implemented with Zod validation
- [ ] Streaming chat API works with tool execution
- [ ] ChatPanel uses useChat with onToolCall for all tools
- [ ] Babylon.js system prompt includes best practices from research
- [ ] Code updates trigger preview hot-reload via postMessage
- [ ] Tool results update database correctly
- [ ] Integration tests pass for all tools
- [ ] Manual testing confirms chat-to-code workflow
- [ ] No regressions in existing Asset Hatch functionality
- [ ] Code follows project conventions (~200 lines per file)
- [ ] Error handling for tool failures works correctly

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms full chat-to-code workflow
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **stopWhen: stepCountIs(15)** - Allows multiple sequential tool calls for complex game setup. This is higher than Asset Hatch's 10 to account for game creation requiring multiple tools.

2. **Tool Result Format** - Tools return structured data that the AI can use in subsequent tool calls. For example, createScene returns the scene ID so subsequent tools can reference it.

3. **Chat ID per Game** - Using `studio-chat-${gameId}` ensures separate chat histories per game, preventing cross-game contamination.

4. **Code Generation Helper Functions** - Internal functions in game-tools.ts generate Babylon.js code snippets for camera setup, physics, etc. These are injected into scene code templates.

5. **Preview Hot-Reload** - Code updates trigger preview refresh via React context update and postMessage communication. The PreviewTab monitors code changes and reloads iframe.

### Risks

- **AI Tool Selection** - AI might not choose optimal tool for user intent. System prompt must be very clear about when to use each tool.
- **Token Limits** - Complex code generation might hit token limits. Code generation should prioritize complete, functional code over perfect code.
- **Preview Security** - Sandboxed iframe with srcdoc. Need to be careful about what code is executed in iframe.
- **Database Migration** - Phase 1 migration must be applied before Phase 3 tools can use the new models.

### Confidence Score: 8/10

High confidence due to:
- Clear existing patterns to follow (chat route, ChatInterface, tool definitions)
- Comprehensive research on both AI SDK v6 and Babylon.js
- Detailed step-by-step tasks with validation
- Oracle strategic guidance incorporated

Minor uncertainty around:
- Preview hot-reload implementation complexity (postMessage communication)
- Tool execution error handling in streaming context
- Code generation quality from AI model
