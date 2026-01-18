// -----------------------------------------------------------------------------
// New Game Page - Shell
// Form for creating a new game in Hatch Studios
// TODO: Complete UI implementation in Phase 2
// -----------------------------------------------------------------------------

import Link from "next/link";

/**
 * New game creation page
 * Phase 1: Basic shell structure
 * Phase 2: Full form with game settings, templates, and AI options
 */
export default function NewGamePage() {
    return (
        <main className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Navigation */}
                <Link
                    href="/studio"
                    className="text-neutral-400 hover:text-white transition-colors mb-6 inline-block"
                >
                    ← Back to Studio
                </Link>

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create New Game</h1>
                    <p className="text-neutral-400">
                        Start a new game project with AI-assisted development.
                    </p>
                </header>

                {/* TODO: Phase 2 - Full creation form with:
                    - Game name input
                    - Description textarea
                    - Template selection (blank, platformer, puzzle, etc.)
                    - AI settings
                */}
                <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                    <div className="text-center py-8 text-neutral-400">
                        <div className="text-4xl mb-4">🚀</div>
                        <h2 className="text-lg mb-2">Game Creation Coming Soon</h2>
                        <p className="text-sm">
                            This form will allow you to create and configure new games.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
