'use client';

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, MessageSquare, Square } from "lucide-react";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { ProjectQualities } from "./QualitiesBar";
import { getPresetsForMode } from "@/lib/preset-prompts";
import {
  updateQualitySchema,
  updatePlanSchema,
  finalizePlanSchema,
  updateStyleDraftSchema,
  generateStyleAnchorSchema,
  finalizeStyleSchema,
} from "@/lib/schemas";
// 3D-specific schemas for 3D mode tool validation
import {
  updateQuality3DSchema,
  updatePlan3DSchema,
  finalizePlan3DSchema,
} from "@/lib/schemas-3d";
import type { StyleDraft, GeneratedStyleAnchor } from "@/components/style/StylePreview";

interface UIMessagePart {
  type: 'text' | 'reasoning' | 'tool-call';
  text?: string;
  toolName?: string;
  input?: unknown;
}

interface ChatInterfaceProps {
  qualities: ProjectQualities;
  projectId: string;
  onQualityUpdate: (qualityKey: string, value: string) => void;
  onPlanUpdate: (markdown: string) => void;
  onPlanComplete: () => void;
  // Style phase callbacks
  onStyleDraftUpdate?: (draft: Partial<StyleDraft>) => void;
  onStyleAnchorGenerated?: (anchor: GeneratedStyleAnchor) => void;
  onStyleFinalized?: () => void;
  mode?: 'planning' | 'style';
  is3D?: boolean; // Whether the project is in 3D mode
}

export interface ChatInterfaceHandle {
  sendMessage: (message: string) => void;
}

export const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({
  qualities,
  projectId,
  onQualityUpdate,
  onPlanUpdate,
  onPlanComplete,
  onStyleDraftUpdate,
  onStyleAnchorGenerated,
  onStyleFinalized,
  mode = 'planning',
  is3D = false,
}, ref) => {
  const [input, setInput] = useState("");
  const chatId = `chat-${projectId}`;
  const hasRestoredMessages = useRef(false);

  // Debug: Log projectId and check AI SDK's localStorage
  console.log('🔧 ChatInterface projectId:', projectId);
  console.log('🔧 Chat ID:', chatId);

  // Check what AI SDK has stored
  useEffect(() => {
    if (projectId) {
      const aiSdkKey = `ai-chat-chat-${projectId}`;
      const stored = localStorage.getItem(aiSdkKey);
      console.log('📂 AI SDK localStorage key:', aiSdkKey);
      console.log('📂 AI SDK stored data:', stored ? 'exists' : 'empty');
    }
  }, [projectId, chatId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    id: chatId,
    // In AI SDK v6, body in hook config becomes stale
    // We pass body in sendMessage instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onToolCall: ({ toolCall }: { toolCall: any }) => {
      // IMPORTANT: This fires when AI calls a tool
      console.log('🔧 TOOL CALLED:', toolCall.toolName, 'Input:', toolCall.input);

      if (toolCall.toolName === 'updateQuality') {
        const result = updateQualitySchema.safeParse(toolCall.input);

        if (result.success) {
          const { qualityKey, value } = result.data;
          console.log('✅ Updating quality:', qualityKey, '→', value);
          onQualityUpdate(qualityKey, value);
        } else {
          // Fallback for potential model hallucinations (e.g. multi-key objects)
          console.warn('⚠️ Schema validation failed, attempting fallback parsing:', result.error);
          const input = toolCall.input as Record<string, unknown>;
          if (input && typeof input === 'object') {
            Object.entries(input).forEach(([key, value]) => {
              // Basic validation for string values
              if (typeof value === 'string') {
                console.log('✅ Updating multiple qualities (fallback):', key, '→', value);
                onQualityUpdate(key, value);
              }
            });
          }
        }
      } else if (toolCall.toolName === 'updatePlan') {
        const result = updatePlanSchema.safeParse(toolCall.input);

        if (result.success) {
          console.log('✅ Updating plan, length:', result.data.planMarkdown.length, 'chars');
          onPlanUpdate(result.data.planMarkdown);
        } else {
          // Fallback for 'markdown' key if model hallucinates
          const input = toolCall.input as Record<string, unknown>;
          const markdown = input?.planMarkdown || input?.markdown;
          if (typeof markdown === 'string') {
            console.log('✅ Updating plan (fallback), length:', markdown.length, 'chars');
            onPlanUpdate(markdown);
          }
        }
      } else if (toolCall.toolName === 'finalizePlan') {
        const result = finalizePlanSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Finalizing plan');
          onPlanComplete();
        }
      } else if (toolCall.toolName === 'updateStyleDraft') {
        // New style draft tool
        const result = updateStyleDraftSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating style draft:', result.data);
          onStyleDraftUpdate?.(result.data);
        }
      } else if (toolCall.toolName === 'generateStyleAnchor') {
        // Style anchor generation tool
        const result = generateStyleAnchorSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Style anchor generation triggered with prompt:', result.data.prompt);
          // The server handles generation, but we notify on tool result
          // The actual image URL comes back in the tool result
          const toolResult = toolCall.result as { success: boolean; imageUrl?: string; styleAnchorId?: string; prompt?: string };
          if (toolResult?.success && toolResult.imageUrl && toolResult.styleAnchorId) {
            onStyleAnchorGenerated?.({
              id: toolResult.styleAnchorId,
              imageUrl: toolResult.imageUrl,
              prompt: toolResult.prompt || result.data.prompt,
            });
          }
        }
      } else if (toolCall.toolName === 'finalizeStyle') {
        // Style finalization tool
        const result = finalizeStyleSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Style finalized, proceeding to generation');
          onStyleFinalized?.();
        }
        // =========================================================================
        // 3D Mode Tool Handlers
        // These are the 3D equivalents of the 2D planning tools.
        // They update the same state but use different schemas/validation.
        // =========================================================================
      } else if (toolCall.toolName === 'updateQuality3D') {
        // 3D quality update tool - sets mesh style, texture quality, rig preferences
        const result = updateQuality3DSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating 3D quality:', result.data);
          // Map 3D quality fields to the onQualityUpdate callback
          // The callback accepts string keys and string values
          if (result.data.meshStyle) {
            onQualityUpdate('mesh_style', result.data.meshStyle);
          }
          if (result.data.textureQuality) {
            onQualityUpdate('texture_quality', result.data.textureQuality);
          }
          if (result.data.defaultShouldRig !== undefined) {
            onQualityUpdate('default_should_rig', String(result.data.defaultShouldRig));
          }
          if (result.data.defaultAnimations) {
            onQualityUpdate('default_animations', JSON.stringify(result.data.defaultAnimations));
          }
        } else {
          console.warn('⚠️ 3D quality schema validation failed:', result.error);
        }
      } else if (toolCall.toolName === 'updatePlan3D') {
        // 3D plan update tool - saves markdown with [RIG]/[STATIC] tags
        const result = updatePlan3DSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating 3D plan, length:', result.data.planMarkdown.length, 'chars');
          onPlanUpdate(result.data.planMarkdown);
        } else {
          // Fallback for 'markdown' key if model hallucinates
          const input = toolCall.input as Record<string, unknown>;
          const markdown = input?.planMarkdown || input?.markdown;
          if (typeof markdown === 'string') {
            console.log('✅ Updating 3D plan (fallback), length:', markdown.length, 'chars');
            onPlanUpdate(markdown);
          }
        }
      } else if (toolCall.toolName === 'finalizePlan3D') {
        // 3D finalize tool - skips style phase, goes directly to generation
        const result = finalizePlan3DSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Finalizing 3D plan (skipping style phase)');
          onPlanComplete();
        }
      }
    },
  });

  // Restore messages from localStorage on first mount
  useEffect(() => {
    if (!projectId || hasRestoredMessages.current) return;

    const storageKey = `conversation-${projectId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UIMessage[];
        console.log('📂 Restoring', parsed.length, 'messages from localStorage');
        setMessages(parsed);
        hasRestoredMessages.current = true;
      } catch (error) {
        console.error('Failed to restore chat history:', error);
      }
    } else {
      console.log('📂 No saved messages found in localStorage');
      hasRestoredMessages.current = true;
    }
  }, [projectId, setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!projectId || !hasRestoredMessages.current || messages.length === 0) return;

    const storageKey = `conversation-${projectId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
      console.log('💾 Saved', messages.length, 'messages to localStorage');
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages, projectId]);

  // Expose sendMessage to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      console.log('📨 Sending message via ref:', text);
      // We must pass body here too as it might have changed
      sendMessage(
        { text },
        {
          body: {
            qualities,
            projectId,
          },
        }
      );
    }
  }));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Track processed style anchor IDs to prevent infinite refetching
  const processedStyleAnchorIds = useRef(new Set<string>());

  // Watch for tool-result parts containing style anchor data
  // In AI SDK v6, tool results come through the message stream, not onToolCall
  // The imageUrl is NOT in the tool result (to avoid LLM token limits)
  // We fetch it from the API using the styleAnchorId
  useEffect(() => {
    // Look through all messages for tool-result parts
    for (const message of messages) {
      if (message.role !== 'assistant') continue;

      const parts = message.parts as Array<{ type: string; toolName?: string; output?: unknown }> | undefined;
      if (!parts) continue;

      for (const part of parts) {
        // AI SDK v6 uses 'tool-{toolName}' format for tool parts
        if (part.type === 'tool-generateStyleAnchor') {
          // Use the ref-based Set to track processed IDs across renders
          const toolPart = part as Record<string, unknown>;
          const output = (toolPart.result || toolPart.output || toolPart) as { success?: boolean; styleAnchorId?: string } | undefined;
          if (output?.success && output.styleAnchorId && !processedStyleAnchorIds.current.has(output.styleAnchorId)) {
            processedStyleAnchorIds.current.add(output.styleAnchorId);
            console.log('🖼️ Found style anchor ID, fetching image:', output.styleAnchorId);

            // Fetch the image from the API
            fetch(`/api/style-anchor?id=${output.styleAnchorId}`)
              .then(res => res.json())
              .then(data => {
                if (data.imageUrl) {
                  console.log('✅ Fetched style anchor image');
                  onStyleAnchorGenerated?.({
                    id: output.styleAnchorId!,
                    imageUrl: data.imageUrl,
                    prompt: '',
                  });
                }
              })
              .catch(err => {
                console.error('Failed to fetch style anchor:', err);
              });
          }
        }
      }
    }
  }, [messages, onStyleAnchorGenerated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Pass body with each message to avoid stale values (AI SDK v6)
      sendMessage(
        { text: input },
        {
          body: {
            qualities,
            projectId,
          },
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
      {/* Messages area */}
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
              Describe your game idea, style, or specific assets. I&apos;ll help you plan and generate everything.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // In AI SDK v6, messages have a parts array instead of content
            // Extract text from text and reasoning parts
    const parts = message.parts as UIMessagePart[] | undefined;
    const textParts = parts?.filter((part) =>
      part.type === 'text' || part.type === 'reasoning'
    ) || [];
    // Join all text parts and remove [REDACTED] placeholders that AI SDK adds for tool calls
    const rawText = textParts.map((part) => part.text ?? '').join('');
    const textContent = rawText.replace(/\[REDACTED\]/g, '').trim();
    const toolParts = parts?.filter((part) =>
      part.type === 'tool-call' || part.type.startsWith('tool-')
    ) || [];
    const toolLabels = toolParts.map((part) => {
      if (part.type === 'tool-call') {
        return part.toolName || 'tool';
      }
      if (part.toolName) {
        return part.toolName;
      }
      if (part.type.startsWith('tool-')) {
        return part.type.replace('tool-', '');
      }
      return 'tool';
    });

            if (message.role === 'assistant') {
              const debugParts = parts?.map((p) => {
                if (p.type === 'tool-call') {
                  return { type: p.type, toolName: p.toolName, input: p.input };
                }
                return { type: p.type, hasText: !!p.text };
              });
              console.log('Assistant message parts:', debugParts);
            }

            const hasTextContent = textContent.length > 0;
            const hasToolCalls = toolLabels.length > 0;

            // Skip messages that have neither text nor tool-call parts
            if (!hasTextContent && !hasToolCalls) {
              return null;
            }

            return (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 ${message.role === "user"
                    ? "aurora-gradient text-white"
                    : "glass-panel aurora-glow-hover"
                    }`}
                >
                  {hasTextContent && (
                    <div className="text-sm leading-relaxed prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                      <ReactMarkdown>
                        {textContent}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.role === 'assistant' && hasToolCalls && (
                    <div className={`${hasTextContent ? 'mt-3' : ''} flex flex-wrap gap-2`}>
                      {toolLabels.map((label, toolIndex) => (
                        <span
                          key={`${label}-${toolIndex}`}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-white/70"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-2)] shadow-[0_0_0.5rem_0_var(--aurora-2)]" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
              <p className="opacity-70">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - floating style */}
      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">

        {/* Preset Prompts Row - Wrapped rows */}
        {!isLoading && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-3xl mx-auto w-full">
            {getPresetsForMode(mode, is3D).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setInput(preset.prompt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap
                  ${preset.id === 'style-infer'
                    ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 shadow-[0_0_0.625rem_-0.25rem_var(--color-primary)]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                  }`}
              >
                <MessageSquare className={`w-3 h-3 ${preset.id === 'style-infer' ? 'text-primary' : 'opacity-60'}`} />
                {preset.label}
              </button>
            ))}
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
                  // Create a synthetic event or just call sendMessage if we could. 
                  // But handleSubmit expects FormEvent.
                  // We can just call e.currentTarget.form?.requestSubmit()
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            placeholder="Type your ideas here..."
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
});

ChatInterface.displayName = "ChatInterface";
