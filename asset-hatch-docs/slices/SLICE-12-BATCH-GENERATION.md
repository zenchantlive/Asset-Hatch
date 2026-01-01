# Slice 12: Generate All Assets in Queue

## User Story
**As a user, I can click "Generate All" and watch all my assets generate one by one automatically.**

## What This Slice Delivers
- Generation queue system
- "Generate All" button
- Sequential processing
- Pause/resume controls
- Auto-scroll to current asset

## Acceptance Criteria
- [ ] "Generate All" button at top of generation page
- [ ] Clicking it queues all ungenerated assets
- [ ] Assets generate one at a time (not parallel)
- [ ] Can see which asset is currently generating
- [ ] Can click "Pause" to stop queue
- [ ] Can click "Resume" to continue
- [ ] Completed assets show as generated

## Files Created/Modified
```
app/
└── project/[id]/generation/page.tsx # MODIFY: Add queue controls

components/
└── generation/
    └── GenerationControls.tsx       # NEW: Start/pause/resume buttons

lib/
└── generation-queue.ts              # NEW: Queue management
```

## Prompt for AI Agent

```
Add batch generation queue system.

GENERATION QUEUE (lib/generation-queue.ts):
Create a simple queue manager:

```typescript
type QueueState = 'idle' | 'running' | 'paused';

interface QueueItem {
  entity_id: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
}

class GenerationQueue {
  private items: QueueItem[] = [];
  private state: QueueState = 'idle';
  private currentIndex: number = 0;
  private onStateChange: () => void;
  private onItemComplete: (entityId: string) => void;
  
  constructor(callbacks: {
    onStateChange: () => void;
    onItemComplete: (entityId: string) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onItemComplete = callbacks.onItemComplete;
  }
  
  enqueue(entities: { id: string }[]) {
    this.items = entities.map(e => ({
      entity_id: e.id,
      status: 'pending'
    }));
    this.currentIndex = 0;
  }
  
  async start(generateFn: (entityId: string) => Promise<void>) {
    this.state = 'running';
    this.onStateChange();
    
    while (this.currentIndex < this.items.length && this.state === 'running') {
      const item = this.items[this.currentIndex];
      item.status = 'generating';
      this.onStateChange();
      
      try {
        await generateFn(item.entity_id);
        item.status = 'complete';
        this.onItemComplete(item.entity_id);
      } catch (error) {
        item.status = 'failed';
        console.error('Generation failed:', error);
      }
      
      this.currentIndex++;
      this.onStateChange();
    }
    
    if (this.state === 'running') {
      this.state = 'idle';
      this.onStateChange();
    }
  }
  
  pause() {
    this.state = 'paused';
    this.onStateChange();
  }
  
  resume(generateFn: (entityId: string) => Promise<void>) {
    this.start(generateFn);
  }
  
  getState() {
    return {
      state: this.state,
      items: this.items,
      currentIndex: this.currentIndex,
      completed: this.items.filter(i => i.status === 'complete').length,
      total: this.items.length
    };
  }
}

export const generationQueue = new GenerationQueue();
```

GENERATION CONTROLS (components/generation/GenerationControls.tsx):
Control bar for queue:

Display:
- "Generate All" button (when idle, ungenerated assets exist)
- "Pause" button (when running)
- "Resume" button (when paused)
- "Stop" button (when running or paused)
- Status text: "Generating 5/20..." or "Paused at 5/20" or "Complete: 20/20"

Props:
- queueState: from queue.getState()
- onStartAll: () => void
- onPause: () => void
- onResume: () => void
- onStop: () => void
- hasUngenerated: boolean

GENERATION PAGE UPDATE (app/project/[id]/generation/page.tsx):
Integrate queue:

```typescript
const [queueState, setQueueState] = useState(generationQueue.getState());

// Filter to ungenerated entities
const ungeneratedEntities = entities.filter(e => 
  !assets.some(a => a.entity_id === e.id)
);

const handleStartAll = () => {
  generationQueue.enqueue(ungeneratedEntities);
  generationQueue.start(async (entityId) => {
    await generateAsset(entityId);  // Your existing generate function
  });
};

const handlePause = () => generationQueue.pause();
const handleResume = () => generationQueue.resume(generateAsset);
```

AUTO-SCROLL:
When an asset starts generating, scroll it into view:
```typescript
const currentRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (queueState.items[queueState.currentIndex]?.status === 'generating') {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [queueState.currentIndex]);
```

VISUAL FEEDBACK:
- Pending: gray border
- Generating: pulsing border, spinner
- Complete: show image
- Failed: red border, retry button

VERIFY:
1. Have plan with 10+ entities
2. Go to generation page
3. Click "Generate All"
4. See first entity start generating
5. Status shows "Generating 1/10..."
6. First completes, second starts automatically
7. Click "Pause"
8. Generation stops, status shows "Paused at 3/10"
9. Click "Resume"
10. Continues from where it left off
11. All complete: status shows "Complete: 10/10"
```

## GATE CHECK: 20+ Asset Consistency

After queue works, generate 20+ assets and validate consistency:

1. [ ] Generate at least 20 assets (full queue)
2. [ ] Check: Do all characters use same color palette?
3. [ ] Check: Is art style consistent across assets?
4. [ ] Check: Are proportions/resolutions consistent?
5. [ ] Check: Do assets "feel" like they belong together?

**If YES to all: proceed to Slice 13**
**If NO: adjust prompt-builder.ts, regenerate, and recheck**

## How to Verify

1. Have 10+ entities in plan
2. Click "Generate All"
3. Watch assets generate one by one
4. See progress "Generating 5/10..."
5. Click "Pause"
6. Queue stops
7. Click "Resume"
8. Continues from pause point
9. All assets complete

## What NOT to Build Yet
- No progress bar with ETA (Slice 13)
- No category-based generation (later)
- No parallel generation (not needed)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- [ ] **GATE VALIDATED: 20+ assets are visually consistent**
- Date: ___
