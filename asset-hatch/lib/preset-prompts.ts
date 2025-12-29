/**
 * Preset Prompts Library
 *
 * This module defines preset conversation starters for the Plan and Style modes.
 * Each preset has a short label (shown in UI) and a detailed prompt (sent to AI).
 *
 * Plan Mode: Full kickoff prompts to help users describe their game concept
 * Style Mode: Editing-focused refinements since style inference already works
 */

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

/**
 * Represents a single preset prompt option
 *
 * @property id - Unique identifier for the preset
 * @property label - Short summary shown in the UI selector
 * @property prompt - Full detailed prompt sent to the AI
 * @property mode - Which mode this preset applies to ('plan' or 'style')
 */
export interface PresetPrompt {
    id: string
    label: string
    prompt: string
    mode: 'plan' | 'style'
}

// -----------------------------------------------------------------------------
// Plan Mode Presets
// -----------------------------------------------------------------------------

/**
 * Plan mode presets help users kickoff their game asset planning.
 * Labels are short and descriptive; prompts are detailed and actionable.
 */
export const PLAN_PRESETS: PresetPrompt[] = [
    {
        id: 'plan-platformer',
        label: '2D Platformer',
        prompt:
            'I want to create a 2D platformer game. Please help me plan a complete asset list including a player character with idle, run, and jump animations, environment tiles for platforms and backgrounds, collectible items, enemies with basic movement animations, and essential UI elements like health bars and score displays.',
        mode: 'plan',
    },
    {
        id: 'plan-rpg',
        label: 'RPG Adventure',
        prompt:
            'Help me plan assets for a top-down RPG. I need multiple playable character classes, NPCs for towns and quests, a variety of monsters and bosses, environmental tilesets for different biomes (forest, dungeon, castle), treasure chests and loot, spell effects, and a complete UI kit with inventory, dialog boxes, and menus.',
        mode: 'plan',
    },
    {
        id: 'plan-puzzle',
        label: 'Puzzle Game',
        prompt:
            "I'm making a casual puzzle game. Focus on clean UI elements like buttons, panels, and icons, tile-based game pieces with clear visual states (selected, matched, blocked), satisfying particle effects for matches and combos, and a minimal but polished aesthetic for broad appeal.",
        mode: 'plan',
    },
    {
        id: 'plan-farming',
        label: 'Farming Sim',
        prompt:
            "I want to create a cozy farming simulation game. Help me plan assets for crops at different growth stages, farm tools, animals with idle and eating animations, buildings like barns and homes, seasonal environment variations, villager NPCs, and UI elements for inventory and crafting systems.",
        mode: 'plan',
    },
    {
        id: 'plan-fresh',
        label: 'Start Fresh',
        prompt:
            "I'm not sure what I need yet. Ask me about my game concept, target platform, and visual preferences, then suggest a complete asset list organized by category. I want to understand what I should be thinking about.",
        mode: 'plan',
    },
]

// -----------------------------------------------------------------------------
// Style Mode Presets
// -----------------------------------------------------------------------------

/**
 * Style mode presets are editing-focused refinements.
 * The AI already infers style from conversation, so these help users
 * tweak and adjust the existing direction rather than starting fresh.
 */
export const STYLE_PRESETS: PresetPrompt[] = [
    {
        id: 'style-infer',
        label: 'Infer from plan',
        prompt:
            'Based on the asset plan we created, analyze the game genre, theme, and mood to automatically suggest an appropriate visual style with matching colors, lighting, and art direction.',
        mode: 'style',
    },
    {
        id: 'style-darker',
        label: 'Make it darker',
        prompt:
            'Adjust the current style to have a darker, moodier atmosphere. Reduce brightness, add deeper shadows, and shift the color palette toward cooler, more muted tones while keeping the core art style intact.',
        mode: 'style',
    },
    {
        id: 'style-vibrant',
        label: 'More vibrant',
        prompt:
            'Increase the vibrancy and saturation of the current color palette. Make the colors pop more while maintaining visual harmony. Think bright, energetic, and eye-catching.',
        mode: 'style',
    },
    {
        id: 'style-retro',
        label: 'Add retro feel',
        prompt:
            'Give the current style a retro pixel-art influence. Consider adding subtle dithering, limited color palettes reminiscent of 8-bit or 16-bit era, and that nostalgic CRT glow effect.',
        mode: 'style',
    },
    {
        id: 'style-cozy',
        label: 'Softer & cozy',
        prompt:
            'Make the style feel warmer and cozier. Use softer edges, warmer lighting, pastel-adjacent colors, and a gentle, inviting atmosphere suitable for casual or relaxing games.',
        mode: 'style',
    },
    {
        id: 'style-contrast',
        label: 'Sharper contrast',
        prompt:
            'Increase the contrast and definition. Make edges crisper, shadows deeper, and highlights brighter. Good for action-oriented or dramatic visual styles.',
        mode: 'style',
    },
    {
        id: 'style-minimal',
        label: 'More minimal',
        prompt:
            'Simplify the current style. Reduce visual complexity, use cleaner lines, flatter colors, and more whitespace. Think modern, clean, and uncluttered.',
        mode: 'style',
    },
]

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Returns all presets for a given mode
 *
 * @param mode - The current interface mode ('plan' or 'style')
 * @returns Array of PresetPrompt objects for that mode
 */
export function getPresetsForMode(mode: 'planning' | 'style'): PresetPrompt[] {
    // Return the appropriate preset array based on mode
    return mode === 'planning' ? PLAN_PRESETS : STYLE_PRESETS
}

/**
 * Finds a preset by its ID
 *
 * @param id - The preset ID to find
 * @returns The matching PresetPrompt or undefined if not found
 */
export function getPresetById(id: string): PresetPrompt | undefined {
    // Search both arrays for the matching ID
    return [...PLAN_PRESETS, ...STYLE_PRESETS].find((preset) => preset.id === id)
}
