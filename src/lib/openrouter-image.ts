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
    // Optional user-provided API key (BYOK - Bring Your Own Key)
    // If provided, uses this instead of the default env key
    apiKey?: string;
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
    // OpenRouter generation ID for cost tracking via /api/v1/generation endpoint
    generationId: string;
    // The model ID that was used for this generation
    modelId: string;
}

/**
 * OpenRouter message structure for image responses
 */
interface OpenRouterImageMessage {
    role: string;
    content: string | OpenRouterContentPart[] | OpenRouterContentPart;
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
    annotations?: OpenRouterContentPart[];
}

interface OpenRouterContentPart {
    type?: string;
    text?: string;
    url?: string;
    data?: string;
    b64_json?: string;
    image_url?: {
        url?: string;
    };
    image?: {
        url?: string;
        data?: string;
        b64_json?: string;
        mime_type?: string;
    };
}

const getImageUrlFromPart = (part: OpenRouterContentPart): string => {
    if (part.image_url?.url) {
        return part.image_url.url;
    }

    if (part.image?.url) {
        return part.image.url;
    }

    if (part.url) {
        return part.url;
    }

    if (part.image?.data) {
        // Check if data already has a prefix
        if (part.image.data.startsWith("data:image/")) {
            return part.image.data;
        }
        // Use mime_type if available, otherwise default to png
        const mimeType = part.image.mime_type || "image/png";
        return `data:${mimeType};base64,${part.image.data}`;
    }

    if (part.data) {
        return `data:image/png;base64,${part.data}`;
    }

    if (part.image?.b64_json) {
        const mimeType = part.image.mime_type || "image/png";
        return `data:${mimeType};base64,${part.image.b64_json}`;
    }

    if (part.b64_json) {
        return `data:image/png;base64,${part.b64_json}`;
    }

    return "";
};

const extractImageUrlFromContent = (
    content: OpenRouterImageMessage["content"]
): string => {
    if (Array.isArray(content)) {
        for (const part of content) {
            const imageUrl = getImageUrlFromPart(part);
            if (imageUrl) {
                return imageUrl;
            }
        }
        return "";
    }

    if (typeof content === "object" && content) {
        return getImageUrlFromPart(content);
    }

    if (typeof content === "string") {
        // Check if it's a data URL
        if (content.startsWith("data:image/")) {
            return content;
        }
        
        // Check if it's a raw base64 string (common with Gemini models)
        // Base64 strings are typically long and contain only base64 characters
        if (content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(content)) {
            return `data:image/png;base64,${content}`;
        }
    }

    return "";
};

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
    const { modelId, prompt, referenceImageBase64, apiKey } = options;
    const startTime = Date.now();

    // Use provided API key (BYOK) or fall back to environment variable
    const OPENROUTER_API_KEY = apiKey || process.env.OPENROUTER_API_KEY;

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
            // Use mime_type if available, otherwise default to png
            const mimeType = firstImage.mime_type || "image/png";
            imageUrl = `data:${mimeType};base64,${firstImage.data}`;
        } else if (firstImage.b64_json) {
            // Format: { b64_json: "base64..." }
            const mimeType = firstImage.mime_type || "image/png";
            imageUrl = `data:${mimeType};base64,${firstImage.b64_json}`;
        } else if (firstImage.image) {
            // Format: { image: { url: "data:..." } } or { image: { data: "base64..." } }
            if (firstImage.image.url) {
                imageUrl = firstImage.image.url;
            } else if (firstImage.image.data) {
                const mimeType = firstImage.image.mime_type || "image/png";
                imageUrl = `data:${mimeType};base64,${firstImage.image.data}`;
            } else if (firstImage.image.b64_json) {
                const mimeType = firstImage.image.mime_type || "image/png";
                imageUrl = `data:${mimeType};base64,${firstImage.image.b64_json}`;
            }
        }
    }

    if (!imageUrl) {
        imageUrl = extractImageUrlFromContent(message.content);
    }

    if (!imageUrl && message.annotations && Array.isArray(message.annotations)) {
        for (const part of message.annotations) {
            imageUrl = getImageUrlFromPart(part);
            if (imageUrl) {
                break;
            }
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
        // Return generation ID for cost tracking
        generationId: responseData.id || '',
        modelId,
    };
}
