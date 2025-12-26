# Slice 08: Extract and Display Colors from Image

## User Story
**As a user, when I upload a style reference image, I see the dominant colors extracted and displayed as a palette.**

## What This Slice Delivers
- Color extraction using ColorThief
- Color palette display component
- Editable palette (add/remove colors)
- Colors saved to style-anchor.json

## Acceptance Criteria
- [ ] After uploading image, see 5-8 extracted colors
- [ ] Colors displayed as colored squares with HEX codes
- [ ] Can click a color to remove it
- [ ] Can add custom color (HEX input)
- [ ] Palette saved to style-anchor.json
- [ ] Palette persists after refresh

## Files Created/Modified
```
components/
└── style/
    ├── StyleUploader.tsx            # MODIFY: Trigger color extraction
    └── ColorPalette.tsx             # NEW: Color display/edit component

lib/
└── color-extractor.ts               # NEW: ColorThief wrapper
```

## Prompt for AI Agent

```
Add color extraction to the style page.

COLOR EXTRACTOR (lib/color-extractor.ts):
Create a wrapper for ColorThief:

```typescript
import ColorThief from 'colorthief';

export async function extractColors(imageElement: HTMLImageElement, count: number = 8): Promise<string[]> {
  const colorThief = new ColorThief();
  
  // Wait for image to load if needed
  if (!imageElement.complete) {
    await new Promise(resolve => imageElement.onload = resolve);
  }
  
  // Get palette (returns array of [r, g, b])
  const palette = colorThief.getPalette(imageElement, count);
  
  // Convert to HEX
  return palette.map(([r, g, b]) => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  });
}
```

COLOR PALETTE (components/style/ColorPalette.tsx):
Create a component to display and edit colors:

Display:
- Row of color squares (40x40px each)
- Each square shows the color as background
- HEX code below each square (#D4AF37)
- Small X button in corner to remove color
- "+ Add" button at end to add custom color

Add Color:
- Clicking "+" shows input for HEX code
- Validate HEX format (#RRGGBB or #RGB)
- On valid input, add to palette
- On invalid, show error

Props:
- colors: string[] (array of HEX codes)
- onColorsChange: (colors: string[]) => void
- maxColors?: number (default 10)

STYLE PAGE UPDATE (app/project/[id]/style/page.tsx):
- When image is uploaded, extract colors
- Display ColorPalette below image preview
- Save colors to style-anchor.json content:
  ```json
  {
    "reference_image": "blob:...",
    "color_palette": ["#D4AF37", "#2E4057", "#048A81", ...]
  }
  ```
- When colors change (add/remove), update style-anchor.json

INTEGRATION FLOW:
1. User uploads image
2. Image displays as preview
3. Call extractColors() on the image
4. Display extracted colors in ColorPalette
5. User can add/remove colors
6. All changes saved to style-anchor.json

VERIFY:
1. Upload a colorful image (game screenshot, pixel art)
2. See 5-8 colors extracted below image
3. Each color shows HEX code
4. Click X on one color - it's removed
5. Click "+" to add color
6. Enter "#FF5733"
7. New color appears in palette
8. Refresh page - custom color still there
```

## How to Verify

1. Upload a style reference image
2. See color palette appear below image (5-8 colors)
3. Colors display with HEX codes
4. Remove a color by clicking X
5. Add custom color "#00FF00"
6. Green color appears in palette
7. Refresh page
8. Custom color persists

## What NOT to Build Yet
- No AI style description (can add later if needed)
- No "Confirm Style" button (Slice 09)
- No visual rules generation (can add later)

## Notes

---

## Completion
- [ ] Slice complete
- [ ] Committed to git
- Date: ___
