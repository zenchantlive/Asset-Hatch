// -----------------------------------------------------------------------------
// Workspace Panel Component
// Right panel with tab content switching and activity log
// -----------------------------------------------------------------------------

'use client';

import dynamic from 'next/dynamic';
import { useStudio } from '@/lib/studio/context';
import { ActivityLog } from './ActivityLog';
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
 * Includes ActivityLog at the bottom for real-time feedback
 */
export function WorkspacePanel() {
    const { activeTab } = useStudio();

    return (
        <div className="h-full w-full flex flex-col bg-studio-panel-bg">
            {/* Main content area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'preview' && <PreviewTab />}
                {activeTab === 'code' && <CodeTab />}
                {activeTab === 'assets' && <AssetsTab />}
            </div>

            {/* Activity log at bottom - collapsible */}
            <ActivityLog className="shrink-0" />
        </div>
    );
}
