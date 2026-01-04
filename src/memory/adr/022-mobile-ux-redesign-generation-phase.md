# 022. Mobile UX Redesign: Asset Generation Phase

Date: 2026-01-02

## Status

Accepted

## Context

The "Asset Generation" screen (v2.1) had several usability gaps on mobile:
1. **Vertical Space**: The category-based queue ( `CategoryQueuePanel`) was too tall and consumed too much vertical space with category headers.
2. **Model Selector Accessibility**: The model selector was buried in the `BatchControlsBar`, making it hard to find on small screens.
3. **Touch Targets**: Many interactive elements were smaller than the recommended 48px touch target.
4. **Layout Inconsistency**: Missing a persistent bottom action bar that matched the other phases.

## Decision

We have implemented several mobile-centric components and layout changes to the Generation phase.

### 1. Flat Asset List (`FlatAssetList`)
- Replaced the hierarchical/category-grouped list with a simplified flat list on mobile.
- This reduces vertical "junk" (repeated category headers) and focuses on the assets themselves.
- Implementation: `src/components/generation/panels/FlatAssetList.tsx`.

### 2. Tabbed Panel Navigation (`MobileLayout`)
- Added a mode selector (Tabs) to the mobile layout to switch between the "Queue/Grid" and the "Preview/Log".
- This ensures that each view can take up the maximum available space without pixel-hunting.

### 3. Dedicated Models Modal (`ModelsPanel`)
- Instead of an inline dropdown, we created a dedicated `ModelsPanel` component that opens as a full-screen overlay (similar to Files/Assets).
- This provides large, tappable cards for each model, improving accessibility and clarity.
- Implementation: `src/components/ui/ModelsPanel.tsx`.

### 4. Sticky Unified Action Bar
- Added a sticky bottom bar to the `MobileLayout` that houses the `UnifiedActionBar`.
- This ensures that primary actions (Generate, Approve, Pause) are always within thumb reach.

## Consequences

### Positive
- **Improved Tappability**: Larger buttons and cards make the UI much easier to use with thumbs.
- **Scannability**: The flat asset list allows users to see more assets at once.
- **Task Focus**: Modal-based model selection prevents accidental layout shifts during dropdown interaction.

### Negative
- **Mode Switching**: Moving from Queue to Preview now requires a tab tap (though the sticky action bar mitigates this for common tasks).

## Implementation Details

### Components Created
- `src/components/generation/panels/FlatAssetList.tsx`
- `src/components/ui/ModelsPanel.tsx`

### Files Modified
- `src/components/generation/layouts/MobileLayout.tsx`: Updated to use `FlatAssetList` and added the sticky bottom bar.
- `src/components/generation/GenerationQueue.tsx`: Integrated `ModelsPanel` into the rendering tree.
- `src/components/generation/UnifiedActionBar.tsx`: Added `compact` prop for mobile-friendly rendering.
