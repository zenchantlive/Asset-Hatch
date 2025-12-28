---
title: "Part 1: Genesis - Why Build This?"
series: "Building Asset Hatch with AI Agents"
part: 1
date: 2025-12-24
updated: 2025-12-27
tags: [AI, Product Vision, Game Development, Solo Founder, Open Source]
reading_time: "7 min"
status: published
---

# Part 1: Genesis - Why Build This?

**The Setup:** December 24, 2025, 10:47 AM. I'm staring at a terminal, about to run `npx create-next-app`, knowing I'm about to spend the next 72 hours building something that might be completely unnecessary.

But here's the thing about unnecessary projects: sometimes they're the most necessary of all.

## The Problem That Wouldn't Leave Me Alone

Let me set the scene. Over the past few months, I've been using Claude Code—Anthropic's official CLI for Claude—to build prototypes and experiment with ideas. It's incredible. You describe what you want, Claude writes the code, you iterate, and within hours you have a working application.

Except when you don't.

The breaking point always came at the same place: **visual assets**.

### The Pattern

Here's what would happen every single time:

```
Me: "Let's add some character sprites for the player"

Claude: "I can help you set up the sprite system. You'll need to:
         1. Create placeholder rectangles for now
         2. Find sprites from itch.io or OpenGameArt
         3. Download them and add them to /public/sprites/"

Me: "Can't you just generate them?"

Claude: "I can generate individual images, but they won't be
         consistent with each other. Each one will look different."
```

And that was it. Flow broken. Project stalled.

## Why This Happens

AI coding agents like Claude are phenomenal at generating code. They understand architecture, can refactor complex systems, write tests, and debug edge cases. But when it comes to game assets, they hit a wall.

**The consistency problem:**
- Generate a character facing left → looks great
- Generate the same character facing right → completely different art style
- Generate a walk animation → proportions don't match the idle sprite
- Generate a second character → uses a totally different color palette

This isn't a limitation of the AI's image generation capabilities—it's an architectural problem. Each generation happens in isolation. There's no **persistent visual context** that says "this project uses pixel art with a muted palette and characters with these proportions."

### The Deeper Issue

Game assets aren't just individual images. They're a **system**. A character isn't one sprite; it's:
- Idle animation (4 frames)
- Walk cycle (8 frames)
- Attack animation (6 frames)
- Multiple directions (north, south, east, west)
- Consistent proportions across all of them
- Matching color palette
- Same art style throughout

When you ask an AI coding agent to generate these, it treats each request independently. You end up with a Frankenstein's monster of visual styles that no amount of clever prompting can fix.

## The "Aha" Moment

I was reading through the Flux.2 Pro Prompting Handbook (yeah, I read image model documentation for fun—judge me) and stumbled on the section about reference images:

> "Flux.2 can use reference images to maintain style consistency across generations. Including a style anchor image in your request ensures all outputs match the aesthetic."

Wait. **Style anchor image.**

That was it. That was the missing piece.

### The Mental Model Shift

What if you separated the asset creation workflow into phases?

**Phase 1: Planning** — Describe your game, let an AI agent build a complete asset list
**Phase 2: Style Anchoring** — Upload (or generate) ONE reference image that defines the visual style
**Phase 3: Generation** — Generate ALL assets using that style anchor
**Phase 4: Export** — Package everything with manifest files for easy integration

Suddenly, the consistency problem had a solution: **persistent visual context across all generations**.

## Why Build It?

Legitimate question. Doesn't this already exist?

Short answer: No.
Longer answer: Sort of, but not really.

**Existing tools:**
- **General image generators** (Midjourney, DALL-E) — Great for one-offs, terrible for asset packs
- **Game asset marketplaces** (itch.io, Unity Asset Store) — Pre-made assets, not custom to your game
- **Pixel art tools** (Aseprite, Piskel) — Require artistic skill I don't have
- **AI art tools** (Leonardo.ai, Scenario) — No project memory, no agent integration

What didn't exist was a tool that:
1. **Understood games** — Knows what a sprite sheet is, how tilesets work
2. **Maintained consistency** — Style anchors, character registries, color palettes
3. **Worked conversationally** — Natural language, not complex forms
4. **Exported for AI agents** — Manifest files that Claude Code can actually use

## The Constraints

I'm a solo developer with a full-time job. I don't have months. I don't have funding. I don't have a team.

What I do have:
- Claude Code (ironic, given the problem I'm solving)
- 3-4 hours per evening
- A stubbornness about shipping things

**Constraint #1: Speed over perfection**
MVP in 6-8 weeks or it doesn't happen. No gold-plating, no "nice to haves."

**Constraint #2: Open source from day one**
If I'm solving my own problem, others have it too. Public repo, MIT license, community-driven.

**Constraint #3: AI-first development**
Use Claude Code to build a tool for Claude Code users. Meta, but intentional.

**Constraint #4: Portfolio quality**
This needs to be good enough to show employers/investors. No sloppy code, no hacks that accumulate debt.

## The Tech Stack Decision

Here's what I landed on (after reading way too much documentation):

### Frontend
- **Next.js 15** — App Router, React Server Components, Turbopack
- **TypeScript** — Type safety is non-negotiable for solo dev
- **Tailwind + shadcn/ui** — Fast styling without CSS hell

### AI Integration
- **~~CopilotKit~~** — (This decision doesn't age well—stay tuned for Part 3)
- **OpenRouter** — Model aggregator (Gemini, Flux.2, GPT, Claude, etc.)
- **Gemini 3 Pro** — Planning agent (tool calling, fast, cheap)
- **Flux.2 Dev** — Image generation (best prompt adherence I've found)

### Data Layer
- **IndexedDB (Dexie)** — Client-side database, 50MB limit
- **Local storage first** — No server until absolutely necessary
- **Future: Vercel Postgres** — When scaling requires it

### Why These Choices?

**Next.js 15:** React Server Components + streaming feel like magic for AI responses. Also, Vercel makes deployment trivial.

**CopilotKit:** (Narrator: This was a mistake.) Promised "AI agents in 5 minutes" with tool calling built-in. Seemed perfect for conversational planning.

**OpenRouter:** One API for every model. When Flux.2 gets too expensive or Gemini hits rate limits, I can swap models without rewriting code.

**Dexie/IndexedDB:** Users can have 2-3 active projects (~15-30MB each with image compression). Local-first means instant loads, no server costs during development.

## The Original Vision

I sketched this out on a napkin (digital napkin, but still):

```
User: "I'm building a cozy farming game"
  ↓
Agent: "Great! I'll set up a farming simulator project.
        What art style? Pixel art, low poly, hand-drawn?"
  ↓
User: "Pixel art, top-down view"
  ↓
Agent: [Calls updateQuality tool]
       [Calls addEntityToPlan tool]
       "I've started your plan. Let's define characters.
        Do you want a male farmer, female, or both?"
  ↓
[Conversation continues...]
  ↓
Agent: [Calls markPlanComplete tool]
       "Your plan has 47 assets. Ready to set the style?"
  ↓
User: [Uploads reference image of pixel art style they like]
  ↓
System: [Analyzes image]
        [Extracts color palette]
        "Style locked. Generating 47 assets..."
  ↓
[20 minutes later]
  ↓
System: "Complete. Download asset-pack.zip"
```

**One conversation. One reference image. Complete, consistent asset pack.**

That was the dream.

## The Reality Check

Before writing a single line of code, I asked myself the hard questions:

**Q: Will anyone actually use this?**
A: I will. That's enough for v1. If it solves my problem, it probably solves others'.

**Q: Can you actually build this solo?**
A: With AI assistance and ruthless scope control, yes. 6-8 weeks is tight but doable.

**Q: What if Flux.2 isn't good enough for consistent sprites?**
A: Then we learn that in Week 4's validation gate. Fail fast, pivot if needed.

**Q: Why not just use existing tools?**
A: Because none of them solve the **system problem**—they generate images, not asset packs.

## The Commit That Started It All

```bash
commit eb75c74
Author: zenchantlive
Date: Tue Dec 24 2025

Initial commit from Create Next App
```

60 lines. Default Next.js boilerplate. Nothing special.

But every journey starts with `npm run dev`.

## What's Next

In [Part 2](02-first-contact-building-with-ai.md), we'll go from empty repo to working chat interface in 24 hours. You'll see:
- The slice-based development approach (ship features, not components)
- How I integrated CopilotKit (and why it seemed like a great idea at the time)
- The cosmic glassmorphism UI that became Asset Hatch's aesthetic
- The memory system that prevents AI session amnesia

But here's a preview: by the end of Day 2, I had a beautiful chat interface that couldn't actually execute tools. The AI would talk *about* updating the plan, but nothing would happen.

That bug would haunt me for the next 48 hours.

---

**Commit References:**
- `eb75c74` - Initial commit from Create Next App

**Files Created:**
- `/asset-hatch-docs/01-PRODUCT_OVERVIEW.md` - Original product vision
- `/asset-hatch-docs/README.md` - Complete specification index
- `/asset-hatch-docs/02-TECHNOLOGY_STACK.md` - Initial tech decisions

**Code:**
None yet. This was all planning and vision.

---

**Next:** [Part 2: First Contact - Building with AI →](02-first-contact-building-with-ai.md)
