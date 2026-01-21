# Root Cause Analysis: GitHub Issue #87

## Issue Summary

- **GitHub Issue ID**: #87
- **Issue URL**: https://github.com/zenchantlive/Asset-Hatch/issues/87
- **Title**: Research Investigation: Black Screen and Asset Loading Failures (Unknown Root Cause)
- **Reporter**: zenchantlive
- **Severity**: High (blocks game preview functionality)
- **Status**: OPEN (research investigation)

## Problem Description

When generating a game in Hatch Studios, the app exhibits a black screen and fails to load assets. The issue manifests as a non-rendering preview iframe with multiple observed symptoms.

**Expected Behavior:**
- Game preview iframe renders Babylon.js scene with loaded assets
- User code executes without errors
- Assets load via `ASSETS.load()` helper

**Actual Behavior:**
- Black screen in preview iframe
- Console shows analytics network errors (`net::ERR_BLOCKED_BY_CLIENT` for PostHog)
- JavaScript duplicate declaration error for `ground` variable
- No clear asset or game logic network error observed

**Symptoms:**
- Black screen (no 3D canvas rendering)
- PostHog analytics requests blocked (likely ad blocker)
- Duplicate `ground` declaration JS error
- UI init logs appear normally
- No direct asset loading network failures visible in console

## Reproduction

**Steps to Reproduce:**
1. Create or open a game in Hatch Studios
2. Navigate to Preview tab
3. Observe black screen instead of Babylon.js scene

**Reproduction Verified:** Partially - exact trigger conditions unclear

## Root Cause

### Affected Components

**Files:**
- `src/components/studio/PreviewFrame.tsx` - Sandboxed iframe execution
- `src/lib/studio/asset-loader.ts` - ASSETS global helper
- `src/lib/studio/preview-libraries.ts` - CDN script manifest
- `src/app/api/studio/assets/resolve/route.ts` - Asset URL resolver
- `src/app/api/studio/assets/proxy/route.ts` - CORS proxy for assets

**Key Integration Points:**
- Iframe ↔ Parent postMessage communication
- Asset resolution chain (registry → resolve → proxy → load)
- Babylon.js CDN script loading

### Analysis

The black screen issue has **multiple potential root causes** that may combine or occur independently:

#### Hypothesis 1: CDN Script Loading Failure (High Probability)

**Why This Occurs:**
The preview iframe loads 6 external scripts from `cdn.babylonjs.com`:
```javascript
// From preview-libraries.ts
IFRAME_SCRIPTS = [
  'https://cdn.babylonjs.com/babylon.js',
  'https://cdn.babylonjs.com/havok/HavokPhysics_umd.js',
  'https://cdn.babylonjs.com/gui/babylon.gui.min.js',
  'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
  // ... more
]
```

If any script fails to load (CDN slow, blocked by firewall, network issues), the user code fails silently because:

**Code Location:** `src/components/studio/PreviewFrame.tsx:147-175`
```javascript
window.addEventListener('error', function(e) {
  // Only catches runtime errors, NOT script loading failures
  const errorEl = document.getElementById('error-overlay');
  errorEl.textContent = 'Error: ' + e.message;
  // ...
});

try {
  ${assetScript}
  ${concatenatedCode}  // Fails if BABYLON is undefined
} catch (error) {
  // ...
}
```

The `window.error` listener catches runtime errors but **does NOT catch `<script src>` loading failures**. Script loading errors require a separate listener on each script tag.

#### Hypothesis 2: Duplicate Variable Declaration (Medium Probability)

**Why This Occurs:**
The issue mentions a "duplicate `ground` declaration error". This is a JavaScript runtime error that would:
1. Halt script execution at the point of duplicate declaration
2. Prevent the rest of the game code from running
3. Leave the canvas initialized but empty (black)

**Code Location:** User-generated game code (multi-file concatenation)
```javascript
// File 1: level.js
const ground = BABYLON.MeshBuilder.CreateGround("ground", ...);

// File 2: game.js (concatenated after)
const ground = something;  // SyntaxError: Identifier 'ground' has already been declared
```

The multi-file architecture in `PreviewFrame.tsx:59-64` concatenates files:
```javascript
function concatenateFiles(files: GameFileData[]): string {
    return [...files]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((f) => f.content)
        .join('\n\n');
}
```

This creates a single scope where duplicate `const` declarations fail.

#### Hypothesis 3: Iframe Sandbox Origin Issues (Medium Probability)

**Why This Occurs:**
The iframe uses `sandbox="allow-scripts"` which sets `window.location.origin` to `'null'`:

**Code Location:** `src/components/studio/PreviewFrame.tsx:260`
```jsx
<iframe
    sandbox="allow-scripts"
    srcDoc={iframeContent}
    // ...
/>
```

The asset loader validates message origins:

**Code Location:** `src/lib/studio/asset-loader.ts:142-143`
```javascript
// Validate origin - must match our own origin
if (event.origin !== window.location.origin && event.origin !== 'null') return;
```

While this seems correct, edge cases exist where:
- The parent sends to `'*'` when `event.origin === 'null'`
- Cross-origin validation may fail in specific browser configurations

#### Hypothesis 4: Asset Manifest Not Loaded (Medium Probability)

**Why This Occurs:**
The `PreviewTab` fetches the asset manifest before rendering:

**Code Location:** `src/components/studio/tabs/PreviewTab.tsx` (inferred from exploration)
```javascript
// Fetches from /api/studio/games/{gameId}/assets
const assetManifest = await fetch(...)
```

If this fetch fails or returns empty:
1. `assetManifest` is undefined
2. `generateAssetLoaderScript()` receives empty array
3. `ASSETS.list()` returns []
4. User code calling `ASSETS.load('key', scene)` fails with `ASSET_NOT_FOUND`

#### Hypothesis 5: Analytics Blocking is Incidental (Low Probability)

**Why This Occurs:**
`net::ERR_BLOCKED_BY_CLIENT` for PostHog is almost certainly an ad blocker. This:
- Should NOT affect first-party code
- Should NOT affect Babylon.js CDN
- Is likely a red herring

However, if PostHog initialization throws an uncaught error that's NOT caught, it could halt execution.

### Related Issues

- **CLAUDE.md Gotcha #6**: "Preview iframe auth: `srcdoc` iframe runs at origin `null`; cookies aren't available. Asset proxy must support token-based access and CORS headers."
- **CLAUDE.md Gotcha #7**: "R2 signed URLs: `R2_SIGNED_URL_TTL` should be set; fallback signing defaults to 900s when unset."

## Impact Assessment

**Scope:**
- All Hatch Studios users attempting to preview games
- Affects both new games and existing games

**Affected Features:**
- Game preview/testing workflow
- Asset loading in preview
- Development iteration cycle

**Severity Justification:**
High - Game preview is a core feature of Hatch Studios. Black screen prevents users from testing their games.

**Data/Security Concerns:**
- No data corruption risk
- No security implications
- Purely functional regression

## Proposed Fix

### Fix Strategy

Implement a multi-layered diagnostic and fix approach:

1. **Add script loading error detection** (addresses Hypothesis 1)
2. **Add diagnostics logging** for asset loading chain
3. **Add error boundary around user code** with better messaging
4. **Add pre-flight validation** for game code (duplicate declarations)

### Files to Modify

1. **`src/components/studio/PreviewFrame.tsx`**
   - Changes: Add `onerror` handlers to script tags, add script loading state
   - Reason: Detect and report CDN script loading failures

2. **`src/lib/studio/preview-libraries.ts`**
   - Changes: Add script load status tracking
   - Reason: Know which libraries are actually available

3. **`src/components/studio/tabs/PreviewTab.tsx`**
   - Changes: Add error states for manifest fetch failure
   - Reason: Surface asset manifest loading issues to user

4. **`src/lib/studio/asset-loader.ts`**
   - Changes: Add verbose logging mode, better error messages
   - Reason: Diagnose asset resolution chain failures

### Alternative Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **A: Script loading detection** | Direct fix for Hypothesis 1 | Doesn't address code errors |
| **B: Code linting pre-flight** | Catches duplicate declarations | Adds complexity, may have false positives |
| **C: Better error overlay** | Shows all errors clearly | Doesn't prevent errors |
| **D: Lazy script loading** | Only load what's needed | Major refactor, performance tradeoff |

**Recommended:** Approach A + C (script detection + better error overlay)

### Risks and Considerations

- **False positives:** Script timeout detection may fire on slow networks
- **Browser differences:** Script loading events vary by browser
- **Performance:** Additional error checking adds overhead

### Testing Requirements

**Test Cases Needed:**
1. Verify preview loads when CDN is available
2. Verify error message when CDN script fails to load
3. Verify duplicate declaration errors are caught and displayed
4. Verify asset loading works when manifest is populated
5. Verify error overlay shows for asset loading failures
6. Test with ad blocker enabled (PostHog blocked)

**Validation Commands:**
```bash
# Start dev server
bun dev

# Test in browser:
# 1. Open Hatch Studios
# 2. Create/open a game
# 3. Navigate to Preview tab
# 4. Open browser DevTools console
# 5. Look for [ASSETS], script loading logs

# Optional: Test with ad blocker
# - Enable uBlock Origin or similar
# - Verify preview still works
```

## Implementation Plan

### Phase 1: Diagnostics (Immediate)
1. Add console logging for script loading status
2. Add console logging for asset manifest fetch
3. Add console logging for postMessage communication
4. Deploy to staging and collect logs

### Phase 2: Script Loading Fix
1. Modify iframe HTML generation to add `onerror` handlers to script tags
2. Add loading state indicator
3. Show clear error when scripts fail to load

### Phase 3: Code Validation
1. Add pre-flight linting for common errors (duplicate declarations)
2. Show warnings before preview execution
3. Suggest AI fix for detected issues

### Phase 4: Error UX Improvements
1. Improve error overlay with categorized errors
2. Add "Copy Error" button for bug reports
3. Add retry mechanism for transient failures

---

## Diagnostic Experiments

To determine which hypothesis is correct, run these experiments:

### Experiment 1: CDN Availability
```javascript
// Add to browser console on preview page
['babylon.js', 'babylon.gui.min.js', 'babylonjs.loaders.min.js'].forEach(file => {
  fetch(`https://cdn.babylonjs.com/${file}`)
    .then(r => console.log(file, 'OK', r.status))
    .catch(e => console.error(file, 'FAILED', e));
});
```

### Experiment 2: Check BABYLON Global
```javascript
// In iframe console (right-click iframe → "Inspect")
console.log('BABYLON defined:', typeof BABYLON !== 'undefined');
console.log('BABYLON.GUI defined:', typeof BABYLON?.GUI !== 'undefined');
```

### Experiment 3: Check Asset Registry
```javascript
// In iframe console
console.log('ASSETS defined:', typeof ASSETS !== 'undefined');
console.log('Asset count:', ASSETS?.list?.()?.length ?? 'ASSETS not available');
```

### Experiment 4: Check Game Files
```javascript
// In parent page console
// This requires access to StudioContext - may need to expose for debugging
```

---

This RCA document should be used by `/implement-fix` command.

## Next Steps

1. Review this RCA document
2. Run diagnostic experiments above
3. Update this document with experiment results
4. Run: `/implement-fix #87` to implement the fix
5. Run: `/commit` after implementation complete
