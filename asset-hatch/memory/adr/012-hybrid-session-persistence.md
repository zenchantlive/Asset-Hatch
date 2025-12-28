# ADR 009: Hybrid Session Persistence Strategy

## Status
Accepted

## Context
Users expect their session state (active tab, chat history, generated assets) to be preserved across page refreshes and browser sessions. The application uses a hybrid architecture with:
- **Server State (Prisma/SQLite)**: The source of truth for project metadata, memory files (plans), and authenticated user data.
- **Client Cache (Dexie/IndexedDB)**: High-performance local storage for large assets (images), style anchors, and offline-capable data.
- **Ephemeral State (React/Context)**: Immediate UI state.

We faced challenges with:
1.  **Chat Persistence**: The AI SDK's built-in persistence was inconsistent.
2.  **Plan Synchronization**: The generation queue requires server-side access to the plan (`entities.json`), but it was only being saved to Dexie.
3.  **Tab State**: The active phase (Plan/Style/Generation) needed to be URL-addressable and persisted.

## Decision
We implemented a multi-layered persistence strategy:

### 1. Tab State & URL Deep Linking
- **Source of Truth**: The URL query parameter (`?mode=...`) is the primary source of truth for the active tab (Project Phase).
- **Persistence**: 
    - **Optimistic UI**: React state updates immediately.
    - **Local DB**: Dexie `projects` table is updated instantly.
    - **Server Sync**: A background `PATCH /api/projects/[id]` request updates the `phase` field in Prisma.
    - **Restoration**: On load, if no URL param exists, the `phase` from Dexie/Prisma is used to redirect the user.

### 2. Chat Persistence (LocalStorage)
- **Mechanism**: We explicitly save the chat message array to `localStorage` (`conversation-[projectId]`) on every update.
- **Restoration**: We manually rehydrate the AI SDK's `messages` state using `setMessages` on component mount.
- **Reasoning**: This provides robust, isolated persistence per project without complex server-side chat storage overhead for now.

### 3. Plan Synchronization (Manual Upsert)
- **Mechanism**: The asset plan (`entities.json`) is saved to Dexie for local use.
- **Server Sync**: Upon plan approval, we explicitly sync the content to Prisma via a new endpoint (`POST /api/projects/[id]/memory-files`).
- **Constraint Handling**: Since the `MemoryFile` table lacks a unique constraint on `[projectId, type]`, we implemented a **manual upsert** (Find -> Update/Create) logic in the API route to prevent duplicate records.

### 4. Asset Approval State (Dexie)
- **Mechanism**: Generated assets are saved to Dexie (`generated_assets` table).
- **Restoration**: The `GenerationQueue` component queries Dexie on mount to find assets with `status: 'approved'` and restores them to the UI state.

## Consequences
### Positive
- **Seamless UX**: Users can refresh or share links and return to the exact same state.
- **Performance**: Heavy assets load from IndexedDB; metadata loads from server/URL.
- **Robustness**: Manual sync ensures critical data (plans) exists where needed (server for API generation flow).

### Negative
- **Complexity**: State is duplicated across three layers (URL, Dexie, Prisma, LocalStorage), increasing sync complexity.
- **Manual Maintenance**: We must manually ensure all layers stay in sync (e.g., updating both Dexie and Prisma).
- **Schema Debt**: The lack of a unique constraint on `MemoryFile` requires manual handling in API routes until a migration fixes the schema.
