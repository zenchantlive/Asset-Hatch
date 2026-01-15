import { prisma } from './lib/prisma';

const projectId = 'c1a90335-c761-402e-b9cc-245fc1e931f1';

async function main() {
    // connection logic handled by lib/prisma.ts
    // ensure we run with --env-file=.env

    try {
        console.log(`🔍 Querying assets for project: ${projectId}`);

        // Test connection
        // await prisma.$connect(); // prisma connects lazily, findMany triggers it

        const assets = await prisma.generated3DAsset.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`✅ Found ${assets.length} assets.`);

        assets.forEach((asset, index) => {
            console.log(`\n--- Asset #${index + 1} (${asset.assetId}) ---`);
            console.log(`Status: ${asset.status}`);
            console.log(`Approval: ${asset.approvalStatus || 'pending'}`);
            console.log(`Draft Task ID: ${asset.draftTaskId}`);
            console.log(`Rig Task ID: ${asset.rigTaskId || 'NULL'}`);

            const hasRiggedUrl = !!asset.riggedModelUrl;
            console.log(`Rigged Model URL: ${hasRiggedUrl ? '✅ FOUND' : '❌ MISSING'} ${hasRiggedUrl ? `(${asset.riggedModelUrl?.substring(0, 30)}...)` : ''}`);

            const hasDraftUrl = !!asset.draftModelUrl;
            console.log(`Draft Model URL: ${hasDraftUrl ? '✅ FOUND' : '❌ MISSING'}`);

            console.log(`Animated URLs: ${asset.animatedModelUrls || 'None'}`);
        });
    } catch (err) {
        console.error("❌ Query failed:", err);
    } finally {
        await prisma.$disconnect();
        // pool is managed by lib/prisma, no need to explicitly end it here usually,
        // or we can't access it easily.
    }
}

main();
