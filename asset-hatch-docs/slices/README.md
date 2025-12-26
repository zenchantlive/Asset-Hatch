# Asset Hatch - Vertical Slice Development

## Philosophy

Each slice delivers **one working user behavior** from UI → API → Database → back to UI.

After completing each slice, you can **demo that feature working**. No slice depends on "finishing the UI later" or "wiring up the backend later."

## Slice Overview

| Slice | User Can... | Time |
|-------|-------------|------|
| 00 | Run the app locally | 1-2 hrs |
| 01 | Create a project and see it in list | 2-3 hrs |
| 02 | Open a project and see empty planning page | 1-2 hrs |
| 03 | Type a message and see agent respond | 3-4 hrs |
| 04 | See dropdown update when agent calls updateQuality | 2-3 hrs |
| 05 | See entity appear in plan when agent calls addEntityToPlan | 2-3 hrs |
| 06 | Click "Approve Plan" and navigate to Style phase | 1-2 hrs |
| 07 | Upload an image and see it displayed | 2-3 hrs |
| 08 | See extracted colors from uploaded image | 1-2 hrs |
| 09 | Click "Confirm Style" and navigate to Generation phase | 1-2 hrs |
| 10 | Generate ONE asset and see it displayed | 4-6 hrs |
| 11 | Approve or regenerate a single asset | 2-3 hrs |
| 12 | Generate all assets in queue automatically | 3-4 hrs |
| 13 | See progress bar with accurate count | 1-2 hrs |
| 14 | Export project as ZIP with manifest | 3-4 hrs |
| 15 | Delete a project from dashboard | 1-2 hrs |
| 16 | Resume a project where I left off | 2-3 hrs |
| 17 | Start from a template with pre-filled plan | 2-3 hrs |
| 18 | See storage usage warnings | 2-3 hrs |
| **TOTAL** | **Complete MVP** | **35-50 hrs** |

## Critical Gates

After certain slices, you must validate before continuing:

- **After Slice 06**: Full planning flow works (describe game → get plan → approve)
- **After Slice 10**: Image generation works with style consistency
- **After Slice 12**: 20+ assets maintain visual consistency ← **MAKE OR BREAK**
- **After Slice 14**: Complete workflow works end-to-end

## How to Use These Documents

1. Open the slice document
2. Copy the "Prompt for AI Agent" section
3. Paste to Claude Code
4. Test the result
5. If broken, describe what's wrong and iterate
6. When working, commit and move to next slice

## File Structure After All Slices

```
asset-hatch/
├── app/
│   ├── api/
│   │   ├── copilotkit/route.ts      (Slice 03)
│   │   └── generation/route.ts       (Slice 10)
│   ├── project/[id]/
│   │   ├── planning/page.tsx         (Slice 02-06)
│   │   ├── style/page.tsx            (Slice 07-09)
│   │   ├── generation/page.tsx       (Slice 10-13)
│   │   └── export/page.tsx           (Slice 14)
│   ├── page.tsx                       (Slice 01, 15)
│   └── layout.tsx                     (Slice 00)
├── components/
│   ├── planning/
│   │   ├── ChatInterface.tsx          (Slice 03)
│   │   ├── QualitiesBar.tsx           (Slice 04)
│   │   └── PlanPreview.tsx            (Slice 05)
│   ├── style/
│   │   ├── StyleUploader.tsx          (Slice 07)
│   │   └── ColorPalette.tsx           (Slice 08)
│   ├── generation/
│   │   ├── AssetPreview.tsx           (Slice 10-11)
│   │   ├── GenerationQueue.tsx        (Slice 12)
│   │   └── ProgressBar.tsx            (Slice 13)
│   └── export/
│       └── ExportPanel.tsx            (Slice 14)
├── lib/
│   ├── db.ts                          (Slice 01)
│   ├── prompt-builder.ts              (Slice 10)
│   └── manifest-builder.ts            (Slice 14)
└── .env.local                         (Slice 00)
```

## Progress Tracker

Mark each slice when complete:

- [x] Slice 00: Project runs
- [x] Slice 01: Create/list projects
- [x] Slice 02: Open project
- [x] Slice 03: Chat works
- [ ] Slice 04: Quality tool works
- [ ] Slice 05: Entity tool works
- [ ] Slice 06: Approve plan works
- [ ] **GATE: Planning flow validated**
- [ ] Slice 07: Image upload works
- [ ] Slice 08: Color extraction works
- [ ] Slice 09: Confirm style works
- [ ] Slice 10: Single generation works
- [ ] **GATE: Generation produces styled output**
- [ ] Slice 11: Approve/regenerate works
- [ ] Slice 12: Batch queue works
- [ ] **GATE: 20+ assets visually consistent**
- [ ] Slice 13: Progress bar works
- [ ] Slice 14: Export works
- [ ] **GATE: End-to-end workflow complete**
- [ ] Slice 15: Delete project works
- [ ] Slice 16: Resume project works
- [ ] Slice 17: Templates work
- [ ] Slice 18: Storage warnings work
- [ ] **MVP COMPLETE**
