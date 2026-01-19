# ADR-024: Multi-File Game Code Architecture

**Date:** 2026-01-18  
**Status:** Accepted  
**Deciders:** User + AI pair programming session

---

## Context

During Phase 4A/4B of Hatch Studios development, we needed to decide how to structure game code generation. Initial MVP used a single `code: string` field, but games naturally need separation of concerns:

- Engine setup vs game logic vs UI
- Player controls vs enemy AI vs level geometry
- Readability and maintainability

Should we:
1. Keep single file (simpler, but becomes unwieldy)
2. Use ES modules (complex for iframe injection)
3. Concatenate files in order (chosen approach)

---

## Decision

We chose **ordered file concatenation** with global scope sharing.

### Implementation

1. **Database:** `GameFile` model with `orderIndex` field
2. **API:** `GET /api/studio/games/[id]/files` returns all files sorted by `orderIndex`
3. **Client:** `StudioProvider` manages `files: GameFileData[]` state
4. **Preview:** Files concatenated at runtime:
   ```typescript
   const combinedCode = files
     .sort((a, b) => a.orderIndex - b.orderIndex)
     .map(f => f.content)
     .join('\n\n');
   ```

### File Naming Convention

| File | orderIndex | Purpose |
|------|------------|---------|
| `main.js` | 0 | Engine, scene, camera, lights |
| `player.js` | 1 | Player mesh, controls, physics |
| `level.js` | 2 | Ground, obstacles, collectibles |
| `game.js` | 3 | Game loop, scoring, UI, events |

### Rules for AI

1. **Never call functions across files** - Functions aren't available between files
2. **Use global scope** - Variables created in player.js are available in game.js
3. **Use TransformNode parenting** - `mesh.parent = planeNode`
4. **Create complete files** - Each file must be self-contained at execution time

### Example (WRONG)

```javascript
// player.js
function createPlayer() { return mesh; }  // ❌ Function not available elsewhere

// game.js
const player = createPlayer();  // ❌ ReferenceError
```

### Example (RIGHT)

```javascript
// player.js - Creates at global scope
const player = BABYLON.MeshBuilder.CreateBox('player', {size: 2}, scene);

// game.js - player already exists
scene.onBeforeRenderObservable.add(() => {
  player.rotation.y += 0.01;  // ✅ Works
});
```

---

## Consequences

### Positive

- **Clean separation** - Each file has clear purpose
- **Easy editing** - Users can edit specific files in CodeTab
- **Execution order** - Controlled by orderIndex, explicit dependencies
- **Preview works** - Concatenation preserves Babylon.js execution model
- **AI can regenerate** - Updating one file doesn't affect others

### Negative

- **No shared functions** - Must use global scope, can't abstract logic
- **Naming collisions** - Two files can't declare same variable
- **Order matters** - Mistakes in orderIndex cause runtime errors

### Mitigations

- **System prompt** - Explicitly teaches WRONG/RIGHT patterns
- **CodeTab UI** - Shows execution order next to filename
- **Validation** - Could add runtime checks for required globals

---

## Alternatives Considered

### ES Modules with Import Statements

Rejected because:
- Browser's `<script type="module">` requires valid URLs or bundled code
- Our iframe uses inline `srcdoc`, not external files
- Would need bundler (esbuild/wasm) in preview - too complex

### Single File with Sections

Rejected because:
- Hard to navigate in Monaco editor
- Easy to break entire game with one typo
- Doesn't match how real games are structured

---

## Implementation Files

- `src/prisma/schema.prisma` - `GameFile` model with `orderIndex`
- `src/app/api/studio/games/[id]/files/route.ts` - File CRUD API
- `src/components/studio/StudioProvider.tsx` - Multi-file state management
- `src/components/studio/PreviewFrame.tsx` - File concatenation
- `src/components/studio/tabs/CodeTab.tsx` - File explorer + Monaco tabs
- `src/lib/studio/babylon-system-prompt.ts` - AI instructions for multi-file

---

## Review Date

2026-02-18 (1 month) - Evaluate if global scope pattern causes issues
