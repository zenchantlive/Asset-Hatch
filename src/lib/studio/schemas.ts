/**
 * Hatch Studios Tool Schemas
 *
 * Defines Zod validation schemas for all game management tools.
 * These schemas are used by AI SDK tool() definitions to validate tool inputs.
 *
 * @see src/lib/studio/game-tools.ts for tool implementations
 * @see src/app/api/studio/chat/route.ts for tool usage
 */

import { z } from 'zod';

// =============================================================================
// SCENE MANAGEMENT TOOLS
// =============================================================================

/**
 * Schema for creating a new scene in a game
 */
export const createSceneSchema = z.object({
  name: z.string().min(1).describe('Name for the new scene'),
  orderIndex: z.number().int().default(0).describe('Order index in game (0 for first scene)'),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;

/**
 * Schema for switching to a different scene
 */
export const switchSceneSchema = z.object({
  sceneId: z.string().describe('ID of the scene to switch to'),
});

export type SwitchSceneInput = z.infer<typeof switchSceneSchema>;

// =============================================================================
// ASSET MANAGEMENT TOOLS
// =============================================================================

/**
 * Schema for placing an asset in a scene
 */
export const placeAssetSchema = z.object({
  assetId: z.string().describe('ID of the asset from Asset Hatch'),
  sceneId: z.string().describe('ID of the scene to place the asset in'),
  position: z.object({
    x: z.number().describe('X position'),
    y: z.number().describe('Y position'),
    z: z.number().describe('Z position'),
  }),
  rotation: z.object({
    x: z.number().describe('X rotation in degrees'),
    y: z.number().describe('Y rotation in degrees'),
    z: z.number().describe('Z rotation in degrees'),
  }),
  scale: z.object({
    x: z.number().default(1).describe('X scale factor'),
    y: z.number().default(1).describe('Y scale factor'),
    z: z.number().default(1).describe('Z scale factor'),
  }),
});

export type PlaceAssetInput = z.infer<typeof placeAssetSchema>;

// =============================================================================
// ASSET QUERY TOOLS
// =============================================================================

/**
 * Schema for listing user's assets from Asset Hatch
 */
export const listUserAssetsSchema = z.object({
  type: z.enum(['2d', '3d', 'all']).default('all').describe('Filter by asset type'),
  search: z.string().optional().describe('Search query for asset names'),
  limit: z.number().min(1).max(100).default(50).describe('Maximum number of assets to return'),
});

export type ListUserAssetsInput = z.infer<typeof listUserAssetsSchema>;

/**
 * Schema for creating a new asset via Asset Hatch
 */
export const createAssetSchema = z.object({
  type: z.enum(['2d', '3d']).describe('Type of asset to create'),
  name: z.string().min(1).describe('Name for the new asset'),
  description: z.string().min(10).describe('Description of the asset'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

// =============================================================================
// FILE MANAGEMENT TOOLS (Multi-file support)
// =============================================================================

/**
 * Schema for creating a new code file in the game
 * Files are executed in orderIndex order when rendering
 */
export const createFileSchema = z.object({
  name: z.string()
    .min(1)
    .regex(/^[a-zA-Z0-9_-]+\.js$/, 'Filename must end with .js and contain only alphanumeric, underscore, or hyphen')
    .describe('Filename (e.g., "main.js", "player.js", "enemies.js")'),
  content: z.string()
    .min(1)
    .describe('JavaScript/Babylon.js code content for this file'),
  orderIndex: z.number()
    .int()
    .min(0)
    .optional()
    .describe('Execution order (0 = first). If omitted, appends to end.'),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;

/**
 * Schema for updating an existing file's content
 */
export const updateFileSchema = z.object({
  name: z.string()
    .min(1)
    .describe('Name of the file to update (e.g., "player.js")'),
  content: z.string()
    .min(1)
    .describe('New JavaScript/Babylon.js code content'),
});

export type UpdateFileInput = z.infer<typeof updateFileSchema>;

/**
 * Schema for deleting a file from the game
 */
export const deleteFileSchema = z.object({
  name: z.string()
    .min(1)
    .describe('Name of the file to delete (e.g., "enemies.js")'),
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;

/**
 * Schema for listing all files in the game
 */
export const listFilesSchema = z.object({
  // No required parameters - lists all files
});

export type ListFilesInput = z.infer<typeof listFilesSchema>;

/**
 * Schema for reordering file execution order
 */
export const reorderFilesSchema = z.object({
  fileOrder: z.array(z.string())
    .min(1)
    .describe('Array of filenames in desired execution order'),
});

export type ReorderFilesInput = z.infer<typeof reorderFilesSchema>;

// =============================================================================
// PLANNING TOOLS
// =============================================================================

/**
 * Schema for creating/updating the game plan
 */
export const updatePlanSchema = z.object({
  content: z.string()
    .min(10)
    .describe('Markdown content for the game plan'),
  status: z.enum(['draft', 'accepted', 'rejected'])
    .optional()
    .describe('Plan status (default: draft)'),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

/**
 * Schema for getting the current plan
 */
export const getPlanSchema = z.object({
  // No required parameters
});

export type GetPlanInput = z.infer<typeof getPlanSchema>;
