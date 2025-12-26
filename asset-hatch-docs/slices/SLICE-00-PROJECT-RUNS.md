# Slice 00: Project Runs Locally

## User Story
**As a developer, I can run `pnpm dev` and see an empty app in my browser.**

## What This Slice Delivers
- Next.js 15 app with TypeScript
- Tailwind CSS configured
- shadcn/ui installed with basic components
- Environment variable setup
- Empty page that loads without errors

## Acceptance Criteria
- [ ] `pnpm dev` starts without errors
- [ ] Browser shows page at localhost:3000
- [ ] Page displays "Asset Hatch" title
- [ ] No TypeScript or console errors

## Files Created
```
asset-hatch/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page (empty for now)
│   └── globals.css         # Tailwind imports
├── components/
│   └── ui/                 # shadcn components (button, card, input)
├── lib/
│   └── utils.ts            # shadcn utility (cn function)
├── .env.local              # OPENROUTER_API_KEY placeholder
├── .env.example            # Template for env vars
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

## Prompt for AI Agent

```
Create a new Next.js 15 project called "asset-hatch" with these requirements:

SETUP:
- Use TypeScript (strict mode)
- Use pnpm as package manager
- Use App Router (not pages)
- Use Tailwind CSS

DEPENDENCIES TO INSTALL:
- @copilotkit/react-core
- @copilotkit/react-ui  
- dexie
- dexie-react-hooks
- zod
- jszip
- colorthief

SHADCN COMPONENTS TO ADD:
- button
- card
- input
- textarea
- dialog
- progress
- badge
- skeleton

ENVIRONMENT:
Create .env.local with:
OPENROUTER_API_KEY=your_key_here

Create .env.example with:
OPENROUTER_API_KEY=

HOME PAGE (app/page.tsx):
Just show a centered heading "Asset Hatch" and subtitle "AI-Powered Game Asset Studio"

LAYOUT (app/layout.tsx):
- Set up basic HTML structure
- Import globals.css
- Add metadata (title: "Asset Hatch")
- DO NOT add CopilotKit provider yet (that's Slice 03)

VERIFY:
After setup, run `pnpm dev` and confirm the page loads at localhost:3000 with no errors.
```

## How to Verify

1. Run `pnpm dev`
2. Open http://localhost:3000
3. See "Asset Hatch" heading
4. Open browser console - no errors
5. Check terminal - no TypeScript errors

## What NOT to Build Yet
- No database setup (Slice 01)
- No routing to other pages (Slice 02)
- No CopilotKit provider (Slice 03)
- No project creation logic (Slice 01)

## Notes
- Using bun instead of pnpm (switched during setup)
- All shadcn components installed successfully
- Dev server confirmed working on localhost:3000

---

## Completion
- [x] Slice complete
- [ ] Committed to git
- Date: Dec 24, 2025
