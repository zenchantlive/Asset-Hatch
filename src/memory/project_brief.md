# 📋 Project Brief - Asset Hatch

**Project Name:** Asset Hatch
**Version:** 0.3.0 (Security & Logic Hardening)
**Last Updated:** 2025-12-28
**Status:** Phase 3 (Generation) - Individual Asset Workflow Complete, Multi-User Hardened

---

## 🎯 Mission Statement

**Asset Hatch** is an AI-powered game asset planning and generation tool that helps indie game developers go from idea to production-ready sprite sheets without needing an artist.

### Core Value Proposition
- **For:** Indie game developers, solo devs, hobbyists
- **Who Need:** Game assets (sprites, tiles, UI elements)
- **Our Product:** AI-guided asset planning → style anchoring → generation → export
- **Unlike:** Generic AI art generators (MidJourney, DALL-E)
- **We Provide:** Game-specific workflows, consistent style, sprite sheet outputs

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS v4 (with oklch colors)
- **UI Library:** shadcn/ui + Radix UI primitives
- **Theme:** Premium Dark / Cosmic theme (Glassmorphism + Aurora gradients)
- **Typography:** Modern Sans-Serif (Outfit) + Geometric Headings (Space Grotesk) via next/font

### AI Integration
- **Chat Framework:** Vercel AI SDK v6 (@ai-sdk/react)
- **LLM Provider:** OpenRouter (google/gemini-3-pro-preview)
- **Image Generation:** OpenRouter (black-forest-labs/flux.2-pro, flux.2-pro)
- **Vision Analysis:** OpenRouter (GPT-4o for style extraction)

### Data & State
- **Server Database:** Prisma with SQLite (source of truth)
- **Client Cache:** Dexie.js (IndexedDB wrapper) for offline/fast access
- **State Management:** React hooks + Context API
- **Hybrid Persistence:** Dual-write pattern for projects, style anchors

### Development
- **Package Manager:** Bun (user preference)
- **Language:** TypeScript (strict mode)
- **Version Control:** Git
- **Hosting:** Vercel (planned)

---

## 🧭 Product Phases (Slices)

### Phase 1: Planning (Slices 1-4) - **✅ Complete**
- Create project → Chat with AI → Define qualities → Generate asset plan
- **Status:** All planning tools working, plan generation functional

### Phase 2: Style Anchor (Slices 5-8) - **✅ Complete**
- Define style keywords → Generate reference image → Approve → Style locked
- **Status:** Flux.2 image generation working, StylePreview displays image
- **Key Feature:** AI-generated style anchor via OpenRouter Flux.2

### Phase 3: Generation (Slices 9-12) - **🟢 85% Complete**
- Queue assets → Generate via Flux.2 → Preview → Refine → Approve
- **Status:** Backend complete, UI components built, integration pending

### Phase 4: Export (Slices 13-15) - **🔴 Not Started**
- Organize → Generate sprite sheets → Download zip
- **Status:** Not started

---

## 🚫 Non-Negotiables

### Design Principles
1. **Game Designer Mental Model First**
   - Use game dev terminology (Pixel Art, Hand-painted 2D, Vector/Flat)
   - NOT artist terms (Watercolor, Oil Painting)

2. **AI-Assisted, Not AI-Automated**
   - User always in control
   - AI suggests, user decides

3. **Consistency Over Variety**
   - Style anchor ensures all assets match
   - Cohesive sprite sheets, not random images

4. **Fast Iteration**
   - 3 clicks max from idea to preview
   - No unnecessary forms

### Technical Constraints
1. **Hybrid Persistence**
   - Prisma/SQLite server-side (source of truth)
   - Dexie client-side (cache, offline support)

2. **Token Limit Awareness**
   - Large base64 images never sent through LLM context
   - Client fetches images via separate API endpoints

3. **Performance**
   - 60fps animations
   - <2s page loads
   - useRef for preventing infinite loops in effects

---

## 🎨 Design System

### Visual Language
- **Theme:** Premium Dark / Cosmic system
- **Colors:** Deep violet/blue background with vibrant aurora accents (oklch)
- **Effects:** Backdrop-blur (xl), subtle borders, SVG noise texture
- **Typography:** Outfit (primary font), geometric and modern
- **Layout:** Balanced 50/50 split workspace for Planning phase

### Component Hierarchy
- **Primitives:** Button, Input, Select, Dialog
- **Composed:** ChatInterface, QualitiesBar, PlanPreview, StylePreview
- **Layouts:** Two-column split, sticky headers, glass panels

---

## 📊 Success Metrics

### MVP Goals
- [x] Create project in <30 seconds
- [x] Generate asset plan via chat in <2 minutes
- [x] AI generates style anchor reference image
- [x] UI feels polished (animations, colors visible)
- [x] No critical bugs in planning/style phases

### Long-Term Goals
- Generate 100 assets in <10 minutes
- Export sprite sheet with metadata
- Support multiple projects
- Community-shared templates

---

## 🔑 Recent Technical Decisions (ADRs)

- **ADR-010:** API Route Consolidation (Chat/Projects/Memory)
- **ADR-011:** UI Refinements and Data Sync
- **ADR-012:** Hybrid Session Persistence (Extended)
- **ADR-013:** Security Hardening - OAuth and Phase Consistency

---

**Last Reviewed By:** Antigravity AI
**Next Review:** Generation Queue Integration Phase
