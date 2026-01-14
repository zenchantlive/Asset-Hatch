# ⚙️ System Patterns

**Purpose:** Registry of lessons learned, coding standards, and gotchas to prevent re-litigating decisions.

**Last Updated:** 2026-01-03

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

### Prisma 7 / PostgreSQL Adapter
* **Seed Script Adapter Mismatch**
  - **Issue:** Seed scripts using `new PrismaClient()` directly fail when the project uses `PrismaPg` adapter
  - **Symptom:** `TypeError: Cannot destructure property` or connection errors during `bunx prisma db seed`
  - **Solution:** Use the same adapter pattern as `lib/prisma.ts`:
    ```typescript
    import { Pool } from 'pg';
    import { PrismaPg } from '@prisma/adapter-pg';
    import { PrismaClient } from '@prisma/client';
    
    const pool = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    ```

* **prisma.config.ts vs package.json**
  - **Issue:** When using `prisma.config.ts`, the `prisma.seed` field in `package.json` is **ignored**
  - **Solution:** Add seed command to `prisma.config.ts`:
    ```typescript
    export default defineConfig({
      migrations: {
        seed: "bun prisma/seed.ts",  // Add this line
      },
    });
    ```

* **Environment Variables in Seed**
  - Seed scripts don't automatically load `.env.local` 
  - **Solution:** Use `dotenv` at the top of the seed file:
    ```typescript
    import { config } from 'dotenv';
    config({ path: '.env.local' });
    config();
    ```

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

### Generation / Batch Dashboard
* **Grid Layout:** Consistently use `grid-cols-2` with `gap-4` for asset lists.
* **Card Aspect:** Strictly enforce `aspect-square` for all generation preview cards.
* **Constraints:** Use `max-w-[80vh]` on grid containers to prevent layout stretching on large screens.
* **Animations:** Use `animate-in fade-in zoom-in-50` for item entry sequences.
* **Satisfying Exit Flow:** When an item is "completed" or "approved" in a batch view, use an exit animation before removal.
    - **Pattern:** `animate-out zoom-out-0 fade-out-0 duration-300 scale-0 opacity-0 rotate-12`
    - **Logic:** Set `isExiting` state → Wait 300ms (setTimeout) → Perform actual state removal.
    - **Why:** Prevents jarring layout shifts and provides positive reinforcement for task completion.

### Generation & Editing Logic
* **Generate vs Regenerate:**
    - **Generate:** Used for the *initial* creation of an asset (when `isPending` and has prompt). Icon: `Play`.
    - **Regenerate:** Used when an asset already has a result or error. Icon: `RefreshCw`.
* **Selection-Aware Actions:** Always check if an asset is part of a "Batch Selection" (`selectedIds`) before completing an action. If so, automatically deselect/remove it from the batch view upon success.

### Mobile UX Patterns
* **Chat-First Navigation**: On small screens, prioritize the AI conversation as the root view. Primary content (Plans, Styles, Models) should be accessed via high-visibility toolbar toggles.
* **Full-Screen Slide-out Overlays**: Content panels on mobile must use `inset-0` (full screen) and slide-out from the right or bottom. This matches user expectations for "layered" navigation.
* **Contextual Inputs**: Always provide a `CompactChatInput` within full-screen overlays so users can refine content without losing visual context.
* **Flat Lists over Hierarchies**: Prefer flattened lists (e.g., `FlatAssetList`) on mobile to maximize vertical density and reduce header noise.


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

### Large Blob Handling
* **Base64 Conversion Stack Overflow**
  - **Issue:** Using `String.fromCharCode(...uint8Array)` on large images (>4MB) exceeds call stack size.
  - **Solution:** Process the buffer in chunks (e.g., 16KB).
  - **Pattern:**
    ```typescript
    const chunkSize = 16384;
    let binary = '';
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    ```

### API Prompt Handling
* **Client Overrides**
  - **Pattern:** Always check for client-provided overrides (`customPrompt`) before generating new content on the server.
  - **Why:** Enables "Edit -> Regenerate" workflows where user modifications must be respected.
  - **Implementation:**
    ```typescript
    const prompt = customPrompt || buildAssetPrompt(...);
    ```

### Model Management & Cost Tracking
* **Centralized Registry**: Use `lib/model-registry.ts` as the single source of truth for model capabilities, pricing, and provider IDs. Enable `auto-discovery` for real-time updates.
* **Inline Cost Metrics**: Prefer inline metrics (e.g., in Toolbars/Control Bars) over floating overlays for non-intrusive budget awareness.
* **Cost Transparency (Est. → Total)**: Always show estimated costs before an action and transition to actual costs (highlighted in green) once confirmed by the API.

### React Async State Race Conditions
* **Problem:** When adding items to state arrays and immediately using them, React's async state updates cause "not found" errors.
  - **Example:** `addAsset(newAsset)` → `generateImage(newAsset.id)` → "Asset not found"
  - **Root Cause:** `setState` is asynchronous, so dependent code may run before state updates

* **Solution Pattern - Pass Object Directly:**
  - **Pattern:**
    ```typescript
    // Context provides function that accepts optional object
    const someAction = useCallback(async (id: string, providedObject?: T) => {
      const object = providedObject || stateArray.find(o => o.id === id)
      if (!object) return
      // Use object...
    }, [stateArray])

    // Consumer passes object directly to bypass lookup
    const newObject = createNewObject()
    addToState(newObject)  // Async state update
    await someAction(newObject.id, newObject)  // Bypasses lookup
    ```
  - **Why:** Avoids race condition by using the object reference directly instead of looking it up in state
  - **Example:** `generateImage(assetId: string, providedAsset?: ParsedAsset)` in GenerationQueue

* **Alternative Pattern - Callback After State Update:**
  - Use functional setState with callback:
    ```typescript
    setState(prev => {
      const newState = [...prev, newItem]
      // Trigger action here with access to newState
      return newState
    })
    ```
  - **Trade-off:** Mixes state updates with side effects; harder to test

---

### Emoji Logging Pattern (API Routes)
* **Pattern:** Use consistent emoji prefixes for console logs in API routes
  - 🎨 Starting operation
  - 📤 Submitting to external API
  - 📊 Polling/checking status
  - 💾 Database operation
  - ✅ Success
  - ❌ Error
* **Why:** Makes console output scannable at a glance, helps identify operations quickly
* **Example:**
  ```typescript
  console.log('🎨 Starting 3D asset generation:', { projectId, assetId });
  console.log('📤 Submitting task to Tripo3D...');
  console.log('✅ Task submitted:', tripoTask.task_id);
  console.error('❌ 3D generation error:', error);
  ```

### TODO Comments for Future Schema Changes
* **Pattern:** When code depends on a future schema field, comment out with clear TODO
  ```typescript
  // TODO: Add tripoApiKey field to User model in schema.prisma
  // const session = await auth();
  const userTripoApiKey: string | null = null;
  // if (session?.user?.id) {
  //   const user = await prisma.user.findUnique({...});
  //   userTripoApiKey = user?.tripoApiKey || null;
  // }
  ```
* **Why:** Keeps code ready to activate, documents what needs to be done, avoids schema migrations mid-PR
* **Files:** `app/api/generate-3d/**/*.ts`

### Tripo3D Task-Based API Pattern
* **Flow:** Submit task → Poll status → Update database on completion
  1. **Submit:** POST endpoint returns `{ taskId, status: 'queued' }`
  2. **Poll:** GET status endpoint queries Tripo API and updates database
  3. **Complete:** When status becomes 'success', save model URLs to database
* **State Machine:** `queued → generating → generated → rigging → rigged → animating → complete`
* **Key Files:**
  - `lib/tripo-client.ts` - Shared API utilities
  - `app/api/generate-3d/route.ts` - Task submission
  - `app/api/generate-3d/[taskId]/status/route.ts` - Status polling
* **Database:** `Generated3DAsset` model tracks task IDs and model URLs through entire chain

---

**Next Update:** When we establish a new pattern or encounter a new gotcha.

### Client-Side Image Processing
*   **Pattern:** For light image manipulations (like seam blending or resizing), prefer using the HTML5 Canvas API in the browser over sending data back to the server.
*   **Why:**
    - Zero server load.
    - Faster feedback for user (no network roundtrip).
    - Keeps sensitive/large image data local until final save.
*   **Example:** `src/lib/image-processing.ts` (`blendSeams` function).
*   **Gotcha:** Canvas becomes "tainted" if drawing cross-origin images without `crossOrigin="anonymous"`. Always handle CORS requirements for source images.
