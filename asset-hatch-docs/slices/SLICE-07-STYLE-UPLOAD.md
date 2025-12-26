# Slice 07: Upload Style Image and See It Displayed

## User Story
**As a user, I can upload a reference image and see it displayed on the style page.**

## What This Slice Delivers
- Image upload component with drag-and-drop
- Image preview display
- Image storage in IndexedDB
- Basic validation (file type, size)

## Acceptance Criteria
- [ ] Drag-and-drop zone visible on style page
- [ ] Can click to browse for file
- [ ] Accepts PNG, JPG, WebP only
- [ ] Rejects files over 5MB with error message
- [ ] Uploaded image displays as preview
- [ ] Can remove/replace uploaded image
- [ ] Image persists after page refresh

## Files Created/Modified
```
app/
└── project/[id]/style/page.tsx      # MODIFY: Add StyleUploader

components/
└── style/
    └── StyleUploader.tsx            # NEW: Upload component with preview
```

## Prompt for AI Agent

```
Add image upload to the style page.

STYLE UPLOADER (components/style/StyleUploader.tsx):
Create an upload component:

UPLOAD ZONE:
- Dashed border box with centered text
- Icon: upload or image icon
- Text: "Drop your style reference image here"
- Subtext: "or click to browse (PNG, JPG, WebP - max 5MB)"
- On hover: subtle background color change
- On drag over: highlight border

DRAG AND DROP:
- Handle onDragOver, onDragLeave, onDrop events
- Prevent default browser behavior
- Extract file from event.dataTransfer.files

FILE INPUT:
- Hidden input type="file"
- Accept: "image/png, image/jpeg, image/webp"
- Clicking the zone triggers file input click

VALIDATION:
- Check file.type is image/png, image/jpeg, or image/webp
- Check file.size <= 5 * 1024 * 1024 (5MB)
- If invalid: show error toast/message, don't proceed
- Error messages:
  - Wrong type: "Please upload a PNG, JPG, or WebP image"
  - Too large: "Image must be under 5MB"

IMAGE PREVIEW:
- When valid image selected:
  - Hide upload zone
  - Show image preview (max-width: 100%, maintain aspect ratio)
  - Show file name below image
  - Show "Remove" button to delete and show upload zone again

STORAGE:
- Convert image to blob
- Store in memory_files table with type: "style-reference"
- Create style-anchor.json with reference_image field pointing to the file

Props:
- imageBlob: Blob | null (current image)
- onImageChange: (blob: Blob | null) => void

STYLE PAGE UPDATE (app/project/[id]/style/page.tsx):
- Remove placeholder text
- Add StyleUploader component
- Load existing style reference from memory_files on mount
- Pass to StyleUploader as initial value
- When image changes, save to IndexedDB

PERSISTENCE:
Use useLiveQuery to load the style-anchor.json memory file.
When component mounts, check if image already exists and display it.

VERIFY:
1. Go to style page (after approving a plan)
2. See drag-drop upload zone
3. Drag an image file onto the zone
4. See image preview displayed
5. Click "Remove" - upload zone reappears
6. Click the zone to browse
7. Select an image
8. See preview
9. Refresh page - image still displayed
10. Try uploading a .txt file - see error message
11. Try uploading a 10MB image - see error message
```

## How to Verify

1. Navigate to style page
2. See upload zone
3. Drag a PNG image onto zone
4. Image appears as preview
5. See filename displayed
6. Click "Remove"
7. Upload zone reappears
8. Click zone, select JPG from file dialog
9. Image preview shows
10. Refresh page
11. Image still displayed

## What NOT to Build Yet
- No color extraction (Slice 08)
- No style description generation (Slice 08)
- No "Confirm Style" button (Slice 09)
- No WebP compression (later optimization)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
