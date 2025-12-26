'use client';

import { useCopilotChatHeadless_c } from "@copilotkit/react-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
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
    <Card className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            <p>Start a conversation to plan your game assets!</p>
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
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2 text-zinc-500 dark:text-zinc-400">
              <p>Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex gap-2">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </Card>
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
        className="flex-1"
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
      >
        <Send className="h-4 w-4" />
      </Button>
    </>
  );
}
