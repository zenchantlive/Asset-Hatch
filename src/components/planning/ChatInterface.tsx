'use client';

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Sparkles, Square } from "lucide-react";
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
import { ChatMessageRow } from "@/components/chat/ChatMessageRow";
import { PromptChips } from "@/components/chat/PromptChips";
import { PinnedContext } from "@/components/chat/PinnedContext";
import { QuickFixBar, type QuickFixAction } from "@/components/chat/QuickFixBar";
import { extractMessageParts } from "@/lib/chat/message-utils";

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

interface ToolCallPayload {
  toolName: string;
  input?: {
    qualityKey?: string;
    value?: string;
    planMarkdown?: string;
    markdown?: string;
    prompt?: string;
    meshStyle?: string;
    textureQuality?: string;
    defaultShouldRig?: boolean;
    defaultAnimations?: string[];
    [key: string]:
      | string
      | boolean
      | string[]
      | undefined;
  };
  result?: {
    success?: boolean;
    imageUrl?: string;
    styleAnchorId?: string;
    prompt?: string;
  };
}

interface ToolResultShape {
  success?: boolean;
  styleAnchorId?: string;
}

interface ToolResultCarrier {
  result?: Record<string, string | boolean | undefined>;
  output?: Record<string, string | boolean | undefined>;
  success?: boolean;
  styleAnchorId?: string;
}

const isToolResultCarrier = (
  part: UIMessage["parts"][number]
): part is UIMessage["parts"][number] & ToolResultCarrier =>
  "result" in part || "output" in part || "success" in part || "styleAnchorId" in part;

const getStyleAnchorResult = (
  part: UIMessage["parts"][number]
): ToolResultShape | undefined => {
  if (part.type !== "tool-generateStyleAnchor") {
    return undefined;
  }

  if (!isToolResultCarrier(part)) {
    return undefined;
  }

  const payload = part.result ?? part.output ?? {
    success: part.success,
    styleAnchorId: part.styleAnchorId,
  };

  return {
    success: typeof payload.success === "boolean" ? payload.success : undefined,
    styleAnchorId:
      typeof payload.styleAnchorId === "string" ? payload.styleAnchorId : undefined,
  };
};

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
    onToolCall: ({ toolCall }: { toolCall: ToolCallPayload }) => {
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
          const input = toolCall.input;
          if (input) {
            Object.entries(input).forEach(([key, value]) => {
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
          const markdown = toolCall.input?.planMarkdown || toolCall.input?.markdown;
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
          const toolResult = toolCall.result;
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
          const markdown = toolCall.input?.planMarkdown || toolCall.input?.markdown;
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
        const parsed: UIMessage[] = JSON.parse(saved);
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

      const parts = message.parts;
      if (!parts) continue;

      for (const part of parts) {
        // AI SDK v6 uses 'tool-{toolName}' format for tool parts
        if (part.type === 'tool-generateStyleAnchor') {
          // Use the ref-based Set to track processed IDs across renders
          const output = getStyleAnchorResult(part);
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
                    id: output.styleAnchorId,
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

  const presets = getPresetsForMode(mode, is3D).map((preset) => ({
    id: preset.id,
    label: preset.label,
    prompt: preset.prompt,
    tone: preset.id === "style-infer" ? "primary" : "neutral",
  }));

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
      sendMessage(
        { text: extracted.textContent },
        {
          body: {
            qualities,
            projectId,
          },
        }
      );
      return;
    }
  };

  const qualityEntries = Object.entries(qualities).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].length > 0
  );

  const qualityItems = qualityEntries.map(([key, value]) => ({
    label: key.replace(/_/g, " "),
    value,
  }));

  const pinnedSummary = qualityItems.length
    ? qualityItems
        .slice(0, 3)
        .map((item) => item.value)
        .join(" · ")
    : "Set your game vision to guide the plan.";

  const quickFixActions: QuickFixAction[] = [
    {
      id: "plan-summarize",
      label: "Summarize plan",
      prompt: "Summarize the current plan in 5 bullet points.",
    },
    {
      id: "plan-gaps",
      label: "Find gaps",
      prompt: "Identify missing asset categories and suggest what to add.",
    },
    {
      id: "plan-next",
      label: "Next steps",
      prompt: "Propose the next 3 steps to finalize this plan.",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6">
          <PinnedContext
            title="Planning context"
            summary={pinnedSummary}
            items={qualityItems}
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
              Describe your game idea, style, or specific assets. I&apos;ll help you plan and generate everything.
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
              <p className="opacity-70">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Input area - floating style */}
      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent">

        {/* Preset Prompts Row - Wrapped rows */}
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
