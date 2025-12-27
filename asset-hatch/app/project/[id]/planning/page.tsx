"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { StyleAnchorEditor } from "@/components/style/StyleAnchorEditor"
import { db } from "@/lib/db"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"

type PlanningMode = 'plan' | 'style' | 'generation'

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [mode, setMode] = useState<PlanningMode>('plan')
  const [savedFiles, setSavedFiles] = useState<string[]>([])
  const [filesMenuOpen, setFilesMenuOpen] = useState(false)

  // Style phase state
  const [styleKeywords, setStyleKeywords] = useState("")
  const [lightingKeywords, setLightingKeywords] = useState("")
  const [colorPalette, setColorPalette] = useState<string[]>([])

  // Handler for quality updates from AI
  const handleQualityUpdate = (qualityKey: string, value: string) => {
    console.log('📝 Planning page received quality update:', qualityKey, '=', value);
    setQualities(prev => {
      const updated = { ...prev, [qualityKey]: value };
      console.log('📊 Updated qualities:', updated);
      return updated;
    });
  };

  // Handler for plan updates from AI
  const handlePlanUpdate = (markdown: string) => {
    console.log('📋 Planning page received plan update, length:', markdown.length);
    setPlanMarkdown(markdown);
  };

  // Style phase handlers
  const handleStyleKeywordsUpdate = (keywords: string) => {
    console.log('🎨 Planning page received style keywords update:', keywords);
    setStyleKeywords(keywords);
  };

  const handleLightingKeywordsUpdate = (keywords: string) => {
    console.log('💡 Planning page received lighting keywords update:', keywords);
    setLightingKeywords(keywords);
  };

  const handleColorPaletteUpdate = (colors: string[]) => {
    console.log('🎨 Planning page received color palette update:', colors);
    setColorPalette(colors);
  };

  const handleStyleAnchorSave = async () => {
    console.log('💾 Planning page: Style anchor save requested');
    await loadSavedFiles();
  };

  // Load saved files for file viewer menu
  const loadSavedFiles = async () => {
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
  };

  // Define handler functions first
  const handleEditPlan = () => {
    // TODO: Implement plan editing modal (future slice)
    console.log("Edit plan clicked")
  }

  const handleApprovePlan = async () => {
    if (!planMarkdown) {
      console.error("No plan to approve")
      return
    }

    setIsApproving(true)
    const projectId = params.id as string
    try {
      await db.transaction('rw', db.memory_files, db.projects, async () => {
        // 1. Save plan to memory file as entities.json
        await saveMemoryFile(projectId, 'entities.json', planMarkdown)

        // 2. Save selected qualities to project
        await updateProjectQualities(projectId, qualities)

        // 3. Update project phase to 'style'
        await db.projects.update(projectId, {
          phase: 'style',
          updated_at: new Date().toISOString(),
        })
      })

      // 4. Switch to style mode (stay on same page)
      setMode('style')

      // 5. Update saved files list
      await loadSavedFiles()
    } catch (error) {
      console.error("Plan approval failed:", error)
      // TODO: Add user-facing error notification (future enhancement)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-transparent relative overflow-hidden">
      {/* Qualities Bar - Collapsible/Compact Header */}
      <div className="shrink-0 z-20 relative">
        <QualitiesBar
          qualities={qualities}
          onQualitiesChange={setQualities}
        />
      </div>

      {/* Tab Navigation + File Menu */}
      <div className="shrink-0 z-20 relative border-b border-white/10 bg-glass-bg/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('plan')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'plan'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              Plan
            </button>
            <button
              onClick={() => setMode('style')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'style'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              Style
            </button>
            <button
              onClick={() => setMode('generation')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${mode === 'generation'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              Generation
            </button>
          </div>

          {/* Files Menu */}
          <div className="relative">
            <button
              onClick={() => setFilesMenuOpen(!filesMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Files
              <svg className={`w-3 h-3 transition-transform ${filesMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {filesMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-glass-bg/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                {savedFiles.length === 0 ? (
                  <div className="px-4 py-3 text-white/40 text-sm">No saved files yet</div>
                ) : (
                  savedFiles.map((fileName) => (
                    <button
                      key={fileName}
                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-purple-500/20 transition-all duration-200 flex items-center gap-2"
                      onClick={() => {
                        console.log('Open file:', fileName);
                        setFilesMenuOpen(false);
                      }}
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

      {/* Main Workspace - 50/50 Split */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Chat (Interactive Focus) */}
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-glass-bg/20 backdrop-blur-sm relative transition-all duration-500 hover:bg-glass-bg/30">
          <ChatInterface
            qualities={qualities}
            projectId={typeof params.id === 'string' ? params.id : ''}
            onQualityUpdate={handleQualityUpdate}
            onPlanUpdate={handlePlanUpdate}
            onPlanComplete={handleApprovePlan}
            onStyleKeywordsUpdate={handleStyleKeywordsUpdate}
            onLightingKeywordsUpdate={handleLightingKeywordsUpdate}
            onColorPaletteUpdate={handleColorPaletteUpdate}
            onStyleAnchorSave={handleStyleAnchorSave}
          />
        </div>

        {/* Right Panel - Mode-dependent content */}
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
            <StyleAnchorEditor
              projectId={typeof params.id === 'string' ? params.id : ''}
              initialStyleKeywords={styleKeywords}
              initialLightingKeywords={lightingKeywords}
              initialColorPalette={colorPalette}
              onSave={async (styleAnchor) => {
                console.log('Style anchor saved:', styleAnchor.id);
                await loadSavedFiles();
              }}
            />
          )}

          {mode === 'generation' && (
            <div className="flex items-center justify-center h-full text-white/40">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Generation Queue</p>
                <p className="text-sm mt-2">Coming soon - asset generation interface</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
