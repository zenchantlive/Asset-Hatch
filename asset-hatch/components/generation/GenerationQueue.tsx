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
import { buildAssetPrompt, type ParsedAsset } from '@/lib/prompt-builder'
import { db } from '@/lib/client-db'
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

  // Generated prompts for assets (assetId → generatedPrompt)
  const [generatedPrompts, setGeneratedPrompts] = useState<Map<string, string>>(new Map())

  // Individual asset generation states (assetId → AssetGenerationState)
  const [assetStates, setAssetStates] = useState<Map<string, import('@/lib/types/generation').AssetGenerationState>>(new Map())

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
        // Fetch the entities.json file from the server via our new API endpoint
        // This endpoint returns { success: boolean, files: MemoryFile[] }
        const response = await fetch(`/api/projects/${projectId}/memory-files?type=entities.json`)

        // Check HTTP status - provide detailed error message including status code
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Parse the JSON response
        const data = await response.json()

        // Validate API response structure
        // Check both 'success' flag and 'files' array existence
        if (!data.success || !data.files || data.files.length === 0) {
          setLoadError('No plan found. Please create a plan in the Planning tab first.')
          setIsLoading(false)
          return
        }

        // Get the first (should be only) entities.json file
        const entitiesFile = data.files[0]

        // Validate file content exists
        if (!entitiesFile.content || entitiesFile.content.trim() === '') {
          setLoadError('Plan file is empty. Please create a valid plan first.')
          setIsLoading(false)
          return
        }

        // Parse the markdown plan into structured assets
        // Use 'composite' mode by default (sprite sheets)
        // This will throw if the plan format is invalid
        const parsed = parsePlan(entitiesFile.content, {
          mode: 'composite',
          projectId,
        })

        // Validate parsed assets
        if (!parsed || parsed.length === 0) {
          setLoadError('No assets found in plan. Please create a valid plan with assets.')
          setIsLoading(false)
          return
        }

        // Update state with parsed assets
        setParsedAssets(parsed)

        // Add success log entry
        addLogEntry('info', `Loaded ${parsed.length} assets from plan`)

        // Clear loading state
        setIsLoading(false)
      } catch (err) {
        // Handle any errors during fetch or parsing
        // Provide user-friendly error messages
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setLoadError(`Failed to load plan: ${errorMessage}`)
        addLogEntry('error', `Failed to load plan: ${errorMessage}`)
        setIsLoading(false)
      }
    }

    loadPlan()
  }, [projectId, addLogEntry])

  // Load approved assets from Dexie on mount
  useEffect(() => {
    async function loadApprovedAssets() {
      try {
        const approvedAssets = await db.generated_assets
          .where('project_id')
          .equals(projectId)
          .filter(a => a.status === 'approved')
          .toArray();

        if (approvedAssets.length > 0) {
          setAssetStates(prev => {
            const next = new Map(prev);
            approvedAssets.forEach(asset => {
              next.set(asset.asset_id, {
                status: 'approved',
                result: {
                  id: asset.id,
                  imageUrl: asset.image_base64 || '', // Use cached base64
                  prompt: asset.prompt_used,
                  metadata: asset.generation_metadata || {},
                }
              });
            });
            return next;
          });

          addLogEntry('info', `Restored ${approvedAssets.length} approved assets`);
        }
      } catch (err) {
        console.error('Failed to load approved assets:', err);
      }
    }

    if (!isLoading) {
      loadApprovedAssets();
    }
  }, [projectId, isLoading, addLogEntry]);

  /**
   * Start batch generation with current settings
   *
   * Initiates generation of all assets using the selected model
   * and any custom/generated prompts.
   */
  const startGeneration = useCallback(async () => {
    addLogEntry('info', `Starting batch generation with ${selectedModel}`)

    try {
      // Pass generated prompts to batch generation
      // The hook will use these if available, otherwise generate defaults
      await batchGeneration.startBatch(
        parsedAssets,
        selectedModel,
        generatedPrompts // Pass the prompts map
      )
      addLogEntry('success', 'Batch generation completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Batch generation failed: ${errorMessage}`)
    }
  }, [parsedAssets, selectedModel, generatedPrompts, batchGeneration, addLogEntry])

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
    setGeneratedPrompts(prev => {
      const next = new Map(prev)
      next.set(assetId, customPrompt)
      return next
    })
  }, [])

  /**
   * Generate a prompt for an asset using buildAssetPrompt
   *
   * Fetches project data, style anchor, and character registry from Dexie,
   * then builds an optimized Flux.2 prompt using the prompt builder.
   *
   * @param asset - The parsed asset to generate a prompt for
   * @returns The generated prompt string
   * @throws Error if project not found
   */
  const generatePrompt = useCallback(async (asset: ParsedAsset): Promise<string> => {
    try {
      // Fetch project from Dexie to get quality parameters
      const project = await db.projects.get(projectId)
      if (!project) {
        throw new Error('Project not found')
      }

      // Fetch style anchor from Dexie (if exists)
      const styleAnchor = await db.style_anchors
        .where('project_id')
        .equals(projectId)
        .first()

      // Fetch character registry if this is a character asset
      let characterRegistry = undefined
      if (asset.category === 'Characters') {
        characterRegistry = await db.character_registry
          .where('project_id')
          .equals(projectId)
          .filter(reg => reg.name.toLowerCase() === asset.name.toLowerCase())
          .first()
      }

      // Build the prompt using the imported buildAssetPrompt function
      const prompt = buildAssetPrompt(asset, project, styleAnchor, characterRegistry)

      // Store the generated prompt in state
      setGeneratedPrompts(prev => {
        const next = new Map(prev)
        next.set(asset.id, prompt)
        return next
      })

      addLogEntry('info', `Generated prompt for ${asset.name}`)

      return prompt
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Failed to generate prompt: ${errorMessage}`)
      throw err
    }
  }, [projectId, addLogEntry])

  /**
   * Generate image for a single asset
   * 
   * Calls the /api/generate endpoint with the asset and its prompt.
   * Updates asset state through the generation lifecycle.
   * 
   * @param assetId - ID of the asset to generate
   */
  const generateImage = useCallback(async (assetId: string) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    if (!asset) {
      addLogEntry('error', `Asset not found: ${assetId}`)
      return
    }

    // Get the custom or generated prompt
    const prompt = generatedPrompts.get(assetId)
    if (!prompt) {
      addLogEntry('error', `No prompt found for asset: ${asset.name}`)
      return
    }

    // Fetch style anchor image for visual consistency
    const styleAnchor = await db.style_anchors
      .where('project_id')
      .equals(projectId)
      .first()

    // Mark as generating
    setAssetStates(prev => {
      const next = new Map(prev)
      next.set(assetId, { status: 'generating' })
      return next
    })

    addLogEntry('info', `Generating image for: ${asset.name}`)

    try {
      // Call the generation API endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          asset,
          modelKey: selectedModel,
          customPrompt: prompt,
          styleAnchorImageUrl: styleAnchor?.reference_image_blob, // Pass style anchor for visual consistency
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Generation failed`)
      }

      const data = await response.json()

      if (!data.success || !data.asset) {
        throw new Error('Invalid response format from generation API')
      }

      // Mark as awaiting approval
      setAssetStates(prev => {
        const next = new Map(prev)
        next.set(assetId, {
          status: 'awaiting_approval',
          result: data.asset,
        })
        return next
      })

      addLogEntry('success', `Image generated for: ${asset.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Mark as error
      setAssetStates(prev => {
        const next = new Map(prev)
        next.set(assetId, {
          status: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        })
        return next
      })

      addLogEntry('error', `Generation failed for ${asset.name}: ${errorMessage}`)
    }
  }, [parsedAssets, generatedPrompts, projectId, selectedModel, addLogEntry])

  /**
   * Approve a generated asset
   * 
   * Saves the generated asset to Dexie database for later export.
   * Converts the result to the GeneratedAsset format and persists it.
   * 
   * @param assetId - ID of the asset to approve
   */
  const approveAsset = useCallback(async (assetId: string) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    const state = assetStates.get(assetId)

    if (!asset || !state || state.status !== 'awaiting_approval') {
      addLogEntry('error', 'Cannot approve asset: invalid state')
      return
    }

    addLogEntry('info', `Approving asset: ${asset.name}`)

    try {
      // Convert data URL to Blob
      const response = await fetch(state.result.imageUrl)
      const blob = await response.blob()

      // Save to Dexie
      const now = new Date().toISOString()
      await db.generated_assets.add({
        id: state.result.id,
        project_id: projectId,
        asset_id: assetId,
        variant_id: asset.variant?.id || '', // Use variant ID if exists
        image_blob: blob, // Convert data URL to Blob
        image_base64: state.result.imageUrl, // Cache for display
        prompt_used: state.result.prompt,
        generation_metadata: state.result.metadata,
        status: 'approved',
        created_at: now,
        updated_at: now,
      })

      // Sync to Prisma (server) so export API can find it
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const base64Image = Buffer.from(arrayBuffer).toString('base64')

        await fetch('/api/generated-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: state.result.id,
            projectId: projectId,
            assetId: assetId,
            imageBlob: base64Image,
            promptUsed: state.result.prompt,
            seed: state.result.metadata.seed,
            metadata: state.result.metadata,
            status: 'approved',
          }),
        })

        addLogEntry('info', `Asset synced to server: ${asset.name}`)
      } catch (syncError) {
        console.error('Failed to sync approved asset to server:', syncError)
        addLogEntry('error', `Asset approved locally but not synced to server`)
      }

      // Mark as approved
      setAssetStates(prev => {
        const next = new Map(prev)
        next.set(assetId, {
          status: 'approved',
          result: state.result,
        })
        return next
      })

      addLogEntry('success', `Asset approved: ${asset.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Failed to approve asset: ${errorMessage}`)
    }
  }, [parsedAssets, assetStates, projectId, addLogEntry])

  /**
   * Reject a generated asset
   * 
   * Marks the asset as rejected, allowing the user to regenerate with different settings.
   * 
   * @param assetId - ID of the asset to reject
   */
  const rejectAsset = useCallback((assetId: string) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    if (!asset) return

    setAssetStates(prev => {
      const next = new Map(prev)
      next.set(assetId, { status: 'rejected' })
      return next
    })

    addLogEntry('info', `Asset rejected: ${asset.name}`)
  }, [parsedAssets, addLogEntry])

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
    generatedPrompts,
    assetStates,
    generatePrompt,
    generateImage,
    approveAsset,
    rejectAsset,
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
