"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview } from "@/components/planning/PlanPreview"

export default function PlanningPage() {
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState("")

  const handleEditPlan = () => {
    // TODO: Implement plan editing (future slice)
    console.log("Edit plan clicked")
  }

  const handleApprovePlan = () => {
    // TODO: Implement plan approval and transition to next phase (future slice)
    console.log("Approve plan clicked", { qualities, planMarkdown })
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
          <ChatInterface />
        </div>

        {/* Right Panel - Preview (Visual Confirmation) */}
        <div className="w-1/2 flex flex-col relative bg-glass-bg/10">
          <PlanPreview
            markdown={planMarkdown}
            onEdit={handleEditPlan}
            onApprove={handleApprovePlan}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  )
}
