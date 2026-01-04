---
title: "Part 17: Reflections - What I Actually Learned"
series: "Building Asset Hatch with AI Agents"
part: 17
date: 2026-01-02
updated: 2026-01-04
tags: [Reflections, Lessons Learned, AI Development, Solo Founder, Best Practices, Collaboration]
reading_time: "15 min"
status: published
---

# Part 17: Reflections - What I Actually Learned

**The Journey:** 11 days. 130+ TypeScript files. 7 architectural crises. 3 complete framework/database migrations. A mobile-native, production-ready AI asset generator built from scratch.

**Now:** Time to extract the final lessons.

## What Actually Happened

Let's be honest about what "AI-first development" meant in practice:

**Not This:**
> "I described what I wanted and AI built it perfectly in minutes!"

**Actually This:**
> "I described what I wanted. AI generated 80% correct code. I debugged the other 20%. We iterated 3-5 times. The 6th attempt worked."

Building Asset Hatch wasn't "AI doing the work for me." It was a **continuous dialogue**. I steered; the AI executed. When it went off course, I pulled it back. When it got stuck in a loop, I broke the cycle with blunt feedback.

This is the story of that collaboration.

## The 13 Hard Lessons

### 1. AI is a 10x Boilerplate Generator, Not a 10x Architect
Single AIs excel at *implementation*. A **Council of AIs**, however, can excel at *architecture*. When I used the Sonnet / GPT / Gemini swarm, they successfully designed the Hybrid Persistence model that saved Part 5.

**My Decision:** I don't ask one AI to "design everything." I use three. One proposes, one critiques, one synthesizes. That's how I got the Prisma/Dexie layered model in the first place.

### 2. Framework Lock-in is More Dangerous with AI
AI velocity makes you more vulnerable to framework risk. When I committed to CopilotKit on Day 2, the AI had already built 15 files around it before I realized it was broken. The sunk cost felt enormous.

**My Decision:** I cut the cord after 4 hours of debugging a single `message.isResultMessage is not a function` error. The AI didn't want to give up (it kept trying "fixes"). I had to say: "Stop. We're pivoting to Vercel AI SDK." (RIP CopilotKit Phase).

### 3. Documentation Quality Determines AI Quality
AI is only as good as the docs it learned from. Vercel AI SDK has excellent docs; thus, it has excellent AI output. CopilotKit's docs were... aspirational.

**My Decision:** Before picking any library, I now ask: "Can I find a working example for this exact use case in less than 5 minutes?"

### 4. Tests Save You From AI Over-Confidence
AI doesn't know when it's wrong. It will confidently generate code that compiles but fails at runtime. 

**My Decision:** Write tests *immediately* after AI generates code. It's my reality check. On Dec 30th, the AI generated an export route that looked perfect. The test revealed we were calling `zipBlob` instead of `zipBuffer`. The AI fixed it in one iteration once I showed it the failing test.

### 5. Prompt Engineering Evolved Mid-Project
On Day 1, I said things like: "Make a chat interface." By Day 7, I was saying: "Update the `useChat` hook in `ChatInterface.tsx` to detect `tool-updateQuality` parts using `part.type.startsWith('tool-')` and call the `onQualityUpdate` callback with `part.result`."

**My Decision:** Specificity is AI leverage. Technical prompts (using hook names, part types, and CSS classes) get working code in 1 iteration instead of 5.

### 6. AI Doesn't Replace Judgment
I made the pivots. I designed the hybrid sync. I enforced the security audit. AI implemented those decisions brilliantly, but **I owned the vision**.

**My Decision:** Every time the AI asked "should I...?" I made the call. It's not autocomplete; it's a junior engineer who types faster than I do.

### 7. Speed Creates Space for Quality
AI compresses boilerplate to record time. This freed up *days* for the hard stuff: product decisions, UX polish, and iterative refinement. 

**My Decision:** Take the time saved by AI, then use the AI to iterate until it's exactly how I want, describing every last detail without bloating the context. 

### 8. The "First 5 Words" Rule (Flux.2)
Prompt engineering isn't just about what you say, but *where* you say it. Flux.2 is heavily weighted toward the beginning of the prompt.

**My Decision:** We learned to put the Subject in the first 5 words, or risk seeing beautiful lighting on a non-existent asset. "A glowing sword with..." beats "In a fantasy setting, a sword that glows...".

### 9. User Feedback Loops (The Blunt Variety)
On December 31st, I gave blunt, immediate feedback on the Direction UI. "This is disconnected," I said. Because AI speed is so high, we were able to pivot and rebuild a major UI component (the 3x3 Grid) in just 3 hours.

**My Decision:** Don't be polite with the AI. Say: "This doesn't work." Say: "I don't like this." The AI doesn't have feelings to hurt. Fast feedback + AI implementation = perfect UX fit.

### 10. State Management vs. Async Reality
React state and Database writes are async, but user intent is immediate. We hit a major "Asset not found" race condition on Day 7.

**My Decision:** We implemented the **"Pass Object Directly" pattern**. Don't ask the child to find their ID in a state that hasn't updated yet; just give the child the object. This is now documented in `system_patterns.md` as our standard approach.

### 11. The Memory System is Non-Negotiable
By Day 3, the AI was forgetting patterns we'd established on Day 1. Every new conversation started from zero.

**My Decision:** I asked Claude-OPpus-4.5 to design a comprehensive memory system. `CLAUDE.md`, `active_state.md`, `system_patterns.md`, `memory.md`, and subsequent ADRs. Every architectural decision, every "gotcha," every pattern goes into these files. Now, when the AI starts a new session, it *reads its own history*.

### 12. The "Mobile First" Realization
On Jan 2nd, we realized that our beautiful desktop layouts were unusable on mobile. We had to pivot from a split-screen model to a "Chat-First" architecture with slide-out overlays.

**My Decision:** Don't wait until the end of the project to test on mobile. AI can redesign a layout in 10 minutes, but it can't tell you if a button is too small for a human thumb. We built the `PlanPanel` and `StylePanel` system to solve this.

### 13. Today's Migration (Jan 1st): The Decouple Decision
We migrated from Turso/SQLite to Neon/Postgres. We moved all images to IndexedDB. We added BYOK API key support.

**My Decision:** I didn't want to be a "service." I wanted Asset Hatch to be a "tool." By pushing image blobs to the client and letting users provide their own OpenRouter keys, I turned a centralized app into a decentralized utility. The AI executed the migration; I designed the architecture.

### 14. The "Last 10%" Trap (Jan 4th)
We thought we were done on Jan 2nd. But the mobile UX was "crunchy" and the directional generation was inconsistent.

**My Decision:** We spent 48 hours on "Front-First" workflows and the Unified Action Bar. It felt like "extra" work, but it doubled the quality of the final product. Don't ship until the "crunchy" parts are smooth.

## Advice for AI-First Developers in 2026

### For Solo Founders

**Do:**
- ✅ Use AI for boilerplate and infrastructure.
- ✅ Pair AI with tests (it catches AI mistakes).
- ✅ Be technically specific in prompts.
- ✅ Use the "Pass Object Directly" pattern for race conditions.
- ✅ Build a memory system. Your AI is only as smart as its context.

**Don't:**
- ❌ Trust AI for architecture decisions. Use a council.
- ❌ Skip the research phase (GitHub Issues are your friend).
- ❌ Accept first output—iterate till it's production-ready.
- ❌ Be polite. Be blunt. Your time is worth it.

## The Final Reflection

Building Asset Hatch in 9 days wasn't about AI doing the work for me.

It was about **compressing the boring parts** into hours instead of days, so I could spend time on what matters: architecture, product decisions, UX, and consistency.

**The velocity was real:**
- 120+ TypeScript files
- ~28,000 lines of code
- 27+ ADRs (Architecture Decision Records)
- 100% Feature Completion (Planning → Style → Generation → Export)

AI didn't build Asset Hatch. **I built Asset Hatch with AI as my pair programmer.**

**Let's build.**

---

**Next:** [Part 18: BONUS - How AI Wrote This Blog](18-bonus-how-ai-wrote-this-blog.md)
**Previous:** [← Part 16: The Final Polish - UX Refinements and Front-First Workflow](16-the-final-polish-ux-refinements.md)
**Start:** [Part 1: Genesis →](01-genesis-the-vision.md)

---

- **Total Posts:** 18
- **Total Words:** ~32,000
- **Days Documented:** Dec 24, 2025 - Jan 4, 2026
- **Project Completion:** 100%
- **Architectural Decisions:** 31 ADRs
- **"Any"-Types Avoided:** I lost count after 146 .. smh

---

**The End**
