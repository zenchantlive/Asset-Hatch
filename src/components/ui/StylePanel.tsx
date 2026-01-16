/**
 * StylePanel Component
 * 
 * A slide-out panel wrapper for the existing StylePreview component on mobile.
 * Includes a chat input bar at the bottom for quick edits.
 */

'use client'

import { StylePreview, type StyleDraft, type GeneratedStyleAnchor } from '@/components/style/StylePreview'
import { CompactChatInput } from '@/components/ui/CompactChatInput'

interface StylePanelProps {
    isOpen: boolean
    onClose: () => void
    styleDraft: StyleDraft
    generatedAnchor: GeneratedStyleAnchor | null
    isGenerating: boolean
    onFinalize: () => void
    onGenerateStyleAnchor: () => void
    onSendMessage: (message: string) => void
    isLoading?: boolean
}

export function StylePanel({
    isOpen,
    onClose,
    styleDraft,
    generatedAnchor,
    isGenerating,
    onFinalize,
    onGenerateStyleAnchor,
    onSendMessage,
    isLoading
}: StylePanelProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel - Full screen overlay */}
            <div className={`fixed inset-0 z-50 flex flex-col bg-zinc-950 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header with Back button */}
                <div className="flex items-center p-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <span className="text-lg">←</span>
                        <span className="text-sm font-medium">Back to Chat</span>
                    </button>
                </div>

                {/* Reuse existing StylePreview component - takes remaining space */}
                <div className="flex-1 overflow-hidden">
                    <StylePreview
                        styleDraft={styleDraft}
                        generatedAnchor={generatedAnchor}
                        isGenerating={isGenerating}
                        onFinalize={() => { onFinalize(); onClose(); }}
                        onGenerateStyleAnchor={onGenerateStyleAnchor}
                    />
                </div>

                {/* Chat input bar at bottom */}
                <CompactChatInput
                    onSend={onSendMessage}
                    onToggleChat={onClose}
                    isLoading={isLoading || isGenerating}
                    placeholder="Suggest style changes..."
                />
            </div>
        </>
    )
}
