/**
 * Tripo3D Prompt Builder for Asset Hatch
 *
 * Enhances 3D asset descriptions with project qualities, style anchors,
 * and Tripo-specific guidance for better generation results.
 *
 * This is a PURE function - settings are passed in, no database calls.
 * Database loading happens in the API route.
 *
 * Key enhancements:
 * - Mesh style (low poly, realistic, stylized)
 * - T-pose/A-pose for riggable characters
 * - Style keywords from style anchor
 * - Texture quality specifications
 * - Tripo-optimized formatting
 */

/**
 * 3D quality settings
 */
export interface Tripo3DQualitySettings {
  meshStyle: 'low-poly' | 'stylized' | 'realistic' | 'voxel' | 'blocky';
  textureQuality: 'standard' | 'high' | 'pbr';
  defaultShouldRig: boolean;
  defaultAnimations: string[];
}

/**
 * Style anchor keywords for 3D consistency
 */
export interface StyleAnchorInfo {
  styleKeywords: string;
  lightingKeywords: string;
  colorPalette: string[];
}

/**
 * Parameters for building a Tripo3D prompt
 */
export interface BuildTripoPromptParams {
  // The asset description from the plan
  description: string;
  // Asset name for context
  name: string;
  // Whether this asset should be rigged
  shouldRig: boolean;
  // Quality settings for this project
  qualitySettings: Tripo3DQualitySettings;
  // Style anchor info (optional)
  styleAnchor: StyleAnchorInfo | null;
}

/**
 * Result from building the Tripo3D prompt
 */
export interface TripoPromptResult {
  // The enhanced prompt ready for Tripo API
  prompt: string;
  // Settings that were used
  qualitySettings: Tripo3DQualitySettings;
  // Style anchor info that was used
  styleAnchor: StyleAnchorInfo | null;
}

/**
 * Get mesh style keywords for Tripo prompt
 */
function getMeshStyleKeywords(meshStyle: Tripo3DQualitySettings['meshStyle']): string[] {
  const styleMap: Record<Tripo3DQualitySettings['meshStyle'], string[]> = {
    'low-poly': [
      'low poly',
      'geometric shapes',
      'flat shading',
      'clean edges',
      'minimal detail',
    ],
    'stylized': [
      'stylized',
      'cartoon-like',
      'exaggerated proportions',
      'vibrant colors',
    ],
    'realistic': [
      'realistic',
      'high detail',
      'natural proportions',
      'realistic textures',
    ],
    'voxel': [
      'voxel style',
      'cubic blocks',
      'pixelated 3D',
      'Minecraft-like',
    ],
    'blocky': [
      'blocky',
      'angular geometry',
      'simplified forms',
      'clean geometry',
    ],
  };

  return styleMap[meshStyle] || styleMap['stylized'];
}

/**
 * Get pose specification for riggable assets
 */
function getPoseGuidance(shouldRig: boolean): string {
  if (!shouldRig) {
    return 'neutral standing pose';
  }

  // Tripo works best with T-pose or A-pose for rigging
  return 'T-pose, arms extended at sides, palms facing forward, standing straight';
}

/**
 * Get texture quality guidance
 */
function getTextureGuidance(
  textureQuality: Tripo3DQualitySettings['textureQuality']
): string {
  const qualityMap: Record<Tripo3DQualitySettings['textureQuality'], string> = {
    'standard': 'clean solid colors, simple shading',
    'high': 'detailed textures, subtle shading, high quality materials',
    'pbr': 'PBR materials, realistic metal and roughness, physically based lighting',
  };

  return qualityMap[textureQuality] || qualityMap['standard'];
}

/**
 * Build an enhanced Tripo3D prompt from asset parameters
 *
 * @param params - Asset description, name, rigging flag, quality settings, and style anchor
 * @returns Enhanced prompt and the settings used
 *
 * @example
 * ```typescript
 * const { prompt } = buildTripoPrompt({
 *   description: 'Armored knight with sword and shield',
 *   name: 'Knight Character',
 *   shouldRig: true,
 *   qualitySettings: { meshStyle: 'low-poly', textureQuality: 'standard', ... },
 *   styleAnchor: { styleKeywords: 'pixel art', lightingKeywords: '', colorPalette: [] }
 * });
 * // Output: "Armored knight with sword and shield, low poly, T-pose...
 * ```
 */
export function buildTripoPrompt(
  params: BuildTripoPromptParams
): TripoPromptResult {
  const { description, name, shouldRig, qualitySettings, styleAnchor } = params;

  const parts: string[] = [];

  // 1. CORE SUBJECT (highest priority in Tripo's attention)
  // Tripo focuses on the first description, so lead with the actual subject
  parts.push(description);

  // 2. MESH STYLE (critical for visual consistency)
  const styleKeywords = getMeshStyleKeywords(qualitySettings.meshStyle);
  parts.push(...styleKeywords);

  // 3. POSE GUIDANCE (essential for riggable assets)
  parts.push(getPoseGuidance(shouldRig));

  // 4. STYLE ANCHOR KEYWORDS (if available)
  if (styleAnchor?.styleKeywords) {
    // Add style anchor keywords as natural language
    const anchorStyle = styleAnchor.styleKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
    if (anchorStyle) {
      parts.push(anchorStyle);
    }
  }

  // 5. COLOR PALETTE (if available)
  if (styleAnchor?.colorPalette && styleAnchor.colorPalette.length > 0) {
    const paletteText = styleAnchor.colorPalette.slice(0, 6).join(', ');
    parts.push(`color palette: ${paletteText}`);
  }

  // 6. LIGHTING (from style anchor or defaults)
  if (styleAnchor?.lightingKeywords) {
    parts.push(styleAnchor.lightingKeywords);
  } else {
    // Default lighting guidance for 3D
    parts.push('even lighting, soft shadows');
  }

  // 7. TEXTURE QUALITY
  parts.push(getTextureGuidance(qualitySettings.textureQuality));

  // 8. TRIPO-SPECIFIC OPTIMIZATIONS
  // These help Tripo understand what we want
  parts.push('game-ready asset');
  parts.push('centered in frame');
  parts.push('suitable for real-time rendering');

  // 9. CAMERA/VIEW (optional guidance)
  // Suggest a neutral camera angle for 3D models
  parts.push('neutral camera angle');
  parts.push('fit to frame');

  // Join all parts with commas for natural language processing
  const prompt = parts.filter(Boolean).join(', ');

  console.log('🎨 Tripo prompt built:', {
    name,
    meshStyle: qualitySettings.meshStyle,
    hasStyleAnchor: !!styleAnchor,
    promptLength: prompt.length,
  });

  return {
    prompt,
    qualitySettings,
    styleAnchor,
  };
}

/**
 * Build a minimal Tripo prompt (fallback when no settings available)
 */
export function buildMinimalTripoPrompt(
  description: string,
  name: string,
  shouldRig: boolean
): string {
  const parts: string[] = [
    description,
    'stylized',
    shouldRig ? 'T-pose' : 'neutral standing pose',
    'game-ready asset',
    'centered in frame',
    'single isolated object',
  ];

  return parts.filter(Boolean).join(', ');
}
