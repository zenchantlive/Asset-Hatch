# Debug CI/CD Build Failures

Systematic workflow for debugging Vercel/CI build failures.

## When to Use

Use this command when:
- Vercel deployment fails
- CI/CD pipeline errors
- Build commands fail in production but work locally

## Workflow

### Step 1: Extract the Failing Command

From the CI logs, identify the **exact command** that failed.

Example log:
```
$ prisma generate && prisma migrate deploy && next build
Error: P3019
```

The failing command is: `prisma migrate deploy`

### Step 2: Search All Config Sources

Build configuration lives in **multiple places**. Search ALL of them:

```bash
# Search for the failing command/keyword
grep -r "migrate deploy" --include="*.json" --include="*.ts" --include="*.yaml" --include="*.yml" .

# Common config files to check:
# - vercel.json (Vercel-specific)
# - package.json (npm/bun scripts)
# - prisma.config.ts (Prisma-specific)
# - turbo.json (Turborepo)
# - .github/workflows/*.yml (GitHub Actions)
```

### Step 3: Trace the Build Chain

Understand how configs connect:

```
vercel.json buildCommand
    ↓
calls package.json "build" script
    ↓
may call other scripts (prebuild, postbuild)
    ↓
may reference other config files
```

### Step 4: Identify All Locations

List every file containing the failing command:

| File | Line | Content |
|------|------|---------|
| vercel.json | 2 | `"buildCommand": "... migrate deploy ..."` |
| package.json | 7 | `"build": "... migrate deploy ..."` |

### Step 5: Fix at ALL Sources

Update **every location** where the command appears. Missing one will cause the same failure.

### Step 6: Verify Locally (if possible)

```bash
# Run the exact build command locally
bun run build

# Or simulate Vercel's build
bun install && bun run build
```

### Step 7: Push and Monitor

```bash
git add -A
git commit -m "fix(deploy): [describe the fix]"
git push
```

Watch the Vercel deployment logs to confirm the fix.

## Common CI/CD Issues

### Prisma Provider Mismatch (P3019)
- **Cause:** `migration_lock.toml` provider differs from `schema.prisma`
- **Fix:** Delete `prisma/migrations/`, remove migration config, use `prisma generate` only

### Database Schema Not Empty (P3005)
- **Cause:** Running `migrate deploy` on DB with tables but no migration history
- **Fix:** Use `prisma db push` or baseline the database

### Output Directory Not Found
- **Cause:** `outputDirectory` in vercel.json doesn't match actual output location
- **Fix:** Check Vercel's root directory setting, use relative path (`.next` not `src/.next`)

### Command Works Locally, Fails in CI
- **Causes:**
  - Different Node/Bun version
  - Missing environment variables
  - Different working directory
- **Fix:** Check CI environment matches local, verify all env vars are set

## Checklist

Before pushing a CI fix:

- [ ] Grepped for failing command across ALL config files
- [ ] Updated ALL locations where command appears
- [ ] Verified build works locally
- [ ] Checked environment variables are set in Vercel dashboard
- [ ] Confirmed output directory matches Vercel's root directory setting

## Output

After debugging, document findings in:
- `memory/active_state.md` - Session summary
- `memory/system_patterns.md` - If new pattern discovered
- `.agents/system-reviews/` - If significant debugging session
