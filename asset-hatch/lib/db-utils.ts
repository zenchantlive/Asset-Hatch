import { db, MemoryFile, Project } from './db';

/**
 * Save content to a memory file for a project
 */
export async function saveMemoryFile(
  projectId: string,
  type: MemoryFile['type'],
  content: string
): Promise<void> {
  const now = new Date().toISOString();
  const id = `${projectId}-${type}`;

  await db.memory_files.put({
    id,
    project_id: projectId,
    type,
    content,
    created_at: now,
    updated_at: now,
  });
}

/**
 * Load content from a memory file for a project
 */
export async function loadMemoryFile(
  projectId: string,
  type: MemoryFile['type']
): Promise<string | null> {
  const id = `${projectId}-${type}`;
  const file = await db.memory_files.get(id);
  return file?.content || null;
}

/**
 * Update project quality fields and timestamps
 */
export async function updateProjectQualities(
  projectId: string,
  qualities: Partial<Project>
): Promise<void> {
  await db.projects.update(projectId, {
    ...qualities,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Update project phase and timestamp
 */
export async function updateProjectPhase(
  projectId: string,
  phase: Project['phase']
): Promise<void> {
  await db.projects.update(projectId, {
    phase,
    updated_at: new Date().toISOString(),
  });
}
