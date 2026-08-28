# bimbelbeta.com

Bimbelbeta is a tutoring platform monorepo. It contains the web application, API server, authentication, database schema, and shared API contracts used by the platform.

This README is the starting point for running and maintaining the project. Use the linked documentation for deeper feature and deployment details.

## Contents

- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Application URLs](#application-urls)
- [Environment Configuration](#environment-configuration)
- [Development Workflows](#development-workflows)
- [Database Operations](#database-operations)
- [Project Structure](#project-structure)
- [Feature Documentation](#feature-documentation)
- [Available Commands](#available-commands)
- [Troubleshooting](#troubleshooting)
- [Contribution Workflow](#contribution-workflow)

## Technology Stack

- **TypeScript** for type safety
- **Bun** for package management and runtime tooling
- **TanStack Start** and **TanStack Router** for the web application
- **Tailwind CSS** and **shadcn/ui** for the interface
- **Hono** for the HTTP server
- **oRPC** for type-safe API procedures and OpenAPI integration
- **Better Auth** for authentication
- **Drizzle ORM** and **PostgreSQL** for persistence
- **Turborepo** for monorepo task orchestration
- **Biome** for formatting and linting

## Prerequisites

Install the following before starting development:

- [Bun](https://bun.sh/) `1.3.2` or a compatible version
- PostgreSQL, either locally or through a hosted provider
- Git
- Docker, if you want to run PostgreSQL with the provided Compose configuration

The repository declares Bun as its package manager. Use `bun` commands instead of `npm` or `yarn` for project scripts.

## Quick Start

From the repository root (`core`):

```bash
bun install
```

Create the required environment files. At minimum, configure the PostgreSQL connection used by the server. See [Environment Configuration](#environment-configuration) and the existing environment templates or application configuration for the complete list of values required by your setup.

Start PostgreSQL, then apply the schema to a local development database:

```bash
bun run db:push
```

Seed local data when the project has seed data available:

```bash
bun run db:seed
```

Start the complete development environment:

```bash
bun run dev
```

Open the web application at [http://localhost:3000](http://localhost:3000). The API server runs at [http://localhost:3001](http://localhost:3001).

## Application URLs

| Service | Development URL |
| --- | --- |
| Web application | [http://localhost:3000](http://localhost:3000) |
| API server | [http://localhost:3001](http://localhost:3001) |
| Drizzle Studio | Started with `bun run db:studio` |

## Environment Configuration

Environment files are intentionally not committed. Configure them in the location expected by each application and package. The server needs a PostgreSQL connection string similar to:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

Depending on the features enabled in your environment, additional values may be needed for:

- Better Auth and session configuration
- OAuth providers
- Application URLs and server ports
- Midtrans or other billing integrations
- Email or external service integrations

Never commit passwords, API keys, OAuth secrets, or production connection strings. Use separate credentials for local, staging, and production environments.

## Development Workflows

### Run the applications

```bash
bun run dev
bun run dev:web
bun run dev:server
```

The first command starts the workspace applications through Turborepo. The other commands start only the web or server application.

### Validate changes

Run these checks before opening a pull request:

```bash
bun run lint
bun run check-types
bun run test
```

Biome can automatically format and fix lint issues with:

```bash
bun run lint:fix
```

### Change API contracts or routers

After changing files in `packages/contract` or `packages/api`, rebuild the packages before checking the consuming applications:

```bash
bun run build:packages
bun run check-types
```

This regenerates the package output used by the web and server applications.

### Build the project

```bash
bun run build
```

## Database Operations

The database uses PostgreSQL with Drizzle ORM. Run database commands from the repository root.

### Local development

Use `db:push` to apply the current schema directly to a local development database:

```bash
bun run db:push
```

Useful local database commands:

```bash
bun run db:start
bun run db:studio
bun run db:seed
bun run db:reset
bun run db:stop
bun run db:down
```

`db:reset` is destructive. Use it only for disposable local data.

### Production and shared databases

Do not use `db:reset` against production. Avoid using `db:push` on a live database unless the change has been reviewed and the project owner explicitly accepts the risk.

For production schema changes, generate and review a Drizzle migration, then apply it:

```bash
bun run db:generate
bun run db:migrate
```

Back up the database, verify the target connection, and test the migration before applying it to production. The [database update guide](database_update.md) contains the detailed referral-code migration procedure and manual SQL fallback.

## Project Structure

```text
core/
├── apps/
│   ├── web/          # React and TanStack Start frontend
│   └── server/       # Hono HTTP server and application entry point
├── packages/
│   ├── api/          # oRPC routers and backend business logic
│   ├── auth/         # Better Auth configuration
│   ├── config/       # Shared TypeScript configuration
│   ├── contract/     # API contracts, schemas, and error definitions
│   └── db/           # Drizzle schema, migrations, and database utilities
├── database_update.md # Detailed database migration notes
├── patch_notes.md     # Feature changes and maintenance history
└── package.json       # Workspace scripts and package manager configuration
```

Keep shared database logic in `packages/db` or `packages/api/src/lib`, API route handlers in the appropriate router, and reusable web components in `apps/web/src/components`.

## Feature Documentation

The following documents provide additional context:

- [Patch notes](patch_notes.md): implementation history, feature-specific behavior, deployment actions, and known limitations
- [Database update guide](database_update.md): production-safe schema migration instructions and referral-code SQL
- [Agent guidelines](AGENTS.md): repository conventions for API, database, frontend, validation, and build workflows

For implementation details, start with the relevant area:

- Authentication: `packages/auth` and `apps/web/src/routes/_auth`
- API contracts: `packages/contract/src/definitions`
- API routers: `packages/api/src/routers`
- Database schemas: `packages/db/src/schema`
- Frontend routes: `apps/web/src/routes`
- Shared UI: `apps/web/src/components`

## Available Commands

### Applications and builds

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start all applications in development mode |
| `bun run dev:web` | Start only the web application |
| `bun run dev:server` | Start only the API server |
| `bun run build` | Build all packages and applications |
| `bun run build:packages` | Build workspace packages with `tsdown` |
| `bun run start` | Start built applications |

### Quality checks

| Command | Purpose |
| --- | --- |
| `bun run lint` | Check formatting and lint rules with Biome |
| `bun run lint:fix` | Apply Biome fixes |
| `bun run check-types` | Check TypeScript types across the workspace |
| `bun run test` | Run the test suite |

### Database and authentication

| Command | Purpose |
| --- | --- |
| `bun run db:push` | Apply the current schema to a local database |
| `bun run db:generate` | Generate Drizzle migration files |
| `bun run db:migrate` | Apply generated migrations |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:seed` | Insert seed data |
| `bun run db:reset` | Reset and reseed a local database; destructive |
| `bun run auth:generate` | Generate Better Auth database artifacts |

## Troubleshooting

### The database connection fails

Check that PostgreSQL is running, `DATABASE_URL` is available to the server, and the database user has permission to access the database. If using Docker, check the Compose configuration and container status.

### The web application uses stale API types

Rebuild the workspace packages after API or contract changes:

```bash
bun run build:packages
bun run check-types
```

### A port is already in use

Stop the existing development process or configure another port in the relevant application. Confirm that the web application and API client use matching URLs.

### Premium status does not update immediately

The current session caching behavior may require a page reload after redeeming a referral code before premium content reflects the new status. See the [patch notes](patch_notes.md) for this known limitation.

### A schema change is needed in production

Do not reset the database. Review the generated migration, back up production data, and follow [database_update.md](database_update.md) for the documented production procedure.

## Contribution Workflow

1. Create a focused change in the appropriate app or package.
2. Rebuild packages after API or contract changes.
3. Run linting, type checks, and relevant tests.
4. Test database changes against a local database before using a shared or production database.
5. Update `patch_notes.md` when a change affects deployment, user behavior, or operational workflows.

For repository-specific conventions, read [AGENTS.md](AGENTS.md) before making substantial changes.
