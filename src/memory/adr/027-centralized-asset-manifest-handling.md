# ADR-027: Centralized Asset Manifest Handling

**Status:** Accepted
**Date:** 2026-01-21
**Deciders:** Antigravity, User

---

## Context

Inside the Hatch Studios editor, multiple components (e.g., `PreviewTab`, `AssetsTab`, `StudioHeader`) need access to the game's asset manifest to display asset counts, list available assets, or load them into the Babylon.js scene.

Initially, these components were fetching the manifest independently, leading to:
1.  **Redundant API Calls:** Multiple network requests for the same data on mount.
2.  **State Inconsistency:** If one component triggered a sync, others wouldn't know unless they re-fetched.
3.  **Complex Error Handling:** Each component had to implement its own loading/error UI for the same failure point.

---

## Decision

We decided to centralize the asset manifest state and fetching logic in the `StudioProvider` (via `StudioContext`).

Key implementations:
- Added `assetManifest`, `manifestLoading`, and `manifestError` states to `StudioProvider`.
- Implemented a centralized `fetchAssets` callback.
- Automatically trigger `fetchAssets` in `StudioProvider` whenever the `game.id` changes.
- Refactored `PreviewTab` and `AssetsTab` to consume this shared state instead of managing it locally.

---

## Consequences

### Positive

*   **Performance:** Reduced network overhead by fetching the manifest once and sharing it.
*   **Consistency:** Data is always in sync across the entire Studio UI.
*   **Maintainability:** Centralized error handling and fetching logic makes it easier to add features like auto-retry or WebSocket-based updates later.
*   **Cleaner UI:** Components are now "thinner" and focused on presentation.

### Negative

*   **Context Bloat:** Adding more state to the main `StudioProvider` increases the size of the context object.
*   **Rerender Surface:** Changes to the manifest will trigger rerenders for all components consuming `useStudio` (mitigated by memoization where appropriate).

### Neutral / Trade-offs

*   **Initial Load:** The manifest is now fetched as soon as the Studio loads, regardless of whether the user is on the Assets tab or Preview tab. Since the header needs the count, this is acceptable.

---

## Alternatives Considered

### Alternative 1: Local State with Sync Events
*   **Pros:** Keeps context small.
*   **Cons:** Requires an event bus or complex prop drilling to keep components in sync. Highly error-prone.
*   **Why rejected:** Too complex for the scale of this data.

---

## Implementation Notes

- Use `import('../types/unified-project').AssetManifest` in `context.ts` to avoid circular dependencies if any.
- Use `useEffect` in the provider for the initial fetch.

[GitHub Issue #87 - Part 4]

---

## Review Schedule

Review if the manifest becomes too large for a single JSON fetch (e.g., >1000 assets).

---

## References

*   [Implementation Plan](file:///C:/Users/Zenchant/.gemini/antigravity/brain/d0c95202-7901-4151-b67a-4bbdbcfb2bcd/implementation_plan.md)
*   [StudioProvider.tsx](file:///c:/Users/Zenchant/Asset-Hatch/src/components/studio/StudioProvider.tsx)
