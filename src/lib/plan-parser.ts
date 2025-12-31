/**
 * Plan Parser for Asset Hatch
 *
 * Parses the markdown plan (entities.json) into structured ParsedAsset[]
 * that can be used for prompt generation.
 *
 * Supports two generation modes:
 * - COMPOSITE (default): Multi-pose animations in one sprite sheet
 * - GRANULAR: Individual frames as separate images
 */

import type { ParsedAsset } from './prompt-builder';
import type { AssetType } from './prompt-templates';

export type GenerationMode = 'composite' | 'granular';

export interface PlanParserOptions {
  mode: GenerationMode;
  projectId: string;
}

interface ParsedLine {
  level: number; // 0 = category, 1 = asset, 2 = variant
  text: string;
  category?: string; // For level 1+
}

/**
 * Parse markdown plan into ParsedAsset[] array
 *
 * @param planMarkdown - The markdown content from entities.json
 * @param options - Parser options (mode, projectId)
 * @returns Array of parsed assets ready for generation
 */
export function parsePlan(
  planMarkdown: string,
  options: PlanParserOptions
): ParsedAsset[] {
  const lines = planMarkdown.split('\n').filter((line) => line.trim());
  const parsed: ParsedLine[] = [];
  let currentCategory = '';

  // First pass: Structure the content
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and title
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith('##'))) {
      continue;
    }

    // Category headers (## Characters)
    if (trimmed.startsWith('##')) {
      currentCategory = trimmed.replace(/^##\s*/, '').trim();
      parsed.push({
        level: 0,
        text: currentCategory,
      });
      continue;
    }

    // Determine level by indentation
    const indentMatch = line.match(/^(\s*)-/);
    if (indentMatch) {
      const indent = indentMatch[1].length;
      const text = trimmed.replace(/^-\s+/, '').trim();

      // 0 spaces = asset (level 1), >0 spaces = variant (level 2)
      const level = indent === 0 ? 1 : 2;

      parsed.push({
        level,
        text,
        category: currentCategory,
      });
    }
  }

  // Second pass: Build ParsedAsset[] from structure
  const assets: ParsedAsset[] = [];
  let currentAssetName = '';
  let currentAssetCategory = '';
  let assetCounter = 0;

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    if (item.level === 1) {
      // Main asset line
      currentAssetName = item.text;
      currentAssetCategory = item.category!;

      // If no variants follow, create single asset
      const nextItem = parsed[i + 1];
      if (!nextItem || nextItem.level !== 2) {
        const newAsset = createAsset({
          category: currentAssetCategory,
          name: currentAssetName,
          variantText: '', // No specific variant
          mode: options.mode,
          projectId: options.projectId,
          assetIndex: assetCounter++,
        });

        if (Array.isArray(newAsset)) {
          assets.push(...newAsset);
        } else {
          assets.push(newAsset);
        }
      }
    } else if (item.level === 2) {
      // Variant line
      const variantAssets = createAsset({
        category: currentAssetCategory,
        name: currentAssetName,
        variantText: item.text,
        mode: options.mode,
        projectId: options.projectId,
        assetIndex: assetCounter++,
      });

      // In granular mode, variants might expand to multiple assets
      if (Array.isArray(variantAssets)) {
        assets.push(...variantAssets);
      } else {
        assets.push(variantAssets);
      }
    }
  }

  return assets;
}

/**
 * Create ParsedAsset(s) from asset specification
 * Returns single asset in composite mode, multiple in granular mode
 */
function createAsset(spec: {
  category: string;
  name: string;
  variantText: string;
  mode: GenerationMode;
  projectId: string;
  assetIndex: number;
}): ParsedAsset | ParsedAsset[] {
  const { category, name, variantText, mode, projectId, assetIndex } = spec;

  // Determine asset type from category and name
  const assetType = determineAssetType(category, name);

  // Extract animation details from variant text
  const animationInfo = parseAnimationInfo(variantText);

  // Base asset properties
  const baseId = `${projectId}-asset-${assetIndex}`;
  const description = `${name.toLowerCase()}${variantText ? ` ${variantText.toLowerCase()}` : ''}`;

  // Check if this is a multi-directional animation
  if (animationInfo.isMultiDirection) {
    if (mode === 'composite') {
      // COMPOSITE: One sprite sheet with all directions
      return {
        id: baseId,
        category,
        name,
        type: 'sprite-sheet',
        description,
        variant: {
          id: `${baseId}-composite`,
          name: animationInfo.animationName || variantText || 'Default',
          pose: animationInfo.pose,
          animationType: animationInfo.animationType,
          frameCount: animationInfo.frameCount || animationInfo.directionCount,
          arrangementType: 'horizontally in a single row',
        },
      };
    } else {
      // GRANULAR: Individual assets for each direction
      const directions = ['front', 'left', 'right', 'back'];
      return directions.slice(0, animationInfo.directionCount).map((dir) => ({
        id: `${baseId}-${dir}`,
        category,
        name,
        type: 'character-sprite' as AssetType,
        description: `${description} ${dir} view`,
        variant: {
          id: `${baseId}-${dir}`,
          name: `${animationInfo.animationName || variantText} - ${capitalize(dir)}`,
          pose: `${animationInfo.pose} ${dir} view`,
          animationType: animationInfo.animationType,
          direction: dir,
        },
      }));
    }
  }

  // Single variant asset
  return {
    id: baseId,
    category,
    name,
    type: assetType,
    description,
    variant: {
      id: `${baseId}-variant`,
      name: variantText || 'Default',
      pose: animationInfo.pose,
      animationType: animationInfo.animationType,
      frameCount: animationInfo.frameCount,
    },
  };
}

/**
 * Determine asset type from category and name
 */
function determineAssetType(category: string, name: string): AssetType {
  const categoryLower = category.toLowerCase();
  const nameLower = name.toLowerCase();

  // Character detection
  if (categoryLower.includes('character')) {
    return 'character-sprite';
  }

  // Background detection
  if (
    nameLower.includes('background') ||
    nameLower.includes('sky') ||
    nameLower.includes('scene')
  ) {
    return 'background';
  }

  // Tileset detection
  if (
    nameLower.includes('tileset') ||
    nameLower.includes('terrain') ||
    nameLower.includes('grass') ||
    nameLower.includes('stone') ||
    nameLower.includes('water') ||
    categoryLower.includes('environment')
  ) {
    return 'tileset';
  }

  // Icon detection
  if (
    nameLower.includes('icon') ||
    categoryLower.includes('item') ||
    categoryLower.includes('prop')
  ) {
    return 'icon';
  }

  // UI element detection
  if (
    categoryLower.includes('ui') ||
    nameLower.includes('button') ||
    nameLower.includes('bar') ||
    nameLower.includes('panel')
  ) {
    return 'ui-element';
  }

  // Default fallback
  return 'character-sprite';
}

/**
 * Parse animation information from variant text
 * Examples: "Idle (4-direction)", "Walking (8-frame)", "Attack"
 */
function parseAnimationInfo(variantText: string): {
  isMultiDirection: boolean;
  directionCount: number;
  frameCount?: number;
  animationName: string;
  pose?: string;
  animationType?: string;
} {
  if (!variantText) {
    return {
      isMultiDirection: false,
      directionCount: 1,
      animationName: 'Default',
    };
  }

  // Extract direction count: "Idle (4-direction)" → 4
  const directionMatch = variantText.match(/\((\d+)-direction\)/i);
  const directionCount = directionMatch ? parseInt(directionMatch[1], 10) : 1;

  // Extract frame count: "Walk Cycle (8-frame)" → 8
  const frameMatch = variantText.match(/\((\d+)-frame\)/i);
  const frameCount = frameMatch ? parseInt(frameMatch[1], 10) : undefined;

  // Extract animation name: "Idle (4-direction)" → "Idle"
  const animationName = variantText
    .replace(/\([^)]+\)/g, '')
    .trim();

  // Determine pose and animation type from name
  const pose = determinePose(animationName);
  const animationType = determineAnimationType(animationName);

  return {
    isMultiDirection: directionCount > 1,
    directionCount,
    frameCount,
    animationName,
    pose,
    animationType,
  };
}

/**
 * Map animation name to pose description
 */
function determinePose(animationName: string): string | undefined {
  const nameLower = animationName.toLowerCase();

  if (nameLower.includes('idle')) {
    return 'idle standing pose';
  }
  if (nameLower.includes('walk')) {
    return 'walking pose mid-stride';
  }
  if (nameLower.includes('run')) {
    return 'running pose with motion';
  }
  if (nameLower.includes('attack')) {
    return 'attack pose with weapon raised';
  }
  if (nameLower.includes('jump')) {
    return 'jumping pose in mid-air';
  }
  if (nameLower.includes('crouch')) {
    return 'crouching pose low to ground';
  }

  return animationName.toLowerCase() + ' pose';
}

/**
 * Map animation name to animation type
 */
function determineAnimationType(animationName: string): string | undefined {
  const nameLower = animationName.toLowerCase();

  if (nameLower.includes('idle')) {
    return 'idle breathing animation';
  }
  if (nameLower.includes('walk')) {
    return 'walk cycle';
  }
  if (nameLower.includes('run')) {
    return 'run cycle';
  }
  if (nameLower.includes('attack')) {
    return 'attack sequence';
  }

  return undefined;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Example usage:
 *
 * ```typescript
 * const planMarkdown = `
 * # Asset Plan for My Game
 *
 * ## Characters
 * - Farmer
 *   - Idle (4-direction)
 *   - Walking (4-direction)
 * - Warrior
 *   - Attack (2-direction)
 *
 * ## Environments
 * - Grass Tileset
 * - Sky Background
 *
 * ## Items & Props
 * - Health Potion Icon
 * `;
 *
 * const assets = parsePlan(planMarkdown, {
 *   mode: 'composite',
 *   projectId: 'project-123',
 * });
 *
 * // Result in COMPOSITE mode:
 * // [
 * //   { name: "Farmer", variant: { name: "Idle", frameCount: 4, ... } },
 * //   { name: "Farmer", variant: { name: "Walking", frameCount: 4, ... } },
 * //   { name: "Warrior", variant: { name: "Attack", frameCount: 2, ... } },
 * //   { name: "Grass Tileset", type: "tileset", ... },
 * //   { name: "Sky Background", type: "background", ... },
 * //   { name: "Health Potion Icon", type: "icon", ... },
 * // ]
 *
 * // Result in GRANULAR mode (Farmer Idle expands to 4 assets):
 * // [
 * //   { name: "Farmer", variant: { name: "Idle - Front", direction: "front" } },
 * //   { name: "Farmer", variant: { name: "Idle - Left", direction: "left" } },
 * //   { name: "Farmer", variant: { name: "Idle - Right", direction: "right" } },
 * //   { name: "Farmer", variant: { name: "Idle - Back", direction: "back" } },
 * //   ...
 * // ]
 * ```
 */
