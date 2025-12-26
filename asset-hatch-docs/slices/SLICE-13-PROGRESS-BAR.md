# Slice 13: Progress Bar with Accurate ETA

## User Story
**As a user, while assets are generating, I can see a progress bar and estimated time remaining.**

## What This Slice Delivers
- Visual progress bar
- Percentage complete
- ETA calculation based on average time
- Time elapsed display

## Acceptance Criteria
- [ ] Progress bar visible during batch generation
- [ ] Bar fills as assets complete
- [ ] Shows "X/Y assets (Z%)"
- [ ] Shows "~5 minutes remaining" (updates as it goes)
- [ ] ETA improves accuracy after first few assets
- [ ] Shows elapsed time

## Files Created/Modified
```
components/
└── generation/
    └── ProgressBar.tsx              # NEW: Progress display

lib/
└── generation-queue.ts              # MODIFY: Track timing
```

## Prompt for AI Agent

```
Add progress bar with ETA to generation queue.

TIMING TRACKING (lib/generation-queue.ts):
Update queue to track generation times:

```typescript
interface QueueItem {
  entity_id: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  started_at?: number;    // timestamp
  completed_at?: number;  // timestamp
  duration_ms?: number;
}

// In the queue class, add:
private startTime: number = 0;

start(generateFn) {
  this.startTime = Date.now();
  // ... existing code
  
  // Before generating:
  item.started_at = Date.now();
  
  // After generating:
  item.completed_at = Date.now();
  item.duration_ms = item.completed_at - item.started_at;
}

getAverageTime(): number {
  const completed = this.items.filter(i => i.duration_ms);
  if (completed.length === 0) return 30000; // default 30s estimate
  const total = completed.reduce((sum, i) => sum + i.duration_ms!, 0);
  return total / completed.length;
}

getETA(): number {
  const remaining = this.items.length - this.currentIndex;
  return remaining * this.getAverageTime();
}

getElapsed(): number {
  return Date.now() - this.startTime;
}

getState() {
  return {
    // ... existing fields
    averageTime: this.getAverageTime(),
    eta: this.getETA(),
    elapsed: this.getElapsed()
  };
}
```

PROGRESS BAR (components/generation/ProgressBar.tsx):
Create visual progress display:

```typescript
interface ProgressBarProps {
  completed: number;
  total: number;
  eta: number;         // milliseconds
  elapsed: number;     // milliseconds
  isRunning: boolean;
}

export function ProgressBar({ completed, total, eta, elapsed, isRunning }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };
  
  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Stats row */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>{completed}/{total} assets ({percentage}%)</span>
        {isRunning && (
          <span>~{formatTime(eta)} remaining</span>
        )}
        <span>Elapsed: {formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
```

GENERATION PAGE UPDATE (app/project/[id]/generation/page.tsx):
Add progress bar:

- Show above asset list during generation
- Update every second while generating
- Hide when idle (or show completed state)

```typescript
// Update state every second while running
useEffect(() => {
  if (queueState.state === 'running') {
    const interval = setInterval(() => {
      setQueueState(generationQueue.getState());
    }, 1000);
    return () => clearInterval(interval);
  }
}, [queueState.state]);
```

PROGRESS STATES:
- Idle (no generation): Hide progress bar
- Running: Show animated progress bar with ETA
- Paused: Show progress bar (paused state, no ETA)
- Complete: Show "✓ All assets generated" message

VERIFY:
1. Start "Generate All" with 10 entities
2. See progress bar appear
3. See "0/10 assets (0%)"
4. First asset completes
5. Bar updates: "1/10 assets (10%)"
6. ETA shows (e.g., "~4m 30s remaining")
7. As more complete, ETA becomes more accurate
8. Elapsed time increases
9. All complete: bar at 100%
10. Shows "✓ All assets generated"
```

## How to Verify

1. Start batch generation with 10 assets
2. See progress bar at 0%
3. Bar fills as assets complete
4. See accurate percentage
5. See ETA updating
6. See elapsed time
7. Pause - ETA disappears, elapsed stays
8. Resume - ETA returns
9. Complete - 100% with completion message

## What NOT to Build Yet
- No per-category progress (nice to have)
- No speed graph (not needed)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
