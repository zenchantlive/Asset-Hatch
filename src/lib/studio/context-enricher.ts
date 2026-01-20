/**
 * Context Enricher Service
 *
 * Populates UnifiedProjectContext with rich metadata from generated assets.
 * This service enriches the shared context on READ operations to ensure
 * the AI always has up-to-date awareness of project assets.
 *
 * @see src/lib/types/shared-context.ts for type definitions
 */

import { prisma } from "@/lib/prisma";
import type { UnifiedProjectContext } from "@/lib/types/shared-context";

/**
 * Parse animation task IDs from JSON string
 *
 * @param animationTaskIds - JSON string of animation task IDs
 * @returns Array of animation names
 */
function parseAnimationTaskIds(animationTaskIds: string | null): string[] {
  if (!animationTaskIds) {
    return [];
  }

  try {
    const parsed = JSON.parse(animationTaskIds);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "object" && parsed !== null) {
      // Object format: {"walk": "task-123", "idle": "task-456"}
      return Object.keys(parsed);
    }
    return [];
  } catch {
    console.warn("Failed to parse animationTaskIds:", animationTaskIds);
    return [];
  }
}

/**
 * Extract characters from 3D assets in the project
 *
 * @param projectId - The project ID to query
 * @returns Array of character metadata for context
 */
async function getCharactersFrom3DAssets(
  projectId: string
): Promise<UnifiedProjectContext["characters"]> {
  try {
    const assets = await prisma.generated3DAsset.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        promptUsed: true,
        animationTaskIds: true,
        assetId: true,
      },
    });

    return assets.map((asset) => ({
      name: asset.name || asset.assetId || "Unnamed Character",
      description: asset.promptUsed?.substring(0, 300) || "",
      animations: parseAnimationTaskIds(asset.animationTaskIds),
      assetId: asset.id,
    }));
  } catch (error) {
    console.error("Failed to extract characters from 3D assets:", error);
    return [];
  }
}

/**
 * Extract environments from 3D assets in the project
 *
 * @param projectId - The project ID to query
 * @returns Array of environment metadata for context
 */
async function getEnvironmentsFromAssets(
  projectId: string
): Promise<UnifiedProjectContext["environments"]> {
  try {
    // Fetch skybox assets
    const skyboxAssets = await prisma.generated3DAsset.findMany({
      where: {
        projectId,
        // Look for assets that appear to be skyboxes based on naming or metadata
        OR: [
          { name: { contains: "skybox", mode: "insensitive" as const } },
          { name: { contains: "environment", mode: "insensitive" as const } },
          { name: { contains: "background", mode: "insensitive" as const } },
        ],
      },
      select: {
        id: true,
        name: true,
        assetId: true,
      },
    });

    // Also check 2D assets for environment backgrounds
    // Note: GeneratedAsset doesn't have a name field, so we query all and filter by assetId patterns
    const all2DAssets = await prisma.generatedAsset.findMany({
      where: { projectId },
      select: {
        id: true,
        assetId: true,
        metadata: true,
      },
    });

    // Filter 2D assets by assetId patterns indicating environments
    const twoDAssets = all2DAssets.filter((asset) =>
      /background|environment|skybox/i.test(asset.assetId || "")
    );

    const environments: UnifiedProjectContext["environments"] = [
      ...skyboxAssets.map((asset) => ({
        name: asset.name || asset.assetId || "Skybox",
        type: "skybox" as const,
        assetId: asset.id,
      })),
      ...twoDAssets.map((asset) => ({
        name: asset.assetId || "Background",
        type: "exterior" as const,
        assetId: asset.id,
      })),
    ];

    return environments;
  } catch (error) {
    console.error("Failed to extract environments:", error);
    return [];
  }
}

/**
 * Enrich project context with asset metadata
 *
 * This function fetches approved assets from the project and populates
 * the context's characters and environments arrays. User-provided fields
 * (gameConcept, targetAudience, keyFeatures) are preserved.
 *
 * @param projectId - The project ID to enrich context for
 * @param context - The existing context to enrich
 * @returns Enriched context with asset metadata
 */
export async function enrichContextWithAssets(
  projectId: string,
  context: UnifiedProjectContext
): Promise<UnifiedProjectContext> {
  console.log("🎨 Enriching context with assets for project:", projectId);

  try {
    // Fetch asset metadata in parallel
    const [characters, environments] = await Promise.all([
      getCharactersFrom3DAssets(projectId),
      getEnvironmentsFromAssets(projectId),
    ]);

    console.log(
      "✅ Context enriched:",
      characters.length,
      "characters,",
      environments.length,
      "environments"
    );

    // Merge with existing context, preserving user-provided fields
    return {
      ...context,
      characters,
      environments,
      lastUpdatedBy: "assets",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Failed to enrich context with assets:", error);
    // Return original context on error - enrichment is best-effort
    console.warn("⚠️ Returning context without enrichment due to error");
    return context;
  }
}
