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
import { ExportPanel } from "@/components/export/ExportPanel"
import { PlanPanel } from "@/components/ui/PlanPanel"
import { StylePanel } from "@/components/ui/StylePanel"




type PlanningMode = 'planning' | 'style' | 'generation' | 'export'

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
  const [modelsMenuOpen, setModelsMenuOpen] = useState(false)
  const [planPanelOpen, setPlanPanelOpen] = useState(false)
  const [stylePanelOpen, setStylePanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [projectName, setProjectName] = useState<string>("")
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
          if (!urlMode && project.phase && ['planning', 'style', 'generation', 'export'].includes(project.phase)) {
            // If the stored phase is different from default 'planning', update it
            const phaseMode = project.phase as PlanningMode;
            if (phaseMode !== mode) {
              setMode(phaseMode);
              // Also update URL to match
              router.replace(`/project/${params.id}/planning?mode=${phaseMode}`);
            }
          } else if (urlMode && ['planning', 'style', 'generation', 'export'].includes(urlMode)) {
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

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


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
          setProjectName(project.name);
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
  const handleQualityUpdate = async (qualityKey: string, value: string) => {
    console.log('📝 Planning page received quality update:', qualityKey, '=', value);

    const prevQualities = qualities;
    // 1. Update local state immediately (for UI reactivity)
    setQualities(prev => ({ ...prev, [qualityKey]: value }));

    // 2. Save to Dexie immediately (so GenerationQueue can read it)
    const projectId = params.id;
    if (typeof projectId === 'string') {
      try {
        await updateProjectQualities(projectId, { [qualityKey]: value });
        console.log('✅ Quality saved to Dexie:', qualityKey);

        // 3. The AI tool already saved to Prisma server-side
        // No need to sync again here
      } catch (error) {
        console.error("Failed to save quality to Dexie:", error);
        // Revert optimistic update on failure
        setQualities(prevQualities);
      }
    }
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

    // Auto-open style panel on mobile when style anchor is generated
    if (isMobile) {
      setStylePanelOpen(true);
    }
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

  // Wrapper for when AI finalizes the plan - auto-opens panel on mobile
  const handlePlanComplete = () => {
    // Auto-open plan panel on mobile so user can review the finalized plan
    if (isMobile) {
      setPlanPanelOpen(true);
    }
    // Continue with normal approval flow
    handleApprovePlan();
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
              {projectName && (
                <span className="text-primary/80 ml-2">— {projectName}</span>
              )}
            </h1>
          </div>

          {/* CENTER: Interaction Mode Tabs */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
              {(['planning', 'style', 'generation', 'export'] as const).map((tabMode) => (
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
          {/* Row 0: Title */}
          {projectName && (
            <div className="text-center">
              <h1 className="text-xs font-heading font-medium tracking-wide text-white/80">
                Project Planning <span className="text-primary/80">— {projectName}</span>
              </h1>
            </div>
          )}
          {/* Row 1: Tabs (centered, full width) */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 rounded-lg bg-black/20 border border-white/5 w-full max-w-xs">
              {(['planning', 'style', 'generation', 'export'] as const).map((tabMode) => (
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
              {mode === 'generation' && (
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70"
                  onClick={() => setModelsMenuOpen(true)}
                >
                  Models
                </button>
              )}
              {mode === 'planning' && (
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/80 text-white"
                  onClick={() => setPlanPanelOpen(true)}
                >
                  📄 Plan
                </button>
              )}
              {mode === 'style' && (
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/80 text-white"
                  onClick={() => setStylePanelOpen(true)}
                >
                  🎨 Style
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parameters Bar - Visible on desktop, shows selected values */}
      <div className="hidden lg:block shrink-0 z-10 border-b border-white/5">
        <QualitiesBar
          key={mode} // Re-mount when mode changes to reset default state
          qualities={qualities}
          onQualitiesChange={setQualities}
          onSave={handleParametersSave}
          mode="bar"
          defaultExpanded={mode === 'planning'} // Only expanded by default in planning mode
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {mode === 'generation' ? (
          // Generation mode: Full-width GenerationQueue (no chat)
          <GenerationQueue
            projectId={params.id as string}
            modelsMenuOpen={modelsMenuOpen}
            onModelsMenuClose={() => setModelsMenuOpen(false)}
          />
        ) : mode === 'export' ? (
          // Export mode: Full-width ExportPanel (no chat)
          <div className="w-full flex items-center justify-center p-8 bg-glass-bg/10">
            <div className="w-full max-w-2xl">
              <ExportPanel projectId={params.id as string} />
            </div>
          </div>
        ) : (
          // Responsive layout for Plan and Style modes
          <>
            {isMobile ? (
              // Mobile: Full-width Chat with view panels for Plan/Style
              <div className="w-full flex flex-col h-full">
                <ChatInterface
                  ref={chatRef}
                  qualities={qualities}
                  projectId={typeof params.id === 'string' ? params.id : ''}
                  onQualityUpdate={handleQualityUpdate}
                  onPlanUpdate={handlePlanUpdate}
                  onPlanComplete={handlePlanComplete}
                  onStyleDraftUpdate={handleStyleDraftUpdate}
                  onStyleAnchorGenerated={handleStyleAnchorGenerated}
                  onStyleFinalized={handleStyleFinalized}
                  mode={mode}
                />
              </div>
            ) : (
              // Desktop: Keep 50/50 split with chat
              <>
                <div className="w-1/2 flex flex-col border-r border-white/5 bg-glass-bg/20 backdrop-blur-sm relative transition-all duration-500 hover:bg-glass-bg/30">
                  <ChatInterface
                    ref={chatRef}
                    qualities={qualities}
                    projectId={typeof params.id === 'string' ? params.id : ''}
                    onQualityUpdate={handleQualityUpdate}
                    onPlanUpdate={handlePlanUpdate}
                    onPlanComplete={handlePlanComplete}
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

      {/* Plan panel - slide-out for mobile */}
      <PlanPanel
        isOpen={planPanelOpen}
        onClose={() => setPlanPanelOpen(false)}
        markdown={planMarkdown}
        onEdit={handleEditPlan}
        onApprove={handleApprovePlan}
        onSendMessage={(msg) => chatRef.current?.sendMessage(msg)}
        isLoading={isApproving}
      />

      {/* Style panel - slide-out for mobile */}
      <StylePanel
        isOpen={stylePanelOpen}
        onClose={() => setStylePanelOpen(false)}
        styleDraft={styleDraft}
        generatedAnchor={generatedAnchor}
        isGenerating={isGeneratingStyle}
        onFinalize={handleStyleFinalized}
        onGenerateStyleAnchor={handleGenerateStyleAnchor}
        onSendMessage={(msg) => chatRef.current?.sendMessage(msg)}
        isLoading={isApproving}
      />
    </div>
  )
}
