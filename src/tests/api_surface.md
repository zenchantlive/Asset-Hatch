# API Surface Inventory

This document tracks all discovered API endpoints, their methods, authentication requirements, and key dependencies.

## Core Endpoints

### Projects
| Method | Endpoint | Auth | Description | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | UI Session | Fetch all projects for user | Prisma |
| `POST` | `/api/projects` | UI Session | Create new project | Prisma, Zod |
| `GET` | `/api/projects/[id]` | UI Session | Fetch project detail | Prisma |
| `PATCH` | `/api/projects/[id]` | UI Session | Update project phase | Prisma, Zod |
| `DELETE` | `/api/projects/[id]` | UI Session | Delete project | Prisma |

### Assets & Generation
| Method | Endpoint | Auth | Description | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/generate` | None (Token?) | Generate asset image | OpenRouter, Prisma |
| `POST` | `/api/style-anchors` | None | Create style anchor | Prisma |
| `GET` | `/api/assets/[id]` | UI Session | Fetch generated asset | Prisma |

### Intelligence & Chat
| Method | Endpoint | Auth | Description | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | UI Session | Agentic chat with tools | AI SDK, OpenRouter, Prisma |

### Export
| Method | Endpoint | Auth | Description | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/export` | UI Session | Export approved assets as ZIP | JSZip, Prisma, Plan Parser |

## Auth Details
- Uses `next-auth` (v5 beta).
- `auth()` helper used in handlers.
- `app/api/auth/[...nextauth]/route.ts` handles auth provider callbacks.

## External Dependencies
- **OpenRouter**: Used for Flux.2 and Gemini models.
- **Prisma/LibSQL**: Primary database.
- **NextAuth**: Authentication framework.
