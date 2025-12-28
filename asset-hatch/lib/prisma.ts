import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create libsql client for SQLite
const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

// Create Prisma adapter
const adapter = new PrismaLibSql(libsql)

// Initialize Prisma client with adapter (Prisma 7 requirement)
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
