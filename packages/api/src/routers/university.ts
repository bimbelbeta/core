import { db } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, ilike, lt, or } from "drizzle-orm";
import { authed } from "../index";
import { buildIdCursorPage, parseIdCursor } from "../lib/pagination/cursor";

const listPrograms = authed.university.listPrograms.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

	const baseFilters = [
		cursorId !== undefined ? (isBackward ? lt(university.id, cursorId) : gt(university.id, cursorId)) : undefined,
		input.search && input.search.length > 0
			? or(ilike(university.name, `%${input.search}%`), ilike(studyProgram.name, `%${input.search}%`))
			: undefined,
	];

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
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(university.id) : asc(university.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(data, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

const list = authed.university.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

	const baseFilters = [
		cursorId !== undefined ? (isBackward ? lt(university.id, cursorId) : gt(university.id, cursorId)) : undefined,
		input.search && input.search.length > 0 ? ilike(university.name, `%${input.search}%`) : undefined,
	];

	const rows = await db
		.select({
			id: university.id,
			name: university.name,
			slug: university.slug,
			logo: university.logo,
			location: university.location,
			rank: university.rank,
		})
		.from(university)
		.where(and(...baseFilters.filter(Boolean)))
		.orderBy(isBackward ? desc(university.id) : asc(university.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return { items, pageInfo };
});

const listProgramsByUniversity = authed.university.listProgramsByUniversity.handler(async ({ input }) => {
	const studyPrograms = await db
		.select({
			id: studyProgram.id,
			name: studyProgram.name,
		})
		.from(universityStudyProgram)
		.innerJoin(studyProgram, eq(universityStudyProgram.studyProgramId, studyProgram.id))
		.where(eq(universityStudyProgram.universityId, input.universityId))
		.orderBy(studyProgram.name);

	return { items: studyPrograms };
});

const find = authed.university.find.handler(async ({ input, errors }) => {
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
		throw errors.NOT_FOUND({
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
	listPrograms,
	list,
	listProgramsByUniversity,
	find,
};
