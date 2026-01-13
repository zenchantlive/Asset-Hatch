// -----------------------------------------------------------------------------
// Prisma ↔ Dexie Sync Utilities
// Utilities for syncing project data between server (Prisma) and client (Dexie)
// -----------------------------------------------------------------------------

import {
    db,
    Project as DexieProject,
    MemoryFile as DexieMemoryFile,
} from "@/lib/client-db";

// =============================================================================
// TYPES
// Type definitions for Prisma data that will be synced
// =============================================================================

// Valid phase values
type ProjectPhase = "planning" | "style" | "generation" | "export";

// Valid memory file types
type MemoryFileType =
    | "project.json"
    | "entities.json"
    | "style-anchor.json"
    | "generation-log.json"
    | "conversation.json";

// Project data from Prisma with relations
interface PrismaProject {
    id: string;
    name: string;
    phase: string;
    mode: string; // "2d" | "3d" - generation mode
    artStyle: string | null;
    baseResolution: string | null;
    perspective: string | null;
    gameGenre: string | null;
    theme: string | null;
    mood: string | null;
    colorPalette: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Memory file from Prisma
interface PrismaMemoryFile {
    id: string;
    projectId: string;
    type: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// Full project with relations
interface ProjectWithRelations extends PrismaProject {
    memoryFiles: PrismaMemoryFile[];
}

// =============================================================================
// HELPER FUNCTIONS
// Type guard and validation functions
// =============================================================================

// Validate phase is a valid ProjectPhase
export function isValidPhase(phase: string): phase is ProjectPhase {
    return ["planning", "style", "generation", "export"].includes(phase);
}

// Validate type is a valid MemoryFileType
export function isValidMemoryFileType(type: string): type is MemoryFileType {
    return [
        "project.json",
        "entities.json",
        "style-anchor.json",
        "generation-log.json",
        "conversation.json",
    ].includes(type);
}

// =============================================================================
// SYNC FUNCTIONS
// Functions to sync data from Prisma to Dexie (client cache)
// =============================================================================

/**
 * Sync a project from Prisma to Dexie
 * Used when resuming a project from the dashboard
 */
export async function syncProjectToClient(
    projectData: ProjectWithRelations
): Promise<void> {
    // Validate and default phase
    const phase: ProjectPhase = isValidPhase(projectData.phase)
        ? projectData.phase
        : "planning";

    // Map Prisma project to Dexie schema
    const dexieProject: DexieProject = {
        id: projectData.id,
        name: projectData.name,
        phase,
        mode: (projectData.mode === '3d' ? '3d' : '2d') as '2d' | '3d',
        art_style: projectData.artStyle || undefined,
        base_resolution: projectData.baseResolution || undefined,
        perspective: projectData.perspective || undefined,
        game_genre: projectData.gameGenre || undefined,
        theme: projectData.theme || undefined,
        mood: projectData.mood || undefined,
        color_palette: projectData.colorPalette || undefined,
        // Handle both Date objects and ISO strings (from JSON API)
        created_at: projectData.createdAt
            ? (typeof projectData.createdAt === 'string'
                ? projectData.createdAt
                : projectData.createdAt.toISOString())
            : new Date().toISOString(),
        updated_at: projectData.updatedAt
            ? (typeof projectData.updatedAt === 'string'
                ? projectData.updatedAt
                : projectData.updatedAt.toISOString())
            : new Date().toISOString(),
    };

    // Upsert project to Dexie
    await db.projects.put(dexieProject);

    // Sync memory files
    for (const file of projectData.memoryFiles) {
        // Only sync files with valid types
        if (isValidMemoryFileType(file.type)) {
            const dexieFile: DexieMemoryFile = {
                id: file.id,
                project_id: file.projectId,
                type: file.type,
                content: file.content,
                // Handle both Date objects and ISO strings (from JSON API)
                created_at: file.createdAt
                    ? (typeof file.createdAt === 'string'
                        ? file.createdAt
                        : file.createdAt.toISOString())
                    : new Date().toISOString(),
                updated_at: file.updatedAt
                    ? (typeof file.updatedAt === 'string'
                        ? file.updatedAt
                        : file.updatedAt.toISOString())
                    : new Date().toISOString(),
            };
            await db.memory_files.put(dexieFile);
        }
    }
}

/**
 * Fetch and sync a project from the server
 * Returns the project data for navigation
 */
export async function fetchAndSyncProject(
    projectId: string
): Promise<ProjectWithRelations | null> {
    try {
        // Fetch project from API
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
            console.error("Failed to fetch project:", response.statusText);
            return null;
        }

        const data: { project: ProjectWithRelations } = await response.json();

        // Sync to Dexie
        await syncProjectToClient(data.project);

        return data.project;
    } catch (error) {
        console.error("Error syncing project:", error);
        return null;
    }
}

/**
 * Clear a project from Dexie cache
 * Used when user signs out or project is deleted
 */
export async function clearProjectFromClient(projectId: string): Promise<void> {
    // Delete project
    await db.projects.delete(projectId);

    // Delete related memory files
    await db.memory_files.where("project_id").equals(projectId).delete();
}

/**
 * Clear all projects from Dexie cache
 * Used when user signs out
 */
export async function clearAllProjectsFromClient(): Promise<void> {
    await db.projects.clear();
    await db.memory_files.clear();
}

// =============================================================================
// QUALITY PARAMETER MAPPING
// Maps between Prisma camelCase and Dexie snake_case field names
// =============================================================================

export const qualityFieldMap: Record<string, string> = {
    art_style: "artStyle",
    base_resolution: "baseResolution",
    perspective: "perspective",
    game_genre: "gameGenre",
    theme: "theme",
    mood: "mood",
    color_palette: "colorPalette",
};

export const reverseQualityFieldMap: Record<string, string> = {
    artStyle: "art_style",
    baseResolution: "base_resolution",
    perspective: "perspective",
    gameGenre: "game_genre",
    theme: "theme",
    mood: "mood",
    colorPalette: "color_palette",
};

/**
 * Sync a memory file from Dexie to Server (Prisma)
 * Returns true if sync successful, false otherwise
 */
export async function syncMemoryFileToServer(
    projectId: string,
    type: string,
    content: string
): Promise<boolean> {
    try {
        const response = await fetch(`/api/projects/${projectId}/memory-files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, content }),
        });

        // Check if request was successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to sync memory file ${type} (status ${response.status}):`, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Failed to sync memory file ${type} to server:`, error);
        return false;
    }
}
