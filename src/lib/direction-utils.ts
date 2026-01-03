/**
 * Direction Utilities for Asset Hatch
 *
 * Handles expansion of moveable assets into directional variants,
 * prompt modifiers for each direction, and export naming conventions.
 *
 * USER DECISION: Using user-friendly direction names (Front/Back/Left/Right)
 * instead of compass directions (North/South/East/West) for better UX.
 */

import type { ParsedAsset } from './prompt-builder';
import { v4 as uuidv4 } from 'uuid';

/**
 * Direction type - user-friendly names for game asset directions
 * Supports both 4-way (cardinal) and 8-way (cardinal + diagonal) movement
 */
export type Direction =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'front-left'
  | 'front-right'
  | 'back-left'
  | 'back-right';

/**
 * User-facing labels for directions (displayed in UI)
 */
export const DIRECTION_LABELS: Record<Direction, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
  'front-left': 'Front-Left',
  'front-right': 'Front-Right',
  'back-left': 'Back-Left',
  'back-right': 'Back-Right',
};

/**
 * Export filename suffixes for sprite sheets
 * USER DECISION: Use snake_case for consistency with project export standards
 */
export const DIRECTION_EXPORT_NAMES: Record<Direction, string> = {
  front: 'front',
  back: 'back',
  left: 'left',
  right: 'right',
  'front-left': 'front_left',
  'front-right': 'front_right',
  'back-left': 'back_left',
  'back-right': 'back_right',
};

/**
 * Expand a single moveable asset into directional variants
 *
 * Creates separate ParsedAsset entries for each direction, linked via parentAssetId.
 * This enables individual approval, cost tracking, and prompt customization per direction.
 *
 * @param parentAsset - The root asset to expand (e.g., "Farmer")
 * @param directionCount - Number of directions to create (4 or 8)
 * @returns Array of ParsedAsset entries, one per direction
 *
 * @example
 * const farmer = { id: 'abc', name: 'Farmer', mobility: { type: 'moveable', directions: 4 }, ... };
 * const variants = expandAssetToDirections(farmer, 4);
 * // Returns: [Farmer (Front), Farmer (Back), Farmer (Left), Farmer (Right)]
 */
export function expandAssetToDirections(
  parentAsset: ParsedAsset,
  directionCount: 4 | 8 = 4
): ParsedAsset[] {
  // Cardinal directions (4-way movement)
  const cardinalDirections: Direction[] = ['front', 'back', 'left', 'right'];

  // Diagonal directions (additional for 8-way movement)
  const diagonalDirections: Direction[] = [
    'front-left',
    'front-right',
    'back-left',
    'back-right',
  ];

  // Select directions based on count
  const directions: Direction[] =
    directionCount === 4
      ? cardinalDirections
      : [...cardinalDirections, ...diagonalDirections];

  // Create a child asset for each direction
  return directions.map((direction) => ({
    ...parentAsset,
    id: uuidv4(), // New unique ID for each direction variant
    name: `${parentAsset.name} (${DIRECTION_LABELS[direction]})`, // e.g., "Farmer (Front)"
    variant: {
      ...parentAsset.variant,
      direction, // Set the variant direction
    },
    directionState: {
      generated: new Set(), // No directions generated yet for this variant
      parentAssetId: parentAsset.id, // Link back to parent
      direction, // This asset's specific direction
      isParent: false, // This is a child variant, not the parent
    },
  }));
}

/**
 * Get direction-specific prompt modifier
 *
 * Returns a detailed prompt fragment that describes the viewing angle
 * for the given direction. Used to ensure consistent directional variants.
 *
 * @param direction - The direction to get a modifier for
 * @returns Prompt text describing the viewing angle
 *
 * @example
 * getDirectionPromptModifier('front')
 * // Returns: "front-facing view, looking toward viewer"
 */
export function getDirectionPromptModifier(direction: Direction): string {
  const modifiers: Record<Direction, string> = {
    front: 'front-facing view, looking toward viewer',
    back: 'back-facing view, looking away from viewer',
    left: 'left-side view, facing left',
    right: 'right-side view, facing right',
    'front-left': 'front-left diagonal view',
    'front-right': 'front-right diagonal view',
    'back-left': 'back-left diagonal view',
    'back-right': 'back-right diagonal view',
  };

  return modifiers[direction];
}

/**
 * Check if an asset is the reference direction (Front)
 *
 * The Front direction is always generated first and serves as the visual
 * reference for all other directional variants to ensure consistency.
 *
 * @param asset - The asset to check
 * @returns true if this is the Front direction variant
 */
export function isReferenceDirection(asset: ParsedAsset): boolean {
  return asset.directionState?.direction === 'front';
}

/**
 * Get all sibling directional assets
 *
 * Finds all direction variants that share the same parent asset.
 * Used for reference propagation and batch operations.
 *
 * @param asset - The asset to find siblings for
 * @param allAssets - Complete array of all assets in the project
 * @returns Array of sibling direction variants (excluding the input asset)
 *
 * @example
 * const farmerFront = { id: 'front-1', directionState: { parentAssetId: 'abc', direction: 'front' } };
 * const allAssets = [farmerFront, farmerBack, farmerLeft, farmerRight];
 * const siblings = getDirectionalSiblings(farmerFront, allAssets);
 * // Returns: [farmerBack, farmerLeft, farmerRight]
 */
export function getDirectionalSiblings(
  asset: ParsedAsset,
  allAssets: ParsedAsset[]
): ParsedAsset[] {
  // If this asset has no parent, it has no siblings
  if (!asset.directionState?.parentAssetId) {
    return [];
  }

  const parentId = asset.directionState.parentAssetId;

  // Find all assets with the same parent (excluding this asset)
  return allAssets.filter(
    (a) =>
      a.directionState?.parentAssetId === parentId && a.id !== asset.id
  );
}

/**
 * Get the parent asset for a direction variant
 *
 * @param asset - The direction variant asset
 * @param allAssets - Complete array of all assets in the project
 * @returns The parent asset, or null if not found or not a variant
 */
export function getParentAsset(
  asset: ParsedAsset,
  allAssets: ParsedAsset[]
): ParsedAsset | null {
  if (!asset.directionState?.parentAssetId) {
    return null;
  }

  return (
    allAssets.find((a) => a.id === asset.directionState?.parentAssetId) || null
  );
}

/**
 * Check if an asset is a direction variant (child)
 *
 * @param asset - The asset to check
 * @returns true if this asset is a direction variant of a parent asset
 */
export function isDirectionVariant(asset: ParsedAsset): boolean {
  return !!asset.directionState?.parentAssetId;
}

/**
 * Generate export filename for a directional asset
 *
 * USER DECISION: Export naming follows project standards with snake_case.
 * Format: {asset_name}_{direction}.png
 *
 * @param asset - The asset to generate a filename for
 * @returns Filename string (e.g., "farmer_front.png")
 *
 * @example
 * getDirectionalAssetFilename({ name: 'Farmer', directionState: { direction: 'front' } })
 * // Returns: "farmer_front.png"
 */
export function getDirectionalAssetFilename(asset: ParsedAsset): string {
  // Convert asset name to snake_case
  const baseName = asset.name.toLowerCase().replace(/\s+/g, '_');

  // Add direction suffix if this is a directional variant
  if (asset.directionState?.direction) {
    const dirSuffix = DIRECTION_EXPORT_NAMES[asset.directionState.direction];
    return `${baseName}_${dirSuffix}.png`;
  }

  // Return base name for non-directional assets
  return `${baseName}.png`;
}
