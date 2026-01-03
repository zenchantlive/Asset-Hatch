# Building Asset Hatch: An AI-Assisted Development Journey

A technical blog series documenting the complete development of Asset Hatch, from initial concept to production-ready AI-powered asset generation tool, built in 9 days using Claude Code and autonomous AI agents. Now featuring a complete 16-part narrative covering the full lifecycle from SQLite prototyping to Neon Postgres scalability.

## Series Overview

This series chronicles the real, unfiltered journey of building a production Next.js application with AI assistance. It's not a tutorial—it's a technical diary showing what actually happened: the wins, the failures, the 3 AM debugging sessions, and the architectural pivots that made the difference between shipping and stalling.

**What you'll learn:**
- How to architect AI-first applications with tool-calling agents
- Prompt engineering strategies that make AI agents proactive, not reactive
- When to pivot frameworks (and how to do it in 3 hours)
- Hybrid persistence patterns for Next.js applications
- Test-driven development with AI assistance
- Real-world tradeoffs between speed and perfection in bootstrap projects
- Scaling from local SQLite to cloud-native Neon Postgres

## The Project

**Asset Hatch** is an AI-powered game asset creation studio that solves the visual consistency problem in AI-generated game art. It provides a conversational interface where users describe their game, and an AI agent builds a complete, visually cohesive asset package ready for integration into any game engine.

**Tech Stack:**
- Next.js 16.1.1 (App Router, Turbopack)
- TypeScript 5+ (strict mode)
- Vercel AI SDK v6
- OpenRouter + Gemini 3 Pro / Flux.2
- Infrastructure: Neon Postgres (Serverless) + Prisma 7
- Client Cache: Dexie.js (IndexedDB)
- UI: shadcn/ui + Tailwind CSS

**Timeline:**
- Started: December 24, 2025
- Current Status: 100% complete
- Development Approach: Solo founder, AI-first, ship fast, audit everything

## Reading Order

### [Part 1: Genesis - Why Build This?](01-genesis-the-vision.md)
The consistency problem in AI-generated game art and the architectural decisions that shaped everything.

---

### [Part 2: First Contact - Building with AI](02-first-contact-building-with-ai.md)
From `create-next-app` to working chat interface in 24 hours.

---

### [Part 3: The Crisis - When Frameworks Fail](03-the-crisis-when-frameworks-fail.md)
The moment I realized I had to pivot away from CopilotKit.

---

### [Part 4: The Pivot - 3 Hours to Salvation](04-the-pivot-vercel-ai-sdk.md)
Migrating to Vercel AI SDK v6 in a single afternoon.

---

### [Part 5: The Architecture - Hybrid Persistence](05-the-architecture-hybrid-persistence.md)
Designing the 4-layer state management system (URL → LocalStorage → Dexie → Prisma).

---

### [Part 6: Productionization - Tests & Infrastructure](06-productionization-tests-infrastructure.md)
Integration tests for all API routes and the Flux.2 generation pipeline.

---

### [Part 7: Hardening - Battle-Testing the API](07-hardening-battle-testing-the-api.md)
Real-world security: Auth.js, Zod validation, and race condition fixes.

---

### [Part 8: Completing the Cycle - Export Workflow](08-completing-the-cycle-export-workflow.md)
Implementing ZIP packaging and delivery of production-ready assets.

---

### [Part 9: v2.1 UI Overhaul - Embracing the Chaos](09-v2-1-ui-overhaul-chaos.md)
Redesigning the entire generation UI to handle complex batches and visual feedback.

---

### [Part 10: The Foundation - Models and Money](10-the-foundation-models-and-money.md)
OpenRouter integration, cost tracking, and model-swapping strategy.

---

### [Part 11: The Safety Net - Security and Singular Cats](11-the-safety-net-security-and-singular-cats.md)
Singularization logic, prompt safety, and the "Singular Cat" problem.

---

### [Part 12: The Third Dimension - Directions v3](12-the-third-dimension-directions-v3.md)
Overhauling the direction selection system with a 3x3 visual grid.

---

### [Part 13: The Great Migration - Neon and Prisma](13-the-great-migration-neon-and-prisma.md)
Transitioning from local SQLite to serverless Neon Postgres and Prisma 7.

---

### [Part 14: The Privacy Pivot - IndexedDB and BYOK](14-the-privacy-pivot-byok-and-browser-storage.md)
Decoupling the server: moving image storage to IndexedDB and adding BYOK support.

---

### [Part 15: The Mobile Pivot - Chat-First UX and Technical Debt](15-the-mobile-pivot-ux-redesign.md)
Pivoting from split-screen desktop layouts to a mobile-native "Chat-First" experience with sliding overlays.

---

### [Part 16: Reflections - What I Actually Learned](16-reflections-lessons-learned.md)
The final retrospective: 13 hard lessons from 9 days of AI-assisted building.

---

## Document Statistics

```
Total Posts: 16
Total Words: ~30,000 words
Total Reading Time: ~120 minutes
Code Examples: 55+
Architectural Decisions: 27 ADRs
```

## Why Read This?

If you're building with AI agents in 2026, you need to know:
- ✅ What AI can **actually** do (vs marketing hype)
- ✅ How to structure prompts that make agents **proactive**
- ✅ How to **ship fast** without accumulating fatal technical debt

No fluff. No hand-waving. Just what happened and why it matters.

**Let's build.**
