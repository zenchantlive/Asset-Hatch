// -----------------------------------------------------------------------------
// Game Plan Chat
// Chat interface for planning phase - helps user define game features and files
// -----------------------------------------------------------------------------

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { Pencil, Send, Sparkles, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';
import { PromptChips } from '@/components/chat/PromptChips';
import { PinnedContext } from '@/components/chat/PinnedContext';
import { QuickFixBar, type QuickFixAction } from '@/components/chat/QuickFixBar';
import { extractMessageParts } from '@/lib/chat/message-utils';
import { getStudioPresets } from '@/lib/preset-prompts';
import { ChatModelSwitcher } from '@/components/ui/ChatModelSwitcher';
import { getDefaultModel } from '@/lib/model-registry';

/**
 * Type definitions for GamePlanChat component props
 */
interface GamePlanChatProps {
    gameId: string;
    gameName: string;
    onPlanUpdate: (content: string) => void;
}

/**
 * Type definition for studio plan tool calls
 */


/**
 * GamePlanChat - AI chat for game planning phase
 *
 * When AI calls updatePlan tool, we update the plan preview.
 */
export function GamePlanChat({ gameId, gameName, onPlanUpdate }: GamePlanChatProps) {
    const [input, setInput] = useState('');
    const [queuedPrompts, setQueuedPrompts] = useState<string[]>([]);
    const isQueueSendingRef = useRef(false);
    const hasRestoredMessages = useRef(false);

    // Model selection state - defaults from registry
    const [selectedModel, setSelectedModel] = useState<string>(() =>
        getDefaultModel("chat").id
    );

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
        onToolCall: ({ toolCall }) => {
            console.log('📝 Plan tool called:', toolCall.toolName);

            // Handle plan updates
            // Use type assertion since toolCall.input is typed generically in SDK v6
            const input = toolCall.input as Record<string, unknown> | undefined;
            if (toolCall.toolName === 'updatePlan' && typeof input?.content === 'string') {
                onPlanUpdate(input.content);
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

    useEffect(() => {
        if (status === 'submitted' || status === 'streaming') {
            return;
        }
        if (queuedPrompts.length === 0 || isQueueSendingRef.current) {
            return;
        }
        const [nextPrompt, ...rest] = queuedPrompts;

        // Defer state update to avoid synchronous setState in effect
        const timerId = window.setTimeout(() => {
            isQueueSendingRef.current = true;
            setQueuedPrompts(rest);
            sendMessage(
                { text: nextPrompt },
                {
                    body: {
                        gameId,
                        mode: 'planning',
                    },
                }
            );
            isQueueSendingRef.current = false;
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [queuedPrompts, status, sendMessage, gameId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) {
            return;
        }
        if (isLoading) {
            setQueuedPrompts((current) => [...current, trimmed]);
            setInput('');
            return;
        }
        sendMessage(
            { text: trimmed },
            {
                body: {
                    gameId,
                    mode: 'planning', // Tell API we're in planning mode
                    model: selectedModel,
                },
            }
        );
        setInput('');
    };

    const presets = getStudioPresets().map((preset) => ({
        id: preset.id,
        label: preset.label,
        prompt: preset.prompt,
        tone: 'neutral' as const,
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
            setMessages(messages.slice(0, index));
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

    const handleResetChat = () => {
        if (!window.confirm("Reset this chat history? This won't change your project context.")) {
            return;
        }
        setInput('');
        setQueuedPrompts([]);
        setMessages([]);
        localStorage.removeItem(`studio-plan-conversation-${gameId}`);
    };

    const handleQueueEdit = (index: number) => {
        const prompt = queuedPrompts[index];
        if (!prompt) {
            return;
        }
        setQueuedPrompts((current) => current.filter((_, itemIndex) => itemIndex !== index));
        setInput(prompt);
    };

    const handleQueueDelete = (index: number) => {
        setQueuedPrompts((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
                            <p className="text-muted-foreground max-w-sm text-base leading-relaxed mb-4">
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
                {queuedPrompts.length > 0 && (
                    <div className="mb-2 max-w-3xl mx-auto w-full">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                            <span className="font-medium text-white/80">Queued</span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] text-white/70">
                                {queuedPrompts.length}
                            </span>
                            <span className="opacity-70">Will send after this response.</span>
                        </div>
                        <div className="mt-2 space-y-2">
                            {queuedPrompts.map((prompt, index) => (
                                <div
                                    key={`${index}-${prompt.slice(0, 12)}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground"
                                >
                                    <span className="truncate text-white/80" title={prompt}>
                                        {prompt}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleQueueEdit(index)}
                                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                                            aria-label="Edit queued message"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQueueDelete(index)}
                                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                                            aria-label="Delete queued message"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Model switcher - always visible above input */}
                <div className="flex justify-start max-w-3xl mx-auto w-full mb-2">
                    <ChatModelSwitcher
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        compact={true}
                    />
                </div>
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
                        minRows={1}
                        maxRows={10}
                        className="flex-1 glass-panel px-4 py-3 rounded-xl border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-base shadow-lg resize-none custom-scrollbar bg-transparent placeholder:text-muted-foreground outline-none"
                    />
                    {showLoading && (
                        <Button
                            type="button"
                            onClick={() => stop?.()}
                            size="icon"
                            className="h-12 w-12 rounded-xl glass-panel text-white/80 shadow-lg hover:text-white hover:border-white/30 active:scale-95 transition-all duration-200"
                            aria-label="Stop response"
                        >
                            <Square className="h-5 w-5" />
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={!input.trim()}
                        size="icon"
                        className="h-12 w-12 rounded-xl aurora-gradient text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                        aria-label={showLoading ? 'Queue message' : 'Send message'}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                    <Button
                        type="button"
                        onClick={handleResetChat}
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-xl glass-panel text-white/70 shadow-lg hover:text-white hover:border-white/30 active:scale-95 transition-all duration-200"
                        aria-label="Reset chat history"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
