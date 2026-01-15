/**
 * Asset Type Tabs Component
 * 
 * Renders filter tabs for switching between asset types (All, 2D, 3D, Skybox)
 */

import { Image as ImageIcon, Box, Grid, Layers } from 'lucide-react'

/**
 * Asset type filter options
 */
export type AssetType = 'all' | '2d' | '3d' | 'skybox'

interface AssetTypeTabsProps {
    /** Current active asset type filter */
    activeType: AssetType
    /** Callback when tab is clicked */
    onTypeChange: (type: AssetType) => void
    /** Count of assets per type */
    counts: Record<AssetType, number>
}

/**
 * Get asset type label and icon for display
 */
function getAssetTypeLabel(type: AssetType): { label: string; icon: React.ReactNode } {
    switch (type) {
        case '2d':
            return { label: '2D Assets', icon: <ImageIcon className="h-4 w-4" /> }
        case '3d':
            return { label: '3D Models', icon: <Box className="h-4 w-4" /> }
        case 'skybox':
            return { label: 'Skyboxes', icon: <Grid className="h-4 w-4" /> }
        default:
            return { label: 'All Assets', icon: <Layers className="h-4 w-4" /> }
    }
}

/**
 * AssetTypeTabs - Renders filter tabs for asset types
 */
export function AssetTypeTabs({ activeType, onTypeChange, counts }: AssetTypeTabsProps) {
    const types: AssetType[] = ['all', '2d', '3d', 'skybox']

    return (
        <div className="flex gap-1 px-4 border-b border-white/10">
            {types.map((type) => {
                const { label, icon } = getAssetTypeLabel(type)
                const isActive = activeType === type
                const count = counts[type]

                return (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${isActive
                                ? 'text-purple-400 border-purple-400'
                                : 'text-white/50 hover:text-white/80 border-transparent hover:border-white/20'}
            `}
                    >
                        {icon}
                        <span>{label}</span>
                        {count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                                {count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
