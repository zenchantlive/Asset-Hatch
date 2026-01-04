---
title: "Part 2: First Contact - Building with AI"
series: "Building Asset Hatch with AI Agents"
part: 2
date: 2025-12-25
updated: 2025-12-27
tags: [AI, Next.js, CopilotKit, Chat Interface, UI Design, Memory System]
reading_time: "9 min"
status: published
---

# Part 2: First Contact - Building with AI

**Previously:** Decided to build Asset Hatch to solve the visual consistency problem in AI-generated game assets. Chose Next.js 15, CopilotKit, and OpenRouter. Committed to shipping in 6-8 weeks.

**Now:** Time to actually build something.

## The Slice Philosophy

Before writing any code, I made a critical decision about development methodology. I wasn't going to build "components." I was going to build **slices**.

### What's a Slice?

A slice is a **vertically integrated feature** that touches every layer of the stack:
- UI component
- API route
- Data persistence
- User interaction

**Not a slice:** "Build the ChatInterface component"
**A slice:** "User can send a message and see AI response"

After finishing the initial planning with Opus locally, I started a **new chat with Opus** specifically to determine the best coding methodology for the app. It weighed the options and chose **Vertical Slices**. LAter realizing the AI's tendency to focus only on the slices, I decided to use ADRs to guide the AI's behavior. Slices became too narrow for the AI to accurately implement the full stack without running into logic errors.

Before I relized this, I had it create the slice documents in `/asset-hatch-docs/slices/`:

![Vertical Slices Decision](asset-hatch-pics/Screenshot%202025-12-26%20002016.png)
*Initial prompts with Claude about building the app*

```
SLICE-00: Project runs (dev server, basic routing)
SLICE-01: Create and list projects
SLICE-02: Open project detail page
SLICE-03: Chat works (send message, get response)
SLICE-04: Quality tool (AI sets art_style, genre, etc.)
SLICE-05: Entity tool (AI adds assets to plan)
...
```

Each slice had:
- User story
- Acceptance criteria
- Files to create/modify
- Prompt for Claude Code

### Why Slices?

**Psychological:** Completing a slice feels like shipping. Completing a component feels like... making a component.

**Technical:** Slices force you to think about the entire flow. You can't build a beautiful chat UI that doesn't actually send messages.

**AI-assisted dev:** Claude Code is better at "make X work" than "build component Y." Slices give it a complete problem to solve.

## Day 1: Slice 00-02 (Infrastructure)

### Slice 00: Project Runs

```bash
commit eb75c74
Date: Dec 24, 2025

feat: Implement Slice 3 - Basic Chat Interface
```

Boring but necessary. Next.js 15 scaffold, Tailwind config, environment variables. The stuff everyone skips in blog posts but takes 2 hours in reality.

**Time:** 2 hours (fighting with Turbopack edge cases)

### Slice 01: Create and List Projects

First real feature. Users need to:
1. See a list of projects (empty state at first)
2. Click "New Project"
3. Enter name/description
4. See project appear in list

**IndexedDB Schema (Dexie):**

```typescript
// lib/db.ts
import Dexie, { Table } from 'dexie';

interface Project {
  id: string;
  name: string;
  description?: string;
  phase: 'planning' | 'style' | 'generating' | 'export';
  created_at: string;
  updated_at: string;

  // Quality parameters (set in planning phase)
  art_style?: string;
  base_resolution?: string;
  perspective?: string;
  game_genre?: string;
  theme?: string;
  mood?: string;
  color_palette?: string;
}

class AssetHatchDB extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super('AssetHatchDB');
    this.version(1).stores({
      projects: 'id, name, phase, created_at',
    });
  }
}

export const db = new AssetHatchDB();
```

**Why IndexedDB?**
- 50MB storage limit (enough for 2-3 projects with image compression)
- Instant reads/writes (no server latency)
- Works offline
- `useLiveQuery` hook for reactive UI updates

**Home Page:**

```typescript
// app/page.tsx
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export default function HomePage() {
  const projects = useLiveQuery(() =>
    db.projects.orderBy('created_at').reverse().toArray()
  );

  return (
    <div className="container py-8">
      <h1>Your Projects</h1>
      {projects?.map(p => (
        <ProjectCard key={p.id} project={p} />
      ))}
      <CreateProjectDialog />
    </div>
  );
}
```

**Result:** Can create projects, see them in a list, click to open. Slice complete.

**Time:** 3 hours (including fighting with Dexie TypeScript types)

### Slice 02: Open Project

Click project → Navigate to `/project/[id]/planning` → See placeholder planning page.

Not exciting, but necessary plumbing.

**Time:** 1 hour

**Day 1 Status:** 6 hours in. Have project management working. No AI yet.

## Day 2: Slice 03 (Chat Works)

This is where it gets real. Time to integrate CopilotKit and get chat working.

### CopilotKit Setup

I'd chosen CopilotKit because their marketing promised: "AI agents in 5 minutes." The docs looked clean. The examples looked easy.

Here's what that looked like:

```bash
bun add @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

**Step 1: Add provider to layout**

```typescript
// app/layout.tsx
import { CopilotKit } from '@copilotkit/react-core';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

**Step 2: Create API route**

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime, OpenAIAdapter } from '@copilotkit/runtime';

export async function POST(req: Request) {
  const runtime = new CopilotRuntime();

  const adapter = new OpenAIAdapter({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: 'google/gemini-3-pro-preview',
  });

  return runtime.streamHttpServerResponse(req, adapter);
}
```

**Step 3: Build chat interface**

```typescript
// components/planning/ChatInterface.tsx
'use client';

import { useCopilotChat } from '@copilotkit/react-core';

export function ChatInterface() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useCopilotChat();

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
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### First Message

```
Me: "I'm building a cozy farming game"

[Loading indicator...]

AI: "That sounds lovely! To help you plan assets for a cozy
     farming game, I'd like to understand a few things:

     1. What art style are you envisioning? Pixel art, low poly,
        hand-drawn, or something else?
     2. What perspective will the game use? Top-down, side-view,
        or isometric?
     3. Are you aiming for a specific mood or color palette?"
```

**IT WORKED.**

The dopamine hit of seeing that first AI response stream in was unreal.

### The Cosmic UI Redesign

The initial UI was... humble. To put it mildly. It started as a "white on grey, no CSS looking website".

![UI v1 - Early Design](asset-hatch-pics/Screenshot%202025-12-26%20002113.png)
*The first UI iteration - basic but functional*

We iterated through two more designs, trying to find the right vibe.

![UI Iterations](TODO: Insert Carousel/Grid of Intermediate UI Designs)

Finally, I spent 4 hours adhering to the final glassmorphism/aurora theme:

```typescript
// Cosmic gradient background
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
  {/* Aurora overlay */}
  <div className="aurora-effect opacity-30" />

  {/* Glassmorphic card */}
  <div className="backdrop-blur-xl bg-white/5 border border-white/10
                  rounded-2xl shadow-2xl">
    <ChatInterface />
  </div>
</div>
```

**Why the cosmic theme?**
- Differentiation (not another corporate blue SaaS)
- Emotional resonance (game dev is creative, playful)
- Portfolio piece (shows I can do more than Bootstrap defaults)

**Result:** Asset Hatch now had a visual identity. Dark, premium, slightly whimsical.

**Time:** 4 hours (worth it—first impressions matter)

**Commits:**
```
bb7458e - Implement Slice 3 - Basic Chat Interface
11001d7 - Refactor Planning Interface with glassmorphism/aurora theme
cfe3cf1 - Complete UI redesign and premium cosmic aesthetic refactor
```

## The Memory System

One problem with AI chat sessions: **they forget everything when you close the browser**.

We worked until Slice 3 with Sonnet 4, but the slice method wasn't working how I wanted. It was too narrow and didn't allow the AI to complete the logical gaps to reach the wireframes we'd created with Opus ";)".

So I formed a "Council" of **Sonnet 4, GPT-5.2, and Perplexity** to devise a better solution. Together, we designed the `/memory` and `/memory/adr` system.

![Memory System Design](asset-hatch-pics/Screenshot%202025-12-26%20002124.png)
*Designing the memory system with the AI council*

### Memory Files

Each project would have JSON "memory files" stored in IndexedDB:

```typescript
interface MemoryFile {
  id: string;
  project_id: string;
  file_name: string;  // e.g., "entities.json", "conversation_history.json"
  content: string;     // JSON or text content
  created_at: string;
}
```

**Three critical memory files:**

1. **project.json** - Quality parameters
```json
{
  "art_style": "Pixel Art",
  "base_resolution": "32x32",
  "perspective": "Top-down",
  "game_genre": "Farming Simulator",
  "theme": "Rural",
  "mood": "Cozy",
  "color_palette": "Warm Earth Tones"
}
```

2. **entities.json** - Asset plan (markdown)
```markdown
# Asset Plan for Cozy Farm

## Characters
- **Farmer** (Player)
  - Animations: idle, walk (4-direction), use_tool
  - Variants: tool-holding states

- **Chicken** (Livestock)
  - Animations: idle, walk, peck, sleep
```

3. **conversation_history.json** - Full chat log
```json
[
  { "role": "user", "content": "I'm building a cozy farming game", "timestamp": "..." },
  { "role": "assistant", "content": "That sounds lovely! To help you...", "timestamp": "..." }
]
```

### Why This Matters

When the user reopens the planning page:
1. Load conversation history → Repopulate chat UI
2. Load project.json → Send to AI as context
3. Load entities.json → Display current plan

**No amnesia. Full continuity.**

This would become critical later when implementing tool execution (spoiler: tools need to read/write these memory files).

## Day 2 Status: The Illusion of Progress

At the end of Day 2, I had:
- ✅ Beautiful cosmic UI
- ✅ Chat interface that sent/received messages
- ✅ Conversation persistence
- ✅ Memory system architecture

What I *thought* I had:
- A working planning interface

What I *actually* had:
- A chatbot that could *talk about* building plans but couldn't *execute* them

### The Problem Preview

```
Me: "Let's use pixel art with a top-down view"

AI: "Great choices! I'll update your project to use:
     - Art Style: Pixel Art
     - Perspective: Top-down

     [System: Calling updateQuality tool...]"

Me: [Checks quality dropdowns]
    [Nothing changed]

Me: "Did you update it?"

AI: "Yes, I called the updateQuality tool to set art_style to
     'Pixel Art' and perspective to 'Top-down'."

Me: [Checks database]
    [No updates]
```

**The AI was lying.** Not maliciously—it genuinely *thought* it was calling tools. But something was broken in CopilotKit's tool execution pipeline.

This bug would consume the next 48 hours of my life.

But I didn't know that yet. On the evening of December 25th, I pushed my cosmic UI redesign, feeling pretty good about progress.

---

## Technical Decisions Made

### [ADR-001](https://github.com/zenchantlive/Asset-Hatch/blob/main/src/memory/adr/001-use-copilotkit.md): Use CopilotKit for AI Integration

**Status:** Accepted (for now—superseded by ADR-005 in 24 hours)

**Rationale:**
- Promised "AI agents in 5 minutes"
- Built-in tool calling support
- Clean React hooks API
- OpenRouter compatibility

**Risks identified:**
- New framework (less mature than OpenAI SDK)
- Smaller community
- Unclear how tool execution actually works

**Decision:** Worth the risk for velocity gains.

(Narrator: It was not worth the risk.)

### [ADR-003](https://github.com/zenchantlive/Asset-Hatch/blob/main/src/memory/adr/003-glassmorphism-theme.md): Glassmorphism Theme

**Status:** Accepted

**Rationale:**
- Differentiates from corporate SaaS aesthetics
- Aligns with creative/gaming audience
- Portfolio-quality visual design

**Trade-offs:**
- 4 hours of dev time (could've been features)
- Accessibility concerns (low contrast in places)
- Might not age well aesthetically

**Decision:** Ship it. First impressions matter, and "just another Bootstrap app" isn't the vibe.

---

## What I Learned

**1. Slices > Components**
Initially, I thought vertically integrated features felt better and produced better code than building UI components in isolation. Turns out, asking the ai to create all the needded slies was ambiguous and it positioned the AI to only address the slices. This is where the ADRs come in. 

**2. Memory systems prevent AI amnesia**
Persistent context files are non-negotiable for conversational agents. Session storage isn't enough.

**3. UI polish has ROI**
4 hours on the cosmic theme felt indulgent, but it made the project feel "real." That psychological boost mattered.

**4. Framework honeymoon phase is dangerous**
CopilotKit's docs were beautiful. The examples worked perfectly. The actual integration? TBD. (Spoiler: Not great.)

---

## Coming Next

In [Part 3: The Crisis](03-the-crisis-when-frameworks-fail.md), everything breaks.

`message.isResultMessage is not a function` — the error that would force a complete architectural pivot and teach me more about AI SDK internals than I ever wanted to know.

**Preview:** 4 hours of debugging. 8 different attempted fixes. 1 GitHub issue revealing CopilotKit v1.50.1 is fundamentally broken. The decision to rip out everything and start over.

---

**Commit References:**
- `eb75c74` - Implement Slice 3 - Basic Chat Interface
- `bb7458e` - Implement Slice 3 - Basic Chat Interface
- `11001d7` - Refactor Planning Interface with glassmorphism/aurora theme
- `cfe3cf1` - Complete UI redesign and premium cosmic aesthetic refactor

**Tools Used:**
- Next.js 15.1.0, CopilotKit v1.50.1, Dexie v4.2.1, Tailwind CSS

**Code Examples:**
- `/app/layout.tsx` - CopilotKit provider setup
- `/app/api/copilotkit/route.ts` - API route configuration
- `/components/planning/ChatInterface.tsx` - Chat UI component
- `/lib/db.ts` - Dexie database schema

---

**Previous:** [← Part 1: Genesis](01-genesis-the-vision.md)
**Next:** [Part 3: The Crisis →](03-the-crisis-when-frameworks-fail.md)
