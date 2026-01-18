import { db } from "@bimbelbeta/db";
import { studyProgram } from "@bimbelbeta/db/schema/university";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, eq, sql } from "drizzle-orm";
import { admin } from "../../../index";

const list = admin
	.route({
		path: "/admin/study-programs",
		method: "GET",
		tags: ["Admin - Study Programs"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number?",
			search: "string?",
			category: '"SAINTEK" | "SOSHUM"?',
		}),
	)
	.handler(async ({ input }) => {
		const limit = Math.min(input.limit ?? 20, 100);
		const cursor = input.cursor ?? 0;

		const conditions = [];
		if (input.search) {
			conditions.push(sql`${studyProgram.name} ILIKE ${`%${input.search}%`}`);
		}
		if (input.category) {
			conditions.push(eq(studyProgram.category, input.category));
		}

		const results = await db
			.select({
				id: studyProgram.id,
				name: studyProgram.name,
				slug: studyProgram.slug,
				description: studyProgram.description,
				category: studyProgram.category,
			})
			.from(studyProgram)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(studyProgram.id)
			.limit(limit + 1)
			.offset(cursor);

		const hasMore = results.length > limit;
		const data = hasMore ? results.slice(0, limit) : results;
		const nextCursor = hasMore ? data[data.length - 1]!.id : undefined;

		return { data, nextCursor };
	});

const find = admin
	.route({
		path: "/admin/study-programs/{id}",
		method: "GET",
		tags: ["Admin - Study Programs"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
		const [program] = await db
			.select({
				id: studyProgram.id,
				name: studyProgram.name,
				slug: studyProgram.slug,
				description: studyProgram.description,
				category: studyProgram.category,
			})
			.from(studyProgram)
			.where(eq(studyProgram.id, input.id))
			.limit(1);

		if (!program) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program studi tidak ditemukan",
			});
		}

		return program;
	});

const create = admin
	.route({
		path: "/admin/study-programs",
		method: "POST",
		tags: ["Admin - Study Programs"],
	})
	.input(
		type({
			name: "string",
			slug: "string",
			description: "string?",
			category: '"SAINTEK" | "SOSHUM"',
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		const [created] = await db
			.insert(studyProgram)
			.values({
				name: input.name,
				slug: input.slug,
				description: input.description ?? null,
				category: input.category,
			})
			.returning();

		if (!created) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal membuat program studi",
			});
		}

		return {
			message: "Program studi berhasil dibuat",
			id: created.id,
		};
	});

const update = admin
	.route({
		path: "/admin/study-programs/{id}",
		method: "PATCH",
		tags: ["Admin - Study Programs"],
	})
	.input(
		type({
			id: "number",
			name: "string?",
			slug: "string?",
			description: "string?",
			category: '"SAINTEK" | "SOSHUM"?',
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const updateData: {
			name?: string;
			slug?: string;
			description?: string | null;
			category?: "SAINTEK" | "SOSHUM";
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (input.name !== undefined) updateData.name = input.name;
		if (input.slug !== undefined) updateData.slug = input.slug;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.category !== undefined) updateData.category = input.category;

		const [updated] = await db.update(studyProgram).set(updateData).where(eq(studyProgram.id, input.id)).returning();

		if (!updated) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program studi tidak ditemukan",
			});
		}

		return { message: "Program studi berhasil diperbarui" };
	});

const remove = admin
	.route({
		path: "/admin/study-programs/{id}",
		method: "DELETE",
		tags: ["Admin - Study Programs"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(studyProgram).where(eq(studyProgram.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program studi tidak ditemukan",
			});
		}

		return { message: "Program studi berhasil dihapus" };
	});

export const adminStudyProgramRouter = {
	list,
	find,
	create,
	update,
	remove,
};
