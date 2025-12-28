# ADR-010: API Route Consolidation

**Status:** Proposed  
**Date:** 2025-12-28  
**Context:** Code review feedback on commit ac88f7d  

---

## Context

Current API routes are organized as flat, action-oriented endpoints at the root `/api/*` level:

```
/api/chat              # AI chat with tool calling
/api/generate          # Individual asset generation
/api/generate-style    # Style anchor generation
/api/style-anchor      # Fetch style anchor by ID
/api/analyze-style     # Vision API for style extraction
/api/assets/[id]       # Fetch individual asset
```

### Problems with Current Approach

1. **Poor discoverability** - No clear resource hierarchy
2. **Difficult middleware management** - Can't apply project-level auth/validation easily
3. **Not RESTful** - Mixes resources and actions at top level
4. **Scalability concerns** - Adding more features will clutter `/api/*` namespace

---

## Decision

Refactor API routes to follow resource-oriented RESTful structure:

### Proposed Structure

```
/api/projects/[id]/chat              # Project-scoped AI chat
/api/projects/[id]/style/generate    # Generate style anchor
/api/projects/[id]/style-anchor      # Fetch style anchor
/api/projects/[id]/style/analyze     # Analyze uploaded reference
/api/projects/[id]/assets/generate   # Generate individual asset
/api/projects/[id]/assets/[assetId]  # Fetch specific asset
/api/projects/[id]/memory-files      # Already follows this pattern!
```

### Benefits

1. **Clear resource hierarchy** - Everything scoped to project
2. **Easier middleware** - Apply auth/validation at project level
3. **Better RESTful design** - Resources first, actions second
4. **Improved security** - Project-level access control
5. **API versioning ready** - Can add `/api/v2/projects/...` later

---

## Implementation Plan

### Phase 1: Create New Routes (Non-Breaking)

Create new routes alongside existing ones:

```typescript
// app/api/projects/[id]/style/generate/route.ts
import { generateStyleAnchor } from '@/lib/style-anchor-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  
  // Use shared business logic
  const result = await generateStyleAnchor({
    projectId,
    ...body,
  });
  
  return NextResponse.json(result);
}
```

### Phase 2: Update Client Code

Update all client-side API calls to use new endpoints:

```typescript
// Before
fetch('/api/generate-style', { 
  body: JSON.stringify({ projectId, ...params }) 
})

// After
fetch(`/api/projects/${projectId}/style/generate`, { 
  body: JSON.stringify(params)  // projectId in URL
})
```

### Phase 3: Add Deprecation Warnings

Add deprecation headers to old routes:

```typescript
// app/api/generate-style/route.ts
export async function POST(request: NextRequest) {
  console.warn('⚠️ DEPRECATED: Use /api/projects/[id]/style/generate instead');
  // ... existing logic
}
```

### Phase 4: Remove Old Routes

After verifying all clients updated, delete old route files.

---

## Migration Checklist

### Routes to Migrate

- [ ] `/api/generate-style` → `/api/projects/[id]/style/generate`
- [ ] `/api/generate` → `/api/projects/[id]/assets/generate`
- [ ] `/api/style-anchor` → `/api/projects/[id]/style-anchor`
- [ ] `/api/analyze-style` → `/api/projects/[id]/style/analyze`
- [ ] `/api/assets/[id]` → `/api/projects/[projectId]/assets/[assetId]`
- [ ] `/api/chat` → `/api/projects/[id]/chat` (requires careful handling of streaming)

### Client Updates

- [ ] `components/generation/GenerationQueue.tsx` - Update API calls
- [ ] `components/generation/GenerationProgress.tsx` - Update asset fetch
- [ ] `components/planning/ChatInterface.tsx` - Update chat endpoint
- [ ] `components/style/StylePreview.tsx` - Update style fetch
- [ ] `app/api/chat/route.ts` - Update internal calls (already done for style generation)

### Testing

- [ ] Verify all client API calls work with new routes
- [ ] Test project-level middleware (auth, validation)
- [ ] Check error handling for invalid project IDs
- [ ] Ensure streaming works for chat endpoint

---

## Consequences

### Positive

- **Better API design** - Clear, discoverable, RESTful structure
- **Easier testing** - Can mock at project level
- **Improved security** - Project-scoped access control
- **Future-proof** - Ready for multi-tenancy, API versioning

### Negative

- **Migration effort** - Need to update all client calls
- **Temporary code duplication** - During transition period
- **Breaking change** - Existing integrations need updates

### Neutral

- **Learning curve** - Team needs to understand new structure
- **Documentation** - Need to update API docs

---

## Timeline Estimate

- **Phase 1 (Create new routes):** 2-3 hours
- **Phase 2 (Update clients):** 3-4 hours
- **Phase 3 (Deprecation):** 30 minutes
- **Phase 4 (Cleanup):** 1 hour

**Total:** ~6-8 hours of focused work

---

## Recommendation

**Defer to dedicated refactoring session.** This is a worthwhile improvement but not urgent. Current API structure works fine for MVP stage. Prioritize this before:

1. Adding authentication/authorization
2. Opening API to external clients
3. Scaling to multi-user production

---

## References

- Code review feedback: commit ac88f7d
- RESTful API design: https://restfulapi.net/resource-naming/
- Next.js dynamic routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
