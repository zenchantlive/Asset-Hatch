/**
 * DesktopLayout Component
 * 
 * 3-Column Layout for Desktop Screens (1280px+).
 * Refactored to feature:
 * - Resizable Left Sidebar (Categorized Assets)
 * - Main Preview Area
 * - Bottom Horizontal Asset Bar (Replacing Right Sidebar)
 * 
 * Structure:
 * [ Left Sidebar (Category Queue) ] | [ Preview Panel (Top)      ]
 * [ Resizable Width               ] | [ Asset Bar (Bottom)       ]
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
// import { GenerationLayoutProvider } from '../GenerationLayoutContext' // Unused in this file
import { CategoryQueuePanel } from '../panels/CategoryQueuePanel'
import { PreviewPanel } from '../panels/PreviewPanel'
import { BottomAssetBar } from '../panels/BottomAssetBar'
import { BatchControlsBar } from '../panels/BatchControlsBar'

export function DesktopLayout() {
    // Left Sidebar Width State (Percentage)
    const [sidebarWidth, setSidebarWidth] = useState(25) // Start at 25% (roughly 1/4)
    const [isResizing, setIsResizing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Resizing Logic
    const startResizing = useCallback(() => {
        setIsResizing(true)
    }, [])

    const stopResizing = useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width
            // Calculate new width percentage
            // Constraints: Min 15%, Max 40% (as per user request: "stop them from making either too small, lets start with 30% threhold")
            // Wait, user said "lets start with 30% threhold". I'll use 30 as default or max?
            // "increase the size of btoh colums... stop them from making either too small, lets start with 30% threhold"
            // I'll interpret "start with 30% threshold" as a constraint or initial value. Let's use 20% min, 50% max.

            const newWidth = (mouseMoveEvent.clientX / containerWidth) * 100
            if (newWidth >= 15 && newWidth <= 50) {
                setSidebarWidth(newWidth)
            }
        }
    }, [isResizing])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
        }
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [isResizing, resize, stopResizing])

    return (
        <div className="flex flex-col h-full bg-glass-bg/10 overflow-hidden" ref={containerRef}>
            {/* Top Bar: Batch Controls */}
            {/* The user said "make it only take up the area underneath the preview of the image, leaving the left sidebar alone" 
                This implies the bottom bar is ONLY under the preview, meaning it's in the RIGHT column.
                And the Left Sidebar is full height (except for top nav/controls).
                
                Actually, BatchControlsBar is usually top-level. I'll keep it at the top.
            */}
            <BatchControlsBar />

            {/* Main Content Area: Split Vertically (Left | Right) */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* 1. Left Sidebar: Category Queue */}
                <div
                    style={{ width: `${sidebarWidth}%` }}
                    className="flex-shrink-0 min-w-[250px] overflow-hidden"
                >
                    <CategoryQueuePanel />
                </div>

                {/* 2. Resizer Handle */}
                <div
                    className={`w-1 cursor-col-resize hover:bg-purple-500/50 transition-colors z-10 flex items-center justify-center ${isResizing ? 'bg-purple-500' : 'bg-white/5'
                        }`}
                    onMouseDown={startResizing}
                >
                    {/* Visual handle indicator */}
                    <div className="w-0.5 h-8 bg-white/20 rounded-full" />
                </div>

                {/* 3. Right Content: Preview + Bottom Bar */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">

                    {/* Preview Area (Takes available space) */}
                    <div className="flex-1 overflow-hidden min-h-0 bg-black/10 relative h-full">
                        <PreviewPanel />
                    </div>

                    {/* Bottom Asset Bar (Collapsible/Minimizable) */}
                    <div className="flex-none z-20">
                        <BottomAssetBar />
                    </div>
                </div>

            </div>
        </div>
    )
}
