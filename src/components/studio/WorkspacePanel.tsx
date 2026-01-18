// -----------------------------------------------------------------------------
// Workspace Panel Component
// Right panel with tab content switching
// -----------------------------------------------------------------------------

'use client';

import dynamic from 'next/dynamic';
import { useStudio } from '@/lib/studio/context';
import { PreviewTab } from './tabs/PreviewTab';

// Lazy load Monaco editor to avoid SSR issues and reduce bundle size
const CodeTab = dynamic(
    () => import('./tabs/CodeTab').then((mod) => ({ default: mod.CodeTab })),
    {
        ssr: false,
        loading: () => (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading editor...</p>
            </div>
        ),
    }
);

// Lazy load AssetsTab
const AssetsTab = dynamic(
    () => import('./tabs/AssetsTab').then((mod) => ({ default: mod.AssetsTab })),
    {
        loading: () => (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading assets...</p>
            </div>
        ),
    }
);

/**
 * WorkspacePanel - switches between Preview, Code, and Assets tabs
 */
export function WorkspacePanel() {
    const { activeTab } = useStudio();

    return (
        <div className="h-full w-full bg-studio-panel-bg">
            {activeTab === 'preview' && <PreviewTab />}
            {activeTab === 'code' && <CodeTab />}
            {activeTab === 'assets' && <AssetsTab />}
        </div>
    );
}
