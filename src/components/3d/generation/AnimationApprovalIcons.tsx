/**
 * AnimationApprovalIcons Component
 *
 * Displays small approval status icons for each animation preset.
 * Shows approved/pending status per animation.
 *
 * Features:
 * - Small icon row under preset selector
 * - Visual indicators for each animation's approval status
 * - Click to toggle approval status
 * - Similar to status badges in AssetTree3D.tsx
 */

'use client'

import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANIMATION_PRESET_LABELS, type AnimationPreset } from '@/lib/types/3d-generation'

interface AnimationApprovalIconsProps {
  /** Map of animation preset to approval status */
  approvalStatus: Record<AnimationPreset, 'approved' | 'rejected' | 'pending'>
  /** Callback when user toggles approval for an animation */
  onToggleApproval: (preset: AnimationPreset) => void
  /** Optional: which animations to show (default: all) */
  visibleAnimations?: AnimationPreset[]
}

/**
 * AnimationApprovalIcons - Displays per-animation approval status
 *
 * @param approvalStatus - Map of preset to approval status
 * @param onToggleApproval - Callback to toggle approval
 * @param visibleAnimations - Optional filter for which animations to show
 */
export function AnimationApprovalIcons({
  approvalStatus,
  onToggleApproval,
  visibleAnimations,
}: AnimationApprovalIconsProps) {
  // Use all presets if not specified
  const animationsToShow = visibleAnimations || Object.keys(ANIMATION_PRESET_LABELS) as AnimationPreset[]

  /**
   * Get icon and color based on approval status
   */
  const getStatusIcon = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved':
        return <Check className="h-3 w-3" />
      case 'rejected':
        return <X className="h-3 w-3" />
      case 'pending':
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  /**
   * Get color classes based on approval status
   */
  const getStatusColor = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved':
        return 'bg-green-600/20 text-green-300 border-green-600/30'
      case 'rejected':
        return 'bg-red-600/20 text-red-300 border-red-600/30'
      case 'pending':
      default:
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {animationsToShow.map((preset) => {
        const status = approvalStatus[preset] || 'pending'
        const label = ANIMATION_PRESET_LABELS[preset]

        return (
          <button
            key={preset}
            onClick={() => onToggleApproval(preset)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-all hover:opacity-80',
              getStatusColor(status)
            )}
            title={`${label}: ${status}`}
          >
            {getStatusIcon(status)}
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
