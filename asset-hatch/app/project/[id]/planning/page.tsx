"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ChatInterface, ChatInterfaceHandle } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { StylePreview, emptyStyleDraft, type StyleDraft, type GeneratedStyleAnchor } from "@/components/style/StylePreview"
import { GenerationQueue } from "@/components/generation/GenerationQueue"
import { FilesPanel } from "@/components/ui/FilesPanel"
import { AssetsPanel } from "@/components/ui/AssetsPanel"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"
import { db } from "@/lib/client-db"
import { fetchAndSyncProject } from "@/lib/sync"

type PlanningMode = 'plan' | 'style' | 'generation'

export default function PlanningPage() {
  const params = useParams()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [mode, setMode] = useState<PlanningMode>('plan')
  const [filesMenuOpen, setFilesMenuOpen] = useState(false)
  const [assetsMenuOpen, setAssetsMenuOpen] = useState(false)
  const chatRef = useRef<ChatInterfaceHandle>(null)

  // Style phase state
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(emptyStyleDraft)
  const [generatedAnchor, setGeneratedAnchor] = useState<GeneratedStyleAnchor | null>(null)
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false)

  // Sync project data from Prisma to Dexie on mount
  // This ensures GenerationQueue and other client components can find project data
  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      fetchAndSyncProject(params.id).catch(console.error)
    }
  }, [params.id])

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
    setMode('generation');
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
        await db.projects.update(projectId, {
          phase: 'style',
          updated_at: new Date().toISOString(),
        })
      })
      setMode('style')
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

    // 2. Reprompt AI if we have a chat ref (only in plan mode)
    if (chatRef.current && mode === 'plan') {
      const activeQualities = Object.entries(qualities)
        .filter(([_, v]) => v)
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
              {(['plan', 'style', 'generation'] as const).map((tabMode) => (
                <button
                  key={tabMode}
                  onClick={() => setMode(tabMode)}
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
              {(['plan', 'style', 'generation'] as const).map((tabMode) => (
                <button
                  key={tabMode}
                  onClick={() => setMode(tabMode)}
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
              {mode === 'plan' && (
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
