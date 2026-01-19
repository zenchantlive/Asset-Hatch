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

export interface AssetLoaderScriptOptions {
  gameId?: string;
  timeoutMs?: number;
  resolveTimeoutMs?: number;
}

/**
 * Generate JavaScript code for ASSETS global helper
 * This is injected into the iframe before user code executes
 */
export function generateAssetLoaderScript(
  assets: AssetInfo[],
  options: AssetLoaderScriptOptions = {}
): string {
  const assetsJson = JSON.stringify(assets, null, 2);
  const configJson = JSON.stringify(
    {
      gameId: options.gameId || null,
      timeoutMs: options.timeoutMs ?? 8000,
      resolveTimeoutMs: options.resolveTimeoutMs ?? 6000,
    },
    null,
    2
  );

  return `
(function() {
  'use strict';
  
  // Asset registry - populated from parent
  const ASSET_REGISTRY = new Map();
  const ASSET_CONFIG = ${configJson};
  const RESOLVE_REQUESTS = new Map();
  
  // Initialize registry with assets
  ${assetsJson}.forEach(function(asset) {
    ASSET_REGISTRY.set(asset.key, asset);
  });

  function createRequestId(prefix) {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return prefix + '_' + stamp + '_' + rand;
  }

  function buildAssetError(details) {
    return {
      name: 'AssetLoadError',
      code: details.code,
      stage: details.stage,
      key: details.key,
      message: details.message,
      requestId: details.requestId,
      assetType: details.assetType || null,
      source: details.source || null
    };
  }

  function reportAssetError(error) {
    console.error('[ASSETS] ' + error.code + ' (' + error.stage + '): ' + error.message, {
      key: error.key,
      requestId: error.requestId,
      assetType: error.assetType,
      source: error.source
    });

    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'asset-error',
        requestId: error.requestId,
        code: error.code,
        stage: error.stage,
        key: error.key,
        message: error.message
      }, '*');
    }
  }

  function withTimeout(promise, timeoutMs, onTimeout) {
    if (!timeoutMs || timeoutMs <= 0) {
      return promise;
    }

    return new Promise(function(resolve, reject) {
      let settled = false;
      const timer = setTimeout(function() {
        if (settled) return;
        settled = true;
        reject(onTimeout());
      }, timeoutMs);

      promise
        .then(function(result) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch(function(error) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  function parseUrlParts(url) {
    const lastSlash = url.lastIndexOf('/');
    if (lastSlash === -1) {
      return { root: '', file: url };
    }
    return {
      root: url.slice(0, lastSlash + 1),
      file: url.slice(lastSlash + 1)
    };
  }

  function registerResolveListener() {
    if (registerResolveListener.initialized) return;
    registerResolveListener.initialized = true;

    window.addEventListener('message', function(event) {
      const data = event.data;
      if (!data || data.type !== 'asset-resolve-response') return;
      const requestId = data.requestId;
      if (!requestId) return;
      const resolver = RESOLVE_REQUESTS.get(requestId);
      if (!resolver) return;
      RESOLVE_REQUESTS.delete(requestId);
      if (data.success && data.url) {
        resolver.resolve(data);
      } else {
        resolver.reject(data);
      }
    });
  }

  function requestResolveFromParent(key, requestId) {
    registerResolveListener();
    return new Promise(function(resolve, reject) {
      RESOLVE_REQUESTS.set(requestId, { resolve: resolve, reject: reject });
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({
          type: 'asset-resolve-request',
          requestId: requestId,
          key: key
        }, '*');
      } else {
        RESOLVE_REQUESTS.delete(requestId);
        reject({
          success: false,
          error: 'PARENT_UNAVAILABLE'
        });
      }
    });
  }

  function resolveAssetUrl(key, asset, requestId) {
    const candidate = asset.urls.glb || asset.urls.model;
    if (candidate && candidate.startsWith('data:')) {
      return Promise.resolve({ url: candidate, source: 'data' });
    }

    if (!ASSET_CONFIG.gameId) {
      return Promise.resolve({ url: candidate || null, source: 'manifest' });
    }

    return withTimeout(
      requestResolveFromParent(key, requestId),
      ASSET_CONFIG.resolveTimeoutMs,
      function() {
        RESOLVE_REQUESTS.delete(requestId);
        return {
          success: false,
          error: 'RESOLVE_TIMEOUT'
        };
      }
    ).then(function(response) {
      if (response && response.url) {
        return { url: response.url, source: response.source || 'resolver' };
      }

      throw buildAssetError({
        code: 'RESOLVE_FAILED',
        stage: 'resolve',
        key: key,
        message: response && response.error ? response.error : 'Failed to resolve asset URL',
        requestId: requestId,
        assetType: asset.type
      });
    }).catch(function(error) {
      if (error && error.code) {
        throw error;
      }
      throw buildAssetError({
        code: 'RESOLVE_FAILED',
        stage: 'resolve',
        key: key,
        message: 'Failed to resolve asset URL',
        requestId: requestId,
        assetType: asset.type
      });
    });
  }
  
  /**
   * ASSETS global helper for loading linked assets in preview
   */
  window.ASSETS = {
    /**
     * Load an asset by key and return the Babylon.js mesh/texture
     * @param key - Asset manifest key (e.g., "knight", "forest_sky")
     * @param scene - Babylon.js scene to load into
     * @param options - Optional overrides (timeoutMs)
     * @returns Promise<Mesh|Texture>
     */
    load: function(key, scene, options) {
      var requestId = createRequestId('asset');
      var asset = ASSET_REGISTRY.get(key);
      if (!asset) {
        var notFoundError = buildAssetError({
          code: 'ASSET_NOT_FOUND',
          stage: 'registry',
          key: key,
          message: 'Asset not found in registry',
          requestId: requestId
        });
        reportAssetError(notFoundError);
        return Promise.reject(notFoundError);
      }

      if (!scene) {
        var sceneError = buildAssetError({
          code: 'INVALID_SCENE',
          stage: 'load',
          key: key,
          message: 'Scene is required to load assets',
          requestId: requestId,
          assetType: asset.type
        });
        reportAssetError(sceneError);
        return Promise.reject(sceneError);
      }

      // Handle 3D models (both regular URLs and data URLs)
      if (asset.type === '3d' || asset.metadata.animations) {
        var timeoutMs = (options && options.timeoutMs) ? options.timeoutMs : ASSET_CONFIG.timeoutMs;

        return withTimeout(
          resolveAssetUrl(key, asset, requestId).then(function(resolved) {
            if (!resolved.url) {
              var urlError = buildAssetError({
                code: 'URL_MISSING',
                stage: 'resolve',
                key: key,
                message: 'No resolved URL available for asset',
                requestId: requestId,
                assetType: asset.type,
                source: resolved.source
              });
              reportAssetError(urlError);
              throw urlError;
            }

            var isDataUrl = resolved.url.startsWith('data:');
            var loadPromise;

            if (isDataUrl) {
              loadPromise = BABYLON.SceneLoader.ImportMeshAsync(
                '',
                '',
                resolved.url,
                scene,
                null,
                '.glb'
              );
            } else {
              var urlParts = parseUrlParts(resolved.url);
              loadPromise = BABYLON.SceneLoader.ImportMeshAsync(
                '',
                urlParts.root,
                urlParts.file,
                scene,
                null,
                '.glb'
              );
            }

            return loadPromise.then(function(result) {
              console.log('[ASSETS] Loaded 3D asset: ' + key);
              if (result.meshes[0] && asset.metadata.animations) {
                result.meshes[0].metadata = result.meshes[0].metadata || {};
                result.meshes[0].metadata.animations = asset.metadata.animations;
              }
              return result.meshes[0];
            });
          }),
          timeoutMs,
          function() {
            return buildAssetError({
              code: 'TIMEOUT',
              stage: 'load',
              key: key,
              message: 'Asset load timed out after ' + timeoutMs + 'ms',
              requestId: requestId,
              assetType: asset.type
            });
          }
        ).catch(function(error) {
          var loadError = error && error.code ? error : buildAssetError({
            code: 'LOAD_FAILED',
            stage: 'load',
            key: key,
            message: 'Failed to load 3D asset',
            requestId: requestId,
            assetType: asset.type
          });
          reportAssetError(loadError);
          return Promise.reject(loadError);
        });
      }

      // Handle skyboxes (equirectangular panorama images)
      if (asset.type === 'skybox' || (asset.type === '2d' && asset.metadata.skybox)) {
        var skyboxTimeout = (options && options.timeoutMs) ? options.timeoutMs : ASSET_CONFIG.timeoutMs;

        return withTimeout(
          resolveAssetUrl(key, asset, requestId).then(function(resolved) {
            if (!resolved.url) {
              var skyUrlError = buildAssetError({
                code: 'URL_MISSING',
                stage: 'resolve',
                key: key,
                message: 'No skybox URL available for asset',
                requestId: requestId,
                assetType: asset.type,
                source: resolved.source
              });
              reportAssetError(skyUrlError);
              throw skyUrlError;
            }

            var dome = new BABYLON.PhotoDome(
              key + '_skybox',
              resolved.url,
              { size: 1000 },
              scene
            );
            dome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
            console.log('[ASSETS] Loaded skybox asset: ' + key);
            return dome;
          }),
          skyboxTimeout,
          function() {
            return buildAssetError({
              code: 'TIMEOUT',
              stage: 'load',
              key: key,
              message: 'Skybox load timed out',
              requestId: requestId,
              assetType: asset.type
            });
          }
        ).catch(function(error) {
          var skyboxLoadError = error && error.code ? error : buildAssetError({
            code: 'LOAD_FAILED',
            stage: 'load',
            key: key,
            message: 'Failed to load skybox asset',
            requestId: requestId,
            assetType: asset.type
          });
          reportAssetError(skyboxLoadError);
          return Promise.reject(skyboxLoadError);
        });
      }

      // Handle 2D textures
      if (asset.type === '2d') {
        var textureUrl = asset.urls.model || asset.urls.thumbnail;
        if (!textureUrl) {
          var textureError = buildAssetError({
            code: 'URL_MISSING',
            stage: 'resolve',
            key: key,
            message: 'No texture URL available for asset',
            requestId: requestId,
            assetType: asset.type
          });
          reportAssetError(textureError);
          return Promise.reject(textureError);
        }

        return withTimeout(
          new Promise(function(resolve, reject) {
            var texture = new BABYLON.Texture(
              textureUrl,
              scene,
              false,
              false,
              BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
              function() {
                console.log('[ASSETS] Loaded 2D asset: ' + key);
                resolve(texture);
              },
              function(message) {
                reject(buildAssetError({
                  code: 'LOAD_FAILED',
                  stage: 'load',
                  key: key,
                  message: message || 'Failed to load 2D asset',
                  requestId: requestId,
                  assetType: asset.type
                }));
              }
            );
          }),
          (options && options.timeoutMs) ? options.timeoutMs : ASSET_CONFIG.timeoutMs,
          function() {
            return buildAssetError({
              code: 'TIMEOUT',
              stage: 'load',
              key: key,
              message: 'Asset load timed out',
              requestId: requestId,
              assetType: asset.type
            });
          }
        ).catch(function(error) {
          var textureLoadError = error && error.code ? error : buildAssetError({
            code: 'LOAD_FAILED',
            stage: 'load',
            key: key,
            message: 'Failed to load 2D asset',
            requestId: requestId,
            assetType: asset.type
          });
          reportAssetError(textureLoadError);
          return Promise.reject(textureLoadError);
        });
      }

      var typeError = buildAssetError({
        code: 'UNSUPPORTED_TYPE',
        stage: 'load',
        key: key,
        message: 'Unsupported asset type: ' + asset.type,
        requestId: requestId,
        assetType: asset.type
      });
      reportAssetError(typeError);
      return Promise.reject(typeError);
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
    (a.type === '2d' || a.type === '3d' || a.type === 'skybox')
  );
}
