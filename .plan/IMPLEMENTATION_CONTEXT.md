# TipTap Image Upload Implementation Context

This document describes the complete implementation of image upload functionality in TipTap editor with SeaweedFS S3 storage and database tracking.

## Overview

This implementation enables image uploads in TipTap editor that:
1. Uploads images to SeaweedFS S3 storage
2. Tracks uploads in the database for cleanup and reference management
3. Replaces upload placeholders with actual image nodes after upload completes
4. Supports 1MB file size limit for images

## Architecture

```
User selects image → TipTap Editor
    ↓
ImageUploadNode (placeholder) inserted
    ↓
Upload to S3 via @better-upload/client
    ↓
Upload completes → placeholder replaced with image node
    ↓
Content saved to DB (with image URLs)
    ↓
Register upload metadata in file_upload table
```

## Files Changed/Added

### 1. Database Schema

**File:** `packages/db/src/schema/file-upload.ts` (NEW)

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
		referenceType: text("reference_type"), // e.g., 'question', 'note', 'video'
		referenceId: integer("reference_id"), // ID of the content that references this file
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("file_upload_userId_idx").on(table.userId)],
);

export const fileUploadRelations = relations(fileUpload, ({ one }) => ({
	user: one(user, {
		fields: [fileUpload.userId],
		references: [user.id],
	}),
}));
```

**Update:** `packages/db/src/index.ts`

Add import and include in schema:
```typescript
import * as fileUpload from "./schema/file-upload";

export const db = drizzle({
	// ... existing config
	schema: {
		// ... existing schemas
		...fileUpload,
	},
});
```

### 2. Server Configuration

**File:** `apps/server/src/index.ts`

Add the tiptap upload route:

```typescript
const router: Router = {
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
		tryout: route({
			fileTypes: ["image/*"],
			maxFileSize: 1024 * 1024 * 2,
		}),
		// ADD THIS:
		tiptap: route({
			fileTypes: ["image/*"],
			maxFileSize: 1024 * 1024 * 1, // 1MB limit
		}),
	},
};
```

### 3. API Routes

**File:** `packages/api/src/routers/file-upload.ts` (NEW)

```typescript
import { db } from "@bimbelbeta/db";
import { fileUpload } from "@bimbelbeta/db/schema/file-upload";
import { type } from "arktype";
import { and, eq, inArray } from "drizzle-orm";
import { authed } from "../index";

const register = authed
	.route({
		path: "/uploads/register",
		method: "POST",
		tags: ["Uploads"],
	})
	.input(
		type({
			originalName: "string",
			filename: "string",
			fileSize: "number",
			mimeType: "string",
			s3Key: "string",
			s3Url: "string",
			bucket: "string",
			referenceType: "string?",
			referenceId: "number?",
		}),
	)
	.output(
		type({
			id: "number",
			s3Url: "string",
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const [result] = await db
			.insert(fileUpload)
			.values({
				userId: context.session.user.id,
				originalName: input.originalName,
				filename: input.filename,
				fileSize: input.fileSize,
				mimeType: input.mimeType,
				s3Key: input.s3Key,
				s3Url: input.s3Url,
				bucket: input.bucket,
				referenceType: input.referenceType,
				referenceId: input.referenceId,
			})
			.returning({
				id: fileUpload.id,
				s3Url: fileUpload.s3Url,
			});

		if (!result) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Failed to register upload",
			});
		}

		return result;
	});

const updateReferences = authed
	.route({
		path: "/uploads/update-references",
		method: "POST",
		tags: ["Uploads"],
	})
	.input(
		type({
			s3Keys: ["string"],
			referenceType: "string",
			referenceId: "number",
		}),
	)
	.output(type({ updated: "number" }))
	.handler(async ({ input }) => {
		const updated = [];
		for (const s3Key of input.s3Keys) {
			const [result] = await db
				.update(fileUpload)
				.set({
					referenceType: input.referenceType,
					referenceId: input.referenceId,
				})
				.where(and(eq(fileUpload.bucket, "temp"), eq(fileUpload.s3Key, s3Key)))
				.returning({ id: fileUpload.id });
			if (result) updated.push(result);
		}

		return { updated: updated.length };
	});

const cleanupOrphaned = authed
	.route({
		path: "/uploads/cleanup-orphaned",
		method: "POST",
		tags: ["Uploads"],
	})
	.input(
		type({
			referenceType: "string",
			referenceId: "number",
			currentS3Keys: ["string"],
		}),
	)
	.output(type({ deleted: "number" }))
	.handler(async ({ input, context }) => {
		const orphaned = await db
			.select({ id: fileUpload.id })
			.from(fileUpload)
			.where(
				and(
					eq(fileUpload.userId, context.session.user.id),
					eq(fileUpload.referenceType, input.referenceType),
					eq(fileUpload.referenceId, input.referenceId),
				),
			);

		const orphanedIds = orphaned
			.filter((upload) => !input.currentS3Keys.includes(upload.id.toString()))
			.map((upload) => upload.id);

		if (orphanedIds.length === 0) {
			return { deleted: 0 };
		}

		await db.delete(fileUpload).where(inArray(fileUpload.id, orphanedIds));

		return { deleted: orphanedIds.length };
	});

const deleteUpload = authed
	.route({
		path: "/uploads/{id}",
		method: "DELETE",
		tags: ["Uploads"],
	})
	.input(type({ id: "number" }))
	.output(type({ success: "boolean" }))
	.handler(async ({ input, context }) => {
		await db
			.delete(fileUpload)
			.where(and(eq(fileUpload.id, input.id), eq(fileUpload.userId, context.session.user.id)));

		return { success: true };
	});

export const fileUploadRouter = {
	register,
	updateReferences,
	cleanupOrphaned,
	delete: deleteUpload,
};
```

**Update:** `packages/api/src/routers/index.ts`

Add the router import and export:
```typescript
import { fileUploadRouter } from "./file-upload";

export const appRouter = {
	// ... existing routers
	upload: fileUploadRouter,
};
```

### 4. Frontend Utilities

**File:** `apps/web/src/lib/tiptap-utils.ts`

Update `MAX_FILE_SIZE` and `handleImageUpload`:

```typescript
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Handles image upload with progress tracking and abort capability
 * Uses better-upload client for proper request formatting
 */
export const handleImageUpload = async (
	file: File,
	onProgress?: (event: { progress: number }) => void,
	abortSignal?: AbortSignal,
): Promise<string> => {
	if (!file) {
		throw new Error("No file provided");
	}

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

	const uploadedFile = result.file;

	// Construct URL from the S3 object key
	const s3Host = "http://s3-gw848o8k8o40wog4o0sgcs0w.15.235.206.134.sslip.io";
	const bucket = "temp";
	const url = `${s3Host}/${bucket}/${uploadedFile.objectInfo.key}`;

	// Register the upload in the database
	try {
		const { client } = await import("@/utils/orpc");
		await client.upload.register({
			originalName: file.name,
			filename: uploadedFile.objectInfo.key,
			fileSize: file.size,
			mimeType: file.type,
			s3Key: uploadedFile.objectInfo.key,
			s3Url: url,
			bucket: bucket,
		});
	} catch (error) {
		console.error("Failed to register upload in database:", error);
	}

	return url;
};
```

### 5. TipTap Editor Configuration

**File:** `apps/web/src/components/tiptap-templates/simple/simple-editor.tsx`

Import and configure ImageUploadNode:

```typescript
// Add imports
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";

// In the editor configuration (inside useEditor)
extensions: [
	// ... other extensions
	ImageUploadNode.configure({
		accept: "image/*",
		maxSize: MAX_FILE_SIZE,
		limit: 3,
		upload: handleImageUpload,
		onError: (error: Error & { type?: string }) => {
			console.error("[SimpleEditor] Upload failed:", error);
			console.error("[SimpleEditor] Error type:", error?.type);
			console.error("[SimpleEditor] Error message:", error?.message);
		},
	}),
],

// Add to toolbar (inside MainToolbarContent)
<ToolbarGroup>
	<ImageUploadButton text="Add" />
	<ImageLinkPopover />
</ToolbarGroup>
```

**Note:** The `ImageUploadNode` component files should already exist in your project at:
- `apps/web/src/components/tiptap-node/image-upload-node/image-upload-node-extension.ts`
- `apps/web/src/components/tiptap-node/image-upload-node/image-upload-node.tsx`

### 6. Helper Utilities

**File:** `packages/api/src/lib/extract-images.ts` (NEW)

```typescript
/**
 * Extracts all image URLs from TipTap JSON content
 */
export function extractImageUrls(content: unknown): string[] {
	const urls: string[] = [];

	if (!content || typeof content !== "object") return urls;

	const traverse = (obj: unknown) => {
		if (!obj || typeof obj !== "object") return;

		if (Array.isArray(obj)) {
			obj.forEach(traverse);
		} else {
			const record = obj as Record<string, unknown>;

			if (record.type === "image" && typeof record.attrs === "object" && record.attrs) {
				const attrs = record.attrs as Record<string, unknown>;
				if (typeof attrs.src === "string") {
					urls.push(attrs.src);
				}
			}

			Object.values(record).forEach(traverse);
		}
	};

	traverse(content);
	return urls;
}

/**
 * Extracts S3 keys from image URLs
 */
export function extractS3Keys(urls: string[]): string[] {
	return urls
		.map((url) => {
			const match = url.match(/\/temp\/(.+)$/);
			return match?.[1] || null;
		})
		.filter((key): key is string => key !== null);
}
```

### 7. ORPC Client Export

**File:** `apps/web/src/utils/orpc.ts`

Export the raw client for direct API calls:

```typescript
// Add at the end
export { client };
```

## Environment Variables

Add these to your `.env` files:

**apps/server/.env:**
```
S3_ENDPOINT=http://s3-gw848o8k8o40wog4o0sgcs0w.15.235.206.134.sslip.io:8888
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=temp
```

**apps/web/.env:**
```
VITE_SERVER_URL=http://localhost:3001
```

## Database Migration

Run the migration to create the file_upload table:

```bash
bun db:push
# or
bun db:generate
bun db:migrate
```

## Build Commands

After making changes, always run:

```bash
# 1. Build packages to regenerate types
bun run build:packages

# 2. Run linter
bun run lint:fix --unsafe

# 3. Check types
bun run check-types
```

## Usage in Forms

Use the SimpleEditor component in your forms:

```tsx
import TiptapSimpleEditor from "@/components/tiptap-simple-editor";

// In your form
<form.Field name="content">
	{(field) => (
		<div className="grid gap-2">
			<Label>Konten Soal</Label>
			<TiptapSimpleEditor
				content={field.state.value ?? undefined}
				onChange={(content) => field.handleChange(content as object)}
			/>
		</div>
	)}
</form.Field>
```

## Key Points

1. **Upload Flow:**
   - User selects image → `imageUpload` placeholder inserted
   - Upload happens asynchronously via `@better-upload/client`
   - On success, placeholder is replaced with `image` node
   - Upload metadata is registered in database

2. **File Size:** Images limited to 1MB (configurable in `MAX_FILE_SIZE`)

3. **Database Tracking:** Each upload is tracked with user info, file metadata, and S3 location

4. **Cleanup APIs:** Available for future use to clean up orphaned uploads

5. **Error Handling:** Upload errors are logged to console for debugging

## Troubleshooting

**403 Forbidden - InvalidAccessKeyId:**
- Verify S3 credentials are correct
- Check if server was restarted after env changes
- Verify S3 endpoint includes correct port (8888 for SeaweedFS)

**Content saves as empty:**
- Check browser console for upload errors
- Verify upload route is configured in server
- Ensure `onChange` callback is properly wired in parent form

**Image not appearing after upload:**
- Check if Image extension is loaded in editor
- Verify S3 URL is accessible
- Check CORS configuration on S3 bucket

## Next Steps (Optional)

1. Add progress indicators in UI
2. Implement cleanup cron job for orphaned uploads
3. Add image resizing/compression before upload
4. Add multiple file upload support (currently limit: 3)
