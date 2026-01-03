# 🧠 Memory System - Operating Instructions

**Purpose:** Prevent session amnesia between AI conversations by maintaining persistent context files.

---

## 📖 How This System Works

### The Problem
AI assistants (like Claude) lose context between sessions. Each new chat starts fresh, requiring you to re-explain the project every time.

### The Solution
**Active Documentation** - A set of Markdown files that act as the AI's persistent memory. These files are the **single source of truth**, not the chat history.

---

## 🗂️ File Structure

```
/asset-hatch/
├── MEMORY_SYSTEM.md          ← YOU ARE HERE (operating instructions)
├── project_brief.md           ← Static: Project goals, tech stack, non-negotiables
├── active_state.md            ← Dynamic: Current session status, next steps
├── system_patterns.md         ← Learnings: Standards, gotchas, decisions
├── MOCK_VS_REAL_AUDIT.md     ← Audit: What's real vs placeholder
└── adr/                       ← Architecture Decision Records (immutable)
    ├── 000-template.md
    ├── 001-use-copilotkit.md
    ├── 002-dexie-storage.md
    └── ...
```

---

## 🤖 AI Operating Protocol

### Phase 1: SESSION START (Bootloader)

**User says:** `"Read Context"` or `"Load Memory"` or starts new session

**AI must:**
1. ✅ Read `project_brief.md` (static context)
2. ✅ Read `active_state.md` (current status)
3. ✅ Read `system_patterns.md` (standards & gotchas)
4. ✅ Read `MOCK_VS_REAL_AUDIT.md` (implementation status)
5. ✅ Summarize what you learned in 3-5 bullet points
6. ✅ Ask: "What should we work on today?"

**Example Response:**
```
✅ Context Loaded

Current Status:
- Planning Interface refactored with glassmorphism theme
- 2 commits made (basic chat → full interface)
- CRITICAL ISSUES: No colors showing, art styles wrong
- Next Priority: P0 fixes (colors, UX improvements)

What should we tackle first?
```

---

### Phase 2: ACTIVE WORK (Runtime)

**During the session:**
- ✅ Reference `active_state.md` for current focus
- ✅ Check `system_patterns.md` before making decisions
- ✅ Update mental model as you work (prepare for handoff)
- ✅ Create ADRs for significant architectural decisions

**When encountering repeated issues:**
- ✅ Add to `system_patterns.md` → "Known Gotchas" section

**When making big decisions:**
- ✅ Create new ADR file: `adr/00X-decision-name.md`

---

### Phase 3: SESSION END (Handoff)

**User says:** `"End Session"` or `"Save Context"` or `"Update Memory"`

**AI must:**
1. ✅ Update `active_state.md`:
   - Move completed items to "Done"
   - Update "Current Focus" to next priority
   - Add any new "Do Not Forget" items
   - Update "Next Actions" checklist

2. ✅ Update `system_patterns.md` (if we learned something new):
   - Add new coding standards
   - Document new gotchas
   - Record UX patterns

3. ✅ Create ADR (if we made a significant decision):
   - New architectural choice
   - Technology selection
   - Design pattern adoption

4. ✅ Update `MOCK_VS_REAL_AUDIT.md` (if implementation status changed)

5. ✅ Confirm handoff:
   ```
   ✅ Memory Updated

   Files Modified:
   - active_state.md (next focus: [X])
   - system_patterns.md (added: [Y])
   - adr/003-new-decision.md (created)

   Next session will start here: [brief summary]
   ```

---

## 📋 File Descriptions & Templates

### 1. `project_brief.md` (The North Star)

**Purpose:** High-level project overview that rarely changes

**Contains:**
- Mission statement
- Tech stack
- Product phases
- Non-negotiables
- Success metrics

**Update Frequency:** Low (only when project direction changes)

**Owner:** Human (AI can suggest updates, but human approves)

---

### 2. `active_state.md` (The Live Dashboard)

**Purpose:** Single source of truth for the current session

**Contains:**
- Current focus (1-sentence goal)
- Status board (what's done, in progress, blocked)
- Verifiable context (links to ADRs, critical files)
- "Do Not Forget" landmines
- Next actions checklist

**Update Frequency:** High (every session end)

**Owner:** AI (updates at handoff)

**Template:**
```markdown
# 🧠 Active Session State

## 📍 Current Focus
> 1-Sentence Goal: [e.g., Fix glassmorphism colors and UX issues]

## 🚧 Status Board
| Component | Status | Notes |
| :--- | :--- | :--- |
| Glassmorphism theme | 🔴 Broken | No colors showing, needs background |
| Quality dropdowns | 🟡 Working but wrong | Options don't match game designer language |
| Plan preview | 🟡 Mock data | Shows sample plan, needs AI integration |

## 🔗 Verifiable Context (The "Receipts")
* **Relevant ADRs:** ADR-003 (Glassmorphism theme)
* **Critical Files:**
  - `app/globals.css` (theme variables)
  - `components/planning/QualitiesBar.tsx` (dropdown options)
  - `app/project/[id]/planning/page.tsx` (layout)

## 🛑 "Do Not Forget" (Landmines)
1. CopilotKit logic in ChatInterface must NOT be modified (only styling)
2. User is on Windows PowerShell, use `bun` commands (not npm in WSL)
3. Art style options must use game designer terminology, not artist terms
4. Glassmorphism should be soft/ethereal, NOT cyberpunk neon

## ⏭️ Next Actions
- [ ] Fix glassmorphism colors (add background gradient)
- [ ] Rewrite quality dropdown options
- [ ] Remove SAMPLE_PLAN default (start empty)
- [ ] Test in browser (localhost:3000)
```

---

### 3. `system_patterns.md` (The Playbook)

**Purpose:** Registry of lessons learned, standards, and gotchas

**Contains:**
- Architecture guidelines
- Code style standards
- Known edge cases / gotchas
- UX patterns
- Testing strategies

**Update Frequency:** Medium (whenever we establish a pattern or hit a gotcha)

**Owner:** AI (with human review)

**Template:**
```markdown
# ⚙️ System Patterns

## Architecture Guidelines
* All UI components are client components if they use hooks (`"use client"`)
* Use Dexie for persistent storage (not localStorage)
* Props drilling for state management until complexity requires Context API

## Code Style & Standards
* Use `const` over `let`
* Prefer rem units over px (accessibility)
* Component file naming: PascalCase.tsx
* Use TypeScript strict mode

## Known "Gotchas" / Edge Cases
* **WSL + Windows:** User runs `bun` in PowerShell, not WSL (npm may fail with OOM)
* **Glassmorphism:** Requires colored background to be visible (not just transparent glass)
* **CopilotKit:** System prompt defined in `makeSystemMessage`, not in provider config

## UX Patterns
* Empty states should have icon + helpful text (not blank screens)
* Loading states use aurora-themed animations (bouncing dots)
* Form inputs use glass styling (.glass-input class)
```

---

### 4. `MOCK_VS_REAL_AUDIT.md` (The Truth Table)

**Purpose:** Track what's implemented vs what's placeholder/mock

**Contains:**
- ✅ Fully implemented features
- 🟡 Partial/mock implementations
- ❌ Not started features
- Priority queue (P0, P1, P2)

**Update Frequency:** High (after implementing or discovering mock data)

**Owner:** AI (collaborative with human)

---

### 5. `adr/XXX-decision-name.md` (The Immutable Record)

**Purpose:** Document significant architectural decisions

**Contains:**
- Context (why are we deciding?)
- Decision (what did we choose?)
- Consequences (trade-offs)

**Update Frequency:** Low (only when making big decisions)

**Owner:** AI creates, human reviews/approves

**Template:**
```markdown
# ADR-003: Use Glassmorphism Theme (Not Material Design)

**Status:** Accepted
**Date:** 2025-12-25
**Deciders:** User + Claude

## Context
Need to choose a visual design language for the Planning Interface. Options considered:
- Material Design (Google's system)
- Neumorphism (soft shadows)
- Glassmorphism (frosted glass aesthetic)

## Decision
We will use **Glassmorphism with Aurora color palette** (soft purples, blues, pinks).

Rationale:
- Differentiates from generic admin dashboards
- Ethereal aesthetic matches "creative AI assistant" vibe
- Modern, trendy in 2024-2025
- Works well with dark mode

## Consequences

### Positive
- Unique, memorable visual identity
- Backdrop-filter creates depth without heavy graphics
- Aurora animations feel "AI-powered"

### Negative
- Backdrop-filter has performance cost on older devices
- Requires colored background to be visible (not just white)
- Browser support: 95%+ but need fallbacks for older Safari

### Mitigation
- Use `prefers-reduced-motion` to disable animations
- Provide solid color fallback if backdrop-filter unsupported
- Test on mid-range hardware (not just dev machines)
```

---

## 🔄 Example Session Flow

### Session 1: Initial Setup
```
Human: "Read Context"
AI: *reads files* → "No context files found. Should I initialize the memory system?"
Human: "Yes, initialize"
AI: *creates all files with templates*
Human: "Fix the glassmorphism colors"
AI: *works on fixes*
Human: "End Session"
AI: *updates active_state.md, system_patterns.md*
```

### Session 2: Resume Work
```
Human: "Read Context"
AI: *reads updated files* → "Loaded! Last session: Fixed colors. Next: Rewrite quality dropdowns. Continue?"
Human: "Yes"
AI: *continues from exact point*
...
Human: "End Session"
AI: *updates files again*
```

### Session 3: New Developer
```
New Human: "Read Context"
AI: *reads all files* → "Project: Asset Hatch. Status: Planning phase 30% complete. Issues: [X, Y]. Start here?"
New Human: "What's the tech stack?"
AI: "Next.js 15, CopilotKit, Dexie. Full details in project_brief.md section 2."
```

---

## 🚨 Critical Rules for AI

### DO:
✅ **Always read context files at session start** (even if you think you remember)
✅ **Update active_state.md at every session end** (even small sessions)
✅ **Create ADRs for big decisions** (e.g., "switch from Redux to Context API")
✅ **Add gotchas to system_patterns.md** (prevent future mistakes)
✅ **Reference file line numbers** when discussing code (e.g., `globals.css:117-145`)

### DON'T:
❌ **Rely on chat history** (it's ephemeral, files are truth)
❌ **Skip reading files** ("I remember from last time" = wrong)
❌ **Make up file contents** (if unsure, read the actual file)
❌ **Update files mid-session** (only at handoff, unless explicitly asked)
❌ **Forget to update status board** (incomplete = next session confusion)

---

## 🧪 Testing the System

### Validation Checklist
After AI reads context, verify it can answer:
- [ ] What is the project's mission?
- [ ] What's the current focus/priority?
- [ ] What was done in the last session?
- [ ] What are the "Do Not Forget" items?
- [ ] What's next on the TODO list?

If AI can't answer these, **context load failed** → re-read files.

---

## 🔧 Maintenance

### Weekly Review (Human Task)
- Review `active_state.md` → Is "Current Focus" still accurate?
- Review ADRs → Any decisions we've reversed?
- Archive old status board items → Keep table concise

### Monthly Cleanup
- Prune completed items from `active_state.md`
- Update `project_brief.md` if direction changed
- Review `system_patterns.md` → Remove obsolete gotchas

---

## 📞 Quick Reference Commands

| User Says | AI Does |
|-----------|---------|
| "Read Context" | Load all memory files, summarize status |
| "End Session" | Update active_state.md, system_patterns.md, ADRs |
| "What's next?" | Check active_state.md → Next Actions section |
| "What did we decide about [X]?" | Search ADRs for decision |
| "Remind me why [X]?" | Check system_patterns.md or ADRs |
| "Save progress" | Same as "End Session" |

---

## 🎓 Philosophy

> **"Files, not chat. Documents, not memory. Receipts, not vibes."**

The memory system exists because:
1. AI context windows are limited (not infinite)
2. Sessions end (you close the browser)
3. Multiple people might work on the project (need shared truth)
4. Future-you will forget (6 months from now, these files save you)

---

**Last Updated:** 2025-12-25
**System Version:** 1.0
**Status:** Active
