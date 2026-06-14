# Ω Omega

**A production-grade, open-source SaaS foundation.**

Omega is a modern, scalable, monorepo-based SaaS foundation built with Next.js, MongoDB, and TypeScript. It provides a clean architecture with frontend/backend separation, shared types, UI primitives, and config validation out of the box.

---

## Architecture

```
omega/
├── apps/
│   ├── web/              # Next.js frontend application
│   └── server/           # Express API server + Prisma
├── packages/
│   ├── shared/           # Shared types, utilities, logger
│   ├── ui/               # UI primitives and components
│   └── config/           # Environment configuration & validation
├── store/                # Zustand state management
├── lib/                  # Shared libraries (errors, API client)
├── tests/                # Test suites
├── prisma/ → apps/server/prisma/
```

### Key Features

- **Monorepo Architecture** — Clean separation between apps and packages with npm workspaces
- **MongoDB + Prisma** — Type-safe database access with document-optimized models
- **Strict TypeScript** — Full strict mode for maximum type safety
- **Config Validation** — Zod-based env validation that crashes safely on misconfiguration
- **Modular State** — Zustand stores separated into auth, editor, UI, and AI slices
- **Centralized Error Handling** — Standardized API errors, logging, and frontend error boundaries
- **Responsive UI** — Mobile-first responsive system with accessible components
- **Testing Ready** — Vitest and Testing Library pre-configured
- **Free & Open Source** — No pricing, quotas, or subscriptions

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** >= 6.0 (local or remote instance)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/omega.git
cd omega
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) |
| `OWNER_EMAIL` | Admin/owner email address |

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Push schema to MongoDB

```bash
npm run db:push
```

### 6. Start development

```bash
# Start both frontend + backend concurrently
npm run dev

# Or start individually:
npm run dev:web   # Frontend only
npm run dev:server  # Backend only
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)
- Prisma Studio: `npm run db:studio`

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:web` | Start frontend dev server only |
| `npm run dev:server` | Start backend dev server only |
| `npm run build` | Build all apps for production |
| `npm run build:web` | Build frontend only |
| `npm run build:server` | Build backend only |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint all apps and packages |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check format without writing |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run typecheck:workspaces` | Typecheck all workspaces |
| `npm run typecheck:all` | Typecheck root + all workspaces |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run clean` | Remove all build artifacts |

---

## Project Structure

### Apps

#### `apps/web` — Frontend
Next.js application with app router, Tailwind CSS, and server components.

#### `apps/server` — Backend
API server with Prisma for database access and Zod for validation.

### Packages

#### `packages/shared`
Shared TypeScript types and interfaces used across the entire project.

#### `packages/ui`
Reusable UI primitives: Button, Container, Input, ErrorBoundary, VisuallyHidden.

#### `packages/config`
Environment variable validation and type-safe configuration.

### State Management

Zustand stores in `/store`:
- `auth` — Authentication state
- `editor` — Editor/document state
- `ui` — UI preferences (theme, sidebar, modals)
- `ai` — AI chat and processing state

### Libraries

- `/lib/errors` — Centralized error handling (ApiError class, factory functions, logger)
- `/lib/api-client` — Typed fetch wrapper with retry support

---

## Deployment

### Frontend (Vercel)

```bash
npm run build
# Deploy the apps/web directory to Vercel
```

### Backend

```bash
npm run build:server
# Deploy apps/server/dist to your hosting provider
```

### Environment Variables

Ensure all required environment variables are set in your production environment. The app will crash on startup with clear error messages if any required variable is missing.

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Express, Prisma 6
- **Database:** MongoDB
- **Language:** TypeScript (strict mode)
- **State:** Zustand 5
- **Validation:** Zod 3
- **Testing:** Vitest, Testing Library
- **Linting:** ESLint 9, Prettier 3

---
