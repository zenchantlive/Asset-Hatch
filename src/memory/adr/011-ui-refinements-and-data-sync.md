# ADR 011: UI Refinements and Data Sync Architecture

## Status
Accepted

## Date
2025-12-28

## Context

The Asset Hatch application had several UX issues that needed addressing:

1. **Font Choice**: The serif font (Playfair Display) looked out of place for a developer tool
2. **Mobile Layout**: The toolbar was broken on mobile viewports with overlapping elements
3. **Parameters Visibility**: Users wanted to see Asset Parameters populate live during AI tool calls
4. **Plan Preview Styling**: The markdown rendering was too dim and hard to read
5. **OAuth Account Linking**: Users couldn't sign in with GitHub if they had previously registered with email/password
6. **Data Sync Gap**: Projects created via Prisma API weren't accessible to client-side Dexie queries in GenerationQueue

## Decision

### Typography
Replace Playfair Display (serif) with **Space Grotesk** - a clean geometric sans-serif that matches the dev tool aesthetic while maintaining visual hierarchy.

### Responsive Layout
Implement a two-tier toolbar approach:
- **Desktop (lg+)**: Single horizontal bar with centered mode tabs
- **Mobile (<lg)**: Stacked layout with full-width tabs on row 1, action buttons on row 2

### Collapsible Parameters Bar
- Visible and expanded by default on desktop
- Minimizable with chevron toggle
- Prominent "ASSET PARAMETERS" label
- Popover mode removed from desktop toolbar (redundant)

### Plan Preview Colors
- H1: Gradient text (primary → purple → blue)
- H2: Purple accent border, white text
- Category items: Purple bullets with ring glow
- Tree sub-items: Cyan text for visibility
- Checkmarks: Emerald green

### OAuth Account Linking
Enable `allowDangerousEmailAccountLinking: true` on GitHub provider to allow users to sign in with GitHub even if they previously registered with email/password.

### Prisma → Dexie Sync
Add `useEffect` in planning page that calls `fetchAndSyncProject()` on mount to ensure IndexedDB (Dexie) has project data from Prisma before GenerationQueue tries to access it.

## Consequences

### Positive
- Cleaner, more professional typography
- Mobile-first responsive layout that works at all breakpoints
- Parameters visible by default, encouraging user engagement
- Better contrast and readability in plan preview
- Seamless auth experience with multiple providers
- GenerationQueue can now find project data reliably

### Negative
- Additional network request on page load for sync (minor latency)
- `allowDangerousEmailAccountLinking` has security implications (documented in Auth.js)

## Implementation Files

- `app/layout.tsx` - Font swap to Space Grotesk
- `app/globals.css` - Heading styles, typography
- `app/project/[id]/planning/page.tsx` - Responsive toolbar, sync useEffect
- `components/planning/QualitiesBar.tsx` - Collapsible bar mode
- `components/planning/PlanPreview.tsx` - Color improvements
- `auth.ts` - OAuth account linking
- `lib/sync.ts` - Date handling for JSON API responses
