"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/planning/ChatInterface"
import { QualitiesBar, ProjectQualities } from "@/components/planning/QualitiesBar"
import { PlanPreview, SAMPLE_PLAN } from "@/components/planning/PlanPreview"

export default function PlanningPage() {
  const [qualities, setQualities] = useState<ProjectQualities>({})
  const [planMarkdown, setPlanMarkdown] = useState(SAMPLE_PLAN) // Using sample data initially

  const handleEditPlan = () => {
    // TODO: Implement plan editing (future slice)
    console.log("Edit plan clicked")
  }

  const handleApprovePlan = () => {
    // TODO: Implement plan approval and transition to next phase (future slice)
    console.log("Approve plan clicked", { qualities, planMarkdown })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header is in parent layout at --header-height (4rem) */}

      {/* QualitiesBar - sticky below header */}
      <QualitiesBar
        qualities={qualities}
        onQualitiesChange={setQualities}
      />

      {/* Two-column main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - Chat Panel (45% width) */}
        <div className="w-[45%] border-r border-[var(--glass-border)] flex flex-col">
          <ChatInterface />
        </div>

        {/* Right column - Plan Preview Panel (55% width) */}
        <div className="w-[55%] flex flex-col">
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
