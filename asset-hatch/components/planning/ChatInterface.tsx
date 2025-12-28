'use client';

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProjectQualities } from "./QualitiesBar";
import {
  updateQualitySchema,
  updatePlanSchema,
  finalizePlanSchema,
  updateStyleDraftSchema,
  generateStyleAnchorSchema,
  finalizeStyleSchema,
} from "@/lib/schemas";
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
}

export function ChatInterface({
  qualities,
  projectId,
  onQualityUpdate,
  onPlanUpdate,
  onPlanComplete,
  onStyleDraftUpdate,
  onStyleAnchorGenerated,
  onStyleFinalized,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");

  // Debug: Log projectId
  console.log('🔧 ChatInterface projectId:', projectId);

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
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
      }
    },
  });

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
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Sparkles className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">Start planning your game assets</p>
            <p className="text-xs mt-2 max-w-xs">
              Tell me about your game idea and I&apos;ll help you plan what assets you&apos;ll need
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
            const textContent = textParts.map((part) => part.text ?? '').join('');

            if (message.role === 'assistant') {
              const debugParts = parts?.map((p) => {
                if (p.type === 'tool-call') {
                  return { type: p.type, toolName: p.toolName, input: p.input };
                }
                return { type: p.type, hasText: !!p.text };
              });
              console.log('Assistant message parts:', debugParts);
            }

            // Skip messages with no text content
            if (!textContent) {
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {textContent || '(Tool calls or non-text content)'}
                  </p>
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
                <p className="text-sm opacity-70">Thinking...</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - sticky at bottom */}
      <div className="sticky bottom-0 glass-panel border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your game idea..."
            disabled={showLoading}
            className="flex-1 glass-input"
          />
          <Button
            type="submit"
            disabled={showLoading || !input.trim()}
            size="icon"
            className="aurora-gradient text-white hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}


