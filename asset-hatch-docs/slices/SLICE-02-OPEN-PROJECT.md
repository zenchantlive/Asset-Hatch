# Slice 02: Open Project to Planning Page

## User Story
**As a user, I can click a project card and navigate to its planning page.**

## What This Slice Delivers
- Dynamic routing for projects
- Planning page placeholder
- Navigation back to dashboard
- Project context loading

## Acceptance Criteria
- [ ] Click project card → navigates to /project/[id]/planning
- [ ] Planning page shows project name
- [ ] Planning page shows "Planning Phase" heading
- [ ] Can click "Back to Projects" to return to dashboard
- [ ] Invalid project ID shows error message

## Files Created/Modified
```
app/
├── project/
│   └── [id]/
│       ├── layout.tsx           # NEW: Project layout with header
│       └── planning/
│           └── page.tsx         # NEW: Planning page (placeholder)
components/
└── ProjectCard.tsx              # MODIFY: Add click to navigate
```

## Prompt for AI Agent

```
Add project routing and planning page placeholder to Asset Hatch.

PROJECT CARD UPDATE (components/ProjectCard.tsx):
- Wrap card in Link component from next/link
- Link href should be `/project/${project.id}/planning`
- Add hover effect (subtle shadow or border change)

PROJECT LAYOUT (app/project/[id]/layout.tsx):
- Get project ID from params
- Load project from IndexedDB using useLiveQuery
- If project not found, show "Project not found" error with link back to dashboard
- Display header with:
  - Project name (left side)
  - Current phase badge (right side)
  - "Back to Projects" link (top left, above name)
- Render children below header

PLANNING PAGE (app/project/[id]/planning/page.tsx):
- Show "Planning Phase" as main heading
- Show placeholder text: "Chat interface coming in next slice..."
- That's it - keep it minimal

ROUTING CHECK:
- /project/abc123/planning should load if abc123 exists
- /project/invalid-id/planning should show "Project not found"
- / should still show dashboard

VERIFY:
1. Create a project on dashboard
2. Click the project card
3. Navigate to /project/[id]/planning
4. See project name in header
5. See "Planning Phase" heading
6. Click "Back to Projects"
7. Return to dashboard
```

## How to Verify

1. Start at dashboard with existing project
2. Click project card
3. URL changes to /project/[uuid]/planning
4. See project name in header
5. See "Planning Phase" heading
6. Click back link
7. Return to dashboard

## What NOT to Build Yet
- No chat interface (Slice 03)
- No phase indicator navigation (later slice)
- No other phase pages (built when needed)

## Notes
- Routing structure set up correctly
- Dev server tested and confirmed working


---

## Completion
- [x] Slice complete
- [ ] Committed to git
- Date: Dec 24, 2025
