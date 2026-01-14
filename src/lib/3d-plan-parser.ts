/**
 * 3D Plan Parser for Asset Hatch
 *
 * Parses markdown plans for 3D mode into Parsed3DAsset[].
 * Extracts [RIG]/[STATIC] tags and animation requirements from AI-generated plans.
 *
 * @see lib/plan-parser.ts for 2D plan parsing
 * @see lib/types/3d-generation.ts for AnimationPreset types
 */

import type { AnimationPreset } from '@/lib/types/3d-generation';

// =============================================================================
// Types
// =============================================================================

/**
 * A parsed 3D asset ready for generation queue
 */
export interface Parsed3DAsset {
    // Unique identifier for this asset
    id: string;
    // Category from markdown (Characters, Props, Environment)
    category: string;
    // Asset name (cleaned of tags)
    name: string;
    // Description from sub-items
    description: string;
    // Whether this asset should be auto-rigged
    shouldRig: boolean;
    // Animation presets to apply after rigging
    animationsRequested: AnimationPreset[];
    // Project ID for linkage
    projectId: string;
}

/**
 * Parser options
 */
export interface Parse3DPlanOptions {
    // Project ID to prefix asset IDs
    projectId: string;
}

// =============================================================================
// Main Parser Function
// =============================================================================

/**
 * Parse a 3D plan markdown into structured assets
 *
 * @param planMarkdown - Markdown content with [RIG]/[STATIC] tags
 * @param options - Parser options (projectId)
 * @returns Array of parsed 3D assets ready for generation
 *
 * @example
 * ```typescript
 * const markdown = `
 * ## Characters
 * - [RIG] Knight Character
 *   - Description: Armored knight in T-pose
 *   - Animations: idle, walk, run
 * `;
 * const assets = parse3DPlan(markdown, { projectId: 'proj-123' });
 * ```
 */
export function parse3DPlan(
    planMarkdown: string,
    options: Parse3DPlanOptions
): Parsed3DAsset[] {
    // Guard: return empty array for invalid input
    if (!planMarkdown || typeof planMarkdown !== 'string') {
        return [];
    }

    const lines = planMarkdown.split('\n');
    const assets: Parsed3DAsset[] = [];

    let currentCategory = '';
    let currentAsset: Partial<Parsed3DAsset> | null = null;
    let assetIndex = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and top-level title
        if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith('##'))) {
            continue;
        }

        // Category headers (## Characters)
        if (trimmed.startsWith('##')) {
            // Finalize previous asset before switching categories
            if (currentAsset) {
                assets.push(finalizeAsset(currentAsset, options.projectId, assetIndex++));
                currentAsset = null;
            }
            currentCategory = trimmed.replace(/^##\s*/, '').trim();
            continue;
        }

        // Asset lines (- [RIG] Knight Character)
        const isAssetLine = trimmed.startsWith('-') && !line.startsWith('  ');
        // Sub-item lines (  - Description: ...)
        const isSubItem = line.startsWith('  ') && trimmed.startsWith('-');

        if (isAssetLine) {
            // Finalize previous asset
            if (currentAsset) {
                assets.push(finalizeAsset(currentAsset, options.projectId, assetIndex++));
            }
            // Parse new asset
            currentAsset = parseAssetLine(trimmed.replace(/^-\s*/, ''), currentCategory);
        } else if (isSubItem && currentAsset) {
            // Parse sub-item and add to current asset
            parseSubItem(trimmed.replace(/^-\s*/, ''), currentAsset);
        }
    }

    // Don't forget the last asset
    if (currentAsset) {
        assets.push(finalizeAsset(currentAsset, options.projectId, assetIndex));
    }

    return assets;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse an asset line to extract tag and name
 *
 * @param text - Raw asset text (e.g., "[RIG] Knight Character")
 * @param category - Current category context
 * @returns Partial asset with shouldRig and name
 */
function parseAssetLine(text: string, category: string): Partial<Parsed3DAsset> {
    const { shouldRig, cleanName } = parseRigTag(text);

    return {
        name: cleanName,
        category,
        shouldRig,
        description: '',
        animationsRequested: [],
    };
}

/**
 * Parse [RIG] or [STATIC] tag from text
 *
 * @param text - Text potentially containing [RIG] or [STATIC] tag
 * @returns Object with shouldRig flag and cleaned name
 */
function parseRigTag(text: string): { shouldRig: boolean; cleanName: string } {
    // Match [RIG] tag
    const rigMatch = text.match(/^\[RIG\]\s*/i);
    if (rigMatch) {
        return {
            shouldRig: true,
            cleanName: text.replace(rigMatch[0], '').trim(),
        };
    }

    // Match [STATIC] tag
    const staticMatch = text.match(/^\[STATIC\]\s*/i);
    if (staticMatch) {
        return {
            shouldRig: false,
            cleanName: text.replace(staticMatch[0], '').trim(),
        };
    }

    // No tag found - default to static
    return {
        shouldRig: false,
        cleanName: text.trim(),
    };
}

/**
 * Parse a sub-item line and update the current asset
 *
 * Handles:
 * - Description: ...
 * - Animations: idle, walk, run
 *
 * @param text - Sub-item text (e.g., "Description: Armored knight")
 * @param asset - Current asset to update
 */
function parseSubItem(text: string, asset: Partial<Parsed3DAsset>): void {
    const textLower = text.toLowerCase();

    // Description sub-item
    if (textLower.startsWith('description:')) {
        asset.description = text.replace(/^description:\s*/i, '').trim();
        return;
    }

    // Animations sub-item
    if (textLower.startsWith('animations:') || textLower.startsWith('animation:')) {
        const animationText = text.replace(/^animations?:\s*/i, '').trim();
        asset.animationsRequested = parseAnimations(animationText);
        return;
    }
}

/**
 * Parse comma-separated animation names into AnimationPreset[]
 *
 * Converts human-readable names (idle, walk) to preset format (preset:idle)
 *
 * @param text - Comma-separated animation names (e.g., "idle, walk, run")
 * @returns Array of AnimationPreset values
 */
function parseAnimations(text: string): AnimationPreset[] {
    const presets: AnimationPreset[] = [];

    // Valid preset names (without prefix)
    const validNames = ['idle', 'walk', 'run', 'jump', 'climb', 'dive'];

    // Split by comma and process each
    const parts = text.split(',').map((p) => p.trim().toLowerCase());

    for (const part of parts) {
        if (validNames.includes(part)) {
            presets.push(`preset:${part}` as AnimationPreset);
        }
    }

    return presets;
}

/**
 * Finalize a partial asset into a complete Parsed3DAsset
 *
 * @param partial - Partial asset data
 * @param projectId - Project ID for ID generation
 * @param index - Asset index for unique ID
 * @returns Complete Parsed3DAsset
 */
function finalizeAsset(
    partial: Partial<Parsed3DAsset>,
    projectId: string,
    index: number
): Parsed3DAsset {
    return {
        id: `${projectId}-3d-asset-${index}`,
        category: partial.category || 'Uncategorized',
        name: partial.name || 'Unnamed Asset',
        description: partial.description || '',
        shouldRig: partial.shouldRig ?? false,
        animationsRequested: partial.animationsRequested || [],
        projectId: projectId,
    };
}
