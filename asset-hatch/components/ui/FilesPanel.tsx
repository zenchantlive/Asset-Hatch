/**
 * FilesPanel Component
 *
 * A slide-out panel that displays all memory files for a project.
 * Used across all tabs (Planning, Style, Generation) to allow users
 * to view and verify created files (entities.json, style-draft, etc.).
 *
 * Features:
 * - Lists all memory files with metadata
 * - Click to view file content
 * - Syntax highlighting for JSON/markdown
 * - Slide-in animation from right
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, FileText, Clock } from 'lucide-react'

/**
 * MemoryFile type matching Prisma schema
 */
interface MemoryFile {
  id: string
  projectId: string
  type: string
  content: string
  createdAt: string
  updatedAt: string
}

interface FilesPanelProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * FilesPanel - Displays project memory files in a slide-out panel
 *
 * @param projectId - The project ID to fetch files for
 * @param isOpen - Whether the panel is visible
 * @param onClose - Callback to close the panel
 */
export function FilesPanel({ projectId, isOpen, onClose }: FilesPanelProps) {
  // State for list of files
  const [files, setFiles] = useState<MemoryFile[]>([])

  // Currently selected file for preview
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null)

  // Loading state during fetch
  const [isLoading, setIsLoading] = useState(false)

  // Error state if fetch fails
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all memory files for the project from API
   * Wrapped in useCallback to satisfy React Hook dependency rules
   */
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch without type filter to get ALL files
      const response = await fetch(`/api/projects/${projectId}/memory-files`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setFiles(data.files)
      } else {
        throw new Error(data.error || 'Failed to load files')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to load files:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Load files when panel opens
   * Re-fetch when projectId changes
   */
  useEffect(() => {
    if (isOpen) {
      loadFiles()
    }
  }, [isOpen, loadFiles])

  /**
   * Format timestamp for display
   * Converts ISO string to relative time
   */
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  /**
   * Get icon for file type
   * Different icons for different file types
   */
  const getFileIcon = (type: string): string => {
    if (type === 'entities.json') return '📋'
    if (type === 'style-draft') return '🎨'
    return '📄'
  }

  /**
   * Render file content with appropriate formatting
   * Attempts to pretty-print JSON, falls back to raw content
   */
  const renderFileContent = (content: string): string => {
    try {
      // Try to parse and format as JSON
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // Not JSON, return as-is (markdown, plain text, etc.)
      return content
    }
  }

  // If not open, render nothing
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay - click to close */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
      />

      {/* Slide-out panel from right */}
      <div
        className="fixed right-0 top-0 h-full w-[32rem] bg-black/40 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col animate-slideInRight"
      >
            {/* Header with title and close button */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-medium text-white">Files</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-white/60">
                    <div className="inline-block w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm">Loading files...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !error && files.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-white/60">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files yet</p>
                    <p className="text-xs mt-1">Files will appear here as you work</p>
                  </div>
                </div>
              )}

              {/* File list */}
              {!isLoading && files.length > 0 && !selectedFile && (
                <div className="p-4 space-y-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-white/10 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                            {file.type}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(file.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* File content viewer */}
              {selectedFile && (
                <div className="flex flex-col h-full">
                  {/* Back button */}
                  <div className="p-4 border-b border-white/10">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      ← Back to files
                    </button>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFileIcon(selectedFile.type)}</span>
                        <h3 className="font-medium text-white">{selectedFile.type}</h3>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>Created {formatTimestamp(selectedFile.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* File content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="text-xs text-white/80 font-mono bg-black/20 p-4 rounded-lg overflow-x-auto border border-white/5">
                      {renderFileContent(selectedFile.content)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
  )
}
