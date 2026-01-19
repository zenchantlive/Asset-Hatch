# System Review: Vercel Prisma Deployment Fix

## Meta Information

- **Type:** Reactive debugging session (not planned feature)
- **Date:** 2026-01-15
- **Issue:** Vercel deploy failing with Prisma P3019/P3005 errors
- **Outcome:** Successful deployment after 4 iterations

---

## Session Timeline

| Attempt | Change | Result |
|---------|--------|--------|
| 1 | Changed `vercel.json`: `migrate deploy` → `db push` | Failed: P3019 (provider mismatch) |
| 2 | Removed `migrations` config from `prisma.config.ts` | Failed: P3005 (schema not empty) |
| 3 | Removed `db push` entirely from `vercel.json` | Failed: Same error |
| 4 | Found hidden `migrate deploy` in `package.json` build script | **Success** |

---

## Root Cause Analysis

### The Actual Problem

```
package.json line 7:
"build": "prisma generate && prisma migrate deploy && next build"
```

`prisma migrate deploy` was **hardcoded in package.json**, not just `vercel.json`.

### Why It Took 4 Attempts

1. **Assumption error:** Assumed `vercel.json` controlled the entire build
2. **Didn't check package.json scripts** until attempt 4
3. **Chased symptoms** (P3019, P3005 errors) instead of tracing the actual command being run

### The Clue We Missed

The Vercel logs clearly showed:
```
$ prisma generate && prisma migrate deploy && next build
```

This should have immediately triggered: "Where is `migrate deploy` coming from if we removed it from vercel.json?"

---

## Divergence Analysis

### Divergence 1: Incremental Fixes vs. Full Investigation

| Aspect | What Should Have Happened | What Actually Happened |
|--------|---------------------------|------------------------|
| **Approach** | Grep for all `migrate` references before fixing | Fixed `vercel.json` only |
| **Classification** | Bad ❌ | - |
| **Root Cause** | Didn't follow "understand before changing" principle |

### Divergence 2: Output Directory Fix

| Aspect | Details |
|--------|---------|
| **Issue** | `outputDirectory: "src/.next"` caused `src/src/.next` lookup |
| **Classification** | Good ✅ (caught by Vercel error) |
| **Note** | This was a pre-existing config issue, not introduced by our changes |

---

## Process Gaps Identified

### Gap 1: No "Trace the Build" Step

When a CI/CD build fails, we should **first trace what commands are actually running**, not assume based on config files.

**Detection method:** Look at the actual command in logs:
```
$ prisma generate && prisma migrate deploy && next build
```

### Gap 2: Multiple Config Sources

This project has build configuration in **three places**:
1. `vercel.json` - Vercel-specific overrides
2. `package.json` - npm/bun scripts
3. `prisma.config.ts` - Prisma-specific config

Changes to one don't affect the others.

### Gap 3: Missing Search Before Fix

Should have run:
```bash
grep -r "migrate deploy" --include="*.json" --include="*.ts"
```

---

## System Improvement Actions

### Update CLAUDE.md

Add to "Critical Gotchas" section:

```markdown
5. **Build Config Sources**: Vercel builds use BOTH `vercel.json` AND `package.json` scripts.
   - `vercel.json` buildCommand runs `bun run build`
   - `package.json` "build" script defines what actually runs
   - Always grep for commands across ALL config files before fixing CI issues
```

### Add Debugging Pattern

Add to `memory/system_patterns.md`:

```markdown
## CI/CD Debugging Pattern

When Vercel/CI builds fail:
1. **Read the actual command** in the logs (e.g., `$ prisma generate && ...`)
2. **Grep for that command** across all config files:
   ```bash
   grep -r "migrate deploy" --include="*.json" --include="*.ts" --include="*.yaml"
   ```
3. **Trace the chain**: vercel.json → package.json scripts → any pre/post hooks
4. **Then fix** at the source
```

### Create New Command (Future)

Consider creating `/debug-ci` command that:
1. Searches all config files for build-related commands
2. Shows the full build chain
3. Identifies potential conflicts

---

## Final State

### Files Modified

| File | Change |
|------|--------|
| `vercel.json` | `buildCommand: "bun run build"`, `outputDirectory: ".next"` |
| `src/package.json` | `build: "prisma generate && next build"` (removed `migrate deploy`) |
| `src/prisma.config.ts` | Removed `migrations` section |
| `src/prisma/migrations/` | Deleted (SQLite-incompatible) |

### Deployment Status

✅ **Successful** - https://asset-hatch.vercel.app

---

## Key Learnings

### What Worked Well

- Persistent debugging despite multiple failures
- Eventually traced to correct root cause
- Clean final solution (removed migration complexity entirely)

### What Needs Improvement

- **Search first, fix second** - Always grep for the failing command
- **Trace the full chain** - Don't assume one config file controls everything
- **Read logs more carefully** - The answer was in the Vercel output

### For Next CI/CD Issue

1. Copy the exact failing command from logs
2. `grep -r "that command"` across entire repo
3. Fix ALL occurrences, not just the obvious one
4. Verify the fix locally if possible before pushing

---

## Alignment Score: 6/10

**Reasoning:**
- Eventually solved the problem ✅
- Took 4 attempts when 1-2 should have sufficed ❌
- Missed obvious clue in logs ❌
- Good final solution (clean removal of migrate deploy) ✅
- Documented learnings for future ✅
