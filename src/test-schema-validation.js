// Test Prisma DMMF (Data Model Meta Format) to verify field existence
// This checks the RUNTIME schema, not the TypeScript types

const { Prisma } = require('@prisma/client');

console.log('🔍 Checking Prisma Runtime Data Model (DMMF)...\n');

try {
    // Access the DMMF
    const dmmf = Prisma.dmmf;

    if (!dmmf) {
        console.error('❌ ERROR: Prisma.dmmf is undefined!');
        console.error('This means the Prisma client is not properly initialized.');
        process.exit(1);
    }

    console.log('✅ DMMF loaded successfully');

    // Find the User model
    const userModel = dmmf.datamodel.models.find(m => m.name === 'User');

    if (!userModel) {
        console.error('❌ ERROR: User model not found in DMMF!');
        process.exit(1);
    }

    console.log('\n📋 User Model Fields:\n');

    userModel.fields.forEach(field => {
        const nullable = field.isRequired ? '' : ' (optional)';
        console.log(`  - ${field.name}: ${field.type}${nullable}`);
    });

    // Check specifically for openRouterApiKey
    const hasField = userModel.fields.some(f => f.name === 'openRouterApiKey');

    console.log('\n🔎 Field Check:');
    console.log(`  openRouterApiKey exists: ${hasField ? '✅ YES' : '❌ NO'}`);

    if (hasField) {
        const field = userModel.fields.find(f => f.name === 'openRouterApiKey');
        console.log(`  Type: ${field.type}`);
        console.log(`  Required: ${field.isRequired}`);
        console.log(`  Kind: ${field.kind}`);
    }

    // Check scalar field enum (this is what Prisma uses for select validation)
    console.log('\n📝 UserScalarFieldEnum:');
    console.log(Prisma.UserScalarFieldEnum);

    const hasInEnum = 'openRouterApiKey' in Prisma.UserScalarFieldEnum;
    console.log(`\n  openRouterApiKey in enum: ${hasInEnum ? '✅ YES' : '❌ NO'}`);

    if (!hasField || !hasInEnum) {
        console.error('\n❌ PROBLEM FOUND:');
        console.error('The field exists in schema.prisma but NOT in the runtime Prisma client!');
        console.error('This confirms the WSL/Windows generation mismatch theory.');
    } else {
        console.log('\n✅ ALL CHECKS PASSED');
        console.log('The runtime Prisma client correctly knows about the openRouterApiKey field.');
    }

} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
}
