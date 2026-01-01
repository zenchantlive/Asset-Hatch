/**
 * useMediaQuery Hook
 * 
 * React hook for responsive design breakpoint detection.
 * Uses window.matchMedia for efficient resize handling.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to detect if a media query matches
 * 
 * @param query - CSS media query string (e.g., '(min-width: 1200px)')
 * @returns Boolean indicating if the query matches
 * 
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 1200px)')
 * const isTablet = useMediaQuery('(min-width: 768px)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
    // Get initial value safely (SSR-compatible)
    const getMatches = useCallback((query: string): boolean => {
        // Check if we're on the client
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches
        }
        return false
    }, [])

    const [matches, setMatches] = useState<boolean>(() => getMatches(query))

    useEffect(() => {
        // Create the media query list
        const mediaQueryList = window.matchMedia(query)

        // Handler for changes
        const handleChange = () => {
            setMatches(getMatches(query))
        }

        // Set initial value on mount (handles SSR hydration)
        handleChange()

        // Add event listener (modern API)
        mediaQueryList.addEventListener('change', handleChange)

        // Cleanup
        return () => {
            mediaQueryList.removeEventListener('change', handleChange)
        }
    }, [query, getMatches])

    return matches
}

/**
 * Breakpoint constants for consistent usage
 * These match Tailwind's default breakpoints
 */
export const BREAKPOINTS = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1200px)',
    '2xl': '(min-width: 1536px)',
} as const

/**
 * Hook to get the current breakpoint name
 * 
 * @returns Current breakpoint: 'mobile' | 'tablet' | 'desktop'
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint()
 * // breakpoint === 'desktop' | 'tablet' | 'mobile'
 * ```
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const isDesktop = useMediaQuery(BREAKPOINTS.lg)  // 1024px+
    const isTablet = useMediaQuery(BREAKPOINTS.md)   // 768px+

    if (isDesktop) return 'desktop'
    if (isTablet) return 'tablet'
    return 'mobile'
}
