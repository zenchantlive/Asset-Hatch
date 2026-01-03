# 021. Mobile UX Redesign: Planning & Style Phases

Date: 2026-01-02

## Status

Accepted

## Context

The initial implementation of the Planning and Style phases attempted to maintain a 50/50 split between the AI chat and the content preview on all screen sizes. On mobile devices, this created a severely degraded experience:
1. **Cramped Interface**: Chat bubbles were too narrow to read comfortably, and preview content was scaled down to the point of being unusable.
2. **Context Switching**: Users couldn't focus on either the conversation or the content effectively.
3. **Broken Tool Call UX**: When the AI triggered a tool call (e.g., updating the plan), the screen would often jump or overlap in a way that hid the resulting changes from the user.
4. **Input Displacement**: The on-screen keyboard would often hide the very elements the user was trying to discuss with the AI.

## Decision

We have decided to move away from the persistent split-screen model on mobile in favor of a **Chat-First** architecture with **Slide-out Overlays**.

### 1. Chat-First Layout
- On mobile devices, the `ChatInterface` is now the default, full-width view.
- This ensures the primary interaction method (dialogue with the AI) is comfortable and readable.

### 2. Full-Screen Preview Panels
- Content previews (Plan and Style) are now accessed via prominent toggles in the mobile toolbar.
- When activated, these previews open in full-screen sliding overlays (`PlanPanel` and `StylePanel`).
- These panels use `inset-0` to maximize screen real estate and matching the established pattern used for "Assets" and "Files".

### 3. Integrated AI Interaction (CompactChatInput)
- To eliminate the need for constant "toggling" between the preview and the main chat, we created the `CompactChatInput` component.
- This component is embedded directly at the bottom of the `PlanPanel` and `StylePanel`.
- It allows users to suggest changes and provide feedback to the AI while looking directly at the content.

### 4. Background Tool Processing
- The main `ChatInterface` remains mounted in the background while preview panels are open.
- This ensures that tool calls triggered from the `CompactChatInput` are processed correctly by the main AI stream without losing state.

## Consequences

### Positive
- **Readability**: Chat and content are both allowed to take up the full screen width.
- **Improved Workflow**: Users can refine their plan/style with immediate visual feedback without leaving the preview.
- **Consistency**: Matches existing mobile patterns for the "Assets" and "Files" menus.
- **Premium Feel**: Slide transitions and dedicated panels provide a more "app-like" experience.

### Negative
- **Hidden State**: The main chat history is hidden while viewing a preview (partially mitigated by the integrated input).
- **Complexity**: Managing visibility states for multiple overlapping panels.

## Alternatives Considered

### Alternative 1: Accordion/Collapsible Sections
- **Pros**: Kept both views on one scrollable page.
- **Cons**: Still felt cramped; required too much vertical scrolling to find the input box.

### Alternative 2: Bottom Sheets
- **Pros**: Modern mobile feel.
- **Cons**: Difficult to fit complex components like `PlanPreview` (which has nested lists and details) into a partial-height sheet.

## Implementation Details

### Components Created
- `src/components/ui/PlanPanel.tsx`: Full-screen overlay for `PlanPreview`.
- `src/components/ui/StylePanel.tsx`: Full-screen overlay for `StylePreview`.
- `src/components/ui/CompactChatInput.tsx`: Simplified text input for usage within panels.

### Files Modified
- `src/app/project/[id]/planning/page.tsx`: Centralized state management for panel visibility and integrated mobile toolbar buttons.
