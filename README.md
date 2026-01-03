<div align="center">
  <img src="docs/branding/header-logo-dark.svg#gh-dark-mode-only" alt="Asset Hatch" width="600">
  <img src="docs/branding/header-logo-light.svg#gh-light-mode-only" alt="Asset Hatch" width="600">
</div>

> **AI-powered game asset planning and generation tool** — Transform natural conversation into complete, production-ready game asset packs.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

![Asset Hatch Demo](docs/demo.gif)

---

## ✨ What is Asset Hatch?

Asset Hatch transforms the way indie developers create game assets. Instead of manually writing specification documents or wrestling with complex AI prompts, you simply **have a conversation** with an AI that understands game development.

### The Workflow

```
🗣️ PLANNING     →  📐 STYLE      →  🎨 GENERATION  →  📦 EXPORT
Chat with AI       Define visual      Batch generate    Download ZIP
Build asset plan   style anchor       all assets        with metadata
```

### Key Features

- **Natural Conversation** — Describe your game, AI builds the asset specification
- **Style Consistency** — Upload reference images, AI ensures visual coherence
- **Batch Generation** — Generate entire asset packs with one click
- **Version Control** — Compare multiple generations before accepting
- **Export Ready** — Download organized ZIP with sprite sheets and metadata

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- [GitHub Account](https://github.com/) (for OAuth login)
- [OpenRouter API Key](https://openrouter.ai/) (for AI features)

### 1. Clone & Install

```bash
git clone https://github.com/zenchantlive/Asset-Hatch.git
cd Asset-Hatch/src
bun install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your credentials
# See "Environment Variables" section below for details
```

### 3. Set Up Database

```bash
bunx prisma generate
bunx prisma db push
```

### 4. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

Create a `.env.local` file in the `src/` directory:

```bash
# ============================================
# REQUIRED - App will not start without these
# ============================================

# Session encryption secret
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here"

# SQLite database location (local file)
DATABASE_URL="file:./dev.db"

# ============================================
# GITHUB OAUTH - Required for login
# ============================================
# Create OAuth App: https://github.com/settings/developers
# Homepage URL: http://localhost:3000
# Callback URL: http://localhost:3000/api/auth/callback/github

AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# ============================================
# OPENROUTER - Required for AI features
# ============================================
# Get your API key: https://openrouter.ai/keys
# Pricing: ~$0.01-0.05 per image generation

OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

### Getting Your API Keys

1. **GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Set Homepage URL: `http://localhost:3000`
   - Set Callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and Client Secret

2. **OpenRouter API Key**
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Go to [API Keys](https://openrouter.ai/keys)
   - Create a new key and copy it

---

## 📁 Project Structure

```
Asset-Hatch/
├── src/                      # Main application code
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # API routes (chat, generation, auth)
│   │   └── project/          # Project pages (planning, generation)
│   ├── components/           # React components
│   │   ├── planning/         # Chat, plan preview, quality controls
│   │   ├── generation/       # Generation queue, asset cards
│   │   └── ui/               # Shared UI components (shadcn/ui)
│   ├── lib/                  # Utilities and clients
│   │   ├── client-db.ts      # Dexie (IndexedDB) client cache
│   │   ├── prisma.ts         # Prisma (SQLite) server database
│   │   └── flux-client.ts    # OpenRouter image generation
│   ├── memory/               # AI context documentation
│   └── prisma/               # Database schema and migrations
├── docs/                     # Additional documentation
├── blog/                     # Development blog posts
└── .github/                  # GitHub Actions workflows
```

---

## 🛠️ Development Commands

```bash
# Development
bun dev              # Start dev server (localhost:3000)
bun build            # Build for production
bun start            # Start production server

# Code Quality
bun run typecheck    # TypeScript type checking
bun run lint         # ESLint

# Testing
bun run test         # Run tests in watch mode
bun run test:ci      # Run tests once with coverage

# Database
bunx prisma studio   # Open database GUI
bunx prisma db push  # Push schema changes (development)
bunx prisma migrate dev  # Create migration (production)
```

---

## 🧠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **AI SDK** | Vercel AI SDK v6 |
| **AI Provider** | OpenRouter (Gemini, Flux) |
| **Database** | SQLite (Prisma) + IndexedDB (Dexie) |
| **Auth** | Auth.js (NextAuth v5) |
| **Package Manager** | Bun |

---

## 📖 How It Works

### 1. Planning Phase
Chat with the AI to describe your game. The AI automatically:
- Extracts quality parameters (art style, resolution, perspective)
- Builds an asset list organized by category
- Generates detailed prompts for each asset

### 2. Style Anchor Phase
Upload reference images or describe your desired style. The AI:
- Analyzes visual elements (color palette, texture, lighting)
- Generates a "style anchor" image for consistency
- Uses this anchor to guide all subsequent generations

### 3. Generation Phase
Select assets and generate in batches:
- Preview before approving
- Regenerate with different variations
- Compare multiple versions side-by-side
- Accept/reject individual assets

### 4. Export Phase
Package your approved assets:
- Organized folder structure by category
- Sprite sheet generation (optional)
- JSON metadata for game engines

---

## 🔒 Security

- **API Keys**: Stored only in your local `.env.local` file
- **OAuth Tokens**: Managed by Auth.js, stored in SQLite
- **Database**: Local SQLite file, not exposed to network
- **No Telemetry**: No data sent to external analytics services

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with detailed messages
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You must keep it open source if you distribute it
- ✅ You must include the original license and copyright

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for AI model access
- [Vercel](https://vercel.com/) for the AI SDK
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Prisma](https://prisma.io/) for database tooling

---

## 📧 Contact

Created by [@zenchantlive](https://github.com/zenchantlive)

Questions? [Open an issue](https://github.com/zenchantlive/Asset-Hatch/issues/new) or start a [discussion](https://github.com/zenchantlive/Asset-Hatch/discussions).

---

**Building in Public** — Follow our development journey in the [blog/](blog/) directory!
