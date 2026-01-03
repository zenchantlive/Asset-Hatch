'use client'

// -----------------------------------------------------------------------------
// Project Sync Provider
// Syncs project data from Prisma API to Dexie (IndexedDB) on mount
// This ensures GenerationQueue and other client components can find project data
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { fetchAndSyncProject } from '@/lib/sync'

interface ProjectSyncProviderProps {
    projectId: string
    children: React.ReactNode
}

/**
 * Wrapper component that syncs project data to Dexie on mount.
 * Renders children once sync is complete.
 */
export function ProjectSyncProvider({ projectId, children }: ProjectSyncProviderProps) {
    // Track sync state
    const [isSynced, setIsSynced] = useState(false)
    const [syncError, setSyncError] = useState<string | null>(null)

    useEffect(() => {
        async function syncProject() {
            try {
                // Fetch project from API and sync to Dexie
                const result = await fetchAndSyncProject(projectId)

                if (!result) {
                    setSyncError('Failed to sync project data')
                    return
                }

                setIsSynced(true)
            } catch (err) {
                console.error('Project sync failed:', err)
                setSyncError(err instanceof Error ? err.message : 'Unknown sync error')
            }
        }

        syncProject()
    }, [projectId])

    // Show loading while syncing
    if (!isSynced && !syncError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/60">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm">Loading project...</p>
                </div>
            </div>
        )
    }

    // Show error if sync failed
    if (syncError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/80">
                    <p className="text-red-400 mb-2">Failed to load project</p>
                    <p className="text-sm text-white/60">{syncError}</p>
                </div>
            </div>
        )
    }

    // Render children once synced
    return <>{children}</>
}
