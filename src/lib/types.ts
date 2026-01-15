import { ReactNode } from 'react';

export interface Project {
    id: string;
    name: string;
    phase: 'planning' | 'style' | 'generation' | 'export';
    mode: '2d' | '3d'; // Generation mode: 2D sprites or 3D models
    created_at: string;
    updated_at: string;
    // Quality fields for project configuration
    art_style?: string;
    base_resolution?: string;
    perspective?: string;
    game_genre?: string;
    theme?: string;
    mood?: string;
    color_palette?: string;
}

export interface MemoryFile {
    id: string;
    project_id: string;
    type: 'project.json' | 'entities.json' | 'style-anchor.json' | 'generation-log.json' | 'conversation.json';
    content: string;
    created_at: string;
    updated_at: string;
}

export interface StyleAnchor {
    id: string;
    project_id: string;
    reference_image_name: string;
    reference_image_blob: Blob;
    reference_image_base64?: string; // Cached for API calls
    style_keywords: string; // e.g., "16-bit pixel art, SNES RPG style"
    lighting_keywords: string; // e.g., "flat lighting, even illumination"
    color_palette: string[]; // HEX codes: ["#2C3E50", "#E74C3C", ...]
    flux_model: string; // "black-forest-labs/flux.2-pro"
    ai_suggested: boolean; // Whether keywords were AI-generated
    created_at: string;
    updated_at: string;
}

export const DEFAULT_FLUX_MODEL = 'black-forest-labs/flux.2-pro';

export interface CharacterRegistry {
    id: string;
    project_id: string;
    name: string; // "farmer", "warrior", etc.
    base_description: string; // "farmer character with straw hat, weathered blue overalls, brown boots"
    color_hex: Record<string, string>; // { hat: "#D4AF37", overalls: "#003366", boots: "#8B4513" }
    style_keywords: string; // "16-bit pixel art, Stardew Valley style"
    successful_seed?: number; // First successful generation seed
    poses_generated: string[]; // ["idle", "walk_left", "walk_right", "work"]
    animations: Record<string, {
        prompt_suffix: string;
        seed: number;
        asset_id: string;
    }>;
    created_at: string;
    updated_at: string;
}

export interface GeneratedAsset {
    prompt: ReactNode;
    id: string;
    project_id: string;
    asset_id: string; // Links to plan asset
    variant_id: string;
    image_blob: Blob; // Actual generated image
    image_base64?: string; // Cached for display
    prompt_used: string; // Full prompt sent to Flux
    generation_metadata: {
        model: string;
        seed: number;
        cost: number;
        duration_ms: number;
    };
    status: 'generated' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

// =============================================================================
// Export Format Types (ADR-014: Single-Asset Strategy)
// =============================================================================

/**
 * Metadata for a single exported 3D asset.
 */
export interface Export3DAssetMetadata {
    id: string;
    type: 'skybox' | 'model';
    path?: string; // for skybox
    folder?: string; // for model
    prompt: string | null;
    files?: {
        draft?: string;
        rigged?: string;
        animations?: Record<string, string>;
    };
}

/**
 * Manifest for exported asset pack
 * Enables AI-consumable, programmatic asset usage
 */
export interface ExportManifest {
    project: {
        id: string;
        name: string;
        mode?: string;
        created: string; // ISO 8601 timestamp
    };
    style: {
        artStyle: string; // "Pixel Art", "Hand-painted 2D", "Vector/Flat", etc.
        baseResolution: string; // "32x32", "64x64"
        perspective: string; // "Top-down", "Side-view", etc.
        colorPalette: string; // "Vibrant", "Muted", etc.
        anchorImagePath?: string; // Relative path to style anchor image
    };
    assets: ExportAssetMetadata[];
    assets3d: Export3DAssetMetadata[];
}

/**
 * Metadata for a single exported asset
 * Semantic IDs enable AI code generation
 */
export interface ExportAssetMetadata {
    id: string; // Semantic ID: "player_idle", "chair_wooden_01"
    semanticName: string; // Human-readable: "Player Idle Sprite"
    path: string; // Relative path: "characters/player_idle.png"
    category: string; // "character", "furniture", "terrain", etc.
    tags: string[]; // ["player", "protagonist", "idle"]
    dimensions: {
        width: number;
        height: number;
    };
    frames: number; // 1 for single sprite, >1 for sprite sheet
    aiDescription: string; // Description for AI consumption
    generationMetadata: {
        prompt: string; // Full Flux.2 prompt used
        seed: number; // Generation seed
        model: string; // "flux.2-pro"
    };
    placementRules?: PlacementRules; // Optional gameplay metadata
}

/**
 * Optional gameplay metadata for AI game generation
 */
export interface PlacementRules {
    surfaces?: string[]; // ["floor", "wall", "water"]
    stackable?: boolean; // Can items be placed on top?
    collisionBox?: {
        x: number; // Offset from sprite origin
        y: number;
        width: number;
        height: number;
    };
    interactable?: boolean; // Can player interact?
}
