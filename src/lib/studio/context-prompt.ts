/**
 * Context Prompt Formatter
 *
 * Formats UnifiedProjectContext for inclusion in the Babylon.js system prompt.
 * This provides the AI with awareness of the game concept, characters, and
 * environments when generating game code.
 *
 * Phase 7b: Rich Metadata & Shared Context
 */

import type { UnifiedProjectContext } from "@/lib/types/shared-context";

/**
 * Format project context for inclusion in the system prompt
 *
 * Generates a markdown-formatted string that summarizes the project's
 * game concept, characters, environments, and other relevant context.
 * Returns a minimal fallback if no context is available.
 *
 * @param context - The unified project context
 * @returns Formatted string for system prompt insertion
 */
export function formatContextForPrompt(
  context: UnifiedProjectContext | undefined
): string {
  // Handle missing or empty context
  if (!context) {
    return "\nNo project context available yet.";
  }

  // Check if context has any meaningful content
  const hasContent =
    context.gameConcept ||
    context.characters.length > 0 ||
    context.environments.length > 0 ||
    context.keyFeatures.length > 0;

  if (!hasContent) {
    return "\nNo project context available yet.";
  }

  // Build formatted context sections
  const sections: string[] = [];

  // Game concept section
  if (context.gameConcept) {
    sections.push(`## Game Concept\n${context.gameConcept}`);
  }

  // Target audience
  if (context.targetAudience) {
    sections.push(`## Target Audience\n${context.targetAudience}`);
  }

  // Key features
  if (context.keyFeatures && context.keyFeatures.length > 0) {
    sections.push(
      `## Key Features\n${context.keyFeatures.map((f) => `- ${f}`).join("\n")}`
    );
  }

  // Characters with animations
  if (context.characters && context.characters.length > 0) {
    const characterList = context.characters
      .map((c) => {
        const animations =
          c.animations.length > 0
            ? ` (animations: ${c.animations.join(", ")})`
            : "";
        return `- **${c.name}**: ${c.description || "No description"}${animations}`;
      })
      .join("\n");
    sections.push(`## Characters\n${characterList}`);
  }

  // Environments
  if (context.environments && context.environments.length > 0) {
    const envList = context.environments
      .map((e) => `- **${e.name}** (${e.type})`)
      .join("\n");
    sections.push(`## Environments\n${envList}`);
  }

  // Scenes
  if (context.scenes && context.scenes.length > 0) {
    const sceneList = context.scenes
      .map((s) => `- **${s.name}**: ${s.description}`)
      .join("\n");
    sections.push(`## Scenes\n${sceneList}`);
  }

  // Combine all sections
  return `\n# PROJECT CONTEXT\n\n${sections.join("\n\n")}`;
}

/**
 * Create a brief context summary for logging/debugging
 *
 * @param context - The unified project context
 * @returns Brief summary string
 */
export function summarizeContext(
  context: UnifiedProjectContext | undefined
): string {
  if (!context) {
    return "No context";
  }

  const parts: string[] = [];

  if (context.gameConcept) {
    // Truncate long concepts
    const concept =
      context.gameConcept.length > 50
        ? context.gameConcept.substring(0, 47) + "..."
        : context.gameConcept;
    parts.push(`concept: "${concept}"`);
  }

  if (context.characters.length > 0) {
    parts.push(`${context.characters.length} characters`);
  }

  if (context.environments.length > 0) {
    parts.push(`${context.environments.length} environments`);
  }

  if (context.scenes.length > 0) {
    parts.push(`${context.scenes.length} scenes`);
  }

  return parts.length > 0 ? parts.join(", ") : "Empty context";
}
