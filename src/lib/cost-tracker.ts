/**
 * Cost Tracker - Fetch actual generation costs from OpenRouter
 * 
 * OpenRouter provides two ways to get cost information:
 * 1. `usage` field in response body (normalized token counts, less accurate)
 * 2. `/api/v1/generation?id=` endpoint (actual native counts and USD cost)
 * 
 * This module uses method #2 for accuracy. After each generation, we:
 * 1. Get the generation ID from the response
 * 2. Call /api/v1/generation to get actual cost
 * 3. Store the cost for display and analytics
 * 
 * The ~100ms latency is acceptable and we show a brief animation during fetch.
 */

import { getModelById, CURATED_MODELS, type RegisteredModel } from './model-registry';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Actual cost data from OpenRouter generation stats API
 */
export interface GenerationCost {
    // OpenRouter's unique generation ID (e.g., "gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG")
    generationId: string;
    // Model used for this generation
    modelId: string;
    // Actual total cost in USD (this is what we're charged)
    totalCost: number;
    // Prompt tokens (input) - native count from model
    tokensPrompt: number;
    // Completion tokens (output) - native count
    tokensCompletion: number;
    // For image generation: tokens used for image output
    tokensCompletionImages: number;
    // Time taken for generation in milliseconds
    generationTimeMs: number;
    // Discount from prompt caching (if applicable)
    cacheDiscount?: number;
    // When we fetched this data
    fetchedAt: Date;
}

/**
 * Status of a cost fetch operation
 */
export type CostFetchStatus = 'pending' | 'fetching' | 'success' | 'error';

/**
 * Result from cost fetch with status
 */
export interface CostFetchResult {
    status: CostFetchStatus;
    cost?: GenerationCost;
    error?: string;
}

// =============================================================================
// COST FETCHING
// =============================================================================

/**
 * Fetch actual generation cost from OpenRouter's stats API
 * 
 * This should be called after a generation completes, using the ID
 * returned in the generation response.
 * 
 * @param generationId - The ID from the generation response (e.g., "gen-xxx")
 * @returns GenerationCost with actual usage and cost data
 * @throws Error if fetch fails or generation not found
 */
export async function fetchGenerationCost(generationId: string): Promise<GenerationCost> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log(`💰 Fetching cost for generation: ${generationId}`);

    const response = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(generationId)}`,
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch generation cost:', response.status, errorText);
        throw new Error(`Failed to fetch generation cost: ${response.status}`);
    }

    const result = await response.json();
    const gen = result.data;

    if (!gen) {
        throw new Error(`Generation not found: ${generationId}`);
    }

    const cost: GenerationCost = {
        generationId: gen.id,
        modelId: gen.model,
        totalCost: gen.total_cost ?? 0,
        tokensPrompt: gen.native_tokens_prompt ?? gen.tokens_prompt ?? 0,
        tokensCompletion: gen.native_tokens_completion ?? gen.tokens_completion ?? 0,
        tokensCompletionImages: gen.native_tokens_completion_images ?? 0,
        generationTimeMs: gen.generation_time ?? gen.latency ?? 0,
        cacheDiscount: gen.cache_discount,
        fetchedAt: new Date(),
    };

    console.log(`✅ Cost fetched: $${cost.totalCost.toFixed(4)} for ${cost.modelId}`);
    return cost;
}

/**
 * Fetch generation cost with retry logic
 * Sometimes the generation stats aren't immediately available
 * 
 * @param generationId - The generation ID to fetch
 * @param maxRetries - Maximum number of retry attempts (default 3)
 * @param retryDelayMs - Delay between retries in ms (default 200)
 * @returns CostFetchResult with status and data/error
 */
export async function fetchGenerationCostWithRetry(
    generationId: string,
    maxRetries: number = 3,
    retryDelayMs: number = 200
): Promise<CostFetchResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const cost = await fetchGenerationCost(generationId);
            return { status: 'success', cost };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (attempt < maxRetries) {
                console.log(`⏳ Retry ${attempt}/${maxRetries} in ${retryDelayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                // Increase delay for next retry (exponential backoff)
                retryDelayMs *= 1.5;
            } else {
                console.error('❌ All retries failed:', errorMessage);
                return { status: 'error', error: errorMessage };
            }
        }
    }

    return { status: 'error', error: 'Max retries exceeded' };
}

// =============================================================================
// COST ESTIMATION (Before Generation)
// =============================================================================

/**
 * Estimate cost before generation happens
 * Uses model registry pricing data
 * 
 * This gives users an idea of cost before they commit
 * The actual cost (from fetchGenerationCost) may differ slightly
 * 
 * @param modelId - Model to estimate for
 * @param promptTokens - Estimated input tokens (default 500 for typical prompt)
 * @param outputImages - Number of images to generate (default 1)
 * @param models - Model registry to use (defaults to CURATED_MODELS)
 * @returns Estimated cost in USD
 */
export function estimateGenerationCost(
    modelId: string,
    promptTokens: number = 500,
    outputImages: number = 1,
    models: RegisteredModel[] = CURATED_MODELS
): number {
    const model = getModelById(modelId, models);
    if (!model) {
        console.warn(`⚠️ Unknown model for cost estimation: ${modelId}`);
        return 0;
    }

    // Calculate token costs
    const inputCost = promptTokens * model.pricing.promptPerToken;

    // For most image models, there's a fixed per-image cost
    const imageCost = (model.pricing.perImage ?? 0) * outputImages;

    // Some models have a per-request fee
    const requestCost = model.pricing.perRequest ?? 0;

    return inputCost + imageCost + requestCost;
}

/**
 * Estimate batch generation cost
 * 
 * @param modelId - Model to use
 * @param assetCount - Number of assets to generate
 * @param avgPromptTokens - Average tokens per prompt (default 500)
 * @returns Estimated total cost in USD
 */
export function estimateBatchCost(
    modelId: string,
    assetCount: number,
    avgPromptTokens: number = 500
): number {
    return estimateGenerationCost(modelId, avgPromptTokens, 1) * assetCount;
}

// =============================================================================
// COST FORMATTING
// =============================================================================

/**
 * Format cost for display in UI
 * 
 * @param cost - Cost in USD
 * @param options - Formatting options
 * @returns Formatted string like "$0.0034" or "~$0.01 (est)"
 */
export function formatCostDisplay(
    cost: number,
    options: {
        isEstimate?: boolean;
        showLabel?: boolean;
        precision?: number;
    } = {}
): string {
    const { isEstimate = false, showLabel = false, precision } = options;

    // Determine precision based on cost magnitude
    const digits = precision ?? (cost < 0.1 ? 4 : 2);

    // Format the number
    const formatted = `$${cost.toFixed(digits)}`;

    // Add estimate prefix if needed
    const withPrefix = isEstimate ? `~${formatted}` : formatted;

    // Add label if requested
    if (showLabel) {
        return isEstimate ? `${withPrefix} (estimated)` : `${withPrefix} (actual)`;
    }

    return withPrefix;
}

/**
 * Compare estimated vs actual cost
 * Returns info about accuracy for analytics
 */
export function compareCosts(
    estimated: number,
    actual: number
): {
    difference: number;
    percentDiff: number;
    isHigher: boolean;
    accuracy: 'exact' | 'close' | 'off';
} {
    const difference = actual - estimated;
    const percentDiff = estimated > 0 ? (difference / estimated) * 100 : Infinity;
    const isHigher = actual > estimated;

    // Determine accuracy category
    let accuracy: 'exact' | 'close' | 'off';
    if (Math.abs(percentDiff) < 5) {
        accuracy = 'exact';
    } else if (Math.abs(percentDiff) <= 20) {
        accuracy = 'close';
    } else {
        accuracy = 'off';
    }

    return { difference, percentDiff, isHigher, accuracy };
}

// =============================================================================
// COST AGGREGATION
// =============================================================================

/**
 * Aggregate costs for a project/session
 */
export interface CostSummary {
    totalCost: number;
    generationCount: number;
    averageCostPerGeneration: number;
    totalTokensPrompt: number;
    totalTokensCompletion: number;
    totalGenerationTimeMs: number;
    modelBreakdown: Record<string, { count: number; cost: number }>;
}

/**
 * Calculate cost summary from array of generation costs
 */
export function summarizeCosts(costs: GenerationCost[]): CostSummary {
    const modelBreakdown: Record<string, { count: number; cost: number }> = {};

    let totalCost = 0;
    let totalTokensPrompt = 0;
    let totalTokensCompletion = 0;
    let totalGenerationTimeMs = 0;

    for (const cost of costs) {
        totalCost += cost.totalCost;
        totalTokensPrompt += cost.tokensPrompt;
        totalTokensCompletion += cost.tokensCompletion;
        totalGenerationTimeMs += cost.generationTimeMs;

        // Track per-model breakdown
        if (!modelBreakdown[cost.modelId]) {
            modelBreakdown[cost.modelId] = { count: 0, cost: 0 };
        }
        modelBreakdown[cost.modelId].count++;
        modelBreakdown[cost.modelId].cost += cost.totalCost;
    }

    return {
        totalCost,
        generationCount: costs.length,
        averageCostPerGeneration: costs.length > 0 ? totalCost / costs.length : 0,
        totalTokensPrompt,
        totalTokensCompletion,
        totalGenerationTimeMs,
        modelBreakdown,
    };
}
