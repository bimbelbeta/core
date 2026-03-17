# Agent Guidelines for bimbelbeta

## Token Efficiency (IMPORTANT!)

If you need to explore the codebase, avoid using the @explore tool and/or subagents at all times. Instead, spawn a new terminal session and run a Gemini CLI instance instead.

Example usage:

```zsh
gemini --prompt "Find all instances of prop drilling in this codebase."
```

Only **ever** use subagents to handover complex tasks. 

### Workflow
- Keep functions focused and under 50 lines when possible
- Use custom hooks for reusable logic in `hooks/` directories
- Do not clear `.turbo` or other cache directories
- Avoid prop drilling - use context (Tanstack Query/Router) or state management (zustand)
    - NEVER prop drill results from a useQuery hook. Just call the useQuery hook in the child component again, it automatically caches so it won't make duplicate network requests.
- NEVER add comments - code should be self-documenting
- **CRITICAL**: Run `bun build:packages` after any changes to API routes (packages/api/src/routers/*) - this regenerates type definitions used by web/server apps
- Run `bun lint:fix` and `bun check-types` after finishing your work

## Architecture Overview

- **Backend**: Drizzle ORM, Arktype validation, ORPC for type-safe API routing and contract-first approach
- **Frontend**: TanStack ecosystem (Router, Query, Form), shadcn

## Build Commands

```bash
# Linting and formatting
bun lint              # Check code with Biome
bun lint:fix --unsafe # Auto-fix with unsafe fixes

# Type checking
bun check-types       # Type check all packages (requires building packages first)

# Building
bun build             # Build all packages and apps
bun build:packages    # Build only packages (not apps)

# Database operations
bun db:push           # Push schema changes to DB
bun db:reset          # Reset database and seed
bun db:seed           # Seed database

# Testing
bun test              # Run all tests
```

## Code Style Guidelines

- **Formatting tool**: Biome (run `bun lint:fix` before committing)

### TypeScript
- **Type inference**: No explicit types when inferrable (enforced by biome). Never use `as something` annotation, this is for codebase health and maintainability.
- **As const**: Use `as const` assertions for literal types where needed
- **Imports**: Use `type` keyword for type-only imports when beneficial

### Naming Conventions
- Components: PascalCase (`UserCard`)
- Functions/variables: camelCase (`getUserProgress`)
- Types/interfaces: PascalCase (`UserProgress`)
- Constants: UPPER_SNAKE_CASE (`SESSION_DURATION`)
- Files: kebab-case for folders (`user-card/`), `index.ts` for exports

#### Pagination
- **Use cursor-based pagination** (not offset) for better performance
- Cursor uses indexed columns with `gt()`/`lt()` operators: `WHERE id > cursor ORDER BY id LIMIT N`
- Cursor type: nullable number for ID-based, nullable string (ISO date) for date-based
- Pattern: Fetch `limit + 1` items, check if has more, return `limit` items with `nextCursor`
- Bidirectional: Use `direction: "next" | "previous"` for date-based cursors
- **IMPORTANT**: Change `cursor` input from `"number = 0"` to `"number?"` when implementing cursor pagination

### Error Handling
- Client errors: Use toast from sonner (`toast.error("message")`)
- Server errors: Use ORPCError helpers in routes
- Validation: Arktype types in route definitions catch schema errors early
- Never log secrets or sensitive data

### File Structure
```
packages/api/src/routers/
  feature-name.ts    # Individual router
  index.ts           # Exports appRouter with all routes
packages/db/src/schema/
  feature-name.ts    # Schema definitions
apps/web/src/components/ui/
  component-name.tsx # shadcn UI component
apps/web/src/routes/
  _auth/             # Auth layout routes
  _authenticated/    # Protected routes
  -components/       # Shared route components
```

### Git Workflow
- Feature branches: `feature/description` or `fix/description`
- Commit messages: Conventional Commits (feat, fix, refactor, etc.)
