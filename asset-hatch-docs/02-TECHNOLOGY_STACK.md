# Asset Hatch - Technology Stack & Architecture

## Frontend Stack

### Framework & Language
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **UI Library:** shadcn/ui (component library built on Radix UI)
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm

### State Management & Data
- **Local Storage (Dev):** IndexedDB via Dexie.js
  - No backend required for local development
  - Handles binary blobs (image files) efficiently
  - Persists across browser sessions
  - Full CRUD operations on project data
- **Schema Validation:** Zod for runtime type safety
- **Future (Production):** Vercel Postgres or Supabase

### AI & Agent Integration
- **Agent Framework:** CopilotKit
- **Planning LLM:** gemini 3 Pro via OpenRouter
  - Model ID: `google/gemini-3-pro-preview`
  - Temperature: 0.7 (creative but focused)
  - Max Tokens: 1024 per response
  - Reason: Latest multimodal capabilities, good at instruction understanding
- **Image Generation:** Multiple models via OpenRouter
  - **Primary (v1):** Black Forest Labs Flux.2 Dev
    - Model ID: `black-forest-labs/flux-2-dev`
    - Reason: Open-source, excellent 2D game asset quality, fastest inference
  - **Also Supported:** Flux.2 Flex, Flux.2 Pro, Flux.2 Max (user selectable)
  - **Future:** DALL-E 3, Midjourney API, Stable Diffusion 3.5 when available
  - All accessed through OpenRouter unified API endpoint

### API & Communication
- **Backend:** Next.js API Routes
- **API Communication:** REST (initially)
- **LLM Communication:** OpenRouter API
- **Image Generation:** OpenRouter API (supports multiple models)
- **Model Selection:** User can choose from available Flux models or others

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  ASSET HATCH WEB APP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js 15 App Router)                   │  │
│  │  ├─ Planning Interface (CopilotKit)                 │  │
│  │  ├─ Style Anchor Manager                            │  │
│  │  ├─ Asset Generation Preview                        │  │
│  │  └─ Project Management & Export                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  API Routes (Next.js)                               │  │
│  │  ├─ Project endpoints                               │  │
│  │  ├─ Asset generation coordination                   │  │
│  │  └─ Export/manifest generation                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│         ┌────────────────┼────────────────┐               │
│         │                │                │               │
│         ▼                ▼                ▼               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐        │
│  │ IndexedDB   │  │ OpenRouter   │  │ OpenRouter│        │
│  │ (Local)     │  │ (gemini 3) │  │ (Image)  │        │
│  └─────────────┘  └──────────────┘  └──────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Storage Architecture

### Local Development (IndexedDB)

**Database Structure:**
```
game-make-db (IndexedDB)
├── projects (table)
│   ├── id (PK)
│   ├── name
│   ├── created_at
│   ├── updated_at
│   ├── metadata
│   └── ...
├── memory_files (table)
│   ├── id (PK)
│   ├── project_id (FK)
│   ├── type (project.json, style-anchor.json, entities.json, etc.)
│   ├── content (JSON blob)
│   └── updated_at
├── assets (table)
│   ├── id (PK)
│   ├── project_id (FK)
│   ├── category (characters, environment, props, ui, icons)
│   ├── name
│   ├── image_blob (binary)
│   ├── metadata (dimensions, frame info, etc.)
│   └── created_at
└── conversations (table)
    ├── id (PK)
    ├── project_id (FK)
    ├── messages (array of message objects)
    └── updated_at
```

### Production (Future)
- Vercel Postgres or Supabase
- Same schema migrated to relational database
- Authentication layer added
- User-scoped data isolation

## Memory & Context System

### Project File Structure
```
/game-make-projects/[project-id]/
├── memory/
│   ├── project.json          # Core settings (immutable)
│   ├── style-anchor.json     # Visual consistency rules
│   ├── entities.json         # All defined game entities
│   └── generation-log.json   # Full generation history
├── assets/
│   ├── characters/           # Character sprites & animations
│   ├── environment/          # Tilesets, backgrounds
│   ├── props/                # Interactive objects
│   ├── ui/                   # UI elements, buttons, menus
│   └── icons/                # Item, ability, status icons
├── style-test.png            # Initial style anchor image
├── plan.md                    # Current/approved asset plan
└── conversation.json         # Chat history with agent
```

### Memory Files Explained

**project.json** (Immutable)
```json
{
  "id": "uuid",
  "name": "Cozy Farm",
  "created_at": "ISO timestamp",
  "game_type": "farming_sim",
  "perspective": "top_down",
  "base_resolution": 32,
  "theme": "pastoral",
  "mood": "cheerful",
  "custom_qualities": {}
}
```

**style-anchor.json** (Locked after style phase)
```json
{
  "art_style": "pixel_art",
  "style_description": "Retro NES-style, 32x32 base resolution",
  "color_palette": ["#2d3436", "#d63031", "#fdcb6e"],
  "reference_image": "style-test.png",
  "locked_at": "ISO timestamp",
  "visual_rules": [
    "All characters must use limited color palette",
    "Pixel art with 1-pixel outlines",
    "Maximum 4 colors per character"
  ]
}
```

**entities.json** (Grows as plan develops)
```json
{
  "entities": [
    {
      "id": "char_1",
      "category": "characters",
      "name": "Farmer Player",
      "description": "Main player character, works the farm",
      "specifications": {
        "resolution": "32x32",
        "animation_frames": ["idle", "walk_4direction", "work"],
        "pose": "front_facing"
      }
    }
  ]
}
```

**generation-log.json** (Full history for debugging)
```json
{
  "generations": [
    {
      "id": "gen_1",
      "entity_id": "char_1",
      "timestamp": "ISO timestamp",
      "prompt_used": "Full prompt sent to image model",
      "result": {
        "image_path": "assets/characters/farmer-idle.png",
        "dimensions": "32x32",
        "approved": true
      }
    }
  ]
}
```

## API Layer

### Next.js API Routes Structure
```
/app/api/
├── projects/
│   ├── route.ts              # GET/POST projects
│   └── [id]/
│       ├── route.ts          # GET/PUT/DELETE single project
│       ├── assets/           # Asset management
│       ├── generate/         # Trigger generation
│       └── export/           # Export as zip/manifest
├── memory/
│   ├── route.ts              # Read/write memory files
│   └── [id]/route.ts         # Specific memory file operations
├── agent/
│   └── route.ts              # CopilotKit agent endpoint
└── image-generation/
    └── route.ts              # Image generation proxy
```

### Key Endpoints (To Be Detailed in API Spec)
- `GET /api/projects` — List user projects
- `POST /api/projects` — Create new project
- `GET /api/projects/[id]` — Get project with all data
- `PUT /api/projects/[id]` — Update project metadata
- `POST /api/projects/[id]/generate` — Queue asset generation
- `GET /api/projects/[id]/export` — Export project as downloadable
- `POST /api/memory/[id]` — Update memory files
- `POST /api/agent` — CopilotKit agent handler

## Deployment Architecture

### Local Development
- Frontend: `localhost:3000`
- IndexedDB: Browser storage
- API: Next.js dev server
- No backend database needed
- No authentication required

### Production (Vercel)
- Frontend: Vercel hosting
- Database: Vercel Postgres or Supabase
- API: Vercel serverless functions
- Authentication: Auth0 or similar (future)
- Image storage: Vercel Blob Storage or S3

## External Dependencies

### APIs & Services
- **OpenRouter API** — LLM access (gemini 3 Pro)
- **OpenRouter API** — Image generation (Nano Banana Pro)
- **TypeScript** — Language
- **React 19** — UI framework (via Next.js)
- **Tailwind CSS** — Styling
- **Dexie.js** — IndexedDB wrapper
- **Zod** — Schema validation
- **CopilotKit** — Agent framework
- **shadcn/ui** — Component library

### Development
- **Node.js 20+**
- **pnpm** — Package manager
- **TypeScript** — Type checking

## Security & Environment Variables

### Required Environment Variables
```
OPENROUTER_API_KEY=your_key_here
```

### Development vs Production Secrets
- Dev: Can use mock/test keys for development
- Prod: Requires valid API keys with rate limiting
- Client-side: No secrets exposed to frontend
- API routes: Handle all API authentication

## Performance Considerations

- **IndexedDB** — Efficient local caching, no network latency for reads
- **Image Blobs** — Stored locally, not re-downloaded
- **Streaming** — Gemini responses streamed to UI for responsiveness
- **Lazy Loading** — Projects loaded on-demand, not all at startup
- **Asset Compression** — Export zips use compression

## Scalability Notes

### Current (v1)
- Single-user local development
- No server-side scaling concerns
- IndexedDB limits ~50-100MB per project reasonable

### Future Considerations
- Multi-user with authentication
- Database sharding for large projects
- CDN for asset delivery
- Batch processing for high-volume generations
