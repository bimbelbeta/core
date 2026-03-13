import { db } from "@bimbelbeta/db";
import { studyProgram } from "@bimbelbeta/db/schema/university";
import { ORPCError } from "@orpc/client";
import { and, eq, gt, sql } from "drizzle-orm";
import { admin } from "../../../index";
import type { HandlerOptions } from "../../../lib/router-definition/handler-options";

const list = admin.admin.university.studyPrograms.list.handler(
	async ({ input }: HandlerOptions<typeof admin.admin.university.studyPrograms.list>) => {
		const limit = Math.min(input.limit ?? 20, 100);

		const conditions = [];
		if (input.cursor) {
			conditions.push(gt(studyProgram.id, input.cursor));
		}
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
			.limit(limit + 1);

		const hasMore = results.length > limit;
		const data = hasMore ? results.slice(0, limit) : results;
		const nextCursor = hasMore ? data[data.length - 1]!.id : undefined;

		return { data, nextCursor };
	},
);

const find = admin.admin.university.studyPrograms.find.handler(
	async ({ input }: HandlerOptions<typeof admin.admin.university.studyPrograms.find>) => {
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
	},
);

const create = admin.admin.university.studyPrograms.create.handler(
	async ({ input }: HandlerOptions<typeof admin.admin.university.studyPrograms.create>) => {
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
	},
);

const update = admin.admin.university.studyPrograms.update.handler(
	async ({ input }: HandlerOptions<typeof admin.admin.university.studyPrograms.update>) => {
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
	},
);

const remove = admin.admin.university.studyPrograms.remove.handler(
	async ({ input }: HandlerOptions<typeof admin.admin.university.studyPrograms.remove>) => {
		const [deleted] = await db.delete(studyProgram).where(eq(studyProgram.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program studi tidak ditemukan",
			});
		}

		return { message: "Program studi berhasil dihapus" };
	},
);

export const adminStudyProgramRouter = {
	list,
	find,
	create,
	update,
	remove,
};
