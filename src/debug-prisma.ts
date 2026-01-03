
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Prisma Client...');

    // 1. Check DMMF (Internal Data Model)
    // @ts-expect-error - prisma._baseDmmf is internal
    const dmmf = prisma._baseDmmf || (prisma as unknown as { _dmmf: Record<string, unknown> })._dmmf;
    if (dmmf) {
        const userModel = dmmf.modelMap ? dmmf.modelMap.User : dmmf.datamodel.models.find((m: { name: string }) => m.name === 'User');
        if (userModel) {
            const fieldNames = userModel.fields.map((f: { name: string }) => f.name);
            console.log('📋 User model fields in runtime:', fieldNames);
            console.log('✅ Has openRouterApiKey:', fieldNames.includes('openRouterApiKey'));
        } else {
            console.log('❌ Could not find User model in DMMF');
        }
    } else {
        console.log('⚠️ Could not access DMMF');
    }

    // 2. Try to query
    try {
        console.log('🔄 Attempting query...');
        // We don't need a real ID, just want to see if it throws valiation error
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                openRouterApiKey: true
            }
        });
        console.log('✅ Query executed successfully:', user ? 'User found' : 'No user found');
    } catch (e) {
        console.error('❌ Query failed:', e);
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
