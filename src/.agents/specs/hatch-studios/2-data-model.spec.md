# Data Model Specification

**Status:** Draft  
**Dependencies:** 1-hatch-studios-architecture.spec.md  
**Implements PRD Section:** 12

---

## 1. Purpose

Defines Prisma schema additions for Hatch Studios: game projects, scenes, code versions, and asset references. Extends existing Asset Hatch schema without breaking changes.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: Store game projects with metadata (name, created, updated)
- FR-002: Store multiple scenes per game
- FR-003: Store code history for undo/redo
- FR-004: Link to Asset Hatch assets without duplication
- FR-005: Support soft delete for recovery
- FR-006: Track generation costs (token usage)

### 2.2 Non-Functional Requirements

- NFR-001: Query for game list < 100ms
- NFR-002: Code content stored as TEXT (no size limit on PostgreSQL)
- NFR-003: Cascade deletes for related records

---

## 3. Technical Design

### 3.1 New Prisma Models

```prisma
// =============================================================================
// HATCH STUDIOS MODELS
// =============================================================================

// Game project - main entity for a Hatch Studios game
model Game {
  id              String        @id @default(uuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  name            String
  description     String?
  
  // Current state
  activeSceneId   String?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?     // Soft delete
  
  // Relations
  scenes          GameScene[]
  codeVersions    CodeVersion[]
  assetRefs       GameAssetRef[]
  chatMessages    GameChatMessage[]
}

// Scene within a game - AI-managed but user-referenceable
model GameScene {
  id              String        @id @default(uuid())
  gameId          String
  game            Game          @relation(fields: [gameId], references: [id], onDelete: Cascade)
  name            String        // "Level 1", "Main Menu", etc.
  orderIndex      Int           @default(0)
  
  // Scene-specific code
  code            String        @db.Text
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  placements      AssetPlacement[]
}

// Code version for undo/redo history
model CodeVersion {
  id              String        @id @default(uuid())
  gameId          String
  game            Game          @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  // Content
  code            String        @db.Text
  description     String?       // "Added enemy spawner", AI-generated
  
  // Metadata
  trigger         String        // 'ai-generation' | 'user-edit' | 'manual-save'
  
  // Timestamps
  createdAt       DateTime      @default(now())
  
  @@index([gameId, createdAt])
}

// Reference to Asset Hatch asset (no duplication)
model GameAssetRef {
  id              String        @id @default(uuid())
  gameId          String
  game            Game          @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  // Reference to Asset Hatch
  assetProjectId  String        // Asset Hatch project ID
  assetId         String        // Asset ID within that project
  assetType       String        // '2d' | '3d'
  
  // Cached metadata (for display without fetching)
  name            String
  thumbnailUrl    String?
  glbUrl          String?       // For 3D assets
  
  // Timestamps
  createdAt       DateTime      @default(now())
  
  @@unique([gameId, assetId])
}

// Asset placement in a scene
model AssetPlacement {
  id              String        @id @default(uuid())
  sceneId         String
  scene           GameScene     @relation(fields: [sceneId], references: [id], onDelete: Cascade)
  
  // Asset reference
  assetRefId      String        // References GameAssetRef.id
  
  // Transform
  positionX       Float         @default(0)
  positionY       Float         @default(0)
  positionZ       Float         @default(0)
  rotationX       Float         @default(0)
  rotationY       Float         @default(0)
  rotationZ       Float         @default(0)
  scaleX          Float         @default(1)
  scaleY          Float         @default(1)
  scaleZ          Float         @default(1)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// Chat messages for game studio
model GameChatMessage {
  id              String        @id @default(uuid())
  gameId          String
  game            Game          @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  role            String        // 'user' | 'assistant' | 'system'
  content         String        @db.Text
  
  // Tool calls (stored as JSON)
  toolCalls       String?       @db.Text  // JSON array of tool calls
  
  // Timestamps
  createdAt       DateTime      @default(now())
  
  @@index([gameId, createdAt])
}
```

### 3.2 Extend User Model

```prisma
model User {
  // ... existing fields ...
  
  // Add relation to games
  games           Game[]
}
```

### 3.3 Migration Strategy

1. Create new models (additive, no breaking changes)
2. Add relation to User model
3. Run `prisma migrate dev`
4. Verify existing Asset Hatch functionality unaffected

---

## 4. Interface Contract

### 4.1 TypeScript Types (Generated)

```typescript
// These will be generated by Prisma, but documenting expected shape

interface Game {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  activeSceneId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface GameScene {
  id: string;
  gameId: string;
  name: string;
  orderIndex: number;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

// ... etc
```

### 4.2 Common Queries

```typescript
// Get all games for user
prisma.game.findMany({
  where: { userId, deletedAt: null },
  orderBy: { updatedAt: 'desc' }
});

// Get game with all relations
prisma.game.findUnique({
  where: { id: gameId },
  include: {
    scenes: { orderBy: { orderIndex: 'asc' } },
    assetRefs: true,
    chatMessages: { orderBy: { createdAt: 'asc' } }
  }
});

// Create code version (for history)
prisma.codeVersion.create({
  data: {
    gameId,
    code,
    description,
    trigger: 'ai-generation'
  }
});
```

---

## 5. Implementation Notes

1. **Soft delete** - Use `deletedAt` to allow recovery
2. **Code as TEXT** - PostgreSQL TEXT has no practical limit
3. **Tool calls JSON** - Store as stringified JSON for flexibility
4. **Asset caching** - Cache name/thumbnailUrl to avoid cross-project lookups
5. **Scene ordering** - Use `orderIndex` for drag-and-drop reordering later

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

- [ ] Game CRUD operations (create, read, update, soft delete)
- [ ] Scene creation and ordering
- [ ] Code version history (create, list by game)
- [ ] Asset reference linking across projects
- [ ] Cascade delete behavior

### 6.2 Manual Verification

- [ ] Run `prisma migrate dev` successfully
- [ ] `prisma studio` shows new tables
- [ ] Existing Asset Hatch data unaffected

### 6.3 Integration Check

- [ ] User relation works correctly
- [ ] Asset references resolve to Asset Hatch projects

---

## 7. Open Questions

None - ready for review.
