// -----------------------------------------------------------------------------
// Game Planning Layout
// Main layout for the game planning phase with chat and plan preview
// -----------------------------------------------------------------------------

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GamePlanChat } from './GamePlanChat';
import { GamePlanPreview } from './GamePlanPreview';

/**
 * Serialized game data from server
 */
interface SerializedGame {
    id: string;
    name: string;
    description: string | null;
    phase: string;
    createdAt: string;
    updatedAt: string;
    plan: {
        id: string;
        content: string;
        status: string;
        updatedAt: string;
    } | null;
}

interface GamePlanningLayoutProps {
    game: SerializedGame;
}

/**
 * GamePlanningLayout - manages planning phase UI
 */
export function GamePlanningLayout({ game }: GamePlanningLayoutProps) {
    const router = useRouter();
    const [planContent, setPlanContent] = useState(game.plan?.content || '');
    const [planStatus, setPlanStatus] = useState(game.plan?.status || 'draft');
    const [isApproving, setIsApproving] = useState(false);

    // Handle plan updates from AI chat
    const handlePlanUpdate = useCallback((content: string) => {
        setPlanContent(content);
    }, []);

    // Handle plan approval - transitions to building phase
    const handleApprovePlan = useCallback(async () => {
        if (!planContent.trim()) return;

        setIsApproving(true);
        try {
            // Update plan status to accepted via API
            const response = await fetch(`/api/studio/games/${game.id}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'accepted',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve plan');
            }

            // Update game phase to building
            await fetch(`/api/studio/games/${game.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phase: 'building',
                }),
            });

            setPlanStatus('accepted');

            // Redirect to build page
            router.push(`/studio/${game.id}`);
        } catch (error) {
            console.error('Failed to approve plan:', error);
        } finally {
            setIsApproving(false);
        }
    }, [game.id, planContent, router]);

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-transparent">
            {/* Header toolbar */}
            <div className="shrink-0 border-b border-glass-border bg-glass-bg/30 backdrop-blur-md">
                <div className="flex items-center justify-between px-6 py-3 h-14">
                    {/* Left: Title */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-sm font-heading font-medium tracking-wide text-white/80">
                            Game Planning
                            <span className="text-primary/80 ml-2">— {game.name}</span>
                        </h1>
                        {planStatus === 'accepted' && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Plan Accepted
                            </span>
                        )}
                        <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 font-bold uppercase tracking-tighter">
                            Experimental Engine
                        </span>
                    </div>

                    {/* Right: Phase indicator */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center p-1 rounded-lg bg-black/20 border border-white/5">
                            <div className="px-4 py-1.5 rounded-md text-xs font-medium bg-glass-highlight text-white shadow-sm border border-white/10">
                                Planning
                            </div>
                            <div className="px-4 py-1.5 rounded-md text-xs font-medium text-white/40">
                                Building
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area - responsive split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chat panel */}
                <div className="w-1/2 flex flex-col border-r border-white/5 bg-transparent">
                    <GamePlanChat
                        gameId={game.id}
                        gameName={game.name}
                        onPlanUpdate={handlePlanUpdate}
                    />
                </div>

                {/* Right: Plan preview */}
                <div className="w-1/2 flex flex-col bg-glass-bg/10">
                    <GamePlanPreview
                        content={planContent}
                        status={planStatus}
                        onApprove={handleApprovePlan}
                        isApproving={isApproving}
                    />
                </div>
            </div>
        </div>
    );
}
