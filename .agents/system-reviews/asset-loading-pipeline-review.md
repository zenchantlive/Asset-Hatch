# System Review: Asset Loading Reliability + Skybox Pipeline

## Meta Information
- Plan reviewed: `.agents/plans/asset-loading-pipeline.md`
- Execution report: `.agents/execution-reports/asset-loading-pipeline.md`
- Date: 2026-01-19

## Overall Alignment Score: 8/10

## Divergence Analysis
```yaml
divergence: Proxy token flow for iframe (no cookies)
planned: Proxy-based loading with resolver
actual: Added signed proxy token for unauthenticated iframe requests
reason: iframe origin null prevented cookie auth
classification: good ✅
justified: yes
root_cause: missing context (iframe auth constraint not captured in plan)
```

```yaml
divergence: Default R2 signed URL TTL when env unset
planned: Resolve signed URLs via r2-storage
actual: Added default TTL of 900s when env missing
reason: R2 returned 400 for unsigned requests
classification: good ✅
justified: yes
root_cause: missing configuration assumption in plan
```

```yaml
divergence: Preview asset registry toggle
planned: Diagnostics surfaced in preview overlay
actual: Added toggleable asset registry list in PreviewTab
reason: Needed quick visibility of keys during debugging
classification: good ✅
justified: yes
root_cause: plan under-specified UX diagnostics
```

## Pattern Compliance
- [x] Followed codebase architecture
- [x] Used documented patterns (CLAUDE.md)
- [ ] Applied testing patterns correctly (tests added but not run)
- [x] Met validation requirements (manual validation through runtime logs)

## System Improvement Actions

**Update CLAUDE.md:**
- [ ] Document iframe `srcdoc` auth constraint and need for proxy token fallback.
- [ ] Add note: R2 signed URL TTL required; default in code is 900s if env missing.

**Update Plan Command:**
- [ ] Add prompt to capture auth context for iframe or sandboxed environments.
- [ ] Require explicit validation plan for asset loading (headers/status checks).

**Create New Command:**
- [ ] `/debug-asset-loading` to automate checks for proxy status, upstream host/path, and CORS headers.

**Update Execute Command:**
- [ ] Add step: verify upstream status headers (`X-Asset-Proxy-Status`, `X-Asset-Proxy-Upstream`).

## Key Learnings

**What worked well:**
- Diagnostics-first approach identified true failure layers (CORS -> auth -> signing).
- Incremental proxy improvements provided clear observability.
- Skybox pipeline fixed by aligning data linkage with loader support.

**What needs improvement:**
- Plan did not capture iframe auth constraints or R2 signing requirements.
- Missing system-review dependencies (`plan-feature.md`, `execute.md`) indicates docs drift.

**For next implementation:**
- Always confirm iframe auth context early.
- Add a lightweight plan section for environment prerequisites (preloaded libs, auth model).
- Keep prompt and loader behavior in sync to avoid misleading guidance.
