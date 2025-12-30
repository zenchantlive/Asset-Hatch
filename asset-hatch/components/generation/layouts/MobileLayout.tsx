/**
 * MobileLayout Component
 * 
 * Single-column layout for mobile screens (<768px).
 * Layout structure:
 * - Full-width preview as primary content
 * - Collapsible sections below for queue, gallery, and log
 * - Compact batch controls at top
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, List, Grid, FileText } from 'lucide-react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { CategoryQueuePanel } from '../panels/CategoryQueuePanel'
import { MiniGridPanel } from '../panels/MiniGridPanel'
import { PreviewPanel } from '../panels/PreviewPanel'
// import { ProgressTimeline } from '../panels/ProgressTimeline'
import { BatchControlsBar } from '../panels/BatchControlsBar'

/**
 * Collapsible section options
 */
type SectionId = 'queue' | 'gallery' | 'log'

/**
 * MobileLayout Component
 * 
 * Single-column layout with collapsible sections for small screens.
 * Prioritizes the preview area while keeping other sections accessible.
 */
export function MobileLayout() {
    // Track which section is expanded (only one at a time)
    const [expandedSection, setExpandedSection] = useState<SectionId | null>(null)

    // Get contexts
    const generationContext = useGenerationContext()
    const layoutContext = useGenerationLayout()

    // Toggle section expansion
    const toggleSection = (section: SectionId) => {
        setExpandedSection(prev => prev === section ? null : section)
    }

    return (
        <div className="flex flex-col h-full bg-glass-bg/10">
            {/* Top: Compact batch controls */}
            <BatchControlsBar compact />

            {/* Main content: Scrollable single column */}
            <div className="flex-1 overflow-y-auto">
                {/* Preview section - always visible, takes most space */}
                <div className="min-h-[50vh]">
                    <PreviewPanel compact />
                </div>

                {/* Collapsible sections */}
                <div className="border-t border-white/10">
                    {/* Queue section */}
                    <div className="border-b border-white/10">
                        <button
                            onClick={() => toggleSection('queue')}
                            className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4 text-white/60" />
                                <span className="font-medium text-white/90">Asset Queue</span>
                                <span className="text-xs text-white/50">
                                    ({generationContext.parsedAssets.length} assets)
                                </span>
                            </div>
                            {expandedSection === 'queue' ? (
                                <ChevronUp className="w-4 h-4 text-white/60" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-white/60" />
                            )}
                        </button>
                        {expandedSection === 'queue' && (
                            <div className="max-h-[50vh] overflow-y-auto">
                                <CategoryQueuePanel />
                            </div>
                        )}
                    </div>

                    {/* Gallery section */}
                    <div className="border-b border-white/10">
                        <button
                            onClick={() => toggleSection('gallery')}
                            className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-white/60" />
                                <span className="font-medium text-white/90">Gallery</span>
                            </div>
                            {expandedSection === 'gallery' ? (
                                <ChevronUp className="w-4 h-4 text-white/60" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-white/60" />
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
                            className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-white/60" />
                                <span className="font-medium text-white/90">Generation Log</span>
                            </div>
                            {expandedSection === 'log' ? (
                                <ChevronUp className="w-4 h-4 text-white/60" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-white/60" />
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

            {/* Bottom: Compact progress timeline */}
            {/* <ProgressTimeline compact /> */}
        </div>
    )
}
