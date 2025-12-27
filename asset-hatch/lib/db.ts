import Dexie, { Table } from 'dexie';

// Add server-side support for IndexedDB if running in Node.js
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
}

export interface Project {
  id: string;
  name: string;
  phase: 'planning' | 'style' | 'generation' | 'export';
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
  flux_model: string; // "black-forest-labs/flux-2-dev"
  ai_suggested: boolean; // Whether keywords were AI-generated
  created_at: string;
  updated_at: string;
}

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

export class AssetHatchDB extends Dexie {
  projects!: Table<Project>;
  memory_files!: Table<MemoryFile>;
  style_anchors!: Table<StyleAnchor>;
  character_registry!: Table<CharacterRegistry>;
  generated_assets!: Table<GeneratedAsset>;

  constructor() {
    super('asset-hatch');

    // Version 1: Original schema
    this.version(1).stores({
      projects: 'id, phase, created_at'
    });

    // Version 2: Add memory_files table and new indexes to projects
    this.version(2).stores({
      projects: 'id, name, phase, created_at, updated_at', // Add new indexed fields
      memory_files: 'id, project_id, type, updated_at',
    });

    // Version 3: Add generation tables (style_anchors, character_registry, generated_assets)
    this.version(3).stores({
      projects: 'id, name, phase, created_at, updated_at',
      memory_files: 'id, project_id, type, updated_at',
      style_anchors: 'id, project_id, created_at',
      character_registry: 'id, project_id, name, created_at',
      generated_assets: 'id, project_id, asset_id, status, created_at',
    });
  }
}

export const db = new AssetHatchDB();
