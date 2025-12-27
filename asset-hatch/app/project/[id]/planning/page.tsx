"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { db } from "@/lib/db"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)

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
    try {
      const projectId = params.id;
      if (typeof projectId !== 'string') {
        console.error("Plan approval failed: Invalid Project ID.");
        // TODO: Add user-facing error notification (future enhancement)
        setIsApproving(false);
        return;
      }

      // 1. Save plan to memory file as entities.json
      await saveMemoryFile(projectId, 'entities.json', planMarkdown)

      // 2. Save selected qualities to project
      await updateProjectQualities(projectId, qualities)

      // 3. Update project phase to 'style'
      await db.projects.update(projectId, {
        phase: 'style',
        updated_at: new Date().toISOString(),
      })

      // 4. Navigate to style anchor phase
      router.push(`/project/${projectId}/style`)
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
          />
        </div>

        {/* Right Panel - Preview (Visual Confirmation) */}
        <div className="w-1/2 flex flex-col relative bg-glass-bg/10">
          <PlanPreview
            markdown={planMarkdown}
            onEdit={handleEditPlan}
            onApprove={handleApprovePlan}
            isLoading={isApproving}
          />
        </div>
      </div>
    </div>
  )
}
