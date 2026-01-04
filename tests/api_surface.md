# API Surface Inventory

## Endpoints

### Auth
- `GET/POST /api/auth/[...nextauth]`
    - **Handler**: Auth.js core handler
    - **Auth**: None (Public)
    - **Dependencies**: Database (User/Account tables), Providers (Google, etc.)

- `POST /api/auth/register`
    - **Auth**: None (Public)
    - **Params**: `email`, `password`, `name`
    - **Dependencies**: Database (User creation)

### Projects
- `GET /api/projects`
    - **Auth**: Required
    - **Dependencies**: Database (Prisma)
    - **Response**: List of projects for user

- `POST /api/projects`
    - **Auth**: Required
    - **Params**: `name` (string, required)
    - **Dependencies**: Database (Prisma)

- `GET /api/projects/[id]`
    - **Auth**: Required
    - **Dependencies**: Database

- `GET /api/projects/[id]/memory-files`
    - **Auth**: Required
    - **Dependencies**: Database, File System (maybe?)

### Assets
- `GET /api/assets/[id]`
    - **Auth**: Required
    - **Dependencies**: Database

- `POST /api/generated-assets`
    - **Auth**: Required
    - **Params**: Asset creation data
    - **Dependencies**: Database

### Generation
- `POST /api/generate`
    - **Auth**: Required
    - **Params**: `prompt`, `style`, `settings` (likely)
    - **Dependencies**: OpenAI/OpenRouter API, Database

- `POST /api/generate-style`
    - **Auth**: Required
    - **Dependencies**: AI Provider

- `POST /api/analyze-style`
    - **Auth**: Required
    - **Dependencies**: AI Provider (Vision)

- `POST /api/style-anchor`
    - **Auth**: Required
    - **Dependencies**: Database?

- `GET /api/style-anchors`
    - **Auth**: Required

### System / Utils
- `GET /api/chat`
    - **Auth**: Required (likely)
    - **Dependencies**: AI Provider (Streaming)

- `GET /api/export`
    - **Auth**: Required
    - **Dependencies**: Blob storage or generation

- `GET /api/settings`
    - **Auth**: Required
    - **Dependencies**: Database

- `GET /api/generation/sync-cost`
    - **Auth**: Required
    - **Dependencies**: Database?

## Dependencies Matrix
| Dependency | Usage |
|Data Store| Postgres (via Prisma)|
|Auth| Auth.js (NextAuth)|
|AI Provider| OpenAI / OpenRouter (via AI SDK)|
|Storage| Local / Blob (not fully confirmed)|

## Notes
- Most endpoints require authentication via session.
- AI endpoints will need mocking of the AI SDK or OpenAI API.
- Database calls are via Prisma, need test DB or mocking.
