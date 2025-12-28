/**
 * PromptPreview Component
 * 
 * Displays the AI-generated prompt for an asset with editing capability.
 * Allows users to fine-tune prompts before expensive API calls.
 * 
 * Features:
 * - View generated prompt with priority breakdown
 * - Editable textarea for manual refinement
 * - Copy to clipboard functionality
 * - Reset to default button
 * - Live character count
 * - Style anchor thumbnail preview (if available)
 */

'use client'

import { useState } from 'react'
import { Copy, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGenerationContext } from './GenerationQueue'
// TODO: Import buildAssetPrompt when ready to integrate
// import { buildAssetPrompt } from '@/lib/prompt-builder'
import type { ParsedAsset } from '@/lib/prompt-builder'

/**
 * Props for PromptPreview component
 */
interface PromptPreviewProps {
  asset: ParsedAsset
}

/**
 * PromptPreview Component
 * 
 * Editable prompt display with controls
 */
export function PromptPreview({ asset }: PromptPreviewProps) {
  // Get project context (will need project data for buildAssetPrompt)
  const { updatePrompt } = useGenerationContext()
  
  // Generate the default prompt once on mount
  // TODO: Replace with buildAssetPrompt() when project data is available
  const defaultPrompt = generatePlaceholderPrompt(asset)
  
  // Local state for prompt editing
  const [customPrompt, setCustomPrompt] = useState<string>(defaultPrompt)
  const [isEdited, setIsEdited] = useState(false)
  
  // Copy to clipboard state
  const [isCopied, setIsCopied] = useState(false)

  /**
   * Handle prompt text change
   * Marks as edited if different from default
   */
  const handlePromptChange = (value: string) => {
    setCustomPrompt(value)
    setIsEdited(value !== defaultPrompt)
    
    // Update the prompt override in global state
    updatePrompt(asset.id, value)
  }

  /**
   * Reset prompt to default
   */
  const handleReset = () => {
    setCustomPrompt(defaultPrompt)
    setIsEdited(false)
    updatePrompt(asset.id, defaultPrompt)
  }

  /**
   * Copy prompt to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customPrompt)
      setIsCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Calculate character count
  const charCount = customPrompt.length

  return (
    <div className="glass-panel p-4 space-y-3">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white/90">Generated Prompt</h4>
          {isEdited && (
            <span className="text-xs text-yellow-400">✏️ Modified</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-xs"
            title="Copy to clipboard"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          
          {/* Reset button */}
          {isEdited && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="text-xs"
              title="Reset to default"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Editable prompt textarea */}
      <Textarea
        value={customPrompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        rows={8}
        className="font-mono text-sm bg-black/20 border-white/10 focus:border-purple-500/50 resize-none"
        placeholder="Prompt will be generated based on your project settings..."
      />

      {/* Footer with metadata */}
      <div className="flex justify-between items-center text-xs text-white/60">
        {/* Character count */}
        <span>{charCount} characters</span>
        
        {/* Priority reminder */}
        <span className="text-right">
          Priority: Asset Type → Pose → Resolution → Style
        </span>
      </div>

      {/* Info box about prompt generation */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-xs text-white/70">
        <strong className="text-purple-300">Tip:</strong> The first 5 words carry
        the highest weight in Flux.2. Prompts are automatically optimized with
        asset type and subject first.
      </div>
    </div>
  )
}

/**
 * Generate a placeholder prompt for display
 * (Until we integrate with buildAssetPrompt and load project data)
 * 
 * @param asset - The parsed asset
 * @returns Placeholder prompt string
 */
function generatePlaceholderPrompt(asset: ParsedAsset): string {
  const { name, type, variant } = asset
  
  // Extract key information
  const assetType = type || 'character-sprite'
  const pose = variant?.pose || 'standing pose'
  const frameCount = variant?.frameCount
  
  // Build a reasonable placeholder
  const parts: string[] = []
  
  // Priority 1: Asset type + subject (HIGHEST WEIGHT)
  if (assetType === 'sprite-sheet') {
    parts.push(`sprite sheet of ${name.toLowerCase()} character`)
  } else if (assetType === 'character-sprite') {
    parts.push(`pixel art sprite of ${name.toLowerCase()} character`)
  } else if (assetType === 'tileset') {
    parts.push(`seamless tileset of ${name.toLowerCase()}`)
  } else if (assetType === 'icon') {
    parts.push(`${name.toLowerCase()} icon`)
  } else if (assetType === 'background') {
    parts.push(`${name.toLowerCase()} background scene`)
  } else {
    parts.push(`${name.toLowerCase()} game asset`)
  }
  
  // Priority 2: Pose/action
  if (pose) {
    parts.push(pose)
  }
  
  // Priority 3: Frame arrangement (for sprite sheets)
  if (frameCount && frameCount > 1) {
    parts.push(`${frameCount} frames arranged horizontally`)
  }
  
  // Priority 4: Style (placeholder)
  parts.push('16-bit pixel art style')
  
  // Priority 5: Resolution
  parts.push('32x32 base resolution')
  
  // Priority 6: Lighting (placeholder)
  parts.push('flat lighting')
  
  // Priority 7: Background
  parts.push('transparent background')
  
  // Priority 8: Consistency marker
  parts.push('game-ready asset')
  
  return parts.join(', ')
}
