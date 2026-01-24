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
        mime_type?: string;
        image_url?: {
            url: string;
        };
        image?: {
            url?: string;
            data?: string;
            b64_json?: string;
            mime_type?: string;
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
    // MIME type for the data (camelCase and snake_case variants)
    mimeType?: string;
    mime_type?: string;
    image_url?: {
        url?: string;
    };
    image?: {
        url?: string;
        data?: string;
        b64_json?: string;
        mime_type?: string;
    };
    // Gemini native format: inline_data (REST) or inlineData (SDK)
    inline_data?: {
        data: string;
        mime_type: string;
    };
    inlineData?: {
        data: string;
        mimeType: string;
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

    // Gemini native format: inline_data (REST API)
    if (part.inline_data?.data) {
        const mimeType = part.inline_data.mime_type || "image/png";
        return `data:${mimeType};base64,${part.inline_data.data}`;
    }

    // Gemini native format: inlineData (SDK/TypeScript)
    if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        return `data:${mimeType};base64,${part.inlineData.data}`;
    }

    if (part.data) {
        const rawData = part.data.trim();
        if (rawData.startsWith("data:image/")) {
            return rawData;
        }
        // Use mimeType or mime_type if available, otherwise default to png
        const mimeType = part.mimeType || part.mime_type || "image/png";
        return `data:${mimeType};base64,${rawData}`;
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
        const trimmed = content.trim();
        if (trimmed.startsWith("data:image/")) {
            return trimmed;
        }
        // Detect valid Base64 (length ≥ 1000 for realistic image data, only valid chars, ends with up to two '=')
        if (trimmed.length >= 1000 && /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
            return `data:image/png;base64,${trimmed}`;
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

    // Use provided API key (BYOK) if it was passed (even if empty string)
    // Only fall back to env var if apiKey is undefined
    let OPENROUTER_API_KEY = apiKey !== undefined ? apiKey : process.env.OPENROUTER_API_KEY;

    // Validate API key
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Defensive cleaning: trim whitespace and remove potential accidental quotes
    OPENROUTER_API_KEY = OPENROUTER_API_KEY.trim().replace(/^["']|["']$/g, '');

    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is empty after sanitization');
    }

    // Mask API key for logging
    const maskedKey = `${OPENROUTER_API_KEY.substring(0, 8)}...${OPENROUTER_API_KEY.substring(OPENROUTER_API_KEY.length - 4)}`;
    console.log('🎨 Using OpenRouter API key:', maskedKey, `(length: ${OPENROUTER_API_KEY.length})`);

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

    // Try to extract image URL from multiple possible formats
    let imageUrl = '';

    // ==========================================================================
    // FORMAT 1: Gemini native format - candidates[].content.parts[].inline_data
    // OpenRouter may pass through Gemini's native response structure
    // ==========================================================================
    const candidates = responseData.candidates as Array<{
        content?: {
            parts?: Array<OpenRouterContentPart>;
        };
    }> | undefined;

    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
        console.log('📦 Found Gemini candidates format');
        const parts = candidates[0]?.content?.parts;
        if (parts && Array.isArray(parts)) {
            for (const part of parts) {
                imageUrl = getImageUrlFromPart(part);
                if (imageUrl) {
                    console.log('✅ Extracted image from Gemini candidates.parts');
                    break;
                }
            }
        }
    }

    // ==========================================================================
    // FORMAT 2: OpenAI/OpenRouter normalized format - choices[].message
    // ==========================================================================
    const message = responseData.choices?.[0]?.message as OpenRouterImageMessage | undefined;

    if (!imageUrl && message) {
        // Try message.images array (Flux/OpenAI style)
        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
            const firstImage = message.images[0];
            console.log('📦 Image object keys:', Object.keys(firstImage));

            // Handle various possible response formats
            if (firstImage.image_url?.url) {
                imageUrl = firstImage.image_url.url;
            } else if (firstImage.url) {
                imageUrl = firstImage.url;
            } else if (firstImage.data) {
                imageUrl = `data:image/png;base64,${firstImage.data}`;
            } else if (firstImage.b64_json) {
                imageUrl = `data:image/png;base64,${firstImage.b64_json}`;
            } else if (firstImage.image) {
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

        // Try message.content (may contain image as data URL or array of parts)
        if (!imageUrl) {
            imageUrl = extractImageUrlFromContent(message.content);
        }

        // Try message.annotations
        if (!imageUrl && message.annotations && Array.isArray(message.annotations)) {
            for (const part of message.annotations) {
                imageUrl = getImageUrlFromPart(part);
                if (imageUrl) {
                    break;
                }
            }
        }
    }

    // ==========================================================================
    // VALIDATION: Ensure we got an image from one of the formats
    // ==========================================================================
    if (!imageUrl) {
        // Build detailed debug info for error message
        const debugInfo = {
            hasCandidates: !!candidates,
            candidatesLength: candidates?.length || 0,
            hasMessage: !!message,
            messageKeys: message ? Object.keys(message) : [],
            hasImages: !!message?.images,
            imagesLength: message?.images?.length || 0,
            contentType: message ? typeof message.content : 'N/A',
            contentPreview: message
                ? (typeof message.content === 'string'
                    ? message.content.substring(0, 200)
                    : Array.isArray(message.content)
                        ? `array[${message.content.length}]`
                        : 'object')
                : 'N/A',
            hasAnnotations: !!message?.annotations,
            topLevelKeys: Object.keys(responseData),
        };
        console.error('❌ No image in response:', debugInfo);
        throw new Error(`No image data in OpenRouter response: ${JSON.stringify(debugInfo)}`);
    }

    console.log('✅ Image generated:', {
        durationMs,
        imageUrlLength: imageUrl.length,
    });

    // Convert to buffer for database storage
    const base64Data = imageUrl.replace(/^data:image\/[^;]+;base64,/, '');
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
