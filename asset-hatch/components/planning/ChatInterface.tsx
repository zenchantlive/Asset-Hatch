'use client';

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInterfaceProps {
  qualities: Record<string, string>;
  projectId: string;
  onQualityUpdate: (qualityKey: string, value: string) => void;
  onPlanUpdate: (markdown: string) => void;
  onPlanComplete: () => void;
}

export function ChatInterface({
  qualities,
  projectId,
  onQualityUpdate,
  onPlanUpdate,
  onPlanComplete,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  
  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    api: '/api/chat',
    body: {
      qualities,
      projectId,
    },
    onToolCall: ({ toolCall }) => {
      // IMPORTANT: This fires when AI calls a tool
      console.log('🔧 TOOL CALLED:', toolCall.toolName, 'Input:', toolCall.input);
      
      if (toolCall.toolName === 'updateQuality') {
        const toolInput = toolCall.input as any;
        // Handle expected format: {qualityKey: 'art_style', value: 'Pixel Art'}
        if (toolInput.qualityKey && toolInput.value) {
          console.log('✅ Updating quality:', input.qualityKey, '→', input.value);
          onQualityUpdate(input.qualityKey, input.value);
        } 
        // Handle Gemini's format: {art_style: 'Pixel Art', game_genre: 'Platformer'}
        else {
          console.log('✅ Updating multiple qualities:', input);
          Object.entries(input).forEach(([key, value]) => {
            onQualityUpdate(key, value as string);
          });
        }
      } else if (toolCall.toolName === 'updatePlan') {
        const input = toolCall.input as any;
        // Handle both 'planMarkdown' and 'markdown'
        const markdown = input.planMarkdown || input.markdown;
        if (markdown) {
          console.log('✅ Updating plan, length:', markdown.length, 'chars');
          onPlanUpdate(markdown);
        }
      } else if (toolCall.toolName === 'finalizePlan') {
        console.log('✅ Finalizing plan');
        onPlanComplete();
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
  const isLoading = status === 'in_progress';
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
              Tell me about your game idea and I'll help you plan what assets you'll need
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // In AI SDK v6, messages have a parts array instead of content
            // Extract text from text and reasoning parts
            const textParts = message.parts?.filter((part: any) => 
              part.type === 'text' || part.type === 'reasoning'
            ) || [];
            const textContent = textParts.map((part: any) => part.text).join('');

            // In AI SDK v6, assistant messages can contain just tool calls without any text.
            // We should not render these messages to the user.
            const hasOnlyToolCalls =
              message.role === 'assistant' &&
              textParts.length === 0 &&
              message.parts?.every((part: any) => part.type === 'tool-call');

            if (hasOnlyToolCalls) {
              return null;
            }

            // Skip messages with no text content, unless they have other displayable parts.
            if (!textContent && textParts.length === 0) {
              const hasOtherParts = message.parts && message.parts.length > 0;
              if (!hasOtherParts) return null;
            }

            return (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 ${
                    message.role === "user"
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


