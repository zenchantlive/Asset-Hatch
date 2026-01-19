/**
 * Unit tests for asset-loader.ts
 */

import { generateAssetLoaderScript, validateAssetInfo } from './asset-loader';

describe('asset-loader', () => {
  describe('generateAssetLoaderScript', () => {
    it('should generate valid JavaScript for ASSETS global', () => {
      const script = generateAssetLoaderScript([
        { 
          key: 'knight', 
          type: '3d', 
          name: 'Knight', 
          urls: { glb: 'https://example.com/knight.glb' }, 
          metadata: { animations: ['idle', 'walk'] } 
        },
      ]);
      
      expect(script).toContain('window.ASSETS');
      expect(script).toContain('load: function');
      expect(script).toContain('knight');
      expect(script).toContain('ASSET_REGISTRY');
    });

    it('should handle empty asset list', () => {
      const script = generateAssetLoaderScript([]);
      
      expect(script).toContain('window.ASSETS');
      expect(script).toContain('ASSET_REGISTRY.size');
      expect(script).toContain('0 assets');
    });

    it('should include multiple assets', () => {
      const script = generateAssetLoaderScript([
        { key: 'knight', type: '3d', name: 'Knight', urls: { glb: 'https://example.com/knight.glb' }, metadata: {} },
        { key: 'forest', type: '3d', name: 'Forest', urls: { glb: 'https://example.com/forest.glb' }, metadata: {} },
      ]);
      
      expect(script).toContain('knight');
      expect(script).toContain('forest');
    });
  });

  describe('validateAssetInfo', () => {
    it('should validate correct asset info', () => {
      const validAsset = {
        key: 'test',
        type: '3d' as const,
        name: 'Test',
        urls: { glb: 'url' },
        metadata: {},
      };
      
      expect(validateAssetInfo(validAsset)).toBe(true);
    });

    it('should reject invalid asset info', () => {
      expect(validateAssetInfo(null)).toBe(false);
      expect(validateAssetInfo({})).toBe(false);
      expect(validateAssetInfo({ key: 123 })).toBe(false);
      expect(validateAssetInfo({ key: 'test', type: 'invalid' })).toBe(false);
    });
  });
});
