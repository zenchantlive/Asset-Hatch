/**
 * Individual 3D Asset API
 *
 * PATCH /api/projects/[id]/3d-assets/[assetId]
 * Updates a specific 3D asset's properties (approval status, model URLs, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Valid approval status values
type ApprovalStatus = "pending" | "approved" | "rejected";

// Valid status values for 3D assets
type AssetStatus = "generating" | "pending_rig" | "rigging" | "pending_animation" | "animating" | "complete" | "failed";

/**
 * Request body type for PATCH updates
 */
interface PatchRequestBody {
    approvalStatus?: ApprovalStatus;
    draftModelUrl?: string;
    riggedModelUrl?: string;
    animatedModelUrls?: Record<string, string>;
    status?: AssetStatus;
}

/**
 * PATCH handler - Update a 3D asset
 * Used for:
 * - Updating approval status (approve/reject)
 * - Updating model URLs (after seam blending, etc.)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        // Get authenticated session
        const session = await auth();
        const { id: projectId, assetId } = await params;

        // Parse request body
        const body = (await req.json()) as PatchRequestBody;

        // Validate at least one update field is present
        if (!body.approvalStatus && !body.draftModelUrl && !body.riggedModelUrl && !body.animatedModelUrls && !body.status) {
            return NextResponse.json(
                { error: "No update fields provided" },
                { status: 400 }
            );
        }

        // Fetch project to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user owns project
        if (!session?.user?.id || project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You do not have permission to modify this asset" },
                { status: 403 }
            );
        }

        // Find the asset to update
        const existingAsset = await prisma.generated3DAsset.findFirst({
            where: {
                projectId,
                assetId,
            },
        });

        if (!existingAsset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Build update data object
        interface UpdateData {
            approvalStatus?: ApprovalStatus;
            approvedAt?: Date | null;
            draftModelUrl?: string;
            riggedModelUrl?: string;
            animatedModelUrls?: string;
            status?: AssetStatus;
        }

        const updateData: UpdateData = {};

        // Handle approval status update
        if (body.approvalStatus) {
            updateData.approvalStatus = body.approvalStatus;
            // Set approvedAt timestamp if approving
            if (body.approvalStatus === "approved") {
                updateData.approvedAt = new Date();
            } else if (body.approvalStatus === "rejected" || body.approvalStatus === "pending") {
                updateData.approvedAt = null;
            }
        }

        // Handle model URL updates
        if (body.draftModelUrl) {
            updateData.draftModelUrl = body.draftModelUrl;
        }

        if (body.riggedModelUrl) {
            updateData.riggedModelUrl = body.riggedModelUrl;
        }

        if (body.animatedModelUrls) {
            // Store as JSON string in database
            updateData.animatedModelUrls = JSON.stringify(body.animatedModelUrls);
        }

        if (body.status) {
            updateData.status = body.status;
        }

        // Perform the update
        const updatedAsset = await prisma.generated3DAsset.update({
            where: { id: existingAsset.id },
            data: updateData,
        });

        console.log(`✅ Updated 3D asset ${assetId}:`, updateData);

        return NextResponse.json({
            success: true,
            asset: {
                id: updatedAsset.id,
                assetId: updatedAsset.assetId,
                approvalStatus: updatedAsset.approvalStatus,
                status: updatedAsset.status,
            },
        });
    } catch (error: unknown) {
        console.error("❌ 3D Asset PATCH error:", error);
        return NextResponse.json(
            {
                error: "Failed to update 3D asset",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * GET handler - Fetch a single 3D asset by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const session = await auth();
        const { id: projectId, assetId } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!session?.user?.id || project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You do not have permission to access this asset" },
                { status: 403 }
            );
        }

        // Fetch the asset
        const asset = await prisma.generated3DAsset.findFirst({
            where: {
                projectId,
                assetId,
            },
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Parse JSON fields
        const parseJson = (val: string | null): Record<string, string> => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val) as Record<string, string>;
                } catch {
                    return {};
                }
            }
            return {};
        };

        return NextResponse.json({
            success: true,
            asset: {
                id: asset.id,
                assetId: asset.assetId,
                status: asset.status,
                approvalStatus: asset.approvalStatus,
                draftModelUrl: asset.draftModelUrl,
                riggedModelUrl: asset.riggedModelUrl,
                animatedModelUrls: parseJson(asset.animatedModelUrls),
                promptUsed: asset.promptUsed,
                isRiggable: asset.isRiggable,
                errorMessage: asset.errorMessage,
                createdAt: asset.createdAt,
                updatedAt: asset.updatedAt,
            },
        });
    } catch (error: unknown) {
        console.error("❌ 3D Asset GET error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch 3D asset",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
