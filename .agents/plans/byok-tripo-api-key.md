# Feature: BYOK Expansion - Tripo API Key Support

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Add "Bring Your Own Key" (BYOK) support for Tripo3D API, allowing users to configure their own Tripo API key in settings (mirroring the existing OpenRouter BYOK pattern). This enables the demo on Vercel to offer 3D generation to users who want to use their own credits.

## User Story

As a user of the hosted demo
I want to add my own Tripo API key in settings
So that I can generate 3D models using my own credits instead of relying on the demo's shared quota

## Problem Statement

The existing BYOK implementation supports OpenRouter for 2D image generation, but 3D model generation via Tripo3D only works with the server-side `TRIPO_API_KEY` environment variable. Users cannot use their own Tripo credits in the demo.

## Solution Statement

Extend the existing BYOK pattern from OpenRouter to Tripo3D:
1. Add `tripoApiKey` field to User model
2. Create API endpoint for managing Tripo key (validate + save)
3. Update `/api/generate-3d` to use user key with env fallback
4. Add Tripo section to settings page UI
5. Mirror OpenRouter validation pattern (test API call before saving)

## Feature Metadata

**Feature Type**: Enhancement (BYOK expansion)
**Estimated Complexity**: Low
**Primary Systems Affected**:
- Prisma schema (User model)
- Settings API (`/api/settings`)
- Settings UI (`/app/settings/`)
- 3D generation API (`/api/generate-3d`)
**Dependencies**:
- Tripo3D API (https://platform.tripo3d.ai)
- Existing OpenRouter BYOK pattern (reference)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `src/prisma/schema.prisma` (lines 22-36) - User model with existing `openRouterApiKey`
- `src/app/api/settings/route.ts` - Settings API with PATCH handler for OpenRouter
- `src/components/settings/ApiKeySettings.tsx` - Client component for API key management
- `src/app/api/generate-3d/route.ts` - 3D generation route with commented BYOK stub (lines 54-66)
- `src/lib/tripo/client.ts` - Tripo client with `getTripoApiKey()` function

### New Files to Create

None - extend existing patterns

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Tripo3D API Documentation](https://platform.tripo3d.ai/docs/introduction)
  - Authentication section
  - Why: Validate API key format before saving

### Patterns to Follow

**OpenRouter BYOK Pattern** (from `src/app/api/settings/route.ts`):

```typescript
// Schema validation
const updateSettingsSchema = z.object({
    openRouterApiKey: z.string().optional().nullable(),
});

// Validation function
async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
}

// PATCH handler pattern
const { openRouterApiKey } = result.data;
if (openRouterApiKey) {
    const isValid = await validateOpenRouterKey(openRouterApiKey);
    if (!isValid) {
        return NextResponse.json({ error: "Invalid OpenRouter API key" }, { status: 400 });
    }
}
await prisma.user.update({
    where: { id: session.user.id },
    data: { openRouterApiKey: openRouterApiKey ?? null },
});
```

**API Key Usage Pattern** (from `src/app/api/generate/route.ts`):

```typescript
// Fetch user's key
let userApiKey: string | null = null;
if (session?.user?.id) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openRouterApiKey: true },
    });
    userApiKey = user?.openRouterApiKey || null;
}

// Use with env fallback
const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
```

**Tripo Key Fallback Pattern** (from `src/lib/tripo/client.ts`):

```typescript
export function getTripoApiKey(userApiKey?: string): string {
    const apiKey = userApiKey || process.env.TRIPO_API_KEY;
    if (!apiKey) {
        throw new Error('TRIPO_API_KEY not configured...');
    }
    return apiKey;
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Schema Update

Add `tripoApiKey` field to User model, following the existing `openRouterApiKey` pattern.

### Phase 2: Settings API Extension

Add Tripo key validation and update logic to `/api/settings`, mirroring OpenRouter.

### Phase 3: Settings UI Extension

Add Tripo section to settings page, mirroring OpenRouter UI pattern.

### Phase 4: 3D Generation Integration

Uncomment and complete the BYOK logic in `/api/generate-3d`.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE src/prisma/schema.prisma

- **IMPLEMENT**: Add `tripoApiKey String?` field to User model
- **PATTERN**: `src/prisma/schema.prisma:29` - openRouterApiKey field
- **GOTCHA**: Keep field nullable for gradual adoption
- **VALIDATE**: `cd src && bunx prisma generate`

```prisma
// Add after openRouterApiKey field
openRouterApiKey String?   // User's own OpenRouter API key for BYOK
tripoApiKey       String?   // User's own Tripo API key for BYOK 3D generation
```

### Task 2: UPDATE src/app/api/settings/route.ts

- **IMPLEMENT**: Add Tripo key to schema and update handlers
- **PATTERN**: `src/app/api/settings/route.ts:10-12` - updateSettingsSchema
- **IMPORTS**: Add Tripo validation function
- **GOTCHA**: Tripo keys start with `tsk_` - validate format
- **VALIDATE**: `cd src && bun run typecheck`

```typescript
// Add to schema
const updateSettingsSchema = z.object({
    openRouterApiKey: z.string().optional().nullable(),
    tripoApiKey: z.string().optional().nullable(),
});

// Add validation function
async function validateTripoKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'text_to_model', prompt: 'test' }),
        });
        // 401 = unauthorized (valid key format), 400+ = invalid
        return response.status !== 401;
    } catch {
        return false;
    }
}

// In PATCH handler, add after OpenRouter validation
const { tripoApiKey } = result.data;
if (tripoApiKey) {
    const isValid = await validateTripoKey(tripoApiKey);
    if (!isValid) {
        return NextResponse.json(
            { error: "Invalid Tripo API key" },
            { status: 400 }
        );
    }
}
await prisma.user.update({
    where: { id: session.user.id },
    data: {
        openRouterApiKey: openRouterApiKey ?? null,
        tripoApiKey: tripoApiKey ?? null,
    },
});

// In GET handler, add tripoApiKey to select
select: {
    id: true,
    name: true,
    email: true,
    openRouterApiKey: true,
    tripoApiKey: true,
},

// Return hasTripoKey and tripoKeyPreview
return NextResponse.json({
    hasOpenRouterKey: !!user.openRouterApiKey,
    openRouterKeyPreview: user.openRouterApiKey
        ? `sk-or-...${user.openRouterApiKey.slice(-4)}`
        : null,
    hasTripoKey: !!user.tripoApiKey,
    tripoKeyPreview: user.tripoApiKey
        ? `tsk-...${user.tripoApiKey.slice(-4)}`
        : null,
});
```

### Task 3: UPDATE src/components/settings/ApiKeySettings.tsx

- **IMPLEMENT**: Add Tripo API key management section
- **PATTERN**: Mirror OpenRouter section (lines 65-77)
- **GOTCHA**: Tripo keys start with `tsk_` - validate format
- **VALIDATE**: `cd src && bun run lint`

```typescript
// Add new state for Tripo
const [tripoApiKey, setTripoApiKey] = useState("");
const [tripoSettings, setTripoSettings] = useState<SettingsResponse | null>(null);

// Update fetchSettings to get both keys
const response = await fetch("/api/settings");
const data = await response.json();
setSettings(data);

// Add handleSaveTripo function
const handleSaveTripo = async () => {
    if (!tripoApiKey.trim()) {
        setError("Please enter a Tripo API key");
        return;
    }
    if (!tripoApiKey.startsWith("tsk-")) {
        setError("Invalid key format. Tripo keys start with 'tsk-'");
        return;
    }
    // Similar to handleSave but PATCH { tripoApiKey }
};

// Add handleRemoveTripo similar to handleRemove

// Add Tripo section JSX after OpenRouter section
<section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
    <h2 className="text-lg font-semibold text-white mb-4">
        Tripo3D API Key
    </h2>
    <p className="text-white/60 text-sm mb-6">
        Add your own Tripo API key for 3D model generation.
        Key format: tsk_xxxxx
    </p>
    {/* Tripo key status, input, buttons - mirror OpenRouter pattern */}
</section>
```

### Task 4: UPDATE src/app/api/settings/page.tsx

- **IMPLEMENT**: Add Tripo section to settings page
- **PATTERN**: `src/app/api/settings/page.tsx:64-93` - OpenRouter section
- **GOTCHA**: Add Tripo-specific instructions linking to platform.tripo3d.ai
- **VALIDATE**: `cd src && bun run typecheck`

```typescript
// Add after OpenRouter section
<section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
    <h2 className="text-lg font-semibold text-white mb-4">
        Tripo3D API Key
    </h2>
    <p className="text-white/60 text-sm mb-6">
        Add your own Tripo API key for 3D model generation.
        This is required for 3D asset generation in Hatch Studios.
    </p>
    <ApiKeySettings.Tripo isWelcome={isWelcome} />
</section>

<section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
    <h2 className="text-lg font-semibold text-white mb-4">
        How to Get a Tripo API Key
    </h2>
    <ol className="list-decimal list-inside text-white/60 text-sm space-y-2">
        <li>Go to <a href="https://platform.tripo3d.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">platform.tripo3d.ai</a></li>
        <li>Create an account or sign in</li>
        <li>Navigate to API Keys or your dashboard</li>
        <li>Create a new key and copy it here (starts with tsk_)</li>
    </ol>
    <p className="text-white/40 text-xs mt-4">
        Pricing: ~$0.20 per 3D model generation
    </p>
</section>
```

### Task 5: UPDATE src/app/api/generate-3d/route.ts

- **IMPLEMENT**: Uncomment and complete BYOK logic
- **PATTERN**: `src/app/api/generate-3d/route.ts:54-66` - existing stub
- **GOTCHA**: Use user key first, fall back to env var
- **VALIDATE**: `cd src && bun run typecheck && bun run lint`

```typescript
// Replace the commented stub with actual implementation
const session = await auth();
let userTripoApiKey: string | null = null;

if (session?.user?.id) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tripoApiKey: true },
    });
    userTripoApiKey = user?.tripoApiKey || null;
}

// Use with fallback (lines 107-108)
const tripoApiKey = userTripoApiKey || process.env.TRIPO_API_KEY;
```

### Task 6: UPDATE src/memory/active_state.md

- **IMPLEMENT**: Update active_state.md with completed feature
- **PATTERN**: Existing format for completed items
- **VALIDATE**: N/A - documentation update

---

## TESTING STRATEGY

### Unit Tests

- Schema: Verify `tripoApiKey` field is nullable
- Settings API: Test GET returns hasTripoKey/tripoKeyPreview
- Settings API: Test PATCH validates and saves Tripo key
- Settings API: Test PATCH rejects invalid Tripo key format
- Settings API: Test PATCH removes key when null sent

### Integration Tests

- End-to-end: Add Tripo key in settings, generate 3D model
- Fallback: Remove user Tripo key, verify env var is used
- Validation: Try invalid key format, verify error message

### Edge Cases

- User with existing env var TRIPO_API_KEY adds their own - user key takes precedence
- User removes their Tripo key - falls back to env var
- Invalid Tripo key format (doesn't start with tsk-) - rejected with helpful error
- Network error during validation - shows appropriate error

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
cd src
bun run lint
bun run typecheck
```

### Level 2: Database

```bash
cd src
bunx prisma generate
bunx prisma db push  # If local dev
```

### Level 3: Integration Tests

```bash
cd src
bun run test:ci  # If tests exist for settings
```

### Level 4: Manual Validation

1. Navigate to `/settings`
2. Verify OpenRouter section still works
3. Verify Tripo section appears with empty state
4. Enter invalid key (not starting with tsk-) → should reject
5. Enter valid Tripo key → should save and show preview
6. Click remove → should clear key
7. Navigate to 3D project → generate model → should use your key

---

## ACCEPTANCE CRITERIA

- [ ] `tripoApiKey` field added to User model in Prisma schema
- [ ] Settings API validates Tripo key format before saving
- [ ] Settings API returns hasTripoKey/tripoKeyPreview in GET
- [ ] Settings page shows Tripo API key management UI
- [ ] Tripo section includes instructions for getting API key
- [ ] `/api/generate-3d` uses user key with env fallback
- [ ] User can add, view, and remove their Tripo key
- [ ] Invalid Tripo key format shows helpful error message
- [ ] All validation commands pass (lint, typecheck)
- [ ] Existing OpenRouter BYOK still works

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] active_state.md updated

---

## NOTES

### Why Keep R2 Keys Server-Side Only

R2 keys provide full bucket access which is a significant security risk if exposed. Users self-hosting would configure these at the deployment level (Vercel env vars, Docker compose, etc.), not through the UI.

### Deployment Model Context

- **Demo on Vercel**: Server-side keys pre-configured, users add BYOK for generation
- **Self-Hosted**: Users configure all server-side keys in their deployment
- **BYOK Scope**: Only keys for generation services (OpenRouter, Tripo) that users pay for directly

### Key Format Validation

- OpenRouter: `sk-or-xxxxx` (starts with `sk-or-`)
- Tripo: `tsk-xxxxx` (starts with `tsk-`)

### Future Considerations (Out of Scope)

- S3-compatible storage BYOK (high security risk)
- Per-model API key validation
- Usage tracking per user key
