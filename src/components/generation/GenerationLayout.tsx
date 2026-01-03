/**
 * GenerationLayout Component
 * 
 * Responsive layout switcher for the generation UI.
 * Automatically selects the appropriate layout based on screen size:
 * - Desktop (xl+): 3-column command center
 * - Tablet (md-lg): 2-column with tabs
 * - Mobile (<md): Single column with collapsible sections
 */

'use client'

import { useGenerationLayout } from './GenerationLayoutContext'

// Import layout variants
import { DesktopLayout } from './layouts/DesktopLayout'
import { MobileLayout } from './layouts/MobileLayout'

/**
 * GenerationLayout Component
 * 
 * Main entry point for the generation UI layout.
 * Renders the appropriate layout based on current breakpoint.
 */
export function GenerationLayout() {
    // Get current breakpoint from layout context
    const { state } = useGenerationLayout()
    const { breakpoint } = state

    // Render the appropriate layout based on breakpoint
    switch (breakpoint) {
        case 'desktop':
            return <DesktopLayout />
        case 'tablet':
            // Use Desktop layout for tablets too (responsive split view)
            return <DesktopLayout />
        case 'mobile':
            return <MobileLayout />
        default:
            // Fallback to desktop layout
            return <DesktopLayout />
    }
}
