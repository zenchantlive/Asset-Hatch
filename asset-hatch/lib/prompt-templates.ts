/**
 * Flux.2 Prompt Templates for Asset Hatch
 *
 * Asset-type-specific prompt templates optimized for Flux.2 Dev/Pro models.
 * Based on FLUX2_PROMPT_ENGINEERING.md guidelines.
 *
 * Template structure follows priority order:
 * 1. Asset type + subject (HIGHEST PRIORITY - first 5 words carry most weight)
 * 2. Pose/action/state
 * 3. Resolution specification
 * 4. Style keywords
 * 5. Color palette
 * 6. View/perspective
 * 7. Lighting keywords
 * 8. Background specification
 * 9. Consistency markers
 * 10. Game-ready marker
 */

export type AssetType =
  | 'character-sprite'
  | 'sprite-sheet'
  | 'tileset'
  | 'ui-element'
  | 'icon'
  | 'background';

export type GamePerspective = 'top-down' | 'side-view' | 'isometric' | 'front-facing';

export interface TemplateVariables {
  // Core identifiers
  assetType: string; // "pixel art sprite", "sprite sheet", etc.
  subject: string; // "farmer character with straw hat", "grass ground tiles", etc.

  // Animation/state
  pose?: string; // "idle standing pose", "walking pose mid-stride"
  animationType?: string; // "walk cycle", "attack sequence", "idle breathing"
  frameCount?: number; // 4, 8, etc.
  arrangementType?: string; // "horizontally in a single row", "in a 2x4 grid"

  // Specifications
  resolution: string; // "32x32", "64x64"
  tileSize?: string; // "32x32" (for tilesets)
  iconSize?: string; // "16x16", "32x32"

  // Style & appearance
  styleKeywords: string; // "16-bit pixel art, Stardew Valley style"
  colorPalette: string; // "limited 16-color palette using #2C3E50, #E74C3C"
  lightingKeywords: string; // "flat lighting, even illumination"
  viewDirection: string; // "front-facing view", "side view"
  background: string; // "white background", "transparent background"

  // UI-specific
  shape?: string; // "rounded rectangle", "circular"
  text?: string; // "PLAY", "START"
  fontStyle?: string; // "bold white sans-serif"
  colorSpec?: string; // "gradient from bright blue #00D9FF to darker blue #0066CC"

  // Tileset-specific
  terrainType?: string; // "grass ground", "forest ground", "water"
  viewAngle?: string; // "top-down view", "side-view perspective"

  // Item/Icon-specific
  itemType?: string; // "healing potion", "sword", "spell"
  visualDescription?: string; // "red potion bottle with golden cork"

  // Consistency
  consistencyMarkers: string[]; // ["consistent with style reference image", "matching the established farmer character"]
  characterName?: string; // For character-specific consistency
}

/**
 * TEMPLATE: Character Sprite (Single Pose)
 *
 * Example output:
 * "pixel art sprite of farmer character with straw hat, idle standing pose,
 * 32x32 sprite, Stardew Valley 16-bit style, limited 16-color palette,
 * front-facing view, white background, consistent with style reference image, game-ready asset"
 */
export function buildCharacterSpritePrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type + subject (HIGHEST PRIORITY)
    `${vars.assetType} of ${vars.subject}`,

    // 2. Pose/action
    vars.pose,

    // 3. Resolution
    `${vars.resolution} sprite`,

    // 4. Style keywords
    vars.styleKeywords,

    // 5. Color palette
    vars.colorPalette,

    // 6. View/perspective
    vars.viewDirection,

    // 7. Lighting (implicit in style keywords for sprites)

    // 8. Background
    vars.background,

    // 9. Consistency markers
    ...vars.consistencyMarkers,

    // 10. Game-ready marker
    'game-ready asset',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * TEMPLATE: Sprite Sheet (Animation Frames)
 *
 * Example output:
 * "sprite sheet of farmer character with straw hat, 8 frames arranged horizontally,
 * walk cycle animation, 32x32 per frame, consistent proportions throughout,
 * evenly spaced and aligned, 16-bit pixel art, side view, white background, game-ready asset"
 */
export function buildSpriteSheetPrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type + subject
    `sprite sheet of ${vars.subject}`,

    // 2. Frame specification
    vars.frameCount ? `${vars.frameCount} frames arranged ${vars.arrangementType}` : undefined,

    // 3. Animation type
    vars.animationType ? `${vars.animationType} animation` : undefined,
    'showing sequential poses',

    // 4. Resolution per frame
    `${vars.resolution} per frame`,

    // 5. Frame consistency markers (CRITICAL for sprite sheets)
    'consistent proportions throughout',
    'evenly spaced and aligned',
    'uniform grid alignment',
    'same character design across all frames',

    // 6. Style keywords
    vars.styleKeywords,

    // 7. Color palette
    vars.colorPalette,

    // 8. View direction
    vars.viewDirection,

    // 9. Lighting
    vars.lightingKeywords,

    // 10. Background
    vars.background,

    // 11. Consistency markers
    ...vars.consistencyMarkers,

    // 12. Game-ready marker
    'game-ready asset',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * TEMPLATE: Tileset (Seamless Terrain)
 *
 * Example output:
 * "seamless tileset of grass ground tiles with dirt edges, 32x32 tile size,
 * top-down view, includes edge pieces and corner variations, nature colors,
 * consistent top-down lighting, tileable pattern, game-ready asset"
 */
export function buildTilesetPrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type + subject (with "seamless" keyword)
    `seamless tileset of ${vars.terrainType || vars.subject}`,

    // 2. Tile size
    `${vars.tileSize || vars.resolution} tile size`,

    // 3. View angle
    vars.viewAngle || vars.viewDirection,

    // 4. Edge/corner specification (CRITICAL for tilesets)
    'includes edge pieces and corner variations',
    'transition tiles',

    // 5. Color palette
    vars.colorPalette,

    // 6. Style keywords
    vars.styleKeywords,

    // 7. Lighting
    vars.lightingKeywords,

    // 8. Seamless markers (CRITICAL)
    'tileable pattern',
    'edge-matching',

    // 9. Consistency markers
    ...vars.consistencyMarkers,

    // 10. Game-ready marker
    'game-ready asset',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * TEMPLATE: UI Element (Buttons, Bars, Panels)
 *
 * Example output:
 * "game UI button element, rounded rectangle, gradient from bright blue #00D9FF to darker blue #0066CC,
 * 'PLAY' in bold white sans-serif font, 256x64 pixels, clean sharp edges,
 * centered on white background, game HUD style, production-ready asset"
 */
export function buildUIElementPrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type
    `game UI ${vars.subject}`,

    // 2. Shape
    vars.shape,

    // 3. Color specification
    vars.colorSpec || vars.colorPalette,

    // 4. Text (if applicable)
    vars.text ? `'${vars.text}' in ${vars.fontStyle}` : undefined,

    // 5. Size
    vars.resolution,

    // 6. UI-specific keywords
    'clean sharp edges',

    // 7. Background
    `centered on ${vars.background}`,

    // 8. Style
    'game HUD style',

    // 9. Consistency markers
    ...vars.consistencyMarkers,

    // 10. Ready marker
    'production-ready asset',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * TEMPLATE: Icon (Inventory, Skills, Status)
 *
 * Example output:
 * "healing potion inventory icon, red potion bottle with golden cork and glowing liquid,
 * stylized fantasy RPG icon style, colors #FF3333 and #FFD700, clean black outline,
 * centered on white background, 32x32 pixel size, game asset style, production-ready"
 */
export function buildIconPrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type + item type
    `${vars.itemType || vars.subject} inventory icon`,

    // 2. Visual description
    vars.visualDescription,

    // 3. Style keywords
    vars.styleKeywords,

    // 4. Color palette
    vars.colorPalette,

    // 5. Icon-specific keywords
    'clean outline',
    'crisp edges',

    // 6. Background
    `centered on ${vars.background}`,

    // 7. Size
    `${vars.iconSize || vars.resolution} pixel size`,

    // 8. Style marker
    'game asset style',

    // 9. Consistency markers
    ...vars.consistencyMarkers,

    // 10. Ready marker
    'production-ready',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * TEMPLATE: Background/Environment
 *
 * Example output:
 * "game background scene, forest clearing with tall trees, atmospheric lighting,
 * soft shadows, 512x512 resolution, 16-bit RPG style, nature color palette,
 * production-ready asset"
 */
export function buildBackgroundPrompt(vars: TemplateVariables): string {
  const parts = [
    // 1. Asset type + subject
    `game background scene, ${vars.subject}`,

    // 2. Lighting (important for backgrounds)
    vars.lightingKeywords,

    // 3. Resolution
    vars.resolution,

    // 4. Style keywords
    vars.styleKeywords,

    // 5. Color palette
    vars.colorPalette,

    // 6. Consistency markers
    ...vars.consistencyMarkers,

    // 7. Ready marker
    'production-ready asset',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * Lighting keywords by asset type
 * Based on FLUX2_PROMPT_ENGINEERING.md recommendations
 */
export const LIGHTING_KEYWORDS: Record<AssetType, string> = {
  'character-sprite': 'flat lighting, even illumination, minimal shadows',
  'sprite-sheet': 'flat lighting, even illumination, minimal shadows',
  'ui-element': 'uniform lighting, no shadows, clean bright',
  'icon': 'soft diffused light, studio lighting',
  'background': 'atmospheric lighting, ambient light, soft shadows',
  'tileset': 'consistent top-down lighting, even illumination',
};

/**
 * Perspective keywords by game type
 * Based on FLUX2_PROMPT_ENGINEERING.md recommendations
 */
export const PERSPECTIVE_KEYWORDS: Record<GamePerspective, string> = {
  'top-down': 'top-down view, bird\'s-eye perspective, overhead angle, RPG world view',
  'side-view': 'side view, profile perspective, 2D side-scroller style, platformer view',
  'isometric': 'isometric view, 2.5D perspective, 2:1 ratio isometric, strategy game view',
  'front-facing': 'front view, facing toward camera, straight-on perspective',
};

/**
 * Get lighting keywords for asset type
 */
export function getLightingKeywords(assetType: AssetType): string {
  return LIGHTING_KEYWORDS[assetType] || 'even lighting';
}

/**
 * Get perspective keywords for game perspective
 */
export function getPerspectiveKeywords(perspective: GamePerspective): string {
  return PERSPECTIVE_KEYWORDS[perspective] || 'side view';
}

/**
 * Get consistency markers based on context
 */
export function getConsistencyMarkers(
  hasStyleAnchor: boolean,
  characterName?: string,
  isCharacterVariant: boolean = false,
  isSpriteSheet: boolean = false
): string[] {
  const markers: string[] = [];

  // Always reference style anchor if available
  if (hasStyleAnchor) {
    markers.push('consistent with style reference image');
  }

  // Reference established character if this is a variant
  if (isCharacterVariant && characterName) {
    markers.push(`matching the established ${characterName} character design`);
  }

  // Frame consistency for sprite sheets
  if (isSpriteSheet) {
    markers.push('matching lighting in each frame');
  }

  return markers;
}

/**
 * Select the appropriate template function based on asset type
 */
export function selectTemplate(assetType: AssetType): (vars: TemplateVariables) => string {
  switch (assetType) {
    case 'character-sprite':
      return buildCharacterSpritePrompt;
    case 'sprite-sheet':
      return buildSpriteSheetPrompt;
    case 'tileset':
      return buildTilesetPrompt;
    case 'ui-element':
      return buildUIElementPrompt;
    case 'icon':
      return buildIconPrompt;
    case 'background':
      return buildBackgroundPrompt;
    default:
      return buildCharacterSpritePrompt; // Default fallback
  }
}
