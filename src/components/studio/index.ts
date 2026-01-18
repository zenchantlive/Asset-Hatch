// -----------------------------------------------------------------------------
// Studio Components Barrel Export
// Centralizes all studio component exports
// -----------------------------------------------------------------------------

export { StudioLayout } from './StudioLayout';
export { StudioProvider } from './StudioProvider';
export { StudioHeader } from './StudioHeader';
export { ChatPanel } from './ChatPanel';
export { WorkspacePanel } from './WorkspacePanel';
export { PreviewFrame } from './PreviewFrame';
// PlayControls removed - not needed for MVP
export { AssetBrowser } from './AssetBrowser';

// Tab components
export { PreviewTab } from './tabs/PreviewTab';
export { CodeTab } from './tabs/CodeTab';
export { AssetsTab } from './tabs/AssetsTab';

// Re-export context hook
export { useStudio } from '@/lib/studio/context';
