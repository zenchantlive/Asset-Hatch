---
title: "Part 4: The Pivot - 3 Hours to Salvation"
series: "Building Asset Hatch with AI Agents"
part: 4
date: 2025-12-26
updated: 2025-12-27
tags: [Migration, Vercel AI SDK, Tool Calling, Zod, System Prompts, Lessons Learned]
reading_time: "11 min"
status: published
---

# Part 4: The Pivot - 3 Hours to Salvation

**Previously:** CopilotKit v1.50.1 is broken. Tool execution doesn't work. Spent 4 hours debugging. Made the decision to migrate to Vercel AI SDK.

**Now:** 2:15 PM. Coffee refilled. Let's rip this out and rebuild it properly.

## The Migration Checklist

Before deleting a single line, I wrote out the full migration plan:

```markdown
## Vercel AI SDK Migration Plan

### Phase 1: Research (30 min)
- [ ] Read ai.sdk.dev docs (streamText, tools, message handling)
- [ ] Find OpenRouter integration example
- [ ] Understand message format differences
- [ ] Check Next.js 16 compatibility

### Phase 2: Dependencies (15 min)
- [ ] Remove: @copilotkit/react-core, @copilotkit/react-ui, @copilotkit/runtime
- [ ] Install: ai, @ai-sdk/react, @openrouter/ai-sdk-provider
- [ ] Update: package.json, remove from layout provider

### Phase 3: API Route (45 min)
- [ ] Create /app/api/chat/route.ts
- [ ] Implement streamText with OpenRouter
- [ ] Convert 3 tools to Zod schemas
- [ ] Test with curl

### Phase 4: Client Hooks (45 min)
- [ ] Replace useCopilotChat with useChat
- [ ] Update ChatInterface component
- [ ] Handle message rendering (parts array)
- [ ] Implement tool call callbacks

### Phase 5: Testing (30 min)
- [ ] Send test messages
- [ ] Verify tool execution
- [ ] Check database updates
- [ ] Test conversation persistence

Total estimate: 3 hours 15 min
```

**Time tracking is critical for solo devs.** If this goes over 4 hours, something's wrong and I need to reassess.

## Phase 1: Research (2:15 PM - 2:52 PM)

### The Vercel AI SDK Architecture

Vercel AI SDK v6 has three main pieces:

**1. Core (`ai` package)**
```typescript
import { streamText, tool } from 'ai';
```
- `streamText()` - Server-side text generation with streaming
- `tool()` - Define tools with Zod schemas and execute functions
- `convertToModelMessages()` - Convert UI messages to model format

**2. React Hooks (`@ai-sdk/react` package)**
```typescript
import { useChat } from '@ai-sdk/react';
```
- `useChat()` - Client-side chat state management
- Handles: messages, input, submission, streaming, tool calls

**3. Provider Adapters (e.g., `@openrouter/ai-sdk-provider`)**
```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
```
- Official OpenRouter integration
- Handles API authentication, model selection, error handling

### Key Difference from CopilotKit

**CopilotKit:**
- Tools defined on client with `useCopilotAction`
- "Magic" registration via React hooks
- Server runtime handles execution mysteriously

**Vercel AI SDK:**
- Tools defined in API route with explicit Zod schemas
- Execution happens server-side in `tool.execute()`
- Client receives tool call via streaming response
- Clear, explicit data flow

**Translation:** More boilerplate, but I can actually see what's happening.

### Critical Discovery: AI SDK v6 Changes

The docs showed AI SDK v4 patterns. But I'm using v6 (released Nov 2025). Key changes:

**Message structure:**
```typescript
// v4: Simple content string
{role: 'user', content: 'Hello'}

// v6: Parts array
{
  role: 'user',
  content: [{ type: 'text', text: 'Hello' }]
}
```

**Tool definition:**
```typescript
// v4: parameters property
tool({
  parameters: z.object({...}),
  execute: async ({...}) => {...}
})

// v6: inputSchema property
tool({
  inputSchema: z.object({...}),
  execute: async ({...}) => {...}
})
```

**This is crucial.** Using v4 patterns with v6 would cause subtle bugs. I bookmarked the v6 migration guide.

**Time spent:** 37 minutes (under budget ✅)

## Phase 2: Dependencies (2:52 PM - 3:09 PM)

```bash
# Remove CopilotKit
bun remove @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime

# Install Vercel AI SDK v6
bun add ai@^6.0.3 @ai-sdk/react@^3.0.3 @openrouter/ai-sdk-provider@^1.5.4

# Add Zod (for tool schemas)
bun add zod@^4.2.1
```

**Remove CopilotKit provider from layout:**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* <CopilotKit runtimeUrl="/api/copilotkit"> */}
        {children}
        {/* </CopilotKit> */}
      </body>
    </html>
  );
}
```

No provider needed! Vercel AI SDK is provider-less. Each component connects directly to its API route.

**Time spent:** 17 minutes (under budget ✅)

## Phase 3: API Route (3:09 PM - 4:11 PM)

### Create /app/api/chat/route.ts

This is where the magic happens. The API route is the heart of the system.

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const maxDuration = 30; // Vercel serverless function timeout

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { messages, qualities, projectId } = await req.json();

    // Convert UI messages to model format
    // CRITICAL: This is async in v6!
    const modelMessages = await convertToModelMessages(messages);

    // Stream response with tools
    const result = streamText({
      model: openrouter('google/gemini-3-pro-preview'),
      messages: modelMessages,
      stopWhen: stepCountIs(10), // Prevent infinite tool loops
      system: `You are a proactive Game Design Agent...
               Current Project: ${projectId}
               Current Qualities: ${JSON.stringify(qualities, null, 2)}
               ...`, // Full system prompt

      tools: {
        updateQuality: tool({
          description: 'Update a specific quality parameter',
          inputSchema: z.object({
            qualityKey: z.enum([
              'art_style',
              'base_resolution',
              'perspective',
              'game_genre',
              'theme',
              'mood',
              'color_palette'
            ]),
            value: z.string().min(1),
          }),
          execute: async ({ qualityKey, value }) => {
            // This runs on the server!
            await db.projects.update(projectId, {
              [qualityKey]: value,
              updated_at: new Date().toISOString(),
            });

            return {
              success: true,
              message: `Updated ${qualityKey} to "${value}"`,
              qualityKey,
              value,
            };
          },
        }),

        updatePlan: tool({
          description: 'Update the asset plan markdown',
          inputSchema: z.object({
            planMarkdown: z.string().min(10),
          }),
          execute: async ({ planMarkdown }) => {
            await db.memoryFiles.upsert({
              project_id: projectId,
              file_name: 'entities.json',
              content: planMarkdown,
            });

            return { success: true, planMarkdown };
          },
        }),

        finalizePlan: tool({
          description: 'Mark planning phase complete',
          inputSchema: z.object({}), // No parameters
          execute: async () => {
            await db.projects.update(projectId, {
              phase: 'style',
              updated_at: new Date().toISOString(),
            });

            return { success: true, nextPhase: 'style' };
          },
        }),
      },
    });

    // Return streaming response
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[Chat API Error]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### What's Happening Here?

**1. Model Messages Conversion**
```typescript
const modelMessages = await convertToModelMessages(messages);
```

Client sends messages in UI format (with parts arrays). This converts them to model-specific format. **Critical:** It's async! Forgetting `await` caused 20 minutes of debugging.

**2. System Prompt with Context**
```typescript
system: `You are a proactive Game Design Agent...
         Current Qualities: ${JSON.stringify(qualities, null, 2)}`,
```

Every request includes current project state. The AI always knows what's been set so far.

**3. Tool Schemas with Zod**
```typescript
inputSchema: z.object({
  qualityKey: z.enum(['art_style', 'base_resolution', ...]),
  value: z.string().min(1),
}),
```

Type-safe parameters. The SDK validates inputs before execution. Invalid data = error, not silent failure.

**4. Server-Side Execution**
```typescript
execute: async ({ qualityKey, value }) => {
  await db.projects.update(projectId, { ... });
  return { success: true, ... };
},
```

Tools execute on the server. Full database access. No client-side security concerns.

**5. stopWhen: stepCountIs(10)**

Prevents infinite loops. If the AI calls tools 10 times in one turn, stop. This saved me from a runaway generation bill later.

### First Test (curl)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Set art style to pixel art"}],
    "qualities": {},
    "projectId": "test-123"
  }'
```

**Response:**

```
data: {"type":"text","content":"I'll "}
data: {"type":"text","content":"update "}
data: {"type":"text","content":"the art style"}
data: {"type":"tool-call","toolName":"updateQuality","args":{"qualityKey":"art_style","value":"Pixel Art"}}
data: {"type":"tool-result","toolName":"updateQuality","result":{"success":true}}
data: {"type":"text","content":" to Pixel Art."}
```

**IT WORKED.**

Tool execution visible in the stream. Database updated. Success returned.

**Time spent:** 62 minutes (over budget by 17 min, but working ✅)

## Phase 4: Client Hooks (4:11 PM - 5:02 PM)

### Replace useCopilotChat with useChat

```typescript
// components/planning/ChatInterface.tsx
'use client';

import { useChat } from '@ai-sdk/react';

export function ChatInterface({ projectId, qualities }: Props) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: '/api/chat',
    body: { // Send additional context
      projectId,
      qualities,
    },
    onToolCall: async ({ toolCall }) => {
      // Handle tool execution on client
      console.log('🔧 Tool called:', toolCall);

      if (toolCall.toolName === 'updateQuality') {
        const { qualityKey, value } = toolCall.input;
        // Update local state to reflect change immediately
        onQualityUpdate?.(qualityKey, value);
      }

      if (toolCall.toolName === 'updatePlan') {
        const { planMarkdown } = toolCall.input;
        onPlanUpdate?.(planMarkdown);
      }

      if (toolCall.toolName === 'finalizePlan') {
        // Navigate to next phase
        router.push(`/project/${projectId}/style`);
      }
    },
  });

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Describe your game..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### Rendering Messages with Parts

AI SDK v6 messages have a `parts` array:

```typescript
function Message({ message }) {
  // Extract text from all parts
  const text = message.parts
    ?.map(part => {
      if (part.type === 'text') return part.text;
      if (part.type === 'reasoning') return `[Thinking: ${part.text}]`;
      return '';
    })
    .join('') || '';

  return (
    <div className={`message ${message.role}`}>
      {text}
    </div>
  );
}
```

**Why parts?** Future-proofing. v6 supports images, files, tool calls, reasoning—all as different part types.

**Time spent:** 51 minutes (over budget by 6 min, but working ✅)

## Phase 5: Testing (5:02 PM - 5:31 PM)

### Test 1: Simple Message

```
Me: "Hello"

AI: "Hi! I'm here to help you plan game assets. What kind of
     game are you building?"
```

✅ **Chat works.**

### Test 2: Tool Execution

```
Me: "Let's make a pixel art platformer"

AI: [Thinking...]
    "Great! I'll set up your project with:
     - Art Style: Pixel Art
     - Genre: Platformer

     What perspective would you like? Side-view is common for
     platformers."

[Check console]
🔧 Tool called: {toolName: "updateQuality", input: {qualityKey: "art_style", value: "Pixel Art"}}
🔧 Tool called: {toolName: "updateQuality", input: {qualityKey: "game_genre", value: "Platformer"}}

[Check database]
SELECT art_style, game_genre FROM projects WHERE id = '...';
-- art_style: "Pixel Art"
-- game_genre: "Platformer"
```

✅ **Tools execute and database updates.**

### Test 3: Plan Building

```
Me: "Show me a plan"

AI: [Thinking...]
    "Here's a starting asset plan for your pixel art platformer..."

    [Calls updatePlan tool with full markdown]

[Right panel updates with formatted plan]
```

✅ **Plan preview works.**

### Test 4: Finalization

```
Me: "This looks perfect, let's use it"

AI: "Excellent! I'll finalize your plan."
    [Calls finalizePlan tool]
    "Your plan is saved. Moving to style anchoring..."

[Navigation triggers to /project/[id]/style]
```

✅ **Phase transition works.**

### The Moment

5:28 PM. All tests pass. Tools execute reliably. Database updates correctly. UI reflects changes.

**Asset Hatch has a working AI planning agent.**

After 4 hours of CopilotKit debugging hell, 3 hours of migration, and 1 crisis of confidence—**it finally works.**

I took a screenshot. Committed the code. Went outside for 10 minutes.

**Time spent:** 29 minutes (under budget ✅)

## What I Learned (The Hard Way)

### 1. AI SDK v6 is Different

Don't copy v4 examples. `inputSchema` not `parameters`. `await convertToModelMessages()` is critical.

### 2. System Prompts Matter

The AI is only as agentic as you make it. Compare:

**Weak:**
```typescript
system: "You are a helpful assistant."
```

**Strong:**
```typescript
system: `You are a PROACTIVE Game Design Agent.

DO NOT wait for permission. When the user implies a preference,
SET IT IMMEDIATELY using tools.

Example:
User: "I want pixel art"
You: [Call updateQuality IMMEDIATELY] then respond
NOT: "Great choice! Would you like me to set that?"
`
```

The second version produced 10x better results.

### 3. stopWhen is Essential

```typescript
stopWhen: stepCountIs(10)
```

Without this, I had cases where the AI got stuck in a loop:
```
Call updateQuality → Call updateQuality → Call updateQuality...
```

10 steps is generous but prevents runaway costs.

### 4. Server-Side Tools are Better

With CopilotKit, tools were client-side React hooks. With Vercel AI SDK, they're server-side functions.

**Benefits:**
- Full database access (no API roundtrip needed)
- Security (client can't bypass validation)
- Simpler state management (single source of truth)

### 5. Type Safety Catches Bugs Early

Zod schemas caught multiple bugs before they hit production:

```typescript
qualityKey: z.enum(['art_style', 'base_resolution', ...])
```

If the AI calls `updateQuality({qualityKey: 'invalid', ...})`, it fails immediately with a clear error.

### 6. Migration Took Exactly as Long as Estimated

**Estimate:** 3h 15min
**Actual:** 3h 16min

Why? Because I broke it into phases and tracked time actively. When Phase 3 went over by 17 minutes, I compressed Phase 4.

## The Commits

```bash
commit 5c5c305
Date: Dec 26, 2025 - 3:12 PM
Message: feat: Set up initial Next.js application with CopilotKit
         integration (before migration)

commit 6fbfd99
Date: Dec 26, 2025 - 5:31 PM
Message: feat: Complete AI SDK v6 migration with working tool execution

Files changed: 11
Insertions: 182
Deletions: 104
```

## [ADR-005](https://github.com/zenchantlive/Asset-Hatch/blob/main/src/memory/adr/005-replace-copilotkit-with-vercel-ai-sdk.md): Replace CopilotKit with Vercel AI SDK

**Status:** Accepted
**Date:** 2025-12-26
**Supersedes:** ADR-001

**Decision:** Replace CopilotKit v1.50.1 with Vercel AI SDK v6 due to blocking bug in tool execution.

**Rationale:**
- CopilotKit `appendMessage` bug with no ETA for fix
- Vercel AI SDK has 200x larger user base
- Better type safety with Zod
- More control over tool execution flow
- Future-proof (Vercel team maintains it actively)

**Trade-offs:**
- 3 hours of migration work
- More boilerplate code
- Had to learn new API patterns

**Result:** ✅ Complete success. Tool execution works reliably.

---

## Reflections

This crisis forced me to learn AI SDK architecture at a depth I never would have otherwise.

I now understand:
- How streaming responses actually work
- Why message conversion is necessary
- How tool calling flows from client → server → model → back
- The difference between UI messages and model messages
- Why type safety in tool schemas matters

**The best learning comes from fixing broken things.**

If CopilotKit had worked, I'd have treated it as magic. Because it broke, I had to understand the actual mechanics.

Sometimes the frameworks that fail you teach you the most.

---

## Coming Next

In [Part 5: The Architecture](05-the-architecture-hybrid-persistence.md), we hit another wall.

Turns out, you can't use Dexie (IndexedDB) in Next.js API routes. API routes run in Node.js. IndexedDB is browser-only.

When the `/api/generate` route tried to read style anchors from the database, it crashed hard.

The solution? **Hybrid persistence** — Prisma/SQLite for server, Dexie for client, sync between them.

But figuring that out took another debugging marathon and an IndexedDB polyfill hack that I'm both proud of and ashamed of.

---

**Commit References:**
- `5c5c305` - Initial Next.js with CopilotKit (pre-migration)
- `6fbfd99` - Complete AI SDK v6 migration with working tools

**Files Created:**
- `/app/api/chat/route.ts` - New Vercel AI SDK route
- `/memory/AI_SDK_V6_GUIDE.md` - Internal reference docs
- `/memory/adr/005-replace-copilotkit-with-vercel-ai-sdk.md` - Decision record

**Tools Used:**
- Vercel AI SDK v6.0.3
- @openrouter/ai-sdk-provider v1.5.4
- Zod v4.2.1

**Time Investment:**
- Research: 37 min
- Dependencies: 17 min
- API Route: 62 min
- Client Hooks: 51 min
- Testing: 29 min
- **Total:** 3h 16min

---

**Previous:** [← Part 3: The Crisis](03-the-crisis-when-frameworks-fail.md)
**Next:** [Part 5: The Architecture →](05-the-architecture-hybrid-persistence.md)
