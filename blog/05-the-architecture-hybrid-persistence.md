---
title: "Part 5: The Architecture - Hybrid Persistence"
series: "Building Asset Hatch with AI Agents"
part: 5
date: 2025-12-26
updated: 2025-12-27
tags: [Architecture, Dexie, Prisma, IndexedDB, SQLite, Hybrid Persistence, Next.js]
reading_time: "10 min"
status: published
---

# Part 5: The Architecture - Hybrid Persistence

**Previously:** Migrated from CopilotKit to Vercel AI SDK. Tools work! Planning phase complete.

**Now:** Building the generation infrastructure and hitting another architectural wall.

## The Problem Emerges

It's late afternoon on Dec 26. Tools are working. I'm feeling good. Time to build the `/api/generate` route for image generation.

```typescript
// app/api/generate/route.ts
export async function POST(req: Request) {
  const { projectId, assetId } = await req.json();

  //  Need:
  // 1. Project qualities (art_style, perspective, etc.)
  // 2. Style anchor image (reference for consistency)
  // 3. Asset specifications from plan

  const project = await db.projects.get(projectId);
  const styleAnchor = await db.styleAnchors.get(project.style_anchor_id);

  // Generate image with Flux.2...
}
```

**Run the server:**

```
Error: db.projects is not defined
TypeError: Cannot read property 'get' of undefined
```

Wait, what? I'm importing `db` from `/lib/db.ts` where I defined the Dexie database.

**Try logging:**

```typescript
console.log('db:', db);
// Output: undefined
```

### The Realization

**IndexedDB only exists in browsers.**

API routes run in Node.js (server-side). There is no `window`, no `indexedDB`, no Dexie.

```
Client (Browser)     Server (Node.js)
─────────────────    ─────────────────
✅ IndexedDB          ❌ IndexedDB
✅ Dexie              ❌ Dexie
✅ window             ❌ window
✅ localStorage       ❌ localStorage
```

**But I need to access project data from the server** to pass it to Flux.2 for image generation!

## The Options

### Option 1: Send Everything in Request Body

```typescript
// Client sends full project + style anchor in every request
fetch('/api/generate', {
  body: JSON.stringify({
    qualities: { art_style: '...', ... },
    styleAnchorImage: 'data:image/png;base64,...' // 5MB+
    plan: '...',
  })
});
```

**Problems:**
- Massive payloads (style anchor images are 2-5MB each)
- Client has to fetch everything first (multiple IndexedDB queries)
- Poor data integrity (client could send stale data)
- Lots of boilerplate

**Verdict:** ❌ Terrible DX, wasteful

### Option 2: Migrate Everything to Server DB

```typescript
// lib/db.ts → lib/server-db.ts with Prisma
// All data in PostgreSQL or SQLite
// IndexedDB gone entirely
```

**Problems:**
- Massive migration effort (rewrite all DB calls)
- Lose Dexie's reactive `useLiveQuery` hooks
- Need server for development (can't work offline)
- Have to set up authentication earlier than planned

**Verdict:** ❌ Too much work, loses client-side benefits

### Option 3: Hybrid Persistence

**What if both exist?**

- **Client (Dexie/IndexedDB):** UI state, reactive queries, fast reads
- **Server (Prisma/SQLite):** Source of truth for generation, API routes
- **Sync:** Write to server via API, cache in client for UI

```
┌─────────────────┐         ┌──────────────────┐
│  Client (UI)    │         │  Server (API)    │
│                 │         │                  │
│  Dexie (Cache)  │◄────────┤  Prisma (Truth)  │
│  IndexedDB      │  Fetch  │  SQLite          │
│                 │         │                  │
│  useLiveQuery   │         │  API Routes      │
│  Fast UI Updates│         │  Generation      │
└─────────────────┘         └──────────────────┘
         │                           ▲
         └───── POST /api/... ───────┘
               (Dual-write on save)
```

**Benefits:**
- Keep Dexie for UI (reactive, fast, offline-capable)
- Add Prisma for server (reliable, queryable from API routes)
- Incremental migration (move tables one at a time)

**Costs:**
- Sync complexity (data can drift if not careful)
- Redundant schemas (maintain both Dexie and Prisma)
- More code to manage

**Verdict:** ✅ Best balance of velocity and robustness

## The Council's Solution: Hybrid Persistence

I wasn't sure if this was the right path, so I summoned my **Council of AIs** (Sonnet 4, GPT-5.2, and Perplexity) to review the problem.

Their consensus solution? **Hybrid Persistence.**

![Council of AIs] (/images/ council-of-ais.png)

### Implementation: Hybrid Persistence

### Step 1: Install Prisma

```bash
bun add prisma @prisma/client
bun add -D prisma

bunx prisma init --datasource-provider sqlite
```

**Why SQLite?**
- File-based (no server to run during development)
- Fast for local dev
- Can migrate to PostgreSQL later if needed

### Step 2: Define Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Project {
  id              String   @id @default(uuid())
  name            String
  description     String?
  phase           String   @default("planning")

  // Quality parameters
  artStyle        String?  @map("art_style")
  baseResolution  String?  @map("base_resolution")
  perspective     String?
  gameGenre       String?  @map("game_genre")
  theme           String?
  mood            String?
  colorPalette    String?  @map("color_palette")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  memoryFiles     MemoryFile[]
  styleAnchors    StyleAnchor[]

  @@map("projects")
}

model MemoryFile {
  id         String   @id @default(uuid())
  projectId  String   @map("project_id")
  fileName   String   @map("file_name")
  content    String   // JSON or markdown
  version    Int      @default(1)
  createdAt  DateTime @default(now()) @map("created_at")

  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, fileName])
  @@map("memory_files")
}

model StyleAnchor {
  id                    String   @id @default(uuid())
  projectId             String   @map("project_id")
  referenceImageBlob    Bytes    @map("reference_image_blob")
  referenceImageBase64  String?  @map("reference_image_base64") // Cached
  styleKeywords         String   @map("style_keywords")
  lightingKeywords      String   @map("lighting_keywords")
  colorPalette          String   @map("color_palette") // JSON array
  createdAt             DateTime @default(now()) @map("created_at")

  project               Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("style_anchors")
}
```

**Run migration:**

```bash
bunx prisma migrate dev --name init
bunx prisma generate
```

### Step 3: Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Why singleton?** Next.js hot-reload creates new Prisma instances on every change. Singleton prevents database connection exhaustion.

### Step 4: Separate Client and Server DBs

```bash
# Rename existing db.ts
mv lib/db.ts lib/client-db.ts

# Update imports in all client components
# sed -i 's/@\/lib\/db/@\/lib\/client-db/g' **/*.tsx
```

**Result:**
- `lib/client-db.ts` - Dexie (browser-only)
- `lib/prisma.ts` - Prisma (server-only)

### Step 5: Dual-Write on Save

When user saves a style anchor:

```typescript
// components/style/StyleAnchorEditor.tsx
async function handleSave() {
  // 1. Write to server (source of truth)
  const response = await fetch('/api/style-anchors', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      referenceImageBlob: await blobToBase64(imageBlob),
      styleKeywords,
      lightingKeywords,
      colorPalette,
    }),
  });

  const savedAnchor = await response.json();

  // 2. Update client cache (for UI)
  await clientDb.styleAnchors.put({
    id: savedAnchor.id,
    project_id: projectId,
    reference_image_blob: imageBlob,
    style_keywords: styleKeywords,
    // ...
  });

  toast.success('Style anchor saved!');
}
```

**Flow:**
1. POST to server → Prisma saves to SQLite
2. On success → Update Dexie cache
3. UI reads from Dexie (instant, reactive)
4. API routes read from Prisma (reliable, always fresh)

## The IndexedDB Polyfill Hack

One problem remained: **Unit tests**.

```typescript
// __tests__/api/generate/route.test.ts
import { POST } from '@/app/api/generate/route';

test('generates asset successfully', async () => {
  const response = await POST(mockRequest);
  // ...
});
```

**Error:**

```
ReferenceError: indexedDB is not defined
    at lib/client-db.ts:8:11
```

Even though API routes don't use Dexie, **importing them** causes `client-db.ts` to load, which tries to access `window.indexedDB`.

### The Solution: Conditional Polyfill

```typescript
// lib/client-db.ts
import Dexie from 'dexie';

// Polyfill IndexedDB for Node.js (tests, API routes)
if (typeof window === 'undefined') {
  const { indexedDB } = await import('fake-indexeddb');
  (globalThis as any).indexedDB = indexedDB;
}

class AssetHatchDB extends Dexie {
  // ... schema ...
}

export const clientDb = new AssetHatchDB();
```

**Install:**

```bash
bun add -D fake-indexeddb
```

**Result:**
- ✅ Browser: Uses real IndexedDB
- ✅ Node.js (tests, API routes): Uses fake-indexeddb
- ✅ No crashes

**Trade-off:** This is a hack. But it works and unblocks development.

## ADR-007: Hybrid Persistence Model

**Status:** Accepted
**Date:** 2025-12-26

**Context:**
API routes need server-side access to project data for image generation. IndexedDB doesn't exist in Node.js.

**Decision:**
Implement hybrid persistence:
- **Client:** Dexie/IndexedDB (cache, reactive UI)
- **Server:** Prisma/SQLite (source of truth, API access)
- **Sync:** Dual-write on mutations

**Rationale:**
- Keeps Dexie's excellent DX for UI
- Adds reliable server-side data access
- Incremental migration path
- Works offline (client-side cache)

**Consequences:**
- **Positive:** Best of both worlds, incremental adoption
- **Negative:** Sync complexity, redundant schemas
- **Mitigation:** Server write is source of truth; client is cache

---

## What I Learned

**1. Server vs Client is Real**

IndexedDB, localStorage, window—all browser-only. Can't assume anything works in API routes.

**2. Hybrid isn't a cop-out**

It's a legitimate pattern when you have conflicting requirements (reactive UI + server access).

**3. Polyfills save time**

`fake-indexeddb` let me keep tests running without refactoring every import.

**4. Source of truth matters**

When data exists in two places, one must be canonical. Server writes are truth; client is cache.

**5. Migration doesn't have to be big-bang**

Moved `StyleAnchor` to Prisma first. Will move `Project` and `MemoryFile` later as needed.

---

## Coming Next

In [Part 6: Productionization](06-productionization-tests-infrastructure.md), we make it production-ready:
- Integration tests for all API routes
- Generation infrastructure with Flux.2
- Prompt engineering templates
- Multi-mode UI design

**Preview:** Jest + Next.js 16 + Prisma + fake-indexeddb = configuration hell. But when it finally works, we have 100% test coverage on API routes.

---

**Commit References:**
- `0308291`, `b88f335` - Refactor tests and persistence layer
- ADR-007 - Hybrid persistence model decision

**Files Created:**
- `/lib/prisma.ts` - Prisma client singleton
- `/prisma/schema.prisma` - Database schema
- `/lib/client-db.ts` - Renamed from db.ts
- `/app/api/style-anchors/route.ts` - Style anchor persistence API

---

**Previous:** [← Part 4: The Pivot](04-the-pivot-vercel-ai-sdk.md)
**Next:** [Part 6: Productionization →](06-productionization-tests-infrastructure.md)
