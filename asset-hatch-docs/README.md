# Asset Hatch - Complete Specification Index

## Overview

This is the complete specification for **Asset Hatch**, an open-source AI-powered game asset creation studio. All documents are organized below with descriptions and reading order recommendations.

---

## Quick Start Reading Order

1. **Start here:** `00-UPDATES_SUMMARY.md` — What changed from previous planning
2. **Understand:** `01-PRODUCT_OVERVIEW.md` — What Asset Hatch is
3. **Deep dive:** `02-TECHNOLOGY_STACK.md` — How it works technically
4. **Plan assets:** `03-ASSET_TYPES_TEMPLATES.md` — What you can create
5. **Understand agents:** `04-PLANNING_AGENT.md` — How the AI guides you
6. **See workflows:** `05-WORKFLOW_USER_FLOWS.md` — How you use it
7. **Build it:** `06-IMPLEMENTATION_ROADMAP.md` — Development timeline
8. **Generate prompts:** `07-FLUX2_PROMPT_ENGINEERING.md` — How Flux.2 works
9. **Integrate:** `08-HANDBOOK_INTEGRATION.md` — How it all fits together

---

## Document Descriptions

### 00-UPDATES_SUMMARY.md
**Length:** 5 KB | **Read Time:** 10 minutes

**What it covers:**
- Project name change: Game Make → Asset Hatch
- Image model change: Nano Banana → Flux.2 Dev (via OpenRouter)
- Impact on architecture and implementation
- Why Flux.2 Dev was chosen
- All 9 documents updated or created

**Read this if:** You want a quick overview of what changed and why

---

### 01-PRODUCT_OVERVIEW.md
**Length:** 6 KB | **Read Time:** 15 minutes

**What it covers:**
- What Asset Hatch is and what it solves
- The consistency problem in AI-generated game art
- Core value propositions (consistency, completeness, agent-friendly exports, conversational interface)
- Target users (AI-assisted developers, indie devs, game jam participants)
- The 4-phase workflow
- Key features
- Success metrics

**Read this if:** You want to understand the product and its value proposition

---

### 02-TECHNOLOGY_STACK.md
**Length:** 12 KB | **Read Time:** 25 minutes

**What it covers:**
- Complete tech stack (Next.js 15, CopilotKit, Flux.2 Dev, IndexedDB)
- Architecture diagrams
- Memory system structure (project files, JSON storage)
- Database design (IndexedDB schema)
- API routes and endpoints
- Deployment strategy (local dev → Vercel production)
- External dependencies
- Security and environment variables
- Performance and scalability considerations

**Read this if:** You're building Asset Hatch or want to understand the technical architecture

---

### 03-ASSET_TYPES_TEMPLATES.md
**Length:** 13 KB | **Read Time:** 30 minutes

**What it covers:**
- 5 asset categories: Characters, Environment, Props, UI, Icons
- Detailed specs for each category
- 7 game type templates (Platformer, RPG, Puzzle, Farming, Visual Novel, Action, Fighting)
- Baseline assets for each game type
- Quality parameters and dropdown options
- Dynamic dropdown behavior with custom input
- Asset generation patterns (single, sprite sheet, batch, multi-sheet)

**Read this if:** You want to understand what assets can be created

---

### 04-PLANNING_AGENT.md
**Length:** 18 KB | **Read Time:** 40 minutes

**What it covers:**
- Planning agent role and personality
- 4-phase conversation flow (Vision → Clarification → Plan Building → Completion)
- Three agent tools: updateQuality(), addEntityToPlan(), markPlanComplete()
- Required quality settings
- Handling edge cases
- Complete agent system prompt
- Example planning sessions

**Read this if:** You're building the planning interface or want to understand how the AI agent works

---

### 05-WORKFLOW_USER_FLOWS.md
**Length:** 13 KB | **Read Time:** 30 minutes

**What it covers:**
- Complete 4-phase workflow (Planning → Style → Generation → Export)
- Detailed explanation of each phase
- Complete user journeys (new project, template, existing project, editing)
- Phase transition logic and warnings
- Time estimates for each phase
- Error handling and recovery
- Future API/MCP considerations

**Read this if:** You want to understand the user experience and workflow

---

### 06-IMPLEMENTATION_ROADMAP.md
**Length:** 13 KB | **Read Time:** 30 minutes

**What it covers:**
- 6-phase development timeline (Foundation → Planning → Style → Generation → Export → Polish)
- Detailed tasks for each phase
- MVP feature checklist
- Technology setup checklist
- Key decisions ahead
- Success criteria for v1
- Post-v1 ideas
- Repository structure
- Estimated timeline (6-9 weeks for MVP)

**Read this if:** You're planning to build Asset Hatch and need a development roadmap

---

### 07-FLUX2_PROMPT_ENGINEERING.md
**Length:** 20 KB | **Read Time:** 45 minutes

**What it covers:**
- Flux.2 Dev strengths and characteristics
- Prompt templates by asset type
- Universal formula and word order priority
- Style control keywords
- Lighting keywords and specifications
- Perspective/view keywords
- Color control with HEX codes
- Sprite sheet generation patterns
- Tileset generation
- UI element and icon templates
- Meta-prompt system for Asset Hatch
- Model selection strategy
- Common pitfalls and solutions
- Batch generation patterns
- API integration examples

**Read this if:** You're building the generation phase or need to understand Flux.2 prompting

---

### 08-HANDBOOK_INTEGRATION.md
**Length:** 20 KB | **Read Time:** 45 minutes

**What it covers:**
- How Flux.2 Pro Prompting Handbook integrates with Asset Hatch
- Handbook concepts translated to implementation
- Decision tree mapping (asset type → template)
- Planning to prompt generation flow
- Style anchor system based on handbook
- Color control integration
- Lighting keywords application
- Animation frame consistency
- Tileset pattern guidance
- Text rendering for UI
- Character registry and consistency
- Seed control for reproducibility
- Prompt length optimization
- Common pitfall prevention
- Quality keywords application
- Complete example flow from planning to generation

**Read this if:** You want to understand how the Flux.2 handbook is integrated into Asset Hatch's system

---

## Document Statistics

```
Total Documents: 9
Total Pages: ~130 pages equivalent
Total Words: ~65,000 words
Total Size: 124 KB

Reading Time (Complete):
- Quick skim: 2-3 hours
- Thorough read: 4-5 hours
- Implementation study: 8-10 hours
```

---

## Navigation Guide

### For Different Roles

**Product Manager:**
→ Read: 00, 01, 05, 06

**Frontend Developer:**
→ Read: 02, 04, 05, 06

**Backend/AI Engineer:**
→ Read: 02, 04, 06, 07, 08

**Full Stack Developer:**
→ Read: All (in order 00-08)

**Game Developer (User):**
→ Read: 01, 03, 05

**AI/ML Engineer:**
→ Read: 07, 08, then 02, 04

---

## Key Decisions Made

### Architecture
- ✅ Next.js 15 with TypeScript
- ✅ CopilotKit for agent framework
- ✅ IndexedDB for local storage
- ✅ OpenRouter for LLM + image models

### Models
- ✅ gemini 3 Pro for planning LLM
- ✅ **Flux.2 Dev as primary image generation** (changed from Nano Banana)
- ✅ Support for Flux.2 Flex/Pro/Max as options
- ✅ OpenRouter unified API

### Workflow
- ✅ 4-phase: Planning → Style → Generation → Export
- ✅ Conversational planning with AI agent
- ✅ Style anchoring via reference image
- ✅ Live preview during generation
- ✅ Project persistence across sessions

### Scope
- ✅ v1: 2D assets only
- ✅ Open source from day one
- ✅ AI-agent-first design (but human UI first)
- ✅ Portfolio-quality implementation

---

## Major Concepts

### The 4-Phase Workflow
1. **Planning:** Conversational AI helps define assets needed
2. **Style:** Upload/generate visual reference image
3. **Generation:** AI generates all assets based on plan + style
4. **Export:** Download complete project with manifest

### Memory System
- Project-specific JSON files for context
- Style anchor locked after phase 2
- Character registry for consistency
- Generation log for reproducibility

### Consistency Through Context
- Style anchor image passed to Flux.2
- Project memory sent with each generation
- Character descriptions fully included every time
- Seed tracking for reproducible results

### The Meta-Prompt System
- Takes user specifications + style anchor
- Transforms into optimized Flux.2 prompts
- Applies handbook principles automatically
- Removes forbidden words, converts negative framings
- Validates prompt length and structure

---

## File Locations

All specification files are located in:
```
/home/claude/game-make-spec/
├── 00-UPDATES_SUMMARY.md
├── 01-PRODUCT_OVERVIEW.md
├── 02-TECHNOLOGY_STACK.md
├── 03-ASSET_TYPES_TEMPLATES.md
├── 04-PLANNING_AGENT.md
├── 05-WORKFLOW_USER_FLOWS.md
├── 06-IMPLEMENTATION_ROADMAP.md
├── 07-FLUX2_PROMPT_ENGINEERING.md
└── 08-HANDBOOK_INTEGRATION.md
```

---

## Key Files to Reference During Development

| Phase | Documents | Key Sections |
|-------|-----------|--------------|
| **Setup** | 02, 06 | Tech stack, Phase 0 tasks |
| **Planning UI** | 04, 06 | Agent spec, Phase 1 tasks |
| **Style Phase** | 02, 05, 06 | Style anchor, Phase 2 tasks |
| **Generation** | 07, 08, 06 | Flux.2 prompts, Phase 3 tasks |
| **Export** | 05, 06 | Manifest structure, Phase 4 tasks |
| **Project Mgmt** | 05, 06 | Phase resumption, Phase 5 tasks |

---

## Environmental Considerations

### Development
- Required: `OPENROUTER_API_KEY`
- Uses: Flux.2 Dev (fastest, cheapest)
- Storage: IndexedDB (local browser)

### Production
- Future: User authentication
- Future: Database (Vercel Postgres)
- Model: Can select based on quality/cost tradeoff

---

## Success Criteria

✅ **MVP Success:**
1. User can describe game and get structured plan
2. User can upload style reference and lock consistency
3. User can generate 50+ assets that match each other
4. User can download complete project with manifest
5. All data persists across sessions
6. Code is portfolio quality

---

## Next Steps

### To Build Asset Hatch:
1. Read all documents (focus: 02, 04, 06, 07, 08)
2. Set up project repository
3. Initialize Next.js 15 + dependencies
4. Follow Phase 0 in roadmap (foundation)
5. Proceed through Phases 1-6 sequentially
6. Test end-to-end at each phase
7. Deploy to Vercel

### To Understand Asset Hatch:
1. Read documents in order 00-01-05
2. Skim 02-03 for architecture/assets
3. Reference others as needed

### To Prompt for Assets:
1. Read 07-FLUX2_PROMPT_ENGINEERING.md
2. Use templates provided
3. Reference handbook integration (08) for advanced tips

---

## Questions?

Refer to specific documents:
- **"What is Asset Hatch?"** → 01
- **"How do I build it?"** → 06
- **"How do I use it?"** → 05
- **"How does it generate prompts?"** → 07, 08
- **"What's the tech stack?"** → 02
- **"What changed?"** → 00
- **"What assets can I make?"** → 03
- **"How does the AI agent work?"** → 04

---

## Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|-------------|--------|
| 00-UPDATES_SUMMARY | 1.0 | 2025-01-15 | Complete |
| 01-PRODUCT_OVERVIEW | 1.0 | 2025-01-15 | Complete |
| 02-TECHNOLOGY_STACK | 1.0 | 2025-01-15 | Complete |
| 03-ASSET_TYPES_TEMPLATES | 1.0 | 2025-01-15 | Complete |
| 04-PLANNING_AGENT | 1.0 | 2025-01-15 | Complete |
| 05-WORKFLOW_USER_FLOWS | 1.0 | 2025-01-15 | Complete |
| 06-IMPLEMENTATION_ROADMAP | 1.0 | 2025-01-15 | Complete |
| 07-FLUX2_PROMPT_ENGINEERING | 1.0 | 2025-01-15 | Complete |
| 08-HANDBOOK_INTEGRATION | 1.0 | 2025-01-15 | Complete |

All documents are complete and ready for development.

---

**Asset Hatch v1 Specification - Complete ✅**
