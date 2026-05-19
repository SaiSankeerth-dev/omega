# Contributing to Omega

Thank you for your interest in contributing to Omega! This document outlines the guidelines and process for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. We're building something great together.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/omega.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Workflow

1. Make your changes
2. Ensure TypeScript passes: `npm run typecheck`
3. Ensure tests pass: `npm test`
4. Ensure lint passes: `npm run lint`
5. Format your code: `npm run format`

## Code Standards

### TypeScript

- Strict mode is enabled — use proper types for everything
- No `any` types (use `unknown` if necessary)
- Prefer interfaces over type aliases for object types
- Use `const` assertions for constants

### Naming Conventions

- **Files:** kebab-case (e.g., `api-client.ts`, `error-boundary.tsx`)
- **Components:** PascalCase (e.g., `Button`, `Container`)
- **Functions:** camelCase (e.g., `getEnv`, `createApiClient`)
- **Interfaces:** PascalCase with no prefix (e.g., `User`, `ApiResponse`)
- **Types:** PascalCase with no prefix (e.g., `Theme`, `Breakpoint`)

### Project Structure

- Place frontend code in `apps/web/src/`
- Place backend code in `apps/server/src/`
- Place shared types in `packages/shared/src/`
- Place UI components in `packages/ui/src/`
- Place config validation in `packages/config/src/`
- Place tests in `tests/` mirroring the source structure

### Commit Messages

Use conventional commits:

```
feat: add user authentication
fix: resolve login redirect loop
docs: update API documentation
refactor: extract error handling middleware
test: add health endpoint tests
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all CI checks pass
4. Request review from maintainers

## Questions?

Open a GitHub Discussion or issue for any questions.
