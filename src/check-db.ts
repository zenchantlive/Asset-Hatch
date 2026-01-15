import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking 3D Assets ---')
    const assets = await prisma.generated3DAsset.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    assets.forEach(asset => {
        console.log(`ID: ${asset.id}`)
        console.log(`AssetID: ${asset.assetId}`)
        console.log(`Name: ${asset.name}`)
        console.log(`Status: ${asset.status}`)
        console.log('---')
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
