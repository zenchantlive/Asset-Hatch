# Slice 04: Agent Sets Quality, Dropdown Updates

## User Story
**As a user, when I describe my game and the agent infers the art style, I see the "Art Style" dropdown automatically update to match.**

## What This Slice Delivers
- First CopilotKit tool: updateQuality
- Qualities bar with dropdowns
- Real-time UI update when agent calls tool
- Memory file for project settings

## Acceptance Criteria
- [ ] Qualities bar shows dropdowns (game_type, art_style, resolution, etc.)
- [ ] When I say "pixel art farming game", agent calls updateQuality
- [ ] Dropdown updates to show "Pixel Art" selected
- [ ] Multiple qualities can be set in one conversation
- [ ] Settings persist when I refresh (saved to IndexedDB)

## Files Created/Modified
```
app/
├── api/copilotkit/route.ts          # MODIFY: Add updateQuality tool
└── project/[id]/planning/page.tsx   # MODIFY: Add QualitiesBar

components/
└── planning/
    └── QualitiesBar.tsx             # NEW: Dropdown row

lib/
└── db.ts                            # MODIFY: Add memory_files table
```

## Database Addition

```typescript
// Add to lib/db.ts
interface MemoryFile {
  id: string;
  project_id: string;
  type: 'project.json' | 'entities.json' | 'style-anchor.json' | 'generation-log.json';
  content: string;  // JSON stringified
  updated_at: string;
}

// Add to database schema
this.version(2).stores({
  projects: 'id, phase, created_at',
  memory_files: 'id, project_id, type, updated_at'
});
```

## Prompt for AI Agent

```
Add the updateQuality tool and qualities dropdown bar.

DATABASE UPDATE (lib/db.ts):
Add memory_files table to store project settings:

```typescript
export interface MemoryFile {
  id: string;
  project_id: string;
  type: 'project.json' | 'entities.json' | 'style-anchor.json' | 'generation-log.json';
  content: string;
  updated_at: string;
}

// Update schema version to 2
this.version(2).stores({
  projects: 'id, phase, created_at',
  memory_files: 'id, project_id, type, updated_at'
});
```

Add memory_files table property:
memory_files!: Table<MemoryFile>;

QUALITIES BAR (components/planning/QualitiesBar.tsx):
Create a row of dropdowns:
- game_type: Platformer, Top-down RPG, Puzzle, Farming Sim, Visual Novel, Fighting, Arcade
- art_style: Pixel Art, Hand-painted, Vector/Flat, Anime, Chibi, Sketch
- base_resolution: 16x16, 32x32, 64x64, 128x128
- perspective: Side-view, Top-down, Isometric, Front-facing
- theme: Fantasy, Sci-fi, Modern, Horror, Nature, Urban
- mood: Cheerful, Dark, Mysterious, Calm, Intense

Props:
- qualities: object with current values (e.g., { game_type: "Platformer", art_style: null })
- onQualityChange: callback when user manually changes a dropdown

Display:
- Horizontal row of labeled dropdowns
- Use shadcn Select component
- Show "Not set" for null values
- Highlight dropdowns that have values (subtle border color)

COPILOTKIT TOOL (app/api/copilotkit/route.ts):
Add the updateQuality tool:

```typescript
const tools = [
  {
    name: "updateQuality",
    description: "Set a quality/setting for the game project. Use this when you infer or confirm a game property like art style, game type, resolution, etc.",
    parameters: {
      type: "object",
      properties: {
        quality: {
          type: "string",
          enum: ["game_type", "art_style", "base_resolution", "perspective", "theme", "mood"],
          description: "Which quality to set"
        },
        value: {
          type: "string",
          description: "The value to set"
        }
      },
      required: ["quality", "value"]
    },
    handler: async ({ quality, value, projectId }) => {
      // projectId will come from context (see below)
      // 1. Get or create project.json memory file
      // 2. Parse content, update the quality
      // 3. Save back to IndexedDB
      // 4. Return confirmation message
      return `Set ${quality} to "${value}"`;
    }
  }
];
```

COPILOTKIT CONTEXT:
Use useCopilotReadable to provide project ID and current qualities to the agent:

```typescript
useCopilotReadable({
  description: "Current project settings",
  value: {
    projectId: project.id,
    qualities: currentQualities
  }
});
```

PLANNING PAGE UPDATE (app/project/[id]/planning/page.tsx):
- Add QualitiesBar above ChatInterface
- Load qualities from memory_files (project.json)
- Pass qualities to QualitiesBar
- When tool is called, refetch qualities (useLiveQuery handles this)

SYSTEM PROMPT UPDATE:
Add to the system prompt:
"When the user describes their game, infer appropriate qualities and call updateQuality for each one. For example, if they say 'pixel art platformer', call updateQuality for art_style='Pixel Art' and game_type='Platformer'. Confirm each setting with the user."

VERIFY:
1. Go to planning page - see empty dropdowns
2. Type "I'm making a cozy pixel art farming game"
3. Agent should call updateQuality for:
   - game_type: "Farming Sim"
   - art_style: "Pixel Art"  
   - mood: "Cheerful" (inferred from "cozy")
4. Dropdowns update to show these values
5. Refresh page - values still there
```

## How to Verify

1. Open project planning page
2. See qualities bar with empty dropdowns
3. Type "I want to make a dark pixel art horror game"
4. Agent responds and calls updateQuality multiple times
5. See dropdowns update: art_style → "Pixel Art", mood → "Dark", theme → "Horror"
6. Refresh page
7. Dropdowns still show the values

## What NOT to Build Yet
- No entity/asset planning (Slice 05)
- No plan approval (Slice 06)
- No manual dropdown editing triggering agent (keep simple for now)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
