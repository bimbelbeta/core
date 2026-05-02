# Agent Guidelines — bimbelbeta

Use caveman for token efficiency. Active on all prompts.

### Workflow
- Functions <50 lines when possible
- Custom hooks for reusable logic in `hooks/`
- Don't clear `.turbo` or cache dirs
- No prop drilling — use context (Tanstack Query/Router) or zustand
  - NEVER prop drill useQuery results. Call useQuery in child again — auto-cached, no duplicate requests
- NEVER add comments — code self-documenting
- **CRITICAL**: Run `bun build:packages` after API route changes (packages/api/src/routers/*) — regenerates type defs for web/server apps
- Run `bun lint:fix` and `bun check-types` when done

## Architecture
- **Backend**: Drizzle ORM, Arktype validation, ORPC (type-safe API, contract-first)
- **Frontend**: TanStack (Router, Query, Form), shadcn

## Build Commands

```bash
bun lint              # Check (Biome)
bun lint:fix --unsafe # Auto-fix incl unsafe
bun check-types       # Type check all (build packages first)
bun build             # Build all packages + apps
bun build:packages    # Build packages only
bun db:push           # Push schema to DB
bun db:reset          # Reset DB + seed
bun db:seed           # Seed DB
bun test              # Run all tests
```

### TypeScript
- No explicit types when inferrable (biome enforced). Never `as something` annotation
- `as const` for literal types where needed

### Query Conventions
- `db.select()` for complex joins, aggregations, multi-table queries
- `db.query` (relational API) for simple nested-relation fetches (tree of related data)
- Batch updates: SQL `CASE` expressions for reorder/batch-update, not loops with individual UPDATEs
- Shared DB logic → `packages/api/src/lib/`, not router files. Only route handlers in `routers/`

### Error Messages
- **Indonesian** for all user-facing errors, consistent across routers
- Arktype handles input validation at contract level; no ad-hoc `if` checks in handlers

### Pagination
- **All list endpoints: cursor-based pagination**, `{ items, pageInfo }` response
- Use `buildIdCursorPage` / `parseIdCursor` from `@/lib/pagination/cursor`
- Fetch `limit + 1`, extra item → `hasNextPage`/`hasPreviousPage`

### File Structure
```
packages/api/src/routers/
  feature-name.ts    # Router
  index.ts           # appRouter exports
packages/db/src/schema/
  feature-name.ts    # Schema defs
apps/web/src/components/ui/
  component-name.tsx # shadcn component
apps/web/src/routes/
  _auth/             # Auth layout
  _authenticated/    # Protected routes
  -components/       # Shared route components
```