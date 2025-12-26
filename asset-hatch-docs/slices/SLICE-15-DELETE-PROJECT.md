# Slice 15: Delete Project from Dashboard

## User Story
**As a user, I can delete a project I no longer need from the dashboard.**

## What This Slice Delivers
- Delete button on project cards
- Confirmation dialog
- Cascade delete (project + assets + memory files)
- Storage freed up

## Acceptance Criteria
- [ ] Delete button/icon on each project card
- [ ] Clicking shows confirmation: "Delete [project name]?"
- [ ] Confirmation shows what will be deleted (X assets)
- [ ] Confirm deletes everything for that project
- [ ] Project disappears from list immediately
- [ ] Cannot accidentally delete (requires confirmation)

## Files Created/Modified
```
components/
└── ProjectCard.tsx                  # MODIFY: Add delete button

app/
└── page.tsx                         # MODIFY: Handle delete
```

## Prompt for AI Agent

```
Add project deletion to the dashboard.

PROJECT CARD UPDATE (components/ProjectCard.tsx):
Add delete functionality:

- Add trash icon button (top-right corner of card)
- On click: call onDelete prop, prevent navigation
- Use event.stopPropagation() to prevent card click
- Icon: use lucide-react Trash2 icon
- Hover effect: icon turns red

Props addition:
- onDelete: (e: React.MouseEvent) => void

DASHBOARD UPDATE (app/page.tsx):
Handle deletion with confirmation:

```typescript
const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
const [deleteStats, setDeleteStats] = useState({ assets: 0 });

const handleDeleteClick = async (project: Project) => {
  // Get count of assets for this project
  const assetCount = await db.assets.where('project_id').equals(project.id).count();
  setDeleteStats({ assets: assetCount });
  setDeleteTarget(project);
};

const confirmDelete = async () => {
  if (!deleteTarget) return;
  
  // Cascade delete
  await db.assets.where('project_id').equals(deleteTarget.id).delete();
  await db.memory_files.where('project_id').equals(deleteTarget.id).delete();
  await db.generation_log.where('project_id').equals(deleteTarget.id).delete();
  await db.projects.delete(deleteTarget.id);
  
  setDeleteTarget(null);
};
```

CONFIRMATION DIALOG:
Use shadcn Dialog component:

```tsx
<Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Project?</DialogTitle>
      <DialogDescription>
        This will permanently delete "{deleteTarget?.name}" including:
        • {deleteStats.assets} generated assets
        • All planning data and conversations
        
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteTarget(null)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={confirmDelete}>
        Delete Project
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

VERIFY:
1. Go to dashboard with multiple projects
2. See trash icon on each project card
3. Click trash icon on one project
4. See confirmation dialog with project name
5. See asset count to be deleted
6. Click Cancel - dialog closes, nothing deleted
7. Click Delete - project removed from list
8. Refresh page - project still gone
9. Check IndexedDB - no orphaned assets or memory files
```

## How to Verify

1. Create 2-3 projects with some assets
2. Click delete on one project
3. See confirmation with stats
4. Confirm delete
5. Project disappears immediately
6. Refresh - still gone
7. Other projects unaffected

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
