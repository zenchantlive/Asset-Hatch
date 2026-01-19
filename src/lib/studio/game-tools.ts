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
  setCameraSchema,
  enablePhysicsSchema,
  updateCodeSchema,
  addBehaviorSchema,
  addInteractionSchema,
  listUserAssetsSchema,
  createAssetSchema,
  createFileSchema,
  updateFileSchema,
  deleteFileSchema,
  listFilesSchema,
  reorderFilesSchema,
  updatePlanSchema,
  getPlanSchema,
  type CreateSceneInput,
  type SwitchSceneInput,
  type PlaceAssetInput,
  type SetCameraInput,
  type EnablePhysicsInput,
  type UpdateCodeInput,
  type AddBehaviorInput,
  type AddInteractionInput,
  type ListUserAssetsInput,
  type CreateAssetInput,
  type CreateFileInput,
  type UpdateFileInput,
  type DeleteFileInput,
  type ReorderFilesInput,
  type UpdatePlanInput,
} from '@/lib/studio/schemas';

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
            code: '', // Empty code initially
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
// SET CAMERA TOOL
// =============================================================================

/**
 * Configure camera tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for setting camera
 */
export const setCameraTool = (gameId: string) => {
  return tool({
    description: 'Configure the camera type and target for the game scene.',
    inputSchema: setCameraSchema,
    execute: async ({ type, target }: SetCameraInput) => {
      try {
        console.log('📷 Setting camera:', type, 'target:', target);

        // Get current active scene
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { scenes: true },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        const activeSceneId = game.activeSceneId;
        if (!activeSceneId) {
          return { success: false, error: 'No active scene' };
        }

        const scene = game.scenes.find(s => s.id === activeSceneId);
        if (!scene) {
          return { success: false, error: 'Active scene not found' };
        }

        // Update scene code to configure camera
        const cameraCode = generateCameraSetupCode(type, target);
        const newCode = `${cameraCode}\n\n${scene.code || ''}`;
        await prisma.gameScene.update({
          where: { id: activeSceneId },
          data: { code: newCode, updatedAt: new Date() },
        });

        console.log('✅ Camera set:', type);

        return {
          success: true,
          message: `Camera set to ${type}${target ? ` targeting ${target}` : ''}`,
          type,
          target,
        };
      } catch (error) {
        console.error('❌ Failed to set camera:', error);
        return { success: false, error: 'Failed to set camera' };
      }
    },
  });
};

// =============================================================================
// ENABLE PHYSICS TOOL
// =============================================================================

/**
 * Enable physics tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for enabling physics
 */
export const enablePhysicsTool = (gameId: string) => {
  return tool({
    description: 'Enable or configure physics for the game scene. Use Havok (recommended) or Cannon.js (fallback) physics engine.',
    inputSchema: enablePhysicsSchema,
    execute: async ({ engine, gravity }: EnablePhysicsInput) => {
      try {
        console.log('⚡ Enabling physics:', engine, 'gravity:', gravity);

        const game = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!game) {
          return { success: false, error: 'Game not found' };
        }

        const activeSceneId = game.activeSceneId;
        if (!activeSceneId) {
          return { success: false, error: 'No active scene' };
        }

        // Generate physics setup code
        const physicsCode = generatePhysicsSetupCode(engine, gravity);

        await prisma.gameScene.update({
          where: { id: activeSceneId },
          data: { code: physicsCode, updatedAt: new Date() },
        });

        console.log('✅ Physics enabled:', engine);

        return {
          success: true,
          message: `Physics enabled with ${engine} engine`,
          engine,
          gravity,
        };
      } catch (error) {
        console.error('❌ Failed to enable physics:', error);
        return { success: false, error: 'Failed to enable physics' };
      }
    },
  });
};

// =============================================================================
// UPDATE CODE TOOL
// =============================================================================

/**
 * Update scene code tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for updating code
 */
export const updateCodeTool = (gameId: string) => {
  return tool({
    description: 'Update the Babylon.js code for a specific scene.',
    inputSchema: updateCodeSchema,
    execute: async ({ sceneId, code }: UpdateCodeInput) => {
      try {
        console.log('💾 Updating code for scene:', sceneId);

        // Update scene code in database
        await prisma.gameScene.update({
          where: { id: sceneId },
          data: {
            code,
            updatedAt: new Date(),
          },
        });

        // Create code version record for history
        await prisma.codeVersion.create({
          data: {
            gameId,
            code,
            description: 'Code update via chat',
            trigger: 'updateCode',
            createdAt: new Date(),
          },
        });

        console.log('✅ Code updated for scene:', sceneId);

        return {
          success: true,
          message: `Updated code for scene ${sceneId}`,
          sceneId,
          code,
        };
      } catch (error) {
        console.error('❌ Failed to update code:', error);
        return { success: false, error: 'Failed to update code' };
      }
    },
  });
};

// =============================================================================
// ADD BEHAVIOR TOOL
// =============================================================================

/**
 * Add behavior tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for adding behaviors
 */
export const addBehaviorTool = (gameId: string) => {
  return tool({
    description: 'Add behavior (movement, AI patrol, chase, idle) to an asset in the scene.',
    inputSchema: addBehaviorSchema,
    execute: async ({ assetId, behaviorType, parameters }: AddBehaviorInput) => {
      try {
        console.log('🤖 Adding behavior:', behaviorType, 'to asset:', assetId);

        // For MVP, we'll inline behavior code into scene code
        // Full implementation would store behavior metadata separately

        const behaviorCode = generateBehaviorCode(behaviorType, parameters || {});

        // Persist behavior in the active scene
        const gameRecord = await prisma.game.findUnique({
          where: { id: gameId },
          select: { activeSceneId: true },
        });
        if (gameRecord?.activeSceneId) {
          const scene = await prisma.gameScene.findUnique({
            where: { id: gameRecord.activeSceneId },
            select: { code: true },
          });
          await prisma.gameScene.update({
            where: { id: gameRecord.activeSceneId },
            data: {
              code: (scene?.code || '') + '\n' + behaviorCode,
              updatedAt: new Date(),
            },
          });
        }

        console.log('✅ Behavior added:', behaviorType);

        return {
          success: true,
          message: `Added ${behaviorType} behavior to asset ${assetId}`,
          assetId,
          behaviorType,
          parameters,
          behaviorCode,
        };
      } catch (error) {
        console.error('❌ Failed to add behavior:', error);
        return { success: false, error: 'Failed to add behavior' };
      }
    },
  });
};

// =============================================================================
// ADD INTERACTION TOOL
// =============================================================================

/**
 * Add interaction tool
 *
 * @param gameId - Current game ID
 * @returns AI SDK tool for adding interactions
 */
export const addInteractionTool = (gameId: string) => {
  return tool({
    description: 'Add interaction triggers (click, proximity, collision) to an asset in the scene.',
    inputSchema: addInteractionSchema,
    execute: async ({ assetId, interactionType, parameters }: AddInteractionInput) => {
      try {
        console.log('🖱️ Adding interaction:', interactionType, 'to asset:', assetId);

        // For MVP, inline interaction code into scene
        const interactionCode = generateInteractionCode(interactionType, parameters || {});

        console.log('✅ Interaction added:', interactionType);

        return {
          success: true,
          message: `Added ${interactionType} interaction to asset ${assetId}`,
          assetId,
          interactionType,
          parameters,
          interactionCode,
        };
      } catch (error) {
        console.error('❌ Failed to add interaction:', error);
        return { success: false, error: 'Failed to add interaction' };
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
    execute: async ({ type, search, limit }: ListUserAssetsInput) => {
      try {
        console.log('📦 Listing assets:', type, 'search:', search, 'limit:', limit);

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
            error: 'Game is not linked to a project. Create a project first to access assets.' 
          };
        }

        console.log('🔗 Querying assets for projectId:', projectId);

        // Query assets from the linked project
        const assets3D = type === '3d' || type === 'all'
          ? await prisma.generated3DAsset.findMany({
              where: {
                projectId,
                approvalStatus: 'approved',
                // Optional search filter
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
          : [];

        // Also check for 2D assets
        const assets2D = type === '2d' || type === 'all'
          ? await prisma.generatedAsset.findMany({
              where: {
                projectId,
                approvalStatus: 'approved',
                // Optional search filter
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
          : [];

        // Combine and format assets
        const combinedAssets = [
          ...assets3D.map(asset => ({
            id: asset.id,
            name: asset.name || asset.assetId,
            type: '3d',
            glbUrl: asset.riggedModelUrl || asset.draftModelUrl,
            thumbnailUrl: asset.riggedModelUrl || asset.draftModelUrl,
            projectId: asset.projectId,
          })),
          ...assets2D.map(asset => ({
            id: asset.id,
            name: asset.name || asset.assetId,
            type: '2d',
            imageUrl: asset.imageUrl,
            thumbnailUrl: asset.thumbnailUrl,
            projectId: asset.projectId,
          })),
        ];

        // Apply limit after combining
        const limitedAssets = combinedAssets.slice(0, limit);

        return {
          success: true,
          message: `Found ${limitedAssets.length} assets (${assets3D.length} 3D, ${assets2D.length} 2D)`,
          assets: limitedAssets,
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
// CODE GENERATION HELPERS (INTERNAL)
// =============================================================================

/**
 * Generate camera setup code
 *
 * Creates Babylon.js camera setup code based on camera type.
 * Uses let declaration to allow camera reassignment in switch cases.
 */
function generateCameraSetupCode(type: string, target?: string): string {
  // Generate different camera setup based on type
  // Each case creates a fully configured camera
  const targetMesh = target ? `scene.getMeshByName('${target}')` : 'null';

  switch (type) {
    case 'UniversalCamera':
      return `
// Camera Setup: UniversalCamera${target ? ` targeting ${target}` : ''}
const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 10, -30), scene);
camera.attachControl(canvas, true);
camera.lockedTarget = ${targetMesh};`.trim();

    case 'FollowCamera':
      return `
// Camera Setup: FollowCamera${target ? ` targeting ${target}` : ''}
const camera = new BABYLON.FollowCamera('camera', new BABYLON.Vector3(0, 10, -10), scene);
camera.radius = 30;
camera.heightOffset = 10;
camera.rotationOffset = 180;
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 10;
camera.lockedTarget = ${targetMesh};
camera.attachControl(canvas, true);`.trim();

    case 'ArcRotateCamera':
    default:
      return `
// Camera Setup: ArcRotateCamera${target ? ` targeting ${target}` : ''}
const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 3, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.wheelPrecision = 50;
camera.minZ = 0.1;`.trim();
  }
}

/**
 * Generate physics setup code
 */
function generatePhysicsSetupCode(engine: string, gravity: { x: number; y: number; z: number }): string {
  const { x: gx, y: gy, z: gz } = gravity;
  const physicsCode = `
// Physics Setup: ${engine}
const gravity = new BABYLON.Vector3(${gx}, ${gy}, ${gz});

${engine === 'Havok' ? `
// Enable Havok physics (recommended)
const physicsPlugin = new BABYLON.HavokPlugin();
scene.enablePhysics(gravity, physicsPlugin);
` : `
// Enable Cannon.js physics (fallback)
var physicsPlugin = new BABYLON.CannonJSPlugin();
scene.enablePhysics(gravity, physicsPlugin);
`}

return physicsPlugin;`;

  return physicsCode.trim();
}

/**
 * Generate behavior code
 */
function generateBehaviorCode(behaviorType: string, parameters: Record<string, unknown>): string {
  const code = `// ${behaviorType} behavior for asset
${JSON.stringify(parameters, null, 2)}`;

  return code.trim();
}

/**
 * Generate interaction code
 */
function generateInteractionCode(interactionType: string, parameters: Record<string, unknown>): string {
  const code = `// ${interactionType} interaction
${JSON.stringify(parameters, null, 2)}`;

  return code.trim();
}

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
    execute: async ({ name, content }: UpdateFileInput) => {
      try {
        console.log('💾 Updating file:', name);

        // Update file in database
        const file = await prisma.gameFile.update({
          where: {
            gameId_name: { gameId, name },
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
            fileName: name,
            code: content,
            description: `Updated file: ${name}`,
            trigger: 'updateFile',
            createdAt: new Date(),
          },
        });

        console.log('✅ File updated:', file.id);

        return {
          success: true,
          message: `Updated file "${name}"`,
          fileId: file.id,
          name,
          content,
        };
      } catch (error) {
        console.error('❌ Failed to update file:', error);
        return { success: false, error: `File "${name}" not found or update failed` };
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
    execute: async ({ name }: DeleteFileInput) => {
      try {
        console.log('🗑️ Deleting file:', name);

        // Delete file from database
        await prisma.gameFile.delete({
          where: {
            gameId_name: { gameId, name },
          },
        });

        console.log('✅ File deleted:', name);

        return {
          success: true,
          message: `Deleted file "${name}"`,
          name,
        };
      } catch (error) {
        console.error('❌ Failed to delete file:', error);
        return { success: false, error: `File "${name}" not found or delete failed` };
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
    description: 'Change the execution order of files. Pass an array of filenames in the desired order.',
    inputSchema: reorderFilesSchema,
    execute: async ({ fileOrder }: ReorderFilesInput) => {
      try {
        console.log('🔄 Reordering files:', fileOrder);

        // Update each file's orderIndex based on position in array
        const updates = fileOrder.map((name, index) =>
          prisma.gameFile.update({
            where: { gameId_name: { gameId, name } },
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
        return { success: false, error: 'Failed to reorder files. Check that all filenames exist.' };
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

    // Camera & Physics
    setCamera: setCameraTool(gameId),
    enablePhysics: enablePhysicsTool(gameId),

    // Legacy single-file code (deprecated, use file tools)
    updateCode: updateCodeTool(gameId),

    // Behavior & Interaction
    addBehavior: addBehaviorTool(gameId),
    addInteraction: addInteractionTool(gameId),

    // File management (multi-file support)
    createFile: createFileTool(gameId),
    updateFile: updateFileTool(gameId),
    deleteFile: deleteFileTool(gameId),
    listFiles: listFilesTool(gameId),
    reorderFiles: reorderFilesTool(gameId),

    // Planning
    updatePlan: updatePlanTool(gameId),
    getPlan: getPlanTool(gameId),
  };
}
