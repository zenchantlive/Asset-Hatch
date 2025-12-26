# Asset Hatch Development Kickoff - Ready to Begin!

---

## 🎯 Current Status

All phases are updated and ready for implementation. The project now has:
- ✅ 8 detailed phase files with ~245 total tasks
- ✅ Smart storage strategy (WebP compression, lazy loading, per-project monitoring)
- ✅ Spec-aligned task descriptions (matching original docs)
- ✅ Critical validation gates identified (especially Phase 4's 20+ asset consistency check)

---

## 📋 Phase Overview & Timeline

| Phase | Name | Duration | Priority | Dependencies |
|--------|-------|----------|----------|-------------|
| [01](phases/01-FOUNDATION.md) | Foundation | 1 week | HIGH | None |
| [02](phases/02-PLANNING.md) | Planning Interface | 1 week | HIGH | Phase 0 complete |
| [03](phases/03-STYLE.md) | Style Anchoring | 0.5 week | HIGH | Phase 1 complete |
| [04](phases/04-GENERATION_MINIMAL.md) | Generation (Minimal) | 1 week | HIGH | Phase 2 + specs reviewed |
| [05](phases/05-GENERATION_FULL.md) | Generation (Full) | 1 week | CRITICAL | Phase 3 complete, 20+ validation |
| [06](phases/06-EXPORT.md) | Export & Manifest | 0.5 week | MEDIUM | Phase 4 complete |
| [07](phases/07-PROJECT_MANAGEMENT.md) | Project Management | 0.5 week | MEDIUM | Phase 5 complete |
| [08](phases/08-POLISH_DEPLOY.md) | Polish & Deployment | 1 week | MEDIUM | Phase 6 complete |

**Total Duration:** 6.5-7 weeks (solo dev, part-time)
**Total Tasks:** ~245 checkboxes across 8 phases

---

## 🎯 Week 1: Foundation Phase

**Start Here First** - This phase is your runway. Everything else depends on it.

**Your Goals:**
1. Set up Next.js 15 + TypeScript project
2. Install all dependencies (CopilotKit, Dexie, Zod, shadcn/ui)
3. Configure environment variables
4. Create IndexedDB schema matching specs EXACTLY
5. Build project dashboard that works
6. Create empty phase pages (placeholders)

**Key Success Criteria:**
- ✅ Can create project from dashboard
- ✅ Can see project in list after creation
- ✅ Can delete a project
- ✅ Can navigate to /project/[id]/planning page
- ✅ IndexedDB persists data across browser refresh
- ✅ All TypeScript interfaces match `02-TECHNOLOGY_STACK.md`
- ✅ Environment variables configured correctly

**Critical:**
- Don't rush past this phase. If CopilotKit integration is problematic, we can't fix it easily without the foundation.

---

## 🚧 Week 2: Planning Phase

**Your Goal:** Build the AI-powered planning interface.

**Key Components:**
1. **CopilotKit Integration** (Day 1-2)
   - Set up `useCopilotChatHeadless_c` for chat
   - Configure `/api/copilotkit` route
   - Verify OpenRouter (Gemini 2.5 Pro) connectivity

2. **3 Agent Tools** (Day 3-4)
   - `updateQuality()` - updates project.json qualities
   - `addEntityToPlan()` - adds to entities.json
   - `markPlanComplete()` - enables phase transition

3. **UI Components** (Day 5-7)
   - ChatInterface with message display
   - QualitiesBar (dropdowns for all quality settings)
   - PlanPreview (shows entities by category)

4. **State Management** (Day 8)
   - ProjectContext with live IndexedDB queries
   - useCopilotReadable hooks for context sharing

**Success Criteria:**
- Agent asks clarifying questions, infers qualities
- Dropdowns update from tool calls
- Plan builds in real-time
- Conversation persists
- Can approve plan and navigate to style phase

**Reference Docs:**
- `04-PLANNING_AGENT.md` - Tool specifications, prompts, examples
- `02-TECHNOLOGY_STACK.md` - Dexie schema, CopilotKit integration

---

## 🎨 Week 2.5: Style Phase

**Your Goal:** Build style anchoring system with image analysis.

**Key Components:**
1. **Image Upload** (Day 1)
   - Drag-drop interface
   - Image preview
   - WebP compression (using image-compressor.ts)

2. **Analysis** (Day 2-3)
   - ColorThief for dominant colors
   - Gemini 2.5 Vision API for style description
   - Visual rules generation

3. **Style Management** (Day 3)
   - StyleEditor component
   - Style anchor JSON structure (matching specs)
   - Locking mechanism

**Success Criteria:**
- Can upload image and see preview
- System extracts colors (5-8 HEX codes)
- Gemini generates coherent style description
- Style is locked and saved to IndexedDB

**Reference Docs:**
- `03-STYLE.md` (this phase file)
- `08-HANDBOOK_INTEGRATION.md` - Style anchor integration

---

## 🎯 Week 3-4: Generation Phase

**Your Goal:** Build Flux.2 image generation with consistency validation.

**Key Components:**
1. **Meta-Prompt Builder** (Week 3)
   - Template functions for all asset types
   - Word order priority (first 5 words = highest weight)
   - Style anchor injection

2. **OpenRouter Integration** (Week 3)
   - `/api/generation` route
   - Flux.2 Dev model (black-forest-labs/flux-2-dev)
   - Streaming response handling

3. **Generation Logic** (Week 3)
   - Single asset generation
   - Asset preview with approve/regenerate
   - generation-log.json recording

4. **Full System** (Week 4 - CRITICAL PATH)
   - Batch generation queue
   - Character registry system
   - Seed tracking
   - **20+ asset consistency validation** 🚨 THIS IS YOUR MAKE-OR-BREAK POINT

5. **Progress & Controls** (Week 4)
   - Progress bar with ETA
   - Start/Pause/Resume/Stop buttons
   - Storage monitoring (warn at 80%, block at 95%)

**Success Criteria:**
- Generate 5-10 test assets
- **CRITICAL:** Generate 20+ test assets and validate visual consistency
- If inconsistent: iterate prompt engineering
- If consistent after iterations: proceed to export
- All assets use WebP compression
- generation-log.json records everything

**Reference Docs:**
- `07-FLUX2_PROMPT_ENGINEERING.md` - Prompt engineering principles
- `08-HANDBOOK_INTEGRATION.md` - Handbook application
- `04-GENERATION_MINIMAL.md` & `05-GENERATION_FULL.md` - These phase files

---

## 📦 Week 5: Export Phase

**Your Goal:** Package everything into AI-readable format.

**Key Components:**
1. **Manifest Generation**
   - Complete project metadata
   - All assets by category with full details
   - Validated JSON structure

2. **ZIP Packaging**
   - Organized folders (characters/, environment/, props/, ui/, icons/)
   - README.md with usage instructions

3. **Download**
   - Browser download trigger
   - Correct filename format

**Success Criteria:**
- ZIP downloads successfully
- Extracted structure is correct
- manifest.json is parseable
- README.md explains usage

**Reference Docs:**
- `06-EXPORT.md` (this phase file)

---

## 🗂️ Week 5.5: Project Management Phase

**Your Goal:** Handle storage limits, archiving, and project lifecycle.

**Key Components:**
1. **Smart Storage** (from revised plan)
   - Per-project storage usage display
   - WebP compression (60% reduction)
   - Lazy blob loading (don't load everything into memory)
   - 80%/95% warning thresholds
   - Critical blocking at 95%

2. **Archive Flow**
   - Export + remove from IndexedDB
   - Reimport capability from ZIP
   - "Archive project" prominent action

3. **Navigation**
   - Phase indicator (Planning → Style → Generation → Export)
   - Backward navigation with warnings
   - Forward navigation (no warnings)

**Success Criteria:**
- Can manage multiple projects (2-3 active in browser)
- Can archive old projects to free space
- Storage warnings work correctly
- Can navigate between phases safely

**Reference Docs:**
- `07-PROJECT_MANAGEMENT.md` (this phase file)

---

## ✨ Week 6: Polish & Deployment

**Your Goal:** Production-ready application with comprehensive testing and deployment.

**Key Components:**
1. **Loading States**
   - Skeletons for all lists
   - Consistent loading animations
   - Spinners for operations

2. **Error Handling**
   - Error boundaries
   - User-friendly error messages
   - Retry logic
   - Toast notifications

3. **Responsive Design**
   - Mobile (< 640px)
   - Tablet (640px - 1024px)
   - Desktop (> 1024px)
   - Collapsible sidebar on mobile

4. **Testing**
   - End-to-end flow tests (all phases, all game types)
   - Error scenario tests
   - Performance testing (100+ images)
   - Cross-browser tests

5. **Deployment**
   - Vercel configuration
   - Environment variables
   - Production deployment
   - README.md completion

**Success Criteria:**
- TypeScript strict mode (no `any`)
- All features tested end-to-end
- Deployed to Vercel and accessible
- Complete documentation
- No critical bugs

**Reference Docs:**
- `08-POLISH_DEPLOY.md` (this phase file)

---

## 🔑 Risk Management

### Top 5 Risks (from Architecture Plan)

| Rank | Risk | Probability | Impact | Mitigation Strategy |
|-------|-------|------------|--------|-----------------|
| **1** | Visual consistency across 20+ assets | Medium | Critical | **Week 4 validation with 20+ assets before proceeding.** If inconsistent: iterate prompt engineering, increase style anchor weight. |
| **2** | IndexedDB 50MB limit | Medium | High | ✅ **MITIGATED:** WebP compression (60% reduction), per-project monitoring, lazy loading, archive flow. Users can have 2-3 projects (15-30MB). If approaching limit: prompt archive. |
| **3** | Solo founder burnout | Low | Critical | ⏱️ **TIMEBOX:** 2 weeks max per phase. Stop and reassess if blocked. Ship incrementally. Quality over perfection. |
| **4** | Prompt engineering complexity | Low | Medium | ✅ **MITIGATED:** Handbook is comprehensive (07 + 08 docs). Templates provided. Follow exactly. |
| **5** | CopilotKit integration | Low | Medium | ⚠️ **VALIDATION:** Week 1 CopilotKit spike before full integration. Have fallback ready (direct OpenRouter API) if needed. |

---

## 📋 Starting Checklist

### Before You Begin:

- [ ] **REQUIREMENTS:**
  - [ ] Node.js 20+ installed
  - [ ] pnpm package manager installed
  - [ ] GitHub repository created
  - [ ] OPENROUTER_API_KEY available (save in .env.local)

- [ ] **READING (1-2 hours estimated):**
  - [ ] README.md (this file)
  - [ ] 01-PRODUCT_OVERVIEW.md (what we're building)
  - [ ] 02-TECHNOLOGY_STACK.md (tech architecture)
  - [ ] 04-PLANNING_AGENT.md (how tools work)
  - [ ] 07-FLUX2_PROMPT_ENGINEERING.md (prompt engineering)
  - [ ] 08-HANDBOOK_INTEGRATION.md (how to apply handbook)

- [ ] **PHASE PLANNING:**
  - [ ] Review all 8 phase files
  - [ ] Understand overall timeline (6-7 weeks)
  - [ ] Identify dependencies between phases
  - [ ] **MARK CRITICAL GATES:**
    - [ ] Week 4: Phase 4 complete AND 20+ assets generated and validated for consistency
    - [ ] Week 1: Foundation complete

- [ ] **DECISION CONFIRMATION NEEDED:**
  - [ ] Target launch date? (affects scope decisions)
  - [ ] Comfortable with 6-8 weeks? Or need to scale back MVP?

### Phase 0 Tasks (Foundation - Your Starting Point):

Day 1-2: **Project Setup**
- [ ] Initialize Next.js 15 with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install dependencies (CopilotKit, Dexie, Zod, shadcn/ui, JSZip, ColorThief)
- [ ] Run `pnpm install`
- [ ] Create .env.local with OPENROUTER_API_KEY

Day 3-4: **Database & Layout**
- [ ] Create `app/lib/db.ts` with exact TypeScript interfaces from specs
- [ ] Initialize Dexie database with version 1
- [ ] Create root layout with header and sidebar
- [ ] Set up basic routing structure
- [ ] Add 404 page

Day 5: **Project Dashboard**
- [ ] Create `app/page.tsx` (project list)
- [ ] Implement project listing from IndexedDB
- [ ] Create "New Project" button
- [ ] Create project card component
- [ ] Add delete button with confirmation modal
- [ ] Test create/list/delete

Day 7: **Empty Phase Pages**
- [ ] Create placeholder pages for planning/style/generation/export
- [ ] Add navigation structure

---

## 🎯 First Week Actions (Foundation + Start Planning)

Once you complete Phase 0, immediately start Phase 1 with these actions:

### Week 1 Day 8-10: **Planning Phase Start**
- [ ] Create `app/contexts/ProjectContext.tsx` (don't overbuild)
- [ ] Create `app/components/planning/ChatInterface.tsx` (simple, functional)
- [ ] Create `app/components/planning/QualitiesBar.tsx` (use CopilotKit tools)
- [ ] Create `app/components/planning/PlanPreview.tsx` (read entities.json, display)
- [ ] Set up CopilotKit provider in layout
- [ ] Configure CopilotKit runtime URL

### Week 2 Day 1-2: **CopilotKit API Route**
- [ ] Create `app/api/copilotkit/route.ts`
- [ ] Import `serve` from `@copilotkit/sdk`
- [ ] Define 3 tools matching `04-PLANNING_AGENT.md` specs:
  - [ ] `updateQuality(quality, value, confidence)`
  - [ ] `addEntityToPlan(category, name, description, specifications)`
  - [ ] `markPlanComplete()`
- [ ] Connect tools to IndexedDB operations
- [ ] Test each tool independently

### Week 2 Day 3-5: **Tool Handlers**
- [ ] Implement `updateQuality` handler:
  - [ ] Write to project.json memory file
  - [ ] Update project metadata in IndexedDB
  - [ ] Return success response with updated quality
- [ ] Implement `addEntityToPlan` handler:
  - [ ] Read entities.json
  - [ ] Append new entity to array
  - [ ] Generate unique entity ID
  - [ ] Save back to IndexedDB
  - [ ] Return success with entity ID
- [ ] Implement `markPlanComplete` handler:
  - [ ] Update project phase to 'style'
  - [ ] Set updated_at timestamp
  - [ ] Return success

### Week 2 Day 6-7: **Conversation Persistence**
- [ ] Create conversations table in IndexedDB
- [ ] Save user messages (role: "user", content, timestamp)
- [ ] Save assistant messages (role: "assistant", content, timestamp)
- [ ] Load conversation on page load
- [ ] Test persistence across page refresh

---

## 🚦 CRITICAL PATH: Consistency Validation (Week 4)

**This is your make-or-break point.** Before moving to Phase 5 (Export), you MUST complete this validation.

**When to do:** After Phase 3 (Minimal Generation) is working.

**What to generate:**
- 5 character sprites (idle, walk, attack animations)
- 5 environment tiles (tileset with edges/corners)
- 5 UI elements (buttons, panels, backgrounds)
- 5 icons (items, abilities, status effects)

**What to validate:**
- Colors match palette from style anchor
- Art style consistent across all assets
- Lighting is uniform per category
- Characters maintain proportions and design across animations
- Tileset edges match seamlessly

**If inconsistent:**
1. Increase style anchor weight in prompts
2. Add more specific HEX codes directly to elements
3. Add "exact same character design" phrases for character prompts
4. Add "maintain proportions" phrases for sprite sheets
5. Retest until consistent

**Only proceed to Phase 5 when:**
- [ ] 20+ assets generated
- [ ] **ALL show strong visual consistency**
- [ ] You document findings in Phase 4 notes
- [ ] If needed, you iterate prompt engineering 1-3 times

---

## 🚨 Known Limitations & Constraints

1. **Storage:** 50MB IndexedDB limit
   - ✅ **Solution:** WebP compression (60% reduction), lazy loading, archive flow
   - **Reality:** Users can have 2-3 active projects (15-30MB each)
   - **Workaround:** Archive projects when not actively working

2. **CopilotKit:** New framework, learning curve
   - ✅ **Mitigation:** Week 1 has tools + API route separate
   - **Fallback:** Direct OpenRouter API integration if CopilotKit problematic

3. **Flux.2 Dev:** Model quality unknown until tested
   - ✅ **Mitigation:** Week 3 generates 5-10 test assets first
   - **Fallback:** Can switch to Flux.2 Flex/Pro or other models if needed

4. **Scope:** MVP features only
   - Phase 1-3: Core workflow only
   - Phase 4-6: No niceties unless time permits
   - Focus: working features > polished UI

---

## 📊 Tracking & Progress Updates

Use these to track your progress:

**Phase Progress:**
- [ ] Phase 0: [ /25 ]
- [ ] Phase 1: [ /25 ] / 50 ] / 75 ] / 100
- [ ] Phase 2: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 3: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 4: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 5: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 6: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 7: [ /25 ] / 50 ] / 75 ] / 100%
- [ ] Phase 8: [ /25 ] / 50 ] / 75 ] / 100%

**Daily Updates:**
- Mark tasks complete as you finish them
- Add notes/obstacles to phase files as you encounter them
- Track blockers and decisions

---

## 🎯 Decision Points Requiring Input

Before starting, please confirm:

### 1. Target Launch Date
- [ ] **6-8 weeks** - Full MVP as planned
- [ ] **< 6 weeks** - Cut features (templates, archive flow, responsive design)
- [ ] **10+ weeks** - Add niceties (full accessibility suite, more game types)

**Which timeline works for you?**

### 2. Testing Strategy
- [ ] **Minimal automated tests** - Only for critical business logic (prompt builder)
- [ ] **Strong manual testing** - Create explicit test plan, check off each test case
- [ ] **No integration tests** - Too complex to maintain for solo dev
- [ ] **Performance benchmarks** - Test with 100+ images

**Do you agree?**

### 3. Critical Consistency Threshold
- [ ] **What's your tolerance for visual inconsistency?**
- [ ] **Perfectionist:** Regenerate until pixel-perfect
- [ ] **Pragmatic:** 2-3 iterations max, then document as known limitation
- [ ] **User-driven:** Let you decide if quality is "good enough"

**What's your approach?**

---

## 📚 Key Reference Documents

During development, keep these docs open:

1. **`02-TECHNOLOGY_STACK.md`** - Database schemas, API structure
2. **`03-ASSET_TYPES_TEMPLATES.md`** - What assets to generate
3. **`04-PLANNING_AGENT.md`** - Tool specifications and examples
4. **`07-FLUX2_PROMPT_ENGINEERING.md`** - Prompt engineering formulas
5. **`08-HANDBOOK_INTEGRATION.md`** - Handbook application in code
6. **Phase files in `phases/`** - Your task lists with checkboxes

---

## ✅ Ready to Start?

**You are ready if:**
- [ ] OPENROUTER_API_KEY is configured and available
- [ ] You've read key reference docs (1-2 hours)
- [ ] You understand the 6-7 week timeline
- [ ] You accept the 50MB IndexedDB constraint with smart management strategy
- [ ] You're prepared to start with Phase 0

**When ready:**
1. Update Phase 0 start date
2. Begin Day 1 tasks (project initialization)
3. Work through Phase 0 tasks systematically
4. Check off tasks as you complete them
5. When Phase 0 is done: Update Phase 1 start date, begin Week 2

---

## 🚀 First Goal: Reach Phase 4's 20+ Asset Validation

**This is your critical path validation.**

- Week 1: Foundation (1 week)
- Week 2: Planning (1 week)
- Week 2.5: Style (0.5 week)
- Week 3: Minimal Generation (1 week)
- **Week 4: Full Generation + Consistency Validation (1 week)** ← **CRITICAL GATE**
- Week 5: Export (0.5 week)
- Week 6: Project Management (0.5 week)
- Week 7: Polish & Deployment (1 week)

**If you reach Week 4's consistency validation and 20+ assets look good, you're ready to ship. If they don't, you have a fundamental problem (prompt engineering, model quality, or architectural approach).**

---

## 💡 Pro Tips for Solo Development

1. **Test incrementally** - Don't batch all features then test. Test as you build.
2. **Use phase files as your guide** - They're detailed for a reason. Mark tasks complete as you do them.
3. **Document blockers immediately** - Add notes to phase files. Don't push through.
4. **Re-evaluate at week 3** - Check timeline reality. Adjust scope if needed.
5. **Keep it simple** - Production quality > clever optimizations.
6. **Sleep on hard problems** - Sometimes stepping away reveals the solution.
7. **Ship early and iterate** - MVP that works is better than perfect code you never ship.

---

**You have everything you need. The specs are detailed, the phases are broken down, the architecture is sound, the risks are identified and mitigated.**

**Ready when you are! 🚀**
