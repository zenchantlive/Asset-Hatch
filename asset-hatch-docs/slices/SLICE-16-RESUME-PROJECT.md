# Slice 16: Resume Project Where I Left Off

## User Story
**As a user, when I click on a project, I should go directly to the phase I was working on, not always start at planning.**

## What This Slice Delivers
- Smart navigation based on project phase
- Conversation persistence (chat history loads)
- Phase indicator showing progress
- Back navigation between phases

## Acceptance Criteria
- [ ] Click project in "planning" phase → go to /planning
- [ ] Click project in "style" phase → go to /style
- [ ] Click project in "generation" phase → go to /generation
- [ ] Click project in "export" phase → go to /export
- [ ] Chat history loads when returning to planning
- [ ] Phase indicator shows all phases with current highlighted
- [ ] Can click completed phases to go back

## Files Created/Modified
```
components/
├── ProjectCard.tsx                  # MODIFY: Navigate to correct phase
└── common/
    └── PhaseIndicator.tsx           # NEW: Phase progress display

app/
└── project/[id]/layout.tsx          # MODIFY: Add phase indicator

lib/
└── db.ts                            # MODIFY: Add conversations table
```

## Prompt for AI Agent

```
Add project resumption and phase navigation.

DATABASE UPDATE (lib/db.ts):
Add conversations table if not exists:

```typescript
export interface Conversation {
  id: string;
  project_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  updated_at: string;
}

// Add to schema (increment version)
this.version(5).stores({
  // ... existing tables
  conversations: 'id, project_id, updated_at'
});
```

PROJECT CARD UPDATE (components/ProjectCard.tsx):
Navigate to correct phase:

```typescript
// Change Link href from always /planning to dynamic
const getProjectUrl = (project: Project) => {
  return `/project/${project.id}/${project.phase}`;
};

// In the component
<Link href={getProjectUrl(project)}>
  ...
</Link>
```

PHASE INDICATOR (components/common/PhaseIndicator.tsx):
Create visual progress indicator:

```typescript
interface PhaseIndicatorProps {
  currentPhase: 'planning' | 'style' | 'generation' | 'export';
  projectId: string;
}

const phases = [
  { key: 'planning', label: 'Planning', icon: MessageSquare },
  { key: 'style', label: 'Style', icon: Palette },
  { key: 'generation', label: 'Generation', icon: Wand2 },
  { key: 'export', label: 'Export', icon: Download },
];

export function PhaseIndicator({ currentPhase, projectId }: PhaseIndicatorProps) {
  const router = useRouter();
  const currentIndex = phases.findIndex(p => p.key === currentPhase);
  
  const handlePhaseClick = (phaseKey: string, index: number) => {
    if (index <= currentIndex) {
      // Can go back to completed phases
      router.push(`/project/${projectId}/${phaseKey}`);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        
        return (
          <React.Fragment key={phase.key}>
            <button
              onClick={() => handlePhaseClick(phase.key, index)}
              disabled={isFuture}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-sm",
                isComplete && "bg-green-100 text-green-700 cursor-pointer",
                isCurrent && "bg-blue-100 text-blue-700",
                isFuture && "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isComplete && <Check className="w-3 h-3" />}
              <phase.icon className="w-4 h-4" />
              <span>{phase.label}</span>
            </button>
            {index < phases.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

PROJECT LAYOUT UPDATE (app/project/[id]/layout.tsx):
Add phase indicator:

```typescript
export default function ProjectLayout({ children, params }) {
  const project = useLiveQuery(() => 
    db.projects.get(params.id)
  );
  
  if (!project) return <div>Loading...</div>;
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-sm text-gray-500">
              ← Back to Projects
            </Link>
            <h1 className="text-xl font-bold">{project.name}</h1>
          </div>
          <PhaseIndicator 
            currentPhase={project.phase} 
            projectId={project.id} 
          />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

CONVERSATION PERSISTENCE (Planning page):
Save and load chat history:

```typescript
// Save messages after each exchange
const saveConversation = async (messages: Message[]) => {
  const existing = await db.conversations
    .where('project_id').equals(projectId)
    .first();
    
  if (existing) {
    await db.conversations.update(existing.id, {
      messages,
      updated_at: new Date().toISOString()
    });
  } else {
    await db.conversations.add({
      id: crypto.randomUUID(),
      project_id: projectId,
      messages,
      updated_at: new Date().toISOString()
    });
  }
};

// Load on mount
const conversation = useLiveQuery(() =>
  db.conversations.where('project_id').equals(projectId).first()
);

// Initialize chat with existing messages
useEffect(() => {
  if (conversation?.messages) {
    // Restore messages to CopilotKit
    // (exact implementation depends on CopilotKit API)
  }
}, [conversation]);
```

VERIFY:
1. Create project, complete planning, approve plan
2. Project is now in "style" phase
3. Go back to dashboard
4. Click project → goes to /style (not /planning)
5. Complete style, go to generation
6. Return to dashboard
7. Click project → goes to /generation
8. In generation page, click "Planning" in phase indicator
9. Goes back to planning with chat history intact
10. Can see previous conversation
```

## How to Verify

1. Create project
2. Complete planning phase
3. Go to dashboard
4. Click project → lands on style page
5. See phase indicator showing Planning ✓ | Style (current) | Generation | Export
6. Click "Planning" in indicator
7. Navigate back to planning
8. See previous chat messages
9. Complete more phases, verify navigation always lands on current phase

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
