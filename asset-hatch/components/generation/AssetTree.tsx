/**
 * AssetTree Component
 * 
 * Hierarchical display of all assets from the parsed plan,
 * organized by category with collapsible sections.
 * 
 * Features:
 * - Status badges per asset (⏳ Pending, 🔄 Generating, ✅ Complete, ❌ Failed)
 * - Click to expand and show PromptPreview
 * - Individual "Regenerate" buttons
 * - Category-level progress indicators
 */

'use client'

import type { JSX } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, Eye, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGenerationContext } from './GenerationQueue'
import { PromptPreview } from './PromptPreview'
import type { ParsedAsset } from '@/lib/prompt-builder'

/**
 * Group assets by category for hierarchical display
 * 
 * @param assets - Array of parsed assets
 * @returns Map of category name to assets in that category
 */
function groupAssetsByCategory(assets: ParsedAsset[]): Map<string, ParsedAsset[]> {
  const groups = new Map<string, ParsedAsset[]>()
  
  for (const asset of assets) {
    const category = asset.category || 'Uncategorized'
    const existing = groups.get(category) || []
    groups.set(category, [...existing, asset])
  }
  
  return groups
}

/**
 * Get status badge for an asset
 * 
 * @param assetId - Asset ID to check status for
 * @param completed - Set of completed asset IDs
 * @param failed - Map of failed asset IDs to errors
 * @param currentAssetId - ID of asset currently being generated
 * @returns Status display element
 */
function getStatusBadge(
  assetId: string,
  completed: Set<string>,
  failed: Map<string, Error>,
  currentAssetId: string | null
): JSX.Element {
  if (failed.has(assetId)) {
    // Failed generation
    return (
      <span className="text-red-400 text-sm" title={failed.get(assetId)?.message}>
        ❌ Failed
      </span>
    )
  }
  
  if (completed.has(assetId)) {
    // Successfully generated
    return <span className="text-green-400 text-sm">✅ Complete</span>
  }
  
  if (currentAssetId === assetId) {
    // Currently generating
    return (
      <span className="text-purple-400 text-sm flex items-center gap-1">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Generating
      </span>
    )
  }
  
  // Pending generation
  return <span className="text-white/40 text-sm">⏳ Pending</span>
}

/**
 * AssetTreeItem Component
 * 
 * Displays a single asset with status and action buttons
 */
function AssetTreeItem({ asset }: { asset: ParsedAsset }) {
  const { completed, failed, currentAsset, regenerateAsset, generatePrompt, generatedPrompts } = useGenerationContext()
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if this asset is currently being generated
  const currentAssetId = currentAsset?.id || null

  // Check if prompt has been generated for this asset
  const hasPrompt = generatedPrompts.has(asset.id)

  // Get variant display name
  const variantName = asset.variant?.name || 'Default'

  // Handle regenerate click
  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding when clicking button
    await regenerateAsset(asset.id)
  }

  // Handle generate prompt click
  const handleGeneratePrompt = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding when clicking button
    try {
      await generatePrompt(asset)
      setIsExpanded(true) // Auto-expand to show the generated prompt
    } catch (err) {
      console.error('Failed to generate prompt:', err)
    }
  }

  // Handle view/expand click
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }
  
  return (
    <div className="ml-4 mb-2">
      <div
        className="glass-panel p-3 hover:bg-white/5 transition-all cursor-pointer group"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Asset info */}
          <div className="flex items-center gap-2 flex-1">
            {/* Expand/collapse chevron */}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/40" />
            )}
            
            {/* Asset name and variant */}
            <div>
              <span className="font-medium text-white/90">{asset.name}</span>
              <span className="text-sm text-white/60 ml-2">
                {variantName}
                {asset.variant?.frameCount && ` (${asset.variant.frameCount} frames)`}
              </span>
            </div>
          </div>
          
          {/* Middle: Status badge */}
          <div className="mx-4">
            {getStatusBadge(asset.id, completed, failed, currentAssetId)}
          </div>
          
          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Generate Prompt button - only show if prompt hasn't been generated yet */}
            {!hasPrompt && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGeneratePrompt}
                className="text-xs aurora-gradient"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Generate Prompt
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleExpand}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>

            {completed.has(asset.id) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRegenerate}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
        
        {/* Expanded: Show PromptPreview */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <PromptPreview asset={asset} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * CategorySection Component
 * 
 * Collapsible category with progress indicator
 */
function CategorySection({
  category,
  assets,
}: {
  category: string
  assets: ParsedAsset[]
}) {
  const { completed, failed } = useGenerationContext()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Calculate progress for this category
  const totalAssets = assets.length
  const completedCount = assets.filter(a => completed.has(a.id)).length
  const failedCount = assets.filter(a => failed.has(a.id)).length
  
  return (
    <div className="mb-4">
      {/* Category header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 glass-panel hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
          <h3 className="font-semibold text-white/90">{category}</h3>
          <span className="text-sm text-white/50">
            ({completedCount}/{totalAssets})
          </span>
        </div>
        
        {/* Progress indicator */}
        {failedCount > 0 && (
          <span className="text-xs text-red-400">{failedCount} failed</span>
        )}
      </button>
      
      {/* Asset list */}
      {!isCollapsed && (
        <div className="mt-2">
          {assets.map(asset => (
            <AssetTreeItem key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main AssetTree Component
 * 
 * Displays all assets organized by category
 */
export function AssetTree() {
  const { parsedAssets } = useGenerationContext()
  
  // Group assets by category
  const categoryGroups = groupAssetsByCategory(parsedAssets)
  
  // Convert to sorted array for display
  const categories = Array.from(categoryGroups.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white/90">Asset Queue</h2>
        <p className="text-sm text-white/60">
          {parsedAssets.length} assets ready to generate
        </p>
      </div>
      
      {categories.map(([category, assets]) => (
        <CategorySection key={category} category={category} assets={assets} />
      ))}
    </div>
  )
}
