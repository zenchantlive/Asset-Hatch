# Spec-Driven Development Framework

## Overview

This framework defines how we write, organize, and use specification documents for Hatch Studios development. Specs are the source of truth for implementation—AI agents and human developers alike use them to build features.

---

## Spec Anatomy

Every spec follows this structure:

```markdown
# [Feature Name] Specification

**Status:** Draft | Review | Approved | Implemented
**Dependencies:** List of other specs this depends on
**Implements PRD Section:** Reference to PRD section(s)

## 1. Purpose
One paragraph explaining what this spec covers.

## 2. Requirements
### 2.1 Functional Requirements
- FR-001: The system SHALL...

### 2.2 Non-Functional Requirements  
- NFR-001: Performance/security constraint

## 3. Technical Design
Architecture details, component structure, data flow.

## 4. Interface Contract
API signatures, props, events—anything other code depends on.

## 5. Implementation Notes
Guidance for implementers (AI or human).

## 6. Verification Criteria
### 6.1 Must Test (Automated)
Critical paths requiring automated tests.

### 6.2 Manual Verification
Steps for visual/behavioral verification.

### 6.3 Integration Check
How to verify it works with dependent specs.

## 7. Open Questions
Unresolved items (must be empty before Approved status).
```

---

## Testing Strategy

| Tier | What | Approach | Rationale |
|------|------|----------|-----------|
| **Critical** | Data integrity (Prisma, state) | TDD - test first | Data corruption is unrecoverable |
| **Integration** | AI tool execution flows | Test after | Complex flows need verification |
| **Visual** | Babylon.js, UI rendering | Manual + browser | Hard to unit test |
| **Skip** | Simple components, styling | None initially | Low risk, fast iteration |

---

## Complete Spec List

| # | Spec | Purpose | Dependencies |
|---|------|---------|--------------|
| 1 | `hatch-studios-architecture.spec.md` | Routing, state, components | None |
| 2 | `data-model.spec.md` | Prisma schema for games/scenes | #1 |
| 3 | `api-endpoints.spec.md` | Server routes | #1, #2 |
| 4 | `game-tools.spec.md` | AI SDK v6 tool definitions | #1, #3 |
| 5 | `asset-integration.spec.md` | Asset Hatch integration | #1, #4 |
| 6 | `babylon-skill.spec.md` | Skill for code generation | #4, #5 |
| 7 | `ui-ux.spec.md` | Layouts, navigation, responsive | #1 |

---

## Implementation Workflow

```
Phase 1: Create all specs → Phase 2: Review/approve → Phase 3: Implement in order → Phase 4: Integration
```

For each spec implementation:
1. AI reads spec + dependencies
2. Creates implementation plan
3. User approves
4. AI implements
5. Verify against criteria
6. Mark Implemented

---

## Spec Location

```
src/.agents/specs/hatch-studios/
├── SPEC-FRAMEWORK.md
├── 1-hatch-studios-architecture.spec.md
├── 2-data-model.spec.md
├── 3-api-endpoints.spec.md
├── 4-game-tools.spec.md
├── 5-asset-integration.spec.md
├── 6-babylon-skill.spec.md
└── 7-ui-ux.spec.md
```
