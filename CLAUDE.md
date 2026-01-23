# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for bimbelbeta.id - an Indonesian SNBT/UTBK exam preparation platform. The architecture follows a Turborepo monorepo pattern with a TanStack Start frontend, Hono backend, and shared packages.

## Development Commands

### Core Development
- `bun run dev` - Start all applications (web on :3000, server on :3001)
- `bun run dev:web` - Start only web app
- `bun run dev:server` - Start only server
- `bun run build:packages` - IMPORTANT! Must build all packages after changing because workspaces depend on built files
- `bun run build` - Build all applications
- `bun run check-types` - TypeScript type checking
- `bun run lint:fix --unsafe` - Biome linting

### Database
- `bun run db:push` - Push schema changes to database (development)
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Run migrations
- `bun run db:seed` - Seed database
- `bun run db:reset` - Reset database (down, up, push, seed)

### Infrastructure
- `bun run db:start` / `bun run db:stop` - Start/stop local PostgreSQL via Docker
- `bun run db:watch` - Run Docker in foreground
- `bun run db:down` - Stop and remove containers

## Architecture

### Monorepo Structure
```
apps/
  web/          # TanStack Start frontend (React SSR)
  server/       # Hono backend API (Bun runtime)
packages/
  api/          # API routers, middleware, business logic
  auth/         # Better-Auth configuration
  db/           # Drizzle ORM schema and queries
  config/       # Shared TypeScript config
```

### API Layer (oRPC)

The project uses **oRPC** for end-to-end type-safe APIs. Key patterns:

- **Router composition** (`packages/api/src/index.ts`): Exports `pub` (public), `authed`, `premium`, `admin`, `superadmin` router builders with middleware applied
- **Context** (`packages/api/src/context.ts`): Created from Hono context, includes session from Better-Auth
- **Middlewares**: RBAC (`packages/api/src/middlewares/rbac.ts`), rate limiting
- **Base ORPC instance** (`packages/api/src/lib/orpc.ts`): Indonesian error messages defined here

To add a new router:
1. Create in `packages/api/src/routers/`
2. Export from `packages/api/src/routers/index.ts` (appRouter)
3. Use appropriate router builder (`pub`, `authed`, `admin`, etc.)

### Authentication (Better-Auth)

- Configuration in `packages/auth/src/index.ts`
- Additional user fields: `role`, `isPremium`, `premiumExpiresAt`
- Email/password + Google OAuth
- Resend for password reset emails
- Session middleware auto-expires premium status

**Frontend**: Use `authClient` from `apps/web/src/lib/auth-client.ts`
**Backend**: Session from `createContext()` via `auth.api.getSession()`

### Database (Drizzle ORM)

- Schema in `packages/db/src/schema/` - organized by domain (question, subject, tryout, transaction, university)
- Uses `snake_case` casing for database columns
- Seeding scripts in `packages/db/src/seed/`

### Frontend (TanStack Start)

- File-based routing in `apps/web/src/routes/`
- Route groups: `_authenticated.tsx` (protected routes), admin routes
- ORPC client in `apps/web/src/utils/orpc.ts` - includes queryClient with toast error handling
- Use `orpc` for API calls with TanStack Query integration

### Payment Integration

- Midtrans for payment processing
- Webhook endpoint at `/transactions/webhook` (currently stub)
- Payment flow handled in `packages/api/src/routers/transaction.ts`

## Key Patterns

### Adding a New API Endpoint
```typescript
// packages/api/src/routers/yourRouter.ts
const newRoute = authed
  .route({
    path: "/your-path",
    method: "GET",
    tags: ["YourTag"],
  })
  .handler(async ({ context }) => {
    // context.session.user available
    // use db from @bimbelbeta/db
  });
```

### Protected Route in Frontend
Use `_authenticated.tsx` layout - redirects to `/login` if no session.

### Rate Limiting
- Applied via `authedRateLimited` in API
- Two tiers: `freeRatelimiter` vs `premiumRatelimiter` (from `packages/api/src/lib/ratelimit.ts`)

## Environment Variables

Required for development (see `apps/server/.env`):
- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` - Auth configuration
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `RESEND_API_KEY` - Emails
- `CORS_ORIGIN` - Frontend URL
- `VITE_SERVER_URL` / `VITE_API_URL` - API URLs for frontend
