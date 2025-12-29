# ⚙️ System Patterns

**Purpose:** Registry of lessons learned, coding standards, and gotchas to prevent re-litigating decisions.

**Last Updated:** 2025-12-26

---

## 🏗️ Architecture Guidelines

### Component Structure
* **All UI components with hooks must use `"use client"`** directive
* **Server Components by default**, only add `"use client"` when needed (hooks, browser APIs)
* **Composition over configuration** - Build complex components from simple primitives

### State Management
* **Props drilling initially**, migrate to Context API only when necessary
* **Local state first** (`useState`), lift up only when multiple components need it
* **Hybrid Persistence Model**: Prisma/SQLite for server-side source of truth (API); Dexie for client-side state and caching.
* **Vercel AI SDK manages its own state** - The `messages` array from `useChat` is the source of truth for conversation history.

### Data Flow
```
User Input → React State → Vercel AI SDK (stream) → OpenRouter API → AI Response
                ↓                                                      ↓
          Local State Update ← Parse Response ← Stream Response ← LLM
                ↓
          Prisma (API) → Server Source of Truth
                ↓
         IndexedDB (Dexie) ← Client-side Cache
```

### File Organization
```
/app                    - Next.js App Router pages
/components
  /ui                   - Primitive components (Button, Input, Select)
  /planning             - Feature components (ChatInterface, QualitiesBar)
  /[feature]            - Feature-specific components
/lib                    - Utilities (db.ts, utils.ts)
/adr                    - Architecture Decision Records
```

---

## 💅 Code Style & Standards

### TypeScript
* **Use `const` over `let`** (immutability by default)
* **Strict mode enabled** - No implicit any, strict null checks. Whitelisting in `tsconfig.json` to prevent library type conflicts.
* **Interface over type** for object shapes (unless union/intersection needed)
* **Explicit return types** for exported functions (implicit OK for internal)

### React
* **Functional components only** (no class components)
* **Hooks at top level** - Don't call hooks conditionally
* **Destructure props** - `({ prop1, prop2 })` not `(props)`
* **Early returns** for conditional rendering

### Styling
* **Tailwind utility-first** - Avoid custom CSS unless necessary
* **rem units for dimensions** (not px) - Use 0.25rem increments
* **CSS variables for theming** - Prefix with `--aurora-` or `--glass-`
* **Mobile-first responsive** - Default styles for mobile, `md:` for desktop

### Naming Conventions
* **Components:** PascalCase (`ChatInterface.tsx`)
* **Files:** kebab-case for non-components (`active-state.md`)
* **Functions:** camelCase (`handleSendMessage`)
* **Constants:** SCREAMING_SNAKE_CASE (`SAMPLE_PLAN`, `QUALITY_OPTIONS`)
* **CSS classes:** kebab-case (`.glass-panel`, `.aurora-gradient`)

---

## ⚠️ Known "Gotchas" / Edge Cases

### Development Environment
* **WSL + Windows Hybrid**
  - User runs `bun` in PowerShell (native Windows)
  - AI runs in WSL (Linux)
  - **Solution:** User manually runs `bun` commands, AI uses `npm` for system checks
  - **Symptom:** `npm install` fails with exit code 137 (OOM in WSL)

* **Bun vs npm**
  - Project uses Bun for package management (`bun.lock` exists)
  - WSL may not have Bun in PATH
  - **Solution:** Check if Bun available, fallback to npm, or ask user to run command

### Vercel AI SDK Integration
* **System Prompt Location**
  - Defined in `app/api/chat/route.ts` using the `system` property in `streamText`.
  - **Gotcha:** Changing frontend prompts won't update the core system instructions.

* **Message State**
  - Vercel AI SDK manages messages internally via the `useChat` hook.
  - **Access via:** `messages` from the hook.

* **Streaming Responses**
  - API route must handle streaming properly using `toUIMessageStreamResponse()`.
  - **File:** `app/api/chat/route.ts`

### Glassmorphism Styling
* **Invisible Glass Effect**
  - `backdrop-filter: blur()` only visible over colored background
  - **Symptom:** White panels on white background (invisible)
  - **Solution:** Add colored gradient to `body` or parent container
  - **File:** `app/globals.css` - add background to `:root` or `body`
  - **Gotcha:** Containers with `bg-background` or opaque colors will block the body gradients. Use `bg-transparent` for main page containers to reveal the aurora effect.

* **CSS @apply Recursion**
  - **Gotcha:** Do not use `@apply custom-class` inside the definition of another class in the same file if `custom-class` is also custom. It may cause `Cannot apply unknown utility class` build errors. 
  - **Solution:** Manually copy properties or use standard Tailwind utilities in `@apply`.
  - **File:** `app/globals.css` (.glass-interactive fix)

* **Typography Standards**
  - **Standard:** Use the **Outfit** font for all primary UI text to maintain the geometric, modern aesthetic.
  - **Implementation:** Applied via `next/font/google` in `layout.tsx` and the `font-sans` variable.

### Database (Dexie)
* **Schema Versioning**
  - Incrementing version number required for schema changes
  - Current version: `1`
  - **File:** `lib/db.ts`
  - **Gotcha:** Adding new table requires `.version(2).stores({ ... })

* **IndexedDB Limits**
  - Browsers have storage quotas (varies by browser)
  - Typically 50-100MB for origin
  - **Mitigation:** Compress images, use external storage for large files

---

## 🎨 UX Patterns

### Empty States
* **Always include:**
  - Icon (from lucide-react)
  - Helpful text explaining what to do
  - Optional CTA button
* **Example:** ChatInterface empty state (Sparkles icon + instruction text)

### Loading States
* **Use aurora-themed animations:**
  - Bouncing dots (3 dots with staggered delays)
  - Spinning aurora gradient (for longer waits)
* **Never use:** Generic spinners or "Loading..." text alone
* **File:** `components/planning/ChatInterface.tsx:67-79` (thinking indicator)

### Form Inputs
* **Use `.glass-input` class** for consistent styling
* **Focus states** should show aurora glow (not default browser outline)
* **Placeholder text** should be helpful, not redundant with label

### Buttons
* **Primary actions:** `.aurora-gradient` background (animated)
* **Secondary actions:** `.glass-panel` background (glass effect)
* **Disabled state:** Reduce opacity to 0.5, change cursor to `not-allowed`

### Messages (Chat)
* **User messages:** Right-aligned, aurora gradient background, white text
* **AI messages:** Left-aligned, glass panel, aurora glow on hover
* **Max width:** 85% of container (not full width)

---

## 🧪 Testing Strategies

### Manual Testing Checklist
- [ ] Test in Chrome, Firefox, Safari (cross-browser)
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Test on mobile viewport (375px width)
- [ ] Test dark mode toggle
- [ ] Test with slow network (throttle to 3G)

### Automated Testing (Future)
* **Unit tests:** Vitest + React Testing Library.
* **API Integration tests:** Jest with `node` environment.
* **UI Component tests:** Jest with `jsdom` environment (add `/** @jest-environment jsdom */` per file).
* **Environment Guards:** `jest.setup.js` must guard window-only mocks with `typeof window !== 'undefined'`.

---

## 📐 Design Tokens (Reference)

### Spacing Scale
```css
--space-xs: 0.25rem   /* 4px */
--space-sm: 0.5rem    /* 8px */
--space-md: 1rem      /* 16px */
--space-lg: 1.5rem    /* 24px */
--space-xl: 2rem      /* 32px */
--space-2xl: 3rem     /* 48px */
```

### Layout Dimensions
```css
--header-height: 4rem           /* 64px */
--qualities-bar-height: 3.5rem  /* 56px */
```

### Aurora Colors
```css
--aurora-1: oklch(0.40 0.20 270 / 0.4)  /* Deep Purple */
--aurora-2: oklch(0.35 0.15 230 / 0.4)  /* Deep Blue */
--aurora-3: oklch(0.45 0.20 310 / 0.3)  /* Magenta */
--aurora-4: oklch(0.30 0.15 200 / 0.3)  /* Teal */
```

### Glass Effects
```css
--glass-bg: oklch(0.98 0 0 / 0.7)       /* Light mode */
--glass-bg-dark: oklch(0.2 0 0 / 0.7)   /* Dark mode */
--glass-border: oklch(1 0 0 / 0.15)     /* Light border */
```

---

## 🔄 Common Patterns

### Creating a New Component
1. Create file in appropriate directory (`/components/[feature]/ComponentName.tsx`)
2. Add `"use client"` if using hooks or browser APIs
3. Use TypeScript interface for props
4. Export as named export (not default, unless page component)
5. Add to barrel export (index.ts) if creating a library

### Adding a New Quality Dropdown
1. Update `QUALITY_OPTIONS` in `QualitiesBar.tsx`
2. Add field to `ProjectQualities` interface
3. Add dropdown in JSX (copy existing pattern)
4. Update database schema (if persisting)

### Creating an ADR
1. Create file: `adr/00X-decision-name.md`
2. Use template from `adr/000-template.md`
3. Fill in Context, Decision, Consequences
4. Add to active_state.md → Verifiable Context

---

**Next Update:** When we establish a new pattern or encounter a new gotcha.
