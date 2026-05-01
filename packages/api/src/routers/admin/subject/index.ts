import { db } from "@bimbelbeta/db";
import { subject } from "@bimbelbeta/db/schema/subject";
import { eq } from "drizzle-orm";
import { requireCreated, requireFound } from "@/lib/crud-helpers";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "@/lib/router-definition/middleware";
import { pickDefined } from "@/lib/utils";
import { validateGradeLevel } from "./utils";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const createSubject = admin.admin.subject.create.handler(async ({ input, errors }) => {
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

const updateSubject = admin.admin.subject.update.handler(async ({ input, errors }) => {
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

const removeSubject = admin.admin.subject.remove.handler(async ({ input, errors }) => {
	await requireFound(await db.delete(subject).where(eq(subject.id, input.id)).returning(), "Kelas", errors);

	return { message: "Kelas berhasil dihapus" };
});

const reorderSubjects = admin.admin.subject.reorder.handler(async ({ input }) => {
	await db.transaction(async (tx) => {
		for (const item of input.items) {
			await tx.update(subject).set({ order: item.order, updatedAt: new Date() }).where(eq(subject.id, item.id));
		}
	});

	return { message: "Urutan kelas berhasil diperbarui" };
});

export const adminSubjectRouter = {
	create: createSubject,
	update: updateSubject,
	remove: removeSubject,
	reorder: reorderSubjects,
};
