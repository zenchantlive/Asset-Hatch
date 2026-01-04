/**
 * PlanPanel Component
 * 
 * A slide-out panel wrapper for the existing PlanPreview component on mobile.
 * Includes a chat input bar at the bottom for quick edits.
 */

'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanPreview } from '@/components/planning/PlanPreview'
import { CompactChatInput } from '@/components/ui/CompactChatInput'

interface PlanPanelProps {
    isOpen: boolean
    onClose: () => void
    markdown: string
    onEdit: () => void
    onApprove: () => void
    onSendMessage: (message: string) => void
    isLoading?: boolean
}

export function PlanPanel({ isOpen, onClose, markdown, onEdit, onApprove, onSendMessage, isLoading }: PlanPanelProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel - Full screen overlay */}
            <div className={`fixed inset-0 z-50 flex flex-col bg-zinc-950 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Close button - floating top right */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 border border-white/10"
                >
                    <X className="w-5 h-5 text-white" />
                </Button>

                {/* Reuse existing PlanPreview component - takes remaining space */}
                <div className="flex-1 overflow-hidden">
                    <PlanPreview
                        markdown={markdown}
                        onEdit={() => { onEdit(); onClose(); }}
                        onApprove={() => { onApprove(); onClose(); }}
                        isLoading={isLoading}
                    />
                </div>

                {/* Chat input bar at bottom */}
                <CompactChatInput
                    onSend={onSendMessage}
                    onToggleChat={onClose}
                    isLoading={isLoading}
                    placeholder="Suggest plan changes..."
                />
            </div>
        </>
    )
}
