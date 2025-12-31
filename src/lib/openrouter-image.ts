/**
 * OpenRouter Flux Image Generation Utility
 * 
 * Shared utility for generating images via OpenRouter's Flux models.
 * Used by both /api/generate-style (style anchor) and /api/generate (asset generation).
 * 
 * Key learnings applied from debugging:
 * - Use /api/v1/chat/completions (NOT /api/v1/images/generations - deprecated)
 * - Include modalities: ['image', 'text'] for image generation
 * - Image data is in message.images[].image_url.url (NOT message.content)
 * - Model IDs: 'black-forest-labs/flux.2-pro' or 'black-forest-labs/flux.2-pro'
 */

// OpenRouter API key from environment
// Moved inside function for testability

/**
 * Options for Flux image generation
 */
export interface FluxGenerationOptions {
    // The OpenRouter model ID (e.g., 'black-forest-labs/flux.2-pro')
    modelId: string;
    // The prompt for image generation
    prompt: string;
    // Optional reference image for style consistency (base64 data URL)
    referenceImageBase64?: string;
    // Optional size specification
    width?: number;
    height?: number;
}

/**
 * Result from Flux image generation
 */
export interface FluxGenerationResult {
    // Full data URL (data:image/png;base64,...)
    imageUrl: string;
    // Raw buffer for database storage
    imageBuffer: Buffer;
    // Seed used for generation (if available)
    seed?: number;
    // Duration in milliseconds
    durationMs: number;
}

/**
 * OpenRouter message structure for image responses
 */
interface OpenRouterImageMessage {
    role: string;
    content: string;
    images?: Array<{
        index?: number;
        type?: string;
        url?: string;
        data?: string;
        b64_json?: string;
        image_url?: {
            url: string;
        };
    }>;
}

/**
 * Generate an image using OpenRouter's Flux models
 * 
 * This function handles:
 * - Correct API endpoint (chat/completions with modalities)
 * - Reference image formatting for style consistency
 * - Response parsing from message.images array
 * - Buffer conversion for database storage
 * 
 * @param options - Generation options including model, prompt, and optional reference image
 * @returns Promise resolving to the generated image result
 * @throws Error if generation fails or no image in response
 */
export async function generateFluxImage(
    options: FluxGenerationOptions
): Promise<FluxGenerationResult> {
    const { modelId, prompt, referenceImageBase64 } = options;
    const startTime = Date.now();
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    // Validate API key
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Build messages array with the prompt
    const messages: Array<{ role: string; content: string }> = [
        { role: 'user', content: prompt }
    ];

    // Build request body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: Record<string, any> = {
        model: modelId,
        messages,
        // CRITICAL: Must include modalities for image generation
        modalities: ['image', 'text'],
    };

    // Add reference image if provided (for style consistency)
    if (referenceImageBase64) {
        // Strip data URL prefix if present to get raw base64
        const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '');
        requestBody.images = [{
            type: 'base64',
            media_type: 'image/png',
            data: base64Data,
        }];
    }

    console.log('🎨 Calling OpenRouter Flux:', {
        model: modelId,
        promptLength: prompt.length,
        hasReference: !!referenceImageBase64,
    });

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://asset-hatch.app',
            'X-Title': 'Asset Hatch',
        },
        body: JSON.stringify(requestBody),
    });

    // Handle API errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenRouter API error:', response.status, errorData);
        throw new Error(`OpenRouter error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    const durationMs = Date.now() - startTime;

    // Log response structure for debugging
    console.log('📦 OpenRouter response keys:', Object.keys(responseData));

    // Extract message from response
    const message = responseData.choices?.[0]?.message as OpenRouterImageMessage | undefined;
    if (!message) {
        console.error('❌ No message in response:', responseData);
        throw new Error('No message in OpenRouter response');
    }

    // Extract image from message.images array
    // This is the correct format for OpenRouter Flux models
    let imageUrl = '';

    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images[0];
        console.log('📦 Image object keys:', Object.keys(firstImage));

        // Handle various possible response formats
        if (firstImage.image_url?.url) {
            // Format: { image_url: { url: "data:..." } }
            imageUrl = firstImage.image_url.url;
        } else if (firstImage.url) {
            // Format: { url: "data:..." }
            imageUrl = firstImage.url;
        } else if (firstImage.data) {
            // Format: { data: "base64..." }
            imageUrl = `data:image/png;base64,${firstImage.data}`;
        } else if (firstImage.b64_json) {
            // Format: { b64_json: "base64..." }
            imageUrl = `data:image/png;base64,${firstImage.b64_json}`;
        }
    }

    // Validate we got an image
    if (!imageUrl) {
        console.error('❌ No image in response. Message keys:', Object.keys(message));
        throw new Error('No image data in OpenRouter response');
    }

    console.log('✅ Image generated:', {
        durationMs,
        imageUrlLength: imageUrl.length,
    });

    // Convert to buffer for database storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Extract seed if available
    const seed = responseData.choices?.[0]?.seed as number | undefined;

    return {
        imageUrl,
        imageBuffer,
        seed,
        durationMs,
    };
}

/**
 * Correct Flux model IDs for OpenRouter
 * 
 * Note: These are the actual OpenRouter model IDs, not marketing names.
 * - black-forest-labs/flux.2-pro is faster and cheaper (good for testing)
 * - flux.2-pro is higher quality (good for production)
 */
export const OPENROUTER_FLUX_MODELS: Record<string, { modelId: string; costPerImage: number }> = {
    'flux-2-dev': {
        modelId: 'black-forest-labs/flux.2-pro',
        costPerImage: 0.025,
    },
    'flux-2-pro': {
        modelId: 'black-forest-labs/flux.2-pro',
        costPerImage: 0.055,
    },
};
