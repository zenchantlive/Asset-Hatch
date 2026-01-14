/**
 * Theme utilities for 3D mode visual identity
 */

/**
 * Apply the mode-specific theme to the document body
 * 
 * @param mode - '2d' or '3d' mode
 * 
 * @example
 * // In a useEffect on the planning page:
 * useEffect(() => {
 *   if (project.mode === '3d') {
 *     applyModeTheme('3d');
 *   }
 *   return () => applyModeTheme('2d');
 * }, [project.mode]);
 */
export function applyModeTheme(mode: '2d' | '3d'): void {
    if (typeof document !== 'undefined') {
        document.body.setAttribute('data-mode', mode);
    }
}

/**
 * Remove the mode-specific theme (reset to default)
 * 
 * @example
 * useEffect(() => {
 *   // Apply 3D theme
 *   applyModeTheme('3d');
 *   // Cleanup on unmount
 *   return () => resetModeTheme();
 * }, []);
 */
export function resetModeTheme(): void {
    if (typeof document !== 'undefined') {
        document.body.removeAttribute('data-mode');
    }
}

/**
 * Check if the current theme is 3D mode
 * 
 * @returns true if data-mode="3d" is set
 */
export function is3DMode(): boolean {
    if (typeof document !== 'undefined') {
        return document.body.getAttribute('data-mode') === '3d';
    }
    return false;
}

/**
 * Get the current mode from the document body
 * 
 * @returns '2d' | '3d' based on data-mode attribute
 */
export function getCurrentMode(): '2d' | '3d' {
    if (typeof document !== 'undefined') {
        const mode = document.body.getAttribute('data-mode');
        return mode === '3d' ? '3d' : '2d';
    }
    return '2d';
}

/**
 * Toggle between 2D and 3D modes
 * 
 * @param currentMode - The current mode
 * @returns The opposite mode
 */
export function toggleMode(currentMode: '2d' | '3d'): '2d' | '3d' {
    const newMode = currentMode === '2d' ? '3d' : '2d';
    applyModeTheme(newMode);
    return newMode;
}
