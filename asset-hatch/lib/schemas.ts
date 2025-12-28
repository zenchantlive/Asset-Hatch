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
export const updateStyleKeywordsSchema = z.object({
    styleKeywords: z.string().min(1).describe('Style keywords describing the art style (e.g., "16-bit pixel art, SNES RPG style")'),
});

export type UpdateStyleKeywordsInput = z.infer<typeof updateStyleKeywordsSchema>;

export const updateLightingKeywordsSchema = z.object({
    lightingKeywords: z.string().min(1).describe('Lighting keywords (e.g., "flat lighting, even illumination")'),
});

export type UpdateLightingKeywordsInput = z.infer<typeof updateLightingKeywordsSchema>;

export const updateColorPaletteSchema = z.object({
    colors: z.array(z.string()).min(1).describe('Array of HEX color codes (e.g., ["#2C3E50", "#E74C3C"])'),
});

export type UpdateColorPaletteInput = z.infer<typeof updateColorPaletteSchema>;

export const saveStyleAnchorSchema = z.object({
    confirm: z.boolean().describe('Confirmation to save the style anchor'),
});

export type SaveStyleAnchorInput = z.infer<typeof saveStyleAnchorSchema>;
