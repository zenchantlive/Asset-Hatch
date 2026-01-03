/**
 * MobileLayout Component
 * 
 * Single-column layout for mobile screens (<768px).
 * Layout structure:
 * - Mode selector tabs (Planning/Style/Generation/Export)
 * - Full-width preview as primary content
 * - Collapsible sections below for queue, gallery, and log
 * - Sticky bottom action bar (48px min touch targets)
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, List, Grid, FileText } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { FlatAssetList } from '../panels/FlatAssetList'
import { MiniGridPanel } from '../panels/MiniGridPanel'
import { PreviewPanel } from '../panels/PreviewPanel'
import { UnifiedActionBar } from '../UnifiedActionBar'

/**
 * Collapsible section options
 */
type SectionId = 'queue' | 'gallery' | 'log'

/**
 * MobileLayout Component
 * 
 * Single-column layout with collapsible sections for small screens.
 * Prioritizes the preview area while keeping other sections accessible.
 * Features sticky bottom action bar for easy thumb access.
 */
export function MobileLayout() {
    // Track which section is expanded (only one at a time)
    const [expandedSection, setExpandedSection] = useState<SectionId | null>(null)

    // Get context
    const generationContext = useGenerationContext()

    // Toggle section expansion
    const toggleSection = (section: SectionId) => {
        setExpandedSection(prev => prev === section ? null : section)
    }

    return (
        <div className="flex flex-col h-full bg-glass-bg/10">
            {/* Main content: Scrollable single column */}
            {/* pb-20 ensures content doesn't get hidden behind sticky bottom bar */}
            <div className="flex-1 overflow-y-auto pb-20">
                {/* Preview section - always visible, takes most space */}
                <div className="min-h-[50vh]">
                    <PreviewPanel compact />
                </div>

                {/* Collapsible sections with 48px min touch targets */}
                <div className="border-t border-white/10">
                    {/* Assets section - using flat list instead of categories */}
                    <div className="border-b border-white/10">
                        <button
                            onClick={() => toggleSection('queue')}
                            className="w-full flex items-center justify-between px-4 min-h-12 bg-black/20 hover:bg-black/30 active:bg-black/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <List className="w-5 h-5 text-white/60" />
                                <span className="font-medium text-white/90">Asset Queue</span>
                                <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                                    {generationContext.parsedAssets.length}
                                </span>
                            </div>
                            {expandedSection === 'queue' ? (
                                <ChevronUp className="w-5 h-5 text-white/60" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-white/60" />
                            )}
                        </button>
                        {expandedSection === 'queue' && (
                            <div className="max-h-[50vh]">
                                <FlatAssetList />
                            </div>
                        )}
                    </div>

                    {/* Gallery section */}
                    <div className="border-b border-white/10">
                        <button
                            onClick={() => toggleSection('gallery')}
                            className="w-full flex items-center justify-between px-4 min-h-12 bg-black/20 hover:bg-black/30 active:bg-black/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Grid className="w-5 h-5 text-white/60" />
                                <span className="font-medium text-white/90">Gallery</span>
                            </div>
                            {expandedSection === 'gallery' ? (
                                <ChevronUp className="w-5 h-5 text-white/60" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-white/60" />
                            )}
                        </button>
                        {expandedSection === 'gallery' && (
                            <div className="max-h-[50vh] overflow-y-auto">
                                <MiniGridPanel compact />
                            </div>
                        )}
                    </div>

                    {/* Log section */}
                    <div className="border-b border-white/10">
                        <button
                            onClick={() => toggleSection('log')}
                            className="w-full flex items-center justify-between px-4 min-h-12 bg-black/20 hover:bg-black/30 active:bg-black/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-white/60" />
                                <span className="font-medium text-white/90">Generation Log</span>
                            </div>
                            {expandedSection === 'log' ? (
                                <ChevronUp className="w-5 h-5 text-white/60" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-white/60" />
                            )}
                        </button>
                        {expandedSection === 'log' && (
                            <div className="max-h-[50vh] overflow-y-auto p-4">
                                {/* GenerationLog component will go here */}
                                <div className="text-white/60 text-sm">
                                    Log view - coming soon
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky bottom action bar - safe area padding for phones with notches */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 pb-safe">
                <UnifiedActionBar compact />
            </div>
        </div>
    )
}

