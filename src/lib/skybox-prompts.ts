/**
 * Skybox Prompt Engineering
 * 
 * FLUX2-optimized prompt builder for seamless 360-degree equirectangular skyboxes.
 * Based on FLUX2 prompt engineering guide and seamlessness requirements.
 * 
 * Key principles:
 * - First 5 words = highest priority (FLUX2 rule)
 * - Explicit seamlessness keywords for edge matching
 * - Color/lighting consistency across 360 degrees
 * - Technical specifications for proper equirectangular format
 */

// =============================================================================
// Types
// =============================================================================

export interface SkyboxPromptOptions {
    // User's scene description
    userPrompt: string;
    // Optional preset type
    preset?: SkyboxPreset;
    // Style anchor for color/lighting consistency
    styleAnchor?: {
        colorPalette?: string[];
        styleKeywords?: string;
        lightingKeywords?: string;
    };
}

export type SkyboxPreset =
    | 'sunset'
    | 'noon'
    | 'night'
    | 'cloudy'
    | 'desert'
    | 'space'
    | 'forest'
    | 'underwater'
    | 'storm'
    | 'alien'
    | 'custom';

// =============================================================================
// Preset Descriptions
// =============================================================================

/**
 * FLUX2-optimized preset descriptions for common skybox types.
 * Each preset emphasizes far-horizon atmospheric and celestial elements.
 */
export const SKYBOX_PRESETS: Record<SkyboxPreset, string> = {
    sunset: "unobstructed warm orange and pink sunset gradient transitioning to deep purple twilight, far-horizon atmospheric glow",
    noon: "expansive midday sky with intense blue zenith fading to pale horizon, pure atmospheric background vista",
    night: "deep indigo night sky backdrop with tiny distant stars and subtle nebula formations, pure celestial atmosphere",
    cloudy: "unobstructed expansive overcast sky with distant gray cloud formations, far-horizon atmospheric perspective",
    desert: "far-horizon desert sky vista with distant heat haze and dusty atmosphere, pure background sky backdrop",
    space: "deep space celestial backdrop with tiny distant stars, far away planets, and cosmic nebulae, unobstructed infinity vista",
    forest: "distant forest canopy skyline gaps showing pure atmospheric sky, far-horizon background lighting",
    underwater: "deep underwater background gradient with distant caustic light patterns, far-horizon aqueous atmosphere",
    storm: "unobstructed dramatic storm clouds backdrop, far-horizon atmospheric lightning illumination",
    alien: "otherworldly alien sky backdrop with distant celestial phenomena, far-horizon atmospheric perspective",
    custom: "" // User provides full description
};

// =============================================================================
// Seamlessness and Composition Keywords
// =============================================================================

/**
 * Compositional keywords to ensure skybox-only content (no midground objects).
 * Framed positively for FLUX2.
 */
const BACKGROUND_FOCUS_KEYWORDS = [
    "pure skybox backdrop",
    "unobstructed far-horizon atmospheric vista",
    "distant background elements only",
    "unobstructed infinity-focus perspective",
    "far-horizon celestial formations",
] as const;

/**
 * Critical keywords for ensuring perfect 360-degree seamlessness.
 * These tell FLUX2 to mathematically match edges.
 */
const SEAMLESSNESS_KEYWORDS = [
    "seamless equirectangular 360-degree panorama",
    "2:1 aspect ratio with perfect horizontal wrapping",
    "perfect edge matching",
    "360-degree continuity",
    "seamless horizontal tiling",
    "no visible boundary artifacts",
    "smooth wrap-around transition",
    "mathematically tileable",
    "edge-coherent lighting",
    "continuous color flow across seam edges",
    "identical left and right edge pixels",
    "perfectly looping panorama",
    "zero discontinuity at horizontal boundaries",
] as const;

/** Atmospheric consistency keywords */
const CONSISTENCY_KEYWORDS = [
    "uniform atmospheric gradients",
    "consistent cloud formations wrapping seamlessly",
    "continuous sky color transitions",
    "edge-to-edge color coherence",
    "homogeneous lighting across entire sphere",
] as const;

/** Quality and game-ready markers */
const QUALITY_KEYWORDS = [
    "game engine ready HDR environment map",
    "production-ready spherical skybox asset",
    "tileable equirectangular texture",
    "high dynamic range lighting compatible"
] as const;

// =============================================================================
// Prompt Builder
// =============================================================================

/**
 * Builds FLUX2-optimized skybox prompt.
 * 
 * Follows FLUX2 guide principles:
 * - Word order = priority (first 5 words most important)
 * - Positive framing (no negative prompts)
 * - Specific technical terms for seamlessness
 * - Color and lighting consistency
 * - Under 150 words for optimal results
 * 
 * @param options - Skybox generation options
 * @returns Optimized FLUX2 prompt string
 */
export function buildSkyboxPrompt(options: SkyboxPromptOptions): string {
    const { userPrompt, preset = 'custom', styleAnchor } = options;

    // Build prompt parts in priority order
    const parts: string[] = [];

    // 1. HIGHEST PRIORITY: Asset type specification (first 5 words)
    parts.push(SEAMLESSNESS_KEYWORDS[0]); // "seamless equirectangular 360-degree panorama"

    // 2. PRIORITY #2: Scene description and background focus
    parts.push(BACKGROUND_FOCUS_KEYWORDS[0]); // "pure skybox backdrop"
    parts.push(BACKGROUND_FOCUS_KEYWORDS[1]); // "unobstructed far-horizon atmospheric vista"

    if (preset !== 'custom' && SKYBOX_PRESETS[preset]) {
        // Use preset description
        parts.push(SKYBOX_PRESETS[preset]);
    }
    // Always include user prompt (may enhance preset or be sole description)
    if (userPrompt && userPrompt.trim()) {
        parts.push(userPrompt.trim());
    }

    // 3. Technical seamlessness specifications
    parts.push(BACKGROUND_FOCUS_KEYWORDS[2]); // "distant background elements only"
    parts.push(BACKGROUND_FOCUS_KEYWORDS[3]); // "unobstructed infinity-focus perspective"
    parts.push(SEAMLESSNESS_KEYWORDS[1]); // 2:1 aspect ratio
    parts.push(SEAMLESSNESS_KEYWORDS[2]); // mathematically seamless edges
    parts.push(SEAMLESSNESS_KEYWORDS[3]); // no visible seams
    parts.push(SEAMLESSNESS_KEYWORDS[4]); // tileable pattern
    parts.push(SEAMLESSNESS_KEYWORDS[5]); // edge-coherent lighting

    // 4. Consistency requirements
    parts.push(CONSISTENCY_KEYWORDS[0]); // atmospheric perspective
    parts.push(CONSISTENCY_KEYWORDS[1]); // uniform lighting
    parts.push(CONSISTENCY_KEYWORDS[2]); // gradual color transitions

    // 5. Style anchor integration (if provided)
    if (styleAnchor) {
        if (styleAnchor.colorPalette && styleAnchor.colorPalette.length > 0) {
            parts.push(`using color palette: ${styleAnchor.colorPalette.join(', ')}`);
        }
        if (styleAnchor.styleKeywords) {
            parts.push(`matching ${styleAnchor.styleKeywords} style from reference`);
        }
        if (styleAnchor.lightingKeywords) {
            parts.push(styleAnchor.lightingKeywords);
        }
    }

    // 6. Quality markers (FLUX2-specific)
    parts.push(QUALITY_KEYWORDS[0]); // game engine ready
    parts.push(QUALITY_KEYWORDS[1]); // production-ready

    // Join with commas and return
    return parts.filter(Boolean).join(", ");
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates that a skybox prompt will produce good results.
 * Returns warnings if prompt may cause issues.
 */
export function validateSkyboxPrompt(prompt: string): {
    isValid: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];

    // Check length (FLUX2 diminishes after ~150 words)
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount > 150) {
        warnings.push(`Prompt is ${wordCount} words (optimal: <150). Consider simplifying.`);
    }

    // Check for seamlessness keywords
    if (!prompt.includes('seamless')) {
        warnings.push('Missing "seamless" keyword - edges may not match properly.');
    }

    // Check for equirectangular format
    if (!prompt.includes('equirectangular')) {
        warnings.push('Missing "equirectangular" - may not generate proper 360 panorama.');
    }

    // Check for negative framing (FLUX2 doesn't support)
    const negativeWords = ['no', 'not', 'without', 'avoid', "don't", "can't", 'never'];
    const hasNegatives = negativeWords.some(word =>
        prompt.toLowerCase().includes(` ${word} `)
    );
    if (hasNegatives) {
        warnings.push('Contains negative words - FLUX2 works better with positive framing.');
    }

    return {
        isValid: warnings.length === 0,
        warnings
    };
}

/**
 * Estimates token count for a prompt (rough approximation).
 * FLUX2 supports up to 32K tokens.
 */
export function estimateTokenCount(prompt: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(prompt.length / 4);
}
