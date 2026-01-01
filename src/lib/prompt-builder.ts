/**
 * Flux.2 Prompt Builder for Asset Hatch
 *
 * High-level interface for generating optimized Flux.2 prompts from
 * Asset Hatch project data (qualities, style anchor, asset specs).
 *
 * This is the main entry point used by the generation API route.
 */

import type { Project, StyleAnchor, CharacterRegistry } from './types';
import pluralize from 'pluralize';
import {
  type AssetType,
  type GamePerspective,
  type TemplateVariables,
  selectTemplate,
  getLightingKeywords,
  getPerspectiveKeywords,
  getConsistencyMarkers,
} from './prompt-templates';
// PHASE 11: Import export naming convention for directional assets
import { getDirectionPromptModifier, DIRECTION_EXPORT_NAMES } from './direction-utils';

/**
 * Parsed asset from entities.json plan
 */
export interface ParsedAsset {
  id: string;
  category: string; // "Characters", "Environments", etc.
  name: string; // "Farmer", "Grass Tileset", etc.
  type: AssetType; // Determines which template to use
  description: string; // User's description of the asset
  // Mobility classification for direction/animation awareness
  mobility: {
    // Asset movement type: static (no movement), moveable (directions), or animated (frames)
    type: 'static' | 'moveable' | 'animated';
    // Number of directions (4 or 8) for moveable assets
    directions?: 4 | 8;
    // Number of frames for animated assets
    frames?: number;
  };
  // Generation state for direction variants
  // USER DECISION: Using user-friendly direction names (Front/Back/Left/Right) instead of compass directions
  directionState?: {
    // Which directions have been generated
    generated: Set<'front' | 'back' | 'left' | 'right' | 'front-left' | 'front-right' | 'back-left' | 'back-right'>;

    // Parent-child relationship for directional variants
    // Links child directions (Back/Left/Right) to the parent asset (Front)
    parentAssetId?: string;

    // This asset's specific direction (e.g., 'front', 'back', 'left', 'right')
    direction?: 'front' | 'back' | 'left' | 'right' | 'front-left' | 'front-right' | 'back-left' | 'back-right';

    // True if this is the root asset (not a direction variant)
    isParent?: boolean;

    // Reference direction for consistency (typically 'front')
    referenceDirection?: 'front' | 'back' | 'left' | 'right';

    // Base64 of reference image (typically from the Front direction)
    // Used for maintaining visual consistency across all directional variants
    referenceImageBase64?: string;
  };
  variant: {
    id: string;
    name: string; // "Idle", "Walking", "4-direction", etc.
    pose?: string; // "idle standing pose", "walking pose mid-stride"
    animationType?: string; // "walk cycle", "idle breathing"
    frameCount?: number; // 4, 8, etc. (for sprite sheets)
    arrangementType?: string; // "horizontally in a single row"
    direction?: string; // "front", "left", "right", "back"
  };
}


/**
 * Build a complete Flux.2 optimized prompt for an asset
 *
 * @param asset - The parsed asset from the plan
 * @param project - The project with quality settings
 * @param styleAnchor - The style anchor reference (if exists)
 * @param characterRegistry - Character registry entry (if exists)
 * @returns Optimized Flux.2 prompt string
 */
export function buildAssetPrompt(
  asset: ParsedAsset,
  project: Project,
  styleAnchor?: StyleAnchor,
  characterRegistry?: CharacterRegistry
): string {
  // Determine if this is a character variant (for consistency markers)
  const isCharacterVariant = Boolean(
    characterRegistry && characterRegistry.poses_generated.length > 0
  );

  // Build template variables
  const vars: TemplateVariables = {
    // Core identifiers
    assetType: determineAssetTypeLabel(asset.type),
    subject: buildSubjectDescription(asset, project, characterRegistry),

    // Animation/state
    pose: asset.variant.pose,
    animationType: asset.variant.animationType,
    frameCount: asset.variant.frameCount,
    arrangementType: asset.variant.arrangementType,

    // Specifications
    resolution: project.base_resolution || '32x32',
    tileSize: asset.type === 'tileset' ? project.base_resolution : undefined,
    iconSize: asset.type === 'icon' ? project.base_resolution : undefined,

    // Style & appearance
    styleKeywords: buildStyleKeywords(project, styleAnchor),
    colorPalette: buildColorPalette(project, styleAnchor),
    lightingKeywords: getLightingKeywords(asset.type),
    viewDirection: buildViewDirection(asset, project),
    background: 'white background',

    // Asset-specific
    terrainType: asset.type === 'tileset' ? asset.name : undefined,
    viewAngle: asset.type === 'tileset' ? getPerspectiveKeywords(project.perspective as GamePerspective) : undefined,
    itemType: asset.type === 'icon' ? asset.name : undefined,
    visualDescription: asset.type === 'icon' ? asset.description : undefined,

    // Consistency
    consistencyMarkers: getConsistencyMarkers(
      Boolean(styleAnchor),
      characterRegistry?.name,
      isCharacterVariant,
      asset.type === 'sprite-sheet'
    ),
  };

  // PHASE 3: Direction-specific prompt enhancement
  // If this is a directional variant, override the view direction with direction-specific modifier
  if (asset.directionState?.direction) {
    const directionModifier = getDirectionPromptModifier(
      asset.directionState.direction
    );
    vars.viewDirection = directionModifier; // Override default view direction
    console.log(
      `🧭 Direction modifier applied: ${asset.directionState.direction} → "${directionModifier}"`
    );
  }

  // PHASE 3: Reference image consistency
  // If this direction variant has a reference image (from Front direction), add consistency markers
  if (asset.directionState?.referenceImageBase64) {
    vars.consistencyMarkers.push(
      'maintain exact same character design, colors, and proportions as the reference image',
      'same character appearance from different angle',
      'consistent visual style with reference'
    );
    console.log(
      `📸 Reference consistency markers added for ${asset.directionState.direction} direction`
    );
  }

  // Select appropriate template and build prompt
  const templateFn = selectTemplate(asset.type);
  return templateFn(vars);
}

/**
 * Determine the asset type label for the prompt
 */
function determineAssetTypeLabel(assetType: AssetType): string {
  switch (assetType) {
    case 'character-sprite':
      return 'pixel art sprite';
    case 'sprite-sheet':
      return 'sprite sheet';
    case 'tileset':
      return 'seamless tileset';
    case 'ui-element':
      return 'game UI element';
    case 'icon':
      return 'game icon';
    case 'background':
      return 'game background';
    default:
      return 'pixel art sprite';
  }
}

/**
 * Build subject description, incorporating character registry if available
 */
function buildSubjectDescription(
  asset: ParsedAsset,
  project: Project,
  characterRegistry?: CharacterRegistry
): string {
  // For characters with registry, use full base description
  if (characterRegistry) {
    return characterRegistry.base_description;
  }

  // Otherwise use asset description with any theme/mood context
  let subject = asset.description;

  // SAFETY NET: Extract first subject if multiple detected
  // This prevents multi-subject prompts like "robots, cats, dogs" from reaching Flux.2
  if (subject.includes(',') && subject.split(',').length > 2) {
    console.warn(`⚠️ Multi-subject detected in asset description: ${subject}`);
    subject = subject.split(',')[0].trim(); // Take first item only
    console.warn(`→ Using first subject only: ${subject}`);
  }

  // Remove markdown formatting (e.g., **bold**)
  subject = subject.replace(/\*\*/g, '').trim();

  // Remove category prefixes like "Survivors:" or "NPCs:"
  subject = subject.replace(/^[^:]+:\s*/, '').trim();

  // Add theme context if not already in description
  if (project.theme && !subject.toLowerCase().includes(project.theme.toLowerCase())) {
    subject = `${subject}, ${project.theme} theme`;
  }

  return subject;
}

/**
 * Build style keywords from project qualities and style anchor
 */
function buildStyleKeywords(project: Project, styleAnchor?: StyleAnchor): string {
  const keywords: string[] = [];

  // Use style anchor keywords if available
  if (styleAnchor?.style_keywords) {
    keywords.push(styleAnchor.style_keywords);
  } else {
    // Fallback to project qualities
    if (project.art_style) {
      keywords.push(project.art_style);
    }

    if (project.game_genre) {
      keywords.push(`${project.game_genre} game style`);
    }
  }

  return keywords.join(', ') || 'pixel art style';
}

/**
 * Build color palette specification with HEX codes
 */
function buildColorPalette(project: Project, styleAnchor?: StyleAnchor): string {
  // Use style anchor palette if available
  if (styleAnchor?.color_palette && styleAnchor.color_palette.length > 0) {
    const hexCodes = styleAnchor.color_palette.join(', ');
    return `limited color palette using ${hexCodes}`;
  }

  // Fallback to project color_palette quality param
  if (project.color_palette) {
    return `${project.color_palette} color palette`;
  }

  // Default fallback
  return 'limited 16-color palette';
}

/**
 * Build view direction from asset variant and project perspective
 */
function buildViewDirection(asset: ParsedAsset, project: Project): string {
  // If variant specifies direction (e.g., "4-direction" animation)
  if (asset.variant.direction) {
    return `${asset.variant.direction}-facing view`;
  }

  // Use project perspective
  const perspective = project.perspective as GamePerspective;
  if (perspective) {
    return getPerspectiveKeywords(perspective);
  }

  // Default fallback
  return 'front-facing view';
}

/**
 * Calculate generation size (2x for pixel-perfect downscaling)
 */
export function calculateGenerationSize(baseResolution: string): {
  width: number;
  height: number;
} {
  // Parse base resolution (e.g., "32x32", "64x64", "256x64")
  const match = baseResolution.match(/(\d+)x(\d+)/);
  if (!match) {
    throw new Error(`Invalid resolution format: ${baseResolution}`);
  }

  const [, widthStr, heightStr] = match;
  const baseWidth = parseInt(widthStr, 10);
  const baseHeight = parseInt(heightStr, 10);

  // Generate at 2x for pixel-perfect downscaling
  // (Per FLUX2_PROMPT_ENGINEERING.md recommendations)
  return {
    width: baseWidth * 2,
    height: baseHeight * 2,
  };
}

/**
 * Estimate generation cost based on model and resolution
 */
export interface ModelConfig {
  modelId: string;
  provider: 'openrouter';
  costPerImage: number; // USD
  speedRating: number; // 1-10
  qualityRating: number; // 1-10
  maxContextImages: number;
}

export const FLUX_MODELS: Record<string, ModelConfig> = {
  'black-forest-labs/flux.2-pro': {
    // Note: OpenRouter uses dot notation (flux.2-) not dash (flux-2-)
    modelId: 'black-forest-labs/flux.2-pro',  // No "dev" on OpenRouter, using pro for now
    provider: 'openrouter',
    costPerImage: 0.04,
    speedRating: 9,
    qualityRating: 7,
    maxContextImages: 8,
  },
};

/**
 * Estimate cost for batch generation
 */
export function estimateBatchCost(assetCount: number, modelKey: string = 'black-forest-labs/flux.2-pro'): number {
  const model = FLUX_MODELS[modelKey];
  if (!model) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  return assetCount * model.costPerImage;
}

// =============================================================================
// Semantic ID Generation (ADR-014: Single-Asset Strategy)
// =============================================================================

/**
 * Generate semantic ID for an asset
 * Converts category + name + variant into AI-consumable filename
 * 
 * Examples:
 * - category: "Characters", name: "Farmer", variant: "Idle" → "character_farmer_idle"
 * - category: "Furniture", name: "Wooden Chair" → "furniture_wooden_chair"
 * - category: "Terrain", name: "Grass Tileset" → "terrain_grass_tileset"
 * 
 * @param asset - Parsed asset from entities.json plan
 * @returns Semantic ID string (lowercase, underscores)
 */
export function generateSemanticId(asset: ParsedAsset): string {
  // Convert category to singular lowercase
  // "Characters" → "character", "Furniture" → "furniture"
  const category = pluralize.singular(asset.category)
    .toLowerCase()
    .replace(/\s+/g, '_'); // Replace spaces with underscores

  // Convert name to lowercase with underscores
  // "Wooden Chair" → "wooden_chair"
  const name = asset.name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, ''); // Remove special chars

  // Convert variant name if exists
  // "Idle" → "idle", "Walk Left" → "walk_left"
  const variant = asset.variant?.name
    ? asset.variant.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    : null;

  // PHASE 11: Add direction suffix for directional assets
  // Examples: "character_farmer_front", "character_farmer_back_left"
  const direction = asset.directionState?.direction
    ? DIRECTION_EXPORT_NAMES[asset.directionState.direction]
    : null;

  // Combine parts (direction takes precedence over variant for naming)
  if (direction) {
    return `${category}_${name}_${direction}`;
  } else if (variant) {
    return `${category}_${name}_${variant}`;
  } else {
    return `${category}_${name}`;
  }
}

/**
 * Generate category folder name for exports
 * Ensures consistent lowercase plural forms
 * 
 * Examples:
 * - "Characters" → "characters"
 * - "Furniture" → "furniture"
 * - "UI Elements" → "ui_elements"
 */
export function getCategoryFolder(category: string): string {
  return category
    .toLowerCase()
    .replace(/\s+/g, '_');
}


/**
 * Example usage:
 *
 * ```typescript
 * const asset: ParsedAsset = {
 *   id: 'farmer-idle',
 *   category: 'Characters',
 *   name: 'Farmer',
 *   type: 'character-sprite',
 *   description: 'farmer character with straw hat and overalls',
 *   variant: {
 *     id: 'idle-front',
 *     name: 'Idle',
 *     pose: 'idle standing pose',
 *     direction: 'front',
 *   },
 * };
 *
 * const prompt = buildAssetPrompt(asset, project, styleAnchor, characterRegistry);
 * // Output: "pixel art sprite of farmer character with straw hat and overalls,
 * // idle standing pose, 32x32 sprite, 16-bit pixel art Stardew Valley style,
 * // limited color palette using #2C3E50, #E74C3C, front-facing view,
 * // white background, consistent with style reference image, game-ready asset"
 * ```
 */
