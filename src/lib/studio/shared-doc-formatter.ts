/**
 * Shared Document Formatter
 *
 * Formats shared documents for inclusion in the Babylon.js system prompt.
 * This provides the AI with awareness of game design, assets, scenes, and
 * patterns documented across sessions.
 *
 * Phase 7b: Unified Documentation System
 */

import { prisma } from '@/lib/prisma';

/** Shared document types to fetch */
const SHARED_DOC_TYPES = [
  'game-design.md',
  'asset-inventory.md',
  'scene-notes.md',
  'development-log.md',
] as const;

/**
 * Fetch all shared documents for a project
 *
 * @param projectId - The project ID to fetch documents for
 * @returns Record mapping document types to their content
 */
export async function fetchSharedDocuments(
  projectId: string
): Promise<Record<string, string>> {
  const docs: Record<string, string> = {};

  try {
    // Fetch all shared documents in one query
    const memoryFiles = await prisma.memoryFile.findMany({
      where: {
        projectId,
        type: { in: [...SHARED_DOC_TYPES] },
      },
      select: {
        type: true,
        content: true,
      },
    });

    // Map to record
    for (const file of memoryFiles) {
      docs[file.type] = file.content;
    }

    console.log('📚 Fetched shared docs:', Object.keys(docs).length, 'documents');
    return docs;
  } catch (error) {
    console.error('❌ Failed to fetch shared documents:', error);
    return {};
  }
}

/**
 * Format shared documents for inclusion in system prompt
 *
 * Generates a markdown-formatted string that summarizes all available
 * shared documents. Documents are included with clear section headers.
 *
 * @param docs - Record of document types to their content
 * @returns Formatted string for system prompt insertion
 */
export function formatSharedDocsForPrompt(docs: Record<string, string>): string {
  const sections: string[] = [];

  // Game Design Document
  if (docs['game-design.md']) {
    sections.push(`## GAME DESIGN\n${truncateIfTooLong(docs['game-design.md'], 2000)}`);
  }

  // Asset Inventory
  if (docs['asset-inventory.md']) {
    sections.push(`## ASSET INVENTORY\n${truncateIfTooLong(docs['asset-inventory.md'], 1500)}`);
  }

  // Scene Notes
  if (docs['scene-notes.md']) {
    sections.push(`## SCENE NOTES\n${truncateIfTooLong(docs['scene-notes.md'], 1500)}`);
  }

  // Development Log (only include recent entries to save tokens)
  if (docs['development-log.md']) {
    const recentLog = getRecentLogEntries(docs['development-log.md'], 1000);
    if (recentLog) {
      sections.push(`## DEVELOPMENT LOG (RECENT)\n${recentLog}`);
    }
  }

    if (sections.length === 0) {
    return '\n\nNo shared documents yet. The AI will automatically create them as you discuss your game concept, assets, scenes, and technical patterns.';
  }

  return '\n\n' + sections.join('\n\n---\n\n');
}

/**
 * Truncate document content if too long
 *
 * @param content - Document content
 * @param maxLength - Maximum length before truncation
 * @returns Truncated content with indicator
 */
function truncateIfTooLong(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '\n\n... (truncated, use readSharedDoc for full content)';
}

/**
 * Get recent entries from development log
 *
 * The development log can grow large over time. This extracts only
 * the most recent entries to include in the system prompt.
 *
 * @param logContent - Full development log content
 * @param maxLength - Maximum length to return
 * @returns Recent log entries
 */
function getRecentLogEntries(logContent: string, maxLength: number): string {
  // Split by date headers (## YYYY-MM-DD)
  const datePattern = /^## \d{4}-\d{2}-\d{2}/gm;
  const entries = logContent.split(datePattern);

  // Get dates for each entry
  const dates = logContent.match(datePattern) || [];

  // Take most recent entries that fit in maxLength
  let result = '';
  for (let i = dates.length - 1; i >= 0 && result.length < maxLength; i--) {
    const entry = `## ${dates[i]?.substring(3)}${entries[i + 1] || ''}`;
    if (result.length + entry.length < maxLength) {
      result = entry + result;
    } else {
      break;
    }
  }

  return result.trim() || truncateIfTooLong(logContent, maxLength);
}

/**
 * Get brief summary of shared documents for logging
 *
 * @param docs - Record of document types to their content
 * @returns Brief summary string
 */
export function summarizeSharedDocs(docs: Record<string, string>): string {
  const parts: string[] = [];

  for (const [type, content] of Object.entries(docs)) {
    if (content) {
      // Count approximate lines
      const lines = content.split('\n').filter(l => l.trim()).length;
      parts.push(`${type}: ${lines} lines`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : 'No shared docs';
}
