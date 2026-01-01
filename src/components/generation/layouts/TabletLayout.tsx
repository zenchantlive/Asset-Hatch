/**
 * TabletLayout Component
 * 
 * 2-column layout with tabs for tablet screens (768px - 1199px).
 * Layout structure:
 * - Left (40%): Asset queue OR mini-grid (togglable)
 * - Right (60%): Tabbed panel (Preview | Gallery | Log)
 * - Bottom: Progress timeline bar
 */

'use client'

import { useState } from 'react'
import { useGenerationContext } from '../GenerationQueue'
import { useGenerationLayout } from '../GenerationLayoutContext'
import { CategoryQueuePanel } from '../panels/CategoryQueuePanel'
import { MiniGridPanel } from '../panels/MiniGridPanel'
import { PreviewPanel } from '../panels/PreviewPanel'
// import { ProgressTimeline } from '../panels/ProgressTimeline'
import { BatchControlsBar } from '../panels/BatchControlsBar'

/**
 * Left panel tab options
 */
type LeftPanelTab = 'queue' | 'grid'

/**
 * Right panel tab options
 */
type RightPanelTab = 'preview' | 'gallery' | 'log'

/**
 * TabletLayout Component
 * 
 * 2-column layout with toggleable panels for medium screens.
 * Balances information density with screen real estate constraints.
 */
export function TabletLayout() {
    // Track which tab is active in each panel
    const [leftTab, setLeftTab] = useState<LeftPanelTab>('queue')
    const [rightTab, setRightTab] = useState<RightPanelTab>('preview')

    // Get contexts
    const generationContext = useGenerationContext()
    const layoutContext = useGenerationLayout()

    return (
        <div className="flex flex-col h-full bg-glass-bg/10">
            {/* Top: Batch controls bar */}
            <BatchControlsBar />

            {/* Main content: 2-column layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left panel: Queue or Grid (40%) */}
                <div className="w-2/5 min-w-[280px] border-r border-white/10 overflow-hidden flex flex-col">
                    {/* Tab switcher */}
                    <div className="flex border-b border-white/10 bg-black/20">
                        <button
                            onClick={() => setLeftTab('queue')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${leftTab === 'queue'
                                ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Queue
                        </button>
                        <button
                            onClick={() => setLeftTab('grid')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${leftTab === 'grid'
                                ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Grid
                        </button>
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-hidden">
                        {leftTab === 'queue' && <CategoryQueuePanel />}
                        {leftTab === 'grid' && <MiniGridPanel />}
                    </div>
                </div>

                {/* Right panel: Tabbed content (60%) */}
                <div className="flex-1 min-w-[320px] overflow-hidden flex flex-col">
                    {/* Tab switcher */}
                    <div className="flex border-b border-white/10 bg-black/20">
                        <button
                            onClick={() => setRightTab('preview')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${rightTab === 'preview'
                                ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Preview
                        </button>
                        <button
                            onClick={() => setRightTab('gallery')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${rightTab === 'gallery'
                                ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Gallery
                        </button>
                        <button
                            onClick={() => setRightTab('log')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${rightTab === 'log'
                                ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Log
                        </button>
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-hidden">
                        {rightTab === 'preview' && <PreviewPanel />}
                        {rightTab === 'gallery' && (
                            <div className="p-4 text-white/60">
                                {/* ApprovalGallery component will go here */}
                                Gallery view - coming soon
                            </div>
                        )}
                        {rightTab === 'log' && (
                            <div className="p-4 text-white/60">
                                {/* GenerationLog component will go here */}
                                Log view - coming soon
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Progress timeline */}
            {/* <ProgressTimeline /> */}
        </div>
    )
}
