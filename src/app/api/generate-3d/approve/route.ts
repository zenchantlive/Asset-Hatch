/**
 * 3D Asset Approval API
 *
 * Persists approval status for a generated 3D asset in the database.
 * Updates the Generated3DAsset record with 'approved' status and timestamp.
 *
 * POST /api/generate-3d/approve
 * Body: { projectId: string, assetId: string, status: 'approved' | 'rejected' }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { projectId, assetId, status } = await req.json();

        if (!projectId || !assetId || !status) {
            return NextResponse.json(
                { error: "Missing required fields: projectId, assetId, status" },
                { status: 400 }
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
                // If approved, we also mark it as 'complete' in the status field for compatibility
                status: status === "approved" ? "complete" : "ready",
            },
        });

        if (updatedAsset.count === 0) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Asset ${status} successfully`,
        });
    } catch (error: unknown) {
        console.error("❌ Approval API error:", error);
        return NextResponse.json(
            {
                error: "Failed to update approval status",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
