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
  
  // Escape </script> sequences to prevent XSS
  const escapedJson = assetsJson.replace(/<\//g, '<\\/');
  
  return `
(function() {
  'use strict';
  
  // Asset registry - populated from parent
  const ASSET_REGISTRY = new Map();
  
  // Initialize registry with assets
  ${escapedJson}.forEach(function(asset) {
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
      
      // Handle 2D textures
      if (asset.type === '2d' || asset.type === 'texture') {
        var texture = new BABYLON.Texture(url, scene);
        console.log('[ASSETS] Loaded 2D asset: ' + key);
        return Promise.resolve(texture);
      }
      
      // Handle 3D models (including 'model' type)
      if (asset.type === '3d' || asset.type === 'model') {
        return BABYLON.SceneLoader.ImportMeshAsync('', url.split('/').slice(0, -1).join('/') + '/', url.split('/').pop(), scene)
          .then(function(result) {
            console.log('[ASSETS] Loaded 3D asset: ' + key);
      
            // If there are no meshes, return null
            if (!result.meshes || result.meshes.length === 0) {
              return null;
            }
      
            // Create a root node to hold all meshes
            var rootNode = new BABYLON.TransformNode("root_" + key, scene);
            result.meshes.forEach(function(mesh) {
              mesh.parent = rootNode;
            });

            // Store metadata on the root node
            if (asset.metadata.animations) {
              rootNode.metadata = rootNode.metadata || {};
              rootNode.metadata.animations = asset.metadata.animations;
            }
      
            return rootNode;
          })
          .catch(function(error) {
            console.error('[ASSETS] Failed to load 3D asset: ' + key, error);
            return null;
          });
      }
      
      // Handle skybox assets
      if (asset.type === 'skybox') {
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(url.replace(/\/[^\/]*$/, '/'), scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        console.log('[ASSETS] Loaded skybox: ' + key);
        return Promise.resolve(skybox);
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
    (a.type === '2d' || a.type === '3d' || a.type === 'model' || a.type === 'texture' || a.type === 'skybox')
  );
}
