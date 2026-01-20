/**
 * Hatch Studios Game Tools
 *
 * Provides AI SDK tools for game management (scenes, assets, camera, physics, code).
 * Tools interact with Prisma database models: Game, GameScene, CodeVersion, AssetPlacement.
 *
 * @see src/lib/studio/schemas.ts for Zod schemas
 * @see src/app/api/studio/chat/route.ts for tool usage
 */

import { tool } from 'ai';
import { prisma } from '@/lib/prisma';
import {
  createSceneSchema,
  switchSceneSchema,
  placeAssetSchema,
  listUserAssetsSchema,
  createAssetSchema,
  createFileSchema,
  updateFileSchema,
  deleteFileSchema,
  listFilesSchema,
  reorderFilesSchema,
  updatePlanSchema,
  getPlanSchema,
  renameFileSchema,
  type CreateSceneInput,
  type SwitchSceneInput,
  type PlaceAssetInput,
  type ListUserAssetsInput,
  type CreateAssetInput,
  type CreateFileInput,
  type UpdateFileInput,
  type DeleteFileInput,
  type ReorderFilesInput,
  type UpdatePlanInput,
  type RenameFileInput,
} from '@/lib/studio/schemas';
import { resolveR2AssetUrl } from '@/lib/studio/r2-storage';

// =============================================================================
// CREATE SCENE TOOL
// =============================================================================

/**
 * Create game scene tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for creating new scenes
 */
export const createSceneTool = (gameId: string) => {
  return tool({
    description: 'Create a new scene/level for the game. Use this when the user wants to add a new level or screen.',
    inputSchema: createSceneSchema,
    execute: async ({ name, orderIndex }: CreateSceneInput) => {
      try {
        console.log('🎮 Creating scene:', name, 'order:', orderIndex);

        // Create new scene in database
        const scene = await prisma.gameScene.create({
          data: {
            gameId,
            name,
            orderIndex,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log('✅ Scene created:', scene.id);

        return {
          success: true,
          message: `Created scene "${name}" (ID: ${scene.id})`,
          sceneId: scene.id,
          name,
          orderIndex,
        };
      } catch (error) {
        console.error('❌ Failed to create scene:', error);
        return { success: false, error: 'Failed to create scene' };
      }
    },
  });
};

// =============================================================================
// SWITCH SCENE TOOL
// =============================================================================

/**
 * Switch active scene tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for switching scenes
 */
export const switchSceneTool = (gameId: string) => {
  return tool({
    description: 'Switch to a different scene in the game. Updates the activeSceneId on the game.',
    inputSchema: switchSceneSchema,
    execute: async ({ sceneId }: SwitchSceneInput) => {
      try {
        console.log('🔄 Switching to scene:', sceneId);

        // Update game's active scene
        await prisma.game.update({
          where: { id: gameId },
          data: { activeSceneId: sceneId },
        });

        console.log('✅ Scene switched to:', sceneId);

        return {
          success: true,
          message: `Switched to scene ${sceneId}`,
        };
      } catch (error) {
        console.error('❌ Failed to switch scene:', error);
        return { success: false, error: 'Failed to switch scene' };
      }
    },
  });
};

// =============================================================================
// PLACE ASSET TOOL
// =============================================================================

/**
 * Place asset in scene tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for placing assets
 */
export const placeAssetTool = (gameId: string) => {
  return tool({
    description: 'Place an asset in a scene at a specific position, rotation, and scale.',
    inputSchema: placeAssetSchema,
    execute: async ({ assetId, sceneId, position, rotation, scale }: PlaceAssetInput) => {
      try {
        console.log('📍 Placing asset:', assetId, 'in scene:', sceneId);

        // Verify asset exists in GameAssetRef
        const assetRef = await prisma.gameAssetRef.findFirst({
          where: { gameId, assetId },
        });

        if (!assetRef) {
          return { success: false, error: `Asset ${assetId} not found` };
        }

        // Create asset placement record
        const placement = await prisma.assetPlacement.create({
          data: {
            sceneId,
            assetRefId: assetRef.id,
            positionX: position.x,
            positionY: position.y,
            positionZ: position.z,
            rotationX: rotation.x,
            rotationY: rotation.y,
            rotationZ: rotation.z,
            scaleX: scale.x,
            scaleY: scale.y,
            scaleZ: scale.z,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log('✅ Asset placed:', placement.id);

        return {
          success: true,
          message: `Placed asset ${assetId} in scene ${sceneId}`,
          placementId: placement.id,
          position,
          rotation,
          scale,
        };
      } catch (error) {
        console.error('❌ Failed to place asset:', error);
        return { success: false, error: 'Failed to place asset' };
      }
    },
  });
};

// =============================================================================
// LIST USER ASSETS TOOL
// =============================================================================

/**
 * List user assets tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for querying user's Asset Hatch library
 */
export const listUserAssetsTool = (gameId: string) => {
  return tool({
    description: 'Query the user\'s Asset Hatch library for available assets to use in the game.',
    inputSchema: listUserAssetsSchema,
    execute: async ({ type, search, limit, includeGlbData }: ListUserAssetsInput) => {
      try {
        console.log('📦 Listing assets:', type, 'search:', search, 'limit:', limit, 'includeGlbData:', includeGlbData);

        // Get game to verify ownership and get projectId
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: {
            project: {
              select: { id: true, userId: true },
            },
          },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        // Phase 6: Use projectId from unified project
        const projectId = game.projectId;
        if (!projectId) {
          return {
            success: false,
            error: 'Game is not linked to a project. Create a project first to access assets.',
          };
        }

        console.log('🔗 Querying assets for projectId:', projectId);

        const [assets3D, assets2D] = await Promise.all([
          type === '3d' || type === 'all'
            ? prisma.generated3DAsset.findMany({
                where: {
                  projectId,
                  approvalStatus: 'approved',
                  ...(search && {
                    OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { assetId: { contains: search, mode: 'insensitive' } },
                    ],
                  }),
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
              })
            : Promise.resolve([]),
          type === '2d' || type === 'all'
            ? prisma.generatedAsset.findMany({
                where: {
                  projectId,
                  status: 'completed',
                  ...(search && {
                    OR: [{ assetId: { contains: search, mode: 'insensitive' } }],
                  }),
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
              })
            : Promise.resolve([]),
        ]);

        const gameAssetRefs = assets3D.length
          ? await prisma.gameAssetRef.findMany({
              where: {
                projectId,
                assetType: '3d',
                assetId: { in: assets3D.map((asset) => asset.id) },
              },
              select: {
                assetId: true,
                glbUrl: true,
                ...(includeGlbData ? { glbData: true } : {}),
              },
            })
          : [];

        const assetRefMap = new Map<string, { glbData: string | null; glbUrl: string | null }>();
        gameAssetRefs.forEach((ref) => {
          assetRefMap.set(ref.assetId, {
            glbData: includeGlbData && 'glbData' in ref ? ref.glbData : null,
            glbUrl: ref.glbUrl || null,
          });
        });

        const formatted3D = await Promise.all(
          assets3D.map(async (asset) => {
            const assetRef = assetRefMap.get(asset.id);
            const storedUrl = assetRef?.glbUrl || asset.riggedModelUrl || asset.draftModelUrl || null;
            const glbUrl = await resolveR2AssetUrl(storedUrl);

            let animations: string[] | null = null;
            if (asset.animatedModelUrls) {
              try {
                animations = Object.keys(JSON.parse(asset.animatedModelUrls));
              } catch {
                animations = null;
              }
            }

            return {
              id: asset.id,
              name: asset.name || asset.assetId,
              type: '3d',
              glbUrl,
              glbData: includeGlbData ? assetRef?.glbData || null : null,
              thumbnailUrl: asset.draftModelUrl || null,
              projectId: asset.projectId,
              prompt: asset.promptUsed || null,
              riggable: asset.isRiggable || false,
              animations,
            };
          })
        );

        const formatted2D = assets2D.map((asset) => {
          let imageUrl: string | null = null;
          if (asset.metadata) {
            try {
              const metadata = JSON.parse(asset.metadata);
              imageUrl = metadata.imageUrl || null;
            } catch {
              imageUrl = null;
            }
          }

          return {
            id: asset.id,
            name: asset.assetId,
            type: '2d',
            imageUrl,
            thumbnailUrl: imageUrl,
            projectId: asset.projectId,
            prompt: asset.promptUsed || null,
          };
        });

        const combinedAssets = [...formatted3D, ...formatted2D].slice(0, limit);

        return {
          success: true,
          message: `Found ${combinedAssets.length} assets (${assets3D.length} 3D, ${assets2D.length} 2D)`,
          assets: combinedAssets,
        };
      } catch (error) {
        console.error('❌ Failed to list assets:', error);
        return { success: false, error: 'Failed to list assets' };
      }
    },
  });
};

// =============================================================================
// CREATE ASSET TOOL
// =============================================================================

/**
 * Create asset tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for creating new assets
 */
export const createAssetTool = (gameId: string) => {
  return tool({
    description: 'Trigger Asset Hatch generation to create a new asset for use in the game.',
    inputSchema: createAssetSchema,
    execute: async ({ type, name, description }: CreateAssetInput) => {
      try {
        console.log('➕ Creating asset:', type, 'name:', name);

        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        // For MVP, return instruction to use Asset Hatch UI
        // Full implementation would trigger Asset Hatch API

        return {
          success: true,
          message: `To create ${type} asset "${name}", navigate to Asset Hatch and use the appropriate generation phase`,
          type,
          name,
          description,
          actionUrl: type === '3d'
            ? `/projects/${game.userId}/3d-generation?project_id=${gameId}`
            : `/projects/${game.userId}`,
        };
      } catch (error) {
        console.error('❌ Failed to create asset:', error);
        return { success: false, error: 'Failed to create asset' };
      }
    },
  });
};

// =============================================================================
// FILE MANAGEMENT TOOLS (Multi-file support)
// =============================================================================

/**
 * Create file tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for creating files
 */
export const createFileTool = (gameId: string) => {
  return tool({
    description: 'Create a new JavaScript file in the game. Files are executed in order when the game runs.',
    inputSchema: createFileSchema,
    execute: async ({ name, content, orderIndex }: CreateFileInput) => {
      try {
        console.log('📄 Creating file:', name);

        // Get current max orderIndex if not specified
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined) {
          const maxFile = await prisma.gameFile.findFirst({
            where: { gameId },
            orderBy: { orderIndex: 'desc' },
          });
          finalOrderIndex = maxFile ? maxFile.orderIndex + 1 : 0;
        }

        // Create file in database
        const file = await prisma.gameFile.create({
          data: {
            gameId,
            name,
            content,
            orderIndex: finalOrderIndex,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Create version history record
        await prisma.codeVersion.create({
          data: {
            gameId,
            fileName: name,
            code: content,
            description: `Created file: ${name}`,
            trigger: 'createFile',
            createdAt: new Date(),
          },
        });

        console.log('✅ File created:', file.id);

        return {
          success: true,
          message: `Created file "${name}" (order: ${finalOrderIndex})`,
          fileId: file.id,
          name,
          orderIndex: finalOrderIndex,
        };
      } catch (error) {
        console.error('❌ Failed to create file:', error);
        // Check for unique constraint violation
        if ((error as { code?: string }).code === 'P2002') {
          return { success: false, error: `File "${name}" already exists` };
        }
        return { success: false, error: 'Failed to create file' };
      }
    },
  });
};

/**
 * Update file tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for updating files
 */
export const updateFileTool = (gameId: string) => {
  return tool({
    description: 'Update the content of an existing file in the game.',
    inputSchema: updateFileSchema,
    execute: async ({ fileId, content }: UpdateFileInput) => {
      try {
        console.log('💾 Updating file:', fileId);

        // First, get the file and verify ownership
        const file = await prisma.gameFile.findFirst({
          where: { id: fileId, gameId },
        });

        if (!file) {
          return { success: false, error: `File not found or access denied` };
        }

        // Update file in database using fileId
        const updatedFile = await prisma.gameFile.update({
          where: {
            id: fileId,
          },
          data: {
            content,
            updatedAt: new Date(),
          },
        });

        // Create version history record
        await prisma.codeVersion.create({
          data: {
            gameId,
            fileName: file.name,
            code: content,
            description: `Updated file: ${file.name}`,
            trigger: 'updateFile',
            createdAt: new Date(),
          },
        });

        console.log('✅ File updated:', updatedFile.id);

        return {
          success: true,
          message: `Updated file "${file.name}"`,
          fileId: updatedFile.id,
          name: file.name,
          content,
        };
      } catch (error) {
        console.error('❌ Failed to update file:', error);
        return { success: false, error: 'File not found or update failed' };
      }
    },
  });
};

/**
 * Delete file tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for deleting files
 */
export const deleteFileTool = (gameId: string) => {
  return tool({
    description: 'Delete a file from the game. This cannot be undone.',
    inputSchema: deleteFileSchema,
    execute: async ({ fileId }: DeleteFileInput) => {
      try {
        console.log('🗑️ Deleting file:', fileId);

        // First, get the file and verify ownership
        const file = await prisma.gameFile.findFirst({
          where: { id: fileId, gameId },
        });

        if (!file) {
          return { success: false, error: 'File not found or access denied' };
        }

        // Delete file from database using fileId
        await prisma.gameFile.delete({
          where: {
            id: fileId,
          },
        });

        console.log('✅ File deleted:', file.name);

        return {
          success: true,
          message: `Deleted file "${file.name}"`,
          fileId,
          name: file.name,
        };
      } catch (error) {
        console.error('❌ Failed to delete file:', error);
        return { success: false, error: 'File not found or delete failed' };
      }
    },
  });
};

/**
 * Rename file tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for renaming files
 */
export const renameFileTool = (gameId: string) => {
  return tool({
    description: 'Rename a file in the game. This updates the filename while keeping the file ID the same.',
    inputSchema: renameFileSchema,
    execute: async ({ fileId, name }: RenameFileInput) => {
      try {
        console.log('📝 Renaming file:', fileId, 'to', name);

        // First, get the old file and verify ownership
        const oldFile = await prisma.gameFile.findFirst({
          where: { id: fileId, gameId },
        });

        if (!oldFile) {
          return { success: false, error: 'File not found or access denied' };
        }

        // Update file name in database using fileId
        const renamedFile = await prisma.gameFile.update({
          where: {
            id: fileId,
          },
          data: {
            name,
            updatedAt: new Date(),
          },
        });

        // Create version history record for the rename
        await prisma.codeVersion.create({
          data: {
            gameId,
            fileName: name,
            code: oldFile.content,
            description: `Renamed file from "${oldFile.name}" to "${name}"`,
            trigger: 'renameFile',
            createdAt: new Date(),
          },
        });

        console.log('✅ File renamed:', renamedFile.id);

        return {
          success: true,
          message: `Renamed file from "${oldFile.name}" to "${name}"`,
          fileId: renamedFile.id,
          name: renamedFile.name,
        };
      } catch (error) {
        console.error('❌ Failed to rename file:', error);
        // Check for unique constraint violation (file name already exists)
        if ((error as { code?: string }).code === 'P2002') {
          return { success: false, error: `File "${name}" already exists in this game` };
        }
        return { success: false, error: 'File not found or rename failed' };
      }
    },
  });
};

/**
 * List files tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for listing files
 */
export const listFilesTool = (gameId: string) => {
  return tool({
    description: 'List all JavaScript files in the game, in execution order.',
    inputSchema: listFilesSchema,
    execute: async () => {
      try {
        console.log('📋 Listing files for game:', gameId);

        // Get all files ordered by execution order
        const files = await prisma.gameFile.findMany({
          where: { gameId },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            name: true,
            orderIndex: true,
            updatedAt: true,
          },
        });

        console.log('✅ Found', files.length, 'files');

        return {
          success: true,
          message: `Found ${files.length} files`,
          files: files.map(f => ({
            id: f.id,
            name: f.name,
            orderIndex: f.orderIndex,
            updatedAt: f.updatedAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error('❌ Failed to list files:', error);
        return { success: false, error: 'Failed to list files' };
      }
    },
  });
};

/**
 * Reorder files tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for reordering files
 */
export const reorderFilesTool = (gameId: string) => {
  return tool({
    description: 'Change the execution order of files. Pass an array of file IDs in the desired order.',
    inputSchema: reorderFilesSchema,
    execute: async ({ fileOrder }: ReorderFilesInput) => {
      try {
        console.log('🔄 Reordering files:', fileOrder);

        // Update each file's orderIndex based on position in array
        const files = await prisma.gameFile.findMany({
          where: {
            gameId,
            id: { in: fileOrder },
          },
          select: { id: true },
        });

        if (files.length !== fileOrder.length) {
          return { success: false, error: 'Some files were not found or access denied.' };
        }

        const updates = fileOrder.map((fileId, index) =>
          prisma.gameFile.update({
            where: { id: fileId },
            data: { orderIndex: index },
          })
        );

        await prisma.$transaction(updates);

        console.log('✅ Files reordered');

        return {
          success: true,
          message: `Reordered ${fileOrder.length} files`,
          fileOrder,
        };
      } catch (error) {
        console.error('❌ Failed to reorder files:', error);
        return { success: false, error: 'Failed to reorder files. Check that all file IDs exist.' };
      }
    },
  });
};

// =============================================================================
// PLANNING TOOLS
// =============================================================================

/**
 * Update plan tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for creating/updating game plan
 */
export const updatePlanTool = (gameId: string) => {
  return tool({
    description: 'Create or update the game plan. The plan is a markdown document describing features and files to create.',
    inputSchema: updatePlanSchema,
    execute: async ({ content, status = 'draft' }: UpdatePlanInput) => {
      try {
        console.log('📝 Updating game plan, status:', status);

        // Upsert plan (create if not exists, update if exists)
        const plan = await prisma.gamePlan.upsert({
          where: { gameId },
          update: {
            content,
            status,
            updatedAt: new Date(),
          },
          create: {
            gameId,
            content,
            status,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log('✅ Plan updated:', plan.id);

        return {
          success: true,
          message: `Plan ${plan.id ? 'updated' : 'created'} with status: ${status}`,
          planId: plan.id,
          status,
        };
      } catch (error) {
        console.error('❌ Failed to update plan:', error);
        return { success: false, error: 'Failed to update plan' };
      }
    },
  });
};

/**
 * Get plan tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for getting current game plan
 */
export const getPlanTool = (gameId: string) => {
  return tool({
    description: 'Get the current game plan.',
    inputSchema: getPlanSchema,
    execute: async () => {
      try {
        console.log('📖 Getting game plan');

        const plan = await prisma.gamePlan.findUnique({
          where: { gameId },
        });

        if (!plan) {
          return {
            success: true,
            message: 'No plan exists yet',
            plan: null,
          };
        }

        console.log('✅ Plan found:', plan.id);

        return {
          success: true,
          message: `Plan found with status: ${plan.status}`,
          plan: {
            id: plan.id,
            content: plan.content,
            status: plan.status,
            updatedAt: plan.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        console.error('❌ Failed to get plan:', error);
        return { success: false, error: 'Failed to get plan' };
      }
    },
  });
};

// =============================================================================
// EXPORT FACTORY FUNCTION
// =============================================================================

/**
 * Create all game tools for a given project
 *
 * @param gameId - Current game ID
 * @returns Record of game tools for AI SDK
 */
export function createGameTools(gameId: string) {
  return {
    // Scene management
    createScene: createSceneTool(gameId),
    switchScene: switchSceneTool(gameId),

    // Asset management
    placeAsset: placeAssetTool(gameId),
    listUserAssets: listUserAssetsTool(gameId),
    createAsset: createAssetTool(gameId),

    // File management (multi-file support)
    createFile: createFileTool(gameId),
    updateFile: updateFileTool(gameId),
    deleteFile: deleteFileTool(gameId),
    renameFile: renameFileTool(gameId),
    listFiles: listFilesTool(gameId),
    reorderFiles: reorderFilesTool(gameId),

    // Planning
    updatePlan: updatePlanTool(gameId),
    getPlan: getPlanTool(gameId),
  };
}
