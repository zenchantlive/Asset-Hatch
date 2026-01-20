# Feature: Hatch Studios Chat UX Phase 1 (Visibility + Control)

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Add Phase 1 chat UX improvements for Hatch Studios and Planning chats: tool-call visibility via compact chips, a minimal non-blocking thinking indicator, and a stop/cancel control for streaming responses. These changes make tool activity transparent and give users control to halt streaming without losing context, while preserving existing chat storage patterns.

## User Story

As a game creator
I want to see when tools ran and stop the AI mid-stream
So that I can understand changes and regain control quickly

## Problem Statement

Current chat UIs only render text/reasoning parts and log tool calls in the console. Loading states are full bubbles, and there is no stop/abort control. This hides tool usage and leaves users stuck waiting for streaming responses.

## Solution Statement

Expose tool-call parts as compact chips in assistant messages, replace the big loading bubble with a subtle inline thinking indicator, and add a stop button wired to `useChat` streaming cancellation. Implement consistently across Planning chat, Studio chat, and Studio planning chat.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: Medium  
**Primary Systems Affected**: Chat UI components, Vercel AI SDK hook usage  
**Dependencies**: @ai-sdk/react `useChat` (stop/abort)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/components/planning/ChatInterface.tsx:83` - `useChat` hook usage, message rendering, loading state, input disable, tool handling.
- `src/components/planning/ChatInterface.tsx:268` - Message rendering logic; currently drops messages without text and logs parts.
- `src/components/studio/ChatPanel.tsx:42` - `useChat` hook usage, tool handling, message rendering, loading state.
- `src/components/studio/ChatPanel.tsx:259` - Loading state + input rendering pattern (no stop control).
- `src/components/studio/planning/GamePlanChat.tsx:35` - Studio planning chat uses same rendering patterns and loading state.
- `src/lib/storage/chat-storage.ts:1` - Studio chat storage; ensure no reset logic is mixed into Phase 1.
- `src/memory/AI_SDK_V6_GUIDE.md:161` - AI SDK v6 message parts, rendering patterns, and tool-call gotchas.

### New Files to Create

- None.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat  
  - Stop/abort API, status enums, and `useChat` return shape.
- `src/memory/AI_SDK_V6_GUIDE.md`  
  - Message parts extraction and tool-call format gotchas.

### Patterns to Follow

**Message Rendering:**  
- Extract text from `message.parts` with `type === 'text' | 'reasoning'`, remove `[REDACTED]`, and render markdown.  
  - Example: `src/components/planning/ChatInterface.tsx:288`

**Loading State Pattern:**  
- Use aurora-themed dots; do not block UI with full overlays.  
  - Example: `src/components/planning/ChatInterface.tsx:337`

**Tool Handling Pattern:**  
- Tool execution handled in `onToolCall`, logging for visibility.  
  - Example: `src/components/studio/ChatPanel.tsx:55`

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Define a shared rendering approach for tool-call chips and minimal thinking state that can be duplicated across chat components.

**Tasks:**
- Identify how tool-call parts are represented in `UIMessage.parts` for this project (`tool-call` vs `tool-*`).
- Define a compact chip style (Tailwind) that matches glassmorphism theme.
- Decide where to place the minimal thinking indicator (inline under latest assistant block or below the message list).

### Phase 2: Core Implementation

Add tool-call chips and minimal thinking indicator in all chat components.

**Tasks:**
- Render tool-call chips for assistant messages when tool-call parts exist.
- Ensure assistant messages with no text but tool-call parts still render chips.
- Replace the current loading bubble with a more compact inline indicator.

### Phase 3: Streaming Control

Add stop/cancel controls tied to `useChat` stop/abort.

**Tasks:**
- Wire `stop()` (or `abort()` if that is the correct API) from `useChat` to a new Stop button that appears while streaming.
- Ensure the input re-enables immediately after stop.
- Confirm consistent behavior across all chat components.

### Phase 4: Testing & Validation

Manual validation across Planning and Studio tabs for chip rendering, stop, and thinking state.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### UPDATE src/components/planning/ChatInterface.tsx

- **IMPLEMENT**: Extract tool-call parts from `message.parts` and render compact chips per tool under assistant messages.
- **PATTERN**: Message parts extraction at `src/components/planning/ChatInterface.tsx:288`.
- **GOTCHA**: Do not drop assistant messages with no text if tool-call parts exist; render chips-only bubble or a small chip row.
- **VALIDATE**: Manual: send a prompt that triggers `updateQuality` and verify chip shows without requiring console logs.

### UPDATE src/components/studio/ChatPanel.tsx

- **IMPLEMENT**: Mirror tool-call chip rendering and minimal thinking indicator used in Planning chat.
- **PATTERN**: Loading state block at `src/components/studio/ChatPanel.tsx:300`.
- **GOTCHA**: `toolCall` uses `args` in this file; tool-call parts may still use `toolName` in `message.parts`.
- **VALIDATE**: Manual: trigger `createFile` or `updateFile` and confirm chips appear.

### UPDATE src/components/studio/planning/GamePlanChat.tsx

- **IMPLEMENT**: Mirror chips and minimal thinking state for Studio planning chat.
- **PATTERN**: Message rendering at `src/components/studio/planning/GamePlanChat.tsx:142`.
- **VALIDATE**: Manual: prompt `updatePlan` and verify chips render on assistant message.

### UPDATE src/components/planning/ChatInterface.tsx

- **IMPLEMENT**: Add Stop button while streaming, wired to `useChat` stop/abort; keep send button disabled during streaming.
- **PATTERN**: `useChat` hook usage at `src/components/planning/ChatInterface.tsx:83`.
- **GOTCHA**: Confirm actual stop API name from `@ai-sdk/react` docs; avoid using nonexistent method.
- **VALIDATE**: Manual: start a long response, click Stop, ensure status resets and input re-enables.

### UPDATE src/components/studio/ChatPanel.tsx

- **IMPLEMENT**: Add Stop button while streaming, wired to `useChat` stop/abort.
- **PATTERN**: Input row at `src/components/studio/ChatPanel.tsx:273`.
- **VALIDATE**: Manual: start streaming, stop, and confirm preview still updates on future tool calls.

### UPDATE src/components/studio/planning/GamePlanChat.tsx

- **IMPLEMENT**: Add Stop button while streaming, wired to `useChat` stop/abort.
- **VALIDATE**: Manual: start streaming, stop, confirm input is enabled.

---

## TESTING STRATEGY

### Manual Tests

- Planning chat: prompt with `pixel art` → chip shows `updateQuality`.
- Studio chat: prompt to “create a player file” → chip shows `createFile`, preview still refreshes.
- Studio plan chat: prompt “draft the plan” → chip shows `updatePlan`.
- Streaming stop: start a long response and click Stop → status resets, input enabled.

### Edge Cases

- Assistant message contains only tool-call parts and no text.
- Multiple tool calls in one assistant message (render multiple chips).
- Stop clicked during tool execution (ensure UI state recovers).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

- `bun run lint`
- `bun run typecheck`

### Level 4: Manual Validation

- Verify chips and minimal thinking state in Planning, Studio, and Studio planning chat UIs.
- Verify Stop button cancels streaming in all chats.

---

## ACCEPTANCE CRITERIA

- [ ] Tool-call chips render in Planning, Studio, and Studio planning chats for assistant messages.
- [ ] Minimal inline thinking indicator replaces the full loading bubble.
- [ ] Stop/Cancel button halts streaming and re-enables input.
- [ ] Messages with only tool-call parts still render chip visibility.
- [ ] No regressions to tool execution or preview refresh.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Manual validation passed
- [ ] Lint and typecheck clean

---

## NOTES

- Keep stop behavior purely client-side; no API changes needed.
- Ensure chips are compact and visually consistent with glassmorphism.
- Do not add reset-chat logic in Phase 1 (Phase 2 scope).

