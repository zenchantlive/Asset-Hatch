# Game Tools Specification

**Status:** Draft  
**Dependencies:** 1-hatch-studios-architecture.spec.md, 3-api-endpoints.spec.md  
**Implements PRD Section:** 7, 9

---

## 1. Purpose

Defines the AI SDK v6 tools available in Hatch Studios chat. These tools enable the AI to create scenes, place assets, configure gameplay, and generate Babylon.js code.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: AI SHALL create and modify scenes
- FR-002: AI SHALL place assets from user's library
- FR-003: AI SHALL configure camera, lighting, and physics
- FR-004: AI SHALL generate/update Babylon.js code
- FR-005: AI SHALL manage scene transitions
- FR-006: AI SHALL trigger asset creation in Asset Hatch when needed

### 2.2 Non-Functional Requirements

- NFR-001: Tool execution < 2s (excluding external API calls)
- NFR-002: Tool results consumable by AI for follow-up
- NFR-003: Tools are atomic and reversible where possible

---

## 3. Technical Design

### 3.1 Tool Categories

| Category | Tools |
|----------|-------|
| **Scene Management** | createScene, updateScene, deleteScene, switchScene |
| **Asset Placement** | placeAsset, moveAsset, removeAsset, listUserAssets |
| **Game Configuration** | setCamera, setLighting, enablePhysics, setEnvironment |
| **Code Generation** | updateCode, appendToCode, getCode |
| **Behavior** | addBehavior, addInteraction, addTrigger |
| **Cross-Product** | createAsset, importAssetProject |

### 3.2 Tool Definitions

```typescript
// =============================================================================
// SCENE MANAGEMENT
// =============================================================================

createScene: tool({
  description: `Create a new scene in the game. Use when user wants a new level, 
    menu, or game state. AI manages scenes automatically but users can reference 
    them by name.`,
  parameters: z.object({
    name: z.string().describe('Scene name, e.g. "Level 1", "Main Menu"'),
    description: z.string().optional().describe('What this scene is for'),
  }),
  execute: async ({ name, description }, { gameId }) => {
    // Create scene in DB
    // Generate initial Babylon.js scene code
    // Return scene ID and confirmation
  }
}),

switchScene: tool({
  description: `Switch the active scene. Use when user wants to work on a 
    different part of the game or when generating transition logic.`,
  parameters: z.object({
    sceneId: z.string().optional(),
    sceneName: z.string().optional().describe('Can reference by name'),
  }),
  execute: async ({ sceneId, sceneName }, { gameId }) => {
    // Find scene by ID or name
    // Update activeSceneId in game
    // Return confirmation
  }
}),

// =============================================================================
// ASSET PLACEMENT
// =============================================================================

placeAsset: tool({
  description: `Place an asset from the user's Asset Hatch library into the 
    current scene. Use when user mentions placing a character, prop, or 
    environment element.`,
  parameters: z.object({
    assetId: z.string().describe('Asset ID from Asset Hatch'),
    assetName: z.string().optional().describe('For reference by name'),
    position: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    }).optional(),
    rotation: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    }).optional(),
    scale: z.object({
      x: z.number().default(1),
      y: z.number().default(1),
      z: z.number().default(1),
    }).optional(),
    instanceName: z.string().optional().describe('Name in scene code'),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Add asset reference to game if not exists
    // Create asset placement in scene
    // Generate Babylon.js code to load and place asset
    // Return placement ID and code snippet
  }
}),

listUserAssets: tool({
  description: `List assets available in the user's Asset Hatch library. 
    Use before placing assets or when user asks what assets they have.`,
  parameters: z.object({
    type: z.enum(['2d', '3d', 'all']).default('all'),
    search: z.string().optional(),
    projectId: z.string().optional(),
  }),
  execute: async (params, { userId }) => {
    // Query Asset Hatch assets for user
    // Return list with names, types, thumbnails
  }
}),

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

setCamera: tool({
  description: `Configure the camera for the current scene. Choose camera type 
    and settings based on game style.`,
  parameters: z.object({
    type: z.enum([
      'arc-rotate',    // Third-person orbital
      'follow',        // Behind character
      'universal',     // First-person
      'free',          // Fly mode
    ]),
    target: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional(),
    distance: z.number().optional().describe('For arc-rotate/follow'),
    height: z.number().optional().describe('For follow camera'),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Generate camera configuration code
    // Update scene code
    // Return confirmation
  }
}),

enablePhysics: tool({
  description: `Enable physics engine for the current scene. Use when game 
    needs realistic movement, collisions, or gravity.`,
  parameters: z.object({
    engine: z.enum(['havok', 'cannon']).default('havok'),
    gravity: z.object({
      x: z.number().default(0),
      y: z.number().default(-9.81),
      z: z.number().default(0),
    }).optional(),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Generate physics setup code
    // Update scene code
  }
}),

setEnvironment: tool({
  description: `Configure scene environment: skybox, ground, fog, lighting mood.`,
  parameters: z.object({
    skybox: z.string().optional().describe('Skybox asset ID or "procedural"'),
    ground: z.boolean().optional(),
    groundColor: z.string().optional().describe('Hex color'),
    fog: z.object({
      enabled: z.boolean(),
      density: z.number().optional(),
      color: z.string().optional(),
    }).optional(),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Generate environment setup code
  }
}),

// =============================================================================
// CODE GENERATION
// =============================================================================

updateCode: tool({
  description: `Update the entire scene code. Use for major changes or when 
    generating a complete game from scratch.`,
  parameters: z.object({
    code: z.string().describe('Complete Babylon.js code for scene'),
    description: z.string().optional().describe('What this change does'),
  }),
  execute: async ({ code, description }, { gameId, sceneId }) => {
    // Save current code as version
    // Update scene code
    // Return confirmation
  }
}),

getCode: tool({
  description: `Get the current scene code. Use when you need to understand 
    what's already there before making changes.`,
  parameters: z.object({}),
  execute: async (_, { gameId, sceneId }) => {
    // Return current scene code
  }
}),

// =============================================================================
// BEHAVIOR / INTERACTION
// =============================================================================

addBehavior: tool({
  description: `Add behavior to an asset: movement, animation triggers, AI.`,
  parameters: z.object({
    targetAsset: z.string().describe('Asset instance name or ID'),
    behaviorType: z.enum([
      'player-control',    // WASD/arrow control
      'follow-path',       // Move along waypoints
      'ai-patrol',         // Random/patrol movement
      'physics-body',      // Add physics to asset
      'animate-on-idle',   // Play animation when idle
    ]),
    options: z.record(z.unknown()).optional(),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Generate behavior code
    // Append to scene
  }
}),

addInteraction: tool({
  description: `Add interaction trigger: click, proximity, collision.`,
  parameters: z.object({
    targetAsset: z.string(),
    triggerType: z.enum(['click', 'proximity', 'collision', 'key-press']),
    action: z.string().describe('What happens: "go to Level 2", "play animation X"'),
  }),
  execute: async (params, { gameId, sceneId }) => {
    // Generate interaction code
  }
}),

// =============================================================================
// CROSS-PRODUCT (Asset Hatch Integration)
// =============================================================================

createAsset: tool({
  description: `Create a new asset using Asset Hatch. Use when user needs an 
    asset that doesn't exist in their library yet.`,
  parameters: z.object({
    type: z.enum(['2d', '3d']),
    name: z.string(),
    description: z.string(),
    shouldRig: z.boolean().optional().describe('For 3D characters'),
    animations: z.array(z.string()).optional(),
  }),
  execute: async (params, { userId }) => {
    // This triggers Asset Hatch generation flow
    // Returns pending asset or prompts user to switch
  }
}),
```

---

## 4. Interface Contract

### 4.1 Tool Context

All tools receive context via execute function:

```typescript
interface ToolContext {
  gameId: string;
  sceneId: string;      // Active scene
  userId: string;
  previousCode: string; // For diff generation
}
```

### 4.2 Tool Results

All tools return structured results:

```typescript
interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;        // Tool-specific data
  codeGenerated?: string; // If tool generated code
}
```

---

## 5. Implementation Notes

1. **Follow existing pattern** from `/api/chat/route.ts`
2. **Tool execution** happens server-side
3. **Code generation** uses Babylon.js Skill for quality
4. **State updates** trigger preview reload
5. **Error handling** returns user-friendly messages

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] createScene creates DB record + initial code
- [ ] placeAsset adds reference + placement
- [ ] setCamera generates valid Babylon.js code
- [ ] updateCode saves version history
- [ ] listUserAssets returns correct assets

### 6.2 Manual Verification

- [ ] Chat can create a complete game from description
- [ ] Asset placement appears in preview
- [ ] Scene switching works via chat

### 6.3 Integration Check

- [ ] Tools work with streaming chat
- [ ] Preview updates after tool execution
- [ ] Code history tracks all changes

---

## 7. Open Questions

None - ready for review.
