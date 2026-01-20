---
description: "Plan modern chat UX polish across planning + studio chats"
---

# Feature: Chat UX polish across all chats (Planning + Studio)

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Polish the chat experience across Planning, Studio, and Studio planning chats to match modern UX patterns inspired by Claude/Gemini/ChatGPT: clearer message hierarchy, message metadata (timestamps/status), a minimal action row (copy, quote, edit/resend), consistent prompt chips/quick actions, a pinned context strip (minimizable), a contextual quick-fix bar, and a soft fade-in for streaming text. The goal is to make conversations feel more controllable, readable, and “premium” without changing backend behavior.

## User Story

As a game creator
I want a modern, readable, and controllable chat experience
So that I can move faster, understand context at a glance, and iterate without friction

## Problem Statement

Current chats are functional but plain: no message metadata, no action row, limited quick actions (only in planning), no pinned context, and inconsistent UI between planning/studio chats. The experience falls short of modern chat UX patterns used in major AI products.

## Solution Statement

Introduce a shared message rendering layer with metadata and action affordances, and apply it across all chat surfaces. Add prompt chips consistently across Planning, Studio, and Studio planning contexts, plus a minimizable pinned context strip and a contextual quick-fix bar. Preserve existing data flow and streaming behavior while elevating UI polish with soft fade-in for streaming text.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Chat UI components, preset prompts, shared UI utilities, chat context display
**Dependencies**: Radix/shadcn components, `@ai-sdk/react` message parts

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/components/planning/ChatInterface.tsx:332` - message rendering + tool-chip rendering.
- `src/components/planning/ChatInterface.tsx:467` - input row and preset chips (planning + style).
- `src/components/studio/ChatPanel.tsx:268` - message rendering, loading state, input row.
- `src/components/studio/planning/GamePlanChat.tsx:121` - message rendering + input row.
- `src/components/ui/CompactChatInput.tsx:22` - mobile compact chat input (used in PlanPanel/StylePanel).
- `src/lib/preset-prompts.ts:38` - existing plan/style prompt chips (extend or mirror).
- `src/components/ui/dropdown-menu.tsx:59` - Radix dropdown used elsewhere; reuse pattern for message actions.
- `HATCH_STUDIOS_CHAT_UX_AND_RESILIENCE_PRD.md:34` - UX goals and scope for chat improvements.

### New Files to Create

- `src/components/chat/ChatMessageRow.tsx` - shared message rendering (bubble, metadata, actions, fade-in).
- `src/components/chat/ChatMessageActions.tsx` - action row (copy/quote/edit/regenerate).
- `src/components/chat/PromptChips.tsx` - reusable prompt chip row across chats.
- `src/components/chat/PinnedContext.tsx` - minimizable pinned context strip (game concept/qualities).
- `src/components/chat/QuickFixBar.tsx` - contextual quick-fix/action bar above input.
- `src/lib/chat/message-utils.ts` - helpers for extracting text/tool parts and timestamps.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
  - `useChat` message shape, stop/abort, and `messages` parts handling.
- https://ui.shadcn.com/docs/components/dropdown-menu
  - Message action overflow menu and accessible trigger patterns.

### Patterns to Follow

**Message Parts Extraction:**
- Extract text from `message.parts` with `type === 'text' | 'reasoning'` and strip `[REDACTED]`.
  - Example: `src/components/planning/ChatInterface.tsx:372`

**Tool Call Chips:**
- `tool-call` or `tool-*` parts become compact chips under assistant messages.
  - Example: `src/components/studio/ChatPanel.tsx:295`

**Preset Chips Style:**
- Small rounded chips with glass/aurora styling.
  - Example: `src/components/planning/ChatInterface.tsx:472`

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (shared UI utilities)

Define shared utilities/components so all chats render consistently without duplicating logic.

**Tasks:**
- Create `message-utils.ts` to parse `UIMessage.parts` and return:
  - `textContent`, `toolLabels`, `hasTextContent`, `hasToolCalls`.
  - `createdAt` timestamp extraction (use `message.createdAt` if present, fallback to `new Date()` only when needed).
- Create `ChatMessageRow` component to render:
  - metadata row (timestamp, status indicator, optional tool count),
  - tool chips + markdown content,
  - soft fade-in while streaming text.
- Create `ChatMessageActions` component:
  - actions: Copy, Quote, Edit & Resend (assistant + user as applicable),
  - use `DropdownMenu` for overflow on small screens.
- Create `PinnedContext` component:
  - minimizable strip showing game concept + key qualities (or projectContext summary),
  - independent per chat surface but uses same component.
- Create `QuickFixBar` component:
  - contextual action row above input (e.g., “Fix error”, “Summarize”, “Show changes”) based on tool calls / preview errors.

### Phase 2: Apply shared rendering to all chats

Replace inline rendering in each chat with shared components.

**Tasks:**
- Update `ChatInterface` to use `ChatMessageRow` + `ChatMessageActions`.
- Update `ChatPanel` to use shared components (preserve tool handling + storage).
- Update `GamePlanChat` to use shared components.
- Ensure tool chips and minimal thinking indicator remain intact (from Phase 1).

### Phase 3: Prompt chips and quick actions across all chats

Make prompt chips consistent in Planning + Studio chats.

**Tasks:**
- Introduce `PromptChips` component that accepts a preset list + `onSelect`.
- Extend `preset-prompts.ts` with a new `STUDIO_PRESETS` list (quick fixes, common requests).
- Render `PromptChips` in `ChatPanel` and `GamePlanChat` (and keep existing in `ChatInterface`).
- Add `QuickFixBar` above input for contextual actions (no slash commands).

### Phase 4: Input bar polish (desktop + mobile)

Align input UX with modern patterns.

**Tasks:**
- Add subtle status row above input (streaming/queued status if available).
- Add inline controls (e.g., attach placeholder) without functional changes.
- Update `CompactChatInput` to mirror desktop styling: glass background, send button glow, same disabled state behavior.

### Phase 5: Validation & QA

Manual verification across all chat surfaces.

**Tasks:**
- Verify message actions (copy/quote/edit/regenerate) across all chats.
- Verify tool chips still render and no tool-only messages are lost.
- Verify prompt chips work on all chats.
- Confirm mobile layouts remain usable in `PlanPanel` and `StylePanel`.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE src/lib/chat/message-utils.ts

- **IMPLEMENT**: `extractMessageParts(message: UIMessage)` returning `textContent`, `toolLabels`, and flags.
- **PATTERN**: `message.parts` parsing from `src/components/planning/ChatInterface.tsx:372`.
- **GOTCHA**: Support both `tool-call` and `tool-*` parts; remove `[REDACTED]` placeholders.
- **VALIDATE**: Manual console check on a tool-calling response (chips still render).

### CREATE src/components/chat/ChatMessageRow.tsx

- **IMPLEMENT**: Render messages with metadata row + tool chips + markdown + soft fade-in while streaming.
- **PATTERN**: Bubble styling from `src/components/planning/ChatInterface.tsx:421`.
- **GOTCHA**: If message has only tool parts, still render chips without empty bubble.
- **VALIDATE**: Manual: tool-only message shows chips; text-only message looks identical to current.

### CREATE src/components/chat/ChatMessageActions.tsx

- **IMPLEMENT**: Action row for assistant/user messages.
  - Copy: `navigator.clipboard.writeText(textContent)`.
  - Quote: insert blockquote into input (via callback).
  - Edit & resend: populate input with message text.
- **PATTERN**: Use `DropdownMenu` from `src/components/ui/dropdown-menu.tsx:59`.
- **GOTCHA**: Do not mutate `messages` array directly; actions operate through callbacks passed from chat components.
- **VALIDATE**: Manual: copy/quote/edit works; regenerate triggers a new request.

### CREATE src/components/chat/PromptChips.tsx

- **IMPLEMENT**: Render chip row with consistent glass/aurora styling.
- **PATTERN**: Chip UI from `src/components/planning/ChatInterface.tsx:472`.
- **GOTCHA**: Keep keyboard accessibility (button elements, not divs).
- **VALIDATE**: Manual: chip click fills input but does not auto-send.

### UPDATE src/components/planning/ChatInterface.tsx

- **IMPLEMENT**: Replace inline message rendering with `ChatMessageRow` + `ChatMessageActions`.
- **IMPLEMENT**: Replace inline presets row with `PromptChips`.
- **IMPLEMENT**: Add `PinnedContext` and `QuickFixBar` above input where appropriate.
- **PATTERN**: Use existing `getPresetsForMode` for planning/style.
- **GOTCHA**: Preserve `onToolCall` behavior, style anchor tool handling, and `sendMessage` body injection.
- **VALIDATE**: Manual: updateQuality tool shows chip, copy/quote/edit works, input behaves.

### UPDATE src/components/studio/ChatPanel.tsx

- **IMPLEMENT**: Swap message rendering to shared components.
- **IMPLEMENT**: Add `PromptChips` using new `STUDIO_PRESETS` list.
- **IMPLEMENT**: Add `PinnedContext` and `QuickFixBar` above input where appropriate.
- **PATTERN**: Loading/thinking indicator and stop button remain as is.
- **GOTCHA**: Ensure actions call `sendMessage` with correct `gameId`/`projectContext` body.
- **VALIDATE**: Manual: createFile tool shows chip; regenerate sends prior user prompt.

### UPDATE src/components/studio/planning/GamePlanChat.tsx

- **IMPLEMENT**: Use shared message rendering and `PromptChips`.
- **IMPLEMENT**: Add `PinnedContext` and `QuickFixBar` above input where appropriate.
- **PATTERN**: Keep `mode: 'planning'` body parameter.
- **VALIDATE**: Manual: updatePlan tool still updates preview and chips render.

### UPDATE src/lib/preset-prompts.ts

- **ADD**: `STUDIO_PRESETS` array for quick fixes (blank screen, camera, physics/colliders, lighting, controls, error details).
- **ADD**: helper to retrieve presets by mode or chat type (`getPresetsForMode` may need extension or new function).
- **GOTCHA**: Keep interfaces strict; no `any`/type assertions.
- **VALIDATE**: Manual: chips render for studio chat.

### UPDATE src/components/ui/CompactChatInput.tsx

- **IMPLEMENT**: Align styling and add optional trailing actions placeholder (no new behavior).
- **PATTERN**: Use glass/aurora theme similar to ChatInterface input.
- **VALIDATE**: Manual: mobile PlanPanel and StylePanel still usable.

---

## TESTING STRATEGY

### Manual Tests

- Planning chat: tool-call message shows chips, action row appears on hover or always visible.
- Studio chat: quote/edit actions work; quick-fix bar appears when relevant.
- Studio plan chat: quote action inserts quoted text into input.
- Mobile PlanPanel and StylePanel: compact input styling and send still work.

### Edge Cases

- Assistant message with only tool-call parts renders chips without empty text.
- Multiple tool calls in one message render multiple chips.
- Rapid streaming: fade-in and action row should not throw while status is `streaming`.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

- `bun run lint`
- `bun run typecheck`

### Level 4: Manual Validation

- Verify UI polish in Planning, Studio, and Studio planning chats.
- Verify prompt chips appear across all chats.
- Verify copy/quote/edit/regenerate actions work without errors.

---

## ACCEPTANCE CRITERIA

- [ ] Shared message rendering and action row across Planning, Studio, and Studio planning chats.
- [ ] Prompt chips visible in all chats with modern styling.
- [ ] Message metadata (timestamp/status) visible in each assistant/user bubble.
- [ ] Pinned context strip is visible and minimizable across all chats.
- [ ] Quick-fix bar appears contextually and only fills input (no auto-send).
- [ ] Tool-call chips still render and tool-only messages remain visible.
- [ ] Mobile compact input matches desktop polish and remains usable.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Manual validation passed
- [ ] Lint and typecheck clean

---

## NOTES

- Avoid introducing server-side persistence changes; keep all improvements client-side.
- Keep action handlers lightweight; prefer callbacks from each chat component to avoid coupling.
- Maintain existing glassmorphism and aurora theme; do not introduce new global styles without justification.
### CREATE src/components/chat/PinnedContext.tsx

- **IMPLEMENT**: Minimizable pinned context strip with a compact summary (game concept + key qualities or projectContext).
- **PATTERN**: Use glass/aurora theme; keep height compact and dismissible.
- **GOTCHA**: Must not overwrite or alter stored context; display-only.
- **VALIDATE**: Manual: toggle collapse/expand across all chat surfaces.

### CREATE src/components/chat/QuickFixBar.tsx

- **IMPLEMENT**: Contextual action bar above input (e.g., Fix error, Summarize, Show changes).
- **PATTERN**: Use chip/button styling similar to prompt chips, but distinct emphasis.
- **GOTCHA**: Actions should only populate input (no auto-send) to preserve user control.
- **VALIDATE**: Manual: clicking action fills input with expected prompt.
