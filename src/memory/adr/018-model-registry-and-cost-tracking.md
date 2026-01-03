# ADR-018: Model Registry and Inline Cost Tracking System

**Status:** Accepted
**Date:** 2025-12-31
**Deciders:** Antigravity (AI), Zenchant (User)

---

## Context

As the application moved towards an open-source, self-hosted model, tracking generation costs became critical for users to manage their budgets. Previously, model IDs and pricing were partially hardcoded or dispersed across components. 

Furthermore, a legacy transition from `flux-2-dev` to `black-forest-labs/flux.2-pro` caused runtime issues when encountering old data. 

Finally, an initial attempt at a "Batch Cost Summary" UI was found to be layout-breaking due to absolute positioning, necessitating a more integrated, inline approach.

---

## Decision

We implemented a centralized **Model Registry** and **Cost Tracking** system with several key components:

1.  **Centralized Model Registry (`lib/model-registry.ts`)**: A single source of truth for model metadata, capabilities, and pricing. It supports automated discovery via OpenRouter's `/models` endpoint with a TTL-based cache.
2.  **Robust Cost Tracker (`lib/cost-tracker.ts`)**: Logic to estimate costs based on registry pricing and track *actual* costs by syncing with server-side response headers (provided by OpenRouter).
3.  **Flux 2 Pro Migration**: Standardized all generation to use `black-forest-labs/flux.2-pro`. Implemented a fallback mechanism in `style-anchor-generator.ts` to handle legacy `flux-2-dev` model IDs.
4.  **Inline UI Integration**: Removed the standalone `CostSummaryCard` and moved cost metrics directly into the `BatchControlsBar`. 
5.  **Est. → Total Transition**: The UI displays "Est: $X.XXX" (white) during planning and transitions to "Total: $X.XXX" (green) once actual costs are synced from the API.

---

## Consequences

### Positive

*   **Improved UX**: The cost display is non-intrusive and respects the application's relative layout units.
*   **Data Accuracy**: Users see actual costs fetched from OpenRouter rather than just estimates.
*   **Maintainability**: Adding new models or updating pricing happens in one file (`model-registry.ts`) or via API discovery.
*   **Resilience**: Legacy data no longer crashes the image generator thanks to the fallback logic.

### Negative

*   **Complexity**: Passing cost data from `GenerationQueue` down through `GenerationLayoutProvider` to the toolbar adds some prop-drilling/context complexity.
*   **API Dependency**: Actual costs depend on OpenRouter providing the `x-or-cost` header reliably.

### Neutral / Trade-offs

*   **Offline Estimates**: When the registry cannot reach the API, it falls back to a curated hardcoded list, which might become slightly out of sync with real-time price changes.

---

## Alternatives Considered

### Alternative 1: Floating Overlay Card
*   **Pros:** Highly visible, can show more detailed breakdowns.
*   **Cons:** Destroyed the responsive layout by using fixed/absolute positioning; felt "shoved in" rather than integrated.
*   **Why rejected:** User explicitly requested removal due to layout issues.

### Alternative 2: Per-Asset Cost Only
*   **Pros:** Contextual to the specific image.
*   **Cons:** Makes it hard to see the "damage" of a large batch generation before hitting the generate button.
*   **Why rejected:** We kept per-asset costs in the carousel but added the aggregate total to the toolbar for better budget awareness.

---

## Implementation Notes

*   Registry implements `ENABLE_AUTO_MODEL_DISCOVERY` flag for flexibility.
*   Costs are formatted to 3 or 4 decimal places given the low cost of individual generations.
*   Fallback logic in `generateStyleAnchor`:
    ```typescript
    const model = getModelById(fluxModel) || getDefaultModel();
    ```

---

## Review Schedule

Review after 1 month of open-source usage to see if users request more detailed "Budget History" beyond the current session total.

---

## References

*   [ADR-016: Generation UI Batch Redesign](file:///c:/Users/Zenchant/Asset-Hatch/src/memory/adr/016-generation-ui-batch-redesign.md)
*   [Model Registry Implementation](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/model-registry.ts)
*   [Cost Tracker Implementation](file:///c:/Users/Zenchant/Asset-Hatch/src/lib/cost-tracker.ts)
