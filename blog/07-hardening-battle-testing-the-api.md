---
title: "Part 7: Hardening - Battle-Testing the API"
series: "Building Asset Hatch with AI Agents"
part: 7
date: 2025-12-28
updated: 2025-12-28
tags: [Security, Auth.js, Zod, Database, Race Conditions, Hardening]
reading_time: "8 min"
status: published
---

# Part 7: Hardening - Battle-Testing the API

**Previously:** Built the generation infrastructure. Integration tests are passing. Flux.2 is generating beautiful, consistent assets.

**Now:** The "confident amateur" phase ends. It's time for a professional security audit.

## The Reality Check (PR #8)

On Dec 28, I submitted a PR for the productionization work. Within minutes, my automated security auditors (Qodo and Gemini Code Assist) flagged a series of "Critical" and "High" priority issues.

As a solo dev moving at 10x speed with AI, it’s easy to get tunnel vision. I was so focused on the *features* that I left the screen door unlocked.

### The Audit Findings

| Severity | Issue | Impact |
|----------|-------|--------|
| **CRITICAL** | Unauthenticated GET endpoint | Anyone could read any project's memory files. |
| **CRITICAL** | Race Condition in Manual Upsert | Simultaneous saves caused duplicate data and DB errors. |
| **HIGH** | Weak Input Validation | No schema enforcement on memory file uploads. |
| **HIGH** | Information Leakage | API responses were returning raw Prisma error messages. |

## 🛡️ Hardening Step 1: Authentication & Ownership

The first fix was securing the `/api/projects/[id]/memory-files` endpoint. Previously, it just checked if the project ID existed.

**The Fix:** Integrated `auth()` from Auth.js (NextAuth v5) to verify both the session AND project ownership.

```typescript
// app/api/projects/[id]/memory-files/route.ts
export async function GET(req: NextRequest, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.user.id }
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Now it's safe to fetch files...
}
```

## 🛡️ Hardening Step 2: Eliminating Race Conditions

The manual "find-then-create" logic I used for memory files was a classic race condition. If a user (or an agent) sent two rapid updates, the second one would try to `create` while the first was still processing, leading to unique constraint violations.

**The Fix:**
1. Added `@@unique([projectId, type])` to the Prisma schema.
2. Switched to atomic `prisma.memoryFile.upsert()`.

```typescript
// The atomic approach
const memoryFile = await prisma.memoryFile.upsert({
  where: { 
    projectId_type: { projectId, type: validated.type } 
  },
  update: { content: validated.content },
  create: { 
    projectId, 
    type: validated.type, 
    content: validated.content 
  },
});
```

By making the operation atomic at the database level, the race condition simply vanishes.

## 🛡️ Hardening Step 3: Schema Enforcement with Zod

AI agents move fast, and sometimes they hallucinate payload structures. Without strict validation, the database becomes a junk drawer.

**The Solution:** Zod-guarded endpoints.

```typescript
const MemoryFileSchema = z.object({
  type: z.enum(['plan', 'style', 'code', 'log']),
  content: z.string().max(100000), // Prevent DoS via huge payloads
});

const body = await request.json();
const validated = MemoryFileSchema.parse(body);
```

If the data doesn't match the schema perfectly, the request is rejected before it ever touches the database.

## 🛡️ Hardening Step 4: Masking Information Leaks

In development, seeing `(error as any).message` in the terminal is helpful. In production, returning that to the client is a security risk. It can leak table names, schema structure, or even snippets of user data.

**The Fix:** Catch Prisma errors and return generic, safe messages.

```typescript
try {
  // ... db ops ...
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Log the detail server-side only
    console.error("DB Error:", error.code, error.message);
    // Return a sterile response to the client
    return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
  }
}
```

---

## The Verifier's Mindset

Hardening isn't a one-time task; it's a loop. After implementing these fixes, I had to:
1. **Reset**: Wipe the dev database to apply the new unique constraints cleanly.
2. **Re-Migrate**: Ensure the production schema matched the audit requirements.
3. **Audit Again**: Verify that the security bots were now satisfied.

## What I Learned

**1. AI is an "Optimistic" Coder**
AI defaults to "Happy Path" logic. It writes the code that *works* first, but rarely the code that *fails safely*. You must prompt specifically for security.

**2. Automated Audits are Non-Optional**
I missed the race condition. My AI missed the race condition. The bot found it in 30 seconds. Use the tools.

**3. Atomic is Always Better**
If you ever find yourself writing `if (exists) { update } else { create }`, stop. Use `upsert`.

---

## Coming Next

In [Part 8: Completing the Cycle - Export Workflow](08-completing-the-cycle-export-workflow.md), we reach the finish line. 

The build is finished. The API is hardened. But how do we get the assets out of the app and into the user's game engine? We deep dive into single-asset generation strategies and ZIP export architecture.

**Final Stats Preview:** 9 posts, 50+ files, 14 ADRs, and a complete production-ready export pipeline.

---

**Commit References:**
- `27f9f0b` - Security hardening: Auth, Zod, and Atomic Upserts
- `68ab816` - Add unique constraint to MemoryFile model

**Files Modified:**
- `/app/api/projects/[id]/memory-files/route.ts` - Auth & Race condition fixes
- `/prisma/schema.prisma` - Unique constraints
- `/app/api/projects/route.ts` - Error masking and user upserts

---

**Previous:** [← Part 6: Productionization](06-productionization-tests-infrastructure.md)
**Next:** [Part 8: Export Workflow →](08-completing-the-cycle-export-workflow.md)
