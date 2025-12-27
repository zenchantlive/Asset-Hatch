# Building Asset Hatch: An AI-Assisted Development Journey

A technical blog series documenting the complete development of Asset Hatch, from initial concept to production-ready AI-powered asset generation tool, built in 3 days using Claude Code and autonomous AI agents.

## Series Overview

This series chronicles the real, unfiltered journey of building a production Next.js application with AI assistance. It's not a tutorial—it's a technical diary showing what actually happened: the wins, the failures, the 3 AM debugging sessions, and the architectural pivots that made the difference between shipping and stalling.

**What you'll learn:**
- How to architect AI-first applications with tool-calling agents
- Prompt engineering strategies that make AI agents proactive, not reactive
- When to pivot frameworks (and how to do it in 3 hours)
- Hybrid persistence patterns for Next.js applications
- Test-driven development with AI assistance
- Real-world tradeoffs between speed and perfection in bootstrap projects

## The Project

**Asset Hatch** is an AI-powered game asset creation studio that solves the visual consistency problem in AI-generated game art. It provides a conversational interface where users describe their game, and an AI agent builds a complete, visually cohesive asset package ready for integration into any game engine.

**Tech Stack:**
- Next.js 16.1.1 (App Router, Turbopack)
- TypeScript 5+ (strict mode)
- Vercel AI SDK v6 (after pivoting from CopilotKit)
- OpenRouter + Gemini 3 Pro / Flux.2
- Hybrid Persistence (Prisma/SQLite + Dexie/IndexedDB)
- shadcn/ui + Tailwind CSS

**Timeline:**
- Started: December 24, 2025
- Current Status: ~75% complete (Planning + Style phases done)
- Development Approach: Solo founder, AI-first, ship fast

## Reading Order

### [Part 1: Genesis - Why Build This?](01-genesis-the-vision.md)
*7 min read* • **The Vision**

The consistency problem in AI-generated game art, why existing tools fail, and the bet on AI-first development. Includes the original product vision and architectural decisions that shaped everything.

**Key Topics:** Problem definition • AI coding agents' limitations • Open source from day one • Bootstrap constraints

---

### [Part 2: First Contact - Building with AI](02-first-contact-building-with-ai.md)
*9 min read* • **Initial Architecture**

From `npx create-next-app` to working chat interface in 24 hours. The slice-based development approach, why I chose CopilotKit (spoiler: this doesn't age well), and the cosmic UI redesign.

**Key Topics:** Slice-driven development • CopilotKit integration • Chat interface • Memory system • Glassmorphism theme

**Commits Referenced:** `eb75c74`, `bb7458e`, `11001d7`, `cfe3cf1`

---

### [Part 3: The Crisis - When Frameworks Fail](03-the-crisis-when-frameworks-fail.md)
*8 min read* • **The Breaking Point**

`message.isResultMessage is not a function` — how a single bug in CopilotKit v1.50.1 blocked everything, 4 hours of debugging hell, and the moment I realized I had to pivot or quit.

**Key Topics:** Framework lock-in risks • Debugging strategies • When to pivot • Sunk cost fallacy • Decision-making under pressure

**Commits Referenced:** `c59879c`, `b7c72f3` (blocked implementations)

---

### [Part 4: The Pivot - 3 Hours to Salvation](04-the-pivot-vercel-ai-sdk.md)
*11 min read* • **The Migration**

Ripping out CopilotKit and migrating to Vercel AI SDK v6 in a single afternoon. What worked, what didn't, and why this migration taught me more about AI SDK design than months of tutorials could have.

**Key Topics:** Migration strategy • Vercel AI SDK v6 • Tool schemas with Zod • `streamText` API • Proactive AI agents • What I learned

**Commits Referenced:** ADR-005, `5c5c305`, `6fbfd99`

**Code Examples:** Tool definitions, message handling, system prompts

---

### [Part 5: The Architecture - Hybrid Persistence](05-the-architecture-hybrid-persistence.md)
*10 min read* • **Data Layer Design**

Why I needed both client-side (Dexie) and server-side (Prisma) persistence, how to sync them without losing your mind, and the IndexedDB polyfill hack that saved API routes from crashing.

**Key Topics:** Hybrid persistence patterns • Dexie vs Prisma • Server-side data access • fake-indexeddb polyfill • Dual-write strategies

**Commits Referenced:** ADR-007, `0308291`, `b88f335`

**Architectural Diagrams:** Data flow, sync patterns, trade-offs

---

### [Part 6: Productionization - Tests & Infrastructure](06-productionization-tests-infrastructure.md)
*12 min read* • **Making It Real**

From prototype to production: integration tests for all API routes, generation infrastructure with Flux.2, prompt engineering science, and the multi-mode UI that keeps users in flow.

**Key Topics:** Jest + Next.js 16 • API integration tests • Prompt templates • Style anchor system • Plan parser • Image utilities

**Commits Referenced:** `a4846e7`, `bb2833b`, `f401d5a`, `0345fda`

**Code Examples:** Test patterns, prompt builders, image processing

---

### [Part 7: Reflections - What I Learned](07-reflections-lessons-learned.md)
*9 min read* • **Meta-Lessons**

Honest retrospective on AI-assisted development: what worked better than expected, what didn't, architectural decisions I'd change, and advice for anyone building with AI agents in 2025.

**Key Topics:** AI-first development reality • Prompt engineering evolution • Framework selection criteria • Solo founder velocity • Ship fast philosophy

**Wisdom Earned:** 7 hard lessons from 3 days of intense building

---

## Document Statistics

```
Total Posts: 7
Total Words: ~14,500 words
Total Reading Time: ~66 minutes
Code Examples: 25+
Commit References: 30+
Architectural Decisions: 7 ADRs
```

## Reading Time Investment

- **Quick overview:** Read Part 1, 4, 7 (~27 min) - Get the story arc
- **Technical deep dive:** Read all posts in order (~66 min) - Full journey
- **Specific topics:** Use topic tags to jump to relevant sections

## For Different Audiences

**AI Engineers / Prompt Engineers:**
→ Focus on: Parts 2, 4, 6 (Tool design, prompt engineering, SDK usage)

**Full-Stack Developers:**
→ Read all (Architecture, persistence, testing, deployment)

**Solo Founders / Bootstrap Builders:**
→ Focus on: Parts 1, 3, 7 (Vision, pivoting, lessons learned)

**Framework Evaluators:**
→ Focus on: Parts 3, 4, 5 (CopilotKit vs Vercel AI SDK comparison)

**Game Developers (Users):**
→ Focus on: Part 1, 6 (Problem, solution, how generation works)

---

## Project Links

- **Repository:** [github.com/zenchantlive/Asset-Hatch](https://github.com/zenchantlive/Asset-Hatch) (private, opening soon)
- **Documentation:** `/asset-hatch-docs/` - Complete specs (9 documents, 65K words)
- **Architecture Decisions:** `/memory/adr/` - All ADRs with rationale
- **Memory System:** `/memory/` - Agent context files

---

## About the Author

**Solo founder building in public** (well, semi-public—it's private repo for now, but open source is the plan).

I'm using AI agents (Claude Code, primarily) to build Asset Hatch as both a product and a portfolio piece demonstrating production-quality AI-assisted development. This blog series is the technical companion to that journey.

**Contact:** jordanlive121@gmail.com
**Philosophy:** Ship fast, learn faster, document everything

---

## Series Updates

- **Part 1-7:** Published December 27, 2025 (reflecting on Dec 24-26 development)
- **Part 8+:** Future posts will cover Generation Phase completion, Export, and deployment

---

## Why Read This?

If you're building with AI agents in 2025, you need to know:
- ✅ What AI can **actually** do (vs marketing hype)
- ✅ How to structure prompts that make agents **proactive**
- ✅ When frameworks are **helping** vs **hurting**
- ✅ What **hybrid persistence** looks like in practice
- ✅ How to **ship fast** without accumulating fatal technical debt

This series shows all of that through real code, real commits, and real mistakes.

No fluff. No hand-waving. Just what happened and why it matters.

---

**Let's build.**
