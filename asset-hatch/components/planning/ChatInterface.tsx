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
  updateStyleKeywordsSchema,
  updateLightingKeywordsSchema,
  updateColorPaletteSchema,
  saveStyleAnchorSchema,
} from "@/lib/schemas";

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
  onStyleKeywordsUpdate?: (styleKeywords: string) => void;
  onLightingKeywordsUpdate?: (lightingKeywords: string) => void;
  onColorPaletteUpdate?: (colors: string[]) => void;
  onStyleAnchorSave?: () => void;
}

export function ChatInterface({
  qualities,
  projectId,
  onQualityUpdate,
  onPlanUpdate,
  onPlanComplete,
  onStyleKeywordsUpdate,
  onLightingKeywordsUpdate,
  onColorPaletteUpdate,
  onStyleAnchorSave,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    // api: '/api/chat', // Default is /api/chat
    // @ts-expect-error - body is supported by the API but missing from types
    body: {
      qualities,
      projectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
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
      } else if (toolCall.toolName === 'updateStyleKeywords') {
        const result = updateStyleKeywordsSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating style keywords:', result.data.styleKeywords);
          onStyleKeywordsUpdate?.(result.data.styleKeywords);
        }
      } else if (toolCall.toolName === 'updateLightingKeywords') {
        const result = updateLightingKeywordsSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating lighting keywords:', result.data.lightingKeywords);
          onLightingKeywordsUpdate?.(result.data.lightingKeywords);
        }
      } else if (toolCall.toolName === 'updateColorPalette') {
        const result = updateColorPaletteSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Updating color palette:', result.data.colors);
          onColorPaletteUpdate?.(result.data.colors);
        }
      } else if (toolCall.toolName === 'saveStyleAnchor') {
        const result = saveStyleAnchorSchema.safeParse(toolCall.input);
        if (result.success) {
          console.log('✅ Saving style anchor');
          onStyleAnchorSave?.();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
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


