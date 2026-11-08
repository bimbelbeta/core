# Agent Guidelines — bimbelbeta

### Docs

- Issues and specs live in GitHub Issues for `bimbelbeta/core`. See `docs/agents/issue-tracker.md`.
- Triage uses the five default labels. See `docs/agents/triage-labels.md`.
- This repo uses a single-context layout. See `docs/agents/domain.md`.

### Workflow

- Custom hooks for reusable logic in `hooks/`
- Don't clear `.turbo` or cache dirs
- No prop drilling — use context (Tanstack Query/Router) or zustand
  - NEVER prop drill useQuery results. Call useQuery in child again — auto-cached, no duplicate requests
- NEVER add comments — code self-documenting
- **CRITICAL**: Run `bun build:packages` after API route changes (packages/api/src/features/*) — regenerates type defs for web/server apps
- Run `bun lint:fix` and `bun check-types` when done

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

### API Layers

See `docs/adr/0001-feature-sliced-api-layers.md`.

- One folder per domain feature holding its router handlers, its service, and its repository. `lib/` is cross-cutting only
- **Repository**: the only layer that touches the DB. A factory bound to a client (`db` or a transaction), so a transaction is threaded by construction. Returns rows or `undefined`; never throws a domain error
- **Service**: the only layer that holds business rules. Receives its repository as a dependency, throws the domain error
- **Router handler**: the only layer that knows oRPC. Calls a service and holds no error handling
- Cross-feature: import another feature's repository, never its service
- Middleware is router layer: may import repositories, never services, and holds no business rules

### Error Messages

- **Indonesian** for all user-facing errors, consistent across routers
- Arktype handles input validation at contract level; no ad-hoc `if` checks in handlers

### Pagination

- **All list endpoints: cursor-based pagination**, `{ items, pageInfo }` response
- Use `buildIdCursorPage` / `parseIdCursor` from `@/lib/pagination/cursor`
- Fetch `limit + 1`, extra item → `hasNextPage`/`hasPreviousPage`

### File Structure

```
packages/api/src/features/
  feature-name/
    router.ts        # Member-facing handlers
    admin-router.ts  # Admin-facing handlers
    service.ts       # Business rules + wired singleton
    repository.ts    # DB access, client-bound factory
packages/api/src/routers/
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

## Lessons

- When optimizing package builds, keep generated dts: the team prefers it for faster type inference and LSP performance when editing files.
- When restructuring package imports, keep the `@/` alias; relative file paths are bad for code structure.

- When writing form labels, keep the bold text to the field name; optional markers, defaults, and explanations go in muted hints, never inside the label text.
- When building admin dialogs, follow the form-dialog standard: no Batal (X/overlay closes), two-column label-left rows via AdminFieldRow, xs buttons, text-base title, and capped width (sizes carry sm:max-w defaults).
- When moving form actions into the page header, only do it where an Edit toggle exists (save replaces Edit in place); forms without one (create pages, inline settings) keep their actions at the bottom.
- When identifying a reference screenshot, read the selected tab and page content before correcting the user.

### Design constraints (do not violate)

- Admin font is **Lexend** (`@fontsource-variable/lexend`, `--font-sans`). Never override the admin font stack (e.g. via `admin-shell`); font-family changes are out of bounds for any UI iteration.
