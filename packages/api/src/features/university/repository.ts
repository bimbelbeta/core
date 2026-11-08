import type { DbClient } from "@bimbelbeta/db";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, asc, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm";
import { escapeLikePattern } from "@/lib/utils";

export type UniversityDetailRow = {
	id: number;
	name: string;
	slug: string;
	logo: string | null;
	description: string | null;
	location: string | null;
	website: string | null;
	rank: number | null;
};

export type UniversityRecord = typeof university.$inferSelect;

export type UniversityRecordRow = {
	id: number;
	name: string;
	slug: string;
	logo: string | null;
	description: string | null;
	location: string | null;
	website: string | null;
	rank: number | null;
	isActive: boolean;
};

export type UniversityListItemRow = UniversityRecordRow & {
	updatedAt: Date | null;
	programCount: number;
	scoreMin: number | null;
	scoreMax: number | null;
};

export type StudyProgramRecord = typeof studyProgram.$inferSelect;

export type StudyProgramRecordRow = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	category: "SAINTEK" | "SOSHUM" | null;
};

export type UniversityProgramRecord = typeof universityStudyProgram.$inferSelect;

export type UniversityProgramRow = {
	id: number;
	universityId: number;
	universityName: string;
	universitySlug: string;
	studyProgramId: number;
	studyProgramName: string;
	studyProgramCategory: "SAINTEK" | "SOSHUM" | null;
	tuition: number | null;
	capacity: number | null;
	accreditation: string | null;
	averageScore: number;
	isActive: boolean;
};

export type YearlyDataRow = {
	id: number;
	year: number;
	averageGrade: number | null;
	passingGrade: number | null;
	applicantCount: number | null;
	passedCount: number | null;
};

export type UniversityProgramData = {
	universityId: number;
	studyProgramId: number;
	tuition?: number;
	capacity?: number;
	accreditation?: string;
	averageScore?: number;
};

export type UniversityProgramPatch = Partial<
	Pick<
		typeof universityStudyProgram.$inferInsert,
		"tuition" | "capacity" | "accreditation" | "averageScore" | "isActive"
	>
>;

export type UniversityYearlyDataUpsert = {
	universityStudyProgramId: number;
	year: number;
	averageGrade?: number;
	passingGrade?: number;
	applicantCount?: number;
	passedCount?: number;
};

export type UniversityYearlyDataRef = {
	universityStudyProgramId: number;
	year: number;
};

export type UniversityPageQuery = {
	limit: number;
	cursorId: number | undefined;
	isBackward: boolean;
	search?: string;
	isActive?: boolean;
};

export type StudyProgramPageQuery = UniversityPageQuery & { category?: "SAINTEK" | "SOSHUM" };

export type UniversityProgramPageQuery = {
	limit: number;
	cursorId: number | undefined;
	isBackward: boolean;
	universityId?: number;
	studyProgramId?: number;
};

export type UniversityCardRow = {
	id: number;
	name: string;
	slug: string;
	logo: string | null;
	location: string | null;
	rank: number | null;
};

export type ProgramCardRow = {
	id: number;
	studyProgramId: number;
	name: string;
	slug: string;
	logo: string | null;
	studyProgram: string;
	score: number;
	location: string | null;
	rank: number | null;
};

export type ProgramYearlyRow = {
	programId: number;
	programName: string;
	programCategory: "SAINTEK" | "SOSHUM" | null;
	tuition: number | null;
	capacity: number | null;
	accreditation: string | null;
	year: number | null;
	averageGrade: number | null;
	passingGrade: number | null;
	applicantCount: number | null;
	passedCount: number | null;
};

export function createUniversityRepository(db: DbClient) {
	return {
		async listUniversityCards(query: UniversityPageQuery): Promise<UniversityCardRow[]> {
			return db
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
						query.cursorId !== undefined
							? query.isBackward
								? lt(university.id, query.cursorId)
								: gt(university.id, query.cursorId)
							: undefined,
						query.search && query.search.length > 0
							? ilike(university.name, `%${escapeLikePattern(query.search)}%`)
							: undefined,
					),
				)
				.orderBy(query.isBackward ? desc(university.id) : asc(university.id))
				.limit(query.limit + 1);
		},

		async listProgramCards(query: UniversityPageQuery): Promise<ProgramCardRow[]> {
			return db
				.select({
					id: universityStudyProgram.id,
					studyProgramId: studyProgram.id,
					name: university.name,
					slug: university.slug,
					logo: university.logo,
					studyProgram: studyProgram.name,
					score: universityStudyProgram.averageScore,
					location: university.location,
					rank: university.rank,
				})
				.from(university)
				.innerJoin(universityStudyProgram, eq(university.id, universityStudyProgram.universityId))
				.innerJoin(studyProgram, eq(universityStudyProgram.studyProgramId, studyProgram.id))
				.where(
					and(
						query.cursorId !== undefined
							? query.isBackward
								? lt(universityStudyProgram.id, query.cursorId)
								: gt(universityStudyProgram.id, query.cursorId)
							: undefined,
						query.search && query.search.length > 0
							? or(
									ilike(university.name, `%${escapeLikePattern(query.search)}%`),
									ilike(studyProgram.name, `%${escapeLikePattern(query.search)}%`),
								)
							: undefined,
					),
				)
				.orderBy(query.isBackward ? desc(universityStudyProgram.id) : asc(universityStudyProgram.id))
				.limit(query.limit + 1);
		},

		async listStudyProgramsByUniversity(universityId: number): Promise<{ id: number; name: string }[]> {
			return db
				.select({
					id: studyProgram.id,
					name: studyProgram.name,
				})
				.from(universityStudyProgram)
				.innerJoin(studyProgram, eq(universityStudyProgram.studyProgramId, studyProgram.id))
				.where(eq(universityStudyProgram.universityId, universityId))
				.orderBy(studyProgram.name)
				.limit(100);
		},

		async listAdminUniversities(
			query: UniversityPageQuery,
		): Promise<{ rows: UniversityListItemRow[]; totalCount: number }> {
			const filters = and(
				query.search ? sql`(${university.name} ILIKE ${`%${escapeLikePattern(query.search)}%`})` : undefined,
				query.isActive !== undefined ? eq(university.isActive, query.isActive) : undefined,
			);

			const rows = await db
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
					updatedAt: university.updatedAt,
					programCount: sql<number>`count(${universityStudyProgram.id})::int`,
					scoreMin: sql<number | null>`min(${universityStudyProgram.averageScore})::int`,
					scoreMax: sql<number | null>`max(${universityStudyProgram.averageScore})::int`,
				})
				.from(university)
				.leftJoin(universityStudyProgram, eq(universityStudyProgram.universityId, university.id))
				.where(
					and(
						query.cursorId !== undefined
							? query.isBackward
								? lt(university.id, query.cursorId)
								: gt(university.id, query.cursorId)
							: undefined,
						filters,
					),
				)
				.groupBy(university.id)
				.orderBy(query.isBackward ? desc(university.id) : asc(university.id))
				.limit(query.limit + 1);

			const [totals] = await db.select({ count: sql<number>`count(*)::int` }).from(university).where(filters);

			return {
				rows,
				totalCount: totals?.count ?? 0,
			};
		},

		async listStudyPrograms(query: StudyProgramPageQuery): Promise<StudyProgramRecordRow[]> {
			return db
				.select({
					id: studyProgram.id,
					name: studyProgram.name,
					slug: studyProgram.slug,
					description: studyProgram.description,
					category: studyProgram.category,
				})
				.from(studyProgram)
				.where(
					and(
						query.cursorId !== undefined
							? query.isBackward
								? lt(studyProgram.id, query.cursorId)
								: gt(studyProgram.id, query.cursorId)
							: undefined,
						query.search ? sql`${studyProgram.name} ILIKE ${`%${query.search}%`}` : undefined,
						query.category ? eq(studyProgram.category, query.category) : undefined,
					),
				)
				.orderBy(query.isBackward ? desc(studyProgram.id) : asc(studyProgram.id))
				.limit(query.limit + 1);
		},

		async listUniversityPrograms(query: UniversityProgramPageQuery): Promise<UniversityProgramRow[]> {
			return db
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
						query.cursorId !== undefined
							? query.isBackward
								? lt(universityStudyProgram.id, query.cursorId)
								: gt(universityStudyProgram.id, query.cursorId)
							: undefined,
						query.universityId ? eq(universityStudyProgram.universityId, query.universityId) : undefined,
						query.studyProgramId ? eq(universityStudyProgram.studyProgramId, query.studyProgramId) : undefined,
					),
				)
				.orderBy(query.isBackward ? desc(universityStudyProgram.id) : asc(universityStudyProgram.id))
				.limit(query.limit + 1);
		},

		async findUniversityDetail(id: number): Promise<UniversityDetailRow | undefined> {
			const [row] = await db
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
				.where(eq(university.id, id))
				.limit(1);
			return row;
		},

		async findUniversity(id: number): Promise<UniversityRecordRow | undefined> {
			const [row] = await db
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
				.where(eq(university.id, id))
				.limit(1);
			return row;
		},

		async createUniversity(data: {
			name: string;
			slug: string;
			logo?: string;
			description?: string;
			location?: string;
			website?: string;
			rank?: number;
		}): Promise<UniversityRecord | undefined> {
			const [row] = await db
				.insert(university)
				.values({
					name: data.name,
					slug: data.slug,
					logo: data.logo ?? null,
					description: data.description ?? null,
					location: data.location ?? null,
					website: data.website ?? null,
					rank: data.rank ?? null,
				})
				.returning();
			return row;
		},

		async updateUniversity(
			id: number,
			patch: Partial<
				Pick<
					typeof university.$inferInsert,
					"name" | "slug" | "logo" | "description" | "location" | "website" | "rank" | "isActive"
				>
			>,
		): Promise<UniversityRecord | undefined> {
			const [row] = await db
				.update(university)
				.set({ ...patch, updatedAt: new Date() })
				.where(eq(university.id, id))
				.returning();
			return row;
		},

		async deleteUniversity(id: number): Promise<UniversityRecord | undefined> {
			const [row] = await db.delete(university).where(eq(university.id, id)).returning();
			return row;
		},

		async findStudyProgram(id: number): Promise<StudyProgramRecordRow | undefined> {
			const [row] = await db
				.select({
					id: studyProgram.id,
					name: studyProgram.name,
					slug: studyProgram.slug,
					description: studyProgram.description,
					category: studyProgram.category,
				})
				.from(studyProgram)
				.where(eq(studyProgram.id, id))
				.limit(1);
			return row;
		},

		async createStudyProgram(data: {
			name: string;
			slug: string;
			description?: string;
			category: "SAINTEK" | "SOSHUM";
		}): Promise<StudyProgramRecord | undefined> {
			const [row] = await db
				.insert(studyProgram)
				.values({
					name: data.name,
					slug: data.slug,
					description: data.description ?? null,
					category: data.category,
				})
				.returning();
			return row;
		},

		async updateStudyProgram(
			id: number,
			patch: Partial<Pick<typeof studyProgram.$inferInsert, "name" | "slug" | "description" | "category">>,
		): Promise<StudyProgramRecord | undefined> {
			const [row] = await db
				.update(studyProgram)
				.set({ ...patch, updatedAt: new Date() })
				.where(eq(studyProgram.id, id))
				.returning();
			return row;
		},

		async deleteStudyProgram(id: number): Promise<StudyProgramRecord | undefined> {
			const [row] = await db.delete(studyProgram).where(eq(studyProgram.id, id)).returning();
			return row;
		},

		async findUniversityProgram(id: number): Promise<UniversityProgramRow | undefined> {
			const [row] = await db
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
				.where(eq(universityStudyProgram.id, id))
				.limit(1);
			return row;
		},

		async listUniversityProgramYearlyData(universityStudyProgramId: number): Promise<YearlyDataRow[]> {
			return db
				.select({
					id: programYearlyData.id,
					year: programYearlyData.year,
					averageGrade: programYearlyData.averageGrade,
					passingGrade: programYearlyData.passingGrade,
					applicantCount: programYearlyData.applicantCount,
					passedCount: programYearlyData.passedCount,
				})
				.from(programYearlyData)
				.where(eq(programYearlyData.universityStudyProgramId, universityStudyProgramId))
				.orderBy(desc(programYearlyData.year));
		},

		async findUniversityProgramDetail(universityId: number, studyProgramId: number) {
			const [data] = await db
				.select({
					university: {
						id: university.id,
						name: university.name,
						slug: university.slug,
						logo: university.logo,
					},
					studyProgram: {
						id: studyProgram.id,
						name: studyProgram.name,
						slug: studyProgram.slug,
						category: studyProgram.category,
						accreditation: universityStudyProgram.accreditation,
						averageScore: universityStudyProgram.averageScore,
					},
				})
				.from(university)
				.innerJoin(universityStudyProgram, eq(universityStudyProgram.universityId, university.id))
				.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
				.where(and(eq(university.id, universityId), eq(studyProgram.id, studyProgramId)));

			return data;
		},

		async findUniversityProgramByPair(
			universityId: number,
			studyProgramId: number,
		): Promise<{ id: number } | undefined> {
			const [row] = await db
				.select({ id: universityStudyProgram.id })
				.from(universityStudyProgram)
				.where(
					and(
						eq(universityStudyProgram.universityId, universityId),
						eq(universityStudyProgram.studyProgramId, studyProgramId),
					),
				)
				.limit(1);
			return row;
		},

		async createUniversityProgram(data: UniversityProgramData): Promise<UniversityProgramRecord | undefined> {
			const [row] = await db
				.insert(universityStudyProgram)
				.values({
					universityId: data.universityId,
					studyProgramId: data.studyProgramId,
					tuition: data.tuition ?? null,
					capacity: data.capacity ?? null,
					accreditation: data.accreditation ?? null,
					averageScore: data.averageScore ?? 500,
				})
				.returning();
			return row;
		},

		async updateUniversityProgram(
			id: number,
			patch: UniversityProgramPatch,
		): Promise<UniversityProgramRecord | undefined> {
			const [row] = await db
				.update(universityStudyProgram)
				.set({ ...patch, updatedAt: new Date() })
				.where(eq(universityStudyProgram.id, id))
				.returning();
			return row;
		},

		async deleteUniversityProgram(id: number): Promise<UniversityProgramRecord | undefined> {
			const [row] = await db.delete(universityStudyProgram).where(eq(universityStudyProgram.id, id)).returning();
			return row;
		},

		async upsertYearlyData(data: UniversityYearlyDataUpsert): Promise<{ id: number } | undefined> {
			const [row] = await db
				.insert(programYearlyData)
				.values({
					universityStudyProgramId: data.universityStudyProgramId,
					year: data.year,
					averageGrade: data.averageGrade ?? null,
					passingGrade: data.passingGrade ?? null,
					applicantCount: data.applicantCount ?? null,
					passedCount: data.passedCount ?? null,
				})
				.onConflictDoUpdate({
					target: [programYearlyData.universityStudyProgramId, programYearlyData.year],
					set: {
						averageGrade: data.averageGrade ?? null,
						passingGrade: data.passingGrade ?? null,
						applicantCount: data.applicantCount ?? null,
						passedCount: data.passedCount ?? null,
						updatedAt: new Date(),
					},
				})
				.returning({
					id: programYearlyData.id,
				});
			return row;
		},

		async removeYearlyData(ref: UniversityYearlyDataRef): Promise<{ id: number } | undefined> {
			const [row] = await db
				.delete(programYearlyData)
				.where(
					and(
						eq(programYearlyData.universityStudyProgramId, ref.universityStudyProgramId),
						eq(programYearlyData.year, ref.year),
					),
				)
				.returning({ id: programYearlyData.id });
			return row;
		},

		async listProgramYearlyRowsByUniversity(universityId: number): Promise<ProgramYearlyRow[]> {
			return db
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
				.where(eq(universityStudyProgram.universityId, universityId))
				.orderBy(desc(programYearlyData.year), studyProgram.name);
		},
	};
}

export type UniversityRepository = ReturnType<typeof createUniversityRepository>;
