# Babylon.js Skill Specification

**Status:** Draft  
**Dependencies:** 4-game-tools.spec.md, 5-asset-integration.spec.md  
**Implements PRD Section:** 9

---

## 1. Purpose

Defines the Babylon.js Skill content—the domain expertise that guides AI code generation. This skill teaches the AI how to write production-quality Babylon.js games.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: AI SHALL generate valid, runnable Babylon.js code
- FR-002: AI SHALL follow engine best practices
- FR-003: AI SHALL handle asset loading correctly
- FR-004: AI SHALL implement common game patterns (input, physics, camera)
- FR-005: AI SHALL avoid known anti-patterns
- FR-006: AI SHALL keep files under ~200 lines

### 2.2 Non-Functional Requirements

- NFR-001: Generated code runs at 30+ FPS
- NFR-002: Code is readable and maintainable
- NFR-003: Error handling prevents crashes

---

## 3. Technical Design

### 3.1 Skill Location

```
.gemini/antigravity/skills/babylon-game-studio/
├── SKILL.md                    # Main skill definition
├── BEST-PRACTICES.md           # Code standards (ALWAYS in system prompt)
├── references/
│   ├── scene-setup.md          # Camera, lighting, environment
│   ├── asset-loading.md        # GLB import, materials
│   ├── animation-system.md     # Animation playback, blending
│   ├── physics-patterns.md     # Havok physics setup
│   ├── input-handling.md       # Keyboard, mouse, touch
│   ├── game-loop.md            # Update patterns
│   └── common-mistakes.md      # Anti-patterns to avoid
└── templates/
    ├── basic-scene.ts          # Minimal scene
    ├── platformer.ts           # 2.5D platformer
    └── third-person.ts         # 3rd person game
```

### 3.2 Best Practices Document

> **Critical:** `BEST-PRACTICES.md` is **always** attached to system prompt.

See `babylon-best-practices.md` in specs directory for full content. Covers:

| Section | Purpose |
|---------|---------|
| File Structure | ~200 lines per file, organized by concern |
| Code Organization | Consistent section headers, setup functions |
| Asset Loading | Standard async pattern with error handling |
| Input Handling | Observable-based, not polling |
| Physics Setup | Havok first, Cannon fallback |
| Performance Rules | Reuse vectors, pool objects |
| Animation Playback | Standardized play/stop pattern |
| Error Handling | Never crash, graceful fallbacks |
| DO NOT List | Anti-patterns to avoid |

### 3.3 System Prompt Structure

```
You have access to the babylon-game-studio skill.

## BEST PRACTICES (ALWAYS FOLLOW)
[Full contents of BEST-PRACTICES.md]

## USER'S AVAILABLE ASSETS
[Asset manifest with names, thumbnails, URLs]

## CURRENT GAME STATE
[Current code if updating, empty if new]
```

### 3.4 Reference Documents

Loaded on-demand based on task complexity:

- **scene-setup.md**: Camera types, lighting patterns
- **physics-patterns.md**: Havok setup, collision shapes
- **animation-system.md**: Playback, blending, state machines

---

## 4. Interface Contract

### 4.1 Skill Activation

Skill loads when:
- User is in Studio and sends chat message
- Message involves game creation/modification

### 4.2 Output Format

AI outputs code as complete, runnable TypeScript:

```typescript
// Complete scene code, no placeholders
export async function createScene(engine, canvas) {
  // ...
}
```

Preview injects into HTML template with Babylon.js runtime.

---

## 5. Implementation Notes

1. **Best practices always attached** - Unlike references, this is mandatory
2. **Asset manifest injected** - AI knows what assets are available
3. **Current code context** - AI sees existing code when updating
4. **Templates as starting points** - For common game types
5. **~200 line target** - Split files naturally

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] Skill loading produces valid system prompt
- [ ] Best practices document is included
- [ ] Asset manifest injection works

### 6.2 Manual Verification

- [ ] Generated code runs without errors
- [ ] Code follows best practices structure
- [ ] Physics enables correctly
- [ ] Files stay under 200 lines

### 6.3 Integration Check

- [ ] Skill works with game-tools
- [ ] Code updates trigger preview reload

---

## 7. Open Questions

None - ready for review.
