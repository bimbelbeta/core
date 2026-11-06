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

| Service         | Development URL                                |
| --------------- | ---------------------------------------------- |
| Web application | [http://localhost:3000](http://localhost:3000) |
| API server      | [http://localhost:3001](http://localhost:3001) |
| Drizzle Studio  | Started with `bun run db:studio`               |

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

`db:push` is for development only. Do not run it against production or any shared database. Use it to apply the current schema directly to a local development database:

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

Production migrations never run `db:push` or `db:reset`. For production schema changes, generate and review a Drizzle migration locally:

```bash
bun run db:generate
```

Commit the generated files under `packages/db/src/migrations`. The `Build` GitHub Actions workflow (`.github/workflows/build.yml`) detects any change in that directory and runs `bun run db:migrate` against production with the `DATABASE_URL` secret; the build and deploy jobs wait on it. No manual migration step is needed for production.

Back up the database and test the migration against a copy before merging.

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
├── patch_notes.md     # Feature changes and maintenance history
└── package.json       # Workspace scripts and package manager configuration
```

Keep shared database logic in `packages/db` or `packages/api/src/lib`, API route handlers in the appropriate router, and reusable web components in `apps/web/src/components`.

## Feature Documentation

The following documents provide additional context:

- [Patch notes](patch_notes.md): implementation history, feature-specific behavior, deployment actions, and known limitations
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

| Command                  | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `bun run dev`            | Start all applications in development mode |
| `bun run dev:web`        | Start only the web application             |
| `bun run dev:server`     | Start only the API server                  |
| `bun run build`          | Build all packages and applications        |
| `bun run build:packages` | Build workspace packages with `tsdown`     |
| `bun run start`          | Start built applications                   |

### Quality checks

| Command               | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `bun run lint`        | Check formatting and lint rules with Biome  |
| `bun run lint:fix`    | Apply Biome fixes                           |
| `bun run check-types` | Check TypeScript types across the workspace |
| `bun run test`        | Run the test suite                          |

### Database and authentication

| Command                 | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `bun run db:push`       | Development only: apply the current schema to a local database |
| `bun run db:generate`   | Generate Drizzle migration files                               |
| `bun run db:migrate`    | Apply generated migrations (CI/CD in production)               |
| `bun run db:studio`     | Open Drizzle Studio                                            |
| `bun run db:seed`       | Insert seed data                                               |
| `bun run db:reset`      | Reset and reseed a local database; destructive                 |
| `bun run auth:generate` | Generate Better Auth database artifacts                        |

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

Do not reset or push the database. Generate and review a migration and back up production data. Committed migrations under `packages/db/src/migrations` are applied automatically by the `Build` workflow.

## Contribution Workflow

1. Create a focused change in the appropriate app or package.
2. Rebuild packages after API or contract changes.
3. Run linting, type checks, and relevant tests.
4. Test database changes against a local database before using a shared or production database.
5. Update `patch_notes.md` when a change affects deployment, user behavior, or operational workflows.

For repository-specific conventions, read [AGENTS.md](AGENTS.md) before making substantial changes.

## Admin design-review protocol

When iterating on the admin UI with review subagents, every reviewer brief **must** attach the reference
screenshots of the caliber bar, alongside the current build's screenshots:

- `/.review-shots/references/github-issues.png` — GitHub issues (reference B)
- `/.review-shots/references/linear-members.png` — Linear members (reference A)

Reviewers score the admin console 0–10 against that bar, blind to prior rounds and scores.
Standing constraints: the admin typeface is **Lexend** (never propose a font change), one accent hue,
tokens only — nested under `AGENTS.md → Design constraints`.
