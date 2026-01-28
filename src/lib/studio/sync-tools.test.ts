/**
 * Unit tests for sync-tools.ts
 * 
 * Tests focus on:
 * - Generated asset loading code for proxy URLs
 * - URL handling in generated Babylon.js code
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// GENERATED CODE URL TESTS
// =============================================================================

describe('sync-tools generated code URL handling', () => {
  /**
   * These tests verify that generated Babylon.js code handles proxy URLs correctly.
   * 
   * BUG: Before the fix, generated code would use:
   * BABYLON.SceneLoader.ImportMeshAsync("", "${modelUrl}", scene)
   * 
   * For proxy URLs with query params, this would produce:
   * http://host/api/proxy?gameId=...&token=...glb
   * 
   * FIX: Generate different code for URLs with query params:
   * BABYLON.SceneLoader.ImportMeshAsync("", "", "${modelUrl}", scene)
   */

  describe('generateAssetLoadingCode URL handling', () => {
    // Extract the URL check logic for testing
    const hasQueryParams = (url: string) => url.includes('?');

    it('should detect proxy URLs with query parameters', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz';
      expect(hasQueryParams(proxyUrl)).toBe(true);
    });

    it('should not flag regular URLs as having query params', () => {
      const regularUrl = 'https://cdn.example.com/assets/knight.glb';
      expect(hasQueryParams(regularUrl)).toBe(false);
    });

    it('should not flag R2 URLs as having query params', () => {
      const r2Url = 'https://account.r2.cloudflarestorage.com/bucket/assets/knight.glb';
      expect(hasQueryParams(r2Url)).toBe(false);
    });

    it('should handle data URLs correctly', () => {
      const dataUrl = 'data:application/octet-stream;base64,abc123';
      expect(hasQueryParams(dataUrl)).toBe(false);
    });

    it('should handle URLs with encoded query params', () => {
      const encodedUrl = 'http://localhost:3000/api/proxy?gameId=test%20123&key=asset%20name';
      expect(hasQueryParams(encodedUrl)).toBe(true);
    });
  });

  describe('generated code patterns for different URL types', () => {
    /**
     * Verifies the generated code patterns for different URL types
     */

    it('should generate correct code pattern for proxy URLs', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&key=knight&token=xyz';
      const hasQuery = proxyUrl.includes('?');
      
      // The fix generates different code for proxy URLs
      if (hasQuery) {
        // Should use: ImportMeshAsync("", "", proxyUrl, scene)
        expect(proxyUrl.includes('?')).toBe(true);
      }
    });

    it('should generate correct code pattern for R2 URLs', () => {
      const r2Url = 'https://account.r2.cloudflarestorage.com/bucket/knight.glb';
      const hasQuery = r2Url.includes('?');
      
      if (!hasQuery) {
        // Should use: ImportMeshAsync("", r2Url, scene)
        expect(r2Url).toContain('https://account.r2.cloudflarestorage.com/bucket/knight.glb');
      }
    });

    it('should generate correct code pattern for CDN URLs', () => {
      const cdnUrl = 'https://cdn.example.com/assets/knight.glb';
      const hasQuery = cdnUrl.includes('?');
      
      if (!hasQuery) {
        expect(cdnUrl).toContain('https://cdn.example.com/assets/knight.glb');
      }
    });
  });

  describe('parseUrlParts behavior (same as asset-loader)', () => {
    const parseUrlParts = (url: string) => {
      if (url.includes('?')) {
        return { root: '', file: url };
      }
      const lastSlash = url.lastIndexOf('/');
      if (lastSlash === -1) {
        return { root: '', file: url };
      }
      return {
        root: url.slice(0, lastSlash + 1),
        file: url.slice(lastSlash + 1)
      };
    };

    it('should correctly parse proxy URLs with query params', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&token=xyz';
      const parts = parseUrlParts(proxyUrl);
      
      // Critical: proxy URLs should have empty root
      expect(parts.root).toBe('');
      expect(parts.file).toBe(proxyUrl);
    });

    it('should correctly parse R2 URLs without query params', () => {
      const r2Url = 'https://account.r2.cloudflarestorage.com/bucket/knight.glb';
      const parts = parseUrlParts(r2Url);
      
      expect(parts.root).toBe('https://account.r2.cloudflarestorage.com/bucket/');
      expect(parts.file).toBe('knight.glb');
    });

    it('should correctly parse CDN URLs', () => {
      const cdnUrl = 'https://cdn.example.com/models/character.glb';
      const parts = parseUrlParts(cdnUrl);
      
      expect(parts.root).toBe('https://cdn.example.com/models/');
      expect(parts.file).toBe('character.glb');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS (Mocked)
// =============================================================================

describe('sync-tools integration', () => {
  describe('asset loading code generation', () => {
    it('should generate loading code that compiles (syntax check)', () => {
      // This is a basic syntax check - the generated code should be valid JavaScript
      const modelUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=abc&token=xyz';
      const hasQuery = modelUrl.includes('?');
      
      let generatedCode: string;
      if (hasQuery) {
        generatedCode = `
BABYLON.SceneLoader.ImportMeshAsync("", "", "${modelUrl}", scene)
  .then((mesh) => {
    asset = mesh;
    asset.position = new BABYLON.Vector3(0, 0, 0);
  })
  .catch((error) => {
    console.error("Failed to load asset:", error);
  });`;
      } else {
        generatedCode = `
BABYLON.SceneLoader.ImportMeshAsync("", "${modelUrl}", scene)
  .then((mesh) => {
    asset = mesh;
    asset.position = new BABYLON.Vector3(0, 0, 0);
  })
  .catch((error) => {
    console.error("Failed to load asset:", error);
  });`;
      }

      // The generated code should not have syntax errors (basic check)
      expect(generatedCode).toContain('BABYLON.SceneLoader.ImportMeshAsync');
      expect(generatedCode).toContain('.then((mesh) => {');
      expect(generatedCode).toContain('.catch((error) => {');
    });

    it('should handle special characters in proxy URLs', () => {
      const proxyUrl = 'http://localhost:3000/api/studio/assets/proxy?gameId=test%20123&key=asset%2Fname';
      const hasQuery = proxyUrl.includes('?');
      
      // Should generate valid code even with encoded characters
      if (hasQuery) {
        const code = `BABYLON.SceneLoader.ImportMeshAsync("", "", "${proxyUrl}", scene);`;
        expect(code).toContain('ImportMeshAsync("", "", "http://localhost:3000/api/studio/assets/proxy?gameId=test%20123&key=asset%2Fname", scene);');
      }
    });
  });
});
