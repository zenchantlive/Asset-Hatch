// =============================================================================
// CSS Module Declaration
// =============================================================================
// This file tells TypeScript how to handle CSS imports in .tsx/.ts files.
// Without this, TypeScript throws "Cannot find module" errors for CSS imports.
// =============================================================================

declare module "*.css" {
    // CSS modules export an object with class names as keys
    const content: { [className: string]: string };
    export default content;
}

// Side-effect CSS imports (like globals.css) don't export anything
declare module "*.css" {
    const content: Record<string, string>;
    export default content;
}
