# 🧠 Memory System - Persistent Context Files

**Purpose:** Prevent session amnesia by maintaining AI-readable context files.

---

## 📁 What's in This Folder

```
/memory/
├── README.md                    ← You are here
├── MEMORY_SYSTEM.md            ← Operating instructions for AI
├── project_brief.md            ← Static: Project goals, tech stack
├── active_state.md             ← Dynamic: Current session status
├── system_patterns.md          ← Standards, gotchas, learnings
├── MOCK_VS_REAL_AUDIT.md       ← Implementation status audit
└── adr/                        ← Architecture Decision Records
    ├── 000-template.md
    ├── 001-use-copilotkit.md
    ├── 003-glassmorphism-theme.md
    └── ...
```

---

## 🤖 For AI Assistants (Claude, GPT, etc.)

### At Session Start
**User says:** `"Read Context"` or `"Load Memory"`

**You must:**
1. Read `MEMORY_SYSTEM.md` (how to use this system)
2. Read `project_brief.md` (project overview)
3. Read `active_state.md` (current status)
4. Read `system_patterns.md` (standards & gotchas)
5. Read `MOCK_VS_REAL_AUDIT.md` (what's real vs mock)
6. Summarize in 3-5 bullet points
7. Ask: "What should we work on today?"

### At Session End
**User says:** `"End Session"` or `"Save Context"`

**You must:**
1. Update `active_state.md` (status, next steps)
2. Update `system_patterns.md` (if learned something new)
3. Create new ADR (if made significant decision)
4. Update `MOCK_VS_REAL_AUDIT.md` (if implementation status changed)
5. Confirm: "Memory updated. Next session starts here: [...]"

---

## 📖 For Humans (Developers)

### Quick Reference
- **What is Asset Hatch?** → `project_brief.md`
- **What's the current status?** → `active_state.md`
- **What's real vs mock?** → `MOCK_VS_REAL_AUDIT.md`
- **Why did we decide X?** → `adr/` folder
- **What are our coding standards?** → `system_patterns.md`

### Common Tasks
- **Starting new session?** → Read `active_state.md` → Continue from "Next Actions"
- **Forgot why we chose X?** → Check `adr/00X-decision.md`
- **Hit a weird bug?** → Check `system_patterns.md` → "Known Gotchas"
- **Want to change architecture?** → Create new ADR in `adr/`

---

## 🔄 File Descriptions

### 1. `MEMORY_SYSTEM.md`
**What:** Operating instructions for this memory system
**For:** AI assistants (meta-documentation)
**Update:** Only when changing the system itself

### 2. `project_brief.md`
**What:** High-level project overview (mission, tech stack, goals)
**For:** Onboarding new people/AI sessions
**Update:** Low frequency (only when project direction changes)

### 3. `active_state.md`
**What:** Current session status (what's done, what's next)
**For:** Session continuity, handoffs
**Update:** EVERY session end (high frequency)

### 4. `system_patterns.md`
**What:** Coding standards, UX patterns, gotchas
**For:** Preventing repeated mistakes
**Update:** When establishing new patterns or hitting new gotchas

### 5. `MOCK_VS_REAL_AUDIT.md`
**What:** Audit of what's implemented vs placeholder
**For:** Understanding project completion, prioritizing work
**Update:** After implementing features or discovering mock data

### 6. `adr/` (Architecture Decision Records)
**What:** Immutable records of significant decisions
**For:** Understanding why we chose X over Y
**Update:** Only when making NEW decisions (never edit existing ADRs)

---

## 🚨 Critical Rules

### DO:
✅ Read memory files at every session start
✅ Update `active_state.md` at every session end
✅ Create ADRs for big decisions
✅ Add gotchas to `system_patterns.md`
✅ Trust the files, not your memory

### DON'T:
❌ Skip reading files ("I remember from last time")
❌ Rely on chat history (it's ephemeral)
❌ Update files mid-session (only at handoff)
❌ Make up file contents (read the actual file)
❌ Forget to update after making changes

---

## 💡 Philosophy

> **"Files, not chat. Documents, not memory. Receipts, not vibes."**

This system exists because:
1. AI context windows are limited
2. Sessions end (browser closes, chat resets)
3. Multiple people work on the project
4. Future-you will forget things

By maintaining these files, we create a **persistent brain** that survives across sessions.

---

## 🧪 Testing the System

After loading context, AI should be able to answer:
- [ ] What is the project's mission?
- [ ] What's the current focus/priority?
- [ ] What was done in the last session?
- [ ] What are the "Do Not Forget" items?
- [ ] What's next on the TODO list?

If AI can't answer these → context load failed → re-read files.

---

## 📞 Quick Commands

| User Says | AI Does |
|-----------|---------|
| "Read Context" | Load all memory files, summarize |
| "End Session" | Update memory files |
| "What's next?" | Check `active_state.md` → Next Actions |
| "Why did we choose X?" | Search `adr/` folder |
| "What are our standards?" | Read `system_patterns.md` |

---

**Last Updated:** 2025-12-25
**System Version:** 1.0
