"use client";

import ReactMarkdown from "react-markdown";
import type { UIMessage } from "@ai-sdk/react";

import { ChatMessageActions } from "@/components/chat/ChatMessageActions";
import {
  extractMessageParts,
  formatMessageTimestamp,
  type ExtractedMessageParts,
} from "@/lib/chat/message-utils";
import { cn } from "@/lib/utils";

interface ChatMessageRowProps {
  message: UIMessage;
  extracted?: ExtractedMessageParts;
  isStreaming?: boolean;
  onQuote?: (text: string) => void;
  onEdit?: (text: string) => void;
  onRegenerate?: () => void;
}

const getRoleLabel = (role: UIMessage["role"]): string => {
  switch (role) {
    case "assistant":
      return "Assistant";
    case "user":
      return "You";
    case "system":
      return "System";
    default:
      return "System";
  }
};

export function ChatMessageRow({
  message,
  extracted,
  isStreaming = false,
  onQuote,
  onEdit,
  onRegenerate,
}: ChatMessageRowProps) {
  const details = extracted ?? extractMessageParts(message);
  const showMessage = details.hasTextContent || details.hasToolCalls;

  if (!showMessage) {
    return null;
  }

  const isAssistant = message.role === "assistant";
  const timestampLabel = details.createdAt ? formatMessageTimestamp(details.createdAt) : null;
  const toolCountLabel = details.hasToolCalls
    ? `${details.toolLabels.length} tool${details.toolLabels.length > 1 ? "s" : ""}`
    : null;
  const statusLabel = isStreaming ? "Streaming" : null;

  return (
    <div
      className={cn(
        "group flex flex-col gap-1",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-wide text-white/50">
        <span className="font-semibold text-white/70">
          {getRoleLabel(message.role)}
        </span>
        <span className="h-1 w-1 rounded-full bg-white/30" />
        <span>{timestampLabel}</span>
        {toolCountLabel ? (
          <>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{toolCountLabel}</span>
          </>
        ) : null}
        {statusLabel ? (
          <>
            <span className="h-1 w-1 rounded-full bg-[var(--aurora-2)]" />
            <span className="text-[0.625rem] font-semibold text-[var(--aurora-2)]">
              {statusLabel}
            </span>
          </>
        ) : null}
      </div>
      {details.hasTextContent ? (
        <div
          className={cn(
            "max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300",
            message.role === "user"
              ? "aurora-gradient text-white"
              : "glass-panel aurora-glow-hover",
            isStreaming ? "animate-in fade-in-0" : null
          )}
        >
          <div className="text-sm leading-relaxed prose prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
            <ReactMarkdown>{details.textContent}</ReactMarkdown>
          </div>
          {isAssistant && details.hasToolCalls ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {details.toolLabels.map((label, toolIndex) => (
                <span
                  key={`${label}-${toolIndex}`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-white/70"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-2)] shadow-[0_0_0.5rem_0_var(--aurora-2)]" />
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {details.toolLabels.map((label, toolIndex) => (
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
      <ChatMessageActions
        role={message.role === 'system' ? 'assistant' : message.role as "user" | "assistant"}
        textContent={details.textContent}
        onQuote={onQuote}
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        className={cn(
          "transition-opacity",
          message.role === "user" ? "self-end" : "self-start",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        )}
      />
    </div>
  );
}
