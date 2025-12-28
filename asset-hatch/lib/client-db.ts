import Dexie, { Table } from 'dexie';
import { Project, MemoryFile, StyleAnchor, CharacterRegistry, GeneratedAsset } from './types';

export type { Project, MemoryFile, StyleAnchor, CharacterRegistry, GeneratedAsset };

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
