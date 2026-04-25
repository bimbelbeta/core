import { db } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { buildIdCursorPage, parseIdCursor } from "../../../lib/pagination/cursor";
import { baseImplementer } from "../../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../../lib/router-definition/middleware";
import { pickDefined } from "../../../lib/utils";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const list = admin.admin.university.universityPrograms.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseIdCursor(cursor) : undefined;

	const rows = await db
		.select({
			id: universityStudyProgram.id,
			universityId: university.id,
			universityName: university.name,
			universitySlug: university.slug,
			studyProgramId: studyProgram.id,
			studyProgramName: studyProgram.name,
			studyProgramCategory: studyProgram.category,
			tuition: universityStudyProgram.tuition,
			capacity: universityStudyProgram.capacity,
			accreditation: universityStudyProgram.accreditation,
			averageScore: universityStudyProgram.averageScore,
			isActive: universityStudyProgram.isActive,
		})
		.from(universityStudyProgram)
		.innerJoin(university, eq(university.id, universityStudyProgram.universityId))
		.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
		.where(
			and(
				cursorId !== undefined
					? isBackward
						? lt(universityStudyProgram.id, cursorId)
						: gt(universityStudyProgram.id, cursorId)
					: undefined,
				input.universityId ? eq(universityStudyProgram.universityId, input.universityId) : undefined,
				input.studyProgramId ? eq(universityStudyProgram.studyProgramId, input.studyProgramId) : undefined,
			),
		)
		.orderBy(isBackward ? desc(universityStudyProgram.id) : asc(universityStudyProgram.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursor);

	return {
		items: items.map((r) => ({
			id: r.id,
			university: { id: r.universityId, name: r.universityName, slug: r.universitySlug },
			studyProgram: { id: r.studyProgramId, name: r.studyProgramName, category: r.studyProgramCategory },
			tuition: r.tuition,
			capacity: r.capacity,
			accreditation: r.accreditation,
			averageScore: r.averageScore,
			isActive: r.isActive,
		})),
		pageInfo,
	};
});

const find = admin.admin.university.universityPrograms.find.handler(async ({ input, errors }) => {
	const [link] = await db
		.select({
			id: universityStudyProgram.id,
			universityId: university.id,
			universityName: university.name,
			universitySlug: university.slug,
			studyProgramId: studyProgram.id,
			studyProgramName: studyProgram.name,
			studyProgramCategory: studyProgram.category,
			tuition: universityStudyProgram.tuition,
			capacity: universityStudyProgram.capacity,
			accreditation: universityStudyProgram.accreditation,
			averageScore: universityStudyProgram.averageScore,
			isActive: universityStudyProgram.isActive,
		})
		.from(universityStudyProgram)
		.innerJoin(university, eq(university.id, universityStudyProgram.universityId))
		.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
		.where(eq(universityStudyProgram.id, input.id))
		.limit(1);

	if (!link) {
		throw errors.NOT_FOUND({
			message: "Program universitas tidak ditemukan",
		});
	}

	const yearlyData = await db
		.select({
			id: programYearlyData.id,
			year: programYearlyData.year,
			averageGrade: programYearlyData.averageGrade,
			passingGrade: programYearlyData.passingGrade,
			applicantCount: programYearlyData.applicantCount,
			passedCount: programYearlyData.passedCount,
		})
		.from(programYearlyData)
		.where(eq(programYearlyData.universityStudyProgramId, input.id))
		.orderBy(desc(programYearlyData.year));

	return {
		id: link.id,
		university: { id: link.universityId, name: link.universityName, slug: link.universitySlug },
		studyProgram: { id: link.studyProgramId, name: link.studyProgramName, category: link.studyProgramCategory },
		tuition: link.tuition,
		capacity: link.capacity,
		accreditation: link.accreditation,
		averageScore: link.averageScore,
		isActive: link.isActive,
		yearlyData,
	};
});

const create = admin.admin.university.universityPrograms.create.handler(async ({ input, errors }) => {
	const [existing] = await db
		.select({ id: universityStudyProgram.id })
		.from(universityStudyProgram)
		.where(
			and(
				eq(universityStudyProgram.universityId, input.universityId),
				eq(universityStudyProgram.studyProgramId, input.studyProgramId),
			),
		)
		.limit(1);

	if (existing) {
		throw errors.BAD_REQUEST({
			message: "Program universitas sudah ada",
		});
	}

	const [created] = await db
		.insert(universityStudyProgram)
		.values({
			universityId: input.universityId,
			studyProgramId: input.studyProgramId,
			tuition: input.tuition ?? null,
			capacity: input.capacity ?? null,
			accreditation: input.accreditation ?? null,
			averageScore: input.averageScore ?? 500,
		})
		.returning();

	if (!created) {
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal membuat program universitas",
		});
	}

	return {
		message: "Program universitas berhasil dibuat",
		id: created.id,
	};
});

const update = admin.admin.university.universityPrograms.update.handler(async ({ input, errors }) => {
	const [updated] = await db
		.update(universityStudyProgram)
		.set({
			...pickDefined({
				tuition: input.tuition,
				capacity: input.capacity,
				accreditation: input.accreditation,
				averageScore: input.averageScore,
				isActive: input.isActive,
			}),
			updatedAt: new Date(),
		})
		.where(eq(universityStudyProgram.id, input.id))
		.returning();

	if (!updated) {
		throw errors.NOT_FOUND({
			message: "Program universitas tidak ditemukan",
		});
	}

	return { message: "Program universitas berhasil diperbarui" };
});

const remove = admin.admin.university.universityPrograms.remove.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(universityStudyProgram).where(eq(universityStudyProgram.id, input.id)).returning();

	if (!deleted) {
		throw errors.NOT_FOUND({
			message: "Program universitas tidak ditemukan",
		});
	}

	return { message: "Program universitas berhasil dihapus" };
});

const upsertYearlyData = admin.admin.university.universityPrograms.upsertYearlyData.handler(
	async ({ input, errors }) => {
		const [result] = await db
			.insert(programYearlyData)
			.values({
				universityStudyProgramId: input.id,
				year: input.year,
				averageGrade: input.averageGrade ?? null,
				passingGrade: input.passingGrade ?? null,
				applicantCount: input.applicantCount ?? null,
				passedCount: input.passedCount ?? null,
			})
			.onConflictDoUpdate({
				target: [programYearlyData.universityStudyProgramId, programYearlyData.year],
				set: {
					averageGrade: input.averageGrade ?? null,
					passingGrade: input.passingGrade ?? null,
					applicantCount: input.applicantCount ?? null,
					passedCount: input.passedCount ?? null,
					updatedAt: new Date(),
				},
			})
			.returning({
				id: programYearlyData.id,
			});

		if (!result) {
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal menyimpan data tahunan",
			});
		}

		return {
			message: "Data tahunan berhasil disimpan",
			id: result.id,
		};
	},
);

const removeYearlyData = admin.admin.university.universityPrograms.removeYearlyData.handler(
	async ({ input, errors }) => {
		const [deleted] = await db
			.delete(programYearlyData)
			.where(and(eq(programYearlyData.universityStudyProgramId, input.id), eq(programYearlyData.year, input.year)))
			.returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
				message: "Data tahunan tidak ditemukan",
			});
		}

		return { message: "Data tahunan berhasil dihapus" };
	},
);

export const adminUniversityProgramRouter = {
	list,
	find,
	create,
	update,
	remove,
	upsertYearlyData,
	removeYearlyData,
};
