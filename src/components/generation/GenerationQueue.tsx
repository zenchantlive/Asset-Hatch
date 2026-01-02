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

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { parsePlan } from '@/lib/plan-parser'
import { useBatchGeneration } from '@/hooks/useBatchGeneration'
import { buildAssetPrompt, type ParsedAsset } from '@/lib/prompt-builder'
import { db } from '@/lib/client-db'
import { getDefaultModel } from '@/lib/model-registry'
import type {
  GenerationQueueProps,
  GenerationContextValue,
  GenerationLogEntry,
} from '@/lib/types/generation'
// PHASE 8: Import direction utilities for reference propagation
import { isReferenceDirection, getDirectionalSiblings } from '@/lib/direction-utils'
// New layout system
import { GenerationLayoutProvider } from './GenerationLayoutContext'

import { GenerationLayout } from './GenerationLayout'

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

  // Selected model for generation - initialized from model registry
  // This is the full OpenRouter model ID (e.g., 'google/gemini-2.5-flash-image')
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Use multimodal default for image generation with style consistency
    return getDefaultModel('multimodal').id;
  })

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

  // Load generated assets from Dexie on mount
  useEffect(() => {
    async function loadGeneratedAssets() {
      try {
        const assets = await db.generated_assets
          .where('project_id')
          .equals(projectId)
          .toArray();

        if (assets.length > 0) {

          // Populate asset states and prompts
          setAssetStates(prev => {
            const next = new Map(prev);
            assets.forEach(asset => {
              // Map DB status to UI status
              let uiStatus: import('@/lib/types/generation').AssetGenerationState['status'] = 'awaiting_approval';

              if (asset.status === 'approved') uiStatus = 'approved';
              else if (asset.status === 'rejected') uiStatus = 'rejected';
              else if (asset.status === 'generated') uiStatus = 'awaiting_approval';

              next.set(asset.asset_id, {
                status: uiStatus,
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

          // Also restore prompts so they show up in the UI
          setGeneratedPrompts(prev => {
            const next = new Map(prev);
            assets.forEach(asset => {
              if (asset.prompt_used) {
                next.set(asset.asset_id, asset.prompt_used);
              }
            });
            return next;
          });

          addLogEntry('info', `Restored ${assets.length} generated assets`);
        }
      } catch (err) {
        console.error('Failed to load generated assets:', err);
      }
    }

    if (!isLoading) {
      loadGeneratedAssets();
    }
  }, [projectId, isLoading, addLogEntry]);

  /**
   * Start batch generation with current settings
   *
   * Initiates generation of all assets using the selected model
   * and any custom/generated prompts.
   * 
   * @param selectedIds - Optional set of asset IDs to generate. If empty, generates all assets.
   */
  const startGeneration = useCallback(async (selectedIds: Set<string> = new Set()) => {
    // Filter assets: use selected if any, otherwise use all
    const assetsToGenerate = selectedIds.size > 0
      ? parsedAssets.filter(asset => selectedIds.has(asset.id))
      : parsedAssets

    addLogEntry('info', `Starting batch generation with ${selectedModel} (${assetsToGenerate.length} assets)`)

    try {
      // Pass generated prompts to batch generation
      // The hook will use these if available, otherwise generate defaults
      await batchGeneration.startBatch(
        assetsToGenerate, // Only generate selected assets
        selectedModel,
        generatedPrompts, // Pass the prompts map
        {
          // Callback: Asset starts generating
          onAssetStart: (assetId: string) => {
            setAssetStates(prev => {
              const next = new Map(prev)
              next.set(assetId, { status: 'generating' })
              return next
            })
            const asset = parsedAssets.find(a => a.id === assetId)
            if (asset) {
              addLogEntry('info', `Generating: ${asset.name}`)
            }
          },

          // Callback: Asset completes successfully
          onAssetComplete: (assetId: string, result) => {
            // Debug logging to verify result structure
            console.log('[onAssetComplete] assetId:', assetId)
            console.log('[onAssetComplete] result:', JSON.stringify({
              id: result.id,
              hasImageUrl: !!result.imageUrl,
              imageUrlLength: result.imageUrl?.length,
              hasPrompt: !!result.prompt,
              hasMetadata: !!result.metadata
            }, null, 2))

            setAssetStates(prev => {
              const next = new Map(prev)
              next.set(assetId, {
                status: 'awaiting_approval',
                result: result,
              })
              return next
            })

            // Update the prompt with the one actually used
            if (result.prompt) {
              setGeneratedPrompts(prev => {
                const next = new Map(prev)
                next.set(assetId, result.prompt)
                return next
              })
            }

            const asset = parsedAssets.find(a => a.id === assetId)
            if (asset) {
              addLogEntry('success', `Generated: ${asset.name}`)
            }
          },

          // Callback: Asset generation fails
          onAssetError: (assetId: string, error) => {
            setAssetStates(prev => {
              const next = new Map(prev)
              next.set(assetId, {
                status: 'error',
                error: error,
              })
              return next
            })
            const asset = parsedAssets.find(a => a.id === assetId)
            if (asset) {
              addLogEntry('error', `Failed: ${asset.name} - ${error.message}`)
            }
          },
        }
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
   * Update the current version index for an asset
   *
   * @param assetId - ID of the asset
   * @param index - New version index
   */
  const updateVersionIndex = useCallback((assetId: string, index: number) => {
    setAssetStates(prev => {
      const next = new Map(prev)
      const state = prev.get(assetId)
      if (state && state.status === 'awaiting_approval' && state.versions && state.versions[index]) {
        next.set(assetId, {
          ...state,
          currentVersionIndex: index,
          result: { // Update result to reflect the currently selected version
            id: state.versions[index].id,
            imageUrl: state.versions[index].image_base64 || '',
            prompt: state.versions[index].prompt_used,
            metadata: state.versions[index].generation_metadata
          }
        })
      }
      return next
    })
  }, [])

  /**
   * Update the custom prompt for an asset
   *
   * @param assetId - ID of the asset
   * @param customPrompt - Custom prompt override
   */
  const updatePrompt = useCallback((assetId: string, customPrompt: string) => {
    console.log('[updatePrompt] Updating prompt for', assetId, 'to:', customPrompt.substring(0, 100) + '...')
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
   * Preserves all generated versions for carousel display.
   *
   * @param assetId - ID of the asset to generate
   */
  const generateImage = useCallback(async (assetId: string, providedAsset?: ParsedAsset) => {
    // Use provided asset if available (avoids race condition with newly added assets)
    const asset = providedAsset || parsedAssets.find(a => a.id === assetId)
    if (!asset) {
      addLogEntry('error', `Asset not found: ${assetId}`)
      return
    }

    // Get the custom or generated prompt, or generate one if it doesn't exist
    let prompt = generatedPrompts.get(assetId)
    console.log('[generateImage] Using prompt for', asset.name, ':', prompt?.substring(0, 100) + '...')
    if (!prompt) {
      addLogEntry('info', `Generating prompt for: ${asset.name}`)
      try {
        prompt = await generatePrompt(asset)
        // Store the generated prompt
        setGeneratedPrompts(prev => {
          const next = new Map(prev)
          next.set(assetId, prompt!)
          return next
        })
      } catch {
        addLogEntry('error', `Failed to generate prompt for: ${asset.name}`)
        return
      }
    }

    // Fetch existing versions for this asset
    const existingVersions = await db.asset_versions
      .where('asset_id')
      .equals(assetId)
      .toArray()

    const nextVersionNumber = existingVersions.length + 1

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

    addLogEntry('info', `Generating image for: ${asset.name} (v${nextVersionNumber})`)

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

      // Convert image URL to Blob for storage
      const imageBlob = await fetch(data.asset.imageUrl).then(r => r.blob())

      // Save new version to asset_versions table
      const newVersionId = crypto.randomUUID()
      await db.asset_versions.add({
        id: newVersionId,
        project_id: projectId,
        asset_id: assetId,
        version_number: nextVersionNumber,
        image_blob: imageBlob,
        image_base64: data.asset.imageUrl,
        prompt_used: data.asset.prompt,
        generation_metadata: data.asset.metadata,
        created_at: new Date().toISOString(),
      })

      // Fetch all versions including the new one
      const allVersions = await db.asset_versions
        .where('asset_id')
        .equals(assetId)
        .sortBy('version_number')

      // Mark as awaiting approval with all versions for carousel
      setAssetStates(prev => {
        const next = new Map(prev)
        next.set(assetId, {
          status: 'awaiting_approval',
          result: data.asset,
          versions: allVersions,
          currentVersionIndex: allVersions.length - 1, // Show newest version by default
        })
        return next
      })

      addLogEntry('success', `Image generated for: ${asset.name} (v${nextVersionNumber})`)

      // Trigger actual cost sync in the background
      if (data.asset.metadata?.generation_id) {
        fetch('/api/generation/sync-cost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            generation_id: data.asset.metadata.generation_id,
            projectId,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              const syncData = await res.json()
              if (syncData.success && syncData.cost) {
                const actualCost = syncData.cost.totalCost
                // Update the version in Dexie
                await db.asset_versions.update(newVersionId, {
                  generation_metadata: {
                    ...data.asset.metadata,
                    cost: actualCost
                  }
                })

                // Update local state if this is still the current state
                setAssetStates(prev => {
                  const current = prev.get(assetId)
                  if (current && current.status === 'awaiting_approval' && current.versions) {
                    const nextVersions = [...current.versions]
                    const vIndex = nextVersions.findIndex(v => v.id === newVersionId)
                    if (vIndex !== -1) {
                      nextVersions[vIndex] = {
                        ...nextVersions[vIndex],
                        generation_metadata: {
                          ...nextVersions[vIndex].generation_metadata,
                          cost: actualCost
                        }
                      }
                      const next = new Map(prev)
                      next.set(assetId, {
                        ...current,
                        versions: nextVersions
                      })
                      return next
                    }
                  }
                  return prev
                })
              }
            }
          })
          .catch((err) => console.error('💰 Latency Fetch Error:', err))
      }
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
  }, [parsedAssets, generatedPrompts, projectId, selectedModel, addLogEntry, generatePrompt])

  // Calculate aggregate costs
  const { totalEstimatedCost, totalActualCost } = useMemo(() => {
    let act = 0
    let errs = 0
    let completedSyncs = 0

    assetStates.forEach((state, id) => {
      // Use status check for type narrowing
      if (state.status === 'awaiting_approval' || state.status === 'approved') {
        if (state.versions && state.versions.length > 0) {
          // Use the current version for the "active" cost
          const currentVersion = state.versions[state.currentVersionIndex || 0]
          const cost = currentVersion?.generation_metadata?.cost || 0

          act += cost

          // If we have an actual cost (lookup from metadata), we count it as synced
          if (currentVersion?.generation_metadata?.generation_id) {
            // Access syncErrors from batchGeneration
            if (batchGeneration.syncErrors[id]) {
              errs++
            } else {
              completedSyncs++
            }
          }
        }
      }
    })

    return {
      totalEstimatedCost: act * 1.05, // Mocking an estimate for UI demonstration
      totalActualCost: act,
      syncErrorCount: errs,
      completedCostSyncs: completedSyncs
    }
  }, [assetStates, batchGeneration.syncErrors])

  /**
   * Approve a generated asset
   * 
   * Saves the generated asset to Dexie database for later export.
   * Converts the result to the GeneratedAsset format and persists it.
   * 
   * @param assetId - ID of the asset to approve
   * @param version - The specific version to approve
   */
  const approveAsset = useCallback(async (assetId: string, version: import('@/lib/client-db').AssetVersion) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    const currentState = assetStates.get(assetId)

    if (!asset || !currentState || currentState.status !== 'awaiting_approval') {
      addLogEntry('error', 'Cannot approve asset: invalid state')
      return
    }

    addLogEntry('info', `Approving asset: ${asset.name} (v${version.version_number})`)

    try {
      // Use existing blob if available, otherwise fetch from url
      let blob = version.image_blob
      if (!blob && version.image_base64) {
        const response = await fetch(version.image_base64)
        blob = await response.blob()
      }

      if (!blob) {
        throw new Error('No image data found for version')
      }

      // Save to Dexie
      const now = new Date().toISOString()
      await db.generated_assets.add({
        id: version.id, // Use version ID as generated asset ID
        project_id: projectId,
        asset_id: assetId,
        variant_id: asset.variant?.id || '', // Use variant ID if exists
        image_blob: blob,
        image_base64: version.image_base64 || '',
        prompt_used: version.prompt_used,
        generation_metadata: version.generation_metadata,
        status: 'approved',
        created_at: now,
        updated_at: now,
      })

      try {
        const arrayBuffer = await blob.arrayBuffer()
        // Convert to base64 in chunks to avoid stack overflow
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        const len = bytes.byteLength
        const chunkSize = 16384 // Process 16KB at a time
        for (let i = 0; i < len; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
        }
        const base64Image = btoa(binary)
        // Sync to Prisma (server) so export API can find it
        const response = await fetch('/api/generated-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: version.id,
            projectId: projectId,
            assetId: assetId,
            imageBlob: base64Image,
            promptUsed: version.prompt_used,
            seed: version.generation_metadata.seed,
            metadata: version.generation_metadata,
            status: 'approved',
          }),
        })
        if (!response.ok) {
          throw new Error(`Asset sync failed: ${response.status} ${response.statusText}`)
        }
        addLogEntry('info', `Asset synced to server: ${asset.name}`)

      } catch (syncError) {
        console.error('Failed to sync approved asset to server:', syncError)
        addLogEntry('error', `Asset approved locally but not synced to server`)
      }

      // Mark as approved in UI state
      setAssetStates(prev => {
        const next = new Map(prev)
        const state = prev.get(assetId)
        if (state && state.status === 'awaiting_approval') {
          next.set(assetId, {
            status: 'approved',
            result: {
              id: version.id,
              imageUrl: version.image_base64 || '',
              prompt: version.prompt_used,
              metadata: version.generation_metadata
            },
          })
        }
        return next
      })

      addLogEntry('success', `Asset approved: ${asset.name}`)

      // PHASE 8: Reference Propagation - If this is Front direction of a moveable asset, propagate reference
      if (isReferenceDirection(asset) && asset.mobility?.type === 'moveable') {
        const approvedImageUrl = version.image_base64;

        if (approvedImageUrl) {
          // Find all sibling directional variants
          const siblings = getDirectionalSiblings(asset, parsedAssets);

          if (siblings.length > 0) {
            addLogEntry('info', `📸 Propagating Front reference to ${siblings.length} sibling directions`)

            // Update each sibling's directionState with reference image
            siblings.forEach(sibling => {
              // In-place mutation is acceptable here since parsedAssets is mutable state
              if (sibling.directionState) {
                sibling.directionState.referenceImageBase64 = approvedImageUrl;
                sibling.directionState.referenceDirection = 'front';
              }
            });

            addLogEntry('success', `Reference image propagated to ${siblings.length} directional variants`)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLogEntry('error', `Failed to approve asset: ${errorMessage}`)
    }
  }, [parsedAssets, projectId, addLogEntry, assetStates])

  /**
   * Reject a generated asset
   * 
   * Marks the asset as rejected, allowing the user to regenerate with different settings.
   * 
   * @param assetId - ID of the asset
   * @param versionId - ID of the version to reject
   */
  const rejectAsset = useCallback(async (assetId: string, versionId: string) => {
    const asset = parsedAssets.find(a => a.id === assetId)
    if (!asset) return

    try {
      // Delete version from DB
      await db.asset_versions.delete(versionId)

      // Update state to remove version
      setAssetStates(prev => {
        const next = new Map(prev)
        const currentState = next.get(assetId)

        if (currentState && currentState.status === 'awaiting_approval' && currentState.versions) {
          const updatedVersions = currentState.versions.filter(v => v.id !== versionId)

          if (updatedVersions.length === 0) {
            // If no versions left, mark as rejected/pending
            // Or effectively reset to initial state if desired?
            // User request says "rejects the entire asset, not just the specific version" was the BUG.
            // So here we stay in awaiting_approval if versions remain, or go to rejected if empty?
            // Going to 'rejected' allows regenerating.
            next.set(assetId, { status: 'rejected' })
          } else {
            // Update versions and reset index if needed
            const newIndex = Math.min(
              currentState.currentVersionIndex || 0,
              updatedVersions.length - 1
            )

            next.set(assetId, {
              ...currentState,
              versions: updatedVersions,
              currentVersionIndex: newIndex,
              // Update result to current version if needed
              result: {
                id: updatedVersions[newIndex].id,
                imageUrl: updatedVersions[newIndex].image_base64 || '',
                prompt: updatedVersions[newIndex].prompt_used,
                metadata: updatedVersions[newIndex].generation_metadata
              }
            })
          }
        }
        return next
      })

      addLogEntry('info', `Version rejected: ${asset.name}`)
    } catch (err) {
      console.error('Failed to reject version:', err)
      addLogEntry('error', 'Failed to reject version')
    }
  }, [parsedAssets, addLogEntry])

  /**
   * Add a new asset to the parsed assets array
   *
   * Used for creating direction children on-demand when generating multi-directional assets.
   *
   * @param asset - The new asset to add (typically a direction variant)
   */
  const addAsset = useCallback((asset: ParsedAsset) => {
    setParsedAssets(prev => {
      // Check if asset already exists (prevent duplicates)
      if (prev.some(a => a.id === asset.id)) {
        console.warn(`Asset ${asset.id} already exists, skipping duplicate`)
        return prev
      }

      // Add new asset
      addLogEntry('info', `Added new asset: ${asset.name}`)
      return [...prev, asset]
    })
  }, [addLogEntry])

  // Build the context value
  const contextValue: GenerationContextValue = {
    parsedAssets,
    queue: batchGeneration.queue.map(asset => {
      const state = assetStates.get(asset.id)
      return {
        asset,
        status: state?.status === 'generating' ? 'generating' :
          state?.status === 'approved' || state?.status === 'awaiting_approval' ? 'success' :
            state?.status === 'error' ? 'error' : 'idle',
        result: (state?.status === 'approved' || state?.status === 'awaiting_approval') ? state.result : null,
        error: state?.status === 'error' ? state.error : null,
        customPrompt: generatedPrompts.get(asset.id) || null
      }
    }),
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
    updateVersionIndex,
    addAsset,
    progress: batchGeneration.progress,
    isSyncingCost: batchGeneration.isSyncingCost,
    syncErrors: batchGeneration.syncErrors,
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

  // Main UI - New responsive generation interface
  return (
    <GenerationContext.Provider value={contextValue}>
      <GenerationLayoutProvider
        generationContext={contextValue}
        totalEstimatedCost={totalEstimatedCost}
        totalActualCost={totalActualCost}
      >
        <GenerationLayout />
      </GenerationLayoutProvider>
    </GenerationContext.Provider>
  )
}
