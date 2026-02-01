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
		// Find uploads that reference this content but are not in currentS3Keys
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

		// Filter out uploads that are still referenced
		const orphanedIds = orphaned
			.filter((upload) => !input.currentS3Keys.includes(upload.id.toString()))
			.map((upload) => upload.id);

		if (orphanedIds.length === 0) {
			return { deleted: 0 };
		}

		// Delete orphaned uploads
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
		await db.delete(fileUpload).where(and(eq(fileUpload.id, input.id), eq(fileUpload.userId, context.session.user.id)));

		return { success: true };
	});

export const fileUploadRouter = {
	register,
	updateReferences,
	cleanupOrphaned,
	delete: deleteUpload,
};
