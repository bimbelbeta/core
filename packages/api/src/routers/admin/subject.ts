import { db } from "@bimbelbeta/db";
import { subject } from "@bimbelbeta/db/schema/subject";
import { eq } from "drizzle-orm";
import { pickDefined } from "../../lib/utils";
import { baseImplementer } from "../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const VALID_GRADE_RANGE: Record<string, [number, number]> = {
	sd: [1, 6],
	smp: [7, 9],
	sma: [10, 12],
};

function validateGradeLevel(
	gradeLevel: number,
	category: string,
	errors: { BAD_REQUEST: (opts: { message: string }) => Error },
): void {
	if (category === "utbk") {
		throw errors.BAD_REQUEST({
			message: "UTBK tidak boleh memiliki gradeLevel",
		});
	}

	const range = VALID_GRADE_RANGE[category];
	if (!range) {
		throw errors.BAD_REQUEST({
			message: `Kategori ${category} tidak valid`,
		});
	}

	const [min, max] = range;
	if (gradeLevel < min || gradeLevel > max) {
		throw errors.BAD_REQUEST({
			message: `GradeLevel harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`,
		});
	}
}

const createSubject = admin.admin.subject.create.handler(async ({ input, errors }) => {
	if (input.gradeLevel !== undefined && input.gradeLevel !== null) {
		const category = input.category ?? "utbk";
		validateGradeLevel(input.gradeLevel, category, errors);
	}

	const [created] = await db
		.insert(subject)
		.values({
			name: input.name,
			shortName: input.shortName,
			description: input.description ?? null,
			order: input.order ?? 1,
			category: input.category ?? "utbk",
			gradeLevel: input.gradeLevel ?? null,
		})
		.returning();

	if (!created)
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal membuat kelas",
		});

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
			validateGradeLevel(input.gradeLevel, category, errors);
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

	const [updatedRow] = await db.update(subject).set(updateData).where(eq(subject.id, input.id)).returning();

	if (!updatedRow)
		throw errors.NOT_FOUND({
			message: "Kelas tidak ditemukan",
		});

	return { message: "Kelas berhasil diperbarui" };
});

const removeSubject = admin.admin.subject.remove.handler(async ({ input, errors }) => {
	const [deletedRow] = await db.delete(subject).where(eq(subject.id, input.id)).returning();

	if (!deletedRow)
		throw errors.NOT_FOUND({
			message: "Kelas tidak ditemukan",
		});

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
