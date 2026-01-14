/**
 * Project 3D Assets API
 *
 * Fetches generated 3D assets for a specific project.
 * Supports filtering by status (e.g. approved).
 *
 * GET /api/projects/[id]/3d-assets?status=approved
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get authenticated session
        const session = await auth();

        const { id: projectId } = await params;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        // Fetch project to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true, userId: true },
        });

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

        // Build query filter
        const where: { projectId: string; approvalStatus?: string } = { projectId };
        if (status) {
            where.approvalStatus = status;
        }

        // DEBUG: Log query parameters
        console.log("🔍 GET /api/projects/[id]/3d-assets - Query:", { projectId, status: status || "any", where });

        // Fetch assets
        const assets = await prisma.generated3DAsset.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        // DEBUG: Log fetched assets
        console.log("📦 3d-assets API - Fetched", assets.length, "assets:", assets.map(a => ({
            assetId: a.assetId,
            status: a.status,
            hasDraftUrl: !!a.draftModelUrl,
        })));

        // Database record type matching Prisma schema
        interface DbGenerated3DAsset {
            id: string;
            projectId: string;
            assetId: string;
            status: string;
            draftTaskId: string | null;
            rigTaskId: string | null;
            animationTaskIds: string | null;
            draftModelUrl: string | null;
            riggedModelUrl: string | null;
            animatedModelUrls: string | null;
            promptUsed: string;
            isRiggable: boolean | null;
            errorMessage: string | null;
            approvalStatus: string | null;
            approvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }

        // Helper to parse JSON fields safely
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

        // Map to expected format for UI
        const mappedAssets = (assets as unknown as DbGenerated3DAsset[]).map((asset) => {
            return {
                id: asset.id,
                name: asset.assetId.split("-").slice(1).join(" "), // Extract name from semantic ID
                assetId: asset.assetId,
                status: asset.status,
                approvalStatus: asset.approvalStatus,

                // Task IDs (Critical for rigging/animation context)
                draftTaskId: asset.draftTaskId,
                rigTaskId: asset.rigTaskId,
                animationTaskIds: parseJson(asset.animationTaskIds),

                // Model URLs
                draftModelUrl: asset.draftModelUrl,
                riggedModelUrl: asset.riggedModelUrl,
                animatedModelUrls: parseJson(asset.animatedModelUrls),

                errorMessage: asset.errorMessage,
            };
        });

        return NextResponse.json({
            success: true,
            projectName: project.name,
            assets: mappedAssets,
        });
    } catch (error: unknown) {
        console.error("❌ Projects 3D Assets API error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch project 3D assets",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
