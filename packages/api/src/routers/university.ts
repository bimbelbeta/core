import { db } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq, gt, ilike, or } from "drizzle-orm";
import { authed } from "../index";

const listStudyPrograms = authed
	.route({
		path: "/universities/study-programs",
		method: "GET",
		tags: ["Universities", "Study Programs"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number = 15",
			search: "string?",
		}),
	)
	.handler(async ({ input }) => {
		const limit = Math.min(input.limit, 100);

		const data = await db
			.select({
				id: university.id,
				name: university.name,
				slug: university.slug,
				logo: university.logo,
				studyProgram: studyProgram.name,
				score: programYearlyData.passingGrade,
				location: university.location,
				rank: university.rank,
			})
			.from(university)
			.innerJoin(universityStudyProgram, eq(university.id, universityStudyProgram.universityId))
			.innerJoin(studyProgram, eq(universityStudyProgram.studyProgramId, studyProgram.id))
			.innerJoin(programYearlyData, eq(universityStudyProgram.id, programYearlyData.universityStudyProgramId))
			.where(
				and(
					input.cursor ? gt(university.id, input.cursor) : undefined,
					input.search && input.search.length > 0
						? or(ilike(university.name, `%${input.search}%`), ilike(studyProgram.name, `%${input.search}%`))
						: undefined,
				),
			)
			.orderBy(university.id)
			.limit(limit + 1);

		if (!data || data.length === 0)
			return {
				data: [],
				nextCursor: undefined,
			};

		const hasMore = data.length > limit;
		const results = hasMore ? data.slice(0, limit) : data;
		const nextCursor = hasMore ? results[results.length - 1]!.id : undefined;

		return { data: results, nextCursor };
	});

const list = authed
	.route({
		path: "/universities",
		method: "GET",
		tags: ["Universities"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number = 15",
			search: "string?",
		}),
	)
	.handler(async ({ input, errors }) => {
		const universities = await db
			.select({
				id: university.id,
				name: university.name,
				slug: university.slug,
				logo: university.logo,
				location: university.location,
				rank: university.rank,
			})
			.from(university)
			.where(
				and(
					input.cursor ? gt(university.id, input.cursor) : undefined,
					input.search && input.search.length > 0 ? ilike(university.name, `%${input.search}%`) : undefined,
				),
			)
			.orderBy(university.id)
			.limit(input.limit + 1);

		if (universities.length === 0)
			throw errors.NOT_FOUND({
				message: "Gagal menemukan data Universitas. Silahkan coba lagi nanti.",
			});

		const hasMore = universities.length > input.limit;
		const results = hasMore ? universities.slice(0, input.limit) : universities;
		const nextCursor = hasMore ? results[results.length - 1]!.id : undefined;

		return { data: results, nextCursor };
	});

const listStudyProgramsByUniversity = authed
	.route({
		path: "/universities/{universityId}/study-programs",
		method: "GET",
		tags: ["Universities", "Study Programs"],
	})
	.input(type({ universityId: "number" }))
	.output(
		type({
			data: type({
				id: "number",
				name: "string",
			}).array(),
		}),
	)
	.handler(async ({ input, errors }) => {
		const studyPrograms = await db
			.select({
				id: studyProgram.id,
				name: studyProgram.name,
			})
			.from(universityStudyProgram)
			.innerJoin(studyProgram, eq(universityStudyProgram.studyProgramId, studyProgram.id))
			.where(eq(universityStudyProgram.universityId, input.universityId))
			.orderBy(studyProgram.name);

		if (studyPrograms.length === 0) {
			throw errors.NOT_FOUND({
				message: "Belum ada data Program Studi untuk Universitas ini",
			});
		}

		return { data: studyPrograms };
	});

const find = authed
	.route({
		path: "/universities/{id}",
		method: "GET",
		tags: ["Universities"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
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
			})
			.from(university)
			.where(eq(university.id, input.id))
			.limit(1);

		if (!uni) {
			throw new ORPCError("NOT_FOUND", {
				message: "Universitas tidak ditemukan",
			});
		}

		const programsData = await db
			.select({
				programId: studyProgram.id,
				programName: studyProgram.name,
				programCategory: studyProgram.category,
				tuition: universityStudyProgram.tuition,
				capacity: universityStudyProgram.capacity,
				accreditation: universityStudyProgram.accreditation,
				year: programYearlyData.year,
				averageGrade: programYearlyData.averageGrade,
				passingGrade: programYearlyData.passingGrade,
				applicantCount: programYearlyData.applicantCount,
				passedCount: programYearlyData.passedCount,
			})
			.from(universityStudyProgram)
			.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
			.leftJoin(programYearlyData, eq(programYearlyData.universityStudyProgramId, universityStudyProgram.id))
			.where(eq(universityStudyProgram.universityId, input.id))
			.orderBy(desc(programYearlyData.year), studyProgram.name);

		const programsMap = new Map<
			number,
			{
				id: number;
				name: string;
				category: string;
				tuition: number | null;
				capacity: number | null;
				accreditation: string | null;
				yearlyData: Array<{
					year: number;
					averageGrade: number | null;
					passingGrade: number | null;
					applicantCount: number | null;
					passedCount: number | null;
				}>;
			}
		>();

		for (const p of programsData) {
			const existing = programsMap.get(p.programId);

			if (existing) {
				if (p.year !== null) {
					existing.yearlyData.push({
						year: p.year,
						averageGrade: p.averageGrade,
						passingGrade: p.passingGrade,
						applicantCount: p.applicantCount,
						passedCount: p.passedCount,
					});
				}
			} else {
				programsMap.set(p.programId, {
					id: p.programId,
					name: p.programName,
					category: p.programCategory ?? "SAINTEK",
					tuition: p.tuition,
					capacity: p.capacity,
					accreditation: p.accreditation,
					yearlyData:
						p.year !== null
							? [
									{
										year: p.year,
										averageGrade: p.averageGrade,
										passingGrade: p.passingGrade,
										applicantCount: p.applicantCount,
										passedCount: p.passedCount,
									},
								]
							: [],
				});
			}
		}

		const studyPrograms = Array.from(programsMap.values());

		return {
			university: {
				id: uni.id,
				name: uni.name,
				slug: uni.slug,
				logo: uni.logo,
				description: uni.description,
				location: uni.location,
				website: uni.website,
				rank: uni.rank,
			},
			studyPrograms,
		};
	});

export const universityRouter = {
	listStudyPrograms,
	list,
	listStudyProgramsByUniversity,
	find,
};
