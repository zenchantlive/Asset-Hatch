/**
 * Shared URL Utilities for Asset Loading
 * 
 * Provides consistent URL parsing and handling for:
 * - Babylon.js SceneLoader compatibility with proxy URLs
 * - URL validation and query parameter detection
 */

/**
 * Check if a URL contains query parameters
 * 
 * @param url - The URL to check
 * @returns true if URL contains '?'
 */
export function hasQueryParams(url: string): boolean {
  return url.includes('?');
}

/**
 * Parse a URL into root (directory) and file components for Babylon.js SceneLoader
 * 
 * CRITICAL: Handles proxy URLs with query parameters correctly.
 * Babylon.js SceneLoader.ImportMeshAsync(rootUrl, sceneFilename, scene, onSuccess, extensions, fileFormat)
 * constructs: finalUrl = rootUrl + sceneFilename + fileFormat
 * 
 * For URLs with query parameters (e.g., proxy URLs with auth tokens), splitting at '/'
 * causes the extension to be appended AFTER the query string:
 *   "proxy?token=abc" + ".glb" = "proxy?token=abc.glb" ❌ WRONG
 * 
 * By returning an empty root and full URL as file for query URLs:
 *   "" + "proxy?token=abc" + ".glb" = "proxy?token=abc" ✅ CORRECT
 * 
 * For regular URLs, SceneLoader correctly treats them as absolute paths when root is empty.
 *
 * @param url - The URL to parse
 * @returns Object with root and file components
 * 
 * @example
 * // Proxy URL with query params
 * parseUrlParts("http://host/api/proxy?token=abc")
 * // Returns: { root: '', file: 'http://host/api/proxy?token=abc' }
 * 
 * @example
 * // Regular URL without query params
 * parseUrlParts("https://cdn.example.com/model.glb")
 * // Returns: { root: 'https://cdn.example.com/', file: 'model.glb' }
 */
export function parseUrlParts(url: string): { root: string; file: string } {
  // URLs with query parameters must be handled specially
  // SceneLoader.ImportMeshAsync(root, file, ...) appends '.glb' to file
  // If we split proxy URLs incorrectly, we get: proxy?token=...glb
  if (hasQueryParams(url)) {
    // For proxy URLs with query params, use empty root and full URL as file
    // SceneLoader will use: root="" + file=URL + extension=".glb"
    // This correctly produces: http://host/api/proxy?token=...
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
}

/**
 * Generate JavaScript code for parseUrlParts (for iframe injection)
 * 
 * This returns a string version of parseUrlParts that can be injected
 * directly into the iframe's JavaScript context.
 * 
 * @returns JavaScript code for parseUrlParts function
 */
export function generateParseUrlPartsCode(): string {
  return `
// =============================================================================
// parseUrlParts - URL parsing for Babylon.js SceneLoader
// Generated from shared URL utilities
// =============================================================================
function parseUrlParts(url) {
  // URLs with query parameters must be handled specially
  // SceneLoader.ImportMeshAsync(root, file, ...) appends '.glb' to file
  if (url.includes('?')) {
    // For proxy URLs with query params, use empty root and full URL as file
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
}
  `.trim();
}

/**
 * Generate JavaScript code for SceneLoader URL construction
 * 
 * This generates the correct SceneLoader call based on whether the URL
 * has query parameters.
 * 
 * @param url - The asset URL
 * @param sceneVar - The Babylon.js scene variable name
 * @param meshVar - The variable name to store the loaded mesh
 * @returns JavaScript code for loading the asset
 */
export function generateSceneLoaderCode(
  url: string,
  sceneVar: string = 'scene',
  meshVar: string = 'mesh'
): string {
  if (hasQueryParams(url)) {
    // Proxy URL: use empty root and file for SceneLoader
    return `BABYLON.SceneLoader.ImportMeshAsync("", "", "${url}", ${sceneVar})
      .then((result) => { ${meshVar} = result.meshes[0]; })
      .catch((error) => { console.error("Failed to load asset:", error); });`;
  }

  // Regular URL: split at last /
  const parts = parseUrlParts(url);
  return `BABYLON.SceneLoader.ImportMeshAsync("", "${parts.root}", "${parts.file}", ${sceneVar})
    .then((result) => { ${meshVar} = result.meshes[0]; })
    .catch((error) => { console.error("Failed to load asset:", error); });`;
}
