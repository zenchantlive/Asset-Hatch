/**
 * Shared Document AI Tools
 *
 * AI SDK v6 tools for reading and writing shared living documents.
 * These tools allow the AI to access and update project context
 * documents that persist between Assets and Game tabs.
 *
 * Phase 7b: Unified Documentation System
 *
 * @see src/lib/studio/doc-templates.ts for document templates
 * @see src/memory/AI_SDK_V6_GUIDE.md for tool patterns
 */

import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getDocTemplate, type SharedDocumentType } from './doc-templates';

// =============================================================================
// SHARED DOCUMENT SCHEMAS
// =============================================================================

/** Valid shared document types */
const sharedDocTypes = [
  'game-design.md',
  'asset-inventory.md',
  'scene-notes.md',
  'development-log.md',
] as const;

/** Schema for reading a shared document */
const readSharedDocSchema = z.object({
  documentType: z.enum(sharedDocTypes).describe(
    'Type of shared document to read. Options: game-design.md (game concept), asset-inventory.md (characters/environments), scene-notes.md (level design), development-log.md (patterns/gotchas)'
  ),
});

/** Schema for updating a shared document */
const updateSharedDocSchema = z.object({
  documentType: z.enum(sharedDocTypes).describe(
    'Type of shared document to update'
  ),
  content: z.string().min(1).describe(
    'New content for the document. Use markdown formatting.'
  ),
  append: z.boolean().default(false).describe(
    'If true, append content to existing document. If false, replace entire document. Use append=true for logs.'
  ),
});

// =============================================================================
// READ SHARED DOC TOOL
// =============================================================================

/**
 * Create AI tool for reading shared documents
 *
 * @param gameId - Current game ID (used to find project)
 * @returns AI SDK tool for reading shared documents
 */
export const readSharedDocTool = (gameId: string) => {
  return tool({
    description:
      'Read a shared document to understand project context. Use this at the start of conversations to understand the game design, assets, and previous decisions. Available documents: game-design.md, asset-inventory.md, scene-notes.md, development-log.md.',
    inputSchema: readSharedDocSchema,
    execute: async ({ documentType }) => {
      try {
        console.log('📖 Reading shared doc:', documentType);

        // Get game with projectId
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: { projectId: true },
        });

        if (!game?.projectId) {
          console.warn('⚠️ Game not linked to project:', gameId);
          return {
            success: false,
            error: '🚨 GAME NOT LINKED TO PROJECT\n\nThis game is not connected to a project. Shared documents (game-design.md, asset-inventory.md, etc.) require a project connection.\n\nTo fix this:\n1. Go to Project Settings\n2. Link this game to your Asset Hatch project\n3. Then shared documents will work correctly.',
            documentType,
            requiresProjectLink: true,
          };
        }

        // Fetch from MemoryFile
        const memoryFile = await prisma.memoryFile.findUnique({
          where: {
            projectId_type: { projectId: game.projectId, type: documentType },
          },
        });

        if (!memoryFile) {
          // Return template for new document
          const template = getDocTemplate(documentType as SharedDocumentType);
          console.log('📝 Returning template for new doc:', documentType);
          return {
            success: true,
            content: template,
            isNew: true,
            documentType,
            message: `Document "${documentType}" doesn't exist yet. Here's a template to get started.`,
          };
        }

        console.log('✅ Found shared doc:', documentType);
        return {
          success: true,
          content: memoryFile.content,
          isNew: false,
          documentType,
          updatedAt: memoryFile.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('❌ Failed to read shared doc:', error);
        return {
          success: false,
          error: 'Failed to read document',
          documentType,
        };
      }
    },
  });
};

// =============================================================================
// UPDATE SHARED DOC TOOL
// =============================================================================

/**
 * Create AI tool for updating shared documents
 *
 * @param gameId - Current game ID (used to find project)
 * @returns AI SDK tool for updating shared documents
 */
export const updateSharedDocTool = (gameId: string) => {
  return tool({
    description:
      'Update a shared document with new information. Use append=true to add entries (for development-log.md). Use append=false to replace the entire document (for game-design.md, scene-notes.md). This persists context between sessions.',
    inputSchema: updateSharedDocSchema,
    execute: async ({ documentType, content, append }) => {
      try {
        console.log('✍️ Updating shared doc:', documentType, 'append:', append);

        // Get game with projectId
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: { projectId: true },
        });

        if (!game?.projectId) {
          console.warn('⚠️ Game not linked to project:', gameId);
          return {
            success: false,
            error: '🚨 GAME NOT LINKED TO PROJECT\n\nThis game is not connected to a project. Shared documents require a project connection.\n\nTo fix this:\n1. Go to Project Settings\n2. Link this game to your Asset Hatch project\n3. Then you can save game design documents.',
            documentType,
            requiresProjectLink: true,
          };
        }

        const projectId = game.projectId;
        let finalContent: string;

        if (append) {
          // Get existing content and append
          const existing = await prisma.memoryFile.findUnique({
            where: { projectId_type: { projectId, type: documentType } },
          });

          const existingContent = existing?.content || '';
          // Add newlines for separation when appending
          finalContent = existingContent
            ? `${existingContent}\n\n${content}`
            : content;
        } else {
          finalContent = content;
        }

        // Upsert MemoryFile
        await prisma.memoryFile.upsert({
          where: { projectId_type: { projectId, type: documentType } },
          update: {
            content: finalContent,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            type: documentType,
            content: finalContent,
          },
        });

        console.log('✅ Updated shared doc:', documentType);
        return {
          success: true,
          message: append
            ? `Appended content to "${documentType}"`
            : `Updated "${documentType}"`,
          documentType,
          contentLength: finalContent.length,
        };
      } catch (error) {
        console.error('❌ Failed to update shared doc:', error);
        return {
          success: false,
          error: 'Failed to update document',
          documentType,
        };
      }
    },
  });
};

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create all shared document tools for a game
 *
 * @param gameId - Current game ID
 * @returns Record of shared document tools
 */
export function createSharedDocTools(gameId: string) {
  return {
    readSharedDoc: readSharedDocTool(gameId),
    updateSharedDoc: updateSharedDocTool(gameId),
  };
}

// =============================================================================
// PROJECT-SCOPED TOOLS (for Asset Gen Chat)
// =============================================================================

/**
 * Create AI tool for reading shared documents by project ID
 * Used by Asset Gen Chat when no game exists yet
 */
export const readSharedDocToolByProject = (projectId: string) => {
  return tool({
    description:
      'Read a shared document to understand project context. Use this at the start of conversations to understand the game design, assets, and previous decisions. Available documents: game-design.md, asset-inventory.md, scene-notes.md, development-log.md.',
    inputSchema: readSharedDocSchema,
    execute: async ({ documentType }) => {
      try {
        console.log('📖 [Project] Reading shared doc:', documentType);

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true },
        });
        if (!project) {
          console.warn('⚠️ [Project] Project not found:', projectId);
          return {
            success: false,
            error: 'Project not found',
            documentType,
          };
        }

        // Fetch from MemoryFile
        const memoryFile = await prisma.memoryFile.findUnique({
          where: {
            projectId_type: { projectId, type: documentType },
          },
        });

        if (!memoryFile) {
          // Return template for new document
          const template = getDocTemplate(documentType as SharedDocumentType);
          console.log('📝 [Project] Returning template for new doc:', documentType);
          return {
            success: true,
            content: template,
            isNew: true,
            documentType,
            message: `Document "${documentType}" doesn't exist yet. Here's a template to get started.`,
          };
        }

        console.log('✅ [Project] Found shared doc:', documentType);
        return {
          success: true,
          content: memoryFile.content,
          isNew: false,
          documentType,
          updatedAt: memoryFile.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('❌ [Project] Failed to read shared doc:', error);
        return {
          success: false,
          error: 'Failed to read document',
          documentType,
        };
      }
    },
  });
};

/**
 * Create AI tool for updating shared documents by project ID
 * Used by Asset Gen Chat when no game exists yet
 */
export const updateSharedDocToolByProject = (projectId: string) => {
  return tool({
    description:
      'Update a shared document with new information. Use append=true to add entries (for development-log.md). Use append=false to replace the entire document (for game-design.md, scene-notes.md). This persists context between sessions.',
    inputSchema: updateSharedDocSchema,
    execute: async ({ documentType, content, append }) => {
      try {
        console.log('✍️ [Project] Updating shared doc:', documentType, 'append:', append);

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true },
        });
        if (!project) {
          console.warn('⚠️ [Project] Project not found:', projectId);
          return {
            success: false,
            error: 'Project not found',
            documentType,
          };
        }

        let finalContent: string;

        if (append) {
          // Get existing content and append
          const existing = await prisma.memoryFile.findUnique({
            where: { projectId_type: { projectId, type: documentType } },
          });

          const existingContent = existing?.content || '';
          finalContent = existingContent
            ? `${existingContent}\n\n${content}`
            : content;
        } else {
          finalContent = content;
        }

        // Upsert MemoryFile
        await prisma.memoryFile.upsert({
          where: { projectId_type: { projectId, type: documentType } },
          update: {
            content: finalContent,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            type: documentType,
            content: finalContent,
          },
        });

        console.log('✅ [Project] Updated shared doc:', documentType);
        return {
          success: true,
          message: append
            ? `Appended content to "${documentType}"`
            : `Updated "${documentType}"`,
          documentType,
          contentLength: finalContent.length,
        };
      } catch (error) {
        console.error('❌ [Project] Failed to update shared doc:', error);
        return {
          success: false,
          error: 'Failed to update document',
          documentType,
        };
      }
    },
  });
};

/**
 * Create all shared document tools for a project
 * Use this when you have projectId but not gameId (Asset Gen Chat)
 */
export function createSharedDocToolsByProject(projectId: string) {
  return {
    readSharedDoc: readSharedDocToolByProject(projectId),
    updateSharedDoc: updateSharedDocToolByProject(projectId),
  };
}
