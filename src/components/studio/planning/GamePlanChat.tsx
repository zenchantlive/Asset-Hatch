// -----------------------------------------------------------------------------
// Game Plan Chat
// Chat interface for planning phase - helps user define game features and files
// -----------------------------------------------------------------------------

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { Send, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';
import { PromptChips } from '@/components/chat/PromptChips';
import { PinnedContext } from '@/components/chat/PinnedContext';
import { QuickFixBar, type QuickFixAction } from '@/components/chat/QuickFixBar';
import { extractMessageParts } from '@/lib/chat/message-utils';
import { getStudioPresets } from '@/lib/preset-prompts';

interface GamePlanChatProps {
    gameId: string;
    gameName: string;
    onPlanUpdate: (content: string) => void;
}

interface StudioPlanToolCall {
    toolName: string;
    args?: {
        content?: string;
    };
}

/**
 * GamePlanChat - AI chat for game planning phase
 *
 * When AI calls updatePlan tool, we update the plan preview.
 */
export function GamePlanChat({ gameId, gameName, onPlanUpdate }: GamePlanChatProps) {
    const [input, setInput] = useState('');
    const hasRestoredMessages = useRef(false);

    // Unique chat ID for planning
    const chatId = `studio-plan-${gameId}`;

    const {
        messages,
        setMessages,
        sendMessage,
        status,
        stop,
         
    } = useChat({
        id: chatId,
        transport: new DefaultChatTransport({
            api: '/api/studio/chat',
        }),
        onToolCall: ({ toolCall }: { toolCall: StudioPlanToolCall }) => {
            console.log('📝 Plan tool called:', toolCall.toolName, 'Args:', toolCall.args);

            // Handle plan updates
            if (toolCall.toolName === 'updatePlan' && toolCall.args?.content) {
                onPlanUpdate(toolCall.args.content);
            }
        },
    });

    // Restore messages from localStorage
    useEffect(() => {
        if (!gameId || hasRestoredMessages.current) return;

        const storageKey = `studio-plan-conversation-${gameId}`;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
            try {
                const parsed: UIMessage[] = JSON.parse(saved);
                console.log('📂 Restoring', parsed.length, 'plan messages');
                setMessages(parsed);
                hasRestoredMessages.current = true;
            } catch (error) {
                console.error('Failed to restore plan chat:', error);
            }
        } else {
            hasRestoredMessages.current = true;
        }
    }, [gameId, setMessages]);

    // Save messages to localStorage
    useEffect(() => {
        if (!gameId || !hasRestoredMessages.current || messages.length === 0) return;

        const storageKey = `studio-plan-conversation-${gameId}`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (error) {
            console.error('Failed to save plan chat:', error);
        }
    }, [messages, gameId]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledRef = useRef(false);

    // Only show loading state if there are messages (prevents initial loading state)
    const hasMessages = messages.length > 0;
    const isLoading = status === 'submitted' || status === 'streaming';
    const showLoading = isLoading && hasMessages;

    const isNearBottom = () => {
        const container = scrollContainerRef.current;
        if (!container) return true;
        const threshold = 120;
        const distanceToBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        return distanceToBottom <= threshold;
    };

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior });
    };

    const handleScroll = () => {
        userScrolledRef.current = !isNearBottom();
    };

    useEffect(() => {
        if (userScrolledRef.current && isLoading) {
            return;
        }
        if (!userScrolledRef.current) {
            scrollToBottom('smooth');
        }
    }, [messages.length, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(
                { text: input },
                {
                    body: {
                        gameId,
                        mode: 'planning', // Tell API we're in planning mode
                    },
                }
            );
            setInput('');
        }
    };

    const presets = getStudioPresets().map((preset) => ({
        id: preset.id,
        label: preset.label,
        prompt: preset.prompt,
        tone: 'neutral',
    }));

    const buildQuote = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) {
            return;
        }
        const quoted = trimmed
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
        setInput((current) => (current ? `${current}\n\n${quoted}\n` : `${quoted}\n`));
    };

    const handleEdit = (text: string) => {
        if (!text.trim()) {
            return;
        }
        setInput(text);
    };

    const handleRegenerateFromIndex = (startIndex: number) => {
        for (let index = startIndex; index >= 0; index -= 1) {
            const candidate = messages[index];
            if (candidate.role !== 'user') {
                continue;
            }
            const extracted = extractMessageParts(candidate);
            if (!extracted.hasTextContent) {
                continue;
            }
            sendMessage(
                { text: extracted.textContent },
                {
                    body: {
                        gameId,
                        mode: 'planning',
                    },
                }
            );
            return;
        }
    };

    const pinnedSummary = `Planning ${gameName}`;

    const quickFixActions: QuickFixAction[] = [
        {
            id: 'plan-outline',
            label: 'Outline plan',
            prompt: 'Draft a concise plan outline with key systems and files.',
        },
        {
            id: 'plan-gaps',
            label: 'Find gaps',
            prompt: 'Identify missing gameplay systems or files we should include.',
        },
        {
            id: 'plan-priorities',
            label: 'Prioritize work',
            prompt: 'Prioritize the next development steps for this game plan.',
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Messages display */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-6">
                    <PinnedContext title="Planning context" summary={pinnedSummary} />
                </div>
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 pt-4 space-y-4"
                >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-90">
                        <div className="p-4 rounded-full bg-primary/10 mb-6 ring-1 ring-primary/20 shadow-[0_0_1.875rem_-0.625rem_var(--color-primary)]">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-3xl font-heading font-bold mb-3 tracking-tight text-gradient-primary">
                            Let&apos;s plan {gameName}
                        </h3>
                        <p className="text-muted-foreground max-w-sm text-base leading-relaxed mb-6">
                            Describe your game idea. I&apos;ll help you plan the features and files needed to build it.
                        </p>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground/80">
                            <p>Try saying:</p>
                            <p className="italic">&quot;I want to make a flight simulator game&quot;</p>
                            <p className="italic">&quot;A platformer with a knight character&quot;</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const extracted = extractMessageParts(message);
                        if (!extracted.hasTextContent && !extracted.hasToolCalls) {
                            return null;
                        }

                        return (
                            <ChatMessageRow
                                key={`${message.id ?? 'msg'}-${index}`}
                                message={message}
                                extracted={extracted}
                                isStreaming={
                                    isLoading &&
                                    message.role === 'assistant' &&
                                    index === messages.length - 1
                                }
                                onQuote={buildQuote}
                                onEdit={handleEdit}
                                onRegenerate={() => handleRegenerateFromIndex(index)}
                            />
                        );
                    })
                )}
                {showLoading && (
                    <div className="flex justify-start">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                            <div className="flex gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-1)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-2)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-3)] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="opacity-70">Planning...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            </div>

            {/* Input area */}
            <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
                {!isLoading && (
                    <PromptChips
                        presets={presets}
                        onSelect={setInput}
                        className="mb-3 max-w-3xl mx-auto w-full"
                    />
                )}
                {hasMessages && (
                    <QuickFixBar
                        actions={quickFixActions}
                        onSelect={setInput}
                        className="mb-3 max-w-3xl mx-auto w-full"
                    />
                )}
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-3 relative max-w-3xl mx-auto w-full items-end"
                >
                    <TextareaAutosize
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (input.trim()) {
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }
                        }}
                        placeholder="Describe your game idea..."
                        disabled={showLoading}
                        minRows={1}
                        maxRows={10}
                        className="flex-1 glass-panel px-4 py-3 rounded-xl border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-base shadow-lg resize-none custom-scrollbar bg-transparent placeholder:text-muted-foreground outline-none"
                    />
                    {showLoading ? (
                        <Button
                            type="button"
                            onClick={() => stop?.()}
                            size="icon"
                            className="h-12 w-12 rounded-xl glass-panel text-white/80 shadow-lg hover:text-white hover:border-white/30 active:scale-95 transition-all duration-200"
                        >
                            <Square className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={!input.trim()}
                            size="icon"
                            className="h-12 w-12 rounded-xl aurora-gradient text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
