'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';

// Tab type
type UnifiedTab = 'assets' | 'game';

interface UnifiedProjectViewProps {
  projectId: string;
  initialContext?: UnifiedProjectContext;
  initialTab?: 'assets' | 'game';
}

/**
 * UnifiedProjectView - Main unified view with [Assets] [Game] tab navigation
 *
 * Phase 6B: Shared Context & Unified UI
 * Replaces separate /project/[id]/planning and /studio/[id] routes
 */
export function UnifiedProjectView({ projectId, initialContext, initialTab = 'assets' }: UnifiedProjectViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UnifiedTab>(initialTab);
  const [projectContext, setProjectContext] = useState<UnifiedProjectContext | undefined>(initialContext);
  const [isLoading, setIsLoading] = useState(false);

  // Load context from API
  const loadContext = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/context`);
      const data = await response.json();
      if (data.success && data.context) {
        setProjectContext(data.context);
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }, [projectId]);

  // Load context on mount if not provided
  useEffect(() => {
    if (!initialContext) {
      loadContext();
    }
  }, [projectId, initialContext, loadContext]);

  // Handle tab change with URL update
  const handleTabChange = (tab: UnifiedTab) => {
    setActiveTab(tab);
    // Update URL without full navigation
    router.push(`/project/${projectId}?tab=${tab}`, { scroll: false });
  };

  // Save context when updated
  const saveContext = useCallback(
    async (updates: Partial<UnifiedProjectContext>) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: updates }),
        });
        const data = await response.json();
        if (data.success) {
          setProjectContext((prev) =>
            prev
              ? { ...prev, ...updates, updatedAt: new Date().toISOString() }
              : undefined
          );
        }
      } catch (error) {
        console.error('Failed to save context:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with tab navigation */}
      <header className="h-14 border-b border-studio-panel-border bg-studio-panel-bg flex items-center justify-between px-4">
        {/* Left: Project name */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">
            {projectContext?.gameConcept || 'Project'}
          </h1>
        </div>

        {/* Center: Tab navigation */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => handleTabChange('assets')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'assets'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            🎨 Assets
          </button>
          <button
            onClick={() => handleTabChange('game')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'game'
                ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            🎮 Game
          </button>
        </nav>

        {/* Right: Context indicator */}
        <div className="flex items-center gap-2">
          {projectContext && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {isLoading ? '🔄 Saving...' : '🔄 Synced'}
            </span>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'assets' ? (
          <AssetsTabContent
            projectId={projectId}
            projectContext={projectContext}
            onContextUpdate={saveContext}
          />
        ) : (
          <GameTabContent projectId={projectId} projectContext={projectContext} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Assets Tab Content
// =============================================================================

interface AssetsTabContentProps {
  projectId: string;
  projectContext?: UnifiedProjectContext;
  onContextUpdate: (updates: Partial<UnifiedProjectContext>) => void;
}

/**
 * AssetsTabContent - Wrapper for existing planning/generation UI
 *
 * Phase 6B: For now, shows placeholder. Full integration requires:
 * 1. Adding ?embedded=true support to /project/[id]/planning page
 * 2. Passing projectContext to ChatInterface
 */
function AssetsTabContent({ projectId }: AssetsTabContentProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">🎨</div>
        <h2 className="text-2xl font-semibold">Assets Tab</h2>
        <p className="text-muted-foreground">
          This tab will integrate the existing planning and generation workflow.
          For now, continue with the existing flow:
        </p>
        <a
          href={`/project/${projectId}/planning`}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Open Planning Page →
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// Game Tab Content
// =============================================================================

interface GameTabContentProps {
  projectId: string;
  projectContext?: UnifiedProjectContext;
}

/**
 * GameTabContent - Wrapper for existing studio UI
 *
 * Phase 6B: For now, shows placeholder. Full integration requires:
 * 1. Adding ?embedded=true support to /studio/[id] page
 * 2. Passing projectContext to ChatPanel
 */
function GameTabContent({ projectId, projectContext }: GameTabContentProps) {
  // Check if project has a linked game
  const gameId = projectContext?.gameId;

  if (!gameId) {
    // No game linked yet - show create game CTA
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎮</div>
          <h2 className="text-2xl font-semibold">No Game Created Yet</h2>
          <p className="text-muted-foreground max-w-md">
            Create a game to start building with Hatch Studios. Your project context
            will be preserved as you develop.
          </p>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            onClick={() => {
              // TODO: Implement game creation flow
              console.log('Create game clicked for project:', projectId);
            }}
          >
            Create Game
          </button>
        </div>
      </div>
    );
  }

  // Game exists - link to existing studio page
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎮</div>
        <h2 className="text-2xl font-semibold">Game Tab</h2>
        <p className="text-muted-foreground max-w-md">
          This tab will integrate the existing Hatch Studios workflow.
          For now, continue with the existing editor:
        </p>
        <a
          href={`/studio/${gameId}`}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Open Studio Editor →
        </a>
      </div>
    </div>
  );
}
