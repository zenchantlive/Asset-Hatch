// -----------------------------------------------------------------------------
// Studio List Page
// Displays a list of user's games in Hatch Studios
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateGameDialog } from '@/components/studio/CreateGameDialog';

/**
 * Studio landing page - lists all games for the authenticated user
 */
export default function StudioPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <main className="min-h-screen bg-neutral-950 text-white p-8">
            {/* Page Header */}
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Hatch Studios</h1>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        + New Game
                    </Button>
                </header>

                {/* Game list placeholder */}
                <section className="text-center py-16 text-neutral-400">
                    <div className="text-6xl mb-4">🎮</div>
                    <h2 className="text-xl mb-2">Your Games Will Appear Here</h2>
                    <p className="text-sm">
                        Create your first game to get started with AI-powered game development.
                    </p>
                </section>
            </div>

            {/* Create Game Dialog */}
            <CreateGameDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </main>
    );
}
