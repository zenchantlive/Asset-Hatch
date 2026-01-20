# Feature: Skybox Approval Status Restore

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Restore persisted skybox approval status on refresh by wiring the stored `approvalStatus` from the 3D asset state into the skybox-specific UI, so the approval badge/buttons reflect the database state after reload.

## User Story

As a game developer using skybox generation
I want the skybox approval state to persist across page reloads
So that I can trust the approval UI and avoid re-approving already accepted skyboxes

## Problem Statement

Skybox assets persist `approvalStatus` in the database, and the 3D queue hydrates that status into `assetState`, but the skybox UI (`SkyboxSection`) never receives the initial approval status. As a result, the UI always defaults to `pending` after reload, causing mismatched state and potential user confusion.

## Solution Statement

Pass the persisted `assetState.approvalStatus` into `SkyboxSection` via a new prop wiring in `AssetDetailPanel3D`, and ensure that the skybox UI initializes its local approval state from that value on mount and when the selected skybox changes.

## Feature Metadata

**Feature Type**: Bug Fix
**Estimated Complexity**: Low
**Primary Systems Affected**: 3D generation UI (skybox)
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/components/3d/generation/AssetDetailPanel3D.tsx:126` - Skybox branch renders `SkyboxSection` without approval status.
- `src/components/3d/generation/SkyboxSection.tsx:50` - Defines `initialApprovalStatus` prop and initializes local approval state.
- `src/components/3d/generation/SkyboxSection.tsx:436` - Approval UI uses local `approvalStatus` state.
- `src/components/3d/generation/GenerationQueue3D.tsx:160` - Hydrates `approvalStatus` from the API into `assetState`.
- `src/components/3d/generation/types/3d-queue-types.ts:112` - `AssetDetailPanel3DProps` exposes `assetState` for wiring.
- `src/components/3d/generation/AssetActions3D.tsx:211` - Non-skybox approval UI uses `assetState.approvalStatus` (pattern to mirror).
- `src/app/api/projects/[id]/3d-assets/[assetId]/route.ts:35` - PATCH endpoint updates approval status in DB (source of truth).

### New Files to Create

- None.

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- None required; this is internal state wiring.

### Patterns to Follow

**Approval Status Source of Truth**

- Pattern: hydrate from API into `assetState` then render UI based on `assetState.approvalStatus`.
- Example: `AssetActions3D` uses `assetState.approvalStatus` for non-skybox assets (`src/components/3d/generation/AssetActions3D.tsx:211`).

**State Initialization from Props**

- Pattern: `SkyboxSection` accepts `initialApprovalStatus` and uses it for initial `useState` (`src/components/3d/generation/SkyboxSection.tsx:115`).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Confirm current skybox approval data flow and ensure `assetState.approvalStatus` is available at the skybox detail panel.

**Tasks:**

- Verify the skybox asset ID mapping (`projectId + "-skybox"`) matches the hydration logic in `GenerationQueue3D`.
- Confirm `assetState.approvalStatus` is set for skybox assets when fetched.

### Phase 2: Core Implementation

Wire the persisted approval status into the skybox UI.

**Tasks:**

- Update `AssetDetailPanel3D` skybox branch to pass `initialApprovalStatus={assetState.approvalStatus}` to `SkyboxSection`.
- Ensure `SkyboxSection` reacts if the selected asset changes (optional: set state on prop change if required by UI flow).

### Phase 3: Integration

Validate that state is consistent across refresh and after approval changes.

**Tasks:**

- Confirm that approving/rejecting skybox updates the DB via existing PATCH call and that a reload restores the correct UI state.
- Verify no regression in non-skybox approval UI.

### Phase 4: Testing & Validation

**Tasks:**

- Manual UI validation for skybox approval restore.
- Optionally add a lightweight unit test if there is existing React test coverage for 3D components (likely not required for this change).

---

## STEP-BY-STEP TASKS

### UPDATE `src/components/3d/generation/AssetDetailPanel3D.tsx`

- **IMPLEMENT**: Pass `initialApprovalStatus={assetState.approvalStatus}` to `SkyboxSection` in the skybox branch.
- **PATTERN**: Follow non-skybox approval UI which uses `assetState.approvalStatus` (`src/components/3d/generation/AssetActions3D.tsx:211`).
- **IMPORTS**: None.
- **GOTCHA**: `assetState.approvalStatus` may be `undefined`; `SkyboxSection` already handles `null`/`undefined` by defaulting to `pending`.
- **VALIDATE**: Manual check in UI (see validation commands).

### UPDATE `src/components/3d/generation/SkyboxSection.tsx`

- **IMPLEMENT**: If needed, add a `useEffect` to sync local `approvalStatus` when `initialApprovalStatus` changes (only if asset selection can change while component stays mounted).
- **PATTERN**: Keep local state initialization via `useState` as currently used (`src/components/3d/generation/SkyboxSection.tsx:115`).
- **IMPORTS**: `useEffect` from React if added.
- **GOTCHA**: Avoid resetting user UI mid-interaction if approval changes locally; only update on prop change.
- **VALIDATE**: Manual check in UI.

---

## TESTING STRATEGY

### Unit Tests

- None required unless there is existing coverage for 3D components; change is small and UI-driven.

### Integration Tests

- Manual integration: approve a skybox, refresh the page, and verify the approval badge persists.

### Edge Cases

- Skybox asset exists but `approvalStatus` is `null` → UI should default to `pending`.
- Skybox approval changes from approved/rejected back to pending → UI should reflect after refresh.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

- `bun run lint`
- `bun run typecheck`

### Level 2: Unit Tests

- `bun run test -- --testPathPattern="3d"` (only if tests exist)

### Level 3: Integration Tests

- `bun run test:ci` (optional; likely overkill for this change)

### Level 4: Manual Validation

- Run app, open a project with a skybox, approve it, reload, and confirm status persists.
- Confirm non-skybox approvals behave unchanged.

### Level 5: Additional Validation (Optional)

- None.

---

## ACCEPTANCE CRITERIA

- [ ] Skybox approval status is restored after page reload.
- [ ] Approval UI for skybox shows approved/rejected badge when persisted.
- [ ] Approval UI remains consistent with DB after a status change.
- [ ] No regressions to non-skybox asset approval flow.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] Manual testing confirms skybox approval state persists
- [ ] Lint/typecheck pass if run
- [ ] Code reviewed for quality and maintainability

---

## NOTES

- If `SkyboxSection` unmounts/remounts when switching assets, the `useEffect` sync may be unnecessary. Confirm component lifecycle before adding new effect.

**Confidence Score**: 8/10
