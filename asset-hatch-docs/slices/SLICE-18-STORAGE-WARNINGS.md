# Slice 18: Storage Usage Warnings

## User Story
**As a user, I should see warnings when I'm running low on storage space, and be blocked from generating if storage is critically full.**

## What This Slice Delivers
- Storage usage calculation
- Warning at 80% capacity
- Block generation at 95% capacity
- Per-project storage display
- Suggestions for freeing space

## Acceptance Criteria
- [ ] Can see total storage used in dashboard
- [ ] Warning banner appears at 80% usage
- [ ] Critical banner appears at 95% usage
- [ ] Generation is blocked at 95% with helpful message
- [ ] Can see per-project storage breakdown
- [ ] Suggestions for freeing space (delete old projects, export & archive)

## Files Created/Modified
```
lib/
└── storage-monitor.ts               # NEW: Storage calculations

components/
└── common/
    └── StorageIndicator.tsx         # NEW: Usage display

app/
├── page.tsx                         # MODIFY: Add storage display
└── project/[id]/generation/page.tsx # MODIFY: Check before generation
```

## Prompt for AI Agent

```
Add storage monitoring and warnings.

STORAGE MONITOR (lib/storage-monitor.ts):
Calculate storage usage:

```typescript
const STORAGE_LIMIT_MB = 50;  // IndexedDB soft limit
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;
const WARNING_THRESHOLD = 0.8;   // 80%
const CRITICAL_THRESHOLD = 0.95; // 95%

export interface StorageInfo {
  used_bytes: number;
  used_mb: number;
  limit_mb: number;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
  projects: Array<{
    id: string;
    name: string;
    bytes: number;
    mb: number;
  }>;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  // Get all assets with their blob sizes
  const assets = await db.assets.toArray();
  
  // Calculate per-project usage
  const projectUsage = new Map<string, number>();
  
  for (const asset of assets) {
    const current = projectUsage.get(asset.project_id) || 0;
    const blobSize = asset.image_blob?.size || 0;
    projectUsage.set(asset.project_id, current + blobSize);
  }
  
  // Get project names
  const projects = await db.projects.toArray();
  const projectBreakdown = projects.map(p => ({
    id: p.id,
    name: p.name,
    bytes: projectUsage.get(p.id) || 0,
    mb: ((projectUsage.get(p.id) || 0) / (1024 * 1024)).toFixed(2)
  })).sort((a, b) => b.bytes - a.bytes);
  
  // Total usage
  const totalBytes = Array.from(projectUsage.values()).reduce((a, b) => a + b, 0);
  const percentage = totalBytes / STORAGE_LIMIT_BYTES;
  
  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (percentage >= CRITICAL_THRESHOLD) {
    status = 'critical';
  } else if (percentage >= WARNING_THRESHOLD) {
    status = 'warning';
  }
  
  return {
    used_bytes: totalBytes,
    used_mb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    limit_mb: STORAGE_LIMIT_MB,
    percentage: Math.round(percentage * 100),
    status,
    projects: projectBreakdown
  };
}

export async function canGenerate(): Promise<{ allowed: boolean; message?: string }> {
  const info = await getStorageInfo();
  
  if (info.status === 'critical') {
    return {
      allowed: false,
      message: `Storage is ${info.percentage}% full. Please delete or archive old projects before generating more assets.`
    };
  }
  
  return { allowed: true };
}
```

STORAGE INDICATOR (components/common/StorageIndicator.tsx):
Display storage usage:

```typescript
interface StorageIndicatorProps {
  info: StorageInfo;
  showBreakdown?: boolean;
}

export function StorageIndicator({ info, showBreakdown = false }: StorageIndicatorProps) {
  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all",
              info.status === 'ok' && "bg-green-500",
              info.status === 'warning' && "bg-yellow-500",
              info.status === 'critical' && "bg-red-500"
            )}
            style={{ width: `${Math.min(info.percentage, 100)}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">
          {info.used_mb} / {info.limit_mb} MB
        </span>
      </div>
      
      {/* Warning banners */}
      {info.status === 'warning' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          <strong>Storage Warning:</strong> You're using {info.percentage}% of available space.
          Consider exporting and archiving old projects.
        </div>
      )}
      
      {info.status === 'critical' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
          <strong>Storage Critical:</strong> You're using {info.percentage}% of available space.
          You must free up space before generating more assets.
        </div>
      )}
      
      {/* Project breakdown */}
      {showBreakdown && info.projects.length > 0 && (
        <div className="text-sm">
          <h4 className="font-medium mb-1">Usage by project:</h4>
          {info.projects.slice(0, 5).map(p => (
            <div key={p.id} className="flex justify-between text-gray-600">
              <span>{p.name}</span>
              <span>{p.mb} MB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

DASHBOARD UPDATE (app/page.tsx):
Show storage in dashboard:

```typescript
const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

useEffect(() => {
  getStorageInfo().then(setStorageInfo);
}, [projects]); // Recalculate when projects change

// In render, above project list:
{storageInfo && (
  <div className="mb-6">
    <StorageIndicator info={storageInfo} showBreakdown />
  </div>
)}
```

GENERATION PAGE UPDATE (app/project/[id]/generation/page.tsx):
Check storage before generating:

```typescript
const handleStartGeneration = async () => {
  // Check storage first
  const check = await canGenerate();
  
  if (!check.allowed) {
    // Show blocking modal
    setStorageBlockMessage(check.message);
    return;
  }
  
  // Proceed with generation
  // ... existing generation code
};

// Storage block modal
{storageBlockMessage && (
  <Dialog open onOpenChange={() => setStorageBlockMessage(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Cannot Generate Assets</DialogTitle>
        <DialogDescription>{storageBlockMessage}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <p className="text-sm">To free up space, you can:</p>
        <ul className="text-sm list-disc list-inside">
          <li>Delete old projects from the dashboard</li>
          <li>Export projects and remove them locally</li>
          <li>Clear your browser's IndexedDB storage</li>
        </ul>
      </div>
      <DialogFooter>
        <Button onClick={() => router.push('/')}>
          Go to Dashboard
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

VERIFY:
1. Go to dashboard
2. See storage indicator (should be near 0% if new)
3. Generate 20+ assets in a project
4. See storage increase
5. Create test data to approach 80% (or modify threshold temporarily)
6. See yellow warning banner
7. Push to 95%+
8. See red critical banner
9. Try to generate - blocked with message
10. Delete a project - storage decreases
```

## How to Verify

1. Check dashboard shows storage indicator
2. See current usage percentage
3. Generate assets, watch storage grow
4. At 80%: yellow warning appears
5. At 95%: red warning, generation blocked
6. Delete project: storage decreases
7. Below 95%: generation works again

## Testing Note

To test thresholds without filling 50MB:
- Temporarily change STORAGE_LIMIT_BYTES to a smaller value (e.g., 5MB)
- Or create test blobs of known sizes

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- [ ] **MVP COMPLETE! 🎉**
- Date: ___
