// -----------------------------------------------------------------------------
// Studio Layout Component
// Two-panel layout with chat and workspace
// Uses simple CSS flex layout for reliability
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { StudioHeader } from './StudioHeader';
import { ChatPanel } from './ChatPanel';
import { WorkspacePanel } from './WorkspacePanel';

interface StudioLayoutProps {
    gameId: string;
}

/**
 * StudioLayout - main two-panel layout for game editor
 * Desktop: Chat (35%) | Workspace (65%)
 * Mobile: Chat only with message to switch to desktop
 */
export function StudioLayout({ gameId }: StudioLayoutProps) {
    // Panel width as percentage (for future resize functionality)
    const [chatWidth] = useState(35);

    return (
        // Fill the remaining viewport height (100vh - 64px header)
        <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
            {/* Header */}
            <StudioHeader />

            {/* Main content area */}
            <div className="flex-1 overflow-hidden flex">
                {/* Desktop: Two-panel layout */}
                <div
                    className="hidden md:flex h-full border-r border-studio-panel-border"
                    style={{ width: `${chatWidth}%` }}
                >
                    <ChatPanel gameId={gameId} />
                </div>

                {/* Workspace panel (hidden on mobile) */}
                <div
                    className="hidden md:flex flex-1 h-full"
                    style={{ width: `${100 - chatWidth}%` }}
                >
                    <WorkspacePanel />
                </div>

                {/* Mobile: Chat-only with desktop prompt */}
                <div className="md:hidden h-full flex flex-col w-full">
                    <div className="flex-1">
                        <ChatPanel gameId={gameId} />
                    </div>
                    <div className="p-4 border-t border-studio-panel-border bg-yellow-500/10">
                        <p className="text-xs text-center text-yellow-200">
                            📱 For the best experience with code editor and preview, please use a desktop or tablet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
