# API Endpoints Specification

**Status:** Draft  
**Dependencies:** 1-hatch-studios-architecture.spec.md, 2-data-model.spec.md  
**Implements PRD Section:** 13

---

## 1. Purpose

Defines all API routes for Hatch Studios: game CRUD, scene management, chat streaming, preview generation, and export.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: Full CRUD for games
- FR-002: Scene management (create, update, delete, reorder)
- FR-003: Streaming chat with AI tool execution
- FR-004: Preview HTML generation
- FR-005: Game export (HTML bundle)
- FR-006: Asset library query from Asset Hatch

### 2.2 Non-Functional Requirements

- NFR-001: All routes require authentication
- NFR-002: Chat streaming via SSE
- NFR-003: Rate limiting on generation endpoints
- NFR-004: Response time < 500ms for non-generation endpoints

---

## 3. Technical Design

### 3.1 Route Structure

```
/api/studio/
├── games/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       └── scenes/
│           ├── route.ts      # GET (list), POST (create)
│           └── [sceneId]/
│               └── route.ts  # GET, PATCH, DELETE
│
├── chat/
│   └── route.ts              # POST (streaming)
│
├── preview/
│   └── route.ts              # POST (generate HTML)
│
├── export/
│   └── route.ts              # POST (bundle game)
│
└── assets/
    └── route.ts              # GET (query Asset Hatch library)
```

### 3.2 Endpoint Specifications

#### GET /api/studio/games
List all games for authenticated user.

```typescript
// Response
{
  games: {
    id: string;
    name: string;
    description: string | null;
    sceneCount: number;
    updatedAt: string;
    thumbnailUrl: string | null;
  }[]
}
```

#### POST /api/studio/games
Create new game.

```typescript
// Request
{
  name: string;
  description?: string;
  fromProjectId?: string;  // Optional: import assets from Asset Hatch project
}

// Response
{
  id: string;
  name: string;
  // ... full game object
}
```

#### GET /api/studio/games/[id]
Get game with all data.

```typescript
// Response
{
  id: string;
  name: string;
  description: string | null;
  activeSceneId: string | null;
  scenes: GameScene[];
  assetRefs: GameAssetRef[];
  codeVersions: CodeVersion[];  // Last 50
  createdAt: string;
  updatedAt: string;
}
```

#### PATCH /api/studio/games/[id]
Update game metadata.

```typescript
// Request
{
  name?: string;
  description?: string;
  activeSceneId?: string;
}
```

#### DELETE /api/studio/games/[id]
Soft delete game.

```typescript
// Response
{ success: true }
```

#### POST /api/studio/chat
Streaming chat with game tools.

```typescript
// Request
{
  gameId: string;
  messages: Message[];
}

// Response: SSE stream (same format as Asset Hatch chat)
```

#### POST /api/studio/preview
Generate preview HTML for iframe.

```typescript
// Request
{
  gameId: string;
  sceneId?: string;  // Optional: specific scene, defaults to active
}

// Response
{
  html: string;  // Complete HTML document with Babylon.js
}
```

#### POST /api/studio/export
Export game as deployable bundle.

```typescript
// Request
{
  gameId: string;
  format: 'single-html' | 'multi-file';
  options?: {
    minify?: boolean;
  }
}

// Response
{
  downloadUrl: string;
  expiresAt: string;
}
```

#### GET /api/studio/assets
Query Asset Hatch library for authenticated user.

```typescript
// Query params
?q=robot           // Search term
&type=3d           // '2d' | '3d'
&projectId=...     // Specific project

// Response
{
  assets: {
    id: string;
    projectId: string;
    name: string;
    type: '2d' | '3d';
    thumbnailUrl: string;
    glbUrl?: string;
    category: string;
  }[]
}
```

---

## 4. Interface Contract

### 4.1 Error Response Format

```typescript
{
  error: string;
  code: string;      // 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | etc
  details?: unknown;
}
```

### 4.2 Authentication

All routes require valid session. Use existing Auth.js middleware.

```typescript
// In each route
const session = await auth();
if (!session?.user?.id) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 5. Implementation Notes

1. **Reuse patterns** from existing Asset Hatch API routes
2. **Chat route** follows same pattern as `/api/chat/route.ts`
3. **Preview generation** injects code into template HTML
4. **Export** uses server-side bundling (similar to `/api/export`)
5. **Asset query** proxies to existing Asset Hatch queries

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] Game CRUD operations
- [ ] Scene CRUD operations
- [ ] Authentication enforcement on all routes
- [ ] Asset reference query across projects
- [ ] Error handling (404, 401, 500)

### 6.2 Manual Verification

- [ ] Chat streaming works in browser
- [ ] Preview HTML renders valid Babylon.js scene
- [ ] Export produces downloadable file

### 6.3 Integration Check

- [ ] Chat tools execute correctly
- [ ] Asset Hatch assets accessible via /api/studio/assets

---

## 7. Open Questions

None - ready for review.
