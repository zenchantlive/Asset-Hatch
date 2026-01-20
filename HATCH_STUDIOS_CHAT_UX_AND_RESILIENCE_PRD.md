# Product Requirements Document: Hatch Studios Chat UX & Preview Resilience

## 1. Executive Summary
Hatch Studios relies on chat as the primary control surface for planning, generation, and in-preview iteration. Today, the chat experience lacks modern affordances (tool visibility, quick actions) and recovery mechanisms (cancel, reset), while preview errors do not automatically route into fixes. This PRD defines a focused UX and resilience upgrade to make chat more transparent, controllable, and self-healing.

The scope covers four linked improvements: tool-call chips with a minimal thinking state, cancel/stop streaming, reset chat history without wiping context, and auto-fix prompts when preview runtime errors occur. Together, these changes reduce friction, prevent stuck states, and make error recovery feel automatic while keeping the user in control.

MVP goal: ship a cohesive chat control layer that visibly communicates tool activity, lets users intervene mid-stream, safely reset chat state, and routes preview errors into fix prompts without manual copy-paste.

## 2. Mission
Deliver a modern, resilient chat experience that feels fast, transparent, and recoverable while preserving shared project context.

Core principles:
- Chat is the control plane; its state must be observable and reversible.
- Recovery should be proactive but never destructive to project context.
- Minimal UI, maximal clarity: surface only the right signals.
- Maintain consistent behavior across Planning, Assets, and Studio chats.
- No silent failures: logs and visible UI states for key actions.

## 3. Target Users
Primary personas:
- Indie devs iterating on a Babylon.js prototype via natural language.
- Power users who want to queue and refine instructions quickly.
- Debug-focused users who need error details routed into fixes.

Technical comfort: mixed. Some are technical (reading stack traces), many are not. UX must translate errors into actionable prompts.

Key needs and pain points:
- Need to see what tools executed and why outcomes changed.
- Need to stop and adjust prompts mid-stream without losing context.
- Need to clear chat clutter without resetting the project.
- Need errors to be captured and fixed without manual copying.

## 4. MVP Scope

In Scope (✅):
- ✅ Tool-call chips surfaced in chat messages (Planning + Studio).
- ✅ Minimal thinking state (subtle inline status, animated but not intrusive).
- ✅ Stop/cancel streaming controls integrated with Vercel AI SDK.
- ✅ Reset chat history while preserving project context and assets.
- ✅ Auto-fix prompt injection when preview runtime errors occur.
- ✅ Consistent behavior across `ChatInterface` and `ChatPanel`.

Out of Scope (❌):
- ❌ Full chat redesign beyond chips/actions and states.
- ❌ Persisting chat history to server (still local storage/IndexedDB).
- ❌ Auto-apply fixes without user visibility.
- ❌ Multi-user presence or collaboration.

## 5. User Stories
1) As a user, I want to see when the AI used a tool, so I understand why the UI changed.
   - Example: A chip shows "updateQuality" after the AI updates art style.
2) As a user, I want to stop a response mid-stream, so I can refine my prompt without waiting.
   - Example: Click "Stop" to abort streaming and re-enable input.
3) As a user, I want to reset the chat thread, so I can start fresh without losing my project.
   - Example: Reset clears messages but preserves assets and project context.
4) As a user, I want preview errors to automatically generate fix prompts, so I can recover quickly.
   - Example: A runtime error triggers an auto-sent "fix" message with line info.
5) As a user, I want a clean thinking indicator, so I can tell the AI is working without a full-screen block.
   - Example: Small animated status under the latest assistant message.
6) As a developer, I want consistent behavior across chats, so maintenance is predictable.
   - Example: Shared logic for stop/reset and tool chips.

## 6. Core Architecture & Patterns
High-level approach:
- Use existing Vercel AI SDK hooks for streaming control (`stop`/`abort`).
- Parse tool-call parts already returned by `toUIMessageStreamResponse()` and render chips.
- Centralize chat reset logic per storage backend (localStorage for planning, IndexedDB for studio).
- Bridge Preview errors into ChatPanel by consuming `pendingFixRequest` from StudioProvider.

Directory focus:
- `src/components/planning/ChatInterface.tsx`
- `src/components/studio/ChatPanel.tsx`
- `src/components/studio/PreviewFrame.tsx`
- `src/components/studio/StudioProvider.tsx`
- `src/lib/storage/chat-storage.ts`

Patterns:
- No base64 or large blobs in tool responses.
- Tool-call parts are display-only; no extra tool invocations.
- Use clear emoji logging in API routes for any new server logging.

## 7. Tools/Features

1) Tool-call Chips
- Purpose: show tool calls (e.g., `updateQuality`, `updatePlan`, `createFile`).
- Behavior: display inline chips in assistant message when tool parts are present.
- UX: compact, readable, minimal footprint; hover for optional metadata.

2) Minimal Thinking State
- Purpose: indicate streaming/processing without blocking UX.
- Behavior: small inline state under the assistant message; animate subtly.
- UX: avoid large banners; preserve message list continuity.

3) Cancel/Stop Streaming
- Purpose: let users abort streaming without losing draft input.
- Behavior: `Stop` button appears while streaming; calls `stop/abort`, re-enable input.
- UX: clear confirmation via state change; no modal.

4) Reset Chat History (Preserve Context)
- Purpose: clear chat clutter without wiping project context, assets, or plans.
- Behavior: reset only messages and stored chat logs per backend.
- UX: action in chat header or menu; optional confirm for safety.

5) Auto-fix Preview Errors
- Purpose: route runtime errors into actionable fix prompts.
- Behavior: when `pendingFixRequest` is set, auto-send a fix prompt containing error message/line; then clear the request.
- UX: optionally auto-open chat; show a status chip "Auto-fix requested".

## 8. Technology Stack
Frontend:
- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui

AI:
- Vercel AI SDK v6 (`useChat`)
- OpenRouter (Gemini for chat/tools)

Storage:
- Planning chat: localStorage
- Studio chat: IndexedDB via `chat-storage`

## 9. Security & Configuration
Auth/authorization:
- No changes to auth model; chat UX is client-side.

Configuration:
- No new env vars required.

Security scope:
- In scope: prevent data loss by limiting reset to chat messages only.
- Out of scope: server-side audit logs or encryption of local chat history.

Deployment:
- No new build steps; client-side changes only.

## 10. API Specification
No new endpoints required. Chat behavior changes are client-side.

Optional future endpoint (out of scope):
- `POST /api/chat/reset` to sync resets across devices.

## 11. Success Criteria
MVP success is achieved when:
- ✅ Tool-call chips appear for tool executions in both chat UIs.
- ✅ Thinking state is minimal and non-blocking while streaming.
- ✅ Stop button cancels stream and restores input immediately.
- ✅ Reset clears chat history but preserves project context and assets.
- ✅ Preview errors trigger a fix prompt without manual copy-paste.

Quality indicators:
- No regression in streaming performance or message ordering.
- No accidental context loss after reset.
- Clear and discoverable controls with minimal UI clutter.

## 12. Implementation Phases

Phase 1: Chat Visibility & Control
- Goal: add tool-call chips, minimal thinking, and stop button.
- Deliverables:
  - ✅ Tool-call part parsing and chip UI (Planning + Studio).
  - ✅ Minimal thinking indicator during streaming.
  - ✅ Stop/abort wired to `useChat` in both chats.
- Validation:
  - Streaming can be stopped; input re-enables; chips appear on tool calls.
- Estimate: 2-3 days.

Phase 2: Reset Flow
- Goal: reset chat history safely.
- Deliverables:
  - ✅ Reset action in both chats.
  - ✅ Clear localStorage (planning) and IndexedDB chat storage (studio).
- Validation:
  - Messages cleared; project context and assets unchanged.
- Estimate: 1-2 days.

Phase 3: Auto-fix Preview Errors
- Goal: route preview errors into fix prompts.
- Deliverables:
  - ✅ Consume `pendingFixRequest` in ChatPanel.
  - ✅ Auto-send fix prompt with error details; clear pending state.
  - ✅ Optional auto-open chat toggle (if already in scope).
- Validation:
  - Trigger error in preview; chat auto-sends a fix message once.
- Estimate: 2-3 days.

## 13. Future Considerations
- Server-side chat history persistence and cross-device sync.
- Full chat redesign or rich message actions (copy/quote/regenerate).
- Error clustering and auto-fix suggestions based on known patterns.
- User-configurable auto-fix behavior and throttling.

## 14. Risks & Mitigations
1) Risk: Auto-fix sends repeated messages on rapid errors.
   - Mitigation: clear `pendingFixRequest` immediately after send; debounce error intake.
2) Risk: Stop/abort leaves UI in inconsistent state.
   - Mitigation: explicitly reset `isStreaming` flags and input disabled state.
3) Risk: Reset removes more than intended.
   - Mitigation: target only chat storage keys; do not touch project context files.
4) Risk: Tool-call chips add noise.
   - Mitigation: compact, collapsible chips; show only when tool calls exist.

## 15. Appendix
Related references:
- Trello cards:
  - Chat UI: tool-call chips + minimal thinking state
  - Chat cancel/stop streaming
  - Reset chat history without clearing project context
  - Auto-fix game preview errors
- Key files:
  - `src/components/planning/ChatInterface.tsx`
  - `src/components/studio/ChatPanel.tsx`
  - `src/components/studio/PreviewFrame.tsx`
  - `src/components/studio/StudioProvider.tsx`
  - `src/lib/storage/chat-storage.ts`
