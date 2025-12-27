"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCopilotReadable } from "@copilotkit/react-core"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"
import { usePlanningTools } from "@/hooks/usePlanningTools"
import { db } from "@/lib/db"
import { saveMemoryFile, updateProjectQualities } from "@/lib/db-utils"

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")
  const [isApproving, setIsApproving] = useState(false)

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

      // 4. Navigate to style anchor phase after successful transaction
      router.push(`/project/${projectId}/style`)
    } catch (error) {
      console.error("Plan approval failed:", error)
      // TODO: Add user-facing error notification (future enhancement)
      setIsApproving(false) // Also set to false on error
    } finally {
      // Navigation is async, so we only set isApproving to false if it's not a success case with navigation
      if (router.asPath === `/project/${projectId}/planning`) {
        setIsApproving(false)
      }
    }
    } catch (error) {
      console.error("Plan approval failed:", error)
      // TODO: Add user-facing error notification (future enhancement)
    } finally {
      setIsApproving(false)
    }
  }

  // Initialize CopilotKit tools for AI-driven interactions
  usePlanningTools(
    qualities,
    setQualities,
    setPlanMarkdown,
    handleApprovePlan
  )

  // Share current project qualities with AI for context-aware suggestions
  useCopilotReadable({
    description: "Current project quality selections for the game asset project",
    value: qualities,
  })

  // Share project context with AI
  useCopilotReadable({
    description: "Current project context and progress",
    value: {
      projectId: params.id,
      phase: "planning",
      hasPlan: !!planMarkdown,
      qualitiesSelected: Object.keys(qualities).length > 0,
    },
  })

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
          <ChatInterface />
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
