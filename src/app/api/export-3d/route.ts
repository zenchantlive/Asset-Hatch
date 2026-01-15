/**
 * 3D Export API Route
 *
 * Generates a ZIP file containing all approved 3D assets with:
 * - GLB model files (draft, rigged, animated)
 * - manifest-3d.json with asset metadata
 *
 * This mirrors the 2D export pattern but handles 3D model files
 * from Tripo3D instead of image files from IndexedDB.
 *
 * @see app/api/export/route.ts for 2D export pattern
 * @see components/3d/export/ExportPanel3D.tsx for UI component
 */

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// =============================================================================
// Types
// =============================================================================

/**
 * Manifest structure for 3D asset export.
 * Provides metadata for AI-assisted integration.
 */
interface Export3DManifest {
    // Project information
    project: {
        id: string;
        name: string;
        mode: string;
        created: string;
    };
    // List of exported assets
    assets: Export3DAssetMetadata[];
}

/**
 * Metadata for a single exported 3D asset.
 */
interface Export3DAssetMetadata {
    // Semantic ID for the asset
    id: string;
    // Human-readable name
    name: string;
    // Asset category (Characters, Environment, Props)
    category: string;
    // File paths in the ZIP
    files: {
        draft?: string;
        rigged?: string;
        animated?: Record<string, string>;
    };
    // Generation details
    generationMetadata: {
        prompt: string;
        isRiggable: boolean;
        animationsApplied: string[];
    };
    // Descriptive tags
    tags: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Fetches a model file from Tripo3D CDN.
 * Returns the file as a buffer for ZIP inclusion.
 *
 * @param url - Tripo3D model URL
 * @returns Buffer containing the GLB file
 */
async function fetchModelAsBuffer(url: string): Promise<Buffer> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        // Fetch directly from the URL server-side (no CORS issues)
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.statusText}`);
        }

        // Convert to buffer
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Generates a safe filename from an asset name.
 * Removes special characters and replaces spaces with underscores.
 *
 * @param name - Original asset name
 * @returns Safe filename string
 */
function generateSafeFilename(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
}

// =============================================================================
// Route Handler
// =============================================================================

/**
 * POST /api/export-3d
 *
 * Request body: {
 *   projectId: string
 * }
 *
 * Returns: ZIP file as blob containing GLB files and manifest
 */
export async function POST(req: NextRequest) {
    try {
        // Get authenticated session
        const session = await auth();

        // Parse request body
        const { projectId } = await req.json();

        // Validate project ID
        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Fetch project from database
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        // Check project exists
        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user owns project (authentication required)
        if (!session?.user?.id || project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You do not have permission to access this project" },
                { status: 403 }
            );
        }

        // Verify project is 3D mode
        if (project.mode !== "3d") {
            return NextResponse.json(
                { error: "Project is not in 3D mode" },
                { status: 400 }
            );
        }

        // Fetch all approved 3D assets
        const approved3DAssets = await prisma.generated3DAsset.findMany({
            where: {
                projectId: projectId,
                status: "complete", // Only fully completed assets
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // Check if any assets to export
        if (approved3DAssets.length === 0) {
            return NextResponse.json(
                { error: "No approved 3D assets to export" },
                { status: 400 }
            );
        }

        // Initialize manifest
        const manifest: Export3DManifest = {
            project: {
                id: project.id,
                name: project.name,
                mode: project.mode,
                created: project.createdAt.toISOString(),
            },
            assets: [],
        };

        // Create ZIP archive
        const zip = new JSZip();

        // Process each approved 3D asset
        for (const asset of approved3DAssets) {
            // Use stored name if available, otherwise fallback to extracting from assetId
            const displayName = asset.name || asset.assetId.split("-").slice(1).join(" ") || asset.assetId;
            const safeId = generateSafeFilename(displayName);

            // Track files added for this asset
            const files: Export3DAssetMetadata["files"] = {};

            // Add draft model if available
            if (asset.draftModelUrl) {
                try {
                    const buffer = await fetchModelAsBuffer(asset.draftModelUrl);
                    const path = `models/${safeId}_draft.glb`;
                    zip.file(path, buffer);
                    files.draft = path;
                } catch (err) {
                    console.warn(`⚠️ Failed to fetch draft model for ${asset.assetId}:`, err);
                }
            }

            // Add rigged model if available
            if (asset.riggedModelUrl) {
                try {
                    const buffer = await fetchModelAsBuffer(asset.riggedModelUrl);
                    const path = `models/${safeId}_rigged.glb`;
                    zip.file(path, buffer);
                    files.rigged = path;
                } catch (err) {
                    console.warn(`⚠️ Failed to fetch rigged model for ${asset.assetId}:`, err);
                }
            }

            // Add animated models if available
            if (asset.animatedModelUrls) {
                try {
                    // Parse JSON string to get animation URLs
                    const animUrls = JSON.parse(asset.animatedModelUrls) as Record<string, string>;
                    files.animated = {};

                    // Fetch each animated model
                    for (const [preset, url] of Object.entries(animUrls)) {
                        try {
                            const buffer = await fetchModelAsBuffer(url);
                            const animId = preset.replace("preset:", "");
                            const path = `models/${safeId}_${animId}.glb`;
                            zip.file(path, buffer);
                            files.animated[preset] = path;
                        } catch (err) {
                            console.warn(`⚠️ Failed to fetch animation ${preset} for ${asset.assetId}:`, err);
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Failed to parse animated URLs for ${asset.assetId}:`, err);
                }
            }

            // Parse animation task IDs to get list of applied animations
            let animationsApplied: string[] = [];
            if (asset.animationTaskIds) {
                try {
                    const taskIds = JSON.parse(asset.animationTaskIds) as Record<string, string>;
                    animationsApplied = Object.keys(taskIds);
                } catch {
                    animationsApplied = [];
                }
            }

            const assetMetadata: Export3DAssetMetadata = {
                id: asset.assetId,
                // Use stored name if available, otherwise parse from assetId
                name: asset.name || asset.assetId.split("-").slice(1).join(" ") || asset.assetId,
                category: "3D Asset",
                files,
                generationMetadata: {
                    prompt: asset.promptUsed,
                    isRiggable: asset.isRiggable || false,
                    animationsApplied,
                },
                tags: [
                    "3d",
                    "glb",
                    asset.isRiggable ? "riggable" : "static",
                    ...animationsApplied.map((a) => a.replace("preset:", "")),
                ],
            };

            // Add to manifest
            manifest.assets.push(assetMetadata);
        }

        // Add manifest to ZIP root
        zip.file("manifest-3d.json", JSON.stringify(manifest, null, 2));

        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        // Return ZIP as download
        return new NextResponse(zipBlob, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "_")}_3D_assets.zip"`,
                "Content-Length": zipBlob.size.toString(),
            },
        });
    } catch (error: unknown) {
        console.error("❌ 3D Export error:", error);
        return NextResponse.json(
            {
                error: "Failed to export 3D assets",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
