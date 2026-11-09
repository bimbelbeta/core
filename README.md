# bimbelbeta

Bimbelbeta is a tryout (practice exam) platform for Indonesian students preparing for TKA and UTBK. It sells premium content and tryout credits, runs timed tryout attempts with scoring, and has an admin console for the people who write the questions.

Everything is in this one repo: the website, the API, the database schema, and authentication.

This README is the onboarding doc. Follow it top to bottom and you will have the whole product running on your laptop.

> **If you are an AI coding agent** (Claude Code, Codex, Cursor, OpenCode): read [`AGENTS.md`](./AGENTS.md) as well. It has the same facts in denser form plus the conventions your change must follow. The [For AI agents](#for-ai-agents) section at the bottom of this file lists what is non-negotiable.

## Why this README exists

Because the bus factor kills teams, not just people. Every workflow, footgun, and "you just have to know this" that lives only in one person's head is a liability. When you find one, write it down here.

Write for someone who has never set up a backend project before. Assume they know JavaScript and nothing else about this repo.

## Contents

1. [Architecture at a glance](#architecture-at-a-glance)
2. [Prerequisites](#prerequisites)
3. [Day 1 quickstart](#day-1-quickstart)
4. [What do I want to run?](#what-do-i-want-to-run)
5. [How a click becomes a row](#how-a-click-becomes-a-row)
6. [Where do I put my code?](#where-do-i-put-my-code)
7. [Environment variables](#environment-variables)
8. [Database](#database)
9. [Commands](#commands)
10. [FAQ for new developers](#faq-for-new-developers)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [For AI agents](#for-ai-agents)

<hr>

## Architecture at a glance

```
┌───────────────────────────────────────────────────────────────────────┐
│  Browser                                                              │
│  http://localhost:3000                                                │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │  HTML, then fetch() to :3001
┌───────────────────────────────────▼───────────────────────────────────┐
│  apps/web                        TanStack Start · React 19            │
│  :3000                           Tailwind 4 · shadcn/ui               │
│                                                                       │
│  src/routes/      one file per URL                                    │
│  src/components/  ui/ (shadcn) · admin/ · shared/                     │
│  src/lib/orpc.ts  the typed API client                                │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │  oRPC over HTTP → POST /rpc
┌───────────────────────────────────▼───────────────────────────────────┐
│  apps/server                     Hono on Bun                          │
│  :3001                                                                │
│                                                                       │
│  /api/auth/*      Better Auth (sign in, sign up, sessions)            │
│  /rpc             oRPC RPC handler  ← the web app talks here          │
│  /api-reference   OpenAPI docs (Scalar UI, explore by hand)           │
│  /upload          S3 presigned uploads                                │
│  src/cron.ts      one-shot scheduled jobs                             │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │  calls appRouter in-process
┌───────────────────────────────────▼───────────────────────────────────┐
│  packages/api       routers → services → repositories                 │
│  packages/contract  arktype schemas, error codes, shared types        │
│  packages/auth      Better Auth configuration                         │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │  drizzle-orm
┌───────────────────────────────────▼───────────────────────────────────┐
│  packages/db        schema · migrations · seed                        │
│  PostgreSQL 18      localhost:6767  (Docker)                          │
└───────────────────────────────────────────────────────────────────────┘
```

The direction matters. `web` never imports `db`. `server` never contains business rules. `api` never builds an HTTP response — it throws a `DomainError` and lets one middleware in `server` translate it. If you find yourself fighting that, you are probably putting code in the wrong package — see [Where do I put my code?](#where-do-i-put-my-code).

### Ports

| Service                      | Port | Notes                                                  |
| ---------------------------- | ---- | ------------------------------------------------------ |
| Web                          | 3000 | TanStack Start dev server                              |
| API server                   | 3001 | Hono. Also serves the OpenAPI docs at `/api-reference` |
| PostgreSQL — dev             | 6767 | `packages/db/docker-compose.yml`. What `bun dev` uses  |
| PostgreSQL — prod simulation | 6969 | Root `compose.yml`. A different database entirely      |
| Drizzle Studio               | 4983 | Only while `bun db:studio` is running (default port)   |

Two databases, on purpose. See [Two databases](#two-databases).

### What each folder is for

| Path                | What it is                                                                      |
| ------------------- | ------------------------------------------------------------------------------- |
| `apps/web`          | The website. Routes, pages, components. Talks to the API over oRPC.             |
| `apps/server`       | The HTTP entry point. Auth, RPC, uploads, OpenAPI, cron. Thin by design.        |
| `packages/api`      | All business logic. One folder per domain feature (tryout, product, referral…). |
| `packages/contract` | API shapes and error codes shared by server and web. Arktype schemas live here. |
| `packages/auth`     | Better Auth config: providers, plugins, extra user fields.                      |
| `packages/db`       | Drizzle schema, migrations, seed scripts, the Docker Compose for Postgres.      |
| `packages/config`   | Shared TypeScript config. Nothing to read here.                                 |
| `docs/adr`          | Architecture decisions. Read before changing a layer boundary.                  |
| `docs/agents`       | How agents file issues, triage, and read domain docs.                           |
| `patch_notes.md`    | Every change that needed a deploy action or has a known limitation.             |

<hr>

## Prerequisites

Install these three things. Nothing else is required.

### 1. Bun 1.4.4

The package manager and the runtime. Both apps run on Bun — there is no Node here.

```sh
curl -fsSL https://bun.sh/install | bash
bun --version          # expect 1.4.4
```

The version is pinned in `package.json` (`packageManager`). Bun is what makes `bun test`, `bun --hot`, and the isolated `node_modules` layout work. Do not substitute npm, pnpm, or yarn — the workspace uses Bun's `catalog:` and `workspace:*` protocol.

### 2. Docker

Postgres runs in a container. That is the only reason you need Docker.

```sh
docker --version
docker compose version       # note the SPACE, not the dash
```

Installing Postgres natively works too, but then you have to create the database, the user, and the password yourself, and your version will drift from everyone else's. Use the container.

### 3. Git

You already have this if you are reading the repo.

<hr>

## Day 1 quickstart

Copy-paste. Every step says what you should see, so you know when it worked.

### Step 1 — clone and install

```sh
git clone git@github.com:bimbelbeta/core.git
cd core
bun install
```

### Step 2 — create your environment files

Environment files are gitignored. Copy the templates:

```sh
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Now open `apps/server/.env` and set one value:

```env
BETTER_AUTH_SECRET=any-random-string-you-like
```

Everything else in that file can stay empty for local work. Google login, email, S3 uploads, and Midtrans payments all degrade gracefully when their keys are missing — you just cannot use those features. See [Environment variables](#environment-variables) for what each one does.

### Step 3 — start the database

```sh
bun db:start
```

This runs `docker compose up -d` inside `packages/db` and starts Postgres 18 on port **6767**. Verify:

```sh
docker ps --filter name=bimbelbeta-postgres
# STATUS should say "Up ... (healthy)"
```

### Step 4 — create the tables

```sh
bun db:push
```

`db:push` reads the Drizzle schema in `packages/db/src/schema` and makes your database match it. This is the fast path for local development. Production uses migrations instead — see [Database](#database).

### Step 5 — fill it with content

```sh
bun db:seed
```

You should see `Starting seed...` and then `Seed completed`. This inserts subjects, content, tryouts, products, and universities so the site has something to show.

> `db:seed` **deletes and reinserts** content tables. It refuses to run when `NODE_ENV=production`. It reads `DATABASE_URL` from `apps/server/.env`, not from your shell — so step 2 must be done first.

### Step 6 — run it

```sh
bun dev
```

Turborepo starts both apps and prefixes their logs with `web:dev:` and `server:dev:`. The web app prints a `Local:` URL — it must be `http://localhost:3000/`. If it says any other port, something already had 3000; see [Troubleshooting](#troubleshooting).

Open <http://localhost:3000>. Register an account, and you are in.

### Step 7 — get into the admin console

There is **no seeded admin user**. Register normally, then promote yourself:

```sh
docker exec bimbelbeta-postgres psql -U postgres -d bimbelbeta \
  -c "UPDATE app.\"user\" SET role = 'superadmin' WHERE email = 'you@example.com';"
```

Reload, then open <http://localhost:3000/admin>. Roles are `user`, `admin`, and `superadmin` — `admin` reaches the console, `superadmin` additionally reaches products, referrals, and users.

That is the whole setup. If a step failed, jump to [Troubleshooting](#troubleshooting).

<hr>

## What do I want to run?

### Everything

```sh
bun dev
```

Both apps, hot reload on both. This is what you want 95% of the time.

### Just the website

```sh
bun dev:web
```

Useful when the API is already running somewhere else, or when you are only touching components. It still needs a reachable API on `:3001` for data.

### Just the API

```sh
bun dev:server
```

Restarts on save. The OpenAPI docs live at <http://localhost:3001/api-reference> — that is the fastest way to poke a procedure by hand without writing a component.

### The scheduled jobs

Background work is a **one-shot script**, not a scheduler inside the API process. It finalizes tryout attempts past their deadline, revokes lapsed premium, and fails stale pending payments.

```sh
cd apps/server && bun run cron
```

It runs once and exits. In production it is a Coolify scheduled task (`scheduled-jobs` on the `api` application, command `bun ./cron.js`, every 5 minutes). It is created **disabled** and only works once an image containing `cron.js` is deployed. See [patch notes](patch_notes.md#scheduled-jobs) for the enable command.

### The production simulation

Root `compose.yml` builds both images and runs the whole stack in containers, against its own database on **6969**. This is how you check something that only breaks in a built image — a `VITE_*` value that was not baked in, a migration that runs at startup, a cookie with `secure: true`.

```sh
docker compose up -d
```

Three things to know before you run it:

- It reads `apps/web/.env.prod` and `apps/server/.env.prod`. Those files are not in the repo and are not generated for you — create them from the `.env.example` files. Without them Compose refuses to start.
- It is a **separate database** from your dev one. Nothing you seeded locally is there. Point `DATABASE_URL` at port 6969 to touch it.
- It uses the same container name as the dev database, so only one can run at a time. See [Two databases](#two-databases).

<hr>

## How a click becomes a row

This is the single most useful diagram in this file. Every feature you write follows it.

Say the premium page needs the product list:

```
apps/web/src/routes/_authenticated/premium/-hooks/use-premium.ts
  orpc.product.list.queryOptions()
        │
        │  typed client, credentials: "include"
        ▼
apps/web/src/lib/orpc.ts                    POST http://localhost:3001/rpc
        │
        ▼
apps/server/src/index.ts                    RPCHandler.handle()
        │
        ▼
packages/api/src/routers/index.ts           appRouter
        │
        ▼
packages/api/src/features/product/router.ts       handler: validate + call service
        │                                          no try/catch, no SQL
        ▼
packages/api/src/features/product/service.ts      business rules
        │                                          throws DomainError
        ▼
packages/api/src/features/product/repository.ts   the only layer that touches the DB
        │
        ▼
packages/db/src/schema/*.ts                       drizzle tables
        │
        ▼
PostgreSQL :6767
```

Three consequences worth internalizing:

- **The web app never sees SQL.** It sees a fully typed client generated from `appRouter`. If a procedure does not exist, the call does not compile.
- **The router is boring on purpose.** It validates input (arktype, at the contract level), calls one service, and returns. No error handling, no queries, no rules.
- **A `DomainError` thrown in a service becomes an HTTP error automatically.** One middleware translates it. That is why handlers have no `try`/`catch`.

The full reasoning is in [`docs/adr/0001-feature-sliced-api-layers.md`](docs/adr/0001-feature-sliced-api-layers.md).

<hr>

## Where do I put my code?

| I want to…                         | Put it in                                             |
| ---------------------------------- | ----------------------------------------------------- |
| Add a page                         | `apps/web/src/routes/` (file name = URL)              |
| Add a UI component used once       | next to the route, in a `-components/` folder         |
| Add a reusable UI primitive        | `apps/web/src/components/ui/` (shadcn)                |
| Add a reusable hook                | `apps/web/src/hooks/`                                 |
| Add an API endpoint                | `packages/api/src/features/<feature>/router.ts`       |
| Add an admin-only endpoint         | `packages/api/src/features/<feature>/admin-router.ts` |
| Add a business rule                | `packages/api/src/features/<feature>/service.ts`      |
| Add a query                        | `packages/api/src/features/<feature>/repository.ts`   |
| Add a table or column              | `packages/db/src/schema/<feature>.ts`                 |
| Add a shared type or error code    | `packages/contract/src/`                              |
| Add a cross-cutting helper         | `packages/api/src/lib/`                               |
| Add an auth provider or user field | `packages/auth/src/index.ts`                          |

### The four layers, in one sentence each

- **Repository** — the only layer allowed to touch the database. Built as a factory bound to a client (`db` or a transaction), so a transaction is threaded by construction. Returns rows or `undefined`. Never throws a domain error.
- **Service** — the only layer allowed to hold business rules. Receives its repository as a dependency. Throws `DomainError`.
- **Router handler** — the only layer that knows oRPC exists. Calls a service. Holds no error handling.
- **Middleware** — belongs to the router layer. May import repositories, never services, and holds no business rules.

**Cross-feature rule:** importing another feature's _repository_ is fine. Importing another feature's _service_ is not. If two features need the same logic, that logic moves down into a repository.

### A new feature, start to finish

```
1. packages/db/src/schema/widget.ts              table definition
2. bun db:generate && bun db:push                migration file + local tables
3. packages/contract/src/definitions/widget.ts   input/output shapes
4. packages/api/src/features/widget/repository.ts
5. packages/api/src/features/widget/service.ts
6. packages/api/src/features/widget/router.ts    + register in routers/index.ts
7. bun build:packages                            ← do not skip this
8. apps/web/src/routes/...                       the page that calls it
```

Step 7 is the one everybody forgets. `apps/web` and `apps/server` import the **built** output of `packages/api` and `packages/contract` (see the `exports` field — it points at `dist/`). Change a router without rebuilding and the web app keeps seeing the old types, or fails to compile for no visible reason.

<hr>

## Environment variables

Three files, three purposes. All are gitignored; all have a `.example` twin.

| File               | Read by                         | Purpose                                 |
| ------------------ | ------------------------------- | --------------------------------------- |
| `apps/server/.env` | server, auth, seed, drizzle-kit | Database, auth secret, integrations     |
| `apps/web/.env`    | Vite and the web server         | API URL, public Midtrans key            |
| `.env` (repo root) | Docker Compose only             | Turborepo remote cache token (optional) |

### `apps/server/.env`

| Variable                                    | Required | What it does                                                                            |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | yes      | Postgres connection. Default `postgresql://postgres:password@localhost:6767/bimbelbeta` |
| `BETTER_AUTH_SECRET`                        | yes      | Session signing. Any random string locally.                                             |
| `BETTER_AUTH_URL`                           | yes      | `http://localhost:3001` locally.                                                        |
| `CORS_ORIGIN`                               | yes      | `http://localhost:3000`. Must match the URL you browse from.                            |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no       | Google sign-in. Missing → the button fails, everything else works.                      |
| `RESEND_API_KEY`                            | no       | Password-reset email. Missing → reset emails do not send.                               |
| `S3_*`                                      | no       | Image uploads. Missing → `/upload` returns errors.                                      |
| `MIDTRANS_SERVER_KEY`                       | no       | Payment webhook verification. Missing → checkout fails, rest of app works.              |
| `TRUSTED_ORIGINS`                           | no       | Extra comma-separated origins for CORS and auth.                                        |

### `apps/web/.env`

| Variable                   | Required | What it does                                                 |
| -------------------------- | -------- | ------------------------------------------------------------ |
| `VITE_SERVER_URL`          | yes      | Where the browser sends API calls. `http://localhost:3001`.  |
| `SERVER_URL`               | yes      | Same URL, read by the TanStack Start server at request time. |
| `VITE_PAYMENTS_ENABLED`    | no       | `true` turns on checkout. Read **at build time**.            |
| `VITE_MIDTRANS_CLIENT_KEY` | no       | Public Midtrans key, inlined **at build time**.              |

> **Build-time means build-time.** `VITE_*` values are baked into the bundle. Changing them in a running container does nothing — you must rebuild. This bites people on deploy, not locally.

Never commit real keys. Production secrets live in Coolify and GitHub Actions secrets.

<hr>

## Database

Postgres 18 in Docker, Drizzle ORM in TypeScript, everything under the `app` schema.

### Two databases

There are two, and they are deliberately different. Same Postgres image, same database name, same credentials — different files, different volumes, different ports.

```
  packages/db/docker-compose.yml                  compose.yml (repo root)
    bun db:start                                    docker compose up -d
         │                                               │
         ▼                                               ▼
    localhost:6767                                  localhost:6969
    volume bimbelbeta_bimbelbeta_postgres_data      volume bimbelbeta_db
         │                                               │
     your dev database                             production simulation
     what `bun dev` talks to                       the built images' database
```

|                   | Dev (6767)                            | Prod simulation (6969)         |
| ----------------- | ------------------------------------- | ------------------------------ |
| Started by        | `bun db:start`                        | `docker compose up -d`         |
| Compose file      | `packages/db/docker-compose.yml`      | `compose.yml`                  |
| Volume            | `bimbelbeta_bimbelbeta_postgres_data` | `bimbelbeta_db`                |
| Schema applied by | `bun db:push`                         | migrations, at container start |
| Safe to destroy   | Yes, any time                         | Yes, it is still local         |

Why bother: a change that only fails against a database built by migrations, or with `NODE_ENV=production`, never shows up on a `db:push` dev database. The second one lets you find that out without touching the first.

**Only one runs at a time.** Both files declare `container_name: bimbelbeta-postgres`, so the second one fails with a name conflict. To switch:

```sh
bun db:down                  # stop the dev database, keep its data
cd /path/to/core && docker compose up -d    # start the prod simulation
```

Then set `DATABASE_URL` to the matching port. If a command seems to be reading the wrong data, check that port first — 6767 and 6969 are one keystroke apart and the symptom is silent.

### Two ways to change the schema

|              | `db:push`                                | `db:generate` + migrate      |
| ------------ | ---------------------------------------- | ---------------------------- |
| What it does | Makes the DB match the schema, right now | Writes a SQL file you commit |
| Use it for   | Local development                        | Anything shared or deployed  |
| Safe on prod | **Never**                                | Yes                          |

**Local loop:** edit `packages/db/src/schema/*.ts`, then

```sh
bun db:push
```

**Anything that will be deployed:**

```sh
bun db:generate     # writes packages/db/src/migrations/NNNN_*.sql
git add packages/db/src/migrations
```

Commit the generated files. In production the server runs `migrate()` **at startup** (`apps/server/src/index.ts`), using the migrations folder copied into the image. There is no separate CI migration step.

CI enforces that the two agree: the Test workflow runs `drizzle-kit migrate`, then `drizzle-kit generate`, and fails if that produced a diff. If you push a schema change without its migration, the PR goes red.

### Seed data

```sh
bun db:seed           # deletes and reinserts content, products, tryouts, universities
```

Content-only reseed lives on the package, not the root:

```sh
cd packages/db && bun db:seed:content
```

The seed reads `DATABASE_URL` from `apps/server/.env` and refuses to run when `NODE_ENV=production`.

### Reset

```sh
bun db:reset
```

`docker compose down -v` → `up -d` → `db:push` → `db:seed`. **Destroys all local data**, including the users you registered. You will have to promote yourself to admin again.

### Browse the data

```sh
bun db:studio
```

Opens Drizzle Studio at <https://local.drizzle.studio>. Faster than psql for looking around.

### Other useful commands

```sh
bun db:start     # docker compose up -d
bun db:watch     # docker compose up (logs in foreground)
bun db:stop      # docker compose stop
bun db:down      # docker compose down (keeps the volume)
```

<hr>

## Commands

### Development

| Command              | What it does                           |
| -------------------- | -------------------------------------- |
| `bun dev`            | All apps, hot reload                   |
| `bun dev:web`        | Web only                               |
| `bun dev:server`     | API only                               |
| `bun build`          | Build every package and app            |
| `bun build:packages` | Rebuild `packages/*` only              |
| `bun start`          | Run the built apps (after `bun build`) |

### Quality

| Command                 | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `bun lint`              | Biome check **plus** the 500-line cap on `.tsx` files       |
| `bun lint:fix`          | Apply safe Biome fixes                                      |
| `bun lint:fix --unsafe` | Apply fixes including unsafe ones                           |
| `bun check-types`       | `tsc --noEmit` across the workspace (builds packages first) |
| `bun test`              | Bun's test runner over the whole repo                       |

`bun lint` is not just Biome. `scripts/check-tsx-lines.ts` fails any `.tsx` file over 500 lines. That is deliberate: it is the signal to split the file, not to raise the limit.

### Database

| Command             | What it does                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `bun db:start`      | Start the Postgres container                                            |
| `bun db:push`       | Apply the schema directly (local only)                                  |
| `bun db:generate`   | Write a migration file from schema changes                              |
| `bun db:migrate`    | Apply pending migrations                                                |
| `bun db:seed`       | Insert seed data                                                        |
| `bun db:reset`      | Destroy and rebuild the local database                                  |
| `bun db:studio`     | Open Drizzle Studio at `https://local.drizzle.studio`                   |
| `bun db:stop`       | Stop the container                                                      |
| `bun auth:generate` | Regenerate `packages/db/src/schema/auth.ts` from the Better Auth config |

### Tests

```sh
bun test
```

Runs Bun's runner from the repo root across all 56 test files. Unit tests always run. **Integration tests skip themselves** unless `TEST_DATABASE_URL` is set _and_ equals `DATABASE_URL`:

```
547 pass
 66 skip
 0 fail
Ran 613 tests across 56 files.
```

Those 66 skips are the integration tests. To actually run them:

```sh
DATABASE_URL=postgresql://postgres:password@localhost:6767/bimbelbeta \
TEST_DATABASE_URL=postgresql://postgres:password@localhost:6767/bimbelbeta \
bun test
```

They insert real rows (with unique ids) into that database. Point them at a throwaway database if you care about your local data.

<hr>

## FAQ for new developers

**What is oRPC and why not just REST?**

oRPC generates a fully typed client from the server's router definition. The web app imports that type, so if you rename a procedure or change a field, the frontend fails to compile instead of failing at runtime in production. You still get a REST-ish surface for free at `/api-reference` if you want to poke at it with curl.

**Why is `packages/api` a separate package instead of code inside `apps/server`?**

Because the web app imports its _types_, and the cron script imports its _services_. If it lived in `apps/server`, both would have to depend on the HTTP app. The package boundary is what keeps the layers honest.

**Why does the web app need `bun build:packages` after an API change?**

`apps/web` imports `@bimbelbeta/api` from `dist/`, not from `src/`. Turborepo builds packages first in `bun build` and `bun check-types`, but `bun dev` does not rebuild packages on every save. After changing a router or contract, run `bun build:packages` or your types will be stale.

**I changed something and nothing happened.**

In order: (1) did you save? (2) is the dev server still running? (3) is it an API/contract change that needs `bun build:packages`? (4) is the browser caching a session cookie — try a hard reload.

**The web app started on port 3002. Why is everything broken?**

Something already had 3000. Vite silently picks the next free port, but `CORS_ORIGIN` and Better Auth's trusted origin still say `localhost:3000`, so auth and API calls fail. Kill whatever holds 3000 and restart:

```sh
lsof -ti :3000 | xargs kill
```

**Which database am I actually connected to?**

Read the port in `DATABASE_URL`. 6767 is your dev database, 6969 is the production simulation. They are separate volumes with separate data, and switching between them is silent — nothing warns you that the rows you expected are on the other one. If you ever want certainty:

```sh
docker exec bimbelbeta-postgres psql -U postgres -d bimbelbeta -c 'select count(*) from app."user";'
```

**Why Indonesian for error messages?**

The product is Indonesian. User-facing errors are Indonesian everywhere, consistently, across every router. Code, comments, and commit messages are English.

**Why can't I write comments?**

`AGENTS.md` says code must be self-documenting. If a block needs a comment to be understood, rename things or extract a function. The one exception is a `shortcut:` note recording a known limitation.

**Where do credentials live?**

Never in the repo. Locally: your own gitignored `.env` files. Production: Coolify environment variables and GitHub Actions secrets. Ask a maintainer for access.

**Who do I ask?**

Open a GitHub issue on `bimbelbeta/core`. For "is this broken or am I broken", `git log --oneline -10 -- <path>` tells you who last touched it.

<hr>

## Troubleshooting

| Symptom                                               | Cause and fix                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Failed to start server. Is port 3001 in use?`        | A previous dev server is still alive. `lsof -ti :3001 \| xargs kill`, then `bun dev` again.                                |
| Web loads on `:3002` and login does nothing           | Vite fell back to another port, so `CORS_ORIGIN` no longer matches. Free port 3000.                                        |
| `DATABASE_URL is required` from `bun db:seed`         | The seed reads `apps/server/.env`, not your shell. Create that file from the example.                                      |
| `ECONNREFUSED 127.0.0.1:6767`                         | Postgres is not running. `bun db:start`, then `docker ps --filter name=bimbelbeta-postgres`.                               |
| `relation "app.user" does not exist`                  | Tables were never created. `bun db:push`.                                                                                  |
| `bun db:push` connects but creates nothing            | You are pointing at the other database. `DATABASE_URL` should say **6767** for dev, **6969** for the prod simulation.      |
| Data you just seeded is not there                     | Same cause. You are on the other database. Check the port in `DATABASE_URL`.                                               |
| `docker compose up` fails: container name in use      | The dev database is running. `bun db:down` first — the two share `container_name: bimbelbeta-postgres`.                    |
| Login redirects to `/login` forever                   | `BETTER_AUTH_SECRET` is empty, or `BETTER_AUTH_URL` / `CORS_ORIGIN` do not match the URL in your address bar.              |
| `/admin` bounces you to `/dashboard`                  | Your user's role is `user`. Promote it with the SQL in [step 7](#step-7--get-into-the-admin-console).                      |
| `UPDATE "user"` fails with "relation does not exist"  | Everything lives in the `app` schema. Use `app."user"`.                                                                    |
| Types are wrong after an API change                   | `bun build:packages`, then restart the dev server.                                                                         |
| `bun lint` fails on a `.tsx` file with a line count   | The 500-line cap. Split the component; do not raise `MAX_LINES`.                                                           |
| Integration tests all say `(skip)`                    | `TEST_DATABASE_URL` is unset or differs from `DATABASE_URL`. See [Tests](#tests).                                          |
| `drizzle-kit generate` produces a diff in CI          | You changed the schema without committing the generated migration. `bun db:generate`, commit `packages/db/src/migrations`. |
| Google login button errors                            | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are empty. Use email + password locally.                                       |
| Password reset email never arrives                    | `RESEND_API_KEY` is empty. Expected locally.                                                                               |
| Checkout button says "Segera Hadir"                   | `VITE_PAYMENTS_ENABLED` is not `true`. It is a **build-time** value — rebuild, do not just restart.                        |
| Uploads fail                                          | `S3_*` variables are empty. Expected locally.                                                                              |
| Premium status does not update after redeeming a code | Session caching. Hard reload. See [patch notes](patch_notes.md).                                                           |

<hr>

## Contributing

1. Branch from `main`.
2. Make the change in the right package — see [Where do I put my code?](#where-do-i-put-my-code).
3. If you touched `packages/api` or `packages/contract`, run `bun build:packages`.
4. Run `bun lint`, `bun check-types`, `bun test`. All three must pass.
5. If you changed the schema, commit the generated migration and verify CI's "schema and migrations must agree" check passes.
6. If your change needs a deploy action, changes user-visible behavior, or leaves a known limitation, add it to [`patch_notes.md`](patch_notes.md).
7. Open a PR.

What CI runs on your PR:

| Workflow                         | What it checks                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `Test`                           | migrations apply, schema matches migrations, packages build, types, Biome, tests |
| `Build`                          | both Docker images build                                                         |
| `pr-size` / `pr-vouch` / `label` | PR hygiene                                                                       |

Merging to `main` builds and pushes `ghcr.io/bimbelbeta/web:latest` and `ghcr.io/bimbelbeta/server:latest`, then triggers a Coolify deploy webhook. Production migrations run when the new server container starts.

<hr>

## For AI agents

If you are an agent, [`AGENTS.md`](./AGENTS.md) is the source of truth. Read it before your first edit. This section is the summary of what will get your change rejected.

### Read these first

| File                                                                                       | Why                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)                                                                 | Layers, conventions, commands. Loaded automatically by most harnesses.                                                                                                     |
| [`docs/adr/0001-feature-sliced-api-layers.md`](docs/adr/0001-feature-sliced-api-layers.md) | Why the API is sliced by domain, and where helpers go.                                                                                                                     |
| [`GLOSSARY.md`](./GLOSSARY.md)                                                             | Domain terms. Use these words, not synonyms.                                                                                                                               |
| [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)                             | Issues live in GitHub Issues for `bimbelbeta/core`. Use `gh`.                                                                                                              |
| [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)                             | The five triage labels.                                                                                                                                                    |
| [`docs/agents/domain.md`](docs/agents/domain.md)                                           | Single-context layout: one glossary, one `docs/adr/`.                                                                                                                      |
| `.agents/skills/`                                                                          | Repo skills: `code-review`, `implement`, `implement-spec`, `to-spec`, `to-tickets`, `wayfinder`, `grill-with-docs`, `improve-codebase-architecture`, `writing-for-agents`. |

### Non-negotiable

- **No comments.** Code must be self-documenting. The only allowed form is `shortcut: <limit>, <when to upgrade>`.
- **No prop drilling.** Use `useQuery` in the child (auto-cached, no duplicate request), or zustand, or router context.
- **No `as` assertions**, ever. And no explicit types where TypeScript can infer them — Biome's `noInferrableTypes` rejects those. Use `as const` for literals.
- **Layers are not negotiable.** Repositories touch the DB. Services hold rules. Handlers know oRPC. Middleware may import repositories, never services.
- **Cross-feature imports go through repositories**, never services.
- **All list endpoints are cursor-paginated**, returning `{ items, pageInfo }`, via `buildIdCursorPage` / `parseIdCursor`.
- **User-facing errors are Indonesian.** Code and commits are English.
- **Validation lives in arktype contracts**, not in `if` statements inside handlers.
- **Never run `db:push` against anything but a local database.**
- **Never clear `.turbo` or cache directories.**
- **After changing `packages/api/src/features/*`, run `bun build:packages`.** Type definitions for web and server are generated from it.
- **Finish with `bun lint:fix` and `bun check-types`.**

### Scope rules

- Do not open, close, or update issues or PRs unless asked.
- Do not expand the spec. If the ticket does not cover it, do not build it.
- Do not add defensive code for scenarios that cannot occur. If you think one can, say so and ask.
- When you add a test for a defect, reintroduce the defect and watch the test fail before claiming it is covered.

### Quoting output

When you put compiler, test, or tool output into a commit message, issue, or ledger, run the command in the same turn and paste what it actually printed. Reconstructed output is indistinguishable from real output except that it is wrong.
