'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextareaAutosize from 'react-textarea-autosize';
import { useStudio } from '@/lib/studio/context';
import type { UnifiedProjectContext } from '@/lib/types/shared-context';
import chatStorage from '@/lib/storage/chat-storage';

interface ChatPanelProps {
  gameId: string;
  projectContext?: UnifiedProjectContext;
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
  const hasRestoredMessages = useRef(false);

  // Get studio context to update code/preview when tools execute
  // Multi-file: Use loadFiles instead of setCode/loadSceneCode
  const { refreshPreview, refreshGame, loadFiles, addActivity } = useStudio();

  // Unique chat ID per game to maintain separate histories
  const chatId = `studio-chat-${gameId}`;

  // Debug: Log gameId to verify it's defined
  console.log('🎮 ChatPanel mounted with gameId:', gameId, 'hasContext:', !!projectContext);

  const {
    messages,
    setMessages,
    sendMessage,
    status,

  } = useChat({
    id: chatId,
    // AI SDK v6: Use transport for custom API endpoint
    transport: new DefaultChatTransport({
      api: '/api/studio/chat',
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onToolCall: async ({ toolCall }: { toolCall: any }) => {
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
            const parsed = JSON.parse(saved) as UIMessage[];
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('📨 Sending message to /api/studio/chat with gameId:', gameId, 'hasContext:', !!projectContext);

      // Pass projectContext in body when available (Phase 6B)
      const messageBody: { gameId: string; projectContext?: string } = { gameId };
      if (projectContext) {
        messageBody.projectContext = JSON.stringify(projectContext);
      }

      // CRITICAL: Pass body here, not in hook config (AI SDK v6 pattern)
      sendMessage(
        { text: input },
        {
          body: messageBody
        }
      );
      setInput("");
    }
  };

  // Only show loading state if there are messages (prevents initial loading state)
  const hasMessages = messages.length > 0;
  const isLoading = status === 'submitted' || status === 'streaming';
  const showLoading = isLoading && hasMessages;

  return (
    <div className="flex flex-col h-full">
      {/* Messages display */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            // Extract text from parts (AI SDK v6 pattern)
            // In v6, messages have a parts array instead of content
            interface UIMessagePart {
              type: 'text' | 'reasoning' | 'tool-call';
              text?: string;
              toolName?: string;
              args?: unknown;
            }
            const parts = message.parts as UIMessagePart[] | undefined;
            const textParts = parts?.filter(p =>
              p.type === 'text' || p.type === 'reasoning'
            ) || [];

            // Join all text parts and remove [REDACTED] placeholders
            const rawText = textParts.map(p => p.text ?? '').join('');
            const textContent = rawText.replace(/\[REDACTED\]/g, '').trim();

            // Skip messages with no text content
            if (!textContent) return null;

            return (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 ${message.role === "user"
                    ? "aurora-gradient text-white"
                    : "glass-panel aurora-glow-hover"
                    }`}
                >
                  <div className="text-sm leading-relaxed prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                    <ReactMarkdown>
                      {textContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {showLoading && (
          <div className="flex justify-start">
            <div className="glass-panel rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--aurora-1)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--aurora-2)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--aurora-3)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-sm opacity-70">Generating...</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - floating style */}
      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
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
            disabled={showLoading}
            minRows={1}
            maxRows={10}
            className="flex-1 glass-panel px-4 py-3 rounded-xl border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all text-base shadow-lg resize-none custom-scrollbar bg-transparent placeholder:text-muted-foreground outline-none"
          />
          <Button
            type="submit"
            disabled={showLoading || !input.trim()}
            size="icon"
            className="h-12 w-12 rounded-xl aurora-gradient text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
