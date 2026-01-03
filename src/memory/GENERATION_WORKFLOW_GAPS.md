# Generation Workflow - Outstanding Implementation Needs

**Last Updated:** 2025-12-27
**Status:** Phase 3 (Generation) - Core Infrastructure Complete, User Features Pending

---

## ✅ What's Working

1. **GenerationQueue Component** - Loads plan from Prisma API without 404 errors
2. **Asset Tree** - Hierarchical display of assets from parsed plan
3. **Individual Asset Generation** - Generate, approve/reject, and save workflow complete
4. **Asset Approval System** - AssetApprovalCard with image preview and metadata
5. **Assets Panel** - View all approved assets with regeneration capability
6. **Prompt Generation** - Real-time prompt building with style anchor and project data
7. **API Endpoints** - `/api/generate` using shared OpenRouter utility with style anchor
8. **Memory Files System** - FilesPanel shows entities.json and style-draft
9. **Full-Width Generation Tab** - Chat hidden, dedicated generation workspace

---

## 🚧 Critical Missing Features

### 1. **Prompt Generation & Preview** ⚠️ HIGH PRIORITY

**Current State:**
- Asset cards show "Prompt preview will appear here" placeholder
- No prompt generation happening
- User has no way to view/edit prompts before generation

**Required Implementation:**

#### A. Prompt Generation on Demand
```typescript
// In AssetCard or GenerationQueue context
const generatePrompt = (asset: ParsedAsset) => {
  // Use buildAssetPrompt from lib/prompt-builder.ts
  const prompt = buildAssetPrompt(asset, {
    styleAnchorId: project.styleAnchorId,
    qualityParams: project.qualities,
  })
  return prompt
}
```

**User Flow:**
1. User navigates to Generation tab
2. Assets load in tree/queue view (already working)
3. User clicks "Generate Prompt" button on asset card
4. System calls `buildAssetPrompt()` from `lib/prompt-builder.ts`
5. Prompt appears in preview area (expandable/editable)
6. User can edit prompt before generation
7. User clicks "Generate Asset" to start image generation

**Files to Modify:**
- `components/generation/AssetCard.tsx` - Add "Generate Prompt" button
- `components/generation/AssetCard.tsx` - Add prompt preview/edit area
- `components/generation/GenerationQueue.tsx` - Wire up prompt generation logic
- `hooks/useBatchGeneration.ts` - Accept custom prompts in `startBatch()`

---

### 2. **Generation Tab UI Layout** ⚠️ HIGH PRIORITY

**Current State:**
- Generation tab shares 50/50 split with chat interface on left
- Chat interface is still visible in Generation mode
- Not ideal for focused generation workflow

**Required Implementation:**

**Target Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Generation Tab (Full Width)                        │
├──────────────────────┬──────────────────────────────┤
│ Asset Queue (Left)   │ Generation Progress (Right)  │
│                      │                              │
│ [Asset Tree]         │ [Current Asset Preview]      │
│ [Asset Cards]        │ [Generation Log]             │
│ [Batch Controls]     │ [Cost Estimate]              │
│                      │ [Download Button]            │
└──────────────────────┴──────────────────────────────┘
```

**Changes Needed:**

1. **Planning Page Layout Update** (`app/project/[id]/planning/page.tsx`)
   ```typescript
   // Current:
   <div className="flex-1 flex">
     <div className="w-1/2">
       <ChatInterface />  {/* Always visible */}
     </div>
     <div className="w-1/2">
       {mode === 'generation' && <GenerationQueue />}
     </div>
   </div>

   // Required:
   {mode === 'generation' ? (
     <GenerationQueue projectId={projectId} />  {/* Full width */}
   ) : (
     <div className="flex-1 flex">
       <div className="w-1/2"><ChatInterface /></div>
       <div className="w-1/2">{/* Plan/Style views */}</div>
     </div>
   )}
   ```

2. **GenerationQueue Internal Layout** (`components/generation/GenerationQueue.tsx`)
   ```typescript
   // Already has correct 50/50 split internally:
   <div className="flex-1 flex">
     <div className="w-1/2"><AssetTree /></div>
     <div className="w-1/2"><GenerationProgress /></div>
   </div>
   ```

**Files to Modify:**
- `app/project/[id]/planning/page.tsx` - Conditional layout rendering

---

### 3. **User Authentication & Project History** ✅ COMPLETE

**Current State:**
- Auth.js v5 Integrated (GitHub + Credentials)
- Database schema updated with User/Account/Session
- User Dashboard created (`/dashboard`)
- Server-side route protection active

**(Previous Implementation Plan below is now realized)**

#### A. Auth.js (NextAuth) Integration

**Setup:**
```bash
bun add next-auth @auth/prisma-adapter
```

**Configuration:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### B. Prisma Schema Updates

**Add User Model:**
```prisma
model User {
  id            String    @id @default(uuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  projects      Project[]  // Link projects to user
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Update existing Project model
model Project {
  id              String   @id @default(uuid())
  userId          String   // NEW - Link to user
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... existing fields ...
}
```

#### C. User Dashboard

**New Route:** `app/dashboard/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  // Fetch user's projects
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      memoryFiles: true,
      styleAnchors: true,
      generatedAssets: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="container mx-auto p-8">
      <h1>Your Projects</h1>
      <ProjectGrid projects={projects} />
    </div>
  )
}
```

**Features:**
- Grid/list view of all user projects
- Filter by phase (planning, style, generation, export)
- Search by project name
- Click to resume project at current phase
- Delete project functionality
- Export project data

#### D. Project Resume Functionality

**Required Data Sync:**
```typescript
// When user opens a project from dashboard
const resumeProject = async (projectId: string) => {
  // 1. Fetch project from Prisma
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      memoryFiles: true,
      styleAnchors: true,
      generatedAssets: true,
    },
  })

  // 2. Sync to Dexie (client-side cache)
  await db.projects.put(project)
  await db.memory_files.bulkPut(project.memoryFiles)
  // ... sync other related data

  // 3. Navigate to project planning page
  router.push(`/project/${projectId}/planning?mode=${project.phase}`)
}
```

**Files to Create:**
- `app/api/auth/[...nextauth]/route.ts` - Auth configuration
- `app/dashboard/page.tsx` - User dashboard
- `components/dashboard/ProjectGrid.tsx` - Project list display
- `components/dashboard/ProjectCard.tsx` - Individual project card
- `lib/sync.ts` - Prisma ↔ Dexie sync utilities

**Files to Modify:**
- `prisma/schema.prisma` - Add User, Account, Session models
- `app/layout.tsx` - Add session provider
- `app/page.tsx` - Redirect to dashboard if authenticated
- All API routes - Check authentication before operations

---

## 📋 Implementation Priority

### Phase 3A: Generation Core (COMPLETE ✅)
1. ✅ Fix GenerationQueue 404 errors (COMPLETE)
2. ✅ Create FilesPanel for plan viewing (COMPLETE)
3. ✅ Wire up prompt generation on-demand (COMPLETE)
4. ✅ Add prompt preview/edit UI (COMPLETE)
5. ✅ Connect "Generate Image" button to actual image generation (COMPLETE)
6. ✅ Fix Generation tab layout (remove chat, full-width queue) (COMPLETE)
7. ✅ Individual asset approval workflow (COMPLETE)
8. ✅ Assets panel for viewing approved assets (COMPLETE)

### Phase 3B: Polish & UX (NEXT)
7. Add cost estimation display
8. Add batch progress percentage
9. Add individual asset retry buttons
10. Add download ZIP functionality

### Phase 4: Authentication & Multi-User ✅ COMPLETE
11. ✅ Integrate Auth.js with GitHub OAuth (Hardened: disabled dangerous linking)
12. ✅ Update Prisma Schema with User model
13. ✅ Create User Dashboard
14. ✅ Implement project resume functionality (via Dashboard)
15. ✅ Standardize phase/mode strings across all layers (ADR 013)

---

## 🔧 Technical Debt to Address

1. **Dexie ↔ Prisma Sync Strategy**
   - Currently manual dual-writes
   - Need automated sync on auth/project load
   - Need conflict resolution strategy

2. **Project Phase State Management**
   - Phase transitions should update both Dexie and Prisma
   - Standardized on `'planning'` everywhere to simplify logic

3. **Error Boundary Components**
   - Add error boundaries around major components
   - Graceful degradation for API failures

---

## 📊 Current Completion Status

| Feature | Status | Priority |
|---------|--------|----------|
| Plan Loading (Fixed 404) | ✅ 100% | CRITICAL |
| Files Panel | ✅ 100% | HIGH |
| Prompt Generation | ✅ 100% | CRITICAL |
| Generation Tab Layout | ✅ 100% | CRITICAL |
| Individual Asset Generation | ✅ 100% | CRITICAL |
| Asset Approval Workflow | ✅ 100% | CRITICAL |
| Assets Panel | ✅ 100% | HIGH |
| Style Anchor Integration | ✅ 100% | HIGH |
| Auth.js Setup | ✅ 100% | CRITICAL |
| User Dashboard | ✅ 100% | HIGH |
| Project History | ✅ 100% | HIGH |
| Security Hardening | ✅ 100% | CRITICAL |
| Batch Generation API | ✅ 80% | MEDIUM |
| Cost Estimation | ⏳ 0% | MEDIUM |

**Overall Status:**
- **Generation Phase:** 85% Complete
- **Security & Consistency:** 100% Complete ✅
- **Auth & Dashboard:** 100% Complete ✅

