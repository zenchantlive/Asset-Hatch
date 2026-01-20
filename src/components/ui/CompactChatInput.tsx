/**
 * CompactChatInput Component
 * 
 * A minimal, mobile-friendly input bar for the planning and style phases.
 * Designed to be sticky at the bottom of the screen.
 */

'use client'

import { useState, useRef } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { Button } from '@/components/ui/button'

interface CompactChatInputProps {
    onSend: (message: string) => void
    onToggleChat: () => void
    isLoading?: boolean
    placeholder?: string
}

export function CompactChatInput({
    onSend,
    onToggleChat,
    isLoading = false,
    placeholder = "Describe changes..."
}: CompactChatInputProps) {
    const [input, setInput] = useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (input.trim() && !isLoading) {
            onSend(input.trim())
            setInput('')
        }
    }

    return (
        <div className="p-3 bg-gradient-to-t from-background via-background/90 to-transparent border-t border-white/10 safe-bottom">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
                {/* Chat toggle button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleChat}
                    className="h-12 w-12 rounded-xl glass-panel text-white/70 hover:text-white active:scale-95 transition-all outline-none"
                >
                    <MessageSquare className="h-5 w-5 text-white/70" />
                </Button>

                {/* Main input wrapper */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 flex items-center gap-2 relative"
                >
                    <TextareaAutosize
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                        placeholder={placeholder}
                        disabled={isLoading}
                        maxRows={4}
                        className="flex-1 glass-panel border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none min-h-[48px]"
                    />

                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className={`h-12 w-12 rounded-xl aurora-gradient text-white shadow-lg transition-all active:scale-90 ${isLoading ? 'opacity-50' : 'hover:brightness-110'
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                    <div className="hidden md:flex items-center text-xs text-white/40">
                        Shift+Enter for newline
                    </div>
                </form>
            </div>
        </div>
    )
}
