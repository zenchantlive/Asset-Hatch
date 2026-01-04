// -----------------------------------------------------------------------------
// Prisma Seed Script - Demo User Setup
// Creates a demo user account for job applications and testing
// -----------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed script should not run in production.');
  process.exit(1);
}

const prisma = new PrismaClient();

/**
 * Main seed function
 * Creates a demo user with known credentials for resume showcase
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Demo user credentials for resume
  const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@assethatch.com';
  const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'AssetHatch2026!'; // Strong password for security
  const DEMO_NAME = 'Demo User';

  // Hash password with bcrypt (10 rounds)
  console.log('🔐 Hashing password...');
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Create or update demo user
  console.log('👤 Creating demo user...');
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      // Update password if user already exists
      hashedPassword,
      name: DEMO_NAME,
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
    create: {
      email: DEMO_EMAIL,
      hashedPassword,
      name: DEMO_NAME,
      emailVerified: new Date(), // Mark as verified
      // openRouterApiKey will be set via UI after login
    },
  });

  console.log('✅ Demo user created successfully!');
  console.log('');
  console.log('📋 Demo Credentials (for resume):');
  console.log('   Email:    ', DEMO_EMAIL);
  console.log('   Password: ', DEMO_PASSWORD);
  console.log('   User ID:  ', demoUser.id);
  console.log('');
  console.log('🔑 Next Steps:');
  console.log('   1. Login with the credentials above');
  console.log('   2. Go to Settings → API Keys');
  console.log('   3. Add your OpenRouter API key');
  console.log('   4. Start generating game assets!');
}

// Execute seed function
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
