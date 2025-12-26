# Slice 17: Start Project from Template

## User Story
**As a user, I can start a new project from a template (like "Platformer") and get pre-filled qualities and a baseline asset list.**

## What This Slice Delivers
- Template selection when creating project
- Pre-defined templates for common game types
- Qualities auto-filled from template
- Baseline entities pre-populated
- Can customize after template applied

## Acceptance Criteria
- [ ] "New Project" offers choice: Blank or Template
- [ ] Template selection shows 3-5 game type options
- [ ] Selecting template shows preview of what's included
- [ ] Create from template → qualities pre-filled
- [ ] Create from template → entities pre-populated
- [ ] Can still modify plan after template applied

## Files Created/Modified
```
lib/
└── templates.ts                     # NEW: Template definitions

app/
└── page.tsx                         # MODIFY: Add template selection

components/
└── TemplateSelector.tsx             # NEW: Template picker UI
```

## Prompt for AI Agent

```
Add template system for quick project starts.

TEMPLATES (lib/templates.ts):
Define game type templates:

```typescript
export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;  // emoji for simplicity
  qualities: {
    game_type: string;
    art_style: string;
    base_resolution: string;
    perspective: string;
    theme: string;
    mood: string;
  };
  entities: Array<{
    category: 'characters' | 'environment' | 'props' | 'ui' | 'icons';
    name: string;
    description: string;
    specifications: string[];
  }>;
}

export const templates: GameTemplate[] = [
  {
    id: 'platformer',
    name: 'Platformer',
    description: 'Side-scrolling action game with jumping and running',
    icon: '🏃',
    qualities: {
      game_type: 'Platformer',
      art_style: 'Pixel Art',
      base_resolution: '32x32',
      perspective: 'Side-view',
      theme: 'Fantasy',
      mood: 'Cheerful'
    },
    entities: [
      {
        category: 'characters',
        name: 'Player Character',
        description: 'Main playable hero character',
        specifications: ['Idle animation (4 frames)', 'Run animation (6 frames)', 'Jump animation (3 frames)']
      },
      {
        category: 'characters',
        name: 'Basic Enemy',
        description: 'Simple patrolling enemy',
        specifications: ['Walk animation (4 frames)', 'Death animation (3 frames)']
      },
      {
        category: 'environment',
        name: 'Ground Tileset',
        description: 'Platform and ground tiles',
        specifications: ['16 tiles', 'Edges and corners', 'Seamless']
      },
      {
        category: 'props',
        name: 'Coins',
        description: 'Collectible coins',
        specifications: ['Spin animation (4 frames)', '16x16 size']
      },
      {
        category: 'ui',
        name: 'Health Bar',
        description: 'Player health display',
        specifications: ['Empty and full states', 'Horizontal bar']
      },
      {
        category: 'icons',
        name: 'Heart Icon',
        description: 'Life/health icon',
        specifications: ['16x16', 'Full and empty variants']
      }
    ]
  },
  {
    id: 'top-down-rpg',
    name: 'Top-Down RPG',
    description: 'Adventure game with exploration and NPCs',
    icon: '⚔️',
    qualities: {
      game_type: 'Top-down RPG',
      art_style: 'Pixel Art',
      base_resolution: '32x32',
      perspective: 'Top-down',
      theme: 'Fantasy',
      mood: 'Mysterious'
    },
    entities: [
      {
        category: 'characters',
        name: 'Hero',
        description: 'Player character with 4-direction movement',
        specifications: ['Walk animation (4 frames x 4 directions)', 'Idle animation', 'Attack animation']
      },
      {
        category: 'characters',
        name: 'Villager NPC',
        description: 'Friendly town NPC',
        specifications: ['Idle animation', 'Talk animation']
      },
      {
        category: 'characters',
        name: 'Slime Enemy',
        description: 'Basic bouncing enemy',
        specifications: ['Bounce animation (4 frames)', 'Death animation']
      },
      {
        category: 'environment',
        name: 'Grass Tileset',
        description: 'Outdoor grass and path tiles',
        specifications: ['24 tiles', 'Path edges', 'Flowers and variations']
      },
      {
        category: 'props',
        name: 'Treasure Chest',
        description: 'Lootable container',
        specifications: ['Closed and open states', '32x32']
      },
      {
        category: 'ui',
        name: 'Dialogue Box',
        description: 'NPC conversation display',
        specifications: ['9-slice scalable', 'Arrow indicator']
      },
      {
        category: 'icons',
        name: 'Item Icons',
        description: 'Inventory item icons',
        specifications: ['Sword, Shield, Potion, Key', '16x16 each']
      }
    ]
  },
  {
    id: 'puzzle',
    name: 'Puzzle Game',
    description: 'Match-3 or block-based puzzle game',
    icon: '🧩',
    qualities: {
      game_type: 'Puzzle',
      art_style: 'Vector/Flat',
      base_resolution: '64x64',
      perspective: 'Front-facing',
      theme: 'Modern',
      mood: 'Calm'
    },
    entities: [
      {
        category: 'props',
        name: 'Game Pieces',
        description: 'Colored puzzle blocks/gems',
        specifications: ['6 color variants', 'Match animation', 'Clear animation']
      },
      {
        category: 'environment',
        name: 'Game Board',
        description: 'Puzzle grid background',
        specifications: ['8x8 grid', 'Cell borders', 'Background pattern']
      },
      {
        category: 'ui',
        name: 'Score Display',
        description: 'Score counter panel',
        specifications: ['Number display area', 'Star rating']
      },
      {
        category: 'ui',
        name: 'Game Buttons',
        description: 'Play, Pause, Restart buttons',
        specifications: ['Normal, hover, pressed states', 'Rounded corners']
      },
      {
        category: 'icons',
        name: 'Power-up Icons',
        description: 'Special ability indicators',
        specifications: ['Bomb, Rainbow, Time icons', '32x32 each']
      }
    ]
  }
];

export function getTemplate(id: string): GameTemplate | undefined {
  return templates.find(t => t.id === id);
}
```

TEMPLATE SELECTOR (components/TemplateSelector.tsx):
Template picker interface:

```typescript
interface TemplateSelectorProps {
  onSelect: (template: GameTemplate | null) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedTemplate = selected ? getTemplate(selected) : null;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => setSelected(template.id)}
            className={cn(
              "p-4 border rounded-lg text-left",
              selected === template.id && "border-blue-500 bg-blue-50"
            )}
          >
            <div className="text-2xl mb-2">{template.icon}</div>
            <div className="font-bold">{template.name}</div>
            <div className="text-sm text-gray-500">{template.description}</div>
            <div className="text-xs text-gray-400 mt-2">
              {template.entities.length} assets
            </div>
          </button>
        ))}
      </div>
      
      {selectedTemplate && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-bold mb-2">Template includes:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Art Style: {selectedTemplate.qualities.art_style}</div>
            <div>Resolution: {selectedTemplate.qualities.base_resolution}</div>
            <div>Perspective: {selectedTemplate.qualities.perspective}</div>
            <div>Mood: {selectedTemplate.qualities.mood}</div>
          </div>
          <h4 className="font-bold mt-3 mb-2">Assets ({selectedTemplate.entities.length}):</h4>
          <ul className="text-sm space-y-1">
            {selectedTemplate.entities.map((e, i) => (
              <li key={i}>• {e.name} ({e.category})</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={() => onSelect(null)}>
          Start Blank
        </Button>
        <Button 
          onClick={() => onSelect(selectedTemplate!)}
          disabled={!selectedTemplate}
        >
          Use Template
        </Button>
      </div>
    </div>
  );
}
```

DASHBOARD UPDATE (app/page.tsx):
Integrate template selection:

```typescript
const [showTemplates, setShowTemplates] = useState(false);

const handleNewProject = () => {
  setShowTemplates(true);
};

const handleTemplateSelect = async (template: GameTemplate | null) => {
  // Create project
  const projectId = crypto.randomUUID();
  const project: Project = {
    id: projectId,
    name: template ? `${template.name} Project` : 'New Project',
    phase: 'planning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.projects.add(project);
  
  if (template) {
    // Save qualities to project.json
    await db.memory_files.add({
      id: crypto.randomUUID(),
      project_id: projectId,
      type: 'project.json',
      content: JSON.stringify(template.qualities),
      updated_at: new Date().toISOString()
    });
    
    // Save entities to entities.json
    const entities = template.entities.map((e, i) => ({
      id: `ent_${i}`,
      ...e
    }));
    await db.memory_files.add({
      id: crypto.randomUUID(),
      project_id: projectId,
      type: 'entities.json',
      content: JSON.stringify({ entities }),
      updated_at: new Date().toISOString()
    });
  }
  
  setShowTemplates(false);
  router.push(`/project/${projectId}/planning`);
};

// In dialog:
{showTemplates ? (
  <TemplateSelector 
    onSelect={handleTemplateSelect}
    onCancel={() => setShowTemplates(false)}
  />
) : (
  // Original new project form
)}
```

VERIFY:
1. Click "New Project" on dashboard
2. See template options: Platformer, RPG, Puzzle
3. Click "Platformer"
4. See preview of included assets and settings
5. Click "Use Template"
6. Navigate to planning page
7. See qualities dropdowns pre-filled
8. See plan preview with baseline entities
9. Can still chat with agent to modify
10. Create blank project - no pre-filled content
```

## How to Verify

1. Click "New Project"
2. See template selection dialog
3. Select "Platformer" template
4. See preview of what's included
5. Click "Use Template"
6. Land on planning page
7. Qualities dropdowns show: Platformer, Pixel Art, 32x32, etc.
8. Plan preview shows: Player Character, Basic Enemy, Ground Tileset, etc.
9. Can delete/add entities
10. Can change qualities

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
