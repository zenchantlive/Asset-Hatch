/**
 * 3D Asset Approval API
 *
 * Persists approval status for a generated 3D asset in the database.
 * Updates the Generated3DAsset record with 'approved' status and timestamp.
 * Updates asset-inventory.md shared document.
 * Creates GameAssetRef for AI access.
 * Downloads GLB and stores as base64 for permanent access (Phase 10).
 *
 * POST /api/generate-3d/approve
 * Body: { projectId: string, assetId: string, status: 'approved' | 'rejected' }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateAssetInventoryDocument } from "@/lib/studio/shared-doc-initialization";
import { downloadAssetAsBuffer } from "@/lib/studio/asset-storage";
import { buildR2ObjectKey, uploadGlbToR2 } from "@/lib/studio/r2-storage";

export async function POST(req: NextRequest) {
    try {
        // Get authenticated session
        const session = await auth();

        const { projectId, assetId, status } = await req.json();

        if (!projectId || !assetId || !status) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, assetId, status" },
                { status: 400 }
            );
        }

        // Verify project exists and user has access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user owns project (if authenticated)
        if (session?.user?.id && project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You do not have permission to access this project" },
                { status: 403 }
            );
        }

        // Fetch asset details for shared docs and GameAssetRef
        const asset = await prisma.generated3DAsset.findFirst({
            where: { projectId, assetId },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Update the asset record in Prisma
        const updatedAsset = await prisma.generated3DAsset.updateMany({
            where: {
                projectId,
                assetId,
            },
            data: {
                approvalStatus: status,
                approvedAt: status === "approved" ? new Date() : null,
                status: status === "approved" ? "complete" : "ready",
            },
        });

        if (updatedAsset.count === 0) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // If approved, update shared docs and link to game
        if (status === "approved") {
            const approvalTasks = [];

            // Task 1: Update asset-inventory.md shared document
            approvalTasks.push(
                updateAssetInventoryDocument(projectId, {
                    name: asset.name || asset.assetId,
                    type: "3d" as const,
                    description: asset.promptUsed || undefined,
                    animations: asset.animatedModelUrls
                        ? Object.keys(JSON.parse(asset.animatedModelUrls))
                        : undefined,
                }).catch(e => ({ 
                    status: 'rejected', 
                    reason: `Failed to update asset inventory: ${e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e))}` 
                }))
            );

            // Task 2: Create GameAssetRef and upload to R2
            if (project.gameId) {
                const gameId = project.gameId;
                approvalTasks.push(
                    (async () => {
                        const createdRef = await prisma.gameAssetRef.upsert({
                            where: { gameId_assetId: { gameId, assetId: asset.id } },
                            update: {},
                            create: {
                                gameId,
                                assetProjectId: projectId,
                                assetType: "3d",
                                assetId: asset.id,
                                assetName: asset.name || asset.assetId,
                                thumbnailUrl: asset.draftModelUrl || null,
                                modelUrl: asset.riggedModelUrl || asset.draftModelUrl || null,
                                glbUrl: asset.riggedModelUrl || null,
                                manifestKey: (asset.name || asset.assetId).toLowerCase().replace(/\s+/g, "_"),
                                createdAt: new Date(),
                            },
                        });
                        console.log("✅ Created GameAssetRef for approved asset:", asset.name || asset.assetId);

                        const sourceUrl = asset.riggedModelUrl || asset.draftModelUrl;
                        if (!sourceUrl) return;

                        const glbResult = await downloadAssetAsBuffer(sourceUrl);
                        if (!glbResult.success || !glbResult.data) {
                            throw new Error(`Failed to download GLB: ${glbResult.error}`);
                        }

                        const objectKey = buildR2ObjectKey({ projectId, assetId: asset.id, assetName: asset.name || asset.assetId });
                        const uploadResult = await uploadGlbToR2(glbResult.data, objectKey);

                        if (!uploadResult.success || !uploadResult.url) {
                            throw new Error(`Failed to upload GLB to R2: ${uploadResult.error}`);
                        }

                        await prisma.gameAssetRef.update({
                            where: { id: createdRef.id },
                            data: { glbUrl: uploadResult.url, modelUrl: uploadResult.url },
                        });
                        console.log("✅ Uploaded GLB to R2 for asset:", asset.name || asset.assetId);
                    })().catch(e => ({ 
                        status: 'rejected', 
                        reason: `Failed to create GameAssetRef or upload to R2: ${e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e))}` 
                    }))
                );
            }

            const results = await Promise.allSettled(approvalTasks);
            results.forEach(result => {
                if (result.status === 'rejected') {
                    console.warn("⚠️ A non-blocking error occurred during asset approval:", result.reason);
                } else if (result.status === 'fulfilled' && result.value && result.value.status === 'rejected') {
                    console.warn("⚠️ A non-blocking task reported failure:", result.value.reason);
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Asset ${status} successfully`,
        });
    } catch (err) {
        console.error("❌ Approval API error:", err);
        return NextResponse.json(
            {
                error: "Failed to update approval status",
                details: err instanceof Error ? err.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
