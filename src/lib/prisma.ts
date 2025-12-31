import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Get database URL - must be defined for libsql
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Only log database URL in development (avoid exposing in production logs)
if (process.env.NODE_ENV === 'development') {
  console.log('📦 Database URL:', databaseUrl);
}

// Create Prisma adapter with config object
// PrismaLibSql accepts either a Client or a Config with { url: string }
const adapter = new PrismaLibSql({ url: databaseUrl })

// Initialize Prisma client with adapter (Prisma 7 requirement)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

