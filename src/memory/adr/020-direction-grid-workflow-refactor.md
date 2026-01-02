# 020. Direction Grid Workflow and UI Refactor

Date: 2026-01-02

## Status

Proposed - we are not suure if we enjoy this, or if we wul rather hve the buttons inside the area ot he righ of "direction mode" unclickable button thingy

## Context

The previous `DirectionGrid` implementation suffered from several UX and logic issues:
1.  **Cluttered UI**: Redundant "Generate" buttons on every idle card and complex hover overlays made the interface noisy and difficult to use on mobile devices.
2.  **Workflow Loopholes**: Users could generate side directions (Left, Right, Back) without first establishing a "Front" direction, leading to inconsistent character generation.
3.  **Broken Actions**: The local "Approve" and "Reject" buttons in the grid cells were not properly wired to the context, leading to non-functional controls.

## Decision

We have decided to refactor the `DirectionGrid` to enforce a strict "Front-First" workflow and consolidate UI controls.

### 1. Front-First Enforcement
- The "Front" direction is now the anchor for the entire character generation process.
- Generation of other directions (Left, Right, Back) is **strictly blocked** until the Front direction has been successfully generated and **approved**.
- This ensures that all subsequent directions have a confirmed visual reference to enforce consistency.

### 2. Consolidated UI Controls
- **Removed**: Individual "Generate" buttons from idle direction cards.
- **Removed**: Redundant "Batch Generation Bar" from the grid component (generation is now centralized in the `UnifiedActionBar`).
- **Moved**: "Approve", "Reject", and "Regenerate" actions for the *active* direction are now located in the **Active Direction Info** panel below the grid.
- **Simplified**: The grid cell overlay now only contains a "Maximize" button, reducing visual noise and improving touch targets on mobile.

### 3. Always-Visible Overlays
- On mobile and desktop, essential feedback (like status) is clearer. The interactable overlay elements (Maximize) appear on hover/interaction but don't block the view of the asset.

## Consequences

### Positive
- **Visual Consistency**: Enforcing the "Front" view as a prerequisite ensures better coherence across all character angles.
- **Cleaner UX**: reducing button clutter focuses the user on the primary task (reviewing the generated image).
- **Mobile Friendly**: Larger, persistent touch targets in the bottom panel are easier to use than hover-dependent buttons on small grid cells.
- **Unified Actions**: Centralizing generation triggers prevents confusion about which "Generate" button to press.

### Negative
- **Less "Click-and-Go"**: Users must strictly follow the Front -> Others order, which reduces flexibility if they wanted to experiment with a side view first. (Mitigated by the fact that consistency is the primary goal).
