# Asset Hatch - Developer Guide

Asset Hatch is an AI-powered game asset planning and generation tool built with Next.js 16. It transforms natural conversation into production-ready game asset packs through a workflow of planning, style definition, batch generation, and export.

## Project Structure

The main application code resides in `src/` with the following key directories:
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components organized by feature (planning, generation, ui)
- `src/lib/` - Utilities including Dexie (IndexedDB), Prisma (SQLite), and OpenRouter client
- `src/memory/` - AI context documentation
- `src/prisma/` - Database schema and migrations

## Development Commands

```bash
cd src
bun install              # Install dependencies
bun dev                  # Start development server (localhost:3000)
bun run typecheck        # TypeScript type checking
bun run lint             # ESLint
bun run test:ci          # Run tests with coverage
bunx prisma studio       # Open database GUI
bunx prisma db push      # Push schema changes
```

## Getting Started

1. Clone the repository and run `bun install` in the `src` directory
2. Copy `.env.example` to `.env.local` and configure required environment variables:
   - `AUTH_SECRET` - Session encryption secret
   - `DATABASE_URL` - SQLite database location
   - `AUTH_GITHUB_ID/SECRET` - GitHub OAuth credentials
   - `OPENROUTER_API_KEY` - For AI image generation
3. Run `bunx prisma generate` and `bunx prisma db push` to set up the database
4. Start the dev server with `bun dev`

The project uses Bun as the package manager, Prisma for database management, and Auth.js for authentication.
