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
    mode: 'planning' | 'style'
}

export interface StudioPreset {
    id: string
    label: string
    prompt: string
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
        mode: 'planning',
    },
    {
        id: 'plan-rpg',
        label: 'RPG Adventure',
        prompt:
            'Help me plan assets for a top-down RPG. I need multiple playable character classes, NPCs for towns and quests, a variety of monsters and bosses, environmental tilesets for different biomes (forest, dungeon, castle), treasure chests and loot, spell effects, and a complete UI kit with inventory, dialog boxes, and menus.',
        mode: 'planning',
    },
    {
        id: 'plan-puzzle',
        label: 'Puzzle Game',
        prompt:
            "I'm making a casual puzzle game. Focus on clean UI elements like buttons, panels, and icons, tile-based game pieces with clear visual states (selected, matched, blocked), satisfying particle effects for matches and combos, and a minimal but polished aesthetic for broad appeal.",
        mode: 'planning',
    },
    {
        id: 'plan-farming',
        label: 'Farming Sim',
        prompt:
            "I want to create a cozy farming simulation game. Help me plan assets for crops at different growth stages, farm tools, animals with idle and eating animations, buildings like barns and homes, seasonal environment variations, villager NPCs, and UI elements for inventory and crafting systems.",
        mode: 'planning',
    },
    {
        id: 'plan-fresh',
        label: 'Start Fresh',
        prompt:
            "I'm not sure what I need yet. Ask me about my game concept, target platform, and visual preferences, then suggest a complete asset list organized by category. I want to understand what I should be thinking about.",
        mode: 'planning',
    },
]

// ---------------------------------------------------------------------------------------------------------------------------------------------
// 3D Mode Presets
// ---------------------------------------------------------------------------------------------------------------------------------------------

/**
 * 3D mode presets help users kickoff their 3D asset planning.
 * These presets are tailored for 3D model generation with rigging and animation support.
 */
export const PLAN_3D_PRESETS: PresetPrompt[] = [
    {
        id: '3d-character',
        label: '3D Character',
        prompt:
            'I need to create a 3D character model. Help me plan a complete rigged character including the base mesh with proper topology for animation, facial features and expressions, clothing/equipment that works with the rig, and specify which animations are needed (idle, walk, run, attack, etc.) using [RIG] tags for rigged elements and [STATIC] for accessories.',
        mode: 'planning',
    },
    {
        id: '3d-creature',
        label: 'Fantasy Creature',
        prompt:
            'I want to create a fantasy creature for my game. Help me plan a detailed creature model including the main body with appropriate anatomy, wings/fins/appendages if applicable, texturing with appropriate material types, and animations like idle, movement, and attack patterns. Use [RIG] for the main body and [STATIC] for props it might carry.',
        mode: 'planning',
    },
    {
        id: '3d-environment',
        label: '3D Environment',
        prompt:
            'Help me plan 3D environment assets for my game. I need structures like buildings and ruins, terrain elements like rocks and trees, props and interactive objects, and decorative elements. Specify which items should be rigged for animation (swaying trees, flowing water) vs static geometry.',
        mode: 'planning',
    },
    {
        id: '3d-vehicle',
        label: 'Vehicle',
        prompt:
            'I need to create a vehicle model for my game. Help me plan the vehicle including the main chassis and body work, wheels or treads with rotation rigging, cockpit/interior elements, and appropriate animations like idle, movement, and turning. Mark drivable parts with [RIG] and static details with [STATIC].',
        mode: 'planning',
    },
    {
        id: '3d-fresh',
        label: 'Describe My 3D Game',
        prompt:
            "I'm making a 3D game but I'm not sure what models I need. Ask me about my game concept, art style preferences (realistic, stylized, low-poly), and target platform. Help me plan a complete list of 3D assets organized by category, marking which should be rigged for animation and which can be static.",
        mode: 'planning',
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
// Studio Chat Presets
// -----------------------------------------------------------------------------

/**
 * Studio presets focus on quick fixes and common iteration requests.
 */
export const STUDIO_PRESETS: StudioPreset[] = [
    {
        id: 'studio-blank-screen',
        label: 'Fix blank screen',
        prompt:
            'The preview is blank. Diagnose what is missing (camera, light, scene setup) and update the code to render something visible.',
    },
    {
        id: 'studio-camera',
        label: 'Improve camera',
        prompt:
            'Update the camera to frame the scene properly, add smooth controls, and ensure the player or focal object is visible.',
    },
    {
        id: 'studio-controls',
        label: 'Add controls',
        prompt:
            'Add simple player controls (WASD or arrows) and make sure input feels responsive.',
    },
    {
        id: 'studio-physics',
        label: 'Fix physics',
        prompt:
            'Review the physics/collision setup and correct any issues with gravity, ground, or colliders.',
    },
    {
        id: 'studio-lighting',
        label: 'Improve lighting',
        prompt:
            'Improve lighting to make the scene readable and polished. Use balanced key/fill lights and soft shadows where possible.',
    },
    {
        id: 'studio-errors',
        label: 'Explain errors',
        prompt:
            'Summarize any preview errors, explain what caused them, and outline the fix before applying changes.',
    },
]

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Returns all presets for a given mode
 *
 * @param mode - The current interface mode ('planning' or 'style')
 * @param is3D - Whether the project is in 3D mode
 * @returns Array of PresetPrompt objects for that mode
 */
export function getPresetsForMode(mode: 'planning' | 'style', is3D: boolean = false): PresetPrompt[] {
    // Return the appropriate preset array based on mode and 3D status
    if (is3D && mode === 'planning') {
        return PLAN_3D_PRESETS
    }
    return mode === 'planning' ? PLAN_PRESETS : STYLE_PRESETS
}

export function getStudioPresets(): StudioPreset[] {
    return STUDIO_PRESETS
}

/**
 * Finds a preset by its ID across all preset arrays
 *
 * @param id - The preset ID to find
 * @returns The matching PresetPrompt or undefined if not found
 */
export function getPresetById(id: string): PresetPrompt | undefined {
    // Search all arrays for the matching ID
    return [...PLAN_PRESETS, ...PLAN_3D_PRESETS, ...STYLE_PRESETS].find((preset) => preset.id === id)
}

/**
 * Returns true if the preset ID is a 3D preset
 *
 * @param id - The preset ID to check
 * @returns True if the preset is a 3D preset
 */
export function is3DPreset(id: string): boolean {
    return PLAN_3D_PRESETS.some(preset => preset.id === id)
}
