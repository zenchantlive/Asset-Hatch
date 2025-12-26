# Asset Hatch - Implementation Roadmap & Next Steps

## Development Phases

### Phase 0: Foundation (Weeks 1-2)
**Goal:** Set up project structure and core infrastructure

**Tasks:**
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up pnpm and dependencies
  - shadcn/ui components
  - Tailwind CSS
  - Dexie.js for IndexedDB
  - Zod for schema validation
  - CopilotKit
- [ ] Configure environment variables (.env.local)
  - OPENROUTER_API_KEY
- [ ] Set up basic project structure
  ```
  /app
    /api
    /components
    /lib
    /pages
  /public
  /styles
  ```
- [ ] Create basic page layout (header, sidebar, main area)
- [ ] Initialize IndexedDB schema with Dexie

**Deliverable:**
- Runnable Next.js app
- Empty pages (planning, style, generation, export)
- IndexedDB connection working

---

### Phase 1: Planning Interface (Weeks 2-3)
**Goal:** Build the planning conversation interface powered by CopilotKit

**Tasks:**
- [ ] Set up CopilotKit integration
  - Configure with gemini 3 Pro via OpenRouter
  - Create agent endpoint (/api/agent)
  - Implement streaming responses

- [ ] Build planning UI components
  - Chat message display
  - User input area
  - Qualities dropdown bar (art_style, resolution, etc.)
  - Plan preview panel

- [ ] Implement planning agent tools
  - `updateQuality()` - Updates dropdown values
  - `addEntityToPlan()` - Adds asset to plan
  - `markPlanComplete()` - Enables approval button

- [ ] Implement tool handlers in API
  - Save qualities to memory/project.json
  - Add entities to entities.json
  - Update UI in real-time

- [ ] Create plan persistence
  - Save conversation history
  - Save entities.json
  - Save quality settings
  - Auto-save as conversation continues

**Deliverable:**
- Full planning conversation interface
- Working agent that asks clarifying questions
- Plan builds and updates in real-time
- "Approve Plan" button works

---

### Phase 2: Style Anchoring (Week 3-4)
**Goal:** Implement style reference image upload and style locking

**Tasks:**
- [ ] Build style upload interface
  - Image upload area
  - Preview uploaded image
  - Auto-analyze image (color palette, style description)

- [ ] Implement style analysis
  - Extract dominant colors
  - Generate style description
  - Create visual rules list

- [ ] Build style confirmation UI
  - Show analyzed style
  - Allow editing style description
  - Display preview of how it will influence generation

- [ ] Implement style locking
  - Create style-anchor.json
  - Set locked_at timestamp
  - Store in IndexedDB

- [ ] Create style editing flow
  - Warning modal if editing after generation
  - Allow style adjustment with regeneration consequences

**Deliverable:**
- Style upload and analysis working
- Style-anchor.json created and saved
- User can confirm or edit style before locking
- System ready for generation phase

---

### Phase 3: Asset Generation (Weeks 4-5)
**Goal:** Implement asset generation with live preview and approval workflow

**Tasks:**
- [ ] Build generation phase UI
  - Progress indicator
  - Current asset display
  - Approve/Regenerate buttons
  - Asset gallery preview

- [ ] Implement prompt generation
  - Take entity spec from plan
  - Combine with style anchor rules
  - Create high-quality prompt for Nano Banana
  - Backend meta-prompt system

- [ ] Implement image generation API integration
  - Queue assets for generation
  - Call Nano Banana Pro via OpenRouter
  - Handle streaming image responses
  - Save images to IndexedDB

- [ ] Build approval workflow
  - Show generated image
  - User can approve (next asset)
  - User can regenerate (new version)
  - User can edit spec and regenerate

- [ ] Implement generation history
  - Track all generations in generation-log.json
  - Store attempted prompts
  - Track approved vs rejected versions

- [ ] Batch generation options
  - Generate all at once
  - Generate by category
  - Generate on-demand
  - Resume from interruption

**Deliverable:**
- Asset generation working end-to-end
- Live preview of generated assets
- Approve/regenerate workflow functional
- generation-log.json tracking everything
- assets/ folder populating with PNG files

---

### Phase 4: Export & Manifest (Week 5)
**Goal:** Create export functionality and AI-readable manifest files

**Tasks:**
- [ ] Build export UI
  - Export button
  - Format selection (ZIP initially)
  - Download progress

- [ ] Implement manifest generation
  - Create manifest.json with all asset metadata
  - Include project settings, style info, asset details
  - Frame count, dimensions, animation specs

- [ ] Create export packaging
  - Organize assets by category
  - Create README.md guide
  - Create project.json reference
  - Package into downloadable ZIP

- [ ] Implement download
  - Generate ZIP file
  - Trigger browser download
  - Show success confirmation

**Deliverable:**
- Downloadable project package (ZIP)
- manifest.json with complete metadata
- Assets organized and ready for game engine
- Project docs included

---

### Phase 5: Project Management (Week 6)
**Goal:** Implement project listing, loading, and management

**Tasks:**
- [ ] Build projects dashboard
  - List all projects
  - Show project thumbnails
  - Show project metadata (game type, last modified)
  - Delete/export options

- [ ] Implement project loading
  - Load from IndexedDB
  - Restore entire project state
  - Resume at correct phase

- [ ] Build project creation flow
  - New project button
  - Template selection
  - Resume existing project

- [ ] Add phase navigation
  - Show current phase
  - Allow jumping to completed phases
  - Show warnings for phase changes

**Deliverable:**
- Project management functional
- Can create/load/delete projects
- Can resume any project at any phase
- Dashboard shows all projects

---

### Phase 6: Polish & Deployment (Week 6-7)
**Goal:** Final UI polish, testing, and deployment

**Tasks:**
- [ ] UI/UX Polish
  - Ensure consistent styling with Tailwind
  - Responsive design (mobile-friendly)
  - Smooth transitions between phases
  - Loading states and skeletons
  - Error messages and recovery flows

- [ ] Testing
  - Manual end-to-end testing of all flows
  - Test with different game types
  - Test edge cases and error scenarios
  - Performance testing on large projects

- [ ] Documentation
  - README.md for repo
  - Setup instructions
  - API documentation
  - User guide

- [ ] Optimization
  - IndexedDB query optimization
  - Image compression
  - Lazy loading of assets

- [ ] Vercel Deployment Setup
  - Configure environment for production
  - Database setup (future: Vercel Postgres)
  - Test in production-like environment

**Deliverable:**
- Polished, functional application
- Deployed to Vercel
- Complete documentation
- Ready for user testing

---

## MVP Feature Checklist

Core features for v1 MVP:

### Planning
- [x] Chat interface with agent
- [x] Quality dropdown selections
- [x] Asset plan building
- [x] Plan approval workflow
- [x] Game type templates (Platformer, RPG, Puzzle, Farming min 3)
- [x] Custom quality input

### Style
- [x] Image upload
- [x] Style analysis and description
- [x] Style locking
- [x] Edit style flow

### Generation
- [x] Prompt generation from plan + style
- [x] Image generation via Nano Banana
- [x] Live preview as assets generate
- [x] Approve/regenerate workflow
- [x] Generation history tracking

### Export
- [x] ZIP package creation
- [x] manifest.json generation
- [x] Assets organized by category
- [x] Download functionality

### Project Management
- [x] Create new project
- [x] List projects
- [x] Load existing project
- [x] Delete project
- [x] Resume from any phase

### Infrastructure
- [x] Next.js 15 + TypeScript
- [x] IndexedDB persistence
- [x] CopilotKit integration
- [x] OpenRouter API integration
- [x] Error handling and recovery

---

## Technology Setup Checklist

```bash
# Initialize project
npx create-next-app@latest game-make --typescript --tailwind

# Install dependencies
pnpm add dexie zod copilotkit openrouter

# Install shadcn/ui components
pnpm exec shadcn-ui@latest add button input textarea card

# Create .env.local
OPENROUTER_API_KEY=your_key_here
```

---

## Key Decisions Ahead

Before starting implementation, confirm:

1. **CopilotKit Configuration**
   - How to handle multi-message conversations?
   - How to persist agent state between page reloads?
   - Rate limiting strategy for API calls?

2. **Image Generation**
   - Confirm Nano Banana Pro is preferred
   - How to handle generation failures/retries?
   - Image size/quality defaults?

3. **Storage Strategy**
   - Stick with IndexedDB for v1?
   - When to migrate to database?
   - How large can projects realistically get?

4. **UI Framework**
   - Confirm shadcn/ui components
   - Any custom design system?
   - Responsive design targets (mobile, tablet)?

5. **Monetization (Later)**
   - When does hosted version make sense?
   - Pricing model?
   - Free tier vs paid?

---

## Success Criteria for v1

1. ✅ User can describe a game and get a structured asset plan
2. ✅ User can upload style reference and lock visual consistency
3. ✅ User can generate 50+ assets that visually match each other
4. ✅ User can download complete project with manifest
5. ✅ User can hand manifest to AI agent (Claude Code, etc.)
6. ✅ Agent can use manifest to understand asset structure
7. ✅ All data persists in browser across sessions
8. ✅ Project is portfolio-quality code

---

## Post-v1 Ideas (Not for MVP)

### Phase 2.0: Advanced Features
- [ ] Batch regeneration by category
- [ ] Asset editing/modification UI
- [ ] Animation sequence builder
- [ ] Tileset collision map generation
- [ ] Sprite sheet layout customization

### Phase 3.0: 3D Assets
- [ ] 3D model generation
- [ ] Texture map generation
- [ ] Normal map generation
- [ ] Model optimization

### Phase 4.0: Monetization
- [ ] User accounts
- [ ] Cloud storage (Vercel Postgres)
- [ ] Paid hosting tier
- [ ] Pro features (advanced batch processing, priority generation)

### Phase 5.0: Community
- [ ] Asset library / gallery
- [ ] Template sharing
- [ ] Plugin system
- [ ] Community models

---

## Project Repository Structure

```
game-make/
├── .github/
│   ├── workflows/          # CI/CD
├── app/
│   ├── api/
│   │   ├── agent/         # CopilotKit agent handler
│   │   ├── projects/      # Project CRUD endpoints
│   │   ├── memory/        # Memory file operations
│   │   └── generation/    # Image generation proxy
│   ├── components/
│   │   ├── planning/      # Planning phase UI
│   │   ├── style/         # Style anchoring UI
│   │   ├── generation/    # Generation phase UI
│   │   ├── export/        # Export UI
│   │   └── common/        # Shared components
│   ├── lib/
│   │   ├── db.ts          # Dexie database setup
│   │   ├── api-client.ts  # API utilities
│   │   ├── prompt-gen.ts  # Prompt generation
│   │   └── utils.ts       # General utilities
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/dashboard
├── public/
│   └── assets/            # Static images
├── docs/
│   ├── SETUP.md           # Setup instructions
│   ├── API.md             # API documentation
│   └── USER_GUIDE.md      # User documentation
├── .env.example           # Environment template
├── next.config.ts         # Next.js config
├── tsconfig.json
├── tailwind.config.ts
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## Getting Started

To begin implementation:

1. **Read all specifications** (you're doing this!)
2. **Confirm technology choices** (NextJs 15, CopilotKit, Dexie, etc.)
3. **Set up project repository** on GitHub
4. **Initialize Next.js 15 project** with TypeScript
5. **Start Phase 0** (foundation setup)
6. **Build iteratively** through phases 1-5
7. **Test end-to-end** at each phase
8. **Deploy to Vercel** after Phase 6

---

## Estimated Timeline

- **Phase 0:** 1-2 weeks (foundation)
- **Phase 1:** 1-2 weeks (planning agent)
- **Phase 2:** 1 week (style anchoring)
- **Phase 3:** 1-2 weeks (generation)
- **Phase 4:** 3-5 days (export)
- **Phase 5:** 3-5 days (project management)
- **Phase 6:** 1-2 weeks (polish and deploy)

**Total:** 6-9 weeks for MVP

**With part-time development:** 3-4 months realistic timeline

---

## Questions to Resolve Before Starting

1. What's your target launch date?
2. Do you want to code this yourself or get help?
3. Any specific game engines you want to optimize for? (Godot, Unity, custom)
4. Should v1 support custom game types, or stick with templates?
5. Do you want user accounts from the start, or local-only?
