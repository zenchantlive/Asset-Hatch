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
    note: 'Havok requires WASM initialization - use scene.enablePhysics()',
  },
];

// =============================================================================
// QUICK REFERENCE FOR AI
// =============================================================================

export const QUICK_LIBRARY_REFERENCE = `
QUICK LIBRARY REFERENCE:

🎨 UI/HUD → BABYLON.GUI
   BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI")
   BABYLON.GUI.TextBlock, Button, Slider, etc.

🎬 3D Models → BABYLON.SceneLoader (loaders library)
   BABYLON.SceneLoader.ImportMesh("", url, file, scene, callback)

🔥 Particles → BABYLON.ParticleSystem (core)
   new BABYLON.ParticleSystem(name, capacity, scene)

🌊 Water/Fire/Sky → Babylon Materials Library
   BABYLON.WaterMaterial, BABYLON.SkyMaterial

🎨 Procedural Textures → ProceduralTextures Library
   BABYLON.FireProceduralTexture, BABYLON.NoiseProceduralTexture

All libraries are PRE-LOADED - just use them directly!
`;

// =============================================================================
// CDNS TO INCLUDE IN IFRAME
// =============================================================================

export const IFRAME_SCRIPTS = [
  // Core engine (required)
  'https://cdn.babylonjs.com/babylon.js',
  
  // UI System (commonly needed)
  'https://cdn.babylonjs.com/gui/babylon.gui.min.js',
  
  // Model loaders (for GLTF/GLB)
  'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
  
  // Procedural textures
  'https://cdn.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js',
  
  // Advanced materials (water, sky, fire)
  'https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js',
];
