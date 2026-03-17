import { db } from "@bimbelbeta/db";
import { university } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
import { baseImplementer } from "../../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../../lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const list = admin.admin.university.universities.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseIdCursor(cursor) : undefined;

	const rows = await db
		.select({
			id: university.id,
			name: university.name,
			slug: university.slug,
			logo: university.logo,
			description: university.description,
			location: university.location,
			website: university.website,
			rank: university.rank,
			isActive: university.isActive,
		})
		.from(university)
		.where(
			and(
				cursorId !== undefined ? (isBackward ? lt(university.id, cursorId) : gt(university.id, cursorId)) : undefined,
				input.search ? sql`(${university.name} ILIKE ${`%${input.search}%`})` : undefined,
			),
		)
		.orderBy(isBackward ? desc(university.id) : asc(university.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursor);

	return { items, pageInfo };
});

const find = admin.admin.university.universities.find.handler(async ({ input, errors }) => {
	const [uni] = await db
		.select({
			id: university.id,
			name: university.name,
			slug: university.slug,
			logo: university.logo,
			description: university.description,
			location: university.location,
			website: university.website,
			rank: university.rank,
			isActive: university.isActive,
		})
		.from(university)
		.where(eq(university.id, input.id))
		.limit(1);

	if (!uni) {
		throw errors.NOT_FOUND({
			message: "Universitas tidak ditemukan",
		});
	}

	return uni;
});

const create = admin.admin.university.universities.create.handler(async ({ input, errors }) => {
	const [created] = await db
		.insert(university)
		.values({
			name: input.name,
			slug: input.slug,
			logo: input.logo ?? null,
			description: input.description ?? null,
			location: input.location ?? null,
			website: input.website ?? null,
			rank: input.rank ?? null,
		})
		.returning();

	if (!created) {
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal membuat universitas",
		});
	}

	return {
		message: "Universitas berhasil dibuat",
		id: created.id,
	};
});

const update = admin.admin.university.universities.update.handler(async ({ input, errors }) => {
	const { id, ...fields } = input;
	const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

	const [updated] = await db
		.update(university)
		.set({ ...patch, updatedAt: new Date() })
		.where(eq(university.id, id))
		.returning();

	if (!updated) {
		throw errors.NOT_FOUND({
			message: "Universitas tidak ditemukan",
		});
	}

	return { message: "Universitas berhasil diperbarui" };
});

const remove = admin.admin.university.universities.remove.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(university).where(eq(university.id, input.id)).returning();

	if (!deleted) {
		throw errors.NOT_FOUND({
			message: "Universitas tidak ditemukan",
		});
	}

	return { message: "Universitas berhasil dihapus" };
});

export const adminUniversityRouter = {
	list,
	find,
	create,
	update,
	remove,
};
