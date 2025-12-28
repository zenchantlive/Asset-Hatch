# 📋 Project Brief - Asset Hatch

**Project Name:** Asset Hatch
**Version:** 0.1.1 (UI Refinement & Infrastructure Fixes)
**Last Updated:** 2025-12-26
**Status:** UI Redesign Complete, Moving to AI Integration

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
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS v4 (with oklch colors)
- **UI Library:** shadcn/ui + Radix UI primitives
- **Theme:** Premium Dark / Cosmic theme (Glassmorphism + Aurora gradients)
- **Typography:** Modern Sans-Serif (Outfit) via next/font

### AI Integration
- **Chat Framework:** CopilotKit v1.50 (headless mode)
- **LLM Provider:** OpenRouter (gemini 3 Pro Preview)
- **Image Generation:** Replicate API (planned, not yet implemented)

### Data & State
- **Local Database:** Dexie.js (IndexedDB wrapper)
- **State Management:** React hooks + Context API (as needed)
- **File Storage:** Browser (IndexedDB for now, cloud planned)

### Development
- **Package Manager:** Bun (user preference, npm fallback)
- **Language:** TypeScript (strict mode)
- **Version Control:** Git
- **Hosting:** TBD (likely Vercel)

---

## 🧭 Product Phases (Slices)

### Phase 1: Planning (Slices 1-4) - **Current Phase**
- Create project → Chat with AI → Define qualities → Generate asset plan
- **Status:** Slice 3 complete, UX improvements needed

### Phase 2: Style Anchor (Slices 5-8)
- Upload reference → AI extracts style → Approve → Style locked
- **Status:** Not started

### Phase 3: Generation (Slices 9-12)
- Queue assets → Generate via Replicate → Preview → Refine → Approve
- **Status:** Not started

### Phase 4: Export (Slices 13-15)
- Organize → Generate sprite sheets → Download zip
- **Status:** Not started

---

## 🚫 Non-Negotiables

### Design Principles
1. **Game Designer Mental Model First**
   - Use game dev terminology (Pixel Art, Low-poly 3D)
   - NOT artist terms (Watercolor, 3D Painted)

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
1. **Client-Side First**
   - IndexedDB for data (no backend required)
   - Offload to cloud only when needed

2. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support

3. **Performance**
   - 60fps animations
   - <2s page loads
   - Optimistic UI updates

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
- **Composed:** ChatInterface, QualitiesBar, PlanPreview
- **Layouts:** Two-column split, sticky headers, glass panels

---

## 📊 Success Metrics

### MVP Goals
- [ ] Create project in <30 seconds
- [ ] Generate asset plan via chat in <2 minutes
- [ ] Approve plan and see placeholder style anchor
- [ ] UI feels polished (animations, colors visible)
- [ ] No critical bugs in planning phase

### Long-Term Goals
- Generate 100 assets in <10 minutes
- Export sprite sheet with metadata
- Support multiple projects
- Community-shared templates

---

**Last Reviewed By:** Antigravity AI
**Next Review:** Planning AI Integration Phase
