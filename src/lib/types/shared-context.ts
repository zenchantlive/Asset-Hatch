/**
 * Shared Context Types
 *
 * Types for the shared project context document (Phase 6B)
 * Bridges Asset Hatch projects with Hatch Studios games.
 * Stored as project-context.json in MemoryFile.
 */

/**
 * Shared project context document
 * Persists between Assets and Game tabs for unified experience
 */
export interface UnifiedProjectContext {
  /** Project ID this context belongs to */
  projectId: string;
  /** Linked game ID (populated when game is created) */
  gameId?: string;

  // =============================================================================
  // PLANNING (written during asset planning OR game planning)
  // =============================================================================

  /** Game concept and vision - describes what the game is about */
  gameConcept: string;
  /** Target audience for the game */
  targetAudience: string;
  /** Key features of the game */
  keyFeatures: string[];

  // =============================================================================
  // ASSETS (populated from asset generation)
  // =============================================================================

  /** Characters with their descriptions and linked assets */
  characters: Array<{
    /** Character name */
    name: string;
    /** Character description */
    description: string;
    /** Available animations for this character */
    animations: string[];
    /** Reference to GeneratedAsset/Generated3DAsset */
    assetId?: string;
  }>;
  /** Environments/levels with their descriptions and linked assets */
  environments: Array<{
    /** Environment name */
    name: string;
    /** Environment type */
    type: "interior" | "exterior" | "skybox";
    /** Reference to GeneratedAsset/Generated3DAsset */
    assetId?: string;
  }>;

  // =============================================================================
  // GAME (populated from game development)
  // =============================================================================

  /** Scenes/sections in the game */
  scenes: Array<{
    /** Scene name */
    name: string;
    /** Scene description */
    description: string;
  }>;

  // =============================================================================
  // SYNC METADATA
  // =============================================================================

  /** Which tab last updated the context */
  lastUpdatedBy: "assets" | "game";
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * GET context response
 */
export interface GetContextResponse {
  success: boolean;
  context?: UnifiedProjectContext;
  error?: string;
}

/**
 * Update context input
 */
export interface UpdateContextInput {
  context: Partial<UnifiedProjectContext>;
}

/**
 * Update context response
 */
export interface UpdateContextResponse {
  success: boolean;
  message: string;
}
