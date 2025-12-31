/**
 * AI-Assisted Style Anchor Extraction API Route
 *
 * Analyzes an uploaded reference image using a vision model to extract:
 * - Style keywords (e.g., "16-bit pixel art, SNES RPG style")
 * - Lighting keywords (e.g., "flat lighting, even illumination")
 * - Color palette suggestions (from image analysis)
 *
 * User can then edit these suggestions in the UI before saving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const VISION_MODEL = 'openai/gpt-4o'; // Vision-capable model via OpenRouter

const STYLE_ANALYSIS_PROMPT = `You are a game asset art style analyzer. Analyze this reference image and extract:

1. **Art Style Keywords**: Describe the visual style in 3-8 words. Focus on:
   - Era/console generation (8-bit, 16-bit, 32-bit, modern)
   - Art style type (pixel art, hand-drawn, low-poly, realistic)
   - Specific game/franchise influences if recognizable
   - Distinctive visual characteristics

2. **Lighting Keywords**: Describe the lighting in 2-5 words. Focus on:
   - Lighting complexity (flat, soft diffused, dramatic)
   - Shadow style (minimal shadows, soft shadows, hard shadows)
   - Light direction (top-down, even, directional)

3. **Color Characteristics**: Describe the color palette approach in 1-3 words:
   - Palette size (limited 8-color, 16-color, full color)
   - Color tone (vibrant, muted, pastel, dark, earthy)

Respond ONLY in this exact JSON format (no markdown, no explanations):
{
  "style_keywords": "your style description here",
  "lighting_keywords": "your lighting description here",
  "color_notes": "your color characteristics here"
}

Example responses:
{
  "style_keywords": "16-bit pixel art, SNES RPG style, limited 16-color palette",
  "lighting_keywords": "flat lighting, even illumination, minimal shadows",
  "color_notes": "vibrant colors, warm earth tones"
}

{
  "style_keywords": "8-bit NES pixel art, retro platformer style",
  "lighting_keywords": "flat lighting, no shadows",
  "color_notes": "limited 4-color palette per sprite"
}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert image to base64 for vision model
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('🎨 Analyzing style anchor image with vision model...');

    // Call vision model with image
    const result = await generateText({
      model: openrouter(VISION_MODEL),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: STYLE_ANALYSIS_PROMPT,
            },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    console.log('✅ Vision model response:', result.text);

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanText = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      analysis = JSON.parse(cleanText);
    } catch {
      console.error('❌ Failed to parse vision model response:', result.text);
      return NextResponse.json(
        {
          error: 'Failed to parse AI analysis',
          raw_response: result.text,
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (
      !analysis.style_keywords ||
      !analysis.lighting_keywords ||
      !analysis.color_notes
    ) {
      return NextResponse.json(
        {
          error: 'Incomplete AI analysis',
          analysis,
        },
        { status: 500 }
      );
    }

    // Return analysis
    return NextResponse.json({
      success: true,
      analysis: {
        style_keywords: analysis.style_keywords,
        lighting_keywords: analysis.lighting_keywords,
        color_notes: analysis.color_notes,
        ai_suggested: true,
      },
    });
  } catch (error) {
    console.error('❌ Style analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example usage from frontend:
 *
 * ```typescript
 * const formData = new FormData();
 * formData.append('image', imageFile);
 *
 * const response = await fetch('/api/analyze-style', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const result = await response.json();
 * // result.analysis = {
 * //   style_keywords: "16-bit pixel art, SNES RPG style, limited 16-color palette",
 * //   lighting_keywords: "flat lighting, even illumination, minimal shadows",
 * //   color_notes: "vibrant colors, warm earth tones",
 * //   ai_suggested: true
 * // }
 * ```
 */
