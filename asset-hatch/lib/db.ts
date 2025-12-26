import Dexie, { Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  phase: 'planning' | 'style' | 'generation' | 'export';
  created_at: string;
  updated_at: string;
}

export class AssetHatchDB extends Dexie {
  projects!: Table<Project>;

  constructor() {
    super('asset-hatch');
    this.version(1).stores({
      projects: 'id, phase, created_at'
    });
  }
}

export const db = new AssetHatchDB();
