# Architecture

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React + TypeScript |
| Backend | Express + TypeScript |
| Database | MongoDB + Prisma ORM |
| State | Zustand + Immer |
| Validation | Zod |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions |

## Project Structure

```
omega/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/       # Express API server
├── packages/
│   ├── shared/       # Shared errors, logger, utilities
│   ├── types/        # Shared TypeScript types
│   └── config/       # Environment validation
├── store/            # Zustand state management
├── tests/            # Unit + integration tests
├── lib/              # Legacy utilities
└── .github/          # CI/CD workflows
```

## Request Lifecycle

```
Client → CORS → Rate Limit → Helmet → Body Parse
      → Route → Auth Guard → Zod Validate
      → Controller → Service → Prisma → MongoDB
      → Response Helper → Client

      (error at any step) → errorHandler → Client
```

## Error Handling Strategy

All errors flow through `errorHandler` middleware.

- Use `asyncHandler` to wrap all async routes
- Throw typed errors from `@omega/shared/errors`
- Never throw raw `new Error()` in routes
- The `errorHandler` handles: Zod errors, Prisma errors, JWT errors, AppErrors, and unknown errors
- Unknown errors never leak details to the client in production

## Adding a New Route

1. Create `apps/server/src/routes/myFeature.ts`
2. Create Zod schema for validation
3. Register in `apps/server/src/routes/api.ts`
4. Add integration test in `tests/integration/`

## Adding a New API Endpoint

```typescript
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

const router = Router();

const schema = z.object({
  body: z.object({ name: z.string().min(1) }),
});

router.post(
  '/',
  validate(schema),
  asyncHandler(async (req, res) => {
    const item = await prisma.project.create({
      data: { name: req.body.name, userId: req.user!.userId },
    });
    sendSuccess(res, { item }, 201);
  }),
);

export { router as myFeatureRouter };
```
