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
import { generateControlsHelperScript } from "./controls-helper";
import { generateParseUrlPartsCode } from "./url-utils";

export interface AssetLoaderScriptOptions {
  gameId?: string;
  timeoutMs?: number;
  resolveTimeoutMs?: number;
  debug?: boolean;
}

/**
 * Generate JavaScript code for ASSETS global helper
 * This is injected into the iframe before user code executes
 */
export function generateAssetLoaderScript(
  assets: AssetInfo[],
  options: AssetLoaderScriptOptions = {},
  parentOrigin: string = '*'
): string {
  const assetsJson = JSON.stringify(assets, null, 2);
  const configJson = JSON.stringify(
    {
      gameId: options.gameId || null,
      timeoutMs: options.timeoutMs ?? 8000,
      resolveTimeoutMs: options.resolveTimeoutMs ?? 6000,
      parentOrigin: parentOrigin,
      debug: options.debug ?? false,
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
  // Deduplication map: key -> Promise to prevent multiple parallel requests for same asset
  const PENDING_RESOLVES = new Map();

  // Initialize registry with assets
  ${assetsJson}.forEach(function(asset) {
    ASSET_REGISTRY.set(asset.key, asset);
  });

  // Debug logging helper - only logs when debug mode is enabled
  function debugLog(stage, message, data) {
    if (!ASSET_CONFIG.debug) return;
    if (data !== undefined) {
      console.log('[ASSETS:DEBUG] [' + stage + '] ' + message, data);
    } else {
      console.log('[ASSETS:DEBUG] [' + stage + '] ' + message);
    }
  }

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
    debugLog('error', 'Full error details:', error);

    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'asset-error',
        requestId: error.requestId,
        code: error.code,
        stage: error.stage,
        key: error.key,
        message: error.message
      }, ASSET_CONFIG.parentOrigin);
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
        debugLog('timeout', 'Operation timed out after ' + timeoutMs + 'ms');
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

  // Use shared parseUrlParts from url-utils
  ${generateParseUrlPartsCode()}


  function registerResolveListener() {
    if (registerResolveListener.initialized) return;
    registerResolveListener.initialized = true;
    debugLog('init', 'Registering postMessage listener for asset resolution');

    window.addEventListener('message', function(event) {
      const data = event.data;
      if (event.source !== window.parent) return;

      // Validate origin - accept messages from the configured parent origin
      // For srcdoc iframes, window.location.origin is 'null' but event.origin 
      // is the PARENT's origin (e.g., 'http://localhost:3000').
      // We must accept messages from parentOrigin, not the iframe's own origin.
      var parentOrigin = ASSET_CONFIG.parentOrigin;
      var isValidOrigin = (
        parentOrigin === '*' ||  // Wildcard allows any origin
        event.origin === parentOrigin ||  // Exact match with configured parent
        event.origin === 'null'  // Allow 'null' origin for edge cases
      );
      if (!isValidOrigin) {
        debugLog('resolve', 'Rejected message from unexpected origin: ' + event.origin + ' (expected: ' + parentOrigin + ')');
        return;
      }

      if (!data || data.type !== 'asset-resolve-response') return;
      const requestId = data.requestId;
      if (!requestId) return;

      debugLog('resolve', 'Received postMessage response for requestId: ' + requestId, {
        success: data.success,
        url: data.url ? (data.url.substring(0, 80) + '...') : null,
        source: data.source,
        error: data.error
      });

      const resolver = RESOLVE_REQUESTS.get(requestId);
      if (!resolver) {
        debugLog('resolve', 'No pending resolver found for requestId: ' + requestId);
        return;
      }
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
    debugLog('resolve', 'Requesting URL from parent for key: ' + key, { requestId: requestId });

    return new Promise(function(resolve, reject) {
      RESOLVE_REQUESTS.set(requestId, { resolve: resolve, reject: reject });
      if (window.parent && window.parent.postMessage) {
        var message = {
          type: 'asset-resolve-request',
          requestId: requestId,
          key: key
        };
        debugLog('resolve', 'Sending postMessage to parent', message);
        window.parent.postMessage(message, ASSET_CONFIG.parentOrigin);
      } else {
        debugLog('resolve', 'Parent window unavailable - cannot resolve asset');
        RESOLVE_REQUESTS.delete(requestId);
        reject({
          success: false,
          error: 'PARENT_UNAVAILABLE'
        });
      }
    });
  }

  function resolveAssetUrl(key, asset, requestId, fallbackCandidate) {
    const candidate = fallbackCandidate || asset.urls.glb || asset.urls.model;

    debugLog('resolve', 'Starting URL resolution for key: ' + key, {
      hasCandidate: !!candidate,
      isDataUrl: candidate ? candidate.startsWith('data:') : false,
      hasGameId: !!ASSET_CONFIG.gameId,
      hasPendingResolve: PENDING_RESOLVES.has(key)
    });

    // Fast path: data URLs don't need resolution
    if (candidate && candidate.startsWith('data:')) {
      debugLog('resolve', 'Using data URL directly (no parent resolution needed)');
      return Promise.resolve({ url: candidate, source: 'data' });
    }

    // Fast path: no gameId means use manifest URL directly
    if (!ASSET_CONFIG.gameId) {
      debugLog('resolve', 'No gameId configured - using manifest URL', { url: candidate });
      return Promise.resolve({ url: candidate || null, source: 'manifest' });
    }

    // DEDUPLICATION: If a resolve request is already in flight for this asset key,
    // reuse that promise instead of creating a new request.
    // This prevents race conditions where multiple parallel requests result in some timing out.
    if (PENDING_RESOLVES.has(key)) {
      debugLog('resolve', 'Reusing pending resolve promise for key: ' + key);
      return PENDING_RESOLVES.get(key);
    }

    debugLog('resolve', 'Requesting URL from parent (gameId: ' + ASSET_CONFIG.gameId + ')');

    // Create the actual resolve promise
    var resolvePromise = withTimeout(
      requestResolveFromParent(key, requestId),
      ASSET_CONFIG.resolveTimeoutMs,
      function() {
        RESOLVE_REQUESTS.delete(requestId);
        debugLog('resolve', 'Resolution request timed out after ' + ASSET_CONFIG.resolveTimeoutMs + 'ms');
        return {
          success: false,
          error: 'RESOLVE_TIMEOUT'
        };
      }
    ).then(function(response) {
      if (response && response.url) {
        debugLog('resolve', 'Got resolved URL', {
          url: response.url.substring(0, 80) + '...',
          source: response.source || 'resolver'
        });
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
    }).finally(function() {
      // Clean up the pending resolve map when done (success or failure)
      PENDING_RESOLVES.delete(key);
      debugLog('resolve', 'Cleaned up pending resolve for key: ' + key);
    });

    // Store in pending map so other callers can reuse this promise
    PENDING_RESOLVES.set(key, resolvePromise);

    return resolvePromise;
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

      debugLog('load', 'Loading asset: ' + key, {
        type: asset ? asset.type : 'unknown',
        requestId: requestId,
        hasScene: !!scene
      });

      if (!asset) {
        debugLog('load', 'Asset not found in registry: ' + key, {
          availableKeys: Array.from(ASSET_REGISTRY.keys())
        });
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
        debugLog('load', 'Loading 3D asset with timeout: ' + timeoutMs + 'ms');

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
              debugLog('babylon', 'Importing mesh from data URL (length: ' + resolved.url.length + ')');
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
              debugLog('babylon', 'Importing mesh from URL', {
                root: urlParts.root,
                file: urlParts.file
              });
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
              debugLog('load', 'Successfully loaded 3D asset: ' + key, {
                meshCount: result.meshes ? result.meshes.length : 0,
                hasAnimations: !!(asset.metadata && asset.metadata.animations)
              });
              console.log('[ASSETS] Loaded 3D asset: ' + key);

              // Guard against missing meshes
              if (!result.meshes || result.meshes.length === 0) {
                console.warn('[ASSETS] GLB loaded but contains no meshes: ' + key);
                debugLog('load', 'Warning: GLB contains no meshes');
                return null;
              }

              // Return the root node (usually meshes[0])
              var rootNode = result.meshes[0];

              // Attach animations metadata if it exists
              if (asset.metadata && asset.metadata.animations) {
                rootNode.metadata = rootNode.metadata || {};
                rootNode.metadata.animations = asset.metadata.animations;
              }

              return rootNode;
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
          debugLog('load', 'Failed to load 3D asset: ' + key, {
            errorCode: error && error.code,
            errorMessage: error && error.message
          });
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
      if (asset.type === 'skybox') {
        var skyboxTimeout = (options && options.timeoutMs) ? options.timeoutMs : ASSET_CONFIG.timeoutMs;
        debugLog('load', 'Loading skybox asset with timeout: ' + skyboxTimeout + 'ms');

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

            debugLog('babylon', 'Creating PhotoDome for skybox: ' + key, {
              url: resolved.url.substring(0, 80) + '...'
            });
            var dome = new BABYLON.PhotoDome(
              key + '_skybox',
              resolved.url,
              { size: 1000 },
              scene
            );
            dome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
            debugLog('load', 'Successfully loaded skybox asset: ' + key);
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
          debugLog('load', 'Failed to load skybox asset: ' + key, {
            errorCode: error && error.code,
            errorMessage: error && error.message
          });
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
        debugLog('load', 'Loading 2D texture asset: ' + key);

        return withTimeout(
          resolveAssetUrl(key, asset, requestId, asset.urls.model || asset.urls.thumbnail).then(function(resolved) {
            if (!resolved.url) {
              var textureError = buildAssetError({
                code: 'URL_MISSING',
                stage: 'resolve',
                key: key,
                message: 'No texture URL available for asset',
                requestId: requestId,
                assetType: asset.type,
                source: resolved.source
              });
              reportAssetError(textureError);
              throw textureError;
            }

            debugLog('babylon', 'Creating Texture for 2D asset: ' + key, {
              url: resolved.url.substring(0, 80) + '...'
            });
            return new Promise(function(resolve, reject) {
              var texture = new BABYLON.Texture(
                resolved.url,
                scene,
                false,
                false,
                BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                function() {
                  debugLog('load', 'Successfully loaded 2D asset: ' + key);
                  console.log('[ASSETS] Loaded 2D asset: ' + key);
                  resolve(texture);
                },
                function(message) {
                  debugLog('load', 'Failed to load 2D asset: ' + key, { message: message });
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
            });
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
          debugLog('load', 'Failed to load 2D asset: ' + key, {
            errorCode: error && error.code,
            errorMessage: error && error.message
          });
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

      debugLog('load', 'Unsupported asset type: ' + asset.type);
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

  debugLog('init', 'Debug mode enabled - verbose logging active');
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

/**
 * Generate combined ASSETS + CONTROLS helper script for iframe injection
 * 
 * This is the preferred method - includes bulletproof input handling
 * so agents don't need to write input code from scratch.
 * 
 * @param assets - Asset manifest entries
 * @param options - Configuration options
 * @param parentOrigin - Parent window origin for postMessage
 * @returns Combined JavaScript code string for iframe injection
 */
export function generateCombinedHelperScript(
  assets: AssetInfo[],
  options: AssetLoaderScriptOptions = {},
  parentOrigin: string = '*'
): string {
  // Generate ASSETS helper
  const assetsScript = generateAssetLoaderScript(assets, options, parentOrigin);

  // Generate CONTROLS helper
  const controlsScript = generateControlsHelperScript();

  // Combine both scripts
  return `
// =============================================================================
// HATCH STUDIOS RUNTIME HELPERS
// Includes: ASSETS (asset loading) + CONTROLS (input handling)
// =============================================================================

${assetsScript}

${controlsScript}

console.log('✅ Hatch Studios helpers loaded: ASSETS + CONTROLS');
  `.trim();
}

