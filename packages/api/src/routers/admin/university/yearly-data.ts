import { db } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq } from "drizzle-orm";
import { admin } from "../../../index";

const list = admin
	.route({
		path: "/admin/university-programs",
		method: "GET",
		tags: ["Admin - University Programs"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number?",
			universityId: "number?",
			studyProgramId: "number?",
		}),
	)
	.handler(async ({ input }) => {
		const limit = Math.min(input.limit ?? 20, 100);
		const cursor = input.cursor ?? 0;

		const conditions = [];
		if (input.universityId) {
			conditions.push(eq(universityStudyProgram.universityId, input.universityId));
		}
		if (input.studyProgramId) {
			conditions.push(eq(universityStudyProgram.studyProgramId, input.studyProgramId));
		}

		const results = await db
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
				isActive: universityStudyProgram.isActive,
			})
			.from(universityStudyProgram)
			.innerJoin(university, eq(university.id, universityStudyProgram.universityId))
			.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(universityStudyProgram.id)
			.limit(limit + 1)
			.offset(cursor);

		const hasMore = results.length > limit;
		const data = hasMore ? results.slice(0, limit) : results;
		const nextCursor = hasMore ? data[data.length - 1]!.id : null;

		return {
			data: data.map((r) => ({
				id: r.id,
				university: { id: r.universityId, name: r.universityName, slug: r.universitySlug },
				studyProgram: { id: r.studyProgramId, name: r.studyProgramName, category: r.studyProgramCategory },
				tuition: r.tuition,
				capacity: r.capacity,
				accreditation: r.accreditation,
				isActive: r.isActive,
			})),
			nextCursor,
		};
	});

const find = admin
	.route({
		path: "/admin/university-programs/{id}",
		method: "GET",
		tags: ["Admin - University Programs"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
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
				isActive: universityStudyProgram.isActive,
			})
			.from(universityStudyProgram)
			.innerJoin(university, eq(university.id, universityStudyProgram.universityId))
			.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
			.where(eq(universityStudyProgram.id, input.id))
			.limit(1);

		if (!link) {
			throw new ORPCError("NOT_FOUND", {
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
			isActive: link.isActive,
			yearlyData,
		};
	});

const create = admin
	.route({
		path: "/admin/university-programs",
		method: "POST",
		tags: ["Admin - University Programs"],
	})
	.input(
		type({
			universityId: "number",
			studyProgramId: "number",
			tuition: "number?",
			capacity: "number?",
			accreditation: "string?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
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
			throw new ORPCError("BAD_REQUEST", {
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
			})
			.returning();

		if (!created) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal membuat program universitas",
			});
		}

		return {
			message: "Program universitas berhasil dibuat",
			id: created.id,
		};
	});

const update = admin
	.route({
		path: "/admin/university-programs/{id}",
		method: "PATCH",
		tags: ["Admin - University Programs"],
	})
	.input(
		type({
			id: "number",
			tuition: "number?",
			capacity: "number?",
			accreditation: "string?",
			isActive: "boolean?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const updateData: {
			tuition?: number | null;
			capacity?: number | null;
			accreditation?: string | null;
			isActive?: boolean;
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (input.tuition !== undefined) updateData.tuition = input.tuition;
		if (input.capacity !== undefined) updateData.capacity = input.capacity;
		if (input.accreditation !== undefined) updateData.accreditation = input.accreditation;
		if (input.isActive !== undefined) updateData.isActive = input.isActive;

		const [updated] = await db
			.update(universityStudyProgram)
			.set(updateData)
			.where(eq(universityStudyProgram.id, input.id))
			.returning();

		if (!updated) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program universitas tidak ditemukan",
			});
		}

		return { message: "Program universitas berhasil diperbarui" };
	});

const remove = admin
	.route({
		path: "/admin/university-programs/{id}",
		method: "DELETE",
		tags: ["Admin - University Programs"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.delete(universityStudyProgram)
			.where(eq(universityStudyProgram.id, input.id))
			.returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Program universitas tidak ditemukan",
			});
		}

		return { message: "Program universitas berhasil dihapus" };
	});

const upsertYearlyData = admin
	.route({
		path: "/admin/university-programs/{id}/yearly",
		method: "POST",
		tags: ["Admin - University Programs"],
	})
	.input(
		type({
			id: "number",
			year: "number",
			averageGrade: "number?",
			passingGrade: "number?",
			applicantCount: "number?",
			passedCount: "number?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		const [existing] = await db
			.select({ id: programYearlyData.id })
			.from(programYearlyData)
			.where(and(eq(programYearlyData.universityStudyProgramId, input.id), eq(programYearlyData.year, input.year)))
			.limit(1);

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
			.returning();

		if (!result) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal menyimpan data tahunan",
			});
		}

		return {
			message: existing ? "Data tahunan berhasil diperbarui" : "Data tahunan berhasil dibuat",
			id: result.id,
		};
	});

const deleteYearlyData = admin
	.route({
		path: "/admin/university-programs/{id}/yearly/{year}",
		method: "DELETE",
		tags: ["Admin - University Programs"],
	})
	.input(type({ id: "number", year: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.delete(programYearlyData)
			.where(and(eq(programYearlyData.universityStudyProgramId, input.id), eq(programYearlyData.year, input.year)))
			.returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Data tahunan tidak ditemukan",
			});
		}

		return { message: "Data tahunan berhasil dihapus" };
	});

export const adminUniversityProgramRouter = {
	list,
	find,
	create,
	update,
	remove,
	upsertYearlyData,
	deleteYearlyData,
};
