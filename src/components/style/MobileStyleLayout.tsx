/**
 * MobileStyleLayout Component
 * 
 * Redesigned mobile experience for the style phase.
 * Features full-screen style preview with a minimal bottom input bar.
 */

'use client'

import { useState, useRef } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { StylePreview, StyleDraft, GeneratedStyleAnchor } from './StylePreview'
import { ChatInterface, ChatInterfaceHandle } from '../planning/ChatInterface'
import { CompactChatInput } from '../ui/CompactChatInput'
import { Button } from '@/components/ui/button'
import { ProjectQualities } from '../planning/QualitiesBar'

interface MobileStyleLayoutProps {
    projectId: string
    styleDraft: StyleDraft
    generatedAnchor: GeneratedStyleAnchor | null
    isGenerating: boolean
    qualities: ProjectQualities
    onQualityUpdate: (key: string, value: string) => void
    onStyleDraftUpdate: (draft: Partial<StyleDraft>) => void
    onStyleAnchorGenerated: (anchor: GeneratedStyleAnchor) => void
    onFinalize: () => void
    onGenerateStyleAnchor: () => void
    isLoading?: boolean
}

export function MobileStyleLayout({
    projectId,
    styleDraft,
    generatedAnchor,
    isGenerating,
    qualities,
    onQualityUpdate,
    onStyleDraftUpdate,
    onStyleAnchorGenerated,
    onFinalize,
    onGenerateStyleAnchor,
    isLoading = false
}: MobileStyleLayoutProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatRef = useRef<ChatInterfaceHandle>(null)

    const handleSendMessage = (message: string) => {
        chatRef.current?.sendMessage(message)
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden relative">
            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <StylePreview
                    styleDraft={styleDraft}
                    generatedAnchor={generatedAnchor}
                    isGenerating={isGenerating}
                    onFinalize={onFinalize}
                    onGenerateStyleAnchor={onGenerateStyleAnchor}
                />
            </div>

            {/* Sticky Bottom Input Bar */}
            <CompactChatInput
                onSend={handleSendMessage}
                onToggleChat={() => setIsChatOpen(true)}
                isLoading={isLoading || isGenerating}
                placeholder="Suggest style changes..."
            />

            {/* Full-screen Chat Overlay (Always mounted to process tool calls) */}
            {/* top-28 accounts for the mobile toolbar height so the header is visible */}
            <div className={`fixed top-28 left-0 right-0 bottom-0 z-[100] flex flex-col transition-transform duration-300 ease-in-out bg-zinc-950 ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header for Chat Modal */}
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
                        Back to Style
                    </Button>
                </div>

                <div className="flex-1 bg-zinc-950 overflow-hidden">
                    <ChatInterface
                        ref={chatRef}
                        projectId={projectId}
                        qualities={qualities}
                        onQualityUpdate={onQualityUpdate}
                        onPlanUpdate={() => { }} // Not used in style mode
                        onPlanComplete={() => { }} // Not used in style mode
                        onStyleDraftUpdate={onStyleDraftUpdate}
                        onStyleAnchorGenerated={onStyleAnchorGenerated}
                        onStyleFinalized={onFinalize}
                        mode="style"
                    />
                </div>
            </div>
        </div>
    )
}
