import { db } from "@bimbelbeta/db";
import { DomainError } from "@/lib/domain-error";
import { buildIdCursorPage, decodePageInput, parseIdCursor } from "@/lib/pagination/cursor";
import { pickDefined } from "@/lib/utils";
import { createUniversityRepository, type UniversityProgramData, type UniversityRepository } from "./repository";

export type PageServiceInput = {
	limit?: number;
	after?: string;
	before?: string;
};

function parseIdPage(input: PageServiceInput) {
	const page = decodePageInput(input);
	return {
		limit: page.limit,
		isBackward: page.backward,
		cursorId: page.cursor ? parseIdCursor(page.cursor) : undefined,
		hasCursor: page.hasCursor,
	};
}

export type UpdateUniversityServiceInput = {
	id: number;
	name?: string;
	slug?: string;
	logo?: string;
	description?: string;
	location?: string;
	website?: string;
	rank?: number;
	isActive?: boolean;
};

export type CreateUniversityServiceInput = {
	name: string;
	slug: string;
	logo?: string;
	description?: string;
	location?: string;
	website?: string;
	rank?: number;
};

export type CreateStudyProgramServiceInput = {
	name: string;
	slug: string;
	description?: string;
	category: "SAINTEK" | "SOSHUM";
};

export type UpdateStudyProgramServiceInput = {
	id: number;
	name?: string;
	slug?: string;
	description?: string;
	category?: "SAINTEK" | "SOSHUM";
};

export type UpdateUniversityProgramServiceInput = {
	id: number;
	tuition?: number;
	capacity?: number;
	accreditation?: string;
	averageScore?: number;
	isActive?: boolean;
};

export type UpsertYearlyDataServiceInput = {
	id: number;
	year: number;
	averageGrade?: number;
	passingGrade?: number;
	applicantCount?: number;
	passedCount?: number;
};

export function createUniversityService({ repository }: { repository: UniversityRepository }) {
	return {
		async findUniversity(input: { id: number }) {
			const university = await repository.findUniversityDetail(input.id);
			if (!university) {
				throw new DomainError("NOT_FOUND", "Universitas tidak ditemukan");
			}

			const programRows = await repository.listProgramYearlyRowsByUniversity(input.id);

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

			for (const p of programRows) {
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

			return {
				university: {
					id: university.id,
					name: university.name,
					slug: university.slug,
					logo: university.logo,
					description: university.description,
					location: university.location,
					website: university.website,
					rank: university.rank,
				},
				studyPrograms: Array.from(programsMap.values()),
			};
		},

		async findAdminUniversity(input: { id: number }) {
			const record = await repository.findUniversity(input.id);
			if (!record) {
				throw new DomainError("NOT_FOUND", "Universitas tidak ditemukan");
			}
			return record;
		},

		async createUniversity(input: CreateUniversityServiceInput) {
			const created = await repository.createUniversity(input);
			if (!created) {
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat universitas");
			}
			return { message: "Universitas berhasil dibuat", id: created.id };
		},

		async updateUniversity(input: UpdateUniversityServiceInput) {
			const { id, ...fields } = input;
			const updated = await repository.updateUniversity(id, pickDefined(fields));
			if (!updated) {
				throw new DomainError("NOT_FOUND", "Universitas tidak ditemukan");
			}
			return { message: "Universitas berhasil diperbarui" };
		},

		async deleteUniversity(input: { id: number }) {
			const deleted = await repository.deleteUniversity(input.id);
			if (!deleted) {
				throw new DomainError("NOT_FOUND", "Universitas tidak ditemukan");
			}
			return { message: "Universitas berhasil dihapus" };
		},

		async findStudyProgram(input: { id: number }) {
			const record = await repository.findStudyProgram(input.id);
			if (!record) {
				throw new DomainError("NOT_FOUND", "Program studi tidak ditemukan");
			}
			return record;
		},

		async createStudyProgram(input: CreateStudyProgramServiceInput) {
			const created = await repository.createStudyProgram(input);
			if (!created) {
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat program studi");
			}
			return { message: "Program studi berhasil dibuat", id: created.id };
		},

		async updateStudyProgram(input: UpdateStudyProgramServiceInput) {
			const { id, ...fields } = input;
			const updated = await repository.updateStudyProgram(id, pickDefined(fields));
			if (!updated) {
				throw new DomainError("NOT_FOUND", "Program studi tidak ditemukan");
			}
			return { message: "Program studi berhasil diperbarui" };
		},

		async deleteStudyProgram(input: { id: number }) {
			const deleted = await repository.deleteStudyProgram(input.id);
			if (!deleted) {
				throw new DomainError("NOT_FOUND", "Program studi tidak ditemukan");
			}
			return { message: "Program studi berhasil dihapus" };
		},

		async findUniversityProgram(input: { id: number }) {
			const link = await repository.findUniversityProgram(input.id);
			if (!link) {
				throw new DomainError("NOT_FOUND", "Program universitas tidak ditemukan");
			}

			const yearlyData = await repository.listUniversityProgramYearlyData(input.id);

			return {
				id: link.id,
				university: { id: link.universityId, name: link.universityName, slug: link.universitySlug },
				studyProgram: {
					id: link.studyProgramId,
					name: link.studyProgramName,
					category: link.studyProgramCategory,
				},
				tuition: link.tuition,
				capacity: link.capacity,
				accreditation: link.accreditation,
				averageScore: link.averageScore,
				isActive: link.isActive,
				yearlyData,
			};
		},

		async createUniversityProgram(input: UniversityProgramData) {
			const existing = await repository.findUniversityProgramByPair(input.universityId, input.studyProgramId);
			if (existing) {
				throw new DomainError("BAD_REQUEST", "Program universitas sudah ada");
			}

			const created = await repository.createUniversityProgram(input);
			if (!created) {
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat program universitas");
			}
			return { message: "Program universitas berhasil dibuat", id: created.id };
		},

		async updateUniversityProgram(input: UpdateUniversityProgramServiceInput) {
			const { id, ...fields } = input;
			const updated = await repository.updateUniversityProgram(id, pickDefined(fields));
			if (!updated) {
				throw new DomainError("NOT_FOUND", "Program universitas tidak ditemukan");
			}
			return { message: "Program universitas berhasil diperbarui" };
		},

		async deleteUniversityProgram(input: { id: number }) {
			const deleted = await repository.deleteUniversityProgram(input.id);
			if (!deleted) {
				throw new DomainError("NOT_FOUND", "Program universitas tidak ditemukan");
			}
			return { message: "Program universitas berhasil dihapus" };
		},

		async upsertYearlyData(input: UpsertYearlyDataServiceInput) {
			const stored = await repository.upsertYearlyData({
				universityStudyProgramId: input.id,
				year: input.year,
				averageGrade: input.averageGrade,
				passingGrade: input.passingGrade,
				applicantCount: input.applicantCount,
				passedCount: input.passedCount,
			});
			if (!stored) {
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat data tahunan");
			}
			return { message: "Data tahunan berhasil disimpan", id: stored.id };
		},

		async removeYearlyData(input: { id: number; year: number }) {
			const deleted = await repository.removeYearlyData({
				universityStudyProgramId: input.id,
				year: input.year,
			});
			if (!deleted) {
				throw new DomainError("NOT_FOUND", "Data tahunan tidak ditemukan");
			}
			return { message: "Data tahunan berhasil dihapus" };
		},

		async listUniversities(input: PageServiceInput & { search?: string }) {
			const { limit, isBackward, cursorId, hasCursor } = parseIdPage(input);
			const rows = await repository.listUniversityCards({ limit, cursorId, isBackward, search: input.search });
			return buildIdCursorPage(rows, limit, isBackward, hasCursor);
		},

		async listPrograms(input: PageServiceInput & { search?: string }) {
			const { limit, isBackward, cursorId, hasCursor } = parseIdPage(input);
			const rows = await repository.listProgramCards({ limit, cursorId, isBackward, search: input.search });
			return buildIdCursorPage(rows, limit, isBackward, hasCursor);
		},

		async listProgramsByUniversity(input: { universityId: number }) {
			const items = await repository.listStudyProgramsByUniversity(input.universityId);
			return { items };
		},

		async listAdminUniversities(input: PageServiceInput & { search?: string }) {
			const { limit, isBackward, cursorId, hasCursor } = parseIdPage(input);
			const rows = await repository.listAdminUniversities({ limit, cursorId, isBackward, search: input.search });
			return buildIdCursorPage(rows, limit, isBackward, hasCursor);
		},

		async listStudyPrograms(input: PageServiceInput & { search?: string; category?: "SAINTEK" | "SOSHUM" }) {
			const { limit, isBackward, cursorId, hasCursor } = parseIdPage(input);
			const rows = await repository.listStudyPrograms({
				limit,
				cursorId,
				isBackward,
				search: input.search,
				category: input.category,
			});
			return buildIdCursorPage(rows, limit, isBackward, hasCursor);
		},

		async listUniversityPrograms(input: PageServiceInput & { universityId?: number; studyProgramId?: number }) {
			const { limit, isBackward, cursorId, hasCursor } = parseIdPage(input);
			const rows = await repository.listUniversityPrograms({
				limit,
				cursorId,
				isBackward,
				universityId: input.universityId,
				studyProgramId: input.studyProgramId,
			});
			const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, hasCursor);

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
		},
	};
}

export const universityService = createUniversityService({ repository: createUniversityRepository(db) });
