/**
 * Hatch Studios Preview Library Manifest
 *
 * This file defines the libraries pre-loaded in the preview iframe.
 * The AI can use these libraries without needing to load them.
 *
 * When generating code, the AI should reference this manifest
 * to use appropriate libraries for the game being created.
 */

// =============================================================================
// SCRIPT LOAD TRACKING TYPES
// =============================================================================

/**
 * Metadata for a script that will be loaded in the preview iframe.
 * Used for generating script tags with proper error handling.
 */
export interface ScriptLoadInfo {
  /** Full URL to the script CDN */
  src: string;
  /** Short name for identification (e.g., 'babylon', 'havok') */
  name: string;
  /** Whether this script is required for the preview to function */
  required: boolean;
  /** The global variable this script creates (e.g., 'BABYLON', 'HavokPhysics') */
  global?: string;
}

// =============================================================================
// PRE-LOADED LIBRARIES
// =============================================================================
// These libraries are automatically available in the preview iframe:
// No need to include <script> tags or load them - just use them!

export const PREVIEW_LIBRARIES = {
  // Core
  babylon: {
    cdn: 'https://cdn.babylonjs.com/babylon.js',
    global: 'BABYLON',
    description: 'Core Babylon.js engine - always available',
    required: true,
  },

  // Physics (Havok)
  havok: {
    cdn: 'https://cdn.babylonjs.com/havok/HavokPhysics_umd.js',
    global: 'HavokPhysics',
    description: 'Havok physics WASM/JS runtime',
    whenToUse: [
      'Rigid body physics',
      'PhysicsAggregate usage',
      'Collision-enabled gameplay',
    ],
  },

  // UI System
  babylonGUI: {
    cdn: 'https://cdn.babylonjs.com/gui/babylon.gui.min.js',
    global: 'BABYLON.GUI',
    description: '2D UI/HUD system for games (TextBlocks, buttons, panels)',
    whenToUse: [
      'Score displays',
      'Health bars',
      'Game menus',
      'Instruction text',
      'Control prompts',
    ],
    example: `
const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
const text = new BABYLON.GUI.TextBlock();
text.text = "Score: 0";
text.color = "white";
text.fontSize = 24;
adt.addControl(text);
    `,
  },

  // 3D Model Loading
  loaders: {
    cdn: 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
    global: 'BABYLON',
    description: 'GLTF/GLB model loaders for importing external 3D models',
    whenToUse: [
      'Loading character models',
      'Loading environment assets',
      'Importing GLB files',
    ],
    example: `
BABYLON.SceneLoader.ImportMesh("", "./models/", "character.glb", scene, function(newMeshes) {
  const player = newMeshes[0];
});
    `,
  },

  // Procedural Textures
  proceduralTextures: {
    cdn: 'https://cdn.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js',
    global: 'BABYLON',
    description: 'Procedural texture generators (noise, fire, water, etc.)',
    whenToUse: [
      'Fire effects',
      'Water shaders',
      'Noise textures',
      'Marble/stone patterns',
    ],
    example: `
const fireTexture = new BABYLON.FireProceduralTexture("fire", 256, scene);
material.emissiveTexture = fireTexture;
    `,
  },

  // Materials Library
  materials: {
    cdn: 'https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js',
    global: 'BABYLON',
    description: 'Advanced materials (PBR, water, sky, fire, etc.)',
    whenToUse: [
      'PBR materials',
      'Water surfaces',
      'Skyboxes',
      'Fire effects',
    ],
    example: `
const water = new BABYLON.WaterMaterial("water", scene);
water.backFaceCulling = true;
ground.material = water;
    `,
  },

  // Particle Systems
  particles: {
    cdn: null, // Included in core babylon.js
    global: 'BABYLON.ParticleSystem',
    description: 'Particle effects (smoke, fire, trails, explosions)',
    whenToUse: [
      'Engine trails',
      'Explosions',
      ' Smoke effects',
      'Rain/snow',
      'Collectible effects',
    ],
    example: `
const particles = new BABYLON.ParticleSystem("particles", 500, scene);
particles.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
particles.emitter = playerMesh;
particles.emitRate = 100;
particles.start();
    `,
  },
};

// =============================================================================
// LIBRARY USAGE RULES
// =============================================================================

export const LIBRARY_USAGE_RULES = [
  {
    feature: '2D UI/HUD',
    libraries: ['babylonGUI'],
    rule: 'ALWAYS use BABYLON.GUI for in-game UI (score, health, menus)',
    avoid: 'Do not use HTML/CSS overlays - they may not render in iframe',
  },
  {
    feature: '3D Models',
    libraries: ['loaders'],
    rule: 'Use SceneLoader.ImportMesh for GLB/GLTF files',
    avoid: 'Do not assume models exist - use primitives as fallback',
  },
  {
    feature: 'Particle Effects',
    libraries: ['particles'],
    rule: 'Use ParticleSystem for trails, explosions, effects',
    note: 'ParticleSystem is built into core BABYLON',
  },
  {
    feature: 'Procedural Textures',
    libraries: ['proceduralTextures'],
    rule: 'Use for fire, water, noise textures without external images',
  },
  {
    feature: 'Advanced Materials',
    libraries: ['materials'],
    rule: 'Use WaterMaterial, SkyMaterial, FireMaterial for special effects',
  },
  {
    feature: 'Physics',
    libraries: ['havok'],
    rule: 'Use HavokPlugin for physics (configured separately)',
    note: 'Havok requires async initialization - use HavokPhysics() then scene.enablePhysics()',
  },
];

// =============================================================================
// QUICK REFERENCE FOR AI
// =============================================================================

export const QUICK_LIBRARY_REFERENCE = `
QUICK LIBRARY REFERENCE:

UI/HUD -> BABYLON.GUI
   BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI")
   BABYLON.GUI.TextBlock, Button, Slider, etc.

3D Models -> BABYLON.SceneLoader (loaders library)
   BABYLON.SceneLoader.ImportMesh("", url, file, scene, callback)

Particles -> BABYLON.ParticleSystem (core)
   new BABYLON.ParticleSystem(name, capacity, scene)

Water/Fire/Sky -> Babylon Materials Library
   BABYLON.WaterMaterial, BABYLON.SkyMaterial

Procedural Textures -> ProceduralTextures Library
   BABYLON.FireProceduralTexture, BABYLON.NoiseProceduralTexture

All libraries are PRE-LOADED - just use them directly!
`;

// =============================================================================
// CDNS TO INCLUDE IN IFRAME (BACKWARDS COMPATIBLE)
// =============================================================================

export const IFRAME_SCRIPTS = [
  // Core engine (required)
  'https://cdn.babylonjs.com/babylon.js',

  // Physics (Havok)
  'https://cdn.babylonjs.com/havok/HavokPhysics_umd.js',

  // UI System (commonly needed)
  'https://cdn.babylonjs.com/gui/babylon.gui.min.js',

  // Model loaders (for GLTF/GLB)
  'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',

  // Procedural textures
  'https://cdn.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js',

  // Advanced materials (water, sky, fire)
  'https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js',
];

// =============================================================================
// DETAILED SCRIPT METADATA FOR ERROR HANDLING
// =============================================================================

/**
 * Detailed metadata for each script loaded in the preview iframe.
 * Used by generateScriptTagsWithErrorHandling() to create script tags
 * with proper onload/onerror handlers for debugging.
 */
export const IFRAME_SCRIPTS_DETAILED: ScriptLoadInfo[] = [
  {
    src: 'https://cdn.babylonjs.com/babylon.js',
    name: 'babylon',
    required: true,
    global: 'BABYLON',
  },
  {
    src: 'https://cdn.babylonjs.com/havok/HavokPhysics_umd.js',
    name: 'havok',
    required: false,
    global: 'HavokPhysics',
  },
  {
    src: 'https://cdn.babylonjs.com/gui/babylon.gui.min.js',
    name: 'babylon-gui',
    required: false,
    global: 'BABYLON.GUI',
  },
  {
    src: 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
    name: 'babylon-loaders',
    required: false,
    global: 'BABYLON.SceneLoader',
  },
  {
    src: 'https://cdn.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js',
    name: 'babylon-procedural-textures',
    required: false,
    global: 'BABYLON.FireProceduralTexture',
  },
  {
    src: 'https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js',
    name: 'babylon-materials',
    required: false,
    global: 'BABYLON.WaterMaterial',
  },
];

// =============================================================================
// SCRIPT TAG GENERATION WITH ERROR HANDLING
// =============================================================================

/**
 * Generates HTML script tags with onload/onerror handlers for tracking
 * which scripts loaded successfully and which failed.
 *
 * The generated HTML includes:
 * 1. An initial script block that sets up SCRIPT_STATUS, SCRIPTS_LOADED, and SCRIPTS_FAILED
 * 2. Script tags with onload/onerror handlers that:
 *    - Log load status to console
 *    - Track status in window.SCRIPT_STATUS
 *    - Push to SCRIPTS_LOADED or SCRIPTS_FAILED arrays
 *    - Post messages to parent window on error (for required scripts)
 *
 * @param parentOrigin - The origin to use for postMessage (default: '*')
 * @returns HTML string containing all script tags with error handling
 */
export function generateScriptTagsWithErrorHandling(parentOrigin: string = '*'): string {
  // Initial script block to set up tracking variables
  const initScript = `<script>
  // Script load tracking - initialized before any external scripts load
  window.SCRIPT_STATUS = {};
  window.SCRIPTS_FAILED = [];
  window.SCRIPTS_LOADED = [];
</script>`;

  // Generate individual script tags with handlers
  const scriptTags = IFRAME_SCRIPTS_DETAILED.map((script) => {
    // Extract readable name from URL (e.g., 'babylon.js' from full CDN URL)
    const fileName = script.src.split('/').pop() || script.name;

    // Build onload handler - logs success and updates tracking
    const onloadHandler = [
      `window.SCRIPTS_LOADED.push('${script.name}')`,
      `window.SCRIPT_STATUS['${script.name}']=true`,
      `console.log('[PREVIEW] Loaded: ${fileName}')`,
    ].join('; ');

    // Build onerror handler - logs failure, updates tracking, and notifies parent
    const onerrorHandler = [
      `window.SCRIPTS_FAILED.push('${script.name}')`,
      `window.SCRIPT_STATUS['${script.name}']=false`,
      `console.error('[PREVIEW] Failed to load: ${fileName}')`,
      `window.parent.postMessage({type:'script-error',script:'${script.name}',src:'${script.src}',required:${script.required}},'${parentOrigin}')`,
    ].join('; ');

    return `<script
  src="${script.src}"
  onload="${onloadHandler}"
  onerror="${onerrorHandler}"
></script>`;
  }).join('\n');

  return `${initScript}\n${scriptTags}`;
}

// =============================================================================
// LIBRARY AVAILABILITY CHECK SCRIPT
// =============================================================================

/**
 * Generates JavaScript code that checks if each library loaded successfully
 * by verifying the existence of their global variables.
 *
 * The generated script:
 * 1. Creates a LIBRARIES object with availability status for each library
 * 2. Checks if required libraries are missing and reports to parent
 * 3. Logs a summary of library availability to the console
 *
 * This should be included AFTER all script tags have had a chance to load.
 *
 * @returns JavaScript code string (without script tags)
 */
export function generateLibraryCheckScript(): string {
  // Build checks for each library's global variable
  const libraryChecks = IFRAME_SCRIPTS_DETAILED.map((script) => {
    // Handle nested globals like 'BABYLON.GUI' by checking the chain
    const globalParts = (script.global || '').split('.');
    let checkExpression: string;

    if (globalParts.length === 1 && globalParts[0]) {
      // Simple global like 'BABYLON' or 'HavokPhysics'
      checkExpression = `typeof ${globalParts[0]} !== 'undefined'`;
    } else if (globalParts.length > 1) {
      // Nested global like 'BABYLON.GUI' - check each level
      const checks = globalParts.map((_, index) => {
        const path = globalParts.slice(0, index + 1).join('.');
        return `typeof ${path} !== 'undefined'`;
      });
      checkExpression = checks.join(' && ');
    } else {
      // No global specified - check SCRIPT_STATUS instead
      checkExpression = `window.SCRIPT_STATUS['${script.name}'] === true`;
    }

    return `    '${script.name}': { available: ${checkExpression}, required: ${script.required}, global: '${script.global || ''}' }`;
  }).join(',\n');

  // Build the required libraries check
  const requiredLibraries = IFRAME_SCRIPTS_DETAILED
    .filter((s) => s.required)
    .map((s) => `'${s.name}'`);

  return `// Library availability check - run after scripts have loaded
(function() {
  // Check each library's global variable to confirm it loaded
  window.LIBRARIES = {
${libraryChecks}
  };

  // Find any required libraries that failed to load
  var requiredLibs = [${requiredLibraries.join(', ')}];
  var missingRequired = requiredLibs.filter(function(name) {
    return !window.LIBRARIES[name] || !window.LIBRARIES[name].available;
  });

  // Report missing required libraries to parent
  if (missingRequired.length > 0) {
    console.error('[PREVIEW] Missing required libraries:', missingRequired);
    window.parent.postMessage({
      type: 'libraries-missing',
      missing: missingRequired,
      all: window.LIBRARIES
    }, '*');
  }

  // Log summary to console for debugging
  var loadedCount = Object.keys(window.LIBRARIES).filter(function(k) {
    return window.LIBRARIES[k].available;
  }).length;
  var totalCount = Object.keys(window.LIBRARIES).length;
  console.log('[PREVIEW] Libraries loaded: ' + loadedCount + '/' + totalCount);

  // Notify parent that library check is complete
  window.parent.postMessage({
    type: 'libraries-checked',
    libraries: window.LIBRARIES,
    loaded: window.SCRIPTS_LOADED,
    failed: window.SCRIPTS_FAILED
  }, '*');
})();`;
}
