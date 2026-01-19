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
    type: '2d' | '3d' | 'model' | 'skybox';
    description?: string;
    animations?: string[];
  }
): Promise<void> {
  console.log('📦 Updating asset inventory for project:', projectId, 'asset:', assetInfo.name);

  // Fetch existing inventory
  const existing = await prisma.memoryFile.findUnique({
    where: {
      projectId_type: { projectId, type: 'asset-inventory.md' },
    },
  });

  const existingContent = existing?.content || getAssetInventoryTemplate();

  // Parse existing content to find the Characters/Environments/Items sections
  const sectionName = assetInfo.type === 'skybox'
    ? 'Environments'
    : assetInfo.type === '3d' || assetInfo.type === 'model'
      ? 'Characters'
      : 'Items';
  const assetLine = `## ${sectionName}\n- **${assetInfo.name}**${assetInfo.description ? `: ${assetInfo.description}` : ''}${assetInfo.animations?.length ? ` (animations: ${assetInfo.animations.join(', ')})` : ''}`;

  // Check if asset already exists in inventory
  if (existingContent.includes(`**${assetInfo.name}**`)) {
    console.log('⚠️ Asset already exists in inventory, skipping');
    return;
  }

  // Find the section and append the asset
  const sectionPattern = new RegExp(`(## ${sectionName}\n)(.*?)(\n## |$)`, 's');
  const match = existingContent.match(sectionPattern);

  let newContent: string;
  if (match) {
    // Append to existing section
    const [, prefix, existingItems, suffix] = match;
    const newItems = existingItems ? `${existingItems}\n${assetLine}` : assetLine;
    newContent = existingContent.replace(sectionPattern, `${prefix}${newItems}${suffix}`);
  } else {
    // Section doesn't exist, add it
    newContent = `${existingContent}\n\n## ${sectionName}\n${assetLine}`;
  }

  // Update the document
  await prisma.memoryFile.upsert({
    where: {
      projectId_type: { projectId, type: 'asset-inventory.md' },
    },
    update: {
      content: newContent,
      updatedAt: new Date(),
    },
    create: {
      projectId,
      type: 'asset-inventory.md',
      content: newContent,
    },
  });

  console.log('✅ Updated asset inventory with:', assetInfo.name);
}
