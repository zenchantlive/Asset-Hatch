'use client';

import { useCopilotChatHeadless_c } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ChatInterface() {
  const {
    visibleMessages,
    appendMessage,
    isLoading,
  } = useCopilotChatHeadless_c({
    makeSystemMessage: () =>
      "You are a helpful game asset planning assistant. Help the user plan what assets they need for their game. Ask clarifying questions about their game type, art style, and what characters, environments, and items they'll need.",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages]);

  const handleSendMessage = async (content: string) => {
    if (content.trim()) {
      await appendMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Sparkles className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">Start planning your game assets</p>
            <p className="text-xs mt-2 max-w-xs">
              Tell me about your game idea and I'll help you plan what assets you'll need
            </p>
          </div>
        ) : (
          visibleMessages.map((message, index) => (
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
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
        <div className="flex gap-2">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");

  return (
    <>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
              onSend(input);
              setInput("");
            }
          }
        }}
        placeholder="Describe your game idea..."
        disabled={disabled}
        className="flex-1 glass-input"
      />
      <Button
        onClick={() => {
          if (input.trim()) {
            onSend(input);
            setInput("");
          }
        }}
        disabled={disabled || !input.trim()}
        size="icon"
        className="aurora-gradient text-white hover:opacity-90 transition-opacity"
      >
        <Send className="h-4 w-4" />
      </Button>
    </>
  );
}
