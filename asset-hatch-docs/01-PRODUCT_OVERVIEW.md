# Asset Hatch - Product Overview

## What is Asset Hatch?

Asset Hatch is an open-source, AI-powered game asset creation studio designed to solve the consistency problem in AI-generated game art. It provides a dedicated UI and workflow for developers to prepare complete, visually cohesive asset packages that can be handed off to AI coding agents (like Claude Code) or used directly in traditional game development.

## The Problem We're Solving

When AI coding agents (Claude, Claude Code, etc.) attempt to build games, they hit a critical wall at visual assets:
- They either generate disconnected, one-off images with no visual consistency
- They suggest finding assets elsewhere (halting progress)
- They write placeholder code instead of actually creating art
- The resulting assets don't integrate well into a cohesive game

Asset Hatch bridges this gap by giving developers a **dedicated tool to prepare and manage game assets** before handing them to the AI agent or using them in their game engine.

## Core Value Proposition

### 1. **Consistency**
All assets visually belong together through:
- A style anchor image that guides all subsequent generations
- Project-specific memory files maintaining visual context
- Intelligent prompt engineering that enforces style rules
- Visual consistency detection and correction

### 2. **Completeness**
Get everything a game needs in one workflow:
- Characters with multiple animation states
- Environment assets (tilesets, backgrounds)
- Props and interactive objects
- UI elements (HUD, menus, buttons)
- Icons (items, abilities, status effects)

### 3. **Agent-Friendly Exports**
Manifest files make handoff to game-building AI seamless:
- Structured JSON with all asset metadata
- Frame counts, dimensions, animation specifications
- Organized folder structure
- Easy to parse programmatically

### 4. **Conversational Planning**
Natural language interface instead of complex forms:
- Describe your game in plain English
- AI asks clarifying questions one at a time
- Plan builds interactively as you chat
- Fine-grained control when you need it

## Who Uses Asset Hatch?

### Primary: AI-Assisted Game Developers
Developers using AI coding agents to build games who need consistent assets their agent can integrate.
- Comfortable with AI tools
- Want to move fast
- Need export formats that AI agents can understand
- Value consistency over perfection

### Secondary: Indie Developers & Hobbyists
Developers who want to prototype game visuals quickly without art skills.
- May not have artistic ability
- Want "good enough" assets to test gameplay
- Might replace with professional art later
- Value speed and ease of use

### Tertiary: Game Jam Participants
Developers under time pressure needing rapid asset generation.
- Have 24-72 hours for complete game
- Need assets that work together immediately
- Prioritize quantity and consistency over polish

## What Asset Hatch Is NOT

- **Not a game engine** — We generate assets, not playable games
- **Not a game builder** — We don't write game code
- **Not a general image generator** — Focused specifically on game assets
- **Not for one-off images** — Designed for complete, consistent packages
- **Not targeting AAA quality** — Indie/prototype quality aesthetic
- **Not an MCP server** — It's a standalone web application with its own UI

## The Asset Hatch Workflow

### Phase 1: Planning
User describes their game concept. AI planning agent asks clarifying questions to build a structured asset list.

### Phase 2: Style Anchoring
User provides (or generates) a test image showing desired visual style. This becomes the visual reference for all future generations.

### Phase 3: Asset Generation
AI generates complete sprite sheets and assets based on the plan, all informed by the style anchor and project context.

### Phase 4: Export
Assets are exported with manifest files containing metadata, making them ready for use in any game engine or AI agent workflow.

## Key Features

- **Conversational Interface** — Natural language planning with an AI agent
- **Style Test Image** — Single reference image ensures consistency across all assets
- **Project Memory System** — JSON/TOML files maintain context for every generation
- **Live Preview** — See assets as they're generated with approve/regenerate options
- **Fine-Grained Control** — Edit individual asset specifications within the plan
- **Manifest Export** — AI-readable JSON manifests for easy asset integration
- **Session Persistence** — All projects, conversations, and assets saved locally
- **Game Type Templates** — Quick-start templates for common game genres

## Target Scope

### v1 (MVP Focus)
- 2D asset generation
- Full planning and style anchoring workflow
- Single image generation model (Nano Banana Pro)
- Core game types (Platformer, Top-down RPG, Puzzle)
- Local development and Vercel demo deployment

### Future Versions
- 3D asset generation
- Multiple image generation models
- Additional game types
- Paid hosting option
- Community asset library
- Advanced batch generation

## Technical Philosophy

- **Open Source First** — Community-driven development
- **Self-Hostable** — Users can run locally without cloud dependency
- **Developer-Friendly** — Clean exports and documentation for integration
- **AI-Centric** — Designed for both human and AI workflows
- **Portfolio Quality** — Built to demonstrate production-level capabilities

## Success Metrics

1. **Functional** — Can generate a complete asset package for common game types
2. **Consistent** — Assets visually match within a project
3. **Usable** — Real developers can use it for real (small) games
4. **Demonstrable** — Clear before/after showing the consistency problem solved
5. **Extensible** — Others can fork and extend for their needs
