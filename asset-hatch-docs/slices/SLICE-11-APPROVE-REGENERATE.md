# Slice 11: Approve or Regenerate an Asset

## User Story
**As a user, when I see a generated asset, I can approve it or regenerate it for a different result.**

## What This Slice Delivers
- Approve button marks asset as approved
- Regenerate button generates new version
- Keep both versions (original + regenerated)
- Seed display for reproducibility

## Acceptance Criteria
- [ ] Generated asset shows "Approve" and "Regenerate" buttons
- [ ] Click "Approve" → asset marked approved, buttons disappear
- [ ] Click "Regenerate" → new image generated (different seed)
- [ ] Can see seed number that was used
- [ ] Can choose "Regenerate with Same Seed" for identical result
- [ ] Previous versions still accessible

## Files Created/Modified
```
components/
└── generation/
    ├── AssetCard.tsx                # MODIFY: Add approve/regenerate
    └── AssetVersions.tsx            # NEW: Show version history

lib/
└── db.ts                            # MODIFY: Add generation_log table
```

## Prompt for AI Agent

```
Add approve/regenerate workflow for generated assets.

DATABASE UPDATE (lib/db.ts):
Add generation_log table for history:

```typescript
export interface GenerationLogEntry {
  id: string;
  project_id: string;
  entity_id: string;
  asset_id: string;
  prompt: string;
  seed: number;
  model: string;
  success: boolean;
  timestamp: string;
  duration_ms: number;
}

// Update schema
this.version(4).stores({
  projects: 'id, phase, created_at',
  memory_files: 'id, project_id, type, updated_at',
  assets: 'id, project_id, entity_id, category, created_at',
  generation_log: 'id, project_id, entity_id, timestamp'
});
```

ASSET CARD UPDATE (components/generation/AssetCard.tsx):
Update to show approve/regenerate for generated assets:

When asset exists and not approved:
- Show image thumbnail
- Show seed number: "Seed: 12345"
- "Approve" button (green/primary)
- "Regenerate" button (secondary)
- "Same Seed" checkbox next to regenerate

On Approve:
1. Update asset.approved = true in IndexedDB
2. Show success feedback (checkmark, "Approved!")
3. Disable both buttons, show "Approved ✓" badge

On Regenerate:
1. Generate new seed (unless "Same Seed" checked)
2. Call /api/generation with prompt + seed
3. Save NEW asset record (don't overwrite)
4. Link new asset to same entity_id
5. Show new image (most recent)
6. Keep old version in database

When asset approved:
- Show image with "Approved ✓" badge
- No buttons (or small "Regenerate" if they change mind)

ASSET VERSIONS (components/generation/AssetVersions.tsx):
Show history of generations for an entity:

- Thumbnail grid of all versions
- Click to view full size
- Show which one is approved (if any)
- Show seed for each version
- Can approve a different version

GENERATION LOGGING:
Update generation page to log every generation:

```typescript
const logEntry: GenerationLogEntry = {
  id: crypto.randomUUID(),
  project_id: project.id,
  entity_id: entity.id,
  asset_id: newAsset.id,
  prompt: promptUsed,
  seed: seedUsed,
  model: 'flux-schnell',
  success: true,
  timestamp: new Date().toISOString(),
  duration_ms: endTime - startTime
};
await db.generation_log.add(logEntry);
```

SEED HANDLING:
- Generate random seed: Math.floor(Math.random() * 2147483647)
- Pass seed to API (if supported by model)
- Store seed in asset record
- Same seed + same prompt = same image (reproducible)

VERIFY:
1. Generate an asset (from Slice 10)
2. See Approve and Regenerate buttons
3. See seed number displayed
4. Click "Regenerate" (without Same Seed)
5. New image appears with different seed
6. Both versions exist (can view old one)
7. Click "Approve" on newer version
8. See "Approved ✓" badge
9. Buttons disabled/hidden
10. Check generation_log table - entries for both generations
```

## How to Verify

1. Have a generated asset
2. See seed number displayed
3. Click "Regenerate"
4. New (different) image appears
5. See new seed number
6. Click on old version thumbnail
7. Can view original image
8. Click "Approve" on current version
9. Asset shows approved badge
10. Generate another asset - log has all entries

## What NOT to Build Yet
- No batch generation (Slice 12)
- No queue system (Slice 12)
- No progress bar (Slice 13)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
