import { db } from "@bimbelbeta/db";
import { subject } from "@bimbelbeta/db/schema/subject";
import { eq, inArray, sql } from "drizzle-orm";
import { requireCreated, requireFound } from "@/lib/crud-helpers";
import { adminImplementer } from "@/lib/router-definition";
import { pickDefined } from "@/lib/utils";
import { validateGradeLevel } from "./utils";

const admin = adminImplementer;

const create = admin.admin.subject.create.handler(async ({ input, errors }) => {
	if (input.gradeLevel !== undefined && input.gradeLevel !== null) {
		const category = input.category ?? "utbk";
		const result = validateGradeLevel(category, input.gradeLevel);
		if (!result.valid) throw errors.BAD_REQUEST({ message: result.message! });
	}

	const created = requireCreated(
		await db
			.insert(subject)
			.values({
				name: input.name,
				shortName: input.shortName,
				description: input.description ?? null,
				order: input.order ?? 1,
				category: input.category ?? "utbk",
				gradeLevel: input.gradeLevel ?? null,
			})
			.returning(),
		"kelas",
		errors,
	);

	return {
		message: "Kelas berhasil dibuat",
		id: created.id,
	};
});

const update = admin.admin.subject.update.handler(async ({ input, errors }) => {
	if (input.gradeLevel !== undefined) {
		let category = input.category;

		if (!category) {
			const [existing] = await db
				.select({ category: subject.category })
				.from(subject)
				.where(eq(subject.id, input.id))
				.limit(1);
			if (existing) category = existing.category;
		}

		if (input.gradeLevel !== null && category) {
			const result = validateGradeLevel(category, input.gradeLevel);
			if (!result.valid) throw errors.BAD_REQUEST({ message: result.message! });
		}
	}

	const updateData = {
		...pickDefined({
			name: input.name,
			shortName: input.shortName,
			description: input.description !== undefined ? (input.description ?? null) : undefined,
			order: input.order,
			category: input.category,
			gradeLevel: input.gradeLevel !== undefined ? (input.gradeLevel ?? null) : undefined,
		}),
		updatedAt: new Date(),
	};

	await requireFound(
		await db.update(subject).set(updateData).where(eq(subject.id, input.id)).returning(),
		"Kelas",
		errors,
	);

	return { message: "Kelas berhasil diperbarui" };
});

const remove = admin.admin.subject.remove.handler(async ({ input, errors }) => {
	await requireFound(await db.delete(subject).where(eq(subject.id, input.id)).returning(), "Kelas", errors);

	return { message: "Kelas berhasil dihapus" };
});

const reorder = admin.admin.subject.reorder.handler(async ({ input }) => {
	const ids = input.items.map((item) => item.id);
	const caseExpr = sql.join(
		input.items.map((item) => sql`WHEN ${subject.id} = ${item.id} THEN ${item.order}`),
		sql` `,
	);

	await db
		.update(subject)
		.set({ order: sql`CASE ${caseExpr} END`, updatedAt: new Date() })
		.where(inArray(subject.id, ids));

	return { message: "Urutan kelas berhasil diperbarui" };
});

export const adminSubjectRouter = {
	create,
	update,
	remove,
	reorder,
};
