---
description: "Phase 6 implementation plan for unified Project architecture"
---

# Phase 6: Unified Project Architecture

## Feature Description

Phase 6 unifies Asset Hatch and Hatch Studios into a single project experience:
- One dashboard showing all projects with asset/game status
- Projects can start with assets, games, or both
- Assets can be added mid-game with intelligent sync
- Shared manifest system for asset tracking
- AI handles asset integration automatically

## User Story

As a **game creator**
I want to manage assets and games in one unified workspace
So that I can create assets, build my game, and seamlessly integrate them together

## Problem Statement

Currently:
- Asset Hatch projects and Hatch Studios games are completely separate
- No way to link assets to games
- Adding assets mid-game requires manual integration
- Users can't see the relationship between their assets and games

## Solution Statement

Create a unified project architecture:
1. Extended Project model with game references and asset manifest
2. Single dashboard showing all project status
3. New project creation with start path selection (Assets/Game/Both)
4. Asset manifest system for tracking linked assets
5. Sync mechanism with AI-driven integration
6. Unified UI components for both views

---

## Feature Metadata

**Feature Type**: Core Architecture (database + API + UI)
**Estimated Complexity**: High (requires coordination across systems)
**Primary Systems Affected**: Dashboard, Projects, Studio, API routes, Database
**Dependencies**: Phase 4B completion (game infrastructure), Phase 5 (file management)

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**Dashboard:**
- `src/app/dashboard/page.tsx` - Current project dashboard
- `src/components/dashboard/CreateProjectButton.tsx` - Project creation dialog
- `src/app/studio/page.tsx` - Game list page
- `src/components/studio/CreateGameDialog.tsx` - Game creation dialog

**API Routes:**
- `src/app/api/projects/route.ts` - Project CRUD
- `src/app/api/studio/games/route.ts` - Game CRUD
- `src/app/api/studio/chat/route.ts` - AI chat with tools
- `src/app/api/studio/assets/route.ts` - Asset listing

**Database:**
- `src/prisma/schema.prisma` - All models

**Studio Components:**
- `src/components/studio/StudioProvider.tsx` - State management
- `src/components/studio/PreviewFrame.tsx` - Preview with assets
- `src/lib/studio/game-tools.ts` - AI tools for games

### Patterns to Follow

**Dialog Pattern (from CreateProjectButton.tsx:77-130):**
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>+ New Project</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Project</DialogTitle>
    </DialogHeader>
    {/* Form fields */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleCreate}>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Tool Pattern (from game-tools.ts:59-92):**
```typescript
export const createSceneTool = (gameId: string) => {
  return tool({
    description: 'Create a new scene...',
    inputSchema: createSceneSchema,
    execute: async ({ name, orderIndex }) => {
      // Implementation
      return { success: true, message: `Created scene "${name}"` };
    },
  });
};
```

**State Management (from StudioProvider.tsx:164-173):**
```typescript
const updateFileContent = useCallback((fileId: string, content: string) => {
  setFiles((prev) =>
    prev.map((f) => (f.id === fileId ? { ...f, content } : f))
  );
}, []);
```

---

## Database Schema Changes

### Add to `src/prisma/schema.prisma`

```prisma
// Update Project model - extend with unified fields
model Project {
  id                  String              @id @default(uuid())
  userId              String
  user                User                @relation(fields: [userId], references: [id])
  
  // Core project fields (add these)
  name                String
  mode                String              @default("2d") // "2d" | "3d" | "hybrid"
  phase               String              @default("planning") // "planning" | "assets" | "building" | "testing"
  
  // Asset generation fields
  artStyle            String?
  baseResolution      String?
  perspective         String?
  
  // Game creation (linked game if any)
  gameId              String?             @unique
  game                Game?               @relation(fields: [gameId], references: [id])
  
  // Asset Manifest - THE CORE OF UNIFICATION
  assetManifest       Json?               @default("{}")
  
  // Sync state tracking
  syncStatus          String              @default("clean") // "clean" | "pending" | "syncing" | "error"
  lastSyncAt          DateTime?
  pendingAssetCount   Int                 @default(0)
  
  // Existing fields remain
  generatedAssets     GeneratedAsset[]
  generated3DAssets   Generated3DAsset[]
  styleAnchors        StyleAnchor[]
  memoryFiles         MemoryFile[]
  
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([userId, updatedAt])
}

// Update Game model - add project reference
model Game {
  id                  String              @id @default(uuid())
  userId              String
  user                User                @relation(fields: [userId], references: [id])
  name                String
  description         String?
  phase               String              @default("planning")
  
  // Add project reference
  projectId           String?             @unique
  project             Project?            @relation(fields: [projectId], references: [id])
  
  // Existing fields remain
  scenes              GameScene[]
  codeVersions        CodeVersion[]
  assetRefs           GameAssetRef[]
  chatMessages        GameChatMessage[]
  files               GameFile[]
  plan                GamePlan?
  
  deletedAt           DateTime?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

// Update GameAssetRef - add version locking and manifest key
model GameAssetRef {
  id                  String              @id @default(uuid())
  gameId              String
  game                Game                @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  // Asset source tracking
  projectId           String
  project             Project             @relation(fields: [projectId], references: [id])
  
  // Asset identification
  assetType           String              // "2d" | "3d"
  assetId             String              // ID in GeneratedAsset or Generated3DAsset
  assetName           String
  
  // Version locking (critical for sync safety)
  lockedVersionId     String?
  lockedAt            DateTime?
  
  // Asset data (snapshot at time of linking)
  thumbnailUrl        String?
  modelUrl            String?
  glbUrl              String?
  
  // Manifest key (for easy lookup)
  manifestKey         String?
  
  placements          AssetPlacement[]
  
  createdAt           DateTime            @default(now())
  
  @@unique([gameId, assetId])
  @@index([gameId])
  @@index([projectId])
}
```

### Asset Manifest Type Definition

```typescript
// lib/types/unified-project.ts

export interface AssetManifest {
  version: "1.0";
  lastUpdated: string;
  assets: {
    [key: string]: {
      id: string;
      type: "2d" | "3d";
      name: string;
      version: number;
      urls: {
        thumbnail?: string;
        model?: string;
        glb?: string;
      };
      metadata: {
        prompt?: string;
        style?: string;
        animations?: string[];
        poses?: string[];
      };
      linkedAt: string;
      lockedVersion?: number;
    };
  };
  syncState: {
    status: "clean" | "pending";
    pendingAssets: string[];
    lastSync: string | null;
  };
}

export interface ProjectStatus {
  projectId: string;
  name: string;
  mode: "2d" | "3d" | "hybrid";
  phase: string;
  syncStatus: "clean" | "pending" | "syncing";
  pendingAssets: string[];
  pendingAssetCount: number;
  lastSync: string | null;
  assetCount: number;
  gameId?: string;
  gamePhase?: string;
  updatedAt: string;
}
```

---

## API Endpoints

### 1. POST /api/projects (Update existing)

**Request:**
```typescript
interface CreateProjectRequest {
  name: string;
  mode: "2d" | "3d" | "hybrid";
  startWith: "assets" | "game" | "both";
}
```

**Response:**
```typescript
interface CreateProjectResponse {
  projectId: string;
  gameId?: string; // Only if startWith includes "game"
}
```

**Implementation:**
```typescript
export async function POST(request: Request) {
  const { name, mode, startWith } = await request.json();
  const session = await auth();
  
  // Create Project
  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name,
      mode,
      phase: startWith === "game" ? "building" : "assets",
      assetManifest: {
        version: "1.0",
        assets: {},
        syncState: { status: "clean", pendingAssets: [], lastSync: null },
      },
    },
  });
  
  // Optionally create Game
  let gameId: string | undefined;
  if (startWith === "game" || startWith === "both") {
    const game = await prisma.game.create({
      data: {
        userId: session.user.id,
        name: `${name} Game`,
        phase: "planning",
        projectId: project.id,
      },
    });
    gameId = game.id;
    
    await prisma.project.update({
      where: { id: project.id },
      data: { gameId, phase: "building" },
    });
  }
  
  return Response.json({ projectId: project.id, gameId });
}
```

### 2. GET /api/projects/[id]/status

**Response:**
```typescript
interface ProjectStatusResponse {
  projectId: string;
  name: string;
  mode: string;
  phase: string;
  syncStatus: "clean" | "pending" | "syncing";
  pendingAssets: string[];
  pendingAssetCount: number;
  lastSync: string | null;
  assetCount: number;
  gameId?: string;
  gamePhase?: string;
}
```

**Implementation:**
```typescript
export async function GET(request: Request, props: RouteParams) {
  const { id: projectId } = await props.params;
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { game: true },
  });
  
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  
  const manifest = (project.assetManifest as AssetManifest | null) || {
    assets: {},
    syncState: { status: "clean", pendingAssets: [], lastSync: null },
  };
  
  return Response.json({
    projectId: project.id,
    name: project.name,
    mode: project.mode,
    phase: project.phase,
    syncStatus: project.syncStatus as "clean" | "pending" | "syncing",
    pendingAssets: manifest.syncState.pendingAssets,
    pendingAssetCount: manifest.syncState.pendingAssets.length,
    lastSync: project.lastSyncAt?.toISOString() || null,
    assetCount: Object.keys(manifest.assets).length,
    gameId: project.gameId,
    gamePhase: project.game?.phase,
  });
}
```

### 3. POST /api/projects/[id]/assets/sync

**Request:**
```typescript
// Empty body - syncs all pending assets
```

**Response:**
```typescript
interface SyncAssetsResponse {
  success: boolean;
  syncedAssets: string[];
  message: string;
  changes?: {
    fileId: string;
    fileName: string;
    changeType: "created" | "updated";
    description: string;
  }[];
}
```

**Implementation:**
```typescript
export async function POST(request: Request, props: RouteParams) {
  const { id: projectId } = await props.params;
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { game: { include: { files: true } } },
  });
  
  if (!project.game) {
    return Response.json({ error: "No game in this project" }, { status: 400 });
  }
  
  const manifest = (project.assetManifest as AssetManifest) || {
    assets: {},
    syncState: { status: "clean", pendingAssets: [], lastSync: null },
  };
  
  const pendingAssets = manifest.syncState.pendingAssets;
  
  if (pendingAssets.length === 0) {
    return Response.json({ success: true, syncedAssets: [], message: "No pending assets" });
  }
  
  // Mark as syncing
  await prisma.project.update({
    where: { id: projectId },
    data: { syncStatus: "syncing" },
  });
  
  // Build sync prompt
  const syncPrompt = buildSyncPrompt(pendingAssets, manifest.assets, project.game);
  
  // TODO: Send to chat API for AI processing
  // For now, just mark as clean
  await prisma.project.update({
    where: { id: projectId },
    data: {
      syncStatus: "clean",
      lastSyncAt: new Date(),
    },
  });
  
  return Response.json({
    success: true,
    syncedAssets: pendingAssets,
    message: `Synced ${pendingAssets.length} assets`,
  });
}
```

---

## New Files to Create

### 1. `src/lib/studio/sync-tools.ts`

```typescript
/**
 * Hatch Studios Sync Tools
 * 
 * Provides AI SDK tools for syncing assets into games.
 * Handles asset loading code generation, placement, and conflict resolution.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { AssetManifest } from '@/lib/types/unified-project';

// =============================================================================
// SYNC ASSET TOOL
// =============================================================================

const syncAssetSchema = z.object({
  assetRefId: z.string().describe('ID of the asset to sync from GameAssetRef'),
  sceneId: z.string().optional().describe('Target scene ID (uses active scene if not provided)'),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
  }).optional().describe('Initial position in scene'),
  rotation: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
  }).optional().describe('Initial rotation in scene'),
  scale: z.object({
    x: z.number().default(1),
    y: z.number().default(1),
    z: z.number().default(1),
  }).optional().describe('Initial scale in scene'),
  generateCode: z.boolean().default(true).describe('Whether to generate loading code'),
});

export type SyncAssetInput = z.infer<typeof syncAssetSchema>;

/**
 * Sync an asset into the game scene
 */
export const syncAssetTool = (gameId: string) => {
  return tool({
    description: 'Sync a newly created asset into the game scene. Generate loading code, create placement record, and integrate with existing scene structure.',
    inputSchema: syncAssetSchema,
    execute: async ({ assetRefId, sceneId, position, rotation, scale, generateCode }) => {
      try {
        console.log('🔄 Syncing asset:', assetRefId);

        // Get game and asset reference
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { scenes: true, assetRefs: true },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        const assetRef = game.assetRefs.find(ar => ar.id === assetRefId);
        if (!assetRef) {
          return { success: false, error: `Asset reference ${assetRefId} not found` };
        }

        // Determine target scene
        const targetSceneId = sceneId || game.activeSceneId;
        if (!targetSceneId) {
          return { success: false, error: 'No active scene and no sceneId provided' };
        }

        const scene = game.scenes.find(s => s.id === targetSceneId);
        if (!scene) {
          return { success: false, error: `Scene ${targetSceneId} not found` };
        }

        // Generate loading code based on asset type
        const loadingCode = generateAssetLoadingCode(assetRef, scene.name);

        // Check for existing placement
        const existingPlacement = await prisma.assetPlacement.findFirst({
          where: { sceneId: targetSceneId, assetRefId },
        });

        let placementId: string;
        if (existingPlacement) {
          // Update existing placement
          await prisma.assetPlacement.update({
            where: { id: existingPlacement.id },
            data: {
              positionX: position?.x ?? existingPlacement.positionX,
              positionY: position?.y ?? existingPlacement.positionY,
              positionZ: position?.z ?? existingPlacement.positionZ,
              rotationX: rotation?.x ?? existingPlacement.rotationX,
              rotationY: rotation?.y ?? existingPlacement.rotationY,
              rotationZ: rotation?.z ?? existingPlacement.rotationZ,
              scaleX: scale?.x ?? existingPlacement.scaleX,
              scaleY: scale?.y ?? existingPlacement.scaleY,
              scaleZ: scale?.z ?? existingPlacement.scaleZ,
              updatedAt: new Date(),
            },
          });
          placementId = existingPlacement.id;
          console.log('✅ Updated existing placement:', placementId);
        } else {
          // Create new placement
          const placement = await prisma.assetPlacement.create({
            data: {
              sceneId: targetSceneId,
              assetRefId: assetRef.id,
              positionX: position?.x ?? 0,
              positionY: position?.y ?? 0,
              positionZ: position?.z ?? 0,
              rotationX: rotation?.x ?? 0,
              rotationY: rotation?.y ?? 0,
              rotationZ: rotation?.z ?? 0,
              scaleX: scale?.x ?? 1,
              scaleY: scale?.y ?? 1,
              scaleZ: scale?.z ?? 1,
            },
          });
          placementId = placement.id;
          console.log('✅ Created placement:', placementId);
        }

        return {
          success: true,
          message: `Asset "${assetRef.name}" synced to scene`,
          placementId,
          assetName: assetRef.name,
        };
      } catch (error) {
        console.error('❌ Failed to sync asset:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
};

// =============================================================================
// SYNC PROMPT BUILDER
// =============================================================================

/**
 * Build the system prompt for asset sync
 */
export function buildSyncPrompt(
  pendingAssets: string[],
  assets: AssetManifest["assets"],
  game: any
): string {
  const assetDetails = pendingAssets.map(key => {
    const asset = assets[key];
    return `
## ${key}
- Type: ${asset.type}
- Name: ${asset.name}
- URLs: ${JSON.stringify(asset.urls)}
- Metadata: ${JSON.stringify(asset.metadata)}
    `.trim();
  }).join("\n");
  
  return `
# Asset Sync Request

New assets have been added to the project and need to be integrated into the game.

## Pending Assets
${assetDetails}

## Current Game Structure
The game has the following files:
${game.files?.map((f: any) => `- ${f.name} (orderIndex: ${f.orderIndex})`).join("\n") || "- No files yet"}

## Instructions
1. Read the current state of files using listFiles
2. Generate appropriate code to load and use the new assets
3. For 3D models: Use BABYLON.SceneLoader.ImportMeshAsync
4. For textures: Load and apply to materials
5. Place assets appropriately in the scene
6. If there are any issues (conflicts, missing dependencies), fix them

## Output Requirements
- Use updateFile tool to modify existing files
- Or use createFile to create new files if needed
- Explain what changes you're making

The current game ID is: ${game.id}
  `.trim();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateAssetLoadingCode(assetRef: any, sceneName: string): string {
  switch (assetRef.assetType) {
    case 'model':
      return `
// Load 3D model for ${assetRef.name}
BABYLON.SceneLoader.ImportMeshAsync("", "${assetRef.glbUrl}", scene)
  .then((mesh) => {
    ${assetRef.name} = mesh;
    ${assetRef.name}.position = new BABYLON.Vector3(0, 0, 0);
    ${assetRef.name}.scaling = new BABYLON.Vector3(1, 1, 1);
  })
  .catch((error) => {
    console.error("Failed to load ${assetRef.name}:", error);
  });
`;
    
    case 'texture':
      return `
// Load texture for ${assetRef.name}
const texture = new BABYLON.Texture("${assetRef.glbUrl}", scene);
texture.hasAlpha = true;
`;
      
    case 'skybox':
      return `
// Load skybox for ${assetRef.name}
const skybox = BABYLON.CubeTexture.CreateFromPrefixedURL("${assetRef.glbUrl}/", scene);
scene.createDefaultSkybox(skybox);
`;
      
    default:
      return `// Unknown asset type: ${assetRef.assetType}`;
  }
}
```

### 2. `src/lib/types/unified-project.ts`

```typescript
/**
 * Unified Project Types
 * Types for the unified project architecture
 */

export interface AssetManifest {
  version: "1.0";
  lastUpdated: string;
  assets: {
    [key: string]: {
      id: string;
      type: "2d" | "3d";
      name: string;
      version: number;
      urls: {
        thumbnail?: string;
        model?: string;
        glb?: string;
      };
      metadata: {
        prompt?: string;
        style?: string;
        animations?: string[];
        poses?: string[];
      };
      linkedAt: string;
      lockedVersion?: number;
    };
  };
  syncState: {
    status: "clean" | "pending";
    pendingAssets: string[];
    lastSync: string | null;
  };
}

export interface ProjectStatus {
  projectId: string;
  name: string;
  mode: "2d" | "3d" | "hybrid";
  phase: string;
  syncStatus: "clean" | "pending" | "syncing";
  pendingAssets: string[];
  pendingAssetCount: number;
  lastSync: string | null;
  assetCount: number;
  gameId?: string;
  gamePhase?: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  mode: "2d" | "3d" | "hybrid";
  startWith: "assets" | "game" | "both";
}

export interface SyncResult {
  success: boolean;
  syncedAssets: string[];
  message: string;
  changes?: {
    fileId: string;
    fileName: string;
    changeType: "created" | "updated";
    description: string;
  }[];
}
```

### 3. `src/components/dashboard/SyncStatusBanner.tsx`

```typescript
'use client';

/**
 * Sync Status Banner
 * Shows warning when assets need to be synced
 */

interface SyncStatusBannerProps {
  pendingAssets: string[];
  onSync: () => void;
  onDismiss: () => void;
  isSyncing?: boolean;
}

export function SyncStatusBanner({ 
  pendingAssets, 
  onSync, 
  onDismiss,
  isSyncing = false 
}: SyncStatusBannerProps) {
  if (pendingAssets.length === 0) return null;
  
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-medium text-yellow-300">
            {pendingAssets.length} asset{pendingAssets.length !== 1 ? 's' : ''} pending sync
          </p>
          <p className="text-sm text-yellow-200/70">
            New assets have been added. Review and sync to use them in your game.
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onDismiss}
          disabled={isSyncing}
        >
          Later
        </Button>
        <Button 
          onClick={onSync} 
          className="bg-yellow-600 hover:bg-yellow-700"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Syncing...
            </>
          ) : (
            `Sync Now (${pendingAssets.length})`
          )}
        </Button>
      </div>
    </div>
  );
}
```

### 4. `src/components/dashboard/AssetSyncButton.tsx`

```typescript
'use client';

/**
 * Asset Sync Button
 * Shows in header with pending count badge
 */

interface AssetSyncButtonProps {
  projectId: string;
  pendingCount: number;
  onClick: () => void;
}

export function AssetSyncButton({ projectId, pendingCount, onClick }: AssetSyncButtonProps) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="relative"
    >
      <span>📦</span>
      <span className="ml-1">Assets</span>
      {pendingCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {pendingCount}
        </span>
      )}
    </Button>
  );
}
```

### 5. `src/components/dashboard/UnifiedProjectCard.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Unified Project Card
 * Shows project with both asset and game status
 */

interface UnifiedProjectCardProps {
  project: {
    id: string;
    name: string;
    mode: string;
    phase: string;
    syncStatus: string;
    pendingAssetCount: number;
    assetCount: number;
    gamePhase?: string;
    updatedAt: Date;
  };
}

function ProjectModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    "2d": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "3d": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "hybrid": "bg-green-500/20 text-green-300 border-green-500/30",
  };
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${colors[mode] || colors["2d"]}`}>
      {mode.toUpperCase()}
    </span>
  );
}

function ProjectPhaseBadge({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    "planning": "📋 Planning",
    "assets": "🎨 Assets",
    "building": "🏗️ Building",
    "testing": "🧪 Testing",
  };
  
  return (
    <span className="text-xs text-muted-foreground">
      {labels[phase] || phase}
    </span>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function UnifiedProjectCard({ project }: UnifiedProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`} className="block">
      <div className="glass-interactive rounded-lg p-6 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold truncate pr-4">{project.name}</h3>
          <ProjectModeBadge mode={project.mode} />
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.gamePhase && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              🎮 Game
            </span>
          )}
          <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🎨 {project.assetCount} assets
          </span>
          {project.syncStatus === "pending" && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              ⚠️ {project.pendingAssetCount} sync
            </span>
          )}
        </div>
        
        {/* Phase */}
        <ProjectPhaseBadge phase={project.phase} />
        
        {/* Last updated */}
        <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Updated {formatRelativeTime(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
```

### 6. `src/components/dashboard/NewProjectDialog.tsx` (update)

Replace `CreateProjectButton.tsx` with unified dialog:

```typescript
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Loader2 } from "lucide-react";

interface NewProjectDialogProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
}

export function NewProjectDialog({
  variant = "default",
  size = "default",
  children,
  className,
}: NewProjectDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"2d" | "3d" | "hybrid">("3d");
  const [startWith, setStartWith] = useState<"assets" | "game" | "both">("both");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mode, startWith }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const { projectId, gameId } = await response.json();

      // Redirect based on startWith
      if (startWith === "game" || startWith === "both") {
        router.push(`/studio/${gameId}`);
      } else {
        router.push(`/project/${projectId}/planning`);
      }

    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children || (
            <>
              <span className="mr-2">+</span>
              New Project
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start creating assets, games, or both in one unified workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Name</label>
            <Input
              placeholder="My RPG Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleCreate();
              }}
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Mode</label>
            <ModeToggle value={mode} onValueChange={setMode} disabled={isLoading} />
          </div>

          {/* Start with selection - KEY FEATURE */}
          <div>
            <label className="text-sm font-medium mb-3 block">Start with</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={startWith === "assets" ? "default" : "outline"}
                onClick={() => setStartWith("assets")}
                disabled={isLoading}
                className="flex flex-col items-center py-4 h-auto gap-2"
              >
                <span className="text-2xl">🎨</span>
                <span className="text-xs font-normal">Assets First</span>
              </Button>
              <Button
                type="button"
                variant={startWith === "game" ? "default" : "outline"}
                onClick={() => setStartWith("game")}
                disabled={isLoading}
                className="flex flex-col items-center py-4 h-auto gap-2"
              >
                <span className="text-2xl">🎮</span>
                <span className="text-xs font-normal">Game First</span>
              </Button>
              <Button
                type="button"
                variant={startWith === "both" ? "default" : "outline"}
                onClick={() => setStartWith("both")}
                disabled={isLoading}
                className="flex flex-col items-center py-4 h-auto gap-2"
              >
                <span className="text-2xl">⚡</span>
                <span className="text-xs font-normal">Both Together</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {startWith === "assets" && "Generate assets first, then build your game with them"}
              {startWith === "game" && "Start building your game, add assets later as needed"}
              {startWith === "both" && "Create assets and game side by side in the same project"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 7. `src/hooks/useProjectSync.ts`

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ProjectStatus } from '@/lib/types/unified-project';

/**
 * Hook for managing project sync state
 */
export function useProjectSync(projectId: string) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const syncAssets = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/assets/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync assets');
      
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSyncing(false);
    }
  }, [projectId, refreshStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    isSyncing,
    error,
    refreshStatus,
    syncAssets,
    pendingCount: status?.pendingAssetCount ?? 0,
  };
}
```

---

## UI Integration

### Update `src/app/dashboard/page.tsx`

```typescript
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog';
import { UnifiedProjectCard } from '@/components/dashboard/UnifiedProjectCard';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Fetch unified project data
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          generatedAssets: true,
          generated3DAssets: true,
        },
      },
    },
  });

  // Get game status for each project
  const projectsWithStatus = await Promise.all(
    projects.map(async (project) => {
      const game = project.gameId 
        ? await prisma.game.findUnique({ where: { id: project.gameId } })
        : null;
      
      const manifest = (project.assetManifest as any) || {};
      const assets = manifest.assets || {};
      const syncState = manifest.syncState || { pendingAssets: [] };
      
      return {
        id: project.id,
        name: project.name,
        mode: project.mode,
        phase: project.phase,
        syncStatus: project.syncStatus,
        pendingAssetCount: syncState.pendingAssets?.length || 0,
        assetCount: Object.keys(assets).length,
        gamePhase: game?.phase,
        updatedAt: project.updatedAt,
      };
    })
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 p-6 rounded-lg glass-panel">
          <div>
            <h1 className="text-4xl font-bold text-white/90">Your Projects</h1>
            <p className="text-white/60">Manage assets and games in one unified workspace</p>
          </div>
          <NewProjectDialog />
        </header>

        {/* Projects grid */}
        <main>
          {projectsWithStatus.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-glass-border rounded-lg glass-panel">
              <p className="text-xl text-white/70 mb-4">No projects yet</p>
              <p className="text-white/50 mb-6">
                Create your first project to start building games with AI-generated assets.
              </p>
              <NewProjectDialog size="lg">
                <span className="mr-2">+</span>
                Create Project
              </NewProjectDialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithStatus.map((project) => (
                <UnifiedProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

- Test manifest generation and parsing
- Test sync status calculations
- Test API endpoint responses
- Test hook state management

### Integration Tests

- Test project creation with different start paths
- Test asset linking to game
- Test sync workflow end-to-end
- Test AI tool integration

### Edge Cases

- Project with no game
- Game with no assets
- Sync when already in progress
- Network failures during sync
- Invalid asset references

---

## Validation Commands

```bash
# TypeScript check
cd src && bun run typecheck

# Lint
cd src && bun run lint

# Build
cd src && bun run build
```

---

## Acceptance Criteria

- [ ] Unified dashboard shows all projects with asset/game status
- [ ] New projects can start with assets, game, or both
- [ ] Assets can be added mid-game
- [ ] Sync banner appears when assets need syncing
- [ ] AI generates appropriate code for asset integration
- [ ] Version locking prevents breaking changes
- [ ] All validation commands pass
- [ ] No regressions in existing functionality

---

## Implementation Order

1. **Week 1**: Database schema + API endpoints
   - Add project fields to schema
   - Create status/sync API endpoints
   - Test API responses

2. **Week 2**: Frontend components
   - NewProjectDialog with start path selection
   - UnifiedProjectCard
   - SyncStatusBanner
   - useProjectSync hook

3. **Week 3**: Dashboard integration
   - Update dashboard page
   - Add sync button to studio header
   - Connect AI sync tools

4. **Week 4**: Testing and polish
   - End-to-end testing
   - Error handling
   - Documentation

---

## Notes

### Architecture Decisions

1. **Manifest Storage**: JSON in database (not MemoryFile) for simpler queries and atomic updates
2. **Version Locking**: Snapshot URLs at time of add to prevent breaking changes
3. **Sync Trigger**: Manual sync button (not auto) so user has control
4. **Project Reference**: Game stores projectId, Project optionally stores gameId

### Future Considerations

- Auto-sync option for seamless integration
- Asset version comparison UI
- Bulk sync for multiple assets
- Sync conflict resolution UI
- Asset templates and presets
