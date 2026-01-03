# ADR-015: Hybrid Persistence Synchronization Fixes

**Status:** Implemented  
**Date:** 2025-12-29  
**Commit:** `a0a486e`

---

## Context

The Asset Hatch application uses a **hybrid persistence model** where:
- **Dexie (IndexedDB)**: Client-side database for UI state and real-time updates
- **Prisma (SQLite)**: Server-side database, source of truth for API routes

This dual-database architecture enables offline-first UX while maintaining server-side consistency for operations like export, style anchor generation, and cross-device sync.

### Problem Discovered

Three critical synchronization gaps were discovered during export testing:

1. **Quality Parameters Not Syncing**: When the AI updated project qualities (e.g., `perspective: "side-view"`), the update only affected React state and Prisma. **Dexie was not updated**, causing `GenerationQueue` to read stale values when building prompts.

2. **Approved Assets Not in Prisma**: When users approved generated assets, they were only saved to Dexie. The **export API queries Prisma**, causing "No approved assets to export" errors even when assets existed client-side.

3. **Export Plan Parsing Error**: The export API attempted `JSON.parse()` on `entities.json`, which contains **markdown** (not JSON), causing `SyntaxError: Unexpected token '#'`.

### Impact

- Generated asset prompts used outdated parameters (e.g., "top-down" instead of "side-view")
- Export functionality completely broken - could not find approved assets
- Export crashed when attempting to process asset plan

---

## Decision

Implement immediate synchronization for all state changes that affect server-side APIs:

### 1. Quality Parameter Synchronization
**File:** `app/project/[id]/planning/page.tsx`

Make `handleQualityUpdate` save to Dexie immediately when AI updates a quality:

```typescript
const handleQualityUpdate = async (qualityKey: string, value: string) => {
  // 1. Update local state immediately (for UI reactivity)
  setQualities(prev => ({ ...prev, [qualityKey]: value }));

  // 2. Save to Dexie immediately (so GenerationQueue can read it)
  const projectId = params.id;
  if (typeof projectId === 'string') {
    try {
      await updateProjectQualities(projectId, { [qualityKey]: value });
      console.log('✅ Quality saved to Dexie:', qualityKey);
      
      // 3. The AI tool already saved to Prisma server-side
      // No need to sync again here
    } catch (error) {
      console.error("Failed to save quality to Dexie:", error);
    }
  }
};
```

**Before:** React state ✅ | Prisma ✅ | Dexie ❌  
**After:** React state ✅ | Prisma ✅ | Dexie ✅

### 2. Approved Asset Synchronization
**Files:** `components/generation/GenerationQueue.tsx`, `app/api/generated-assets/route.ts` (new)

#### Client-Side: Add Prisma Sync
Make `approveAsset` sync to Prisma after saving to Dexie:

```typescript
// Save to Dexie (existing)
await db.generated_assets.add({...});

// NEW: Sync to Prisma (server) so export API can find it
try {
  const arrayBuffer = await blob.arrayBuffer()
  const base64Image = Buffer.from(arrayBuffer).toString('base64')

  await fetch('/api/generated-assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: state.result.id,
      projectId: projectId,
      assetId: assetId,
      imageBlob: base64Image,
      promptUsed: state.result.prompt,
      seed: state.result.metadata.seed,
      metadata: state.result.metadata,
      status: 'approved',
    }),
  })
  
  addLogEntry('info', `Asset synced to server: ${asset.name}`)
} catch (syncError) {
  console.error('Failed to sync approved asset to server:', syncError)
  addLogEntry('error', `Asset approved locally but not synced to server`)
}
```

#### Server-Side: Create Sync Endpoint
**New file:** `app/api/generated-assets/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const { id, projectId, assetId, imageBlob, promptUsed, seed, metadata, status } = await req.json();

  // Convert base64 to Buffer for Prisma Bytes field
  const buffer = Buffer.from(imageBlob, 'base64');

  // Upsert to Prisma
  const generatedAsset = await prisma.generatedAsset.upsert({
    where: { id },
    update: {
      imageBlob: buffer,
      promptUsed: promptUsed || '',
      seed: seed || 0,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
      status: status || 'approved',
      updatedAt: new Date(),
    },
    create: {
      id,
      projectId,
      assetId,
      imageBlob: buffer,
      promptUsed: promptUsed || '',
      seed: seed || 0,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
      status: status || 'approved',
    },
  });

  return NextResponse.json({ success: true, id: generatedAsset.id });
}
```

**Before:** Dexie ✅ | Prisma ❌  
**After:** Dexie ✅ | Prisma ✅

### 3. Export Plan Parsing Fix
**File:** `app/api/export/route.ts`

Replace `JSON.parse()` with plan parser to handle markdown content:

```typescript
// BEFORE: Crashed with SyntaxError
const entities = JSON.parse(entitiesFile.content); // ❌ entities.json is markdown!

// AFTER: Parse markdown plan using plan parser
const { parsePlan } = await import('@/lib/plan-parser');
const parsedAssets = parsePlan(entitiesFile.content, {
  mode: 'granular', // Generate individual assets
  projectId: projectId,
});

// Process each generated asset
for (const generatedAsset of generatedAssets) {
  const parsedAsset = parsedAssets.find(a => a.id === generatedAsset.assetId);
  
  if (!parsedAsset) {
    console.warn(`Parsed asset not found for: ${generatedAsset.assetId}`);
    continue;
  }
  
  // Use parsedAsset.category, parsedAsset.name, etc.
  const semanticId = generateSemanticId(parsedAsset);
  // ...
}
```

**Before:** Crash on `JSON.parse()` of markdown  
**After:** Correctly parses markdown plan to structured data

---

## Rationale

### Why Immediate Sync?

**Option 1:** Batch sync on page navigation  
❌ Creates data inconsistency window  
❌ Confusing user experience (changes appear to save but don't work)  
❌ Hard to debug race conditions

**Option 2:** Immediate sync on state change ✅  
✅ Ensures consistency at all times  
✅ Predictable behavior for users  
✅ Server APIs always have current data  
✅ Minimal performance impact (only on write operations)

### Why Not Unify to Single Database?

**Dexie advantages:**
- Offline-first capability
- Instant UI updates
- No server round-trip delay
- Larger storage capacity for images

**Prisma advantages:**
- Cross-device sync
- Server-side operations (export, email)
- Backup and recovery
- SQL queries for analytics

**Hybrid model is optimal** when synchronization is handled correctly.

---

## Implementation Details

### Data Flow: Quality Parameters

```
User changes "top-down" to "side-view" in dropdown
   ↓
QualitiesBar.onQualitiesChange() fires
   ↓
planning/page.tsx handleParametersSave()
   ↓
AI re-prompted: "I've updated the project parameters..."
   ↓
AI calls updateQuality tool (server-side)
   ↓
Prisma.project.update() ✅
   ↓
Tool result → onToolCall → onQualityUpdate
   ↓
React setState ✅
   ↓
NEW: updateProjectQualities() → Dexie ✅
   ↓
GenerationQueue reads current perspective from Dexie
   ↓
Prompts generated with "side-view" ✅
```

### Data Flow: Approved Assets

```
User clicks "Approve" on generated asset
   ↓
GenerationQueue.approveAsset() called
   ↓
Convert data URL to Blob
   ↓
db.generated_assets.add() → Dexie ✅
   ↓
NEW: Convert Blob to base64
   ↓
NEW: POST /api/generated-assets
   ↓
NEW: Prisma.generatedAsset.upsert() ✅
   ↓
Both databases synchronized
   ↓
User navigates to Export tab
   ↓
Export API queries Prisma.generatedAsset.findMany()
   ↓
Assets found ✅ → ZIP generation succeeds
```

### Data Flow: Export Plan Parsing

```
User clicks "Download Asset Pack"
   ↓
POST /api/export
   ↓
Fetch entities.json from Prisma.memoryFile
   ↓
OLD: JSON.parse(markdown) → SyntaxError ❌
NEW: parsePlan(markdown) → ParsedAsset[] ✅
   ↓
For each generatedAsset, find matching parsedAsset
   ↓
Generate semanticId, categoryFolder, metadata
   ↓
Build ZIP with manifest.json
   ↓
Download succeeds ✅
```

---

## Consequences

### Positive

✅ **Consistency:** Dexie and Prisma always in sync  
✅ **Reliability:** Export works immediately after approval  
✅ **Correctness:** Prompts use current quality parameters  
✅ **Predictability:** No race conditions or stale data  
✅ **Debuggability:** Clear sync points with logging  

### Negative

⚠️ **Network Dependency:** Asset approval requires server connection  
⚠️ **Latency:** Small delay for sync (mitigated by async/await)  
⚠️ **Error Handling:** Need robust handling for failed syncs  

### Mitigation Strategies

1. **Offline Queue:** Future enhancement to queue sync operations when offline
2. **Optimistic UI:** Update UI immediately, sync in background
3. **Retry Logic:** Implement exponential backoff for failed syncs
4. **User Feedback:** Show sync status in UI ("Saving...", "Saved", "Sync failed")

---

## Testing Validation

### Quality Parameter Sync
```
✅ TypeScript compilation passed
✅ Linting passed
✅ Manual test: Change perspective → verify prompt uses new value
```

### Approved Asset Sync
```
✅ Created /api/generated-assets endpoint
✅ Asset approval saves to both Dexie and Prisma
✅ Export finds assets in Prisma
```

### Export Plan Parsing
```
✅ parsePlan() correctly converts markdown to ParsedAsset[]
✅ Export API processes plan without errors
✅ ZIP generation completes successfully
```

---

## Related ADRs

- **ADR-007:** Hybrid Persistence Model (established the dual-database architecture)
- **ADR-014:** Single-Asset Export Strategy (defines export requirements)
- **ADR-012:** Hybrid Session Persistence (URL + localStorage + Dexie + Prisma)

---

## References

- Commit: `a0a486e` - "fix: sync quality parameters, approved assets, and export plan parsing"
- Files Modified:
  - `app/project/[id]/planning/page.tsx`
  - `components/generation/GenerationQueue.tsx`
  - `app/api/generated-assets/route.ts` (new)
  - `app/api/export/route.ts`
  - `components/export/ExportPanel.tsx`
