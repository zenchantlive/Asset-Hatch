"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChatInterface, ChatInterfaceHandle } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { StylePreview, emptyStyleDraft, type StyleDraft, type GeneratedStyleAnchor } from "@/components/style/StylePreview"
import { GenerationQueue } from "@/components/generation/GenerationQueue"
import { FilesPanel } from "@/components/ui/FilesPanel"
import { AssetsPanel } from "@/components/ui/AssetsPanel"
import { saveMemoryFile, updateProjectQualities, loadMemoryFile } from "@/lib/db-utils"
import { db } from "@/lib/client-db"
import { fetchAndSyncProject, syncMemoryFileToServer } from "@/lib/sync"

type PlanningMode = 'planning' | 'style' | 'generation'

export default function PlanningPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [mode, setMode] = useState<PlanningMode>('planning')
  const [filesMenuOpen, setFilesMenuOpen] = useState(false)
  const [assetsMenuOpen, setAssetsMenuOpen] = useState(false)
  const chatRef = useRef<ChatInterfaceHandle>(null)

  // Style phase state
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(emptyStyleDraft)
  const [generatedAnchor, setGeneratedAnchor] = useState<GeneratedStyleAnchor | null>(null)
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false)

  // Sync project data from Prisma to Dexie on mount
  // This ensures GenerationQueue and other client components can find project data
  // Sync project data from Prisma to Dexie on mount
  // This ensures GenerationQueue and other client components can find project data
  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      fetchAndSyncProject(params.id).then((project) => {
        if (project) {
          // If URL has no mode, use project phase (restore session)
          const urlMode = searchParams.get('mode');
          if (!urlMode && project.phase && ['planning', 'style', 'generation'].includes(project.phase)) {
            // If the stored phase is different from default 'planning', update it
            const phaseMode = project.phase as PlanningMode;
            if (phaseMode !== mode) {
              setMode(phaseMode);
              // Also update URL to match
              router.replace(`/project/${params.id}/planning?mode=${phaseMode}`);
            }
          } else if (urlMode && ['planning', 'style', 'generation'].includes(urlMode)) {
            // URL takes precedence if present
            setMode(urlMode as PlanningMode);
          }
        }
      }).catch(console.error)
    }
    // We intentionally ignore 'mode' dependency to prevent re-syncing on local mode changes
    // which would cause a race condition with the optimistic update.
    // This effect is for initialization/restoration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, searchParams, router])

  // Load saved plan and qualities from memory files on mount
  useEffect(() => {
    const loadSavedState = async () => {
      if (!params.id || typeof params.id !== 'string') return;

      try {
        // Load plan from entities.json
        const savedPlan = await loadMemoryFile(params.id, 'entities.json');
        if (savedPlan) {
          console.log('📂 Loaded saved plan from entities.json');
          setPlanMarkdown(savedPlan);
        }

        // Load project qualities from Dexie
        const project = await db.projects.get(params.id);
        if (project) {
          console.log('📂 Loaded project qualities from Dexie');
          const loadedQualities: ProjectQualities = {};
          if (project.art_style) loadedQualities.art_style = project.art_style;
          if (project.base_resolution) loadedQualities.base_resolution = project.base_resolution;
          if (project.perspective) loadedQualities.perspective = project.perspective;
          if (project.game_genre) loadedQualities.game_genre = project.game_genre;
          if (project.theme) loadedQualities.theme = project.theme;
          if (project.mood) loadedQualities.mood = project.mood;
          if (project.color_palette) loadedQualities.color_palette = project.color_palette;
          setQualities(loadedQualities);
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    };

    loadSavedState();
  }, [params.id]);

  // Handle mode switching with persistence
  const handleModeChange = async (newMode: PlanningMode) => {
    // 1. Optimistic Update
    setMode(newMode);

    const projectId = params.id as string;
    if (!projectId) return;

    // 2. Update URL (shallow)
    router.replace(`/project/${projectId}/planning?mode=${newMode}`);

    // 3. Update Local DB (Dexie)
    // Phase values are now consistent across UI and DB
    try {
      await db.projects.update(projectId, {
        phase: newMode,
        updated_at: new Date().toISOString()
      });

      // 4. Background Sync to Server (Prisma)
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: newMode })
      }).catch(err => console.error("Failed to sync phase to server:", err));

    } catch (error) {
      console.error("Failed to update local project phase:", error);
    }
  };

  // Handler for quality updates from AI
  const handleQualityUpdate = (qualityKey: string, value: string) => {
    console.log('\ud83d\udcdd Planning page received quality update:', qualityKey, '=', value);
    setQualities(prev => ({ ...prev, [qualityKey]: value }));
  };

  // Handler for plan updates from AI
  const handlePlanUpdate = (markdown: string) => {
    setPlanMarkdown(markdown);
  };

  // Handler for style draft updates from AI
  const handleStyleDraftUpdate = (draft: Partial<StyleDraft>) => {
    console.log('📝 Planning page received style draft update:', draft);
    setStyleDraft(prev => ({ ...prev, ...draft }));
  };

  // Handler for style anchor generation
  const handleStyleAnchorGenerated = (anchor: GeneratedStyleAnchor) => {
    console.log('🎨 Style anchor generated:', anchor.id);
    setGeneratedAnchor(anchor);
    setIsGeneratingStyle(false);
  };

  // Handler for style finalization
  const handleStyleFinalized = () => {
    console.log('✅ Style finalized, switching to generation mode');
    handleModeChange('generation');
  };

  const handleEditPlan = () => {
    console.log("Edit plan clicked")
  }

  const handleApprovePlan = async () => {
    if (!planMarkdown) return;
    setIsApproving(true)
    const projectId = params.id;
    if (typeof projectId !== 'string') {
      console.error("Project ID is missing or invalid.");
      setIsApproving(false);
      return;
    }
    try {
      await db.transaction('rw', db.memory_files, db.projects, async () => {
        await saveMemoryFile(projectId, 'entities.json', planMarkdown)
        await updateProjectQualities(projectId, qualities)
        // Phase update handled by handleModeChange below, but good to keep transaction atomic specific logic here if needed
        // For now, we will let handleModeChange do the phase update
      })

      // Sync to Server (Prisma) so GenerationQueue can find it
      await syncMemoryFileToServer(projectId, 'entities.json', planMarkdown);

      handleModeChange('style')
    } catch (error) {
      console.error("Plan approval failed:", error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleParametersSave = async () => {
    // 1. Save to DB
    const projectId = params.id
    if (typeof projectId === 'string') {
      try {
        await updateProjectQualities(projectId, qualities)
        console.log('✅ Qualities saved to database')
      } catch (error) {
        console.error("Failed to save qualities:", error)
      }
    }

    // 2. Reprompt AI if we have a chat ref (only in planning mode)
    if (chatRef.current && mode === 'planning') {
      const activeQualities = Object.entries(qualities)
        .filter(([, v]) => v)
        .map(([k, v]) => `- ${k.replace('_', ' ')}: ${v}`)
        .join('\n')

      if (activeQualities) {
        chatRef.current.sendMessage(
          `I've updated the project parameters:\n${activeQualities}\n\nPlease update the asset plan to align with these new parameters.`
        )
      }
    }
  }

  const handleGenerateStyleAnchor = () => {
    if (chatRef.current) {
      setIsGeneratingStyle(true)
      chatRef.current.sendMessage("Please generate the style anchor image now using the current style draft.")
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-transparent relative overflow-hidden">
      {/* Unified Project Toolbar */}
      <div className="shrink-0 z-20 relative border-b border-glass-border bg-glass-bg/30 backdrop-blur-md">
        {/* Desktop Toolbar (lg+) */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2 h-14">
          {/* LEFT: Project Title */}
          <div className="flex items-center">
            <h1 className="text-sm font-heading font-medium tracking-wide text-white/80">
              Project Planning
            </h1>
          </div>

          {/* CENTER: Interaction Mode Tabs */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
              {(['planning', 'style', 'generation'] as const).map((tabMode) => (
                <button
                  key={tabMode}
                  onClick={() => handleModeChange(tabMode)}
                  className={`
                    px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 capitalize tracking-wide
                    ${mode === tabMode
                      ? 'bg-glass-highlight text-white shadow-sm border border-white/10'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                  `}
                >
                  {tabMode}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Assets & Files only (Parameters moved to bar below) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAssetsMenuOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white"
            >
              Assets
            </button>
            <button
              onClick={() => setFilesMenuOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white"
            >
              Files
            </button>
          </div>
        </div>

        {/* Mobile Toolbar (<lg) - Stacked layout */}
        <div className="lg:hidden flex flex-col gap-2 px-4 py-3">
          {/* Row 1: Tabs (centered, full width) */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 rounded-lg bg-black/20 border border-white/5 w-full max-w-xs">
              {(['planning', 'style', 'generation'] as const).map((tabMode) => (
                <button
                  key={tabMode}
                  onClick={() => handleModeChange(tabMode)}
                  className={`
                    flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                    ${mode === tabMode
                      ? 'bg-glass-highlight text-white shadow-sm border border-white/10'
                      : 'text-white/40'}
                  `}
                >
                  {tabMode}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Action buttons */}
          <div className="flex items-center justify-between">
            <QualitiesBar
              qualities={qualities}
              onQualitiesChange={setQualities}
              onSave={handleParametersSave}
              mode="popover"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAssetsMenuOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70"
              >
                Assets
              </button>
              <button
                onClick={() => setFilesMenuOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70"
              >
                Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters Bar - Visible on desktop, shows selected values */}
      <div className="hidden lg:block shrink-0 z-10 border-b border-white/5">
        <QualitiesBar
          qualities={qualities}
          onQualitiesChange={setQualities}
          onSave={handleParametersSave}
          mode="bar"
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {mode === 'generation' ? (
          // Generation mode: Full-width GenerationQueue (no chat)
          <GenerationQueue projectId={params.id as string} />
        ) : (
          // Plan and Style modes: Keep 50/50 split with chat
          <>
            <div className="w-1/2 flex flex-col border-r border-white/5 bg-glass-bg/20 backdrop-blur-sm relative transition-all duration-500 hover:bg-glass-bg/30">
              <ChatInterface
                ref={chatRef}
                qualities={qualities}
                projectId={typeof params.id === 'string' ? params.id : ''}
                onQualityUpdate={handleQualityUpdate}
                onPlanUpdate={handlePlanUpdate}
                onPlanComplete={handleApprovePlan}
                onStyleDraftUpdate={handleStyleDraftUpdate}
                onStyleAnchorGenerated={handleStyleAnchorGenerated}
                onStyleFinalized={handleStyleFinalized}
                mode={mode}
              />
            </div>

            <div className="w-1/2 flex flex-col relative bg-glass-bg/10">
              {mode === 'planning' && (
                <PlanPreview
                  markdown={planMarkdown}
                  onEdit={handleEditPlan}
                  onApprove={handleApprovePlan}
                  isLoading={isApproving}
                />
              )}

              {mode === 'style' && (
                <StylePreview
                  styleDraft={styleDraft}
                  generatedAnchor={generatedAnchor}
                  isGenerating={isGeneratingStyle}
                  onFinalize={handleStyleFinalized}
                  onGenerateStyleAnchor={handleGenerateStyleAnchor}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Assets panel - slide-out from right side */}
      <AssetsPanel
        projectId={typeof params.id === 'string' ? params.id : ''}
        isOpen={assetsMenuOpen}
        onClose={() => setAssetsMenuOpen(false)}
      />

      {/* Files panel - slide-out from right side */}
      <FilesPanel
        projectId={typeof params.id === 'string' ? params.id : ''}
        isOpen={filesMenuOpen}
        onClose={() => setFilesMenuOpen(false)}
      />
    </div>
  )
}
