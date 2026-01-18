export interface Project {
    id: string;
    name: string;
    phase: string;
    userId?: string | null;
}

export interface ProjectResponse {
    success: boolean;
    project?: Project;
    projects?: Project[];
    error?: string;
}

export interface ChatResponse {
    success?: boolean;
    error?: string;
    message?: string;
}

export interface GenerateResponse {
    success: boolean;
    asset?: {
        id: string;
        imageUrl: string;
        prompt: string;
        metadata: Record<string, unknown>;
    };
    error?: string;
}

export interface AssetResponse {
    id: string;
    imageUrl: string;
    prompt: string;
    metadata: Record<string, unknown>;
    error?: string;
}

export interface AnalyzeStyleResponse {
    success: boolean;
    analysis: {
        style_keywords: string;
        lighting_keywords: string;
        color_notes: string;
        ai_suggested: boolean;
    };
    error?: string;
}

export interface GenerateStyleResponse {
    success: boolean;
    styleAnchor: { id: string };
    error?: string;
}

export interface MemoryFileResponse {
    success: boolean;
    files?: Record<string, unknown>[];
    file?: Record<string, unknown>;
    error?: string;
}

// =============================================================================
// HATCH STUDIOS TEST TYPES
// =============================================================================

export interface Game {
    id: string;
    name: string;
    userId: string;
    description?: string | null;
    activeSceneId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    scenes?: GameScene[];
}

export interface GameScene {
    id: string;
    gameId: string;
    name: string;
    orderIndex: number;
    code: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GameResponse {
    success: boolean;
    game?: Game;
    error?: string;
}

export interface GameListResponse {
    success: boolean;
    games?: Game[];
    error?: string;
}

export interface SceneResponse {
    success: boolean;
    scene?: GameScene;
    error?: string;
}

export interface SceneListResponse {
    success: boolean;
    scenes?: GameScene[];
    error?: string;
}
