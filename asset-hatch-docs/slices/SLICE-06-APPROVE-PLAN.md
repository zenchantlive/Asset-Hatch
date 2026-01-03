# Slice 06: Approve Plan and Navigate to Style

## User Story
**As a user, when I'm happy with my plan, I can click "Approve Plan" and move to the Style phase.**

## What This Slice Delivers
- Third CopilotKit tool: markPlanComplete
- "Approve Plan" button in UI
- Phase transition to Style
- Style page placeholder

## Acceptance Criteria
- [ ] "Approve Plan" button visible when plan has entities
- [ ] Button disabled if plan is empty
- [ ] Agent can call markPlanComplete to suggest approval
- [ ] Clicking button shows confirmation dialog
- [ ] After approval, navigate to /project/[id]/style
- [ ] Project phase updates to "style" in database
- [ ] Style page shows placeholder

## Files Created/Modified
```
app/
├── api/copilotkit/route.ts          # MODIFY: Add markPlanComplete tool
├── project/[id]/
│   ├── planning/page.tsx            # MODIFY: Add approve button
│   └── style/page.tsx               # NEW: Style page placeholder
```

## Prompt for AI Agent

```
Add plan approval and style page navigation.

COPILOTKIT TOOL (app/api/copilotkit/route.ts):
Add the markPlanComplete tool:

```typescript
{
  name: "markPlanComplete",
  description: "Mark the asset plan as complete and ready for style selection. Call this when the user has confirmed they're happy with the planned assets.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async ({ projectId }) => {
    // Note: This just signals the UI, actual phase change happens on button click
    return "Plan marked as ready. User can now click 'Approve Plan' to proceed to style selection.";
  }
}
```

APPROVE PLAN BUTTON (app/project/[id]/planning/page.tsx):
Add an "Approve Plan" button:
- Position: Bottom of the plan preview panel, or below chat
- Disabled state: When entities.length === 0
- Enabled state: When entities.length > 0
- Styling: Primary button, prominent

On click:
1. Show confirmation dialog:
   - Title: "Approve Plan?"
   - Message: "You have X assets planned. You can still edit your plan later, but let's set your visual style next."
   - Buttons: "Cancel" and "Approve & Continue"
2. On confirm:
   - Update project.phase to "style" in IndexedDB
   - Navigate to /project/[id]/style using router.push()

STYLE PAGE (app/project/[id]/style/page.tsx):
Create placeholder page:
- Heading: "Style Phase"
- Subheading: "Upload a reference image to establish your visual style"
- Placeholder text: "Style upload component coming in next slice..."
- Back button to return to planning (with warning about phase change)

PHASE UPDATE IN PROJECT LAYOUT:
The project layout (app/project/[id]/layout.tsx) should:
- Show current phase in header
- When phase is "style", highlight that in navigation

SYSTEM PROMPT UPDATE:
Add to system prompt:
"When you think the plan is complete (good coverage of characters, environment, UI, etc.), ask the user to review the plan. If they're satisfied, call markPlanComplete to let them know they can proceed to style selection."

VERIFY:
1. Create a plan with 5+ entities
2. Agent suggests the plan is ready
3. See "Approve Plan" button enabled
4. Click button
5. See confirmation dialog
6. Click "Approve & Continue"
7. Navigate to /project/[id]/style
8. See "Style Phase" heading
9. Check IndexedDB - project.phase is now "style"
10. Go back to dashboard - project card shows "Style" badge
```

## GATE CHECK: Planning Flow

After completing this slice, validate the full planning flow:

1. [ ] Create new project from dashboard
2. [ ] Navigate to planning page
3. [ ] Describe a game concept
4. [ ] Agent asks clarifying questions
5. [ ] Agent sets qualities (dropdowns update)
6. [ ] Agent adds entities (plan preview updates)
7. [ ] Agent suggests plan is complete
8. [ ] Click "Approve Plan"
9. [ ] Navigate to style page
10. [ ] Project phase updated in database

**If all 10 steps work: proceed to Slice 07**
**If issues: fix before continuing**

## How to Verify

1. Have a project with 5+ entities planned
2. See "Approve Plan" button is enabled
3. Click button
4. See confirmation dialog with entity count
5. Click "Approve & Continue"
6. URL changes to /project/[id]/style
7. See Style Phase heading
8. Navigate to dashboard
9. Project card shows "Style" badge

## What NOT to Build Yet
- No style upload (Slice 07)
- No back-navigation warnings (later polish)
- No phase indicator component (later polish)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- [ ] **GATE VALIDATED: Full planning flow works**
- Date: ___
