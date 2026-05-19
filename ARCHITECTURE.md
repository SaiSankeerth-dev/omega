# Omega Architecture

## Overview

Omega is a monorepo-based SaaS foundation built with modern JavaScript/TypeScript tooling. It follows a clean separation of concerns between frontend, backend, shared code, UI primitives, and configuration.

```
┌─────────────────────────────────────────────────────────────┐
│                        Apps                                 │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │    apps/web     │  │  apps/server   │                    │
│  │  (Next.js 16)   │  │   (Bun API)    │                    │
│  └────────┬───────┘  └───────┬────────┘                    │
│           │                  │                              │
├───────────┼──────────────────┼──────────────────────────────┤
│           │     Packages     │                              │
│           ▼                  ▼                              │
│  ┌─────────────────────────────────────────┐               │
│  │           packages/shared                │               │
│  │     (Types, interfaces, constants)       │               │
│  └─────────────────────────────────────────┘               │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │   packages/ui   │  │ packages/config │                   │
│  │ (UI primitives) │  │  (env, config)  │                   │
│  └────────────────┘  └────────────────┘                    │
├─────────────────────────────────────────────────────────────┤
│                     Shared Libraries                        │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  lib/errors     │  │ lib/api-client  │                   │
│  │ (Error system)  │  │  (Fetch wrapper)│                  │
│  └────────────────┘  └────────────────┘                    │
│  ┌────────────────┐                                         │
│  │   store/        │                                         │
│  │ (Zustand state) │                                         │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Decisions

### Monorepo with npm Workspaces

**Why:** A monorepo provides shared tooling, unified versioning, and easy cross-package imports. npm workspaces are lightweight and require no additional tooling.

### MongoDB with Prisma

**Why:** MongoDB provides flexible document storage ideal for SaaS applications. Prisma provides type-safe database access, auto-generated queries, and a familiar relational-like schema definition for MongoDB documents.

### Zustand for State Management

**Why:** Zustand is lightweight, TypeScript-friendly, and supports slice patterns for clean separation of concerns. Unlike Redux, it requires minimal boilerplate.

### Zod for Validation

**Why:** Zod provides runtime validation with TypeScript type inference, making it ideal for environment variable validation and API request validation.

## Data Flow

```
User → Next.js App → API Client → API Server → Prisma → MongoDB
         ↓
      Zustand Store
         ↓
      UI Components
```

## State Architecture

Each Zustand store slice is responsible for a specific domain:

- **auth:** User session, authentication status
- **editor:** Current document content, dirty state
- **ui:** Theme, sidebar, modals, mobile menu
- **ai:** Chat messages, processing state, session management

## Error Handling

All errors flow through the centralized error system:

1. **API Layer:** Errors are caught and formatted as `ApiError` instances
2. **Server Middleware:** Errors are caught and returned as standardized JSON responses
3. **API Client:** Errors are transformed into `ApiClientError` instances
4. **Frontend:** `ErrorBoundary` catches unhandled React errors

## Configuration

Environment variables are validated at startup using Zod schemas in `packages/config`. Invalid configurations cause immediate startup failure with clear error messages.

## Testing Strategy

- **Unit Tests:** Pure logic, utilities, and API client
- **Component Tests:** UI primitives and components
- **Integration Tests:** API endpoints and data flow

## Security Considerations

- JWT-based authentication
- CORS configured for frontend URL
- Environment validation preventing misconfiguration
- No sensitive data in client-side code
