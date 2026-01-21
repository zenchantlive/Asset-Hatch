# Feature: Studio quick-fix prompt presets (minimized + clear)

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Provide a minimized, discoverable quick-fix preset UI in the Studio ChatPanel that surfaces common game issues (blank screen, errors, camera, physics/colliders, controls, lighting). Presets should be concise, non-intrusive, and insert editable prompts into the input.

## User Story

As a solo game creator
I want quick-fix prompt chips in the Studio chat that are easy to find but not noisy
So that I can rapidly request common fixes without breaking my flow

## Problem Statement

Studio chat has preset prompts but the UI is not minimized and the preset list/presentation needs to be clarified and de-duplicated with existing quick-fix actions, per the card requirements.

## Solution Statement

Refine `STUDIO_PRESETS` to match the requested issue set and update the Studio ChatPanel to render them in a minimized-by-default container with a clear expand affordance. Align or dedupe with `QuickFixBar` so users see one consistent set of quick-fix prompts.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Studio chat UI, preset prompts
**Dependencies**: None (existing components)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/lib/preset-prompts.ts:193` - `STUDIO_PRESETS` definitions to update and align with new prompts
- `src/components/studio/ChatPanel.tsx:319` - Studio presets mapping and PromptChips rendering
- `src/components/chat/PromptChips.tsx:20` - PromptChips UI and styles
- `src/components/chat/QuickFixBar.tsx:19` - QuickFixBar container styling, potential dedupe
- `src/components/planning/ChatInterface.tsx:467` - Preset rendering pattern to mirror

### New Files to Create

- None expected (prefer extending existing components)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- None required (internal UI patterns only)

### Patterns to Follow

**Naming Conventions:** camelCase handlers; PascalCase components; avoid `any`/type assertions.

**Error Handling:** Avoid empty catches; log errors when interacting with storage (see ChatPanel).

**UI Pattern:** PromptChips + QuickFixBar placement at bottom of chat panels (see `src/components/planning/ChatInterface.tsx:643`).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Refine Studio preset definitions so they match the card requirements and provide user-editable placeholders.

**Tasks:**

- Update `STUDIO_PRESETS` labels and prompt strings to include the required issues.
- Ensure the error preset includes a placeholder for the user to paste error text (e.g. "Error: [paste error here]").

### Phase 2: Core Implementation

Add minimized-by-default UI for Studio presets in ChatPanel.

**Tasks:**

- Add local UI state for collapsed/expanded preset section in `ChatPanel`.
- Render a minimal "Quick fixes" pill/button when collapsed (include count and icon).
- Expand to show `PromptChips` when toggled, using existing PromptChips component styles.
- Ensure `onSelect` continues to populate the input.

### Phase 3: Integration

Deduplicate or align QuickFixBar actions with Studio presets.

**Tasks:**

- Decide whether QuickFixBar should reuse `STUDIO_PRESETS` (subset) or remain distinct.
- If reusing, map selected presets into `QuickFixAction` to avoid repeated prompts.
- Keep behavior consistent with Planning chat (QuickFixBar only after messages).

### Phase 4: Testing & Validation

**Tasks:**

- Manual verify presets appear on Studio chat with no messages and are minimized by default.
- Validate expanded view is accessible and chips insert prompt text into the input.
- Validate no duplicate "Fix blank screen" / "Explain errors" between presets and QuickFixBar.

---

## STEP-BY-STEP TASKS

### UPDATE `src/lib/preset-prompts.ts`

- **IMPLEMENT**: Adjust `STUDIO_PRESETS` prompts to include blank screen, error (with placeholder), camera, gravity/colliders, player controls, lighting.
- **PATTERN**: Mirror prompt clarity style used in planning presets (`PLAN_PRESETS`).
- **IMPORTS**: None expected.
- **GOTCHA**: Keep IDs stable if they are referenced elsewhere; update only labels/prompts unless required.
- **VALIDATE**: N/A (static data change).

### UPDATE `src/components/studio/ChatPanel.tsx`

- **IMPLEMENT**: Add minimized toggle UI around `PromptChips` for Studio presets.
- **PATTERN**: Use same placement as Planning ChatInterface (`PromptChips` above input, before `QuickFixBar`).
- **IMPORTS**: Add any icon from `lucide-react` if using a new toggle affordance.
- **GOTCHA**: Keep `!isLoading` gating behavior intact.
- **VALIDATE**: Manual UI check in Studio chat.

### UPDATE `src/components/chat/PromptChips.tsx` (if needed)

- **IMPLEMENT**: Optional props to support collapsed display or max visible items.
- **PATTERN**: Maintain existing styling with `cn()` and avoid extra wrappers.
- **IMPORTS**: Avoid new dependencies.
- **GOTCHA**: Preserve existing behavior for Planning and GamePlanChat usages.
- **VALIDATE**: Manual UI check in Planning/Studio chats.

### UPDATE `src/components/chat/QuickFixBar.tsx` or `src/components/studio/ChatPanel.tsx`

- **IMPLEMENT**: Align QuickFixBar actions with Studio presets to avoid duplicates.
- **PATTERN**: Use the existing `QuickFixAction` shape.
- **IMPORTS**: None expected.
- **GOTCHA**: Keep QuickFixBar visible only after messages exist.
- **VALIDATE**: Manual verification in Studio chat with messages.

---

## TESTING STRATEGY

### Unit Tests

- Optional: add a small unit test for `getStudioPresets()` if test coverage is expected for preset lists.

### Integration Tests

- None planned (UI only).

### Edge Cases

- Presets hidden while streaming (`status === 'streaming'`).
- Collapsed state persists only for session (no storage changes).
- Long prompt placeholder text should remain editable in the input.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

- `bun run lint`
- `bun run typecheck`

### Level 2: Unit Tests

- `bun run test -- --testPathPattern="preset"` (only if new tests are added)

### Level 3: Integration Tests

- N/A

### Level 4: Manual Validation

1. Start dev server: `cd src && bun dev`
2. Open a Studio game chat
3. Confirm presets are collapsed by default and discoverable
4. Expand presets and click each chip → input populated with prompt text
5. Send a message, confirm QuickFixBar appears without duplicate prompts

---

## ACCEPTANCE CRITERIA

- [ ] Studio presets cover blank screen, errors with placeholder, camera, gravity/colliders, controls, lighting
- [ ] Preset UI is minimized by default but clearly discoverable
- [ ] Clicking a preset chip inserts prompt text into the input
- [ ] QuickFixBar does not duplicate preset prompts
- [ ] Lint/typecheck pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] Lint/typecheck clean
- [ ] Manual testing confirms preset UX
- [ ] Acceptance criteria all met

---

## NOTES

Current code already maps `getStudioPresets()` in `ChatPanel` and renders `PromptChips`. The main gap is the minimized UX and deduping with `QuickFixBar` per card requirements.
