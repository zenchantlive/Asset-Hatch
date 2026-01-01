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

import { useState, useEffect } from 'react'
import { Copy, RotateCcw, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGenerationContext } from './GenerationQueue'
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
  // Get context including prompt generation functions
  const { generatedPrompts, generatePrompt, updatePrompt, generateImage, assetStates } = useGenerationContext()

  // Local state for prompt editing
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [defaultPrompt, setDefaultPrompt] = useState<string>('')
  const [isEdited, setIsEdited] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Copy to clipboard state
  const [isCopied, setIsCopied] = useState(false)

  // Get current asset generation state
  const assetState = assetStates.get(asset.id)
  const isGeneratingImage = assetState?.status === 'generating'
  const hasGeneratedImage = assetState?.status === 'awaiting_approval' || assetState?.status === 'approved'

  /**
   * Load or generate prompt on mount
   * Checks if prompt already exists, otherwise generates a new one
   */
  useEffect(() => {
    async function loadPrompt() {
      // Check if prompt already generated for this asset
      const existing = generatedPrompts.get(asset.id)
      if (existing) {
        setCustomPrompt(existing)
        setDefaultPrompt(existing)
        return
      }

      // Generate new prompt using real project data
      setIsGenerating(true)
      try {
        const prompt = await generatePrompt(asset)
        setCustomPrompt(prompt)
        setDefaultPrompt(prompt)
      } catch (err) {
        console.error('Failed to generate prompt:', err)
        // Set a fallback message on error
        const fallback = `Failed to generate prompt. Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        setCustomPrompt(fallback)
        setDefaultPrompt(fallback)
      } finally {
        setIsGenerating(false)
      }
    }

    loadPrompt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id, generatedPrompts, generatePrompt])

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
   * Generate image for this asset
   */
  const handleGenerateImage = async () => {
    try {
      await generateImage(asset.id)
    } catch (err) {
      console.error('Failed to generate image:', err)
    }
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

  // Show loading state while generating prompt
  if (isGenerating) {
    return (
      <div className="glass-panel p-4">
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-white/60">Generating optimized prompt...</p>
        </div>
      </div>
    )
  }

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
          {/* Generate Image button */}
          <Button
            size="sm"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !customPrompt || hasGeneratedImage}
            className="text-xs aurora-gradient"
            title="Generate image from this prompt"
          >
            {isGeneratingImage ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Generating...
              </>
            ) : hasGeneratedImage ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Generated
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Generate Image
              </>
            )}
          </Button>
          
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

