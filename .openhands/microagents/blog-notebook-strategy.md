---
name: blog-notebook-strategy
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- commit
- git
---

# Blog Notebook Strategy Microagent

This microagent ensures that all commits and progress updates follow the "Building in Public" strategy.

## Pre-commit Checklist
Before you commit, always:
1. Update `memory/active_state.md` with progress.
2. Add any new patterns/updates to `memory/system_patterns.md`, 'Project Architecture', etc.
3. Create ADR in `memory/adr/` for significant decisions.

## Git & Collaboration (The "Blog Notebook" Strategy)
We treat git commits as a **collaborative notebook** to feed our blog-writing AI agents later. This is critical for our "Building in Public" strategy.

### Commit Message Format
1. **Header**: `type(scope): Title` (e.g., `feat(ui): [Panels] Implement v2.1`)
2. **Body**: Must act as a mini-blog post.

### Required Sections in Commit Body
- **Story of Collaboration**: What did the user ask for? How did we iterate? (e.g., "User caught a bug in the grid layout, we paired to fix it.")
- **Decisions Made**: Why did we choose this architecture? (e.g., "Switched to Context API to avoid prop drilling.")
- **Challenges**: What was hard? (e.g., "Race conditions in the queue.")

### Example
```text
feat(ui): [Batch] Fix grid layouts

Story of Collaboration:
User noticed the grid looked empty with 2 items. We decided to make it adaptive.

Decisions Made:
- Implemented dynamic grid-cols based on item count.
```
