
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const projectId = 'c1a90335-c761-402e-b9cc-245fc1e931f1';

        const assets = await prisma.generated3DAsset.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });

        const debugData = assets.map(asset => ({
            id: asset.assetId,
            status: asset.status,
            approvalStatus: asset.approvalStatus,
            draftTaskId: asset.draftTaskId,
            rigTaskId: asset.rigTaskId,
            riggedModelUrl: asset.riggedModelUrl ? `✅ FOUND (${asset.riggedModelUrl.substring(0, 20)}...)` : '❌ MISSING',
            draftModelUrl: asset.draftModelUrl ? '✅ FOUND' : '❌ MISSING',
            animatedModelUrls: asset.animatedModelUrls
        }));

        return NextResponse.json({
            count: assets.length,
            assets: debugData
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
