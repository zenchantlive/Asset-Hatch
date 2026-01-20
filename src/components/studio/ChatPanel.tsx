'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { Pencil, Send, Sparkles, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';
import { useStudio } from '@/lib/studio/context';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';
import chatStorage from '@/lib/storage/chat-storage';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';
import { PromptChips } from '@/components/chat/PromptChips';
import { PinnedContext } from '@/components/chat/PinnedContext';
import { QuickFixBar, type QuickFixAction } from '@/components/chat/QuickFixBar';
import { extractMessageParts } from '@/lib/chat/message-utils';
import { getStudioPresets } from '@/lib/preset-prompts';

interface ChatPanelProps {
  gameId: string;
  projectContext?: UnifiedProjectContext;
}

interface StudioToolCallArgs {
  name?: string;
  status?: string;
  content?: string;
  fileOrder?: string[];
}

interface StudioToolCallPayload {
  toolName: string;
  args?: StudioToolCallArgs;
}

/**
 * ChatPanel - AI chat interface for Hatch Studios game creation
 *
 * When AI calls file tools, we update the studio context so the preview
 * shows the new code immediately (hot-reload pattern).
 *
 * @see src/components/planning/ChatInterface.tsx for reference implementation
 */
export function ChatPanel({ gameId, projectContext }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [queuedPrompts, setQueuedPrompts] = useState<string[]>([]);
  const isQueueSendingRef = useRef(false);
  const hasRestoredMessages = useRef(false);
  const lastProcessedFixIdRef = useRef<string>('');

  // Get studio context to update code/preview when tools execute
  // Multi-file: Use loadFiles instead of setCode/loadSceneCode
  const { refreshPreview, refreshGame, loadFiles, addActivity, pendingFixRequest, clearFixRequest } = useStudio();

  // Unique chat ID per game to maintain separate histories
  const chatId = `studio-chat-${gameId}`;

  // Debug: Log gameId to verify it's defined
  console.log('🎮 ChatPanel mounted with gameId:', gameId, 'hasContext:', !!projectContext);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,

  } = useChat({
    id: chatId,
    // AI SDK v6: Use transport for custom API endpoint
    transport: new DefaultChatTransport({
      api: '/api/studio/chat',
    }),
    onToolCall: async ({ toolCall }: { toolCall: StudioToolCallPayload }) => {
      // IMPORTANT: This fires when AI calls a tool
      console.log('🎮 Tool called:', toolCall.toolName, 'Args:', toolCall.args);

      // Handle game tool results - update UI state based on tool execution
      // Multi-file mode: Uses createFile/updateFile 
      switch (toolCall.toolName) {
        case 'createScene':
          console.log('✅ Scene created:', toolCall.args);
          // Scene created - refresh game data to include new scene in list
          addActivity({
            toolName: 'createScene',
            status: 'success',
            details: `Created scene: ${toolCall.args?.name || 'unnamed'}`,
            fileName: toolCall.args?.name,
          });
          refreshGame();
          break;

        // File management tools - multi-file support
        case 'createFile':
          console.log('📄 File created:', toolCall.args?.name);
          addActivity({
            toolName: 'createFile',
            status: 'success',
            details: `Created file: ${toolCall.args?.name}`,
            fileName: toolCall.args?.name,
          });
          // Refresh files to get the new file in the list
          await loadFiles();
          refreshPreview();
          break;

        case 'updateFile':
          console.log('💾 File updated:', toolCall.args?.name);
          addActivity({
            toolName: 'updateFile',
            status: 'success',
            details: `Updated file: ${toolCall.args?.name}`,
            fileName: toolCall.args?.name,
          });
          // Refresh files to get updated content
          await loadFiles();
          refreshPreview();
          break;

        case 'deleteFile':
          console.log('🗑️ File deleted:', toolCall.args?.name);
          addActivity({
            toolName: 'deleteFile',
            status: 'success',
            details: `Deleted file: ${toolCall.args?.name}`,
            fileName: toolCall.args?.name,
          });
          // Refresh files to get updated list
          await loadFiles();
          refreshPreview();
          break;

        case 'listFiles':
          console.log('📋 Files listed');
          addActivity({
            toolName: 'listFiles',
            status: 'success',
            details: 'File list refreshed',
          });
          // Just refresh the file list (in case it changed)
          await loadFiles();
          break;

        case 'reorderFiles':
          console.log('🔄 Files reordered:', toolCall.args?.fileOrder);
          addActivity({
            toolName: 'reorderFiles',
            status: 'success',
            details: `Reordered ${toolCall.args?.fileOrder?.length || 0} files`,
          });
          // Refresh files since execution order changed
          await loadFiles();
          refreshPreview();
          break;

        // Planning tools
        case 'updatePlan':
          console.log('📝 Plan updated, status:', toolCall.args?.status);
          addActivity({
            toolName: 'updatePlan',
            status: 'success',
            details: `Plan updated: ${toolCall.args?.status || 'modified'}`,
          });
          // Refresh game to get updated plan
          refreshGame();
          break;

        case 'getPlan':
          console.log('📖 Plan retrieved');
          addActivity({
            toolName: 'getPlan',
            status: 'success',
            details: 'Plan retrieved',
          });
          break;

        default:
          console.warn('⚠️ Unknown tool:', toolCall.toolName);
      }
    },
  });

  // Migrate from localStorage to IndexedDB on first load
  useEffect(() => {
    if (!gameId) return;

    const migrateAndLoad = async () => {
      try {
        // Migrate existing localStorage data
        await chatStorage.migrateFromLocalStorage();

        // Load messages using the new storage system
        const savedMessages = await chatStorage.loadMessages(gameId);
        if (savedMessages && savedMessages.length > 0) {
          console.log('📂 Restoring', savedMessages.length, 'studio messages from hybrid storage');
          setMessages(savedMessages);
        } else {
          console.log('📂 No saved studio messages found in hybrid storage');
        }
        hasRestoredMessages.current = true;
      } catch (error) {
        console.error('Failed to restore studio chat history:', error);
        // Fallback to localStorage if hybrid storage fails
        const storageKey = `studio-conversation-${gameId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed: UIMessage[] = JSON.parse(saved);
            console.log('📂 Restoring', parsed.length, 'studio messages from localStorage fallback');
            setMessages(parsed);
          } catch (fallbackError) {
            console.error('Failed to restore from localStorage fallback:', fallbackError);
          }
        }
        hasRestoredMessages.current = true;
      }
    };

    migrateAndLoad();
  }, [gameId, setMessages]);

  // Save messages using hybrid storage whenever they change
  useEffect(() => {
    if (!gameId || !hasRestoredMessages.current || messages.length === 0) return;

    const saveWithFallback = async () => {
      try {
        await chatStorage.saveMessages(gameId, messages);
        console.log('💾 Saved', messages.length, 'studio messages to hybrid storage');
      } catch (error) {
        console.error('Failed to save to hybrid storage, falling back to localStorage:', error);
        // Fallback to localStorage
        const storageKey = `studio-conversation-${gameId}`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(messages));
          console.log('💾 Saved', messages.length, 'studio messages to localStorage fallback');
        } catch (fallbackError) {
          console.error('Failed to save to localStorage fallback:', fallbackError);
        }
      }
    };

    saveWithFallback();
  }, [messages, gameId]);

  // Derive loading state (must be defined before effects that reference it)
  const isLoading = status === 'submitted' || status === 'streaming';
  // Auto-fix: Watch for pendingFixRequest and auto-send fix prompt
  useEffect(() => {
    if (!pendingFixRequest || isLoading) return;

    // Deduplication: Skip if we've already processed this request ID (handles StrictMode, double-effect)
    if (lastProcessedFixIdRef.current === pendingFixRequest.id) return;

    // Mark this request as being processed to prevent re-entrancy
    lastProcessedFixIdRef.current = pendingFixRequest.id;

    console.log('🔧 Auto-fixing error:', pendingFixRequest.message);

    // Build comprehensive fix prompt with all available context
    const fixPrompt = `Fix this runtime error${pendingFixRequest.fileName ? ` in ${pendingFixRequest.fileName}` : ''}${pendingFixRequest.line ? ` on line ${pendingFixRequest.line}` : ''}: ${pendingFixRequest.message}${pendingFixRequest.stack ? `\n\nStack trace:\n${pendingFixRequest.stack}` : ''}`;

    // Use sendMessage with proper request body context
    sendMessage(
      { text: fixPrompt },
      { body: buildMessageBody() }
    ).then(() => {
      // Clear the pending request AFTER successful send
      clearFixRequest();
    }).catch((error) => {
      // If send fails, reset the processed ID so we can retry
      console.error('Failed to auto-send fix request:', error);
      lastProcessedFixIdRef.current = '';
      // Don't clear pendingFixRequest so the user can retry manually
    });
  }, [pendingFixRequest, isLoading, clearFixRequest, sendMessage, buildMessageBody]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Only show loading state if there are messages (prevents initial loading state)
  const hasMessages = messages.length > 0;
  const showLoading = isLoading && hasMessages;

  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 120;
    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= threshold;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
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
      scrollToBottom("smooth");
    }
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
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
      const messageBody: { gameId: string; projectContext?: string } = { gameId };
      if (projectContext) {
        messageBody.projectContext = JSON.stringify(projectContext);
      }
      sendMessage({ text: nextPrompt }, { body: messageBody });
      isQueueSendingRef.current = false;
    }, 0);
    
    return () => window.clearTimeout(timerId);
  }, [queuedPrompts, status, sendMessage, gameId, projectContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    if (isLoading) {
      setQueuedPrompts((current) => [...current, trimmed]);
      setInput("");
      return;
    }
    console.log('📨 Sending message to /api/studio/chat with gameId:', gameId, 'hasContext:', !!projectContext);
    sendMessage({ text: trimmed }, { body: buildMessageBody() });
    setInput("");
  };

  const presets = getStudioPresets().map((preset) => ({
    id: preset.id,
    label: preset.label,
    prompt: preset.prompt,
    tone: "neutral" as const,
  }));

  const buildMessageBody = () => {
    const messageBody: { gameId: string; projectContext?: string } = { gameId };
    if (projectContext) {
      messageBody.projectContext = JSON.stringify(projectContext);
    }
    return messageBody;
  };

  const buildQuote = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const quoted = trimmed
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
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
      if (candidate.role !== "user") {
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
          body: buildMessageBody(),
        }
      );
      return;
    }
  };

  const handleResetChat = async () => {
    if (!window.confirm("Reset this chat history? This won't change your project context.")) {
      return;
    }
    setInput("");
    setQueuedPrompts([]);
    setMessages([]);
    try {
      await chatStorage.clearMessages(gameId);
    } catch (error) {
      console.error("Failed to clear chat storage:", error);
    }
    localStorage.removeItem(`studio-conversation-${gameId}`);
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

  const pinnedSummary = projectContext?.gameConcept
    ? projectContext.gameConcept
    : "Share your core game concept to anchor the build.";

  const pinnedItems = projectContext
    ? [
        { label: "Audience", value: projectContext.targetAudience },
        {
          label: "Features",
          value: projectContext.keyFeatures.slice(0, 3).join(", ") || "None yet",
        },
      ].filter((item) => item.value.length > 0)
    : [];

  const quickFixActions: QuickFixAction[] = [
    {
      id: "studio-fix-blank",
      label: "Fix blank screen",
      prompt:
        "The preview is blank. Diagnose the issue and update the scene so something renders.",
    },
    {
      id: "studio-explain-errors",
      label: "Explain errors",
      prompt: "Summarize any preview errors and propose fixes.",
    },
    {
      id: "studio-show-changes",
      label: "Show changes",
      prompt: "List the latest changes you made to the game files.",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages display */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6">
          <PinnedContext
            title="Game context"
            summary={pinnedSummary}
            items={pinnedItems}
          />
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
              What are we building?
            </h3>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
              Describe your game idea. I&apos;ll help you create scenes, add assets, set up physics, and generate all the code.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const extracted = extractMessageParts(message);
            if (!extracted.hasTextContent && !extracted.hasToolCalls) {
              return null;
            }

            return (
              <ChatMessageRow
                key={`${message.id ?? "msg"}-${index}`}
                message={message}
                extracted={extracted}
                isStreaming={
                  isLoading &&
                  message.role === "assistant" &&
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
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-1)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-2)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-3)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="opacity-70">Generating...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Input area - floating style */}
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
            placeholder="Describe your game idea or ask me to create a scene..."
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
            aria-label={showLoading ? "Queue message" : "Send message"}
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            onClick={() => void handleResetChat()}
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
