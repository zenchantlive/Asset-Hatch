# Feature: Robust Babylon.js Code Generation System

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Comprehensive overhaul of the Babylon.js code generation system to produce more robust, crash-resistant game code. The current system works well for capable models but produces fragile code when used by less capable models, leading to runtime crashes from undefined property access, asset loading failures, and physics timing issues.

## User Story

As a Hatch Studios user
I want AI-generated game code to be robust and fault-tolerant
So that games work reliably regardless of which AI model generates them

## Problem Statement

Current AI-generated Babylon.js code crashes due to:
1. Missing null checks on asset loading (e.g., `player.position.y = 1` when `player` is null)
2. Observable usage without existence checks (e.g., `scene.onReadyObservable.addOnce(...)` when undefined)
3. Physics aggregates created before physics engine initializes
4. Game loops assuming objects exist without guards
5. Cross-file dependencies failing silently

## Solution Statement

**Current Approach Problem**: System prompt patterns are SUGGESTIONS - agents can ignore them.

**New Approach: ARCHITECTURAL ENFORCEMENT**

We need guarantees at multiple layers:

### Layer 1: MANDATORY Validation in Tools (Can't Skip)
- `createFile` and `updateFile` tools automatically run validation
- Tool returns warnings/errors alongside success - agent sees issues immediately
- If critical errors found, tool can BLOCK file creation

### Layer 2: Pre-built Controls Library (Guaranteed to Work)
- Create `CONTROLS` helper similar to `ASSETS`
- Standard input handling patterns that never fail
- Agent uses `CONTROLS.keyboard()` instead of writing from scratch

### Layer 3: Error Interception & Feedback Loop
- Preview iframe catches runtime errors
- Errors sent back to agent with actionable suggestions
- "Fix this error" becomes a tool the agent can use

### Layer 4: Structured Code Generation (Template-Based)
- Provide file templates as starting points
- Agent fills in game-specific logic, structure is guaranteed
- Like form-filling instead of free-form writing

### Layer 5: Quality Gate Before Completion
- Agent MUST call `verifyGame` tool before saying "done"
- Tool runs all validation and reports issues
- Clear signal if game is ready or needs fixes

---

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: babylon-system-prompt.ts, asset-loader.ts, game-tools.ts, studio chat route
**Dependencies**: None (pure additive changes)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

- `src/lib/studio/babylon-system-prompt.ts` (all 936 lines) - Why: Main system prompt being enhanced
- `src/lib/studio/asset-loader.ts` (lines 280-450) - Why: Asset loading logic, pattern for CONTROLS helper
- `src/lib/studio/game-tools.ts` (lines 455-524) - Why: createFileTool to add validation
- `src/app/api/studio/chat/route.ts` - Why: Chat route where tools are registered
- `src/components/studio/PreviewFrame.tsx` - Why: Where error interception happens

### New Files to Create

- `src/lib/studio/code-validator.ts` - Validation logic
- `src/lib/studio/controls-helper.ts` - Pre-built CONTROLS helper for iframe
- `src/lib/studio/game-templates.ts` - Structured templates for common game types
- `src/tests/unit/code-validator.test.ts` - Unit tests

### Files to Modify (Non-Breaking Additions)

- `src/lib/studio/babylon-system-prompt.ts` - Add safety sections, CONTROLS docs
- `src/lib/studio/game-tools.ts` - Add validation to createFile, add verifyGame tool
- `src/lib/studio/asset-loader.ts` - Add CONTROLS helper injection
- `src/components/studio/PreviewFrame.tsx` - Add error interception

### Patterns to Follow

**Naming Conventions:**
- Tool names: camelCase (e.g., `createFileTool`, `verifyGameTool`)
- Helper names: UPPERCASE for iframe globals (e.g., `ASSETS`, `CONTROLS`)
- Schema names: camelCase with Schema suffix

---

## IMPLEMENTATION PLAN

### Phase 1: System Prompt Improvements (Non-Breaking Additions)

Add new sections to `babylon-system-prompt.ts`:
- ✅ SAFE ASSET LOADING PATTERNS section (already added)
- ✅ OBSERVABLE SAFETY section (already added)
- ✅ DEFENSIVE GAME LOOPS section (already added)
- COMMON PITFALLS section (to add)
- FILE DEPENDENCY CHECKS section (to add)
- CONTROLS HELPER documentation (to add)

### Phase 2: Controls Helper Library (Guaranteed Input Handling)

Create pre-built, tested input handling patterns:

```javascript
// In iframe - CONTROLS.keyboard() returns bulletproof input state
const input = CONTROLS.keyboard();

scene.onBeforeRenderObservable.add(() => {
  if (input.w) player.position.z += 0.1;
  if (input.s) player.position.z -= 0.1;
  if (input.a) player.position.x -= 0.1;
  if (input.d) player.position.x += 0.1;
  if (input.space) jump();
});

// Also available:
CONTROLS.mouse();  // { x, y, leftDown, rightDown }
CONTROLS.touch();  // { touches: [], primaryTouch }
CONTROLS.gamepad(); // gamepad input if connected
```

### Phase 3: Mandatory Validation in File Tools

Modify `createFileTool` and `updateFileTool`:

```typescript
execute: async ({ name, content }) => {
  // Run validation BEFORE saving
  const validation = validateGameCode(content);
  
  // Save the file
  const file = await prisma.gameFile.create({...});
  
  // Return validation results WITH success
  return {
    success: true,
    fileId: file.id,
    // Agent SEES these immediately:
    warnings: validation.warnings,
    errors: validation.errors,
    suggestions: validation.suggestions,
  };
};
```

### Phase 4: Error Interception in Preview

Add to PreviewFrame.tsx:

```typescript
// Listen for runtime errors from iframe
window.addEventListener('message', (event) => {
  if (event.data?.type === 'runtime-error') {
    // Parse error and suggest fix
    const suggestion = analyzeError(event.data.error);
    // Surface to agent via tool result
    setLastError({ error: event.data.error, suggestion });
  }
});
```

### Phase 5: verifyGame Tool (Quality Gate)

New tool that agent MUST call before completion:

```typescript
export const verifyGameTool = (gameId: string) => {
  return tool({
    description: 'MANDATORY: Call this before saying the game is complete. Validates all code.',
    execute: async () => {
      const files = await prisma.gameFile.findMany({ where: { gameId } });
      const allIssues = [];
      
      for (const file of files) {
        const validation = validateGameCode(file.content);
        allIssues.push(...validation.errors, ...validation.warnings);
      }
      
      return {
        ready: allIssues.length === 0,
        issues: allIssues,
        message: allIssues.length === 0 
          ? '✅ Game is ready!' 
          : `⚠️ ${allIssues.length} issues to fix`,
      };
    },
  });
};
```

### Phase 6: Structured Templates (Optional Enhancement)

Pre-built templates for common game types:

```typescript
const GAME_TEMPLATES = {
  platformer: {
    'main.js': `// Platformer main.js template...`,
    'player.js': `// Player with physics, jump, move...`,
    'level.js': `// Ground, platforms, obstacles...`,
  },
  topdown: { ... },
  shooter: { ... },
};
```

Agent can use: `createGameFromTemplate({ template: 'platformer' })`

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: ADD common pitfalls section to babylon-system-prompt.ts

- **IMPLEMENT**: Add "COMMON PITFALLS TO AVOID" section before CURRENT CONTEXT section
- **PATTERN**: Follow existing section format with `================================================================================`
- **GOTCHA**: Must be pure addition, don't modify existing sections
- **VALIDATE**: `cd src && bun run typecheck`

### Task 2: ADD file dependency checks section to babylon-system-prompt.ts

- **IMPLEMENT**: Add "FILE DEPENDENCY CHECKS" section showing how to guard cross-file dependencies
- **PATTERN**: Similar to SAFE ASSET LOADING PATTERNS section
- **GOTCHA**: Keep examples concise - this goes in the system prompt
- **VALIDATE**: `cd src && bun run typecheck`

### Task 3: CREATE code-validator.ts

- **IMPLEMENT**: Create validation module with `validateGameCode()` function
- **PATTERN**: Check for common error patterns using regex/AST
- **IMPORTS**: None needed - pure JavaScript analysis
- **GOTCHA**: Keep simple - regex-based pattern matching, not full AST parsing
- **VALIDATE**: `cd src && bun run typecheck`

### Task 4: ADD validateCode schema to schemas.ts

- **IMPLEMENT**: Add `validateCodeSchema` and `ValidateCodeInput` type
- **PATTERN**: `createFileSchema` in same file (line 1-20)
- **IMPORTS**: `import { z } from 'zod';` already present
- **VALIDATE**: `cd src && bun run typecheck`

### Task 5: ADD validateCode tool to game-tools.ts

- **IMPLEMENT**: Create `validateCodeTool` function
- **PATTERN**: `createFileTool` structure (lines 455-524)
- **IMPORTS**: Add `validateCodeSchema` and import validator from code-validator.ts
- **VALIDATE**: `cd src && bun run typecheck`

### Task 6: REGISTER validateCode tool in chat route

- **IMPLEMENT**: Add `validateCode: validateCodeTool(gameId, userId)` to tools object
- **PATTERN**: See existing tool registrations in route.ts
- **VALIDATE**: `cd src && bun run typecheck && bun run lint`

### Task 7: ADD loadSafe helper to asset-loader.ts

- **IMPLEMENT**: Add `window.ASSETS.loadSafe()` wrapper function with automatic fallback
- **PATTERN**: Existing ASSETS.load() implementation (lines 280-400)
- **GOTCHA**: Must work in iframe context, no module imports
- **VALIDATE**: `cd src && bun run typecheck`

### Task 8: UPDATE system prompt to recommend loadSafe

- **IMPLEMENT**: Update SAFE ASSET LOADING section to mention `ASSETS.loadSafe()` as simpler alternative
- **PATTERN**: Existing examples in system prompt
- **VALIDATE**: `cd src && bun run typecheck`

### Task 9: CREATE unit tests for code-validator

- **IMPLEMENT**: Test validateGameCode() with various code patterns
- **PATTERN**: `src/tests/integration/studio-chat.test.ts` for structure
- **IMPORTS**: `import { describe, it, expect } from 'bun:test'`
- **VALIDATE**: `cd src && bun test tests/unit/code-validator.test.ts`

### Task 10: FINAL VALIDATION

- **VALIDATE**: `cd src && bun run typecheck && bun run lint`
- **VALIDATE**: `cd src && bun test`

---

## TESTING STRATEGY

### Unit Tests

Test `validateGameCode()` function:
- Should detect undefined access patterns
- Should detect missing try/catch on ASSETS.load
- Should detect physics before ready check
- Should pass valid code without issues

### Integration Tests

Extend `studio-chat.test.ts`:
- Test validateCode tool registration
- Test validation returns useful messages

### Manual Testing Prompts

After implementation, test with these prompts in Hatch Studios:

1. **Simple game**: "Create a simple game where a cube moves with WASD"
   - Expected: No crashes, includes null guards in game loop

2. **Asset loading**: "Create a game using the player_starship asset"
   - Expected: Uses try/catch or loadSafe, shows fallback on failure

3. **Physics game**: "Create a platformer with jumping and gravity"
   - Expected: Uses onPhysicsReadyObservable before PhysicsAggregate

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
cd src && bun run typecheck
cd src && bun run lint
```

### Level 2: Unit Tests
```bash
cd src && bun test tests/unit/code-validator.test.ts
```

### Level 3: Integration Tests
```bash
cd src && bun test tests/integration/studio-chat.test.ts
```

### Level 4: Manual Validation

1. Open Hatch Studios in browser
2. Create new game
3. Enter: "Create a simple platformer game"
4. Check browser console for errors
5. Verify game preview loads without crashes

---

## ACCEPTANCE CRITERIA

- [x] Safe asset loading patterns section added to system prompt
- [x] Observable safety section added to system prompt
- [x] Defensive game loops section added to system prompt
- [ ] Common pitfalls section added to system prompt
- [ ] File dependency checks section added to system prompt
- [ ] Code validator module created and tested
- [ ] validateCode tool registered and working
- [ ] loadSafe helper added to asset loader
- [ ] All validation commands pass
- [ ] Manual testing confirms improved code quality

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met

---

## NOTES

**Non-Breaking Approach**: All changes are pure additions. Existing code patterns continue to work. New patterns are recommended alongside existing ones.

**Already Completed**:
- Added SAFE ASSET LOADING PATTERNS section
- Added OBSERVABLE SAFETY section  
- Added DEFENSIVE GAME LOOPS section

**Estimated Confidence Score**: 8/10 - High confidence due to additive nature and clear patterns to follow.
