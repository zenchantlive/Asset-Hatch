# ADR 013: Security Hardening - OAuth and Phase Consistency

**Date:** 2025-12-28  
**Status:** ✅ Implemented  
**Decision Makers:** Development Team

---

## Context

Following a comprehensive code audit (PR #8), three security and consistency vulnerabilities were identified:

1. **Critical Security Risk:** OAuth account takeover via `allowDangerousEmailAccountLinking`
2. **Race Condition:** Potential duplicate memory file creation under concurrent requests
3. **Data Consistency:** Phase/mode string mismatch between UI (`'plan'`) and database (`'planning'`)

---

## Decision

### 1. OAuth Account Linking Security Fix

**Decision:** Disable `allowDangerousEmailAccountLinking` for GitHub OAuth provider.

**Rationale:**
- The setting allowed automatic account linking based solely on email matching
- **Attack vector:** Attacker creates GitHub account with victim's email (unverified) → signs in via OAuth → gains full access to victim's account
- GitHub does not require email verification for OAuth
- No user notification or consent flow existed
- Risk outweighed convenience benefit

**Implementation:**
```typescript
// auth.ts
GitHub({
    allowDangerousEmailAccountLinking: false, // Previously: true
})
```

**Trade-offs:**
- ✅ Security: Prevents account takeover attacks
- ❌ UX: Users must use same sign-in method consistently (can't mix OAuth + credentials for same email)
- Alternative considered: Implement explicit user confirmation flow (rejected due to complexity vs. benefit)

---

### 2. Race Condition Verification

**Decision:** Verify existing atomic upsert implementation and unique constraint.

**Status:** ✅ Already fixed in codebase

**Verification Results:**
- Prisma schema contains `@@unique([projectId, type])` constraint on `MemoryFile` model
- All memory-file API endpoints use atomic `prisma.memoryFile.upsert()`
- No find-then-create patterns found in codebase
- Database constraint prevents duplicates at DB level

**Locations verified:**
- `app/api/projects/[id]/memory-files/route.ts:154`
- `app/api/chat/route.ts:125`
- `app/api/chat/route.ts:196`

---

### 3. Phase/Mode String Consistency

**Decision:** Standardize on `'planning'` across all layers (UI, API, Database).

**Problem:**
- UI components used `'plan'` while database used `'planning'`
- Manual mapping logic scattered across codebase (prone to errors)
- Validation lists mismatched between UI and API
- URL parameters used different values than DB

**Solution:**
Changed `PlanningMode` type from `'plan' | 'style' | 'generation'` to `'planning' | 'style' | 'generation'`

**Files modified:**
- `app/project/[id]/planning/page.tsx` - Type definition, removed mapping logic
- `components/planning/ChatInterface.tsx` - Updated mode prop type
- `lib/preset-prompts.ts` - Updated function signature

**Benefits:**
- ✅ Single source of truth for phase values
- ✅ Eliminated error-prone manual mapping
- ✅ Type-safe validation across all layers
- ✅ Consistent URL parameters and database values

---

## Consequences

### Positive

1. **Enhanced Security:** Account takeover vulnerability eliminated
2. **Data Integrity:** Race conditions prevented by DB constraints + atomic operations
3. **Code Quality:** Eliminated inconsistent state and manual mapping bugs
4. **Maintainability:** Single source of truth for phase values
5. **Type Safety:** Compile-time validation of phase strings

### Negative

1. **UX Impact:** Users cannot switch between OAuth and credentials for same email
2. **Breaking Change:** Existing sessions with `mode=plan` in URL will need to migrate

### Mitigation

- Updated URL restoration logic to handle both old and new phase values
- TypeScript compiler catches all phase string inconsistencies at build time
- Clear error messages for users attempting mixed authentication

---

## Verification

### Testing Performed

✅ **TypeScript Compilation:** `bun run typecheck` - **PASS**  
✅ **Linting:** `bun run lint` - **PASS**  
✅ **Database Constraints:** Verified `@@unique([projectId, type])` exists  
✅ **Atomic Operations:** Confirmed all endpoints use `upsert()`

### Manual Testing Required

- [ ] OAuth sign-in rejection with existing credentials account
- [ ] Phase transitions (Planning → Style → Generation)
- [ ] URL parameter persistence and restoration
- [ ] Database phase value consistency

---

## References

- **PR #8:** Code audit identifying vulnerabilities
- **NextAuth Documentation:** `allowDangerousEmailAccountLinking` security warning
- **Prisma Documentation:** Unique constraints and upsert operations
- **Active State:** `memory/active_state.md` - Session persistence patterns

---

## Notes

This ADR represents a security-first approach prioritizing data protection over convenience features. The OAuth linking restriction may be revisited if proper email verification and user consent flows are implemented.
