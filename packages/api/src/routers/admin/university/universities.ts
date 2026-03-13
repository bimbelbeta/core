import { db } from "@bimbelbeta/db";
import { university } from "@bimbelbeta/db/schema/university";
import { and, eq, gt, sql } from "drizzle-orm";
import { admin } from "../../../index";

const list = admin.admin.university.universities.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);

	const conditions = [];
	if (input.cursor) {
		conditions.push(gt(university.id, input.cursor));
	}
	if (input.search) {
		conditions.push(sql`(${university.name} ILIKE ${`%${input.search}%`})`);
	}

	const results = await db
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
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(university.id)
		.limit(limit + 1);

	const hasMore = results.length > limit;
	const data = hasMore ? results.slice(0, limit) : results;
	const nextCursor = hasMore ? data[data.length - 1]!.id : null;

	return { data, nextCursor };
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
	const updateData: {
		name?: string;
		slug?: string;
		logo?: string | null;
		description?: string | null;
		location?: string | null;
		website?: string | null;
		rank?: number | null;
		isActive?: boolean;
		updatedAt: Date;
	} = {
		updatedAt: new Date(),
	};

	if (input.name !== undefined) updateData.name = input.name;
	if (input.slug !== undefined) updateData.slug = input.slug;
	if (input.logo !== undefined) updateData.logo = input.logo;
	if (input.description !== undefined) updateData.description = input.description;
	if (input.location !== undefined) updateData.location = input.location;
	if (input.website !== undefined) updateData.website = input.website;
	if (input.rank !== undefined) updateData.rank = input.rank;
	if (input.isActive !== undefined) updateData.isActive = input.isActive;

	const [updated] = await db.update(university).set(updateData).where(eq(university.id, input.id)).returning();

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
