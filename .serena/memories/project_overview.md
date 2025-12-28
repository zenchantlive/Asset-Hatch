# Asset-Hatch Project Overview

Asset-Hatch is an advanced AI-powered application that leverages the Vercel AI SDK to provide intelligent, conversational capabilities with hybrid persistence (Dexie for client, Prisma for server).

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **AI Integration**: Vercel AI SDK v6, OpenRouter
- **Persistence**: 
  - Client-side: Dexie (IndexedDB)
  - Server-side: Prisma with LibSQL
- **Styling**: Tailwind CSS v4
- **Testing**: Jest, React Testing Library

## Project Structure
- `asset-hatch/`: Main application codebase
- `asset-hatch-docs/`: Project documentation and slices
- `blog/`: Dev log blog posts
- `.claude/`: Claude agent memories
- `.serena/`: Serena agent configurations
