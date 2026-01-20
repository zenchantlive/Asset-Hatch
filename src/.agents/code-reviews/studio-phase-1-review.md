# Code Review: Hatch Studios Phase 1 Foundation

**Date:** 2026-01-17
**Scope:** `src` (Uncommitted Changes)

## Stats

- Files Modified: 6 (Schema, Tests, Configs)
- Files Added: 29 (Studio Foundation, API, Components)
- Files Deleted: 0

## Critical Issues

```
severity: critical
file: src/app/api/studio/chat/route.ts
line: N/A (Missing File)
issue: Missing API Route
detail: The file `src/app/api/studio/chat/route.ts` is referenced in `src/lib/studio/game-tools.ts` and `src/components/studio/ChatPanel.tsx` but does not exist in the file system or git tracking. This will cause the entire chat functionality to return 404.
suggestion: Create the route file implementing the AI SDK `streamText` response handling.
```

```
severity: critical
file: src/lib/studio/game-tools.ts
line: 557
issue: Syntax Error (Const Reassignment)
detail: In `generateCameraSetupCode`, the variable `camera` is declared as `const` at line 552, but reassigned inside the switch statement (`camera = new ...`) at lines 557, 561, and 565. This will throw a runtime error "Assignment to constant variable" when the generated code produces.
suggestion: Change line 552 to `let camera` or refactor to initialize `const camera` directly based on the type.
```

```
severity: critical
file: src/components/studio/ChatPanel.tsx
line: 101
issue: Syntax Error (TypeScript Generic)
detail: `message.parts as Array<{ type: string; text?: string } | undefined;` is missing the closing `>`.
suggestion: Fix to `message.parts as Array<{ type: string; text?: string } | undefined>;`.
```

```
severity: critical
file: src/components/studio/ChatPanel.tsx
line: 108
issue: Reference Error
detail: The variable `textContent` is used in the condition `if (!textContent ...)` but is not defined in the scope. The variable defined at line 105 is named `text`.
suggestion: Rename `textContent` to `text`.
```

## High Severity Issues

```
severity: high
file: src/prisma/schema.prisma
line: 233
issue: Broken Referential Integrity (Game.activeSceneId)
detail: `activeSceneId` is defined as a `String?` without a `@relation`. While this avoids circular dependency constraints in Prisma, it creates a risk where a Game points to a non-existent Scene if the Scene is deleted directly.
suggestion: Ensure application logic (DELETE /scenes) explicitly updates the parent Game's `activeSceneId` to null or another scene. Consider adding a runtime check in `GET /game`.
```

```
severity: high
file: src/prisma/schema.prisma
line: 290
issue: Broken Referential Integrity (AssetPlacement.assetRefId)
detail: `assetRefId` is a raw string without a relation to `GameAssetRef`. If a `GameAssetRef` is deleted (e.g., removing an asset from a game), the placements will remain as orphans, potentially crashing the renderer when it tries to load the asset.
suggestion: basic relation: `assetRef GameAssetRef @relation(fields: [assetRefId], references: [id], onDelete: Cascade)` to ensure placements are removed when the reference is removed.
```

```
severity: high
file: src/components/studio/ChatPanel.tsx
line: 24
issue: UI State Desynchronization
detail: The `onToolCall` callback only logs tool executions (`console.log`). It does not update the `StudioContext`. For example, if the AI calls `switchScene`, the database is updated, but the UI component `StudioProvider` is unaware, so the `activeSceneId` state remains stale, and the user sees the old scene.
suggestion: Inject `StudioContext` methods (e.g. `refreshPreview()`, `setActiveTab()`, a new `refreshGameData()` method) into the `ChatPanel` and call them in the `onToolCall` handlers.
```

## Medium Severity Issues

```
severity: medium
file: src/app/api/studio/games/[id]/route.ts
line: 160
issue: Insecure Scene Assignment
detail: The PATCH endpoint allows updating `activeSceneId` to any UUID provided in the body (`z.string().uuid()`). There is no check that the target scene actually belongs to the user's game. A malicious user could set the active scene to a scene ID from another user's game (if they guess the UUID), potentially causing data leakage or errors.
suggestion: Add a query to verify `prisma.gameScene.findFirst({ where: { id: activeSceneId, gameId: params.id } })` before updating.
```

```
severity: medium
file: src/components/studio/AssetBrowser.tsx
line: 200
issue: Feature Gap (Asset Import)
detail: The "Use in Game" button is disabled with "Phase 3" text. However, the `placeAsset` tool in `game-tools.ts` relies on `prisma.gameAssetRef.findFirst`, which implies assets must be *already imported* (referenced) before they can be placed. With the button disabled, there is no way to create these references, rendering the `placeAsset` tool unusable for new assets.
suggestion: Either enable a basic "Import" action in `AssetBrowser` (creating the `GameAssetRef`) or modify `placeAsset` tool to auto-import the asset if missing (requires passing project/type info).
```

```
severity: medium
file: src/app/api/studio/assets/route.ts
line: 28
issue: Implementation Gap (2D Assets)
detail: The API accepts `type=2d` query param, but only fetches from `Generated3DAsset` (`assets3D` variable). 2D assets are ignored, returning empty results for `type=2d`.
suggestion: Implement fetching from `GeneratedAsset` (or equivalent 2D table) or document that this is 3D-only for Phase 1.
```

## Code Quality & Standards

```
severity: low
file: src/lib/studio/game-tools.ts
line: 552
issue: Code Injection Risk / Fragility
detail: The `generateCameraSetupCode` uses string concatenation for code generation. This is fragile and hard to maintain.
suggestion: Since the logic is simple, it's acceptable for now, but strict escaping of `target` (mesh name) is recommended to prevent code injection if mesh names contain quotes.
```
