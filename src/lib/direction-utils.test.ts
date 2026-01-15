/**
 * Unit tests for direction utilities
 */

import {
  expandAssetToDirections,
  getDirectionPromptModifier,
  isReferenceDirection,
  getDirectionalSiblings,
  getParentAsset,
  isDirectionVariant,
  getDirectionalAssetFilename,
  DIRECTION_LABELS,
  DIRECTION_EXPORT_NAMES,
} from './direction-utils';
import type { ParsedAsset } from './prompt-builder';

describe('direction-utils', () => {
  // Create a mock ParsedAsset for testing
  const createMockAsset = (overrides: Partial<ParsedAsset> = {}): ParsedAsset => ({
    id: 'test-asset-1',
    category: 'Characters',
    name: 'Test Character',
    type: 'character-sprite',
    description: 'A test character',
    mobility: { type: 'moveable', directions: 4 },
    variant: {
      id: 'variant-1',
      name: 'Idle',
      pose: 'idle standing pose',
      direction: 'front',
    },
    ...overrides,
  });

  describe('Direction type constants', () => {
    test('DIRECTION_LABELS contains all directions', () => {
      expect(DIRECTION_LABELS.front).toBe('Front');
      expect(DIRECTION_LABELS.back).toBe('Back');
      expect(DIRECTION_LABELS.left).toBe('Left');
      expect(DIRECTION_LABELS.right).toBe('Right');
      expect(DIRECTION_LABELS['front-left']).toBe('Front-Left');
      expect(DIRECTION_LABELS['front-right']).toBe('Front-Right');
      expect(DIRECTION_LABELS['back-left']).toBe('Back-Left');
      expect(DIRECTION_LABELS['back-right']).toBe('Back-Right');
    });

    test('DIRECTION_EXPORT_NAMES contains all directions with snake_case', () => {
      expect(DIRECTION_EXPORT_NAMES.front).toBe('front');
      expect(DIRECTION_EXPORT_NAMES.back).toBe('back');
      expect(DIRECTION_EXPORT_NAMES.left).toBe('left');
      expect(DIRECTION_EXPORT_NAMES.right).toBe('right');
      expect(DIRECTION_EXPORT_NAMES['front-left']).toBe('front_left');
      expect(DIRECTION_EXPORT_NAMES['front-right']).toBe('front_right');
      expect(DIRECTION_EXPORT_NAMES['back-left']).toBe('back_left');
      expect(DIRECTION_EXPORT_NAMES['back-right']).toBe('back_right');
    });
  });

  describe('expandAssetToDirections', () => {
    test('expands asset to 4 cardinal directions', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset, 4);

      expect(variants).toHaveLength(4);
      expect(variants.map(v => v.directionState?.direction)).toEqual(['front', 'back', 'left', 'right']);
    });

    test('expands asset to 8 directions including diagonals', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset, 8);

      expect(variants).toHaveLength(8);
      expect(variants.map(v => v.directionState?.direction)).toContain('front-left');
      expect(variants.map(v => v.directionState?.direction)).toContain('front-right');
      expect(variants.map(v => v.directionState?.direction)).toContain('back-left');
      expect(variants.map(v => v.directionState?.direction)).toContain('back-right');
    });

    test('generates deterministic IDs based on parent ID and direction', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset, 4);

      expect(variants[0].id).toBe('test-asset-1-front');
      expect(variants[1].id).toBe('test-asset-1-back');
      expect(variants[2].id).toBe('test-asset-1-left');
      expect(variants[3].id).toBe('test-asset-1-right');
    });

    test('updates asset names with direction labels', () => {
      const parentAsset = createMockAsset({ name: 'Farmer' });
      const variants = expandAssetToDirections(parentAsset, 4);

      expect(variants[0].name).toBe('Farmer (Front)');
      expect(variants[1].name).toBe('Farmer (Back)');
      expect(variants[2].name).toBe('Farmer (Left)');
      expect(variants[3].name).toBe('Farmer (Right)');
    });

    test('sets directionState correctly for each variant', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset, 4);

      variants.forEach((variant) => {
        expect(variant.directionState).toBeDefined();
        expect(variant.directionState?.parentAssetId).toBe('test-asset-1');
        expect(variant.directionState?.isParent).toBe(false);
        expect(variant.directionState?.generated).toBeInstanceOf(Set);
        expect(variant.directionState?.generated.size).toBe(0);
      });
    });

    test('copies parent asset properties to all variants', () => {
      const parentAsset = createMockAsset({
        category: 'Characters',
        type: 'character-sprite',
        description: 'A test character',
      });
      const variants = expandAssetToDirections(parentAsset, 4);

      variants.forEach((variant) => {
        expect(variant.category).toBe('Characters');
        expect(variant.type).toBe('character-sprite');
        expect(variant.description).toBe('A test character');
        expect(variant.mobility).toEqual({ type: 'moveable', directions: 4 });
      });
    });

    test('updates variant direction in each child', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset, 4);

      const frontVariant = variants.find(v => v.directionState?.direction === 'front');
      expect(frontVariant?.variant.direction).toBe('front');

      const backVariant = variants.find(v => v.directionState?.direction === 'back');
      expect(backVariant?.variant.direction).toBe('back');
    });

    test('uses 4 as default direction count', () => {
      const parentAsset = createMockAsset();
      const variants = expandAssetToDirections(parentAsset);

      expect(variants).toHaveLength(4);
    });
  });

  describe('getDirectionPromptModifier', () => {
    test('returns correct modifier for front direction', () => {
      expect(getDirectionPromptModifier('front')).toBe('front-facing view, looking toward viewer');
    });

    test('returns correct modifier for back direction', () => {
      expect(getDirectionPromptModifier('back')).toBe('back-facing view, looking away from viewer');
    });

    test('returns correct modifier for left direction', () => {
      expect(getDirectionPromptModifier('left')).toBe('left-side view, facing left');
    });

    test('returns correct modifier for right direction', () => {
      expect(getDirectionPromptModifier('right')).toBe('right-side view, facing right');
    });

    test('returns correct modifiers for diagonal directions', () => {
      expect(getDirectionPromptModifier('front-left')).toBe('front-left diagonal view');
      expect(getDirectionPromptModifier('front-right')).toBe('front-right diagonal view');
      expect(getDirectionPromptModifier('back-left')).toBe('back-left diagonal view');
      expect(getDirectionPromptModifier('back-right')).toBe('back-right diagonal view');
    });
  });

  describe('isReferenceDirection', () => {
    test('returns true for front direction asset', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(isReferenceDirection(asset)).toBe(true);
    });

    test('returns false for non-front direction assets', () => {
      const backAsset = createMockAsset({
        directionState: { direction: 'back', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(isReferenceDirection(backAsset)).toBe(false);

      const leftAsset = createMockAsset({
        directionState: { direction: 'left', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(isReferenceDirection(leftAsset)).toBe(false);
    });

    test('returns false when directionState is undefined', () => {
      const asset = createMockAsset();
      delete asset.directionState;
      expect(isReferenceDirection(asset)).toBe(false);
    });

    test('returns false when direction is not front', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front-left', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(isReferenceDirection(asset)).toBe(false);
    });
  });

  describe('getDirectionalSiblings', () => {
    test('returns empty array when asset has no parentAssetId', () => {
      const asset = createMockAsset();
      const allAssets = [asset];
      expect(getDirectionalSiblings(asset, allAssets)).toEqual([]);
    });

    test('returns empty array when asset has no directionState', () => {
      const asset = createMockAsset();
      delete asset.directionState;
      const allAssets = [asset];
      expect(getDirectionalSiblings(asset, allAssets)).toEqual([]);
    });

    test('returns sibling assets with same parent', () => {
      const parentAsset = createMockAsset({ id: 'parent-1' });
      const frontAsset = createMockAsset({
        id: 'front-1',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });
      const backAsset = createMockAsset({
        id: 'back-1',
        directionState: { direction: 'back', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });
      const leftAsset = createMockAsset({
        id: 'left-1',
        directionState: { direction: 'left', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });

      const allAssets = [parentAsset, frontAsset, backAsset, leftAsset];
      const siblings = getDirectionalSiblings(frontAsset, allAssets);

      expect(siblings).toHaveLength(2);
      expect(siblings.map(s => s.id)).toContain('back-1');
      expect(siblings.map(s => s.id)).toContain('left-1');
      expect(siblings.map(s => s.id)).not.toContain('front-1');
    });

    test('excludes the input asset from siblings', () => {
      const frontAsset = createMockAsset({
        id: 'front-1',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });
      const backAsset = createMockAsset({
        id: 'back-1',
        directionState: { direction: 'back', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });

      const allAssets = [frontAsset, backAsset];
      const siblings = getDirectionalSiblings(frontAsset, allAssets);

      expect(siblings).toHaveLength(1);
      expect(siblings[0].id).toBe('back-1');
    });

    test('returns assets from different parent when different parentId', () => {
      const frontAsset1 = createMockAsset({
        id: 'front-1',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });
      const frontAsset2 = createMockAsset({
        id: 'front-2',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-2', isParent: false },
      });

      const allAssets = [frontAsset1, frontAsset2];
      const siblings = getDirectionalSiblings(frontAsset1, allAssets);

      expect(siblings).toHaveLength(0);
    });
  });

  describe('getParentAsset', () => {
    test('returns null when asset has no parentAssetId', () => {
      const asset = createMockAsset();
      expect(getParentAsset(asset, [asset])).toBeNull();
    });

    test('returns null when asset has no directionState', () => {
      const asset = createMockAsset();
      delete asset.directionState;
      expect(getParentAsset(asset, [asset])).toBeNull();
    });

    test('returns null when parent asset is not found', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'missing-parent', isParent: false },
      });
      expect(getParentAsset(asset, [asset])).toBeNull();
    });

    test('returns the parent asset when found', () => {
      const parentAsset = createMockAsset({ id: 'parent-1' });
      const childAsset = createMockAsset({
        id: 'child-1',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });

      const result = getParentAsset(childAsset, [parentAsset, childAsset]);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('parent-1');
    });

    test('returns the correct parent from multiple assets', () => {
      const parent1 = createMockAsset({ id: 'parent-1' });
      const parent2 = createMockAsset({ id: 'parent-2' });
      const child = createMockAsset({
        id: 'child-1',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-2', isParent: false },
      });

      const result = getParentAsset(child, [parent1, parent2, child]);
      expect(result?.id).toBe('parent-2');
    });
  });

  describe('isDirectionVariant', () => {
    test('returns true when asset has parentAssetId', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent-1', isParent: false },
      });
      expect(isDirectionVariant(asset)).toBe(true);
    });

    test('returns false when asset has no directionState', () => {
      const asset = createMockAsset();
      delete asset.directionState;
      expect(isDirectionVariant(asset)).toBe(false);
    });

    test('returns false when directionState has no parentAssetId', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front', generated: new Set(), parentAssetId: undefined, isParent: false },
      });
      expect(isDirectionVariant(asset)).toBe(false);
    });

    test('returns false when directionState has empty parentAssetId', () => {
      const asset = createMockAsset({
        directionState: { direction: 'front', generated: new Set(), parentAssetId: '', isParent: false },
      });
      expect(isDirectionVariant(asset)).toBe(false);
    });
  });

  describe('getDirectionalAssetFilename', () => {
    test('generates correct filename for front direction', () => {
      const asset = createMockAsset({
        name: 'Farmer',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('farmer_front.png');
    });

    test('generates correct filename for back direction', () => {
      const asset = createMockAsset({
        name: 'Farmer',
        directionState: { direction: 'back', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('farmer_back.png');
    });

    test('generates correct filename for diagonal directions', () => {
      const frontLeftAsset = createMockAsset({
        name: 'Warrior',
        directionState: { direction: 'front-left', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(frontLeftAsset)).toBe('warrior_front_left.png');
    });

    test('converts name to snake_case', () => {
      const asset = createMockAsset({
        name: 'Test Character',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('test_character_front.png');
    });

    test('handles multi-word names with multiple spaces', () => {
      const asset = createMockAsset({
        name: 'Super   Hero',
        directionState: { direction: 'right', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('super_hero_right.png');
    });

    test('returns base name for non-directional assets', () => {
      const asset = createMockAsset({ name: 'Big Tree' });
      expect(getDirectionalAssetFilename(asset)).toBe('big_tree.png');
    });

    test('returns base name when directionState is undefined', () => {
      const asset = createMockAsset({ name: 'A Rock' });
      delete asset.directionState;
      expect(getDirectionalAssetFilename(asset)).toBe('a_rock.png');
    });

    test('handles uppercase names', () => {
      const asset = createMockAsset({
        name: 'KNIGHT',
        directionState: { direction: 'front', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('knight_front.png');
    });

    test('handles mixed case names', () => {
      const asset = createMockAsset({
        name: 'BlueSlime',
        directionState: { direction: 'back', generated: new Set(), parentAssetId: 'parent', isParent: false },
      });
      expect(getDirectionalAssetFilename(asset)).toBe('blueslime_back.png');
    });
  });
});
