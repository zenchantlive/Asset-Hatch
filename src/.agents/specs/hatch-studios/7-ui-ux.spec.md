# UI/UX Specification

**Status:** Draft  
**Dependencies:** 1-hatch-studios-architecture.spec.md  
**Implements PRD Section:** 11

---

## 1. Purpose

Defines the visual design, component layouts, navigation flows, and responsive behavior for Hatch Studios. Desktop-first with mobile support.

---

## 2. Requirements

### 2.1 Functional Requirements

- FR-001: Two-panel layout (chat + workspace)
- FR-002: Resizable panels
- FR-003: Tab navigation (Preview | Code | Assets)
- FR-004: Clear visual feedback during generation
- FR-005: Navigation between Studio and Asset Hatch
- FR-006: Code tab hidden by default, prominent toggle

### 2.2 Non-Functional Requirements

- NFR-001: Desktop-first (1280px+ optimal)
- NFR-002: Tablet usable (768px+)
- NFR-003: Mobile is **ideation-only** (chat for brainstorming, no game preview)
- NFR-004: Consistent with Asset Hatch design language
- NFR-005: Dark mode by default
- NFR-006: **Use relative units (rem, %, vh/vw)** - pixels only for borders/shadows

---

## 3. Technical Design

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [← Asset Hatch] [Game Name ▾] [Preview | Code | Assets] [Export]│
├───────────────────────────────┬─────────────────────────────────┤
│                               │                                  │
│  CHAT PANEL                   │  WORKSPACE PANEL                │
│  (35% width, resizable)       │  (65% width)                    │
│                               │                                  │
│  ┌─────────────────────────┐ │  ┌───────────────────────────┐  │
│  │                         │ │  │                           │  │
│  │   Message Thread        │ │  │   [Active Tab Content]    │  │
│  │                         │ │  │                           │  │
│  │   - User messages       │ │  │   Preview: Game iframe    │  │
│  │   - AI responses        │ │  │   Code: Monaco editor     │  │
│  │   - Tool indicators     │ │  │   Assets: Asset browser   │  │
│  │                         │ │  │                           │  │
│  └─────────────────────────┘ │  └───────────────────────────┘  │
│                               │                                  │
│  ┌─────────────────────────┐ │  [Play] [Pause] [Restart] [⛶]   │
│  │ Message Input           │ │                                  │
│  └─────────────────────────┘ │                                  │
│                               │                                  │
├───────────────────────────────┴─────────────────────────────────┤
│  FOOTER (optional)                                               │
│  [Status: Generating...] [Last saved: 2 min ago]                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Components

#### StudioHeader
```typescript
interface StudioHeaderProps {
  gameName: string;
  onNameChange: (name: string) => void;
  activeTab: 'preview' | 'code' | 'assets';
  onTabChange: (tab: string) => void;
  showCodeTab: boolean;       // Hidden by default
  onToggleCodeTab: () => void;
}
```

#### ChatPanel
- Reuses patterns from Asset Hatch ChatInterface
- Shows tool execution inline ("🔧 Creating scene...")
- Message input with generation indicator

#### PreviewTab
```typescript
interface PreviewTabProps {
  gameId: string;
  sceneId: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onFullscreen: () => void;
}
```

- Sandboxed iframe
- Play controls overlay
- Performance monitor (FPS badge)
- Error display

#### CodeTab
```typescript
interface CodeTabProps {
  code: string;
  onChange: (code: string) => void;
  isReadOnly: boolean;
  onRun: () => void;
}
```

- Monaco editor
- Babylon.js syntax highlighting
- "Run" button to apply changes
- Diff indicator when AI has pending changes

#### AssetsTab
- Grid of asset thumbnails
- Search/filter bar
- Click to view details
- "Use in Game" action
- "Create New" → navigates to Asset Hatch

### 3.3 Navigation Flows

**Main Flows:**

```
Homepage
  │
  ├─ "Create Game" → /studio/new
  │                    │
  │                    ├─ Start from scratch
  │                    └─ Start from Asset Hatch project
  │
  └─ Game list → /studio/[id]
                    │
                    ├─ Work on game
                    │
                    └─ "Need new asset" → Asset Hatch
                                            │
                                            └─ Create asset → Return to Studio
```

**Mode Switch:**
```
Studio                          Asset Hatch
┌──────────┐                    ┌──────────┐
│ Workspace │ ← "Back to game" ← │ Planning │
│          │                    │          │
│          │ → "Create asset" → │          │
└──────────┘                    └──────────┘

URL params preserve context:
/project/[id]/planning?returnTo=studio&studioId=xxx
```

### 3.4 Responsive Breakpoints

| Breakpoint | Layout | Purpose |
|------------|--------|---------|  
| Desktop (80rem+) | Full 2-panel | Full creation |
| Tablet (48-80rem) | 2-panel, narrower chat | Full creation |
| Mobile (<48rem) | Chat-only | **Ideation mode** |

> **Mobile = Ideation Only**: Users can brainstorm game ideas via chat, but cannot preview/edit games. Phone-specific game creation (with dedicated prompts) is a future feature.

Mobile layout:
```
┌─────────────────────────┐
│ [Chat] [Ideas]          │  ← Simple tabs
├─────────────────────────┤
│                         │
│  Chat for brainstorming │
│  "Describe your game"   │
│                         │
│  [Switch to desktop to  │
│   see your game]        │
│                         │
└─────────────────────────┘
```

### 3.5 Spacing & Sizing (Relative Units)

**Rule: No pixels except for borders/shadows.**

| Use Case | Unit | Example |
|----------|------|---------|  
| Font sizes | rem | `font-size: 1rem` |
| Spacing | rem | `padding: 1rem 1.5rem` |
| Container widths | % | `width: 35%` |
| Max widths | rem | `max-width: 80rem` |
| Heights | vh/% | `height: 100vh` |
| Borders | px | `border: 1px solid` |
| Shadows | px | `box-shadow: 0 2px 4px` |

```css
/* ✅ Good */
.chat-panel {
  width: 35%;
  min-width: 20rem;
  padding: 1rem;
}

/* ❌ Bad */
.chat-panel {
  width: 400px;
  padding: 16px;
}
```

### 3.5 Visual States

**Generation State:**
- Pulsing border on chat panel
- "Thinking..." indicator in message thread
- Tool execution badges

**Error State:**
- Red banner in preview
- Error message with "Fix" action
- Code highlighted if parsing error

**Success State:**
- Green flash on preview update
- "✓ Updated" toast

---

## 4. Interface Contract

### 4.1 CSS Variables

```css
/* Studio-specific, extends Asset Hatch theme */
--studio-panel-bg: hsl(var(--card));
--studio-panel-border: hsl(var(--border));
--studio-preview-bg: #1a1a1a;
--studio-code-bg: #1e1e1e;
```

### 4.2 Reused Components

From Asset Hatch:
- `ChatInterface` pattern (adapted)
- `Button`, `Card`, `Tabs` from shadcn/ui
- `cn()` utility for Tailwind

---

## 5. Implementation Notes

1. **Dark mode default** - Game previews look better dark
2. **Monaco lazy load** - Dynamic import to reduce bundle
3. **Paneel resize** - Use `react-resizable-panels`
4. **Asset Hatch styling** - Maintain visual consistency
5. **Glassmorphism** - Match existing aesthetic

---

## 6. Verification Criteria

### 6.1 Must Test (TDD - Write First)

N/A - UI verified manually

### 6.2 Manual Verification

- [ ] 2-panel layout renders correctly
- [ ] Panel resizing works
- [ ] Tab navigation works
- [ ] Preview iframe displays game
- [ ] Code tab shows/hides correctly
- [ ] Mobile layout switches appropriately
- [ ] Navigation to/from Asset Hatch works

### 6.3 Integration Check

- [ ] Chat messages display correctly
- [ ] Tool execution shows indicators
- [ ] Assets appear in browser

---

## 7. Open Questions

None - ready for review.
