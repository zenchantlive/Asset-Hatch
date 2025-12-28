import { z } from 'zod';

export const updateQualitySchema = z.object({
    qualityKey: z.enum([
        'art_style',
        'base_resolution',
        'perspective',
        'game_genre',
        'theme',
        'mood',
        'color_palette'
    ]).describe('The specific parameter to update'),
    value: z.string().min(1).describe('The value to set (e.g., "Pixel Art", "Platformer")'),
});

export type UpdateQualityInput = z.infer<typeof updateQualitySchema>;

export const updatePlanSchema = z.object({
    planMarkdown: z.string().min(10).describe('The full markdown content of the plan'),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export const finalizePlanSchema = z.object({});

export type FinalizePlanInput = z.infer<typeof finalizePlanSchema>;

// Style Phase Schemas

/**
 * Update the style draft with collected parameters.
 * Called incrementally as the AI collects style preferences via chat.
 */
export const updateStyleDraftSchema = z.object({
    styleKeywords: z.string().optional().describe('Style keywords (e.g., "16-bit pixel art, SNES RPG style")'),
    lightingKeywords: z.string().optional().describe('Lighting keywords (e.g., "flat lighting, even illumination")'),
    colorPalette: z.array(z.string()).optional().describe('Array of HEX color codes (e.g., ["#2C3E50", "#E74C3C"])'),
    fluxModel: z.enum(['flux-2-dev', 'flux-2-pro']).optional().describe('Flux model to use for generation'),
});

export type UpdateStyleDraftInput = z.infer<typeof updateStyleDraftSchema>;

/**
 * Generate the style anchor reference image.
 * Called when user approves the style draft and wants to generate the reference image.
 */
export const generateStyleAnchorSchema = z.object({
    prompt: z.string().min(10).describe('Detailed prompt for generating the style reference image'),
});

export type GenerateStyleAnchorInput = z.infer<typeof generateStyleAnchorSchema>;

/**
 * Finalize style phase and transition to generation.
 * Called when user approves the generated style anchor image.
 */
export const finalizeStyleSchema = z.object({});

export type FinalizeStyleInput = z.infer<typeof finalizeStyleSchema>;

// Legacy schemas for backward compatibility (can be removed later)
export const updateStyleKeywordsSchema = z.object({
    styleKeywords: z.string().min(1).describe('Style keywords describing the art style'),
});

export type UpdateStyleKeywordsInput = z.infer<typeof updateStyleKeywordsSchema>;

export const updateLightingKeywordsSchema = z.object({
    lightingKeywords: z.string().min(1).describe('Lighting keywords'),
});

export type UpdateLightingKeywordsInput = z.infer<typeof updateLightingKeywordsSchema>;

export const updateColorPaletteSchema = z.object({
    colors: z.array(z.string()).min(1).describe('Array of HEX color codes'),
});

export type UpdateColorPaletteInput = z.infer<typeof updateColorPaletteSchema>;

export const saveStyleAnchorSchema = z.object({
    confirm: z.boolean().describe('Confirmation to save the style anchor'),
});

export type SaveStyleAnchorInput = z.infer<typeof saveStyleAnchorSchema>;

