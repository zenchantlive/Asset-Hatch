# Babylon.js Code Generation Best Practices

**Purpose:** This document is attached to the system prompt when AI generates Babylon.js game code. It ensures consistency, maintainability, and quality without limiting creativity.

---

## 1. File Structure

> **Target: ~200 lines per file maximum**

```
game/
├── main.ts              # Entry point, engine setup, render loop
├── scenes/
│   ├── Scene1.ts        # One file per scene
│   └── Scene2.ts
├── systems/
│   ├── InputSystem.ts   # Keyboard/mouse/touch handling
│   ├── PhysicsSystem.ts # Physics configuration
│   └── CameraSystem.ts  # Camera setup and behavior
├── entities/
│   ├── Player.ts        # Player logic
│   └── Enemy.ts         # NPC/enemy logic
├── assets/
│   └── AssetLoader.ts   # Asset loading and caching
└── utils/
    └── helpers.ts       # Shared utility functions
```

When generating code, split into multiple files if:
- File exceeds 200 lines
- Distinct responsibilities can be separated
- Reusable logic can be extracted

---

## 2. Code Organization Pattern

Every scene file follows this structure:

```typescript
/**
 * [Scene Name]
 * [Brief description of what this scene does]
 */

// =============================================================================
// IMPORTS
// =============================================================================
import * as BABYLON from "@babylonjs/core";

// =============================================================================
// CONSTANTS
// =============================================================================
const PLAYER_SPEED = 5;
const GRAVITY = -9.81;

// =============================================================================
// INTERFACES
// =============================================================================
interface GameState {
  score: number;
  health: number;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================
export async function createScene(
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
): Promise<BABYLON.Scene> {
  // 1. Create scene
  const scene = new BABYLON.Scene(engine);
  
  // 2. Setup camera
  setupCamera(scene, canvas);
  
  // 3. Setup lighting
  setupLighting(scene);
  
  // 4. Load assets
  await loadAssets(scene);
  
  // 5. Initialize game state
  const state = initializeState();
  
  // 6. Setup input
  setupInput(scene, state);
  
  // 7. Register update loop
  scene.onBeforeRenderObservable.add(() => {
    updateGameLogic(scene, state, engine.getDeltaTime());
  });
  
  return scene;
}

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================
function setupCamera(scene: BABYLON.Scene, canvas: HTMLCanvasElement): void {
  // Camera implementation
}

function setupLighting(scene: BABYLON.Scene): void {
  // Lighting implementation
}

// =============================================================================
// GAME LOGIC
// =============================================================================
function initializeState(): GameState {
  return { score: 0, health: 100 };
}

function updateGameLogic(
  scene: BABYLON.Scene,
  state: GameState,
  deltaTime: number
): void {
  // Per-frame update logic
}
```

---

## 3. Asset Loading

**Always use this pattern:**

```typescript
async function loadAsset(
  scene: BABYLON.Scene,
  url: string,
  name: string
): Promise<BABYLON.AbstractMesh> {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",      // mesh names (empty = all)
      url,     // URL to GLB
      "",      // filename (already in URL)
      scene
    );
    
    const root = result.meshes[0];
    root.name = name;
    
    // Store animations in metadata for easy access
    if (result.animationGroups.length > 0) {
      root.metadata = root.metadata || {};
      root.metadata.animations = {};
      result.animationGroups.forEach(group => {
        root.metadata.animations[group.name] = group;
      });
    }
    
    return root;
  } catch (error) {
    console.error(`Failed to load asset: ${name}`, error);
    throw error;
  }
}
```

---

## 4. Input Handling

**Use observables, not polling:**

```typescript
function setupInput(scene: BABYLON.Scene, state: GameState): void {
  const inputMap: Record<string, boolean> = {};
  
  // Keyboard
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      inputMap[kbInfo.event.key.toLowerCase()] = true;
    }
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
      inputMap[kbInfo.event.key.toLowerCase()] = false;
    }
  });
  
  // Store in scene metadata for access in update loop
  scene.metadata = scene.metadata || {};
  scene.metadata.inputMap = inputMap;
}

function handleInput(scene: BABYLON.Scene, player: BABYLON.Mesh): void {
  const input = scene.metadata?.inputMap || {};
  
  if (input["w"] || input["arrowup"]) {
    player.position.z += 0.1;
  }
  // ... etc
}
```

---

## 5. Physics Setup

**Havok is default, Cannon is fallback:**

```typescript
async function setupPhysics(scene: BABYLON.Scene): Promise<void> {
  try {
    // Try Havok first (better performance)
    const havok = await HavokPhysics();
    const plugin = new BABYLON.HavokPlugin(true, havok);
    scene.enablePhysics(new BABYLON.Vector3(0, GRAVITY, 0), plugin);
    console.log("Physics: Havok enabled");
  } catch {
    // Fallback to Cannon.js
    const plugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(new BABYLON.Vector3(0, GRAVITY, 0), plugin);
    console.log("Physics: Cannon.js fallback");
  }
}
```

---

## 6. Performance Rules

| Rule | Reason |
|------|--------|
| **Reuse Vector3/Quaternion** | Avoid GC pressure |
| **Pool objects** | Don't create/destroy frequently |
| **Use freezeWorldMatrix()** | For static meshes |
| **Limit draw calls** | Merge static meshes when possible |

```typescript
// ❌ Bad - creates new Vector3 every frame
function update() {
  mesh.position = new BABYLON.Vector3(x, y, z);
}

// ✅ Good - reuse existing vector
const _tempPos = new BABYLON.Vector3();
function update() {
  _tempPos.set(x, y, z);
  mesh.position.copyFrom(_tempPos);
}
```

---

## 7. Animation Playback

```typescript
function playAnimation(mesh: BABYLON.AbstractMesh, name: string): void {
  const animations = mesh.metadata?.animations;
  if (!animations) return;
  
  // Stop all current animations on this mesh
  Object.values(animations).forEach((anim: BABYLON.AnimationGroup) => {
    anim.stop();
  });
  
  // Play requested animation
  const anim = animations[name];
  if (anim) {
    anim.start(true); // true = loop
  }
}
```

---

## 8. Error Handling

**Never let errors crash the game:**

```typescript
// Wrap risky operations
try {
  await riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  // Graceful fallback
}

// Handle missing assets gracefully
const mesh = scene.getMeshByName("player");
if (!mesh) {
  console.warn("Player mesh not found");
  return;
}
```

---

## 9. Commenting Standards

```typescript
/**
 * Creates the main game scene with player, enemies, and environment.
 * 
 * @param engine - Babylon engine instance
 * @param canvas - HTML canvas element
 * @returns Configured scene ready for rendering
 */
export async function createScene(...): Promise<BABYLON.Scene> {
  // Setup camera for third-person view
  const camera = new BABYLON.FollowCamera(...);
  
  // Load player model and extract animations
  const player = await loadAsset(scene, playerUrl, "player");
}
```

---

## 10. DO NOT

❌ Forget `await` on async operations  
❌ Call `scene.render()` outside `runRenderLoop`  
❌ Create new Vector3/Quaternion every frame  
❌ Leave console.log in production code  
❌ Ignore errors silently  
❌ Use `any` type without necessity  
❌ Exceed 200 lines per file  
❌ Mix concerns (physics in rendering, input in assets)  
