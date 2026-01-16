---
trigger: always_on
---

Antigravity Skills

  A collection of powerful skills to improve your capabilities. Use these as defaults when appropriate.

  Location: C:\Users\Zenchant\.gemini\antigravity\skills

  ---
  Available Skills
  Skill: brainstorming
  Description: Use before any creative work - creating features, building components, adding functionality. Explores
    user intent, requirements and design through collaborative dialogue before implementation.
  ────────────────────────────────────────
  Skill: dispatching-parallel-agents
  Description: Use when facing 2+ independent tasks that can work without shared state. Dispatches one agent per
    problem domain for concurrent investigation/fixes.
  ────────────────────────────────────────
  Skill: executing-plans
  Description: Use when you have a written implementation plan to execute. Loads plan, reviews critically, executes
    tasks in batches with checkpoints for architect review.
  ────────────────────────────────────────
  Skill: finishing-a-development-branch
  Description: Use when implementation is complete and tests pass. Guides completion by presenting structured
    options: merge locally, create PR, keep as-is, or discard.
  ────────────────────────────────────────
  Skill: mobile-web-design
  Description: Use when writing CSS, HTML layouts, or any frontend code. Prevents common mobile breakages by checking
     for responsive patterns, touch targets, viewport issues, and iOS quirks before they become bugs.
  ────────────────────────────────────────
  Skill: receiving-code-review
  Description: Use when receiving code review feedback. Requires technical evaluation and verification before
    implementing - no performative agreement or blind implementation.
  ────────────────────────────────────────
  Skill: requesting-code-review
  Description: Use when completing tasks or implementing major features. Dispatches code-reviewer subagent to catch
    issues before they cascade.
  ────────────────────────────────────────
  Skill: subagent-driven-development
  Description: Use when executing implementation plans with independent tasks in current session. Dispatches fresh
    subagent per task with two-stage review (spec compliance, then code quality).
  ────────────────────────────────────────
  Skill: systematic-debugging
  Description: Use when encountering any bug, test failure, or unexpected behavior. Requires finding root cause
    before attempting fixes through 4 phases: investigation, pattern analysis, hypothesis testing,
    implementation.
  ────────────────────────────────────────
  Skill: test-driven-development
  Description: Use when implementing any feature or bugfix. Write test first, watch it fail, write minimal code to
    pass. ⚠️ Requires user approval - token heavy, not always needed.
  ────────────────────────────────────────
  Skill: using-git-worktrees
  Description: Use when starting feature work needing isolation. Creates isolated git worktrees with smart directory
    selection and safety verification.
  ────────────────────────────────────────
  Skill: using-superpowers
  Description: Use at conversation start. Establishes how to find and use skills - invoke relevant skills BEFORE any
    response or action, even with 1% chance of applicability.
  ────────────────────────────────────────
  Skill: verification-before-completion
  Description: Use before claiming work is complete, fixed, or passing. Requires running verification commands and
    confirming output before any success claims. Evidence before assertions.
  ────────────────────────────────────────
  Skill: writing-plans
  Description: Use when you have specs/requirements for multi-step tasks before touching code. Creates comprehensive
    implementation plans with bite-sized tasks for engineers with zero context.
  ────────────────────────────────────────
  Skill: writing-skills
  Description: Use when creating or editing skills. Applies TDD to documentation: write pressure tests (baseline),
    write skill, refactor to close loopholes.
  ---
  Recommended Workflows

  1. New Feature Development (Full Lifecycle)

  brainstorming → writing-plans → using-git-worktrees → subagent-driven-development → finishing-a-development-branch

  Use when: Building something new from scratch
  - Explore requirements collaboratively
  - Create detailed implementation plan
  - Work in isolated worktree
  - Execute with fresh subagents + reviews
  - Clean merge/PR when done

  ---
  2. Quick Feature Implementation (Same Session)

  writing-plans → subagent-driven-development → verification-before-completion

  Use when: Requirements are already clear, want fast iteration
  - Skip brainstorming if spec exists
  - Subagents handle each task
  - Verify everything before claiming done

  ---
  3. Parallel Session Development

  brainstorming → writing-plans → using-git-worktrees → executing-plans → finishing-a-development-branch

  Use when: Want human review checkpoints between batches
  - Plan gets executed in separate session
  - Batches of 3 tasks with feedback loops
  - More control, slower iteration

  ---
  4. Bug Investigation & Fix

  systematic-debugging → verification-before-completion

  Use when: Something is broken
  - Find root cause FIRST (no guessing)
  - Fix minimally, verify passes

  With TDD (ask user first):
  systematic-debugging → test-driven-development* → verification-before-completion
  - Write failing test reproducing bug before fixing
  - ⚠️ Get user approval - adds tokens, not always necessary

  ---
  5. Multi-Bug Triage

  systematic-debugging → dispatching-parallel-agents → verification-before-completion

  Use when: Multiple unrelated failures
  - Identify independent problem domains
  - Dispatch one agent per domain
  - Integrate fixes, verify no conflicts

  ---
  6. Code Review Loop

  requesting-code-review → receiving-code-review → verification-before-completion

  Use when: Completing any significant work
  - Request review after each task/feature
  - Evaluate feedback technically (no blind agreement)
  - Fix issues, verify fixes work

  ---
  7. Skill Creation

  writing-skills

  Use when: Creating reusable process documentation
  - Write pressure tests first (baseline)
  - Write skill addressing failures
  - Refactor until bulletproof

  With TDD (ask user first):
  writing-skills + test-driven-development*
  - ⚠️ Get user approval - token heavy

  ---
  8. Mobile Redesign / Responsive Fixes

  mobile-web-design → systematic-debugging → verification-before-completion

  Use when: Fixing layout issues, responsiveness problems, or building new frontend
  1. Audit: DevTools device mode at 320px, 375px, 414px. Find overflow with * { outline: 1px solid red !important; }
  2. Identify: List breakages with root cause (fixed width? missing flex-wrap? hover-only?)
  3. Fix by priority: viewport meta → img max-width → flex-wrap → input font-size 16px → 44px touch targets → hover→tap
  4. Verify: Real device test (not just DevTools), iOS Safari specifically

  For larger redesigns:
  mobile-web-design → writing-plans → using-git-worktrees → subagent-driven-development → verification-before-completion
  - Group fixes by pattern (all flex issues, all input issues)
  - One commit per pattern category
  - Include before/after screenshots at mobile widths

  ---
  Quick Reference
  ┌──────────────────────────────────────┬─────────────────────────┐
  │              Situation               │        Workflow         │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Build X" (vague)                    │ #1 Full Lifecycle       │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Implement this spec"                │ #2 Quick Implementation │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Fix this bug"                       │ #4 Bug Fix              │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Tests are failing everywhere"       │ #5 Multi-Bug Triage     │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Review before merge"                │ #6 Code Review Loop     │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Mobile is broken" / "Layout issues" │ #8 Mobile Redesign      │
  ├──────────────────────────────────────┼─────────────────────────┤
  │ "Make this responsive"               │ #8 Mobile Redesign      │
  └──────────────────────────────────────┴─────────────────────────┘
  ---
  Always Layer On

  - using-superpowers at conversation start
  - verification-before-completion before any success claims
  - mobile-web-design for any frontend/CSS work
  - test-driven-development for code changes (ask user first - token heavy)