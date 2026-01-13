/**
 * schemas-3d.ts - 3D-specific Zod schemas for AI SDK tools
 *
 * Defines validation schemas for 3D planning mode AI tools.
 * Kept separate from schemas.ts to maintain isolation between 2D and 3D codepaths.
 *
 * @see lib/types/3d-generation.ts for related TypeScript types
 */

import { z } from 'zod';

// =============================================================================
// Mesh Style Schema
// =============================================================================

/**
 * Visual style options for 3D mesh generation
 * Must match Mesh3DStyle type in types/3d-generation.ts
 */
export const meshStyleSchema = z.enum([
    'realistic',   // Photorealistic 3D models
    'stylized',    // Stylized/artistic 3D (games, animation)
    'low_poly',    // Low-polygon aesthetic (mobile games, retro)
    'voxel',       // Voxel-based models (Minecraft-style)
]);

// =============================================================================
// Texture Quality Schema
// =============================================================================

/**
 * Texture resolution/quality level options
 * Must match Texture3DQuality type in types/3d-generation.ts
 */
export const textureQualitySchema = z.enum([
    'draft',     // Quick preview quality (faster, less detail)
    'standard',  // Normal quality for most uses
    'high',      // Maximum detail (requires refine step, more credits)
]);

// =============================================================================
// Animation Preset Schema
// =============================================================================

/**
 * Available animation presets from Tripo3D
 * Must match AnimationPreset type in types/3d-generation.ts
 */
export const animationPresetSchema = z.enum([
    'preset:idle',   // Standing idle animation
    'preset:walk',   // Walking animation
    'preset:run',    // Running animation
    'preset:jump',   // Jumping animation
    'preset:climb',  // Climbing animation
    'preset:dive',   // Diving animation
]);

// =============================================================================
// AI SDK Tool Schemas
// =============================================================================

/**
 * Schema for updateQuality3D tool
 * Sets mesh style, texture quality, and default rigging preferences
 *
 * Unlike 2D which has art_style/resolution, 3D uses mesh_style/texture_quality
 */
export const updateQuality3DSchema = z.object({
    // Visual style of generated meshes (realistic, stylized, low_poly, voxel)
    meshStyle: meshStyleSchema.optional()
        .describe('Visual style of generated meshes'),

    // Texture resolution level (draft, standard, high)
    textureQuality: textureQualitySchema.optional()
        .describe('Texture resolution level'),

    // Default rigging preference for characters (true = auto-rig)
    defaultShouldRig: z.boolean().optional()
        .describe('Default rigging preference for characters'),

    // Default animations to apply to rigged characters
    defaultAnimations: z.array(animationPresetSchema).optional()
        .describe('Default animations to apply to rigged characters'),
});

export type UpdateQuality3DInput = z.infer<typeof updateQuality3DSchema>;

/**
 * Schema for updatePlan3D tool
 * Accepts markdown plan content with [RIG]/[STATIC] tags
 */
export const updatePlan3DSchema = z.object({
    // Full markdown content with [RIG]/[STATIC] asset tags
    planMarkdown: z.string().min(10)
        .describe('Full markdown content of 3D asset plan with [RIG]/[STATIC] tags'),
});

export type UpdatePlan3DInput = z.infer<typeof updatePlan3DSchema>;

/**
 * Schema for finalizePlan3D tool
 * Transitions to 3D generation phase (skips style anchor for 3D mode)
 */
export const finalizePlan3DSchema = z.object({});

export type FinalizePlan3DInput = z.infer<typeof finalizePlan3DSchema>;
