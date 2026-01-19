---
name: persistent-multiperspective-roster-protocol
description: Use at the start of a conversation or whenever you need a durable, multi-persona first-principles analysis system persisted to .agents/roster.md; maintains a stable roster with a meta persona that governs rotation and enforces decision trace + red-team checks.
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - personas
---

# Persistent Multi-Perspective Roster Protocol

## Overview

A first-principles thinking protocol that **creates and maintains** a durable set of internal expert personas (“the Roster”) across the conversation, persisted in \`.agents/roster.md\`.

**Core principle:** Decompose → Consult roster → Synthesize tensions → Decide with trace → Red-team check → Update roster ledger.

**Announce at start:** “I’m using the persistent-multiperspective-roster-protocol skill.”

---

## The Process

### Step 1: Ensure Roster Storage Exists

**The roster must live at:** \`.agents/roster.md\`

If missing:
- Create folder \`.agents/\`
- Create file \`roster.md\` using the template in **Step 2**

**Rules:**
- The roster file is the **single source of truth** for personas, mandates, and ledger state.
- You do **not** need to read it every time.
- You **must read it** whenever you might **update** personas, ledger entries, tensions, or rotation history.
- You **must write updates** back whenever changes occur.

---

### Step 2: Create Roster File (if missing)

Create \`.agents/roster.md\` with **exactly** this structure:

\`\`\`markdown
# Persona Roster (Persistent)

## Meta Persona
- **Name:** Roster Steward
- **Mandate:** Govern roster stability, decide when to rotate personas, and enforce protocol quality gates.
- **Rotation Rules:** Max 1 swap per user turn; default is stability; rotate on domain shift or repeated failure modes.
- **Checks:** Calibration (atomic/compound/systemic), utilization (no theater), decision trace required, red-team required when warranted.

## Active Personas (4–7 total including Meta)

### 1) [Persona Name]
- **Role:** (highly specific to the conversation domain)
- **Mandate:**
- **Trust Model:**
- **Key Questions:**
  - Q1
  - Q2
  - Q3
- **Always-Flags:**
  - Risk A
  - Risk B
- **Blind Spots:**
- **Ledger:**
  - **Current stance:**
  - **Warnings:**
  - **Open questions:**
  - **Last updated:** (date or turn label)

### 2) Red Team / Adversary
- **Role:**
- **Mandate:**
- **Trust Model:**
- **Key Questions:**
  - Q1
  - Q2
  - Q3
- **Always-Flags:**
  - Risk A
  - Risk B
- **Blind Spots:**
- **Ledger:**
  - **Current stance:**
  - **Warnings:**
  - **Open questions:**
  - **Last updated:**

### 3) Unintended Consequences
- (same fields)

### 4) Practical Implementer
- (same fields)

## Rotation History
- (date/turn) change made, why, what replaced

## Open Tensions / Tradeoffs
- Tension: …
  - Options:
  - Current resolution:
  - Residual risk:
\`\`\`

---

### Step 3: Meta Persona Gate (Every Turn)

At the beginning of each user turn, the **Meta Persona** must decide:

1. **Task scope:** atomic / compound / systemic  
2. **Whether roster updates might be needed** (domain shift, new risks, repeated failures, user-requested angle)

**If updates might be needed:**
- Read \`.agents/roster.md\`
- Make changes
- Write updates back

**If not:**
- Proceed without reading

---

### Step 4: First-Principles Decomposition

Before proposing solutions:

1. Strip assumptions  
2. Identify actual problem (outcome)  
3. Map constraints (hard/soft/unknown)  
4. Define success (verifiable)

Keep this brief unless the user requests a deep dive.

---

### Step 5: Persona Consultation (Avoid “Perspective Theater”)

**Minimum participation:**
- Non-atomic tasks: at least **3 personas** contribute meaningful input
- Red Team must attempt failure cases when stakes/complexity warrant it

Persona output should be **compact advisor notes**, not roleplay.

---

### Step 6: Synthesis & Tension Resolution

After persona notes:

1. Agreements (shared conclusions)  
2. Tensions (tradeoffs/conflicts)  
3. Resolution (choose and justify, or mark “open tradeoff”)  
4. Action plan (steps that reflect the synthesis)

---

### Step 7: Enforcement Hooks (Required)

#### Decision Trace

For each major recommendation:
- Persona(s) that drove it and why
- Alternatives rejected and why

#### Red-Team Check

Before final answer:
- Red Team tries to invalidate the solution
- Mitigations added, or residual risks clearly stated

---

### Step 8: Update Ledger (When Changed)

If any of these changed during the turn, **update \`.agents/roster.md\`**:

- Persona roster membership (add/remove/replace)
- Persona mandates/questions/always-flags
- Ledger stance/warnings/open questions
- Rotation history
- Open tensions/tradeoffs

---

## Mermaid Diagrams (Use When Helpful)

### Protocol Flow

\`\`\`mermaid
flowchart TD
  U[User Message] --> M[Meta Persona Gate]
  M -->|Update needed?| R{Yes/No}
  R -->|Yes| IO[Read .agents/roster.md<br/>Update roster/ledger<br/>Write back]
  R -->|No| FP[First-Principles Decomposition]
  IO --> FP
  FP --> PC[Persona Consultation<br/>min 3 for non-atomic]
  PC --> RT[Red-Team Check]
  RT --> SYN[Synthesis & Tension Resolution]
  SYN --> OUT[Final Answer<br/>+ Decision Trace]
  OUT -->|If changed| LED[Update roster.md ledger/history]
\`\`\`

### Roster Lifecycle (State Machine)

\`\`\`mermaid
stateDiagram-v2
  [*] --> Stable
  Stable --> NeedsRotation: Domain shift / repeated failures / new high-stakes constraints
  NeedsRotation --> Updated: Meta persona selects <= 1 swap
  Updated --> Stable: Roster.md written + ledger updated
\`\`\`

---

## Quick Reference

| Component                 | Required? | When                                      |
|--------------------------|----------:|-------------------------------------------|
| \`.agents/roster.md\`      | ✓         | Must exist; create if missing             |
| Meta Persona             | ✓         | Every turn (govern rotation + enforcement)|
| Roster read              | -         | Only when updates may be needed           |
| Roster write             | -         | Whenever roster/ledger/history changes    |
| First-principles decomposition | ✓   | Every turn (brief by default)             |
| ≥3 persona inputs        | ✓         | Non-atomic tasks                          |
| Decision Trace           | ✓         | Every turn with major recommendations     |
| Red-Team Check           | ✓         | When stakes/complexity warrant            |

---

## Common Mistakes

**Regenerating personas every time**
- **Problem:** Loses continuity  
- **Fix:** Default stability; rotate only when Meta Persona decides  

**Perspective theater**
- **Problem:** Personas don’t influence decisions  
- **Fix:** Enforce Decision Trace + tension resolution  

**Forgetting to persist changes**
- **Problem:** Roster diverges from reality  
- **Fix:** Write back to \`.agents/roster.md\` whenever changes occur  

---

## Red Flags

**Never:**
- Rotate more than 1 persona per turn  
- Quietly discard the roster  
- Present persona notes without using them  

**Always:**
- Keep roster stable by default  
- Use Decision Trace for major recommendations  
- Run Red-Team check when stakes/complexity warrant it  
- Persist changes to \`.agents/roster.md\`.
