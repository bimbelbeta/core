import { db } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, desc, eq, sql } from "drizzle-orm";
import { authed } from "../index";

const list = authed
	.route({
		path: "/universities",
		method: "GET",
		tags: ["Universities"],
	})
	.input(
		type({
			cursor: "number?",
			limit: "number?",
			search: "string?",
		}),
	)
	.handler(async ({ input }) => {
		const limit = Math.min(input.limit ?? 20, 100);
		const cursor = input.cursor ?? 0;

		const conditions = [];
		if (input.search) {
			conditions.push(
				sql`(${university.name} ILIKE ${`%${input.search}%`} OR ${university.location} ILIKE ${`%${input.search}%`})`,
			);
		}

		const universitiesData = await db
			.select({
				id: university.id,
				name: university.name,
				slug: university.slug,
				logo: university.logo,
				location: university.location,
				rank: university.rank,
			})
			.from(university)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(university.id)
			.limit(limit + 1)
			.offset(cursor);

		const hasMore = universitiesData.length > limit;
		const results = hasMore ? universitiesData.slice(0, limit) : universitiesData;
		const nextCursor = hasMore ? results[results.length - 1]!.id : undefined;

		const universityIds = results.map((u) => u.id);

		const studyProgramsData = await db
			.select({
				universityId: universityStudyProgram.universityId,
				id: studyProgram.id,
				name: studyProgram.name,
				category: studyProgram.category,
				year: programYearlyData.year,
				averageGrade: programYearlyData.averageGrade,
				passingGrade: programYearlyData.passingGrade,
			})
			.from(universityStudyProgram)
			.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
			.leftJoin(programYearlyData, eq(programYearlyData.universityStudyProgramId, universityStudyProgram.id))
			.where(sql`${universityStudyProgram.universityId} IN ${universityIds}`)
			.orderBy(studyProgram.name);

		const studyProgramsMap = new Map<
			number,
			Array<{
				id: number;
				name: string;
				category: "SAINTEK" | "SOSHUM";
				latestData: { year: number; averageGrade: number | null; passingGrade: number | null } | null;
			}>
		>();

		for (const sp of studyProgramsData) {
			const existing = studyProgramsMap.get(sp.universityId) || [];
			const existingProgram = existing.find((p) => p.id === sp.id);

			if (existingProgram) {
				if (sp.year !== null && sp.year > (existingProgram.latestData?.year ?? 0)) {
					existingProgram.latestData = {
						year: sp.year,
						averageGrade: sp.averageGrade,
						passingGrade: sp.passingGrade,
					};
				}
			} else {
				existing.push({
					id: sp.id,
					name: sp.name,
					category: sp.category ?? "SAINTEK",
					latestData:
						sp.year !== null ? { year: sp.year, averageGrade: sp.averageGrade, passingGrade: sp.passingGrade } : null,
				});
				studyProgramsMap.set(sp.universityId, existing);
			}
		}

		const data = results.map((u) => ({
			university: {
				id: u.id,
				name: u.name,
				slug: u.slug,
				logo: u.logo,
				location: u.location,
				rank: u.rank,
			},
			studyPrograms: studyProgramsMap.get(u.id) || [],
		}));

		return { data, nextCursor };
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
	list,
	find,
};
