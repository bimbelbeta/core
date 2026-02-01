# Bimbelbeta Project Context File

> **Purpose**: Transfer architecture patterns, configurations, and recent implementations to similar codebase projects.

---

## 1. Project Overview

### Architecture
- **Monorepo**: Turbo workspace with packages and apps
- **Package Manager**: Bun 1.3.2
- **Apps**: `web` (TanStack Start), `server` (Hono)
- **Packages**: `@bimbelbeta/api`, `@bimbelbeta/auth`, `@bimbelbeta/db`, `@bimbelbeta/config`

### Tech Stack
- **Frontend**: React 19, TanStack Router, TanStack Query, TanStack Form, Tailwind CSS v4
- **Backend**: Hono, ORPC, Arktype, Drizzle ORM
- **Auth**: Better-Auth
- **Storage**: PostgreSQL (Drizzle), SeaweedFS S3
- **Build**: Turbo with remote caching

---

## 2. Root Configuration Files

### package.json
```json
{
  "name": "your-project",
  "private": true,
  "type": "module",
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": {
      "hono": "^4.11.4",
      "@orpc/server": "^1.13.4",
      "@orpc/openapi": "^1.13.4",
      "@orpc/arktype": "^1.13.4",
      "better-auth": "^1.4.16",
      "drizzle-orm": "^0.45.1",
      "arktype": "^2.1.29",
      "typescript": "^5.9.3"
    }
  },
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "dev": "turbo dev",
    "build": "turbo build",
    "build:packages": "turbo build --filter='./packages/*'",
    "check-types": "turbo check-types",
    "db:push": "turbo -F @yourproject/db db:push",
    "db:generate": "turbo -F @yourproject/db db:generate",
    "db:migrate": "turbo -F @yourproject/db db:migrate"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.12",
    "turbo": "^2.7.4"
  },
  "packageManager": "bun@1.3.2"
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "remoteCache": {
    "enabled": true,
    "teamSlug": "your-team-name"
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".output/**"]
    },
    "lint": { "dependsOn": ["^lint"] },
    "check-types": { "cache": true, "dependsOn": ["^check-types"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### biome.json
```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "files": {
    "includes": ["**", "!**/dist", "!**/.turbo", "!**/.next", "!**/node_modules"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 120
  },
  "assist": {
    "actions": {
      "source": { "organizeImports": "on" }
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useExhaustiveDependencies": "info"
      },
      "nursery": {
        "useSortedClasses": {
          "level": "warn",
          "fix": "safe",
          "options": { "functions": ["clsx", "cva", "cn"] }
        }
      },
      "style": {
        "noNonNullAssertion": "off",
        "noParameterAssign": "error",
        "useAsConstAssertion": "error",
        "noInferrableTypes": "error"
      }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double" } },
  "css": { "parser": { "tailwindDirectives": true } }
}
```

---

## 3. Database Package (@yourproject/db)

### Package Structure
```
packages/db/
├── package.json
├── drizzle.config.ts
├── docker-compose.yml (for local dev)
└── src/
    ├── index.ts (drizzle client export)
    └── schema/
        ├── auth.ts (better-auth generated)
        └── [features].ts
```

### package.json
```json
{
  "name": "@yourproject/db",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
    "./*": { "types": "./dist/*.d.mts", "default": "./dist/*.mjs" }
  },
  "scripts": {
    "build": "tsdown",
    "check-types": "tsc --noEmit",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "pg": "^8.17.1",
    "drizzle-orm": "catalog:",
    "arktype": "catalog:"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "tsdown": "catalog:"
  }
}
```

### Database Schema Pattern
```typescript
// src/schema/example.ts
import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const example = pgTable(
  "example",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("example_userId_idx").on(table.userId)]
);

export const exampleRelations = relations(example, ({ one }) => ({
  user: one(user, { fields: [example.userId], references: [user.id] }),
}));
```

### src/index.ts (Drizzle Client)
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as example from "./schema/example";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL || "",
    ...(process.env.NODE_ENV !== "production" ? { ssl: false } : undefined),
  },
  casing: "snake_case",
  schema: { ...example },
});
```

---

## 4. API Package (@yourproject/api)

### Package Structure
```
packages/api/
├── package.json
└── src/
    ├── index.ts (middleware exports)
    ├── context.ts
    ├── lib/
    │   ├── orpc.ts
    │   └── ratelimit.ts
    ├── middlewares/
    │   └── rbac.ts
    └── routers/
        ├── index.ts
        └── [feature].ts
```

### package.json
```json
{
  "name": "@yourproject/api",
  "exports": {
    ".": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
    "./*": { "types": "./dist/*.d.mts", "default": "./dist/*.mjs" }
  },
  "type": "module",
  "scripts": {
    "build": "tsdown",
    "check-types": "tsgo --noEmit"
  },
  "dependencies": {
    "@yourproject/db": "workspace:*",
    "@orpc/server": "catalog:",
    "@orpc/arktype": "catalog:",
    "arktype": "catalog:",
    "drizzle-orm": "catalog:",
    "hono": "catalog:"
  }
}
```

### src/lib/orpc.ts (Base ORPC Setup)
```typescript
import { os } from "@orpc/server";
import type { Context } from "../context";

export const o = os.$context<Context>().errors({
  NOT_FOUND: { message: "Resource not found" },
  UNAUTHORIZED: { message: "Unauthorized" },
  BAD_REQUEST: { message: "Bad request" },
  FORBIDDEN: { message: "Forbidden" },
  INTERNAL_SERVER_ERROR: { message: "Internal server error" },
  TOO_MANY_REQUESTS: { message: "Too many requests" },
});
```

### src/index.ts (Middlewares)
```typescript
import { db } from "@yourproject/db";
import { user } from "@yourproject/db/schema/auth";
import { eq } from "drizzle-orm";
import { o } from "./lib/orpc";

export const pub = o;

const requireAuth = o.middleware(async ({ context, next, errors }) => {
  if (!context.session?.user) throw errors.UNAUTHORIZED();
  return next({ context: { session: context.session } });
});

export const authed = pub.use(requireAuth);
```

### src/routers/index.ts (Router Aggregation)
```typescript
import { type } from "arktype";
import { pub } from "../index";
import { exampleRouter } from "./example";

export const appRouter = {
  healthCheck: pub
    .route({ path: "/healthcheck", method: "GET", tags: ["System"] })
    .output(type({ message: "string" }))
    .handler(() => ({ message: "OK" })),
  example: exampleRouter,
};

export type AppRouter = typeof appRouter;
```

### Router Pattern Example
```typescript
// src/routers/example.ts
import { db } from "@yourproject/db";
import { example } from "@yourproject/db/schema/example";
import { type } from "arktype";
import { eq } from "drizzle-orm";
import { authed } from "../index";

const list = authed
  .route({ path: "/examples", method: "GET", tags: ["Example"] })
  .handler(async ({ context }) => {
    const items = await db
      .select()
      .from(example)
      .where(eq(example.userId, context.session.user.id));
    return items;
  });

const create = authed
  .route({ path: "/examples", method: "POST", tags: ["Example"] })
  .input(type({ name: "string" }))
  .handler(async ({ input, context }) => {
    const [item] = await db
      .insert(example)
      .values({ userId: context.session.user.id, name: input.name })
      .returning();
    return item;
  });

export const exampleRouter = { list, create };
```

---

## 5. Auth Package (@yourproject/auth)

### package.json
```json
{
  "name": "@yourproject/auth",
  "exports": {
    ".": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
    "./*": { "types": "./dist/*.d.mts", "default": "./dist/*.mjs" }
  },
  "type": "module",
  "scripts": {
    "build": "tsdown",
    "auth:generate": "bunx @better-auth/cli@latest generate --output ../db/src/schema/auth.ts --config ./src/index.ts --yes"
  },
  "dependencies": {
    "@yourproject/db": "workspace:*",
    "better-auth": "catalog:"
  }
}
```

---

## 6. Server App (apps/server)

### src/index.ts (Hono Server)
```typescript
import { handleRequest, type Router, route } from "@better-upload/server";
import { custom } from "@better-upload/server/clients";
import { createContext } from "@yourproject/api/context";
import { appRouter } from "@yourproject/api/routers/index";
import { auth } from "@yourproject/auth";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// S3 Upload Configuration
const uploadRouter: Router = {
  client: custom({
    host: process.env.S3_ENDPOINT || "",
    region: "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
    secure: false,
    forcePathStyle: true,
  }),
  bucketName: process.env.S3_BUCKET || "temp",
  routes: {
    images: route({
      fileTypes: ["image/*"],
      maxFileSize: 1024 * 1024 * 2, // 2MB
    }),
  },
};

const app = new Hono();

app.use(logger());
app.use("/*", cors({
  origin: [process.env.CORS_ORIGIN || "http://localhost:3000"],
  credentials: true,
}));

// Better-Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Upload endpoint
app.post("/upload", (c) => handleRequest(c.req.raw, uploadRouter));

// ORPC handlers
const rpcHandler = new RPCHandler(appRouter);
const apiHandler = new OpenAPIHandler(appRouter);

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });
  
  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });
  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  await next();
});

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};
```

---

## 7. Web App (apps/web)

### Key Dependencies
```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.153.2",
    "@tanstack/react-query": "^5.90.17",
    "@tanstack/react-form": "^1.27.7",
    "@tanstack/react-start": "^1.154.0",
    "tailwindcss": "^4.1.18",
    "@radix-ui/react-dialog": "^1.1.15",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "zustand": "^5.0.10",
    "sonner": "^2.0.3"
  }
}
```

### src/lib/utils.ts (cn utility)
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};
```

### src/utils/orpc.ts (Client Setup)
```typescript
import type { appRouter } from "@yourproject/api/routers/index";
import { createORPCClient, type InferClientBodyOutputs, isDefinedError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function getApiUrl() {
  return (
    process.env.SERVER_URL ??
    import.meta.env.VITE_SERVER_URL ??
    (process.env.NODE_ENV === "production" ? "https://api.yoursite.com" : "http://localhost:3001")
  );
}

const serializer = new StandardRPCJsonSerializer();

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isDefinedError(error)) {
        toast.error(`${error}`);
      } else {
        toast.error("An unexpected error occurred", { description: error.message });
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 60 * 1000,
    },
  },
});

const client = createORPCClient(
  new RPCLink({
    url: `${getApiUrl()}/rpc`,
    fetch(url, options) {
      return fetch(url, { ...options, credentials: "include" });
    },
  }),
);

export const orpc = createTanstackQueryUtils(client);
export { client };
```

### UI Component Pattern (Button Example)
```typescript
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-xs hover:bg-primary/90",
        secondary: "border border-primary bg-white shadow-xs hover:bg-primary/10",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/80",
        ghost: "hover:bg-primary/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-9 px-3 py-2",
        lg: "h-11 px-6 py-3",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
```

---

## 8. Recent Implementation: TipTap Image Upload

### Flow
1. User selects image in TipTap editor
2. `ImageUploadNode` placeholder inserted
3. Upload to S3 via `@better-upload/client`
4. Upload completes → placeholder replaced with image node
5. Content saved to DB with image URLs
6. Upload metadata registered in `file_upload` table

### Database Schema (file-upload.ts)
```typescript
import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const fileUpload = pgTable(
  "file_upload",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    filename: text("filename").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    s3Key: text("s3_key").notNull(),
    s3Url: text("s3_url").notNull(),
    bucket: text("bucket").notNull(),
    referenceType: text("reference_type"), // e.g., 'question', 'note'
    referenceId: integer("reference_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [index("file_upload_userId_idx").on(table.userId)],
);

export const fileUploadRelations = relations(fileUpload, ({ one }) => ({
  user: one(user, { fields: [fileUpload.userId], references: [user.id] }),
}));
```

### API Router (file-upload.ts)
```typescript
import { db } from "@yourproject/db";
import { fileUpload } from "@yourproject/db/schema/file-upload";
import { type } from "arktype";
import { and, eq, inArray } from "drizzle-orm";
import { authed } from "../index";

const register = authed
  .route({ path: "/uploads/register", method: "POST", tags: ["Uploads"] })
  .input(type({
    originalName: "string",
    filename: "string",
    fileSize: "number",
    mimeType: "string",
    s3Key: "string",
    s3Url: "string",
    bucket: "string",
    referenceType: "string?",
    referenceId: "number?",
  }))
  .output(type({ id: "number", s3Url: "string" }))
  .handler(async ({ input, context }) => {
    const [result] = await db.insert(fileUpload).values({
      userId: context.session.user.id,
      ...input,
    }).returning({ id: fileUpload.id, s3Url: fileUpload.s3Url });
    return result;
  });

export const fileUploadRouter = { register };
```

### Frontend Upload Handler (lib/tiptap-utils.ts)
```typescript
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export const handleImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal,
): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }

  const { uploadFile } = await import("@better-upload/client");
  const { getApiUrl } = await import("@/utils/orpc");
  const apiUrl = getApiUrl();

  const result = await uploadFile({
    file,
    route: "tiptap",
    api: `${apiUrl}/upload`,
    credentials: "include",
    onFileStateChange: (data) => {
      onProgress?.({ progress: Math.round(data.file.progress * 100) });
    },
    signal: abortSignal,
  });

  const s3Host = process.env.S3_HOST || "http://your-s3-host";
  const bucket = "temp";
  const url = `${s3Host}/${bucket}/${result.file.objectInfo.key}`;

  // Register upload in database
  const { client } = await import("@/utils/orpc");
  await client.upload.register({
    originalName: file.name,
    filename: result.file.objectInfo.key,
    fileSize: file.size,
    mimeType: file.type,
    s3Key: result.file.objectInfo.key,
    s3Url: url,
    bucket: bucket,
  });

  return url;
};
```

---

## 9. Development Workflow

### Commands
```bash
# Development
bun dev              # Start all packages
bun dev:web          # Start web app (port 3000)
bun dev:server       # Start server (port 3001)

# Linting & Types
bun lint             # Check with Biome
bun lint:fix --unsafe # Auto-fix issues
bun check-types      # Type check all packages

# Database
bun db:push          # Push schema changes
bun db:generate      # Generate migration files
bun db:migrate       # Apply migrations
bun db:studio        # Open Drizzle Studio

# Building
bun build            # Build all
bun build:packages   # Build only packages (regenerates types)
```

### Critical Workflow Steps
1. **After API changes**: Run `bun build:packages` to regenerate types
2. **Before committing**: Run `bun lint:fix --unsafe && bun check-types`
3. **After schema changes**: Run `bun db:push` or `bun db:generate`

---

## 10. Code Style Guidelines

### TypeScript
- Strict mode enabled
- No explicit types when inferrable
- Use `as const` for literal types
- Use `type` keyword for type-only imports

### Naming Conventions
- Components: PascalCase (`UserCard`)
- Functions/variables: camelCase (`getUserProgress`)
- Types/interfaces: PascalCase (`UserProgress`)
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case for folders, `index.ts` for exports

### React Components
- Functional components only
- TypeScript props interfaces, destructure props
- Use Radix UI primitives as base
- Styling: Tailwind CSS with `cn()` utility
- Variants: Use `class-variance-authority` (cva)

### Database
- Tables: camelCase with underscored columns
- Define relations with explicit types
- Use Drizzle query builder
- Prefer cursor-based pagination (not offset)

---

## 11. Environment Variables

### apps/server/.env
```
DATABASE_URL=postgresql://user:pass@localhost:5432/db
S3_ENDPOINT=http://your-s3-endpoint:8888
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=temp
CORS_ORIGIN=http://localhost:3000
```

### apps/web/.env
```
VITE_SERVER_URL=http://localhost:3001
```

---

## 12. Migration Checklist

To apply this context to your other project:

- [ ] Copy root configuration files (package.json, turbo.json, biome.json)
- [ ] Set up packages structure (@yourproject/db, @yourproject/api, @yourproject/auth)
- [ ] Configure Drizzle ORM with database connection
- [ ] Set up ORPC with Hono server
- [ ] Configure Better-Auth for authentication
- [ ] Set up TanStack Router + Query in web app
- [ ] Configure Tailwind CSS v4 with cn() utility
- [ ] Migrate database schemas
- [ ] Migrate API routers following ORPC patterns
- [ ] Migrate UI components using Radix + cva patterns
- [ ] Set up file upload infrastructure (S3 + better-upload)
- [ ] Configure environment variables
- [ ] Run `bun install` and `bun build:packages`
- [ ] Test database connection with `bun db:push`
- [ ] Start dev servers with `bun dev`

---

**Generated from**: bimbelbeta project  
**Last updated**: 2026-02-01  
**For questions**: Review IMPLEMENTATION_CONTEXT.md for detailed feature implementations
