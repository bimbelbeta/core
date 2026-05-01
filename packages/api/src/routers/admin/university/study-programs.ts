import { db } from "@bimbelbeta/db";
import { studyProgram } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { requireCreated, requireFound } from "@/lib/crud-helpers";
import { buildIdCursorPage, parseIdCursor } from "@/lib/pagination/cursor";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "@/lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const list = admin.admin.university.studyPrograms.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseIdCursor(cursor) : undefined;

	const rows = await db
		.select({
			id: studyProgram.id,
			name: studyProgram.name,
			slug: studyProgram.slug,
			description: studyProgram.description,
			category: studyProgram.category,
		})
		.from(studyProgram)
		.where(
			and(
				cursorId !== undefined
					? isBackward
						? lt(studyProgram.id, cursorId)
						: gt(studyProgram.id, cursorId)
					: undefined,
				input.search ? sql`${studyProgram.name} ILIKE ${`%${input.search}%`}` : undefined,
				input.category ? eq(studyProgram.category, input.category) : undefined,
			),
		)
		.orderBy(isBackward ? desc(studyProgram.id) : asc(studyProgram.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursor);

	return { items, pageInfo };
});

const find = admin.admin.university.studyPrograms.find.handler(async ({ input, errors }) => {
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
		throw errors.NOT_FOUND({
			message: "Program studi tidak ditemukan",
		});
	}

	return program;
});

const create = admin.admin.university.studyPrograms.create.handler(async ({ input, errors }) => {
	const created = requireCreated(
		await db
			.insert(studyProgram)
			.values({
				name: input.name,
				slug: input.slug,
				description: input.description ?? null,
				category: input.category,
			})
			.returning(),
		"program studi",
		errors,
	);

	return {
		message: "Program studi berhasil dibuat",
		id: created.id,
	};
});

const update = admin.admin.university.studyPrograms.update.handler(async ({ input, errors }) => {
	const { id, ...fields } = input;
	const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

	await requireFound(
		await db
			.update(studyProgram)
			.set({ ...patch, updatedAt: new Date() })
			.where(eq(studyProgram.id, id))
			.returning(),
		"Program studi",
		errors,
	);

	return { message: "Program studi berhasil diperbarui" };
});

const remove = admin.admin.university.studyPrograms.remove.handler(async ({ input, errors }) => {
	await requireFound(
		await db.delete(studyProgram).where(eq(studyProgram.id, input.id)).returning(),
		"Program studi",
		errors,
	);

	return { message: "Program studi berhasil dihapus" };
});

export const adminStudyProgramRouter = {
	list,
	find,
	create,
	update,
	remove,
};
