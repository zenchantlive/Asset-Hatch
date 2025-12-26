import Dexie, { Table } from 'dexie';

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

export class AssetHatchDB extends Dexie {
  projects!: Table<Project>;
  memory_files!: Table<MemoryFile>;

  constructor() {
    super('asset-hatch');

    // Version 2: Add memory_files table
    this.version(2).stores({
      projects: 'id, phase, created_at',
      memory_files: 'id, project_id, type, updated_at',
    });

    // Version 1: Original schema (for backward compatibility)
    this.version(1).stores({
      projects: 'id, phase, created_at'
    });
  }
}

export const db = new AssetHatchDB();
