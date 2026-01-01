# Slice 05: Agent Adds Entity, Plan Preview Updates

## User Story
**As a user, when the agent suggests "You'll need a player character with walk and idle animations", I see that entity appear in the plan preview panel.**

## What This Slice Delivers
- Second CopilotKit tool: addEntityToPlan
- Plan preview panel showing entities by category
- Real-time UI update when agent adds entities
- entities.json memory file

## Acceptance Criteria
- [ ] Plan preview panel shows on right side of planning page
- [ ] When agent calls addEntityToPlan, entity appears in preview
- [ ] Entities grouped by category (Characters, Environment, Props, UI, Icons)
- [ ] Each entity shows name and description
- [ ] Can delete entity from plan (removes from preview)
- [ ] Entities persist when I refresh

## Files Created/Modified
```
app/
├── api/copilotkit/route.ts          # MODIFY: Add addEntityToPlan tool
└── project/[id]/planning/page.tsx   # MODIFY: Add PlanPreview, layout

components/
└── planning/
    └── PlanPreview.tsx              # NEW: Sidebar showing entities
```

## Prompt for AI Agent

```
Add the addEntityToPlan tool and plan preview panel.

ENTITIES JSON STRUCTURE:
When saving to entities.json memory file:
```json
{
  "entities": [
    {
      "id": "ent_abc123",
      "category": "characters",
      "name": "Player Farmer",
      "description": "Main player character for the farming game",
      "specifications": [
        "32x32 pixel art sprite",
        "Idle animation (4 frames)",
        "Walk animation (4 frames, 4 directions)",
        "Work animation (8 frames)"
      ]
    }
  ]
}
```

COPILOTKIT TOOL (app/api/copilotkit/route.ts):
Add the addEntityToPlan tool:

```typescript
{
  name: "addEntityToPlan",
  description: "Add a game asset entity to the project plan. Use this to add characters, environment tiles, props, UI elements, or icons that the game will need.",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["characters", "environment", "props", "ui", "icons"],
        description: "The category of asset"
      },
      name: {
        type: "string",
        description: "Name of the asset (e.g., 'Player Character', 'Grass Tileset')"
      },
      description: {
        type: "string",
        description: "Brief description of the asset"
      },
      specifications: {
        type: "array",
        items: { type: "string" },
        description: "List of specifications (resolution, animation frames, etc.)"
      }
    },
    required: ["category", "name", "description", "specifications"]
  },
  handler: async ({ category, name, description, specifications, projectId }) => {
    // 1. Get or create entities.json memory file
    // 2. Parse content, add new entity with generated ID
    // 3. Save back to IndexedDB
    // 4. Return confirmation
    return `Added ${name} to ${category}`;
  }
}
```

PLAN PREVIEW (components/planning/PlanPreview.tsx):
Create a sidebar panel:
- Title: "Asset Plan"
- Show count: "12 assets"
- Group entities by category with collapsible sections:
  - Characters (3)
  - Environment (4)
  - Props (2)
  - UI (2)
  - Icons (1)
- Each entity shows:
  - Name (bold)
  - Description (smaller text)
  - Delete button (X icon, with confirmation)
- Empty state: "No assets planned yet. Describe your game to get started."

Props:
- entities: array of entity objects
- onDeleteEntity: callback with entity ID

PLANNING PAGE LAYOUT (app/project/[id]/planning/page.tsx):
Update layout to be two columns:
- Left side (2/3 width): QualitiesBar + ChatInterface
- Right side (1/3 width): PlanPreview

Load entities from memory_files (entities.json) using useLiveQuery.

DELETE ENTITY:
When user clicks delete:
1. Show confirmation: "Remove [entity name] from plan?"
2. On confirm: Remove from entities.json in IndexedDB
3. UI updates automatically via useLiveQuery

SYSTEM PROMPT UPDATE:
Add to system prompt:
"As you discuss the game with the user, build out an asset plan by calling addEntityToPlan. For a platformer, you might add: Player Character (with jump, run, idle animations), Ground Tileset, Enemy Type 1, Collectible Coins, etc. Add 3-5 entities at a time, then confirm with user before adding more."

VERIFY:
1. Go to planning page
2. See empty plan preview on right
3. Type "Let's plan a simple platformer with a knight character"
4. Agent should call addEntityToPlan multiple times:
   - characters: "Knight Player" with walk/jump/attack specs
   - environment: "Ground Tileset" with tile specs
   - props: "Coins" with collectible specs
5. Each entity appears in preview as added
6. Click delete on one entity - it's removed
7. Refresh - remaining entities still there
```

## How to Verify

1. Open project planning page
2. See empty plan preview panel on right
3. Type "I need a simple puzzle game with colored blocks"
4. Agent starts adding entities (blocks, UI elements)
5. Watch preview update in real-time
6. See entities grouped by category
7. Delete one entity
8. Confirm deletion
9. Entity removed from preview
10. Refresh page - remaining entities persist

## What NOT to Build Yet
- No entity editing (can add in later slice if needed)
- No plan approval (Slice 06)
- No template-based entity loading (Slice 17)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
