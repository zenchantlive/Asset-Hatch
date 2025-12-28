"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { StylePreview, emptyStyleDraft, type StyleDraft, type GeneratedStyleAnchor } from "@/components/style/StylePreview"
import { GenerationQueue } from "@/components/generation/GenerationQueue"
import { FilesPanel } from "@/components/ui/FilesPanel"
import { AssetsPanel } from "@/components/ui/AssetsPanel"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"
import { db } from "@/lib/client-db"

type PlanningMode = 'plan' | 'style' | 'generation'

export default function PlanningPage() {
  const params = useParams()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [mode, setMode] = useState<PlanningMode>('plan')
  const [filesMenuOpen, setFilesMenuOpen] = useState(false)
  const [assetsMenuOpen, setAssetsMenuOpen] = useState(false)

  // Style phase state
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(emptyStyleDraft)
  const [generatedAnchor, setGeneratedAnchor] = useState<GeneratedStyleAnchor | null>(null)
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false)

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

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-transparent relative overflow-hidden">
      <div className="shrink-0 z-20 relative">
        <QualitiesBar
          qualities={qualities}
          onQualitiesChange={setQualities}
        />
      </div>

      <div className="shrink-0 z-20 relative border-b border-white/10 bg-glass-bg/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('plan')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'plan' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/60'}`}
            >
              Plan
            </button>
            <button
              onClick={() => setMode('style')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'style' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/60'}`}
            >
              Style
            </button>
            <button
              onClick={() => setMode('generation')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'generation' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/60'}`}
            >
              Generation
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Assets button - opens side panel with approved assets */}
            <button
              onClick={() => setAssetsMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Assets
            </button>

            {/* Files button - opens side panel with file viewer */}
            <button
              onClick={() => setFilesMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Files
            </button>
          </div>
        </div>
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
                qualities={qualities}
                projectId={typeof params.id === 'string' ? params.id : ''}
                onQualityUpdate={handleQualityUpdate}
                onPlanUpdate={handlePlanUpdate}
                onPlanComplete={handleApprovePlan}
                onStyleDraftUpdate={handleStyleDraftUpdate}
                onStyleAnchorGenerated={handleStyleAnchorGenerated}
                onStyleFinalized={handleStyleFinalized}
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
