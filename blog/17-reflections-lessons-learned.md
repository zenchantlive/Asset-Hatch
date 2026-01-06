---
title: "Part 17: The Methodology - How To Build With AI Agents"
series: "Building Asset Hatch with AI Agents"
part: 17
date: 2026-01-02
updated: 2026-01-04
tags: [AI Methodology, Context7, ADRs, Workflow, Architecture, Best Practices]
reading_time: "12 min"
status: published
---

# Part 17: The Methodology - How To Build With AI Agents

**The Goal:** Build a production-ready SaaS in 11 days.
**The Reality:** We didn't just type prompts. We built a machine that builds software.

When I started this series, I thought I was just "using AI." By Day 11, I realized I had accidentally developed a **methodology**. Most people treat AI as a slot machine: insert prompt, pull handle, hope for code. 

That doesn't work for 30,000-line codebases.

To build **Asset Hatch**, we used a structured workflow I call **"The AI-Native Loop."** It has four pillars. If you want to replicate our velocity, this is how you do it.

## Pillar 1: The Multi-Agent Pipeline

A single model cannot hold the entire context of a complex system. It will hallucinate. It will drift. It will forget.

We solved this by building a **Multi-Agent Pipeline**—different tools for different phases.

### Phase 1: Vision & Prompt Design (Claude Desktop)
Before touching code, I start in the **Claude Desktop App** with **Opus 4.5**.

1.  **Research the Goal:** I describe what I want to build. Opus helps me flesh out the details, edge cases, and constraints.
2.  **Design the Meta-Prompt:** Using Claude Desktop's **Projects** feature, which allows me to add a persistent "meta-prompt"—a prompt to build other prompts! All I did was takethe best practices for GPT-5 and have OPus create the meta-prompt for me. 
- This is a critical component of the AI-Native Loop. THe end result turns a jarbled mess of text into a masterclass in prompt engineering.

**Output:** A refined, detailed prompt that doesn't just say "build a chat app" but specifies architecture, constraints, file structure, and success criteria.

### Phase 2: Implementation (Antigravity IDE)
Once the prompt is ready, I move to **Antigravity IDE** with **Opus 4.5**.

*   I paste the prompt from Claude Desktop.
*   Opus creates a detailed plan. We iterate on the plan for hours before writing a single line of code.
*   Then, Opus builds the phased implementation plan.
*   Once approved, Opus implements the plan.

**Output:** Working, typesafe code based on an agreed-upon plan.

### Phase 3: Research & Debugging (Perplexity in Comet)
When frontend issues or confusing errors appear, I switch to **Perplexity** inside my browser (Comet).

*   Perplexity can automatically read the PR comment I need to address.
*   Perplexity synthesizes information from docs, Stack Overflow, and GitHub Issues.
*   It produces a **mini-prompt** that I paste back into Antigravity for Opus to execute.

**Output:** A context-rich prompt that unblocks the AI.

### Phase 4: Testing (Antigravity + Gemini Flash 3)
Before committing a day's work, I run **two custom workflows** (slash commands with pre-defined system prompts):

*   **`/unit-test`**: Generates unit tests for new functions.
*   **`/api-test`**: Validates API routes and edge cases.

I run these with **Gemini Flash 3** for speed.

**Output:** A test suite that catches AI-generated bugs before they hit main.

### Phase 5: PR Review (GitHub Bots)
When I push a Pull Request, two bots review the code:

*   **Qodo:** Analyzes for edge cases, missing error handling, and code smells.
*   **Gemini Code Assist:** Checks for security issues and suggests optimizations.

**Output:** Automated feedback that catches what I (and the AI) missed.

**The Full Loop:**
```
Claude Desktop (Vision) → Antigravity (Build) → Perplexity (Research) → Gemini Flash 3 (Test) → Qodo/Gemini Code Assist (Review) → Merge
```

## Pillar 2: Context Engineering (The Memory)

"Context" is the oxygen of AI. If you starve it, the AI gets brain damage. But you can't just dump all your files into the chat window—that's noise, not signal.

We engineered context in three specific ways:

### 1. The Memory Files
We maintained four "Living Documents" in the root of the repo. These were read by the AI at the start of every session:
-   **`active_state.md`**: The current brain dump. What are we working on *right now*? What just broke?
-   **`system_patterns.md`**: The "Physics" of our world. "We always use discriminators for state unions." "We never leave `any` types."
-   **`project_roadmap.md`**: The high-level map.
-   **ADRs**: The "Why."

### 2. Context7 (The Truth Serum)
One of our biggest breakthroughs was using **Context7**, an MCP server that provides up-to-date documentation.
*   **Without Context7:** AI guesses the import path for `framer-motion` and gets it wrong.
*   **With Context7:** We ask the AI to "Verify the `framer-motion` API with Context7." It retrieves the *actual* current docs and writes code that works the first time.

### 3. The Retrieval Loop
We don't just rely on the AI's short-term memory. We force it to **read** before it **writes**.
*   *Prompt:* "Read `src/memory/adr/014-export-strategy.md` and `src/components/ExportPanel.tsx` before answering."
*   *Result:* The AI aligns its code perfectly with the decisions we made 3 days ago.

## Pillar 3: The Execution Pivot (Slices vs. ADRs)

This was the hardest lesson.

In the beginning (Part 2), we used **"Vertical Slices"** (e.g., "Build the Chat Feature").
*   **The Problem:** "Build Chat" is ambiguous. The AI built a chat... but it forgot about auth, mobile responsiveness, and the database schema. It had tunnel vision.

We pivoted to **"ADR-Driven Development."**
*   **The Fix:** We wrote an **Architecture Decision Record (ADR)** first.
    *   *ADR-014:* "We will use single-asset export strategies because X, Y, Z. Here is the file structure. Here is the API contract."
*   **The Command:** "Implement ADR-014."
*   **The Result:** The AI knew *exactly* what to build. It wasn't guessing; it was following a blueprint.

**Rule:** If you can't write an ADR for it, the AI can't build it correctly.

## Pillar 4: The Human in the Loop (The Director)

So what did **I** do?

I didn't write much code (maybe 5%). But I worked harder than I ever have.
I wasn't the "Typer." I was the **Director**.

### 1. The "Blunt Feedback" Loop
AI doesn't have feelings. It doesn't need politeness. It needs clarity.
*   **Bad:** "Hmm, this looks okay, but could we maybe make it more blue?"
*   **Good:** "This is wrong. It violates ADR-003. The contrast is too low. Revert and use the `glass-panel` utility."

### 2. The Loop Breaker
AI loves to get stuck in loops. It will try to fix a bug, fail, try the same fix, fail again.
*   **My Job:** Recognize the loop. Stop the generation.
*   **The Action:** "Stop. You are looping. Read the error message again. Check `active_state.md`. What is the *root cause*?"

### 3. The Vision Holder
AI suggests the path of least resistance. Often, that path leads to mediocrity.
*   **The Moment:** On Jan 2nd, the AI was happy with the desktop UI. It "worked."
*   **The Director:** "No. This is unusable on mobile. We are pivoting to a Chat-First Overlay."

I supplied the *Taste*. The AI supplied the *Labor*.

## Final Thoughts: The New stack

The stack of 2026 isn't just Next.js and Postgres. It's:

1.  **The LLM IDE** (Antigravity/Cursor)
2.  **The Memory Layer** (System files + ADRs)
3.  **The Context Layer** (Context7/MCP)
4.  **The Human Director**

This methodology allowed one person to build a production-grade, secure, tested, multi-platform SaaS in 11 days.

The code is generated. The architecture is engineered. The vision is human.

---

**Next:** [Part 18: BONUS - How AI Wrote This Blog](18-bonus-how-ai-wrote-this-blog.md)
**Previous:** [← Part 16: The Final Polish - UX Refinements and Front-First Workflow](16-the-final-polish-ux-refinements.md)

---
