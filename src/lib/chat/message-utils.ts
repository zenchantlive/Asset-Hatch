export interface ExtractedMessageParts {
  textContent: string;
  toolLabels: string[];
  hasTextContent: boolean;
  hasToolCalls: boolean;
  createdAt: Date | null;
}





// Helper to safely extract string values from unknown types
const safeToString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

/**
 * Extract message parts from a message.
 * 
 * In @ai-sdk/react v6, the UIMessage type structure changed significantly.
 * This function handles both old and new message formats defensively.
 * Uses type assertion since the SDK's UIMessage type doesn't expose all properties.
 */
export const extractMessageParts = (message: unknown): ExtractedMessageParts => {
  // Initialize empty result
  let textContent = "";
  const toolLabels: string[] = [];

  // Safely access parts property
  const msg = message as { parts?: Array<Record<string, unknown>> } | null | undefined;
  const parts = msg?.parts;

  if (parts && Array.isArray(parts)) {
    for (const part of parts) {
      const type = safeToString(part.type);

      if (type === "text" || type === "reasoning") {
        textContent += safeToString(part.text);
      } else if (type === "tool-call" || type.startsWith("tool-")) {
        const toolName = safeToString(part.toolName);
        if (toolName) {
          toolLabels.push(toolName);
        } else if (type.startsWith("tool-")) {
          toolLabels.push(type.replace("tool-", ""));
        } else {
          toolLabels.push("tool");
        }
      }
    }
  }

  // createdAt is not part of UIMessage in SDK v6, always null
  const createdAt = null;

  return {
    textContent: textContent.trim(),
    toolLabels,
    hasTextContent: textContent.trim().length > 0,
    hasToolCalls: toolLabels.length > 0,
    createdAt,
  };
};

export const formatMessageTimestamp = (timestamp: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
