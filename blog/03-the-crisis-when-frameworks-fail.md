---
title: "Part 3: The Crisis - When Frameworks Fail"
series: "Building Asset Hatch with AI Agents"
part: 3
date: 2025-12-26
updated: 2025-12-27
tags: [Debugging, Framework Lock-in, CopilotKit, Crisis Management, Decision Making]
reading_time: "8 min"
status: published
---

# Part 3: The Crisis - When Frameworks Fail

**Previously:** Built a beautiful chat interface with CopilotKit. Cosmic UI looking sharp. Memory system in place. Everything seems great.

**Now:** Nothing works and I'm 4 hours into debugging hell.

## The Morning After

December 26th, 8:47 AM. Coffee in hand. Ready to implement Slice 04: the `updateQuality` tool that lets the AI agent actually set project parameters.

Should be simple, right? CopilotKit's docs show:

```typescript
useCopilotAction({
  name: 'updateQuality',
  parameters: [
    { name: 'qualityKey', type: 'string' },
    { name: 'value', type: 'string' }
  ],
  handler: async ({ qualityKey, value }) => {
    // Update database
    // Return success message
  }
});
```

Clean API. Clear example. I implement it exactly as documented.

## Attempt #1: By The Book

```typescript
// hooks/usePlanningTools.ts
import { useCopilotAction } from '@copilotkit/react-core';
import { db } from '@/lib/db';

export function usePlanningTools(projectId: string) {
  useCopilotAction({
    name: 'updateQuality',
    description: 'Update a specific quality parameter for the project',
    parameters: [
      {
        name: 'qualityKey',
        type: 'string',
        description: 'The quality to update (art_style, perspective, etc.)',
        required: true,
      },
      {
        name: 'value',
        type: 'string',
        description: 'The new value to set',
        required: true,
      },
    ],
    handler: async ({ qualityKey, value }) => {
      await db.projects.update(projectId, {
        [qualityKey]: value,
        updated_at: new Date().toISOString(),
      });

      return `Successfully updated ${qualityKey} to "${value}"`;
    },
  });
}
```

I add it to the planning page:

```typescript
// app/project/[id]/planning/page.tsx
'use client';

export default function PlanningPage({ params }: { params: { id: string } }) {
  usePlanningTools(params.id);  // Register tools

  return (
    <div>
      <ChatInterface />
      {/* ... */}
    </div>
  );
}
```

**Test:**

```
Me: "Let's use pixel art style"

AI: "Great! I'll set the art style to Pixel Art."
    [Thinking...]
    "I've updated the art_style to 'Pixel Art'."
```

[Check database]

```sql
SELECT art_style FROM projects WHERE id = '...';
-- Result: NULL
```

**Nothing happened.**

## Attempt #2: Add Logging

Maybe the handler isn't being called? Add console.logs:

```typescript
handler: async ({ qualityKey, value }) => {
  console.log('🔧 updateQuality called:', { qualityKey, value });

  await db.projects.update(projectId, {
    [qualityKey]: value,
    updated_at: new Date().toISOString(),
  });

  console.log('✅ Database updated');
  return `Successfully updated ${qualityKey} to "${value}"`;
},
```

**Test again:**

```
Me: "Set perspective to top-down"

AI: [Response about updating perspective]
```

[Check console]

**No logs. Handler never ran.**

The AI was *saying* it called the tool, but the handler wasn't executing.

## Attempt #3: Check Message Logs

Maybe the tool call is happening but failing silently? Check CopilotKit's message stream:

```typescript
const { messages, appendMessage } = useCopilotChat();

console.log('Messages:', messages);
```

Output:

```javascript
[
  { role: 'user', content: 'Set perspective to top-down', ... },
  {
    role: 'assistant',
    content: 'I've updated the perspective...',
    isResultMessage: [Function], // ??? What is this?
  }
]
```

**Wait. `isResultMessage` is a function on the message object?**

That's weird. But the docs don't mention anything about it, so I ignore it.

**Mistake #1:** Ignoring weird framework behavior.

## Attempt #4: Try appendMessage API

Maybe I need to manually trigger tool execution? CopilotKit has an `appendMessage` function:

```typescript
const { appendMessage } = useCopilotChat();

// Manually append a tool call message?
appendMessage({
  role: 'assistant',
  content: '',
  toolCalls: [{
    id: 'call_1',
    type: 'function',
    function: {
      name: 'updateQuality',
      arguments: JSON.stringify({ qualityKey: 'art_style', value: 'Pixel Art' })
    }
  }]
});
```

**Browser console:**

```
TypeError: message.isResultMessage is not a function
    at processMessages (copilotkit/runtime/src/utils.ts:147)
    at streamHttpServerResponse (copilotkit/runtime/src/server.ts:89)
```

**THERE IT IS.**

The error I'd been dreading. The one that would consume my day.

## The Debugging Marathon

### Hour 1: Read CopilotKit Source

I clone the CopilotKit repo. Search for `isResultMessage`:

```typescript
// @copilotkit/runtime/src/utils.ts
function processMessages(messages: Message[]) {
  return messages.filter(msg => !msg.isResultMessage());
  //                                 ^^^^^^^^^^^^^^^^
  //                                 Assumes this exists and is a function
}
```

But in the client code, messages don't have this method. They're plain objects from the API.

**Framework bug confirmed.**

### Hour 2: Search GitHub Issues

Find Issue #465:

> **Title:** `appendMessage` causes "isResultMessage is not a function" error
>
> **Status:** Open
> **Labels:** bug, v1.50.x
> **Comments:** 14 people reporting same issue

PR #2260:

> **Title:** Migrate from `appendMessage` to `sendMessage`
>
> **Status:** Merged to main, not released
> **Description:** `appendMessage` deprecated, use `sendMessage` instead.
>                  Internal message format changed.

**Translation:** CopilotKit v1.50.1 is broken. The fix exists but isn't published yet.

### Hour 3: Try Downgrading

Maybe v1.49.0 works?

```bash
bun add @copilotkit/react-core@1.49.0 @copilotkit/runtime@1.49.0
```

**Result:** Different error. v1.49 doesn't have OpenRouter support.

### Hour 4: Try Pre-release

Maybe the fix is in beta?

```bash
bun add @copilotkit/react-core@next @copilotkit/runtime@next
```

**Result:** `next` tag doesn't exist. No beta channel.

## The Moment of Truth

It's now 1:15 PM. I've been debugging for 4+ hours. I have two choices:

**Option A: Wait for CopilotKit fix**
- Unknown timeline (could be days, could be weeks)
- Blocks all feature development
- Keeps me dependent on a framework with a small team

**Option B: Rip out CopilotKit, migrate to a different AI SDK**
- 2-3 hours of migration work (estimate)
- Back to working state by end of day
- Switch to more mature, actively maintained SDK

The sunk cost fallacy is screaming at me: "But you already spent 6 hours integrating CopilotKit! The cosmic UI is built around it! You'll have to rewrite everything!"

## The Decision Framework

When frameworks fail you, ask these questions:

### 1. Is this a configuration issue or a framework bug?

**Answer:** Framework bug. Verified in source code and GitHub issues.

### 2. Can I work around it?

**Answer:** No. Tool execution is core to the product. Can't ship without it.

### 3. Is a fix coming soon?

**Answer:** Unknown. Issue is open with no milestone. Could be days, could be weeks.

### 4. What's the migration cost?

**Answer:** Estimated 2-3 hours. All the UI can stay. Just swap the chat hook and API route.

### 5. What's the cost of waiting?

**Answer:** Entire project blocked. Can't work on any subsequent slices.

### 6. What's the opportunity cost?

**Answer:** If I migrate now, I'm back to building features today. If I wait, I waste days in limbo.

## The Pivot Decision

1:47 PM. I make the call.

**We're migrating to Vercel AI SDK.**

### Why Vercel AI SDK?

**Pros:**
- ✅ Industry standard (2M+ weekly npm downloads)
- ✅ Maintained by Vercel (fast bug fixes, active development)
- ✅ Official OpenRouter integration (`@openrouter/ai-sdk-provider`)
- ✅ Comprehensive docs (ai.sdk.dev, Academy courses, 50+ examples)
- ✅ Better type safety (Zod schemas for tools)
- ✅ Smaller bundle (95KB vs 180KB)
- ✅ Next.js 16 optimized

**Cons:**
- ❌ 2-3 hours of migration work
- ❌ Have to learn new API patterns
- ❌ Can't reuse CopilotKit-specific code
- ❌ Invalidates ADR-001 (previous architectural decision)

**Neutral:**
- Same capabilities (tool calling, streaming, context)
- Lower-level API (more control but more code)
- No pre-built UI components (but I built custom UI anyway)

## The Emotional Side

Making this decision *sucked*.

It felt like admitting failure. I'd chosen CopilotKit carefully. I'd defended that choice in documentation. I'd built around it.

But here's the thing about solo development: **ego is expensive.**

Stubbornness has a cost measured in days. Being "right" about your initial framework choice doesn't matter if you can't ship.

### The Mantra

I wrote this in my notes:

> "Ship fast, pivot faster. The only unforgivable mistake is staying stuck."

Then I started deleting code.

## What I Learned

**1. Framework lock-in is real**

Even "simple" integrations create dependency trees that make migration painful.

**2. Small teams = higher risk**

CopilotKit is built by a small team. One breaking bug can block their entire user base for weeks.

**3. GitHub Issues are underrated**

I should've checked Issues *before* choosing the framework, not after it broke.

**4. Community size matters**

Vercel AI SDK has 100x more users. More users = more eyes on bugs = faster fixes.

**5. Sunk cost is a trap**

4 hours of debugging is already lost. Don't lose 40 more hours to stubbornness.

**6. "By the book" fails when the book is wrong**

Following docs perfectly doesn't help when the framework has fundamental bugs.

## The Commit That Closed This Chapter

```bash
commit c59879c
Date: Dec 26, 2025 - 2:03 PM

chore: Add supporting files and configuration
# Last commit before migration begins
```

By 2:15 PM, I'd made the decision.

By 5:30 PM, the migration would be complete and tools would be working.

But that's a story for the next post.

---

## Technical Post-Mortem

### What Went Wrong

**Root Cause:** CopilotKit v1.50.1 has a bug where `appendMessage()` passes messages without the `isResultMessage()` method, but the runtime expects it.

**Contributing Factors:**
- Small framework team (slower response to bugs)
- No beta channel for testing pre-release fixes
- Deprecation handled poorly (new `sendMessage` API not fully working)

### Warning Signs I Missed

1. **"AI agents in 5 minutes"** — Too good to be true
2. **Small npm download count** — Less than 10K/week
3. **Recent major version bump** — v1.50 was only 2 weeks old
4. **Limited Stack Overflow presence** — Few answered questions

### What I'd Do Differently

1. **Check GitHub Issues before adoption** — Open issues count matters
2. **Build POC before full integration** — Test tool execution specifically
3. **Have migration plan from day one** — "If X breaks, we switch to Y"
4. **Prefer boring technology** — Established SDKs over promising new ones

---

## Coming Next

In [Part 4: The Pivot](04-the-pivot-vercel-ai-sdk.md), I execute the migration.

You'll see:
- The 3-hour migration process, step by step
- How Vercel AI SDK v6 actually works
- The moment tools finally executed
- What I learned about AI SDK architecture
- Why this crisis was the best thing that could've happened

**Spoiler:** By 5:30 PM, I had working tool execution. By 7:00 PM, I'd learned more about AI SDK internals than I would've in a month of "happy path" development.

Sometimes the best teachers are the frameworks that fail you.

---

**Commit References:**
- `c59879c` - Last commit before migration (supporting files)
- `b7c72f3` - Complete Planning Phase P1 implementation with CopilotKit (broken)

**Files That Would Be Deleted:**
- `/app/api/copilotkit/route.ts` - CopilotKit API route
- `/hooks/usePlanningTools.ts` - CopilotKit action hooks
- All imports from `@copilotkit/*`

**Debugging Tools Used:**
- Chrome DevTools Network tab (watch API calls)
- Console.log debugging (tool handler invocation)
- CopilotKit source code (GitHub)
- GitHub Issues search (find known bugs)

**Time Spent:**
- Debugging: 4+ hours
- Research/decision: 1 hour
- **Total sunk cost:** 5 hours

---

**Previous:** [← Part 2: First Contact](02-first-contact-building-with-ai.md)
**Next:** [Part 4: The Pivot →](04-the-pivot-vercel-ai-sdk.md)
