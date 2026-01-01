/**
 * Model Registry - Central source of truth for AI models
 * 
 * This module provides:
 * - Curated allowlist of tested/supported models
 * - Auto-discovery from OpenRouter API with capability filtering
 * - Pricing information for cost estimation
 * - Model capability queries (input/output modalities)
 * 
 * Usage:
 * - Add new models to CURATED_MODELS array
 * - Use getImageGenerationModels() to get models that output images
 * - Use getMultimodalModels() to get text+image input, image output models
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Supported AI providers
 * - openrouter: Primary provider, aggregates multiple model providers
 * - huggingface: Future support (Phase 5)
 */
export type ModelProvider = 'openrouter' | 'huggingface';

/**
 * Model input/output capabilities
 * Used to filter models by what they can accept and produce
 */
export interface ModelCapabilities {
    // What the model can accept as input
    inputModalities: ('text' | 'image' | 'file' | 'audio')[];
    // What the model can produce as output
    outputModalities: ('text' | 'image')[];
}

/**
 * Pricing information for cost estimation
 * All values are in USD
 */
export interface ModelPricing {
    // Cost per input token (e.g., 0.00125 = $0.00125 per token)
    promptPerToken: number;
    // Cost per output token
    completionPerToken: number;
    // Fixed cost per output image (for image generation models)
    perImage?: number;
    // Fixed cost per API request (rare, but some models charge this)
    perRequest?: number;
}

/**
 * Category of model usage
 * - chat: Text conversation/planning (e.g., Gemini Pro)
 * - image-gen: Text-to-image only (e.g., Flux)
 * - multimodal: Text+image input, image output (e.g., Gemini Image)
 */
export type ModelCategory = 'chat' | 'image-gen' | 'multimodal';

/**
 * Complete model registration entry
 * Contains all metadata needed to use and display a model
 */
export interface RegisteredModel {
    // OpenRouter model ID (e.g., "google/gemini-2.5-flash-image")
    id: string;
    // Human-readable name for UI display
    displayName: string;
    // Which provider serves this model
    provider: ModelProvider;
    // What the model can do
    capabilities: ModelCapabilities;
    // Cost information for estimation
    pricing: ModelPricing;
    // Primary use case category
    category: ModelCategory;
    // If true, this is the default model for its category
    isDefault?: boolean;
    // If true, model is deprecated and should show warning
    deprecated?: boolean;
    // Optional description for UI tooltips
    description?: string;
    // Source: 'curated' (manually added) or 'discovered' (from API)
    source: 'curated' | 'discovered';
}

// =============================================================================
// CURATED MODEL LIST
// =============================================================================

/**
 * Manually curated list of tested and supported models
 * 
 * To add a new model:
 * 1. Add an entry to this array
 * 2. No code changes needed in components!
 * 3. Model will appear in relevant dropdowns automatically
 */
export const CURATED_MODELS: RegisteredModel[] = [
    // =========================================================================
    // MULTIMODAL MODELS (text+image input → image output)
    // These are the preferred models for asset generation
    // =========================================================================
    {
        id: 'google/gemini-2.5-flash-image',
        displayName: 'Gemini 2.5 Flash Image',
        provider: 'openrouter',
        capabilities: {
            inputModalities: ['text', 'image'],
            outputModalities: ['text', 'image'],
        },
        pricing: {
            promptPerToken: 0.0001,
            completionPerToken: 0.0004,
            perImage: 0.02,
        },
        category: 'multimodal',
        isDefault: true,
        description: 'Fast multimodal model, good balance of speed and quality',
        source: 'curated',
    },
    {
        id: 'google/gemini-3-pro-image-preview',
        displayName: 'Gemini 3 Pro Image (Preview)',
        provider: 'openrouter',
        capabilities: {
            inputModalities: ['text', 'image'],
            outputModalities: ['text', 'image'],
        },
        pricing: {
            promptPerToken: 0.00125,
            completionPerToken: 0.005,
            perImage: 0.04,
        },
        category: 'multimodal',
        description: 'High quality multimodal, more expensive but better results',
        source: 'curated',
    },

    // =========================================================================
    // IMAGE GENERATION MODELS (text input → image output only)
    // Flux models for dedicated image generation
    // =========================================================================
    {
        id: 'black-forest-labs/flux.2-pro',
        displayName: 'Flux 2 Pro',
        provider: 'openrouter',
        capabilities: {
            inputModalities: ['text'],
            outputModalities: ['image'],
        },
        pricing: {
            promptPerToken: 0,
            completionPerToken: 0,
            perImage: 0.055,
        },
        category: 'image-gen',
        description: 'High quality image generation, best for detailed assets',
        source: 'curated',
    },

    // =========================================================================
    // CHAT MODELS (text/image input → text output)
    // Used for planning phase conversations
    // =========================================================================
    {
        id: 'google/gemini-3-pro-preview',
        displayName: 'Gemini 3 Pro (Chat)',
        provider: 'openrouter',
        capabilities: {
            inputModalities: ['text', 'image'],
            outputModalities: ['text'],
        },
        pricing: {
            promptPerToken: 0.00125,
            completionPerToken: 0.005,
        },
        category: 'chat',
        isDefault: true,
        description: 'Powerful chat model for planning and conversation',
        source: 'curated',
    },
];

// =============================================================================
// AUTO-DISCOVERY FROM OPENROUTER API
// =============================================================================

/**
 * OpenRouter API model response structure
 * Based on: https://openrouter.ai/docs/api-reference/models
 */
interface OpenRouterModelResponse {
    data: Array<{
        id: string;
        name: string;
        description?: string;
        created: number;
        architecture: {
            input_modalities: string[];
            output_modalities: string[];
            tokenizer: string;
            instruct_type: string | null;
        };
        pricing: {
            prompt: string;
            completion: string;
            request?: string;
            image?: string;
        };
        context_length: number;
    }>;
}

/**
 * Cache for discovered models to avoid repeated API calls
 */
interface ModelCache {
    models: RegisteredModel[];
    fetchedAt: Date;
    ttlMs: number;
}

// In-memory cache for discovered models
let modelCache: ModelCache | null = null;

// Default cache TTL: 1 hour
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetch available models from OpenRouter API
 * Filters by capabilities and merges with curated list
 * 
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Array of RegisteredModel entries
 */
export async function discoverModels(forceRefresh = false): Promise<RegisteredModel[]> {
    // Check cache first
    if (!forceRefresh && modelCache) {
        const cacheAge = Date.now() - modelCache.fetchedAt.getTime();
        if (cacheAge < modelCache.ttlMs) {
            console.log('📦 Using cached model list');
            return modelCache.models;
        }
    }

    console.log('🔍 Discovering models from OpenRouter API...');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('❌ Failed to fetch models:', response.status);
            // Fall back to curated list on error
            return CURATED_MODELS;
        }

        const data: OpenRouterModelResponse = await response.json();

        // Convert to RegisteredModel format and filter by capabilities
        const discoveredModels: RegisteredModel[] = data.data
            .filter(model => {
                // Must support image output for our use case
                const hasImageOutput = model.architecture.output_modalities.includes('image');
                return hasImageOutput;
            })
            .map(model => ({
                id: model.id,
                displayName: model.name,
                provider: 'openrouter' as ModelProvider,
                capabilities: {
                    inputModalities: model.architecture.input_modalities as ('text' | 'image' | 'file' | 'audio')[],
                    outputModalities: model.architecture.output_modalities as ('text' | 'image')[],
                },
                pricing: {
                    promptPerToken: parseFloat(model.pricing.prompt) || 0,
                    completionPerToken: parseFloat(model.pricing.completion) || 0,
                    perImage: parseFloat(model.pricing.image || '0') || undefined,
                    perRequest: parseFloat(model.pricing.request || '0') || undefined,
                },
                category: determineCategory(model.architecture),
                description: model.description,
                source: 'discovered' as const,
            }));

        // Merge curated and discovered, preferring curated entries
        const curatedIds = new Set(CURATED_MODELS.map(m => m.id));
        const newDiscovered = discoveredModels.filter(m => !curatedIds.has(m.id));

        const allModels = [...CURATED_MODELS, ...newDiscovered];

        // Update cache
        modelCache = {
            models: allModels,
            fetchedAt: new Date(),
            ttlMs: DEFAULT_CACHE_TTL_MS,
        };

        console.log(`✅ Discovered ${newDiscovered.length} new models, total: ${allModels.length}`);
        return allModels;

    } catch (error) {
        console.error('❌ Error discovering models:', error);
        // Fall back to curated list on error
        return CURATED_MODELS;
    }
}

/**
 * Determine model category based on architecture
 */
function determineCategory(architecture: { input_modalities: string[]; output_modalities: string[] }): ModelCategory {
    const hasImageInput = architecture.input_modalities.includes('image');
    const hasTextInput = architecture.input_modalities.includes('text');
    const hasImageOutput = architecture.output_modalities.includes('image');
    const hasTextOutput = architecture.output_modalities.includes('text');

    // Multimodal: text+image in, image out
    if (hasTextInput && hasImageInput && hasImageOutput) {
        return 'multimodal';
    }

    // Image generation: text in, image out only
    if (hasTextInput && hasImageOutput && !hasTextOutput) {
        return 'image-gen';
    }

    // Chat: text/image in, text out
    return 'chat';
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all models that can output images
 * Includes both multimodal and dedicated image-gen models
 */
export function getImageGenerationModels(models: RegisteredModel[] = CURATED_MODELS): RegisteredModel[] {
    return models.filter(m =>
        m.capabilities.outputModalities.includes('image') &&
        !m.deprecated
    );
}

/**
 * Get models that support text+image input AND image output
 * Best for style-consistent generation with reference images
 */
export function getMultimodalModels(models: RegisteredModel[] = CURATED_MODELS): RegisteredModel[] {
    return models.filter(m =>
        m.capabilities.inputModalities.includes('text') &&
        m.capabilities.inputModalities.includes('image') &&
        m.capabilities.outputModalities.includes('image') &&
        !m.deprecated
    );
}

/**
 * Get models for chat/planning phase
 * Text output required, image input optional
 */
export function getChatModels(models: RegisteredModel[] = CURATED_MODELS): RegisteredModel[] {
    return models.filter(m =>
        m.category === 'chat' &&
        !m.deprecated
    );
}

/**
 * Find a specific model by its ID
 * Returns undefined if not found
 */
export function getModelById(
    id: string,
    models: RegisteredModel[] = CURATED_MODELS
): RegisteredModel | undefined {
    return models.find(m => m.id === id);
}

/**
 * Get the default model for a given category
 * Throws if no default is set (should never happen with curated list)
 */
export function getDefaultModel(
    category: ModelCategory,
    models: RegisteredModel[] = CURATED_MODELS
): RegisteredModel {
    const defaultModel = models.find(m => m.category === category && m.isDefault);

    if (!defaultModel) {
        // Fall back to first model of that category
        const fallback = models.find(m => m.category === category && !m.deprecated);
        if (fallback) {
            console.warn(`⚠️ No default model for ${category}, using ${fallback.id}`);
            return fallback;
        }
        throw new Error(`No model available for category: ${category}`);
    }

    return defaultModel;
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupports(
    modelId: string,
    input: ('text' | 'image' | 'file' | 'audio')[],
    output: ('text' | 'image')[],
    models: RegisteredModel[] = CURATED_MODELS
): boolean {
    const model = getModelById(modelId, models);
    if (!model) return false;

    const hasInputs = input.every(i => model.capabilities.inputModalities.includes(i));
    const hasOutputs = output.every(o => model.capabilities.outputModalities.includes(o));

    return hasInputs && hasOutputs;
}

// =============================================================================
// COST ESTIMATION
// =============================================================================

/**
 * Estimate cost for a generation before it happens
 * Based on model pricing from registry
 * 
 * @param modelId - Model to estimate for
 * @param promptTokens - Estimated input tokens
 * @param outputImages - Number of images to generate (default 1)
 * @returns Estimated cost in USD
 */
export function estimateCost(
    modelId: string,
    promptTokens: number = 500,
    outputImages: number = 1,
    models: RegisteredModel[] = CURATED_MODELS
): number {
    const model = getModelById(modelId, models);
    if (!model) return 0;

    // Token costs
    const tokenCost = promptTokens * model.pricing.promptPerToken;

    // Image costs (if applicable)
    const imageCost = (model.pricing.perImage ?? 0) * outputImages;

    // Request cost (if applicable)
    const requestCost = model.pricing.perRequest ?? 0;

    return tokenCost + imageCost + requestCost;
}

/**
 * Format cost for display in UI
 * Returns string like "$0.0034" or "~$0.01"
 */
export function formatCost(cost: number, isEstimate = false): string {
    const prefix = isEstimate ? '~' : '';

    if (cost < 0.01) {
        return `${prefix}$${cost.toFixed(4)}`;
    }
    return `${prefix}$${cost.toFixed(2)}`;
}
