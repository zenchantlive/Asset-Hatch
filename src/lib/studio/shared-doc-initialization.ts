/**
 * Shared Document Initialization
 *
 * Creates initial shared document records for a project when it is created.
 * These documents persist between Asset Hatch and Hatch Studios sessions.
 *
 * Phase 7b: Unified Documentation System
 */

import { prisma } from '@/lib/prisma';
import {
  getGameDesignTemplate,
  getAssetInventoryTemplate,
  getSceneNotesTemplate,
  getDevelopmentLogTemplate,
} from './doc-templates';

/**
 * Initialize all shared documents for a project
 *
 * Creates MemoryFile records with template content for each document type.
 * Should be called when a project is created with startWith: "game".
 *
 * @param projectId - The project ID to initialize documents for
 */
export async function initializeSharedDocuments(projectId: string): Promise<void> {
  console.log('📄 Initializing shared documents for project:', projectId);

  const templates: Record<string, string> = {
    'game-design.md': getGameDesignTemplate(),
    'asset-inventory.md': getAssetInventoryTemplate(),
    'scene-notes.md': getSceneNotesTemplate(),
    'development-log.md': getDevelopmentLogTemplate(),
  };

  // Create all shared documents
  for (const [type, content] of Object.entries(templates)) {
    await prisma.memoryFile.upsert({
      where: {
        projectId_type: { projectId, type },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type,
        content,
      },
    });
  }

  console.log('✅ Initialized', Object.keys(templates).length, 'shared documents');
}

/**
 * Update asset-inventory.md with a new approved asset
 *
 * Called when a 3D or 2D asset is approved to keep the inventory in sync.
 *
 * @param projectId - The project ID
 * @param assetInfo - Information about the approved asset
 */
export async function updateAssetInventoryDocument(
  projectId: string,
  assetInfo: {
    name: string;
    type: '2d' | '3d' | 'model';
    description?: string;
    animations?: string[];
  }
): Promise<void> {
  // Delegate to the correct implementation in doc-auto-populator
  const { appendAssetToInventory } = await import('./doc-auto-populator');
  
  const typeMap: Record<string, 'character' | 'environment' | 'item'> = {
    '3d': 'character',
    'model': 'character',
    '2d': 'item'
  };
  
  await appendAssetToInventory(projectId, {
    name: assetInfo.name,
    type: typeMap[assetInfo.type] || 'item',
    assetId: '', // Not available in this context
    description: assetInfo.description,
    animations: assetInfo.animations
  });
}
