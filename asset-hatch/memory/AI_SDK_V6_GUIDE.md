# Vercel AI SDK v6 Implementation Guide

**Created:** 2025-12-26
**Purpose:** Document learnings from migrating to AI SDK v6 for future reference
**Project:** Asset Hatch - Planning Phase P1

---

## Overview

This guide documents the key differences, gotchas, and best practices discovered while implementing Vercel AI SDK v6 in a Next.js 16 + React 19 application with OpenRouter and TypeScript.

**Key Insight:** AI SDK v6 has significant breaking changes from v3/v4. The API is cleaner but requires understanding the new patterns.

---

## Package Structure

### Required Packages

```json
{
  "ai": "^6.0.3",                              // Core SDK (streamText, tool, etc.)
  "@ai-sdk/react": "^3.0.3",                   // React hooks (useChat, etc.)
  "@openrouter/ai-sdk-provider": "^1.5.4"      // OpenRouter provider
}
```

### Critical Understanding

- **`ai`** - Core package with `streamText`, `tool`, `convertToModelMessages`, etc.
- **`@ai-sdk/react`** - React hooks like `useChat` (SEPARATE from core)
- **Provider packages** - Model-specific providers (OpenRouter, OpenAI, Anthropic, etc.)

**⚠️ BREAKING CHANGE:** In v6, `useChat` is NOT in `ai/react` - it's in `@ai-sdk/react`

---

## API Route Implementation

### Basic Structure

```typescript
// app/api/chat/route.ts
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';

export const maxDuration = 30; // For streaming

export async function POST(req: NextRequest) {
  try {
    const { messages, ...context } = await req.json();

    // CRITICAL: Convert UIMessages to ModelMessages
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,  // Use converted messages
      system: `Your system prompt here...`,
      tools: {
        // Define tools here
      },
    });

    // CRITICAL: Use toUIMessageStreamResponse(), not toDataStreamResponse()
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Key Points

1. **`convertToModelMessages()`**
   - ⚠️ It's **async** - must `await` it!
   - Converts UIMessage format (with `parts`) to ModelMessage format (with `content`)
   - Required because frontend sends UIMessages, but `streamText` expects ModelMessages

2. **`toUIMessageStreamResponse()`**
   - ⚠️ NOT `toDataStreamResponse()` (that's v3/v4)
   - Returns SSE stream compatible with `useChat` on frontend
   - Handles all the streaming protocol automatically

3. **Context Passing**
   - Pass context via request body: `{ messages, qualities, projectId, etc. }`
   - Access in system prompt: `${JSON.stringify(qualities, null, 2)}`

---

## Tool Definition

### Structure

```typescript
import { tool } from 'ai';
import { z } from 'zod';

tools: {
  toolName: tool({
    description: 'Clear description for the AI',
    parameters: z.object({
      param1: z.string().describe('What this parameter is for'),
      param2: z.enum(['option1', 'option2']).describe('Valid options'),
    }),
    execute: async ({ param1, param2 }) => {
      // Server-side execution
      // Return value sent back to AI
      return { success: true, result: 'Something' };
    },
  }),
}
```

### Best Practices

- Use **Zod schemas** for type safety
- Add **`.describe()`** to parameters - AI reads these descriptions
- Keep **descriptions clear** - they guide the AI's tool usage
- Return **structured objects** - easier for AI to understand results
- Execute on **server-side** - tools run in API route, not client

### Example Tool

```typescript
updateQuality: tool({
  description: 'Update a quality parameter for the game asset project. Valid keys: art_style, base_resolution, perspective, game_genre, theme, mood, color_palette',
  parameters: z.object({
    qualityKey: z.enum([
      'art_style',
      'base_resolution',
      'perspective',
      'game_genre',
      'theme',
      'mood',
      'color_palette'
    ]).describe('The quality parameter to update'),
    value: z.string().min(1).describe('The new value for this quality parameter'),
  }),
  execute: async ({ qualityKey, value }) => {
    // Note: Client-side state update happens via onToolCall callback
    return {
      success: true,
      message: `Updated ${qualityKey} to "${value}"`,
      qualityKey,
      value,
    };
  },
}),
```

---

## Frontend Hook Usage

### Basic `useChat` Implementation

```typescript
'use client';

import { useChat } from '@ai-sdk/react';  // ⚠️ NOT from 'ai/react'
import { useState } from 'react';

export function ChatComponent({ context }) {
  const [input, setInput] = useState("");  // ⚠️ Manual state, not from hook

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    api: '/api/chat',
    body: context,  // Pass context to API
    onToolCall: ({ toolCall }) => {
      // Handle tool execution on client side if needed
      if (toolCall.toolName === 'updateQuality') {
        const { qualityKey, value } = toolCall.args;
        // Update local state
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });  // ⚠️ Use { text }, not { role, content }
      setInput("");
    }
  };

  const isLoading = status === 'in_progress';  // ⚠️ status, not isLoading boolean

  return (/* JSX */);
}
```

### Breaking Changes from v3/v4

| v3/v4 | v6 | Notes |
|-------|-----|-------|
| `ai/react` | `@ai-sdk/react` | Separate package |
| `input` from hook | Manual `useState` | Hook doesn't provide input state |
| `handleInputChange` from hook | Manual `onChange` | Hook doesn't provide input handler |
| `handleSubmit` from hook | Manual submit handler | Hook doesn't provide form handler |
| `isLoading` boolean | `status === 'in_progress'` | Status is enum, not boolean |
| `append({ role, content })` | `sendMessage({ text })` | Different signature |
| `message.content` | `message.parts` | Messages use parts array |

---

## Message Structure

### UIMessage Format (v6)

```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text' | 'reasoning' | 'tool-call' | 'file' | 'data';
    text?: string;        // For text/reasoning parts
    toolName?: string;    // For tool-call parts
    toolCallId?: string;
    args?: any;
    // ... other fields
  }>;
}
```

### Extracting Text from Messages

```typescript
// Extract text content from message parts
const textContent = message.parts
  ?.filter((part) => part.type === 'text' || part.type === 'reasoning')
  .map((part) => part.text)
  .join('') || '';
```

### Rendering Messages

```typescript
{messages.map((message, index) => {
  // Extract text from parts
  const textParts = message.parts?.filter((part) =>
    part.type === 'text' || part.type === 'reasoning'
  ) || [];
  const textContent = textParts.map((part) => part.text).join('');

  // Skip messages with no text
  if (!textContent && textParts.length === 0) return null;

  return (
    <div key={index} className={message.role === 'user' ? 'user' : 'assistant'}>
      <p>{textContent}</p>
    </div>
  );
})}
```

### Part Types to Handle

- **`text`** - Regular chat text
- **`reasoning`** - AI's thinking process (visible with some models)
- **`tool-call`** - Tool invocation (usually don't display directly)
- **`file`** - File attachments
- **`data`** - Custom data parts

---

## Common Gotchas & Solutions

### 1. "Module not found: Can't resolve 'ai/react'"

**Problem:** Trying to import from `ai/react`
**Solution:** Import from `@ai-sdk/react` instead

```typescript
// ❌ Wrong
import { useChat } from 'ai/react';

// ✅ Correct
import { useChat } from '@ai-sdk/react';
```

### 2. "Cannot read properties of undefined (reading 'trim')"

**Problem:** Trying to use `input` from `useChat` hook
**Solution:** Manage input state manually

```typescript
// ❌ Wrong
const { input, handleInputChange } = useChat();

// ✅ Correct
const [input, setInput] = useState("");
const { sendMessage } = useChat();
```

### 3. "result.toDataStreamResponse is not a function"

**Problem:** Using old v3/v4 API
**Solution:** Use `toUIMessageStreamResponse()`

```typescript
// ❌ Wrong
return result.toDataStreamResponse();

// ✅ Correct
return result.toUIMessageStreamResponse();
```

### 4. "Invalid input: expected array, received Promise"

**Problem:** Forgetting to await `convertToModelMessages()`
**Solution:** Always await it

```typescript
// ❌ Wrong
const modelMessages = convertToModelMessages(messages);

// ✅ Correct
const modelMessages = await convertToModelMessages(messages);
```

### 5. Empty AI responses (no text displays)

**Problem:** Not extracting text from message parts
**Solution:** Filter for 'text' and 'reasoning' parts

```typescript
// ❌ Wrong
<p>{message.content}</p>

// ✅ Correct
const text = message.parts
  ?.filter(p => p.type === 'text' || p.type === 'reasoning')
  .map(p => p.text)
  .join('');
<p>{text}</p>
```

### 6. "Invalid prompt: messages do not match ModelMessage[] schema"

**Problem:** Sending UIMessages directly to `streamText`
**Solution:** Convert first with `convertToModelMessages()`

```typescript
// ❌ Wrong
const result = streamText({ messages });

// ✅ Correct
const modelMessages = await convertToModelMessages(messages);
const result = streamText({ messages: modelMessages });
```

---

## Complete Working Example

### API Route

```typescript
// app/api/chat/route.ts
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, qualities } = await req.json();

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,
      system: `You are a helpful assistant for project ${projectId}.
Current qualities: ${JSON.stringify(qualities)}`,
      tools: {
        updateQuality: tool({
          description: 'Update a quality parameter',
          parameters: z.object({
            key: z.string(),
            value: z.string(),
          }),
          execute: async ({ key, value }) => ({
            success: true,
            updated: { key, value }
          }),
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Request failed' }),
      { status: 500 }
    );
  }
}
```

### Frontend Component

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export function Chat({ projectId, qualities, onQualityUpdate }) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    body: { projectId, qualities },
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === 'updateQuality') {
        const { key, value } = toolCall.args;
        onQualityUpdate(key, value);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status === 'in_progress';

  return (
    <div>
      {/* Messages */}
      {messages.map((msg, i) => {
        const text = msg.parts
          ?.filter(p => p.type === 'text' || p.type === 'reasoning')
          .map(p => p.text)
          .join('');

        return text ? (
          <div key={i} className={msg.role}>
            {text}
          </div>
        ) : null;
      })}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## OpenRouter Integration

### Provider Setup

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';

const result = streamText({
  model: openrouter('google/gemini-3-pro-preview'),
  // or
  model: openrouter('anthropic/claude-3.5-sonnet'),
  // or
  model: openrouter('openai/gpt-4-turbo'),
});
```

### Environment Variable

```bash
OPENROUTER_API_KEY=sk-or-v1-***
```

### Common Warning (Safe to Ignore)

```
AI SDK Warning (openrouter / google/gemini-3-pro-preview):
The feature "specificationVersion" is used in a compatibility mode.
Using v2 specification compatibility mode. Some features may not be available.
```

This is normal - OpenRouter uses v2 spec format. Features still work correctly.

---

## Best Practices

### 1. Type Safety

```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const ToolParams = z.object({
  field: z.string().min(1),
  value: z.number().positive(),
});

type ToolParams = z.infer<typeof ToolParams>;
```

### 2. Error Handling

```typescript
export async function POST(req: NextRequest) {
  try {
    // ... your code
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### 3. Loading States

```typescript
const { status } = useChat();

// Use status enum, not boolean
const isStreaming = status === 'in_progress';
const hasError = status === 'error';

// Show different UI based on status
{isStreaming && <LoadingSpinner />}
{hasError && <ErrorMessage />}
```

### 4. Debugging Messages

```typescript
// During development, log message structure
useEffect(() => {
  console.log('Messages:', messages.map(m => ({
    role: m.role,
    partTypes: m.parts?.map(p => p.type),
  })));
}, [messages]);
```

### 5. Tool Execution Feedback

```typescript
onToolCall: ({ toolCall }) => {
  console.log('Tool called:', toolCall.toolName, toolCall.args);

  // Execute and show feedback
  if (toolCall.toolName === 'updateQuality') {
    onQualityUpdate(toolCall.args.key, toolCall.args.value);
    toast.success('Quality updated!');
  }
}
```

---

## Migration Checklist

When migrating from another AI SDK or v3/v4:

- [ ] Install correct packages: `ai`, `@ai-sdk/react`, provider package
- [ ] Update imports: `@ai-sdk/react` not `ai/react`
- [ ] Add manual input state with `useState`
- [ ] Change `sendMessage({ text })` not `append({ role, content })`
- [ ] Use `status` enum not `isLoading` boolean
- [ ] Extract text from `message.parts`, not `message.content`
- [ ] Use `convertToModelMessages()` in API route (with await!)
- [ ] Return `toUIMessageStreamResponse()` not `toDataStreamResponse()`
- [ ] Update tool definitions to use `tool()` helper
- [ ] Test tool calling with `onToolCall` callback
- [ ] Handle both 'text' and 'reasoning' part types

---

## Resources

- **Official Docs:** https://sdk.vercel.ai/docs
- **OpenRouter Provider:** https://github.com/OpenRouterTeam/ai-sdk-provider
- **Examples:** https://github.com/vercel/ai/tree/main/examples
- **API Reference:** https://sdk.vercel.ai/docs/reference

---

## Summary

**Key Takeaways:**

1. AI SDK v6 is a **complete rewrite** - not backward compatible
2. React hooks are in **`@ai-sdk/react`**, not `ai/react`
3. Messages use **`parts` arrays**, not simple `content` strings
4. **Manual state management** required for input
5. Always **await `convertToModelMessages()`**
6. Use **`toUIMessageStreamResponse()`** for streaming
7. Extract text from **'text' AND 'reasoning'** parts
8. Tool definitions use **Zod schemas** for validation

**Migration Time:** ~2-3 hours if you understand these patterns upfront.

**Result:** Cleaner API, better type safety, more control, excellent documentation.

---

**Last Updated:** 2025-12-26
**Project:** Asset Hatch
**Maintained By:** Development Team
