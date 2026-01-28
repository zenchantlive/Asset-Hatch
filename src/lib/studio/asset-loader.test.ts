/**
 * Unit tests for asset-loader.ts
 * 
 * Tests focus on:
 * - ASSETS global helper generation
 * - URL parsing for Babylon.js SceneLoader (CRITICAL: query param handling)
 * - Asset info validation
 */

import { generateAssetLoaderScript, validateAssetInfo } from './asset-loader';
import { parseUrlParts, hasQueryParams } from './url-utils';

// =============================================================================
// URL PARSING TESTS (These test the critical bug fix)
// =============================================================================

describe('asset-loader URL parsing', () => {
  /**
   * These tests verify the parseUrlParts fix for proxy URLs with query parameters.
   * 
   * BUG: Before the fix, parseUrlParts() would split proxy URLs incorrectly:
   * Input:  http://localhost:3000/api/studio/assets/proxy?gameId=abc&token=xyz
   * Output: root="http://localhost:3000/api/studio/assets/", file="proxy?gameId=abc&token=xyz"
   * SceneLoader would then produce: http://host/api/proxy?gameId=abc&token=xyz.glb
   *                                           ^ WRONG - .glb appended after query params
   * 
   * FIX: For URLs with '?', use empty root and full URL as file.
   */

  describe('parseUrlParts with proxy URLs (query parameters)', () => {
    // Use shared utility
    it('should handle proxy URLs with query parameters correctly', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz123';
      const parts = parseUrlParts(proxyUrl);
      
      // For proxy URLs, root should be empty and file should be the full URL
      // This is the critical fix - before, it would split at the last /
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
    });

    it('should preserve query params with multiple parameters', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=test123&key=my_asset&token=abc&another=param';
      const parts = parseUrlParts(proxyUrl);
      
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
      expect(parts.file).toContain('gameId=test123');
      expect(parts.file).toContain('token=abc');
    });

    it('should handle proxy URLs with encoded characters', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=test%20123&key=asset%20name&token=xyz%26abc';
      const parts = parseUrlParts(proxyUrl);
      
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
    });
  });

  describe('parseUrlParts with regular URLs (no query parameters)', () => {
    // Use shared utility
    it('should parse regular URLs with paths correctly', () => {
      const glbUrl = 'https://cdn.example.com/assets/knight.glb';
      const parts = parseUrlParts(glbUrl);
      
      expect(parts.root).toBe('https://cdn.example.com/assets/');
      expect(parts.file).toBe('knight.glb');
    });

    it('should parse R2 URLs correctly', () => {
      const r2Url = 'https://account.r2.cloudflarestorage.com/bucket/assets/3d/project/knight-id.glb';
      const parts = parseUrlParts(r2Url);
      
      expect(parts.root).toBe('https://account.r2.cloudflarestorage.com/bucket/assets/3d/project/');
      expect(parts.file).toBe('knight-id.glb');
    });

    it('should handle URLs without slashes', () => {
      const url = 'file.glb';
      const parts = parseUrlParts(url);
      
      expect(parts.root).toBe('');
      expect(parts.file).toBe('file.glb');
    });

    it('should handle data URLs correctly', () => {
      const dataUrl = 'data:application/octet-stream;base64,abc123';
      const parts = parseUrlParts(dataUrl);
      
      // Data URLs contain ':' and may contain '/' but not '?', so they go to regular parsing
      expect(parts.file).toBe('octet-stream;base64,abc123');
    });
  });

  describe('SceneLoader URL construction verification', () => {
    // For proxy URLs, the iframe uses: ImportMeshAsync("", "", proxyUrl, scene, null, ".glb")
    // So parseUrlParts should return {root: '', file: proxyUrl}
    // And SceneLoader will use: "" + proxyUrl + ".glb" = proxyUrl (correct!)
    
    it('should return empty root for proxy URLs', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz';
      const parts = parseUrlParts(proxyUrl);
      
      // For proxy URLs, root is empty and file is the full URL
      // SceneLoader.ImportMeshAsync("", "", proxyUrl, scene) will use proxyUrl directly
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
    });

    it('should return correct path components for regular URLs', () => {
      const regularUrl = 'https://cdn.example.com/assets/knight.glb';
      const parts = parseUrlParts(regularUrl);
      
      // For regular URLs, SceneLoader.ImportMeshAsync("", root, file, scene) works
      expect(parts.root).toBe('https://cdn.example.com/assets/');
      expect(parts.file).toBe('knight.glb');
    });

    it('should handle URLs with encoded characters', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=test%20123&key=asset%20name';
      const parts = parseUrlParts(proxyUrl);
      
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
    });

    it('should correctly parse CDN URLs', () => {
      const cdnUrl = 'https://cdn.example.com/models/character.glb';
      const parts = parseUrlParts(cdnUrl);
      
      expect(parts.root).toBe('https://cdn.example.com/models/');
      expect(parts.file).toBe('character.glb');
    });

    it('should handle URLs without any path', () => {
      const url = 'knight.glb';
      const parts = parseUrlParts(url);
      
      expect(parts.root).toBe('');
      expect(parts.file).toBe('knight.glb');
    });
  });

  describe('hasQueryParams utility', () => {
    it('should return true for proxy URLs', () => {
      expect(hasQueryParams('http://localhost:3000/api/proxy?token=abc')).toBe(true);
    });

    it('should return false for regular URLs', () => {
      expect(hasQueryParams('https://cdn.example.com/model.glb')).toBe(false);
    });

    it('should return false for R2 URLs', () => {
      expect(hasQueryParams('https://account.r2.cloudflarestorage.com/bucket/model.glb')).toBe(false);
    });

    it('should return false for data URLs', () => {
      expect(hasQueryParams('data:application/octet-stream;base64,abc')).toBe(false);
    });
  });
});

// =============================================================================
// ASSET LOADER SCRIPT TESTS
// =============================================================================

describe('asset-loader', () => {
  describe('generateAssetLoaderScript', () => {
    it('should generate valid JavaScript for ASSETS global', () => {
      const script = generateAssetLoaderScript([
        { 
          key: 'knight', 
          type: '3d' as const, 
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
      expect(script).toContain('ASSET_REGISTRY');
    });

    it('should include multiple assets', () => {
      const script = generateAssetLoaderScript([
        { key: 'knight', type: '3d' as const, name: 'Knight', urls: { glb: 'https://example.com/knight.glb' }, metadata: {} },
        { key: 'forest', type: '3d' as const, name: 'Forest', urls: { glb: 'https://example.com/forest.glb' }, metadata: {} },
      ]);
      
      expect(script).toContain('knight');
      expect(script).toContain('forest');
    });

    it('should embed resolver config when provided', () => {
      const script = generateAssetLoaderScript(
        [{ key: 'ship', type: '3d' as const, name: 'Ship', urls: { glb: 'https://example.com/ship.glb' }, metadata: {} }],
        { gameId: 'game-123', timeoutMs: 5000 }
      );

      expect(script).toContain('game-123');
      expect(script).toContain('timeoutMs');
    });

    it('should support skybox assets', () => {
      const script = generateAssetLoaderScript([
        { key: 'sky', type: 'skybox' as const, name: 'Skybox', urls: { model: 'https://example.com/sky.jpg' }, metadata: { skybox: true } },
      ]);

      expect(script).toContain('skybox');
      expect(script).toContain('PhotoDome');
    });

    it('should include debug mode when enabled', () => {
      const script = generateAssetLoaderScript(
        [{ key: 'test', type: '3d' as const, name: 'Test', urls: { glb: 'https://example.com/test.glb' }, metadata: {} }],
        { debug: true }
      );

      expect(script).toContain('debugLog');
    });

    it('should handle proxy URLs in asset manifest', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz';
      const script = generateAssetLoaderScript([
        { key: 'knight', type: '3d' as const, name: 'Knight', urls: { glb: proxyUrl }, metadata: {} },
      ]);

      expect(script).toContain(proxyUrl);
      expect(script).toContain('resolveAssetUrl');
    });

    it('should handle data URLs correctly', () => {
      const dataUrl = 'data:application/octet-stream;base64,abc123';
      const script = generateAssetLoaderScript([
        { key: 'model', type: '3d' as const, name: 'Model', urls: { glb: dataUrl }, metadata: {} },
      ]);

      expect(script).toContain('data:');
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

    it('should accept 2d, 3d, and skybox types', () => {
      const testCases = [
        { key: 'a', type: '2d' as const, name: 'A', urls: {}, metadata: {} },
        { key: 'a', type: '3d' as const, name: 'A', urls: {}, metadata: {} },
        { key: 'a', type: 'skybox' as const, name: 'A', urls: {}, metadata: {} },
      ];

      testCases.forEach(asset => {
        expect(validateAssetInfo(asset)).toBe(true);
      });
    });
  });
});
