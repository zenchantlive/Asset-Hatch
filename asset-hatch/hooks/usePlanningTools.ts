import { useCopilotAction } from "@copilotkit/react-core";
import { ProjectQualities } from "@/components/planning/QualitiesBar";

export function usePlanningTools(
  qualities: ProjectQualities,
  onQualitiesChange: (q: ProjectQualities) => void,
  onPlanUpdate: (markdown: string) => void,
  onPlanComplete: () => void
) {
  // Tool 1: Update a single quality parameter
  useCopilotAction({
    name: "updateQuality",
    description: "Update a specific quality parameter for the game asset project. Valid keys: art_style, base_resolution, perspective, game_genre, theme, mood, color_palette",
    parameters: [
      {
        name: "qualityKey",
        type: "string",
        description: "The quality parameter to update (art_style, base_resolution, perspective, game_genre, theme, mood, color_palette)",
        required: true,
      },
      {
        name: "value",
        type: "string",
        description: "The new value for this quality parameter",
        required: true,
      },
    ],
    handler: async ({ qualityKey, value }) => {
      onQualitiesChange({
        ...qualities,
        [qualityKey]: value,
      });
      return `Updated ${qualityKey} to "${value}"`;
    },
  });

  // Tool 2: Create or update the complete asset plan
  useCopilotAction({
    name: "updatePlan",
    description: "Create or update the complete asset plan with structured markdown. Include sections for Characters, Environments, Items & Props, and UI Elements.",
    parameters: [
      {
        name: "planMarkdown",
        type: "string",
        description: "Complete asset plan in markdown format with detailed sections",
        required: true,
      },
    ],
    handler: async ({ planMarkdown }) => {
      onPlanUpdate(planMarkdown);
      return "Asset plan updated successfully";
    },
  });

  // Tool 3: Mark planning phase as complete
  useCopilotAction({
    name: "finalizePlan",
    description: "Mark the planning phase as complete when the user approves the plan. This will save the plan and transition to the style anchor phase.",
    parameters: [],
    handler: async () => {
      onPlanComplete();
      return "Planning phase finalized. Ready to move to style anchor phase.";
    },
  });
}
