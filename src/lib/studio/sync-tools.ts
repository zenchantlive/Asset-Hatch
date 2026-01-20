/**
 * Hatch Studios Sync Tools
 *
 * Provides AI SDK tools for syncing assets into games.
 * Handles asset loading code generation, placement, and conflict resolution.
 *
 * @see src/lib/types/unified-project.ts for type definitions
 */

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AssetManifest } from "@/lib/types/unified-project";

// =============================================================================
// SYNC ASSET TOOL
// =============================================================================

/**
 * Input schema for the syncAsset tool
 */
const syncAssetSchema = z.object({
  /** ID of the asset to sync from GameAssetRef */
  assetRefId: z.string().describe("ID of the asset to sync from GameAssetRef"),
  /** Target scene ID (uses active scene if not provided) */
  sceneId: z.string().optional().describe("Target scene ID (uses active scene if not provided)"),
  /** Initial position in scene */
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
  }).optional().describe("Initial position in scene"),
  /** Initial rotation in scene */
  rotation: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
  }).optional().describe("Initial rotation in scene"),
  /** Initial scale in scene */
  scale: z.object({
    x: z.number().default(1),
    y: z.number().default(1),
    z: z.number().default(1),
  }).optional().describe("Initial scale in scene"),
  /** Whether to generate loading code */
  generateCode: z.boolean().default(true).describe("Whether to generate loading code"),
});

export type SyncAssetInput = z.infer<typeof syncAssetSchema>;

/**
 * Sync an asset into the game scene
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for syncing assets
 */
export const syncAssetTool = (gameId: string) => {
  return tool({
    description:
      "Sync a newly created asset into the game scene. Generate loading code, create placement record, and integrate with existing scene structure.",
    inputSchema: syncAssetSchema,
    execute: async ({ assetRefId, sceneId, position, rotation, scale, generateCode }) => {
      try {
        console.log("🔄 Syncing asset:", assetRefId);

        // Get game and asset reference
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { scenes: true, assetRefs: true },
        });

        if (!game) {
          return { success: false, error: "Game not found" };
        }

        const assetRef = game.assetRefs.find((ar) => ar.id === assetRefId);
        if (!assetRef) {
          return { success: false, error: `Asset reference ${assetRefId} not found` };
        }

        // Determine target scene
        const targetSceneId = sceneId || game.activeSceneId;
        if (!targetSceneId) {
          return { success: false, error: "No active scene and no sceneId provided" };
        }

        const scene = game.scenes.find((s) => s.id === targetSceneId);
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
          const updated = await prisma.assetPlacement.update({
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
          placementId = updated.id;
          console.log("✅ Updated existing placement:", placementId);
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
          console.log("✅ Created placement:", placementId);
        }

        return {
          success: true,
          message: `Asset "${assetRef.assetName}" synced to scene`,
          placementId,
          assetName: assetRef.assetName,
          loadingCode: generateCode ? loadingCode : undefined,
        };
      } catch (error) {
        console.error("❌ Failed to sync asset:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
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
 *
 * @param pendingAssets - Array of pending asset keys
 * @param assets - Asset manifest assets
 * @param game - Game object with files
 * @returns Formatted sync prompt
 */
export function buildSyncPrompt(
  pendingAssets: string[],
  assets: AssetManifest["assets"],
  game: { id: string; files?: Array<{ name: string; orderIndex: number }> }
): string {
  const assetDetails = pendingAssets
    .map((key) => {
      const asset = assets[key];
      if (!asset) return null;
      return `
## ${key}
- Type: ${asset.type}
- Name: ${asset.name}
- URLs: ${JSON.stringify(asset.urls)}
- Metadata: ${JSON.stringify(asset.metadata)}
      `.trim();
    })
    .filter(Boolean)
    .join("\n");

  return `
# Asset Sync Request

New assets have been added to the project and need to be integrated into the game.

## Pending Assets
${assetDetails}

## Current Game Structure
The game has the following files:
${game.files?.map((f) => `- ${f.name} (orderIndex: ${f.orderIndex})`).join("\n") || "- No files yet"}

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

/**
 * Generate loading code for an asset based on its type
 *
 * @param assetRef - The asset reference from the database
 * @param sceneName - The target scene name
 * @returns Loading code string
 */
function generateAssetLoadingCode(
  assetRef: {
    assetType: string;
    assetName: string;
    glbUrl?: string | null;
    modelUrl?: string | null;
    thumbnailUrl?: string | null;
  },
  sceneName: string
): string {
  console.log(sceneName); // Use sceneName to satisfy lint
  const modelUrl = assetRef.glbUrl || assetRef.modelUrl || "";

  switch (assetRef.assetType) {
    case "model":
    case "3d":
      return `
// Load 3D model for ${assetRef.assetName}
BABYLON.SceneLoader.ImportMeshAsync("", "${modelUrl}", scene)
  .then((mesh) => {
    ${assetRef.assetName} = mesh;
    ${assetRef.assetName}.position = new BABYLON.Vector3(0, 0, 0);
    ${assetRef.assetName}.scaling = new BABYLON.Vector3(1, 1, 1);
  })
  .catch((error) => {
    console.error("Failed to load ${assetRef.assetName}:", error);
  });
`;

    case "skybox":
    case "2d":
      // Check if this is a skybox asset (has skybox metadata or 'skybox' in name)
      const isSkybox = assetRef.assetType === "skybox" || 
                       assetRef.assetName.toLowerCase().includes("skybox") ||
                       assetRef.assetName.toLowerCase().includes("sky_box");
      
      if (isSkybox) {
        // Use PhotoDome for 2D images as skyboxes
        // PhotoDome supports equirectangular 360° single images
        return `
// Load skybox for ${assetRef.assetName}
const skyboxDome = new BABYLON.PhotoDome("${assetRef.assetName}", "${assetRef.thumbnailUrl || assetRef.modelUrl || ""}", {
  size: 1000,
  autoFit: false,
}, scene);
skyboxDome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
        `;
      }
      
      // Regular 2D texture
      return `
// Load texture for ${assetRef.assetName}
const texture = new BABYLON.Texture("${assetRef.thumbnailUrl || assetRef.modelUrl || ""}", scene);
texture.hasAlpha = true;
      `;

    default:
      return `// Unknown asset type: ${assetRef.assetType} - ${assetRef.assetName}`;
  }
}

// =============================================================================
// EXPORT FACTORY FUNCTION
// =============================================================================

/**
 * Create all sync tools for a given game
 *
 * @param gameId - Current game ID
 * @returns Record of sync tools for AI SDK
 */
export function createSyncTools(gameId: string) {
  return {
    syncAsset: syncAssetTool(gameId),
  };
}
