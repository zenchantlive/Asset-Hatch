"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { StylePreview, emptyStyleDraft, type StyleDraft, type GeneratedStyleAnchor } from "@/components/style/StylePreview"
import { GenerationQueue } from "@/components/generation/GenerationQueue"
import { db } from "@/lib/client-db"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"

type PlanningMode = 'plan' | 'style' | 'generation'

export default function PlanningPage() {
  const params = useParams()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [mode, setMode] = useState<PlanningMode>('plan')
  const [savedFiles, setSavedFiles] = useState<string[]>([])
  const [filesMenuOpen, setFilesMenuOpen] = useState(false)

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

  // Load saved files for file viewer menu
  const loadSavedFiles = useCallback(async () => {
    try {
      const projectId = params.id;
      if (typeof projectId !== 'string') return;

      const memoryFiles = await db.memory_files
        .where('project_id')
        .equals(projectId)
        .toArray();

      const fileNames = memoryFiles.map((file) => file.type);
      setSavedFiles(fileNames);
    } catch (error) {
      console.error('Failed to load saved files:', error);
    }
  }, [params.id]);

  useEffect(() => {
    loadSavedFiles();
  }, [loadSavedFiles]);

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
      await loadSavedFiles()
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

          <div className="relative">
            <button
              onClick={() => setFilesMenuOpen(!filesMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Files
            </button>

            {filesMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-glass-bg/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                {savedFiles.length === 0 ? (
                  <div className="px-4 py-3 text-white/40 text-sm">No saved files yet</div>
                ) : (
                  savedFiles.map((fileName) => (
                    <button
                      key={fileName}
                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-purple-500/20 transition-all duration-200 flex items-center gap-2"
                      onClick={() => setFilesMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {fileName}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
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

          {mode === 'generation' && (
            <GenerationQueue projectId={params.id as string} />
          )}
        </div>
      </div>
    </div>
  )
}
