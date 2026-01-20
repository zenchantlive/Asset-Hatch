import type { UIMessage } from "@ai-sdk/react";

export interface ExtractedMessageParts {
  textContent: string;
  toolLabels: string[];
  hasTextContent: boolean;
  hasToolCalls: boolean;
  createdAt: Date;
}

type MessagePart = NonNullable<UIMessage["parts"]>[number];

const REDACTED_PATTERN = /\[REDACTED\]/g;

const isTextPart = (part: MessagePart): boolean =>
  part.type === "text" || part.type === "reasoning";

const isToolPart = (part: MessagePart): boolean =>
  part.type === "tool-call" || part.type.startsWith("tool-");

const getToolLabel = (part: MessagePart): string => {
  if (part.type === "tool-call") {
    if (part.toolName) {
      return part.toolName;
    }
    return "tool";
  }

  if (part.toolName) {
    return part.toolName;
  }

  if (part.type.startsWith("tool-")) {
    return part.type.replace("tool-", "");
  }

  return "tool";
};

const normalizeCreatedAt = (createdAt?: UIMessage["createdAt"]): Date => {
  if (!createdAt) {
    return new Date();
  }

  if (createdAt instanceof Date) {
    return createdAt;
  }

  if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

export const extractMessageParts = (message: UIMessage): ExtractedMessageParts => {
  const parts = message.parts ?? [];

  const textContent = parts
    .filter(isTextPart)
    .map((part) => part.text ?? "")
    .join("")
    .replace(REDACTED_PATTERN, "")
    .trim();

  const toolLabels: string[] = [];
  parts.filter(isToolPart).forEach((part) => {
    toolLabels.push(getToolLabel(part));
  });

  return {
    textContent,
    toolLabels,
    hasTextContent: textContent.length > 0,
    hasToolCalls: toolLabels.length > 0,
    createdAt: normalizeCreatedAt(message.createdAt),
  };
};

export const formatMessageTimestamp = (timestamp: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
