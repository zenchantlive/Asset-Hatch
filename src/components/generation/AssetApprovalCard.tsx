/**
 * AssetApprovalCard Component
 *
 * Displays a generated asset image with approval controls.
 * Shown in GenerationProgress when an asset is awaiting approval.
 *
 * Features:
 * - Large image preview
 * - Asset name and category
 * - Prompt used for generation
 * - Generation metadata (model, seed, cost, duration)
 * - Approve and Reject buttons
 * - Regenerate option
 */

'use client'

import { Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParsedAsset } from '@/lib/prompt-builder'
import type { GeneratedAssetResult } from '@/lib/types/generation'

/**
 * Props for AssetApprovalCard component
 */
interface AssetApprovalCardProps {
  asset: ParsedAsset
  result: GeneratedAssetResult
  onApprove: () => void
  onReject: () => void
  onRegenerate: () => void
}

/**
 * AssetApprovalCard Component
 *
 * Shows generated image with approval controls
 */
export function AssetApprovalCard({
  asset,
  result,
  onApprove,
  onReject,
  onRegenerate,
}: AssetApprovalCardProps) {
  return (
    <div className="glass-panel p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white/90">{asset.name}</h3>
          <p className="text-sm text-white/60">{asset.category}</p>
        </div>

        {/* Regenerate button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onRegenerate}
          className="text-xs"
          title="Regenerate with same prompt"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Regenerate
        </Button>
      </div>

      {/* Approval Buttons - Moved to top */}
      <div className="flex gap-3">
        <Button
          onClick={onApprove}
          className="flex-1 aurora-gradient font-semibold"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve & Save
        </Button>

        <Button
          onClick={onReject}
          variant="destructive"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>

      {/* Generated Image */}
      <div className="relative aspect-square w-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.imageUrl}
          alt={asset.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Prompt Used */}
      <div className="bg-black/20 rounded-lg p-3 border border-white/10">
        <p className="text-xs text-white/60 mb-1 font-semibold">Prompt Used:</p>
        <p className="text-sm text-white/80 font-mono">{result.prompt}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-black/20 rounded p-2 border border-white/10">
          <span className="text-white/60">Model:</span>
          <span className="ml-2 text-white/90 font-medium">{result.metadata.model}</span>
        </div>
        <div className="bg-black/20 rounded p-2 border border-white/10">
          <span className="text-white/60">Seed:</span>
          <span className="ml-2 text-white/90 font-mono">{result.metadata.seed}</span>
        </div>
        <div className="bg-black/20 rounded p-2 border border-white/10">
          <span className="text-white/60">Cost:</span>
          <span className="ml-2 text-white/90 font-medium">${result.metadata.cost.toFixed(4)}</span>
        </div>
        <div className="bg-black/20 rounded p-2 border border-white/10">
          <span className="text-white/60">Duration:</span>
          <span className="ml-2 text-white/90 font-medium">{(result.metadata.duration_ms / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-xs text-white/70">
        <strong className="text-purple-300">Tip:</strong> Approve to save this asset to your project.
        Reject to try again with different settings or a modified prompt.
      </div>
    </div>
  )
}
