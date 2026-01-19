/**
 * ASSETS Global Helper for Preview Iframe
 *
 * Provides runtime API for loading linked assets in Babylon.js preview.
 * This file is used in two ways:
 * 1. As TypeScript types for StudioProvider (full imports)
 * 2. As raw JavaScript string injected into iframe (no imports)
 *
 * IMPORTANT: When modifying, ensure the JavaScript version works standalone.
 */

import type { AssetInfo } from "./types";

/**
 * Generate JavaScript code for ASSETS global helper
 * This is injected into the iframe before user code executes
 */
export function generateAssetLoaderScript(assets: AssetInfo[]): string {
  const assetsJson = JSON.stringify(assets, null, 2);
  
  return `
(function() {
  'use strict';
  
  // Asset registry - populated from parent
  const ASSET_REGISTRY = new Map();
  
  // Initialize registry with assets
  ${assetsJson}.forEach(function(asset) {
    ASSET_REGISTRY.set(asset.key, asset);
  });
  
  /**
   * ASSETS global helper for loading linked assets in preview
   */
  window.ASSETS = {
    /**
     * Load an asset by key and return the Babylon.js mesh/texture
     * @param key - Asset manifest key (e.g., "knight", "forest_sky")
     * @param scene - Babylon.js scene to load into
     * @returns Promise<Mesh|Texture|null>
     */
    load: function(key, scene) {
      var asset = ASSET_REGISTRY.get(key);
      if (!asset) {
        console.warn('[ASSETS] Asset not found: ' + key);
        return Promise.resolve(null);
      }
      
      var url = asset.urls.glb || asset.urls.model;
      
      if (!url) {
        console.warn('[ASSETS] No model URL for asset: ' + key);
        return Promise.resolve(null);
      }
      
      // Handle 3D models
      if (asset.type === '3d') {
        return BABYLON.SceneLoader.ImportMeshAsync('', url.split('/').slice(0, -1).join('/') + '/', url.split('/').pop(), scene)
          .then(function(result) {
            console.log('[ASSETS] Loaded 3D asset: ' + key);
            // Store metadata on first mesh
            if (result.meshes[0] && asset.metadata.animations) {
              result.meshes[0].metadata = result.meshes[0].metadata || {};
              result.meshes[0].metadata.animations = asset.metadata.animations;
            }
            return result.meshes[0];
          })
          .catch(function(error) {
            console.error('[ASSETS] Failed to load 3D asset: ' + key, error);
            return null;
          });
      }
      
      // Handle 2D textures
      if (asset.type === '2d') {
        var texture = new BABYLON.Texture(url, scene);
        console.log('[ASSETS] Loaded 2D asset: ' + key);
        return Promise.resolve(texture);
      }
      
      console.warn('[ASSETS] Unknown asset type: ' + asset.type);
      return Promise.resolve(null);
    },
    
    /**
     * Get asset metadata by key
     * @param key - Asset manifest key
     * @returns AssetInfo or undefined
     */
    getInfo: function(key) {
      return ASSET_REGISTRY.get(key);
    },
    
    /**
     * List all available asset keys
     * @returns Array of asset keys
     */
    list: function() {
      return Array.from(ASSET_REGISTRY.keys());
    },
    
    /**
     * Get all assets as array
     * @returns Array of AssetInfo
     */
    all: function() {
      return Array.from(ASSET_REGISTRY.values());
    }
  };
  
  console.log('[ASSETS] Initialized with ' + ASSET_REGISTRY.size + ' assets');
})();
  `.trim();
}

/**
 * Validate asset data structure (for debugging)
 */
export function validateAssetInfo(asset: unknown): asset is AssetInfo {
  if (!asset || typeof asset !== 'object') return false;
  const a = asset as Record<string, unknown>;
  return (
    typeof a.key === 'string' &&
    typeof a.name === 'string' &&
    typeof a.type === 'string' &&
    (a.type === '2d' || a.type === '3d')
  );
}
