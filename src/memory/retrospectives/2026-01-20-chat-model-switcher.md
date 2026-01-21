# Retrospective: Chat Model Switcher Debugging

**Date:** 2026-01-20
**Feature:** Chat Model Switcher Dropdown
**Duration:** ~30 minutes of debugging

---

## Summary

Added a model switcher dropdown to all chat interfaces. Component code was correct but invisible in the UI. Root cause: Turbopack cache corruption preventing new files from being bundled.

---

## What Happened

### The Problem
User reported the `ChatModelSwitcher` component wasn't visible despite code being correctly placed in:
- `ChatInterface.tsx` (Planning)
- `ChatPanel.tsx` (Studio)
- `GamePlanChat.tsx` (Game Planning)

### Initial Hypothesis
Applied first-principles thinking to enumerate possible failure modes:
1. Component not imported correctly
2. Conditional rendering evaluating false
3. CSS making it invisible (opacity, display:none)
4. Parent container clipping (overflow:hidden)
5. Component throwing during render
6. Build/bundling issue

### Debugging Steps

1. **Verified code** - Imports, state, JSX all correct
2. **Checked model registry** - `getChatModels()` returns 5 models ✓
3. **Added debug borders** - Red border on component, yellow on wrapper
4. **Attempted restart** - Turbopack crashed with panic errors

### Root Cause Discovery

```
FATAL: An unexpected Turbopack error occurred.
Turbopack Error: Failed to write app endpoint /dashboard/page
```

The new `ChatModelSwitcher.tsx` file (untracked in git, shown as `??`) wasn't being picked up by Turbopack due to cache corruption.

### Fix Applied

```bash
rm -rf .next
bunx prisma generate  # Also needed - Prisma client was stale
bun dev
```

After restart, debug borders appeared. Then discovered dropdown was clipped by parent container - fixed by changing `top-full` to `bottom-full` (open upward).

---

## Lessons Learned

### 1. New Files + Turbopack = Clear Cache
When adding new component files that don't appear in the UI:
- **First check:** Is the dev server picking up the file?
- **Quick fix:** `rm -rf .next && bun dev`
- Turbopack can silently fail to bundle new files

### 2. Debug Borders Are Efficient
Adding visible debug styles (bright red/yellow borders) is faster than console.log debugging for visibility issues:
```tsx
className="border-4 border-red-500"  // Unmissable
```

### 3. Dropdown Position Matters
For components near screen edges:
- Bottom of screen → dropdown opens upward (`bottom-full`)
- Top of screen → dropdown opens downward (`top-full`)
- Always add `max-h-XX overflow-y-auto` for long lists

### 4. WSL2/Windows Split Complicates Debugging
- User runs `bun` in Windows PowerShell
- Claude operates in WSL2
- Commands must be communicated clearly for user to run

---

## Pattern to Add to CLAUDE.md

```markdown
## Debugging Invisible Components
If a new component file doesn't render:
1. Check git status - is file untracked (`??`)?
2. Clear Next.js cache: `rm -rf .next`
3. Regenerate Prisma if needed: `bunx prisma generate`
4. Restart dev server: `bun dev`
5. If still invisible, add debug border: `border-4 border-red-500`
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/ui/ChatModelSwitcher.tsx` | NEW - Dropdown component |
| `src/components/planning/ChatInterface.tsx` | Added switcher above input |
| `src/components/studio/ChatPanel.tsx` | Added switcher above input |
| `src/components/studio/planning/GamePlanChat.tsx` | Added switcher above input |
| `src/lib/model-registry.ts` | Added 5 chat models |
| `src/app/api/chat/route.ts` | Accept model param |
| `src/app/api/studio/chat/route.ts` | Accept model param |

---

## Outcome

✅ Model switcher visible and functional on all 3 chat pages
✅ Dropdown opens upward, all 5 models visible
✅ Model selection persists during chat session
