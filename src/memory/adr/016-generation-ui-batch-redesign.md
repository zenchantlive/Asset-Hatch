# ADR-016: Generation UI "Batch Dashboard" Redesign

**Status:** Accepted  
**Date:** 2025-12-29  
**replaces:** ADR-015 (Conflicted ID)

---

## Context

The initial generation UI was designed for single-asset creation. As users began creating entire asset libraries (20-30+ items), the interface became a bottleneck. The "List View" approach for categories scaled poorly, and the lack of batch context made managing multiple generations difficult.

We needed a UI that could handle:
1.  **High-Volume Queues:** Displaying dozens of assets without clutter.
2.  **Batch Actions:** "Generate All", "Batch Approve".
3.  **Responsive Layouts:** Accommodating the complex 3-pane needs (Categories, Preview, Asset Bar) on various screen sizes.
4.  **Visual Polish:** A "premium" feel with smooth animations and grid layouts.

## Decision

We have implemented a **"Batch Dashboard"** architecture (v2.1) with the following core components:

### 1. The "Batch Dashboard" Pattern
Instead of a simple list, the main preview area transforms based on selection context:
-   **Single Selection:** Shows large preview + detailed controls (Classic View).
-   **Small Batch (2-3 items):** Shows a **2x2 Grid** of square cards (`aspect-square`).
-   **Large Batch (4+ items):** Shows a **Category-Grouped Accordion View**, where each category expands into the same 2-column grid.

### 2. Layout Structure (`DesktopLayout`)
We moved from a rigid 3-column split to a flexible **Resizable + Overlay** model:
-   **Left Sidebar (Resizable):** Dedicated to the `CategoryQueuePanel`. Resizable to user preference (15-50%).
-   **Main Area:** Holds the `PreviewPanel` (or Batch Dashboard).
-   **Bottom Asset Bar:** A horizontal, minimizable strip for quick navigation and status tracking.
    -   *Logic:* Overlays the preview area or stacks, depending on state? (Decided: Flex stack, but interactive elements overlay).
    -   *Responsiveness:* Uses `gap-dynamic` and distinct visual markers (dots vs thumbnails).

### 3. Grid Enforcement
To ensure visual consistency:
-   **Card Aspect Ratio:** Strictly `aspect-square`.
-   **Columns:** Strictly `grid-cols-2` for all batch views. 
    -   *Rationale:* 3+ columns became too small for detailed sprite previewing; 1 column was too inefficient.
-   **Sizing Constraints:** Added `max-w` constraints (e.g., `max-w-[80vh]`) to prevent 2x2 grids from becoming comically large on ultra-wide monitors.

### 4. Responsiveness Strategy
-   **Mobile:** Collapses sidebars into drawers/modals (planned/partial).
-   **Desktop:** Fluid flex layouts.
-   **Animation:** Use of `animate-in`, `fade-in`, and standard `cubic-bezier` transitions for high-polish feel without heavy runtime libraries (framer-motion avoidance).

## Consequences

### Positive
-   **Scalability:** UI now gracefully handles 1 to 100+ assets.
-   **Clarity:** "Batch Mode" is distinctly different from "Single Mode", reducing user confusion.
-   **Aesthetics:** Square grids and animations align with the "Premium/Vibrant" design goal.

### Negative
-   **Layout Complexity:** Managing `resize` listeners and `flex` vs `absolute` positioning for the Bottom Bar introduced regressions (fixed by removing overflow constraints).
-   **Component Weight:** `BatchPreviewContent` is now a heavier component with multiple sub-view states.

## Implementation Details
-   **Tech:** React, Tailwind CSS (Grid, Flex, Animate), Lucide Icons.
-   **State:** Controlled via `GenerationLayoutContext` and strict `GenerationContext` syncing.

