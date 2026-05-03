import { db } from "@bimbelbeta/db";
import { tryout, tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { eq, sql } from "drizzle-orm";
import { requireCreated, requireFound } from "@/lib/crud-helpers";
import { adminImplementer } from "@/lib/router-definition";
import { pickDefined } from "@/lib/utils";

const admin = adminImplementer;

const find = admin.admin.tryout.subtest.find.handler(async ({ input, errors }) => {
	const [subtest] = await db.select().from(tryoutSubtest).where(eq(tryoutSubtest.id, input.id)).limit(1);

	if (!subtest) {
		throw errors.NOT_FOUND({
			message: "Subtest tidak ditemukan",
		});
	}

	return subtest;
});

const create = admin.admin.tryout.subtest.create.handler(async ({ input, errors }) => {
	const [tryoutExists] = await db.select({ id: tryout.id }).from(tryout).where(eq(tryout.id, input.tryoutId)).limit(1);

	if (!tryoutExists)
		throw errors.NOT_FOUND({
			message: "Tryout tidak ditemukan",
		});

	const [maxOrderResult] = await db
		.select({ maxOrder: sql<number>`max(${tryoutSubtest.order})` })
		.from(tryoutSubtest)
		.where(eq(tryoutSubtest.tryoutId, input.tryoutId));

	const nextOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

	const created = requireCreated(
		await db
			.insert(tryoutSubtest)
			.values({
				tryoutId: input.tryoutId,
				name: input.name,
				description: input.description ?? null,
				duration: input.duration ?? 0,
				questionOrder: input.questionOrder ?? "sequential",
				order: nextOrder,
			})
			.returning(),
		"subtest",
		errors,
	);

	return {
		message: "Subtest berhasil dibuat",
		id: created.id,
	};
});

const update = admin.admin.tryout.subtest.update.handler(async ({ input, errors }) => {
	const updateData = {
		...pickDefined({
			name: input.name,
			description: input.description !== undefined ? (input.description ?? null) : undefined,
			duration: input.duration,
			questionOrder: input.questionOrder,
			scoringMap: input.scoringMap,
		}),
		updatedAt: new Date(),
	};

	await requireFound(
		await db.update(tryoutSubtest).set(updateData).where(eq(tryoutSubtest.id, input.id)).returning(),
		"Subtest",
		errors,
	);

	return { message: "Subtest berhasil diperbarui" };
});

const remove = admin.admin.tryout.subtest.remove.handler(async ({ input, errors }) => {
	await requireFound(
		await db.delete(tryoutSubtest).where(eq(tryoutSubtest.id, input.id)).returning(),
		"Subtest",
		errors,
	);

	return { message: "Subtest berhasil dihapus" };
});

export const subtestRouter = {
	find,
	create,
	update,
	remove,
};
