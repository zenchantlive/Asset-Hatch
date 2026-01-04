/**
 * MobilePlanningLayout Component
 * 
 * Redesigned mobile experience for the planning phase.
 * Features full-screen plan preview with a minimal bottom input bar.
 * Chat history is hidden behind a toggle button.
 */

'use client'

import { useState, useRef } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { PlanPreview } from './PlanPreview'
import { ChatInterface, ChatInterfaceHandle } from './ChatInterface'
import { CompactChatInput } from '../ui/CompactChatInput'
import { Button } from '@/components/ui/button'
import { ProjectQualities } from './QualitiesBar'

interface MobilePlanningLayoutProps {
    projectId: string
    markdown: string
    qualities: ProjectQualities
    onQualityUpdate: (key: string, value: string) => void
    onPlanUpdate: (markdown: string) => void
    onPlanComplete: () => void
    onEdit: () => void
    onApprove: () => void
    isLoading?: boolean
}

export function MobilePlanningLayout({
    projectId,
    markdown,
    qualities,
    onQualityUpdate,
    onPlanUpdate,
    onPlanComplete,
    onEdit,
    onApprove,
    isLoading = false
}: MobilePlanningLayoutProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatRef = useRef<ChatInterfaceHandle>(null)

    const handleSendMessage = (message: string) => {
        chatRef.current?.sendMessage(message)
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden relative">
            {/* Header / Toolbar is already provided by page.tsx */}

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <PlanPreview
                    markdown={markdown}
                    onEdit={onEdit}
                    onApprove={onApprove}
                    isLoading={isLoading}
                />
            </div>

            {/* Sticky Bottom Input Bar */}
            <CompactChatInput
                onSend={handleSendMessage}
                onToggleChat={() => setIsChatOpen(true)}
                isLoading={isLoading}
                placeholder="Suggest plan changes..."
            />

            {/* Full-screen Chat Overlay (Always mounted to process tool calls) */}
            {/* top-28 accounts for the mobile toolbar height so the header is visible */}
            <div className={`fixed top-28 left-0 right-0 bottom-0 z-[100] flex flex-col transition-transform duration-300 ease-in-out bg-zinc-950 ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header for Chat Modal (Visible only when open) */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900 shadow-xl">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white text-base">Chat History</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChatOpen(false)}
                        className="rounded-lg h-10 px-4 bg-white/5 border-white/10 hover:bg-white/10 text-white/90"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Back to Plan
                    </Button>
                </div>

                <div className="flex-1 bg-zinc-950 overflow-hidden">
                    <ChatInterface
                        ref={chatRef}
                        projectId={projectId}
                        qualities={qualities}
                        onQualityUpdate={onQualityUpdate}
                        onPlanUpdate={onPlanUpdate}
                        onPlanComplete={onPlanComplete}
                    />
                </div>
            </div>
        </div>
    )
}
