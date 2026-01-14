/**
 * Skybox Generation API Route
 *
 * Generates equirectangular 360 panorama skybox images for 3D environments.
 *
 * Workflow:
 * 1. Receive skybox prompt from client
 * 2. Prepend equirectangular formatting instructions to prompt
 * 3. Call OpenRouter image generation API via generateFluxImage
 * 4. Return generated skybox image to client
 *
 * Uses shared utility: lib/openrouter-image.ts for API handling
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateFluxImage } from "@/lib/openrouter-image";
import { getModelById, getDefaultModel } from "@/lib/model-registry";
import { buildSkyboxPrompt, type SkyboxPreset } from "@/lib/skybox-prompts";

// =============================================================================
// Types
// =============================================================================

/**
 * Request body for skybox generation.
 */
interface SkyboxGenerateRequest {
    // Project ID for context
    projectId: string;
    // User's prompt describing the skybox
    prompt: string;
    // Optional preset type (sunset, noon, night, etc.)
    preset?: SkyboxPreset;
    // Optional model ID override (defaults to Gemini 3 Pro Image)
    modelId?: string;
}

/**
 * Response body for successful skybox generation.
 */
interface SkyboxGenerateResponse {
    // Whether generation was successful
    success: boolean;
    // Generated equirectangular skybox image as data URL
    imageUrl: string;
    // Seed used for generation (if available)
    seed?: number;
    // Duration of generation in milliseconds
    durationMs: number;
    // Model ID used for generation
    modelId: string;
}

/**
 * Default model for skybox generation.
 * Gemini 3 Pro Image produces high-quality results with good prompt following.
 */
const DEFAULT_SKYBOX_MODEL = "google/gemini-3-pro-image-preview";

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // Get authenticated session to check for user's API key (BYOK)
        const session = await auth();
        let userApiKey: string | null = null;

        // Check if user has their own API key configured
        if (session?.user?.id) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { openRouterApiKey: true },
            });
            userApiKey = user?.openRouterApiKey || null;
        }

        // Parse request body
        const body: SkyboxGenerateRequest = await request.json();
        const { projectId, prompt, preset, modelId = DEFAULT_SKYBOX_MODEL } = body;

        // Validate required fields
        if (!projectId) {
            return NextResponse.json(
                { error: "projectId is required" },
                { status: 400 }
            );
        }

        if (!prompt || prompt.trim() === "") {
            return NextResponse.json(
                { error: "prompt is required" },
                { status: 400 }
            );
        }

        // Verify the project exists and user has access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, userId: true }
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // AuthZ Check: Ensure user owns the project
        if (!session?.user?.id || project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized: You do not have access to this project" },
                { status: 403 }
            );
        }

        console.log("🌌 Starting skybox generation for project:", projectId);

        // Get model config from registry
        const model = getModelById(modelId) || getDefaultModel("multimodal");
        if (!model) {
            return NextResponse.json(
                { error: `Unknown model: ${modelId}` },
                { status: 400 }
            );
        }

        // Build FLUX2-optimized prompt using new builder
        const fullPrompt = buildSkyboxPrompt({
            userPrompt: prompt,
            preset: preset || 'custom',
        });

        console.log("📝 Generating skybox with FLUX2-optimized prompt");

        // Call OpenRouter using shared utility
        const result = await generateFluxImage({
            modelId: model.id,
            prompt: fullPrompt,
            // No reference image for skybox - pure text-to-image
            apiKey: userApiKey || undefined,
        });

        console.log("✅ Skybox generated successfully:", {
            duration: `${result.durationMs}ms`,
            seed: result.seed,
            generationId: result.generationId,
        });

        // Return successful response
        const response: SkyboxGenerateResponse = {
            success: true,
            imageUrl: result.imageUrl,
            seed: result.seed,
            durationMs: result.durationMs,
            modelId: result.modelId,
        };

        // Persist to database
        try {
            const skyboxAssetId = `${projectId}-skybox`;
            await prisma.generated3DAsset.upsert({
                where: {
                    projectId_assetId: {
                        projectId,
                        assetId: skyboxAssetId,
                    },
                },
                update: {
                    status: 'complete', // Skyboxes are complete immediately (no rigging)
                    draftModelUrl: result.imageUrl, // We reuse this field for the image
                    promptUsed: prompt,
                    fullPrompt: fullPrompt,
                    updatedAt: new Date(),
                },
                create: {
                    projectId,
                    assetId: skyboxAssetId,
                    status: 'complete',
                    draftModelUrl: result.imageUrl,
                    promptUsed: prompt,
                    fullPrompt: fullPrompt,
                    isRiggable: false,
                },
            });
            console.log("💾 Skybox saved to database:", skyboxAssetId);
        } catch (dbError) {
            console.error("⚠️ Failed to save skybox to DB:", dbError);
            // Don't fail the request if DB save fails, just warn
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("❌ Skybox generation error:", error);
        return NextResponse.json(
            {
                error: "Skybox generation failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
