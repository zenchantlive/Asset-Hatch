# Slice 01: Create and List Projects

## User Story
**As a user, I can click "New Project", enter a name, and see my project appear in a list.**

## What This Slice Delivers
- IndexedDB database with Dexie
- Project creation with form
- Project listing on dashboard
- Basic project card display

## Acceptance Criteria
- [ ] Click "New Project" button opens a dialog
- [ ] Enter project name and click "Create"
- [ ] New project appears in list immediately
- [ ] Refresh page - project still there (persisted)
- [ ] Project card shows name and "Planning" phase

## Files Created/Modified
```
lib/
└── db.ts                    # NEW: Dexie database + Project interface

app/
├── page.tsx                 # MODIFY: Add project list + new project button
└── components/
    └── ProjectCard.tsx      # NEW: Display single project
```

## Database Schema (Just Projects for Now)

```typescript
// lib/db.ts
interface Project {
  id: string;              // UUID
  name: string;
  phase: 'planning' | 'style' | 'generation' | 'export';
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

## Prompt for AI Agent

```
Add project creation and listing to Asset Hatch.

DATABASE SETUP (lib/db.ts):
Create a Dexie database with a single table for now:

```typescript
import Dexie, { Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  phase: 'planning' | 'style' | 'generation' | 'export';
  created_at: string;
  updated_at: string;
}

export class AssetHatchDB extends Dexie {
  projects!: Table<Project>;

  constructor() {
    super('asset-hatch');
    this.version(1).stores({
      projects: 'id, phase, created_at'
    });
  }
}

export const db = new AssetHatchDB();
```

PROJECT CARD COMPONENT (components/ProjectCard.tsx):
- Display project name (bold)
- Display phase as a badge (e.g., "Planning")
- Display created date (formatted nicely)
- Clicking the card does nothing yet (that's Slice 02)
- Use shadcn Card component

HOME PAGE (app/page.tsx):
- Keep the "Asset Hatch" title
- Add a "New Project" button (top right)
- Clicking "New Project" opens a Dialog
- Dialog has: text input for name, Cancel button, Create button
- On Create: generate UUID, create project with phase="planning", save to IndexedDB
- Below title: show grid of ProjectCard components
- Use useLiveQuery from dexie-react-hooks to get projects
- Show "No projects yet" message if empty
- Sort projects by created_at descending (newest first)

IMPORTANT:
- Use crypto.randomUUID() for generating IDs
- Use new Date().toISOString() for timestamps
- After creating project, close dialog (don't navigate anywhere yet)

VERIFY:
1. Click "New Project"
2. Type "My First Game"
3. Click "Create"
4. See card appear with "My First Game" and "Planning" badge
5. Refresh page - card still there
```

## How to Verify

1. Open app
2. Click "New Project"
3. Enter "Test Project"
4. Click "Create"
5. See project card appear
6. Refresh browser
7. Project card still visible
8. Create second project - both show, newest first

## What NOT to Build Yet
- No clicking to open project (Slice 02)
- No delete functionality (Slice 15)
- No other database tables (added as needed)
- No routing (Slice 02)

## Notes
- All components working correctly
- Dev server tested and confirmed working


---

## Completion
- [x] Slice complete
- [ ] Committed to git
- Date: Dec 24, 2025
