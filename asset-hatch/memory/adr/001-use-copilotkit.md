# ADR-001: Use CopilotKit for AI Chat Integration

**Status:** Superseded by ADR-005  
**Date:** 2025-12-24  
**Superseded:** 2025-12-26  
**Deciders:** User + Claude

---

## Context

Need to integrate AI chat functionality for the Planning Interface. The AI assistant helps users plan game assets through conversation.

**Requirements:**
- Streaming AI responses (not request/response)
- React integration (hooks-based)
- Ability to use custom LLM providers (OpenRouter, not just OpenAI)
- Minimal boilerplate

**Options considered:**
1. Raw OpenAI SDK (direct API calls)
2. LangChain.js (full-featured LLM framework)
3. CopilotKit (React-first AI framework)
4. Custom streaming implementation

---

## Decision

We will use **CopilotKit v1.50** with headless mode (`useCopilotChatHeadless_c` hook).

**Rationale:**
- React-native integration (hooks, not imperative)
- Headless mode gives full UI control (no opinionated components)
- Supports custom LLM providers via OpenRouter
- Handles streaming, context management, tool calling out-of-the-box
- Active development, good documentation

**Implementation:**
- `useCopilotChatHeadless_c` hook in ChatInterface component
- Custom API route: `/app/api/copilotkit/route.ts`
- OpenRouter integration via OpenAIAdapter

---

## Consequences

### Positive
* **Less boilerplate:** No manual streaming, message state management
* **Tool support:** Future slices can use `useCopilotAction` for AI tools
* **Context management:** `useCopilotReadable` for sharing app state with AI
* **Maintained:** Active community, regular updates

### Negative
* **Dependency:** Locked into CopilotKit API (harder to switch later)
* **Learning curve:** New framework to learn (though well-documented)
* **Bundle size:** Adds ~50KB to client bundle
* **Version lock:** Using specific headless API (_c suffix)

### Trade-offs
* **Abstraction vs Control:** Gain convenience, lose low-level streaming control
* **Vendor lock-in:** CopilotKit-specific, but provides value worth the dependency

---

## Alternatives Considered

### Alternative 1: Raw OpenAI SDK
* **Pros:** Full control, no dependencies, minimal bundle size
* **Cons:** Manual streaming, message state, context management (100+ lines of boilerplate)
* **Why rejected:** Too much boilerplate for common use cases

### Alternative 2: LangChain.js
* **Pros:** Full-featured, supports many LLMs, rich ecosystem
* **Cons:** Heavy framework (200KB+), overkill for chat, less React-native
* **Why rejected:** Too heavyweight, not optimized for React

### Alternative 3: Custom Implementation
* **Pros:** Maximum control, minimal dependencies
* **Cons:** Reinventing the wheel, maintenance burden
* **Why rejected:** CopilotKit provides tested, maintained solution

---

## Implementation Notes

**Files:**
- `components/planning/ChatInterface.tsx` - Uses `useCopilotChatHeadless_c` hook
- `app/api/copilotkit/route.ts` - API route with OpenRouter integration
- `app/layout.tsx` - CopilotKitProvider wrapper

**Key patterns:**
- System prompt in `makeSystemMessage` (not provider config)
- `visibleMessages` for rendering, `appendMessage` for sending
- `isLoading` for showing thinking indicator

**Critical:** CopilotKit manages message state internally. Don't duplicate in React state.

---

## Review Schedule

Review after Slice 6 (when implementing CopilotKit tools for plan generation).

If tool integration is cumbersome, reconsider for Slice 9 (Generation phase).

---

## References

* [CopilotKit Docs](https://docs.copilotkit.ai/)
* [useCopilotChatHeadless_c API](https://docs.copilotkit.ai/reference/hooks/useCopilotChatHeadless_c)
* [OpenRouter Integration Guide](https://docs.copilotkit.ai/direct-to-llm/guides/self-hosting)
* File: `components/planning/ChatInterface.tsx:10-18`
