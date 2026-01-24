// -----------------------------------------------------------------------------
// Studio Header Component
// Top navigation bar with game name, tabs, and export button
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Edit2, Check, X } from 'lucide-react';
import { useStudio } from '@/lib/studio/context';

/**
 * StudioHeader - displays game name, tabs, and actions
 */
export function StudioHeader() {
    const { game, activeTab, setActiveTab, updateGameName } = useStudio();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(game?.name || '');

    // Handle name edit save
    const handleSaveName = () => {
        if (editedName.trim()) {
            updateGameName(editedName.trim());
            setIsEditingName(false);
        }
    };

    // Handle name edit cancel
    const handleCancelEdit = () => {
        setEditedName(game?.name || '');
        setIsEditingName(false);
    };

    return (
        <header className="h-14 border-b border-studio-panel-border bg-studio-panel-bg flex items-center justify-between px-4 sticky top-0 z-50">
            {/* Left: Game name */}
            <div className="flex items-center gap-3">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="px-2 py-1 bg-background/50 border border-border rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleSaveName}
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleCancelEdit}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h1 className="text-base font-semibold">{game?.name || 'Untitled Game'}</h1>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setIsEditingName(true)}
                        >
                            <Edit2 className="h-3 w-3" />
                        </Button>

                        {/* Contribution Note */}
                        <a 
                            href="https://github.com/zenchantlive/Asset-Hatch" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all animate-pulse ml-1"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                            </span>
                            Want to contribute?
                        </a>
                    </div>
                )}
            </div>

{/* Center: Tab navigation */}
            <nav className="flex items-center gap-1">
                {(['preview', 'code'] as const).map((tab) => {
                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    );
                })}
                {/* Assets tab - link to project planning */}
                {game?.projectId ? (
                    <a
                        href={`/project/${game.projectId}/planning`}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
                    >
                        Assets
                    </a>
                ) : (
                    <span className="px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground/50 cursor-not-allowed">
                        Assets
                    </span>
                )}
            </nav>

            {/* Right: Export button */}
            <div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled
                >
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>
        </header>
    );
}
