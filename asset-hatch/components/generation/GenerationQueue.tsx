/**
 * GenerationQueue Component
 * 
 * Main container for the generation phase UI. This component:
 * - Loads and parses the project's asset plan from entities.json
 * - Manages global generation state via React Context
 * - Coordinates all sub-components (controls, tree, progress)
 * - Provides the generation orchestration layer
 * 
 * This replaces the "Coming soon" placeholder in the planning page.
 */

'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { parsePlan } from '@/lib/plan-parser'
import { useBatchGeneration } from '@/hooks/useBatchGeneration'
import type { ParsedAsset } from '@/lib/prompt-builder'
import type {
  GenerationQueueProps,
  GenerationContextValue,
  GenerationLogEntry,
} from '@/lib/types/generation'
import { BatchControls } from './BatchControls'
import { AssetTree } from './AssetTree'
import { GenerationProgress } from './GenerationProgress'

/**
 * React Context for sharing generation state across components
 * Provides centralized state management without prop drilling
 */
const GenerationContext = createContext<GenerationContextValue | null>(null)

/**
 * Custom hook to access the generation context
 * Throws error if used outside of GenerationProvider
 * 
 * @returns The current generation context value
 * @throws Error if used outside provider
 */
export function useGenerationContext(): GenerationContextValue {
  const context = useContext(GenerationContext)
  if (!context) {
    throw new Error('useGenerationContext must be used within GenerationQueue')
  }
  return context
}

/**
 * Main GenerationQueue Component
 * 
 * Entry point for the generation phase. Manages state and provides
 * context to all child components.
 */
export function GenerationQueue({ projectId }: GenerationQueueProps) {
  // State for parsed assets from the plan
  const [parsedAssets, setParsedAssets] = useState<ParsedAsset[]>([])
  
  // Loading state for initial plan fetch
  const [isLoading, setIsLoading] = useState(true)
  
  // Error state for plan loading failures
  const [loadError, setLoadError] = useState<string | null>(null)

  // Selected model for generation
  const [selectedModel, setSelectedModel] = useState<'flux-2-dev' | 'flux-2-pro'>('flux-2-dev')

  // Custom prompt overrides (assetId → customPrompt)
  const [promptOverrides, setPromptOverrides] = useState<Map<string, string>>(new Map())

  // Generation log for the console
  const [log, setLog] = useState<GenerationLogEntry[]>([])

  // Get batch generation controls and state
  const batchGeneration = useBatchGeneration(projectId)

  /**
   * Add a new entry to the generation log
   * 
   * @param level - Log level (info, success, error)
   * @param message - Log message
   */
  const addLogEntry = useCallback((
    level: 'info' | 'success' | 'error',
    message: string
  ) => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, { timestamp, level, message }])
  }, [])

  /**
   * Load the project's asset plan from entities.json
   * 
   * Fetches the MemoryFile, parses the markdown plan,
   * and populates the parsed assets state.
   */
  useEffect(() => {
    async function loadPlan() {
      try {
        // Fetch the entities.json file from the server
        const response = await fetch(`/api/projects/${projectId}/memory-files?type=entities.json`)
        
        if (!response.ok) {
          throw new Error('Failed to load plan')
        }

        const data = await response.json()

        // Check if entities.json exists
        if (!data.files || data.files.length === 0) {
          setLoadError('No plan found. Please create a plan first.')
          setIsLoading(false)
          return
        }

        // Get the first (should be only) entities.json file
        const entitiesFile = data.files[0]

        // Parse the markdown plan into structured assets
        // Use 'composite' mode by default (sprite sheets)
        const parsed = parsePlan(entitiesFile.content, {
          mode: 'composite',
          projectId,
        })

        setParsedAssets(parsed)
        
        // Add log entry
        addLogEntry('info', `Loaded ${parsed.length} assets from plan`)
        
        setIsLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setLoadError(errorMessage)
        addLogEntry('error', `Failed to load plan: ${errorMessage}`)
        setIsLoading(false)
      }
    }

    loadPlan()
  }, [projectId, addLogEntry])

  /**
   * Start batch generation with current settings
   * 
   * Initiates generation of all assets using the selected model
   * and any custom prompt overrides.
   */
  const startGeneration = useCallback(async () => {
    addLogEntry('info', `Starting batch generation with ${selectedModel}`)
    
    // Apply custom prompts if any
    const assetsWithCustomPrompts = parsedAssets.map(asset => {
      const customPrompt = promptOverrides.get(asset.id)
      return customPrompt ? { ...asset, customPrompt } : asset
    })

    try {
      await batchGeneration.startBatch(assetsWithCustomPrompts, selectedModel)
      addLogEntry('success', 'Batch generation completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Batch generation failed: ${errorMessage}`)
    }
  }, [parsedAssets, selectedModel, promptOverrides, batchGeneration, addLogEntry])

  /**
   * Pause the current batch generation
   */
  const pauseGeneration = useCallback(() => {
    batchGeneration.pause()
    addLogEntry('info', 'Generation paused')
  }, [batchGeneration, addLogEntry])

  /**
   * Resume a paused batch generation
   */
  const resumeGeneration = useCallback(() => {
    batchGeneration.resume()
    addLogEntry('info', 'Generation resumed')
  }, [batchGeneration, addLogEntry])

  /**
   * Regenerate a single asset
   * 
   * @param assetId - ID of the asset to regenerate
   */
  const regenerateAsset = useCallback(async (assetId: string) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    if (!asset) return

    addLogEntry('info', `Regenerating asset: ${asset.name}`)

    try {
      await batchGeneration.startBatch([asset], selectedModel)
      addLogEntry('success', `Asset regenerated: ${asset.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Regeneration failed: ${errorMessage}`)
    }
  }, [parsedAssets, selectedModel, batchGeneration, addLogEntry])

  /**
   * Update the custom prompt for an asset
   * 
   * @param assetId - ID of the asset
   * @param customPrompt - Custom prompt override
   */
  const updatePrompt = useCallback((assetId: string, customPrompt: string) => {
    setPromptOverrides(prev => {
      const next = new Map(prev)
      next.set(assetId, customPrompt)
      return next
    })
  }, [])

  // Build the context value
  const contextValue: GenerationContextValue = {
    parsedAssets,
    queue: [], // TODO: Build queue items from parsed assets
    status: batchGeneration.status,
    currentAsset: batchGeneration.currentAsset,
    completed: batchGeneration.completed,
    failed: batchGeneration.failed,
    log,
    selectedModel,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    regenerateAsset,
    updatePrompt,
    setSelectedModel,
    progress: batchGeneration.progress,
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/60">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p>Loading plan...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/80">
          <p className="text-red-400 mb-2">Error loading plan</p>
          <p className="text-sm text-white/60">{loadError}</p>
        </div>
      </div>
    )
  }

  // Show empty state if no assets
  if (parsedAssets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/60">
          <p>No assets in plan</p>
          <p className="text-sm mt-2">Create a plan to start generating assets</p>
        </div>
      </div>
    )
  }

  // Main UI - Complete generation interface
  return (
    <GenerationContext.Provider value={contextValue}>
      <div className="flex flex-col h-full bg-glass-bg/10">
        {/* Toolbar with generation controls and model selector */}
        <BatchControls />

        {/* Two-panel layout: Asset tree (left) | Generation progress (right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Asset tree with hierarchical view */}
          <div className="w-1/2 border-r border-white/10 overflow-auto">
            <AssetTree />
          </div>

          {/* Right panel: Generation progress and live updates */}
          <div className="w-1/2 overflow-auto">
            <GenerationProgress />
          </div>
        </div>
      </div>
    </GenerationContext.Provider>
  )
}
