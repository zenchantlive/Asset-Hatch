# Slice 09: Confirm Style and Navigate to Generation

## User Story
**As a user, when I'm happy with my style reference and colors, I can click "Confirm Style" and move to the Generation phase.**

## What This Slice Delivers
- Style description input (optional manual entry)
- "Confirm Style" button
- Style locking (timestamp)
- Phase transition to Generation
- Generation page placeholder

## Acceptance Criteria
- [ ] Can enter/edit style description text
- [ ] "Confirm Style" button visible when image uploaded
- [ ] Button disabled if no image uploaded
- [ ] Clicking button shows confirmation dialog
- [ ] After confirmation, navigate to /project/[id]/generation
- [ ] Project phase updates to "generation" in database
- [ ] Style locked (locked_at timestamp set)
- [ ] Generation page shows placeholder

## Files Created/Modified
```
app/
└── project/[id]/
    ├── style/page.tsx               # MODIFY: Add description + confirm button
    └── generation/page.tsx          # NEW: Generation page placeholder

components/
└── style/
    └── StyleDescription.tsx         # NEW: Text area for style description
```

## Prompt for AI Agent

```
Add style confirmation and generation page navigation.

STYLE DESCRIPTION (components/style/StyleDescription.tsx):
Create a text area for style description:

Display:
- Label: "Style Description"
- Textarea (3-4 rows)
- Placeholder: "Describe the visual style (e.g., 'Pixel art inspired by Stardew Valley, soft colors, 32x32 sprites')"
- Character count (optional)

Props:
- value: string
- onChange: (value: string) => void

DEFAULT DESCRIPTION:
When image is uploaded, auto-generate a simple description based on qualities:
```typescript
const defaultDescription = `${qualities.art_style || 'Game'} style, ${qualities.base_resolution || '32x32'} sprites, ${qualities.mood || 'cheerful'} mood`;
```
User can edit this.

CONFIRM STYLE BUTTON (app/project/[id]/style/page.tsx):
Add button below the description:
- Position: Bottom of style panel
- Disabled: When no image uploaded
- Enabled: When image exists
- Text: "Confirm Style & Continue"

On click:
1. Show confirmation dialog:
   - Title: "Confirm Your Style?"
   - Show thumbnail of style image
   - Show color count
   - Message: "This will be used to generate all your assets. You can change it later, but may need to regenerate assets."
   - Buttons: "Cancel" and "Confirm & Generate"
2. On confirm:
   - Update style-anchor.json with locked_at: new Date().toISOString()
   - Update project.phase to "generation" in IndexedDB
   - Navigate to /project/[id]/generation

STYLE-ANCHOR.JSON COMPLETE STRUCTURE:
```json
{
  "reference_image": "stored_blob_id",
  "color_palette": ["#D4AF37", "#2E4057", ...],
  "style_description": "Pixel art inspired by Stardew Valley...",
  "art_style": "Pixel Art",
  "locked_at": "2025-01-15T10:30:00.000Z"
}
```
Include art_style from project qualities.

GENERATION PAGE (app/project/[id]/generation/page.tsx):
Create placeholder page:
- Heading: "Generation Phase"
- Subheading: "Generate your game assets"
- Show asset count from plan: "Ready to generate X assets"
- Placeholder: "Generation controls coming in next slice..."

VERIFY:
1. Complete style page (image + colors)
2. Enter style description
3. See "Confirm Style" button enabled
4. Click button
5. See confirmation dialog with image thumbnail
6. Click "Confirm & Generate"
7. Navigate to /project/[id]/generation
8. See "Generation Phase" heading
9. See "Ready to generate X assets" with actual count
10. Check IndexedDB - project.phase is "generation"
11. Check style-anchor.json has locked_at timestamp
```

## How to Verify

1. Have image and colors on style page
2. Enter style description
3. Click "Confirm Style & Continue"
4. See confirmation dialog
5. Click "Confirm & Generate"
6. Navigate to generation page
7. See asset count from plan
8. Check database - phase is "generation"
9. Return to dashboard - project shows "Generation" badge

## What NOT to Build Yet
- No actual generation (Slice 10)
- No re-editing style with warnings (later polish)
- No AI style description generation (not needed for MVP)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
