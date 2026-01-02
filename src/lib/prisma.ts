import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Neon Postgres connection string
const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

// Only log database info in development
if (process.env.NODE_ENV === 'development') {
  console.log('📦 Database: Neon Postgres')
}

// Initialize PostgreSQL adapter (Prisma 7 pattern)
// Using standard 'pg' driver (works for both dev and production)
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Initialize Prisma client with PostgreSQL adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

