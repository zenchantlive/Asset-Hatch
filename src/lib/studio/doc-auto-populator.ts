/**
 * Document Auto-Populator
 *
 * Functions to automatically populate shared documents when events occur,
 * such as asset generation completion or code pattern discovery.
 *
 * Phase 7b: Unified Documentation System
 */

import { prisma } from '@/lib/prisma';

/**
 * Asset entry to add to inventory
 */
interface AssetEntry {
  name: string;
  type: 'character' | 'environment' | 'skybox' | 'item' | 'prop';
  assetId: string;
  animations?: string[];
  description?: string;
}

/**
 * Append an asset entry to the asset inventory document
 *
 * Called when a 3D asset is approved/generated to automatically
 * document it in the shared inventory.
 *
 * @param projectId - The project ID
 * @param asset - Asset metadata to add
 */
export async function appendAssetToInventory(
  projectId: string,
  asset: AssetEntry
): Promise<void> {
  console.log('📦 Auto-populating asset inventory:', asset.name);

  try {
    // Format the asset entry as markdown
    const entry = formatAssetEntry(asset);

    // Fetch existing inventory
    const existing = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'asset-inventory.md' } },
    });

    // Determine section to add to
    const section = getSectionForAssetType(asset.type);

    let newContent: string;
    if (existing?.content) {
      // Insert entry into appropriate section
      newContent = insertIntoSection(existing.content, section, entry);
    } else {
      // Create new inventory with entry
      newContent = createInventoryWithEntry(section, entry);
    }

    // Upsert MemoryFile
    await prisma.memoryFile.upsert({
      where: { projectId_type: { projectId, type: 'asset-inventory.md' } },
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

    console.log('✅ Asset added to inventory:', asset.name);
  } catch (error) {
    console.error('❌ Failed to auto-populate asset inventory:', error);
    // Non-fatal - don't throw, just log
  }
}

/**
 * Record a development decision to the development log
 *
 * Called when AI makes significant decisions that should be
 * remembered for future sessions.
 *
 * @param projectId - The project ID
 * @param decision - Decision details
 */
export async function recordDevelopmentDecision(
  projectId: string,
  decision: {
    title: string;
    content: string;
    category: 'decision' | 'pattern' | 'gotcha';
  }
): Promise<void> {
  console.log('📝 Recording development decision:', decision.title);

  try {
    const today = new Date().toISOString().split('T')[0];
    const categoryHeader = {
      decision: '### Decision',
      pattern: '### Pattern',
      gotcha: '### Gotcha',
    }[decision.category];

    const entry = `\n## ${today}\n${categoryHeader}: ${decision.title}\n${decision.content}\n`;

    // Fetch existing log
    const existing = await prisma.memoryFile.findUnique({
      where: { projectId_type: { projectId, type: 'development-log.md' } },
    });

    const newContent = existing?.content
      ? `${existing.content}\n${entry}`
      : `# Development Log\n${entry}`;

    // Upsert MemoryFile
    await prisma.memoryFile.upsert({
      where: { projectId_type: { projectId, type: 'development-log.md' } },
      update: {
        content: newContent,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: 'development-log.md',
        content: newContent,
      },
    });

    console.log('✅ Development decision recorded');
  } catch (error) {
    console.error('❌ Failed to record development decision:', error);
    // Non-fatal - don't throw
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format an asset entry as markdown
 */
function formatAssetEntry(asset: AssetEntry): string {
  const lines = [
    `### ${asset.name} (ID: ${asset.assetId})`,
    `- **Type**: ${asset.type}`,
  ];

  if (asset.description) {
    lines.push(`- **Description**: ${asset.description}`);
  }

  if (asset.animations && asset.animations.length > 0) {
    lines.push(`- **Animations**: ${asset.animations.join(', ')}`);
  }

  lines.push(`- **Asset ID**: ${asset.assetId}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Get section header for asset type
 */
function getSectionForAssetType(type: AssetEntry['type']): string {
  switch (type) {
    case 'character':
      return '## Characters';
    case 'environment':
    case 'skybox':
      return '## Environments';
    case 'item':
    case 'prop':
      return '## Items';
    default:
      return '## Other';
  }
}

/**
 * Insert entry into appropriate section of inventory
 */
function insertIntoSection(
  content: string,
  section: string,
  entry: string
): string {
  // Check if section exists
  if (content.includes(section)) {
    // Find the section and add entry after it
    const sectionIndex = content.indexOf(section);
    const nextSectionMatch = content
      .substring(sectionIndex + section.length)
      .match(/\n## /);

    if (nextSectionMatch) {
      // Insert before next section
      const insertIndex =
        sectionIndex + section.length + (nextSectionMatch.index ?? 0);
      return (
        content.substring(0, insertIndex) +
        '\n' +
        entry +
        content.substring(insertIndex)
      );
    } else {
      // Append at end of section (end of file)
      return content + '\n' + entry;
    }
  } else {
    // Section doesn't exist, add it
    return content + '\n\n' + section + '\n' + entry;
  }
}

/**
 * Create new inventory with first entry
 */
function createInventoryWithEntry(section: string, entry: string): string {
  return `# Asset Inventory

${section}
${entry}

## Notes
_Asset notes and relationships..._
`;
}
