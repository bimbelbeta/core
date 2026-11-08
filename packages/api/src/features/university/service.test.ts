import { describe, expect, type Mock, mock, test } from "bun:test";
import { createIdCursor } from "@/lib/pagination/cursor";
import type {
	ProgramYearlyRow,
	StudyProgramRecord,
	UniversityDetailRow,
	UniversityProgramRecord,
	UniversityProgramRow,
	UniversityRecord,
	UniversityRecordRow,
	UniversityRepository,
	YearlyDataRow,
} from "./repository";
import { createUniversityService } from "./service";

type Stub<F> = F extends (...args: infer Args) => infer Return ? Mock<(...args: Args) => Return> : never;
type FakeRepository = { [M in keyof UniversityRepository]: Stub<UniversityRepository[M]> };

function createFakeRepository(): FakeRepository {
	return {
		findUniversityDetail: mock(async () => undefined),
		listProgramYearlyRowsByUniversity: mock(async () => []),
		findUniversity: mock(async () => undefined),
		createUniversity: mock(async () => undefined),
		updateUniversity: mock(async () => undefined),
		deleteUniversity: mock(async () => undefined),
		findStudyProgram: mock(async () => undefined),
		createStudyProgram: mock(async () => undefined),
		updateStudyProgram: mock(async () => undefined),
		deleteStudyProgram: mock(async () => undefined),
		findUniversityProgram: mock(async () => undefined),
		listUniversityProgramYearlyData: mock(async () => []),
		findUniversityProgramByPair: mock(async () => undefined),
		createUniversityProgram: mock(async () => undefined),
		updateUniversityProgram: mock(async () => undefined),
		deleteUniversityProgram: mock(async () => undefined),
		upsertYearlyData: mock(async () => undefined),
		removeYearlyData: mock(async () => undefined),
		listUniversityCards: mock(async () => []),
		listProgramCards: mock(async () => []),
		listStudyProgramsByUniversity: mock(async () => []),
		listAdminUniversities: mock(async () => []),
		listStudyPrograms: mock(async () => []),
		listUniversityPrograms: mock(async () => []),
	};
}

const universityRecord: UniversityRecord = {
	id: 3,
	name: "Universitas Gadjah Mada",
	slug: "ugm",
	logo: null,
	description: null,
	location: "Yogyakarta",
	website: null,
	rank: 2,
	isActive: true,
	createdAt: new Date("2025-01-01T00:00:00Z"),
	updatedAt: new Date("2025-01-01T00:00:00Z"),
};

const universityRecordRow: UniversityRecordRow = {
	id: 3,
	name: "Universitas Gadjah Mada",
	slug: "ugm",
	logo: null,
	description: null,
	location: "Yogyakarta",
	website: null,
	rank: 2,
	isActive: true,
};

const studyProgramRecord: StudyProgramRecord = {
	id: 7,
	name: "Kedokteran",
	slug: "kedokteran",
	description: null,
	category: "SAINTEK",
	createdAt: new Date("2025-01-01T00:00:00Z"),
	updatedAt: new Date("2025-01-01T00:00:00Z"),
};

const universityProgram: UniversityProgramRecord = {
	id: 9,
	universityId: 3,
	studyProgramId: 7,
	tuition: 5000000,
	capacity: 60,
	accreditation: "A",
	averageScore: 600,
	isActive: true,
	createdAt: new Date("2025-01-01T00:00:00Z"),
	updatedAt: new Date("2025-01-01T00:00:00Z"),
};

const universityProgramRow: UniversityProgramRow = {
	id: 9,
	universityId: 3,
	universityName: "Universitas Gadjah Mada",
	universitySlug: "ugm",
	studyProgramId: 7,
	studyProgramName: "Kedokteran",
	studyProgramCategory: "SAINTEK",
	tuition: 5000000,
	capacity: 60,
	accreditation: "A",
	averageScore: 600,
	isActive: true,
};

const yearlyData: YearlyDataRow = {
	id: 13,
	year: 2024,
	averageGrade: 640,
	passingGrade: 620,
	applicantCount: 5000,
	passedCount: 60,
};

describe("university service", () => {
	test("findUniversity returns the university with its study programs grouped by year", async () => {
		const universityRow: UniversityDetailRow = {
			id: 11,
			name: "Universitas Indonesia",
			slug: "ui",
			logo: null,
			description: "Kampus negeri di Depok",
			location: "Depok",
			website: "https://ui.ac.id",
			rank: 1,
		};
		const programRows: ProgramYearlyRow[] = [
			{
				programId: 5,
				programName: "Kedokteran",
				programCategory: "SAINTEK",
				tuition: 10000000,
				capacity: 100,
				accreditation: "A",
				year: 2024,
				averageGrade: 640,
				passingGrade: 620,
				applicantCount: 5000,
				passedCount: 100,
			},
			{
				programId: 5,
				programName: "Kedokteran",
				programCategory: "SAINTEK",
				tuition: 10000000,
				capacity: 100,
				accreditation: "A",
				year: 2023,
				averageGrade: 630,
				passingGrade: 610,
				applicantCount: 4200,
				passedCount: 90,
			},
			{
				programId: 6,
				programName: "Ilmu Hukum",
				programCategory: null,
				tuition: null,
				capacity: null,
				accreditation: null,
				year: null,
				averageGrade: null,
				passingGrade: null,
				applicantCount: null,
				passedCount: null,
			},
		];
		const repository = createFakeRepository();
		repository.findUniversityDetail.mockResolvedValue(universityRow);
		repository.listProgramYearlyRowsByUniversity.mockResolvedValue(programRows);
		const service = createUniversityService({ repository });

		expect(await service.findUniversity({ id: 11 })).toEqual({
			university: {
				id: 11,
				name: "Universitas Indonesia",
				slug: "ui",
				logo: null,
				description: "Kampus negeri di Depok",
				location: "Depok",
				website: "https://ui.ac.id",
				rank: 1,
			},
			studyPrograms: [
				{
					id: 5,
					name: "Kedokteran",
					category: "SAINTEK",
					tuition: 10000000,
					capacity: 100,
					accreditation: "A",
					yearlyData: [
						{ year: 2024, averageGrade: 640, passingGrade: 620, applicantCount: 5000, passedCount: 100 },
						{ year: 2023, averageGrade: 630, passingGrade: 610, applicantCount: 4200, passedCount: 90 },
					],
				},
				{
					id: 6,
					name: "Ilmu Hukum",
					category: "SAINTEK",
					tuition: null,
					capacity: null,
					accreditation: null,
					yearlyData: [],
				},
			],
		});
		expect(repository.findUniversityDetail).toHaveBeenCalledWith(11);
		expect(repository.listProgramYearlyRowsByUniversity).toHaveBeenCalledWith(11);
	});

	test("findUniversity throws a domain NOT_FOUND error when the university is missing", async () => {
		const repository = createFakeRepository();
		repository.findUniversityDetail.mockResolvedValue(undefined);
		const service = createUniversityService({ repository });

		await expect(service.findUniversity({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
		expect(repository.listProgramYearlyRowsByUniversity).not.toHaveBeenCalled();
	});
});

describe("admin university management service", () => {
	test("findAdminUniversity returns the university record", async () => {
		const repository = createFakeRepository();
		repository.findUniversity.mockResolvedValue(universityRecordRow);
		const service = createUniversityService({ repository });

		expect(await service.findAdminUniversity({ id: 3 })).toEqual(universityRecordRow);
	});

	test("findAdminUniversity throws a domain NOT_FOUND error when the university is missing", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.findAdminUniversity({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
	});

	test("createUniversity returns the created id with the success message", async () => {
		const repository = createFakeRepository();
		repository.createUniversity.mockResolvedValue(universityRecord);
		const service = createUniversityService({ repository });
		const input = { name: "Universitas Gadjah Mada", slug: "ugm" };

		expect(await service.createUniversity(input)).toEqual({
			message: "Universitas berhasil dibuat",
			id: 3,
		});
		expect(repository.createUniversity).toHaveBeenCalledWith(input);
	});

	test("createUniversity throws a domain INTERNAL_SERVER_ERROR error when no row comes back", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.createUniversity({ name: "X", slug: "x" })).rejects.toMatchObject({
			name: "DomainError",
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat universitas",
		});
	});

	test("updateUniversity sends only the defined fields and confirms", async () => {
		const repository = createFakeRepository();
		repository.updateUniversity.mockResolvedValue(universityRecord);
		const service = createUniversityService({ repository });

		expect(await service.updateUniversity({ id: 3, name: "UGM", location: undefined, isActive: false })).toEqual({
			message: "Universitas berhasil diperbarui",
		});
		expect(repository.updateUniversity).toHaveBeenCalledWith(3, { name: "UGM", isActive: false });
	});

	test("updateUniversity throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.updateUniversity({ id: 999, name: "X" })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
	});

	test("deleteUniversity throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.deleteUniversity({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
	});

	test("deleteUniversity confirms the removal", async () => {
		const repository = createFakeRepository();
		repository.deleteUniversity.mockResolvedValue(universityRecord);
		const service = createUniversityService({ repository });

		expect(await service.deleteUniversity({ id: 3 })).toEqual({ message: "Universitas berhasil dihapus" });
		expect(repository.deleteUniversity).toHaveBeenCalledWith(3);
	});
});

describe("admin study program management service", () => {
	test("findStudyProgram throws a domain NOT_FOUND error when the program is missing", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.findStudyProgram({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program studi tidak ditemukan",
		});
	});

	test("createStudyProgram returns the created id with the success message", async () => {
		const repository = createFakeRepository();
		repository.createStudyProgram.mockResolvedValue(studyProgramRecord);
		const service = createUniversityService({ repository });
		const input = { name: "Kedokteran", slug: "kedokteran", category: "SAINTEK" } as const;

		expect(await service.createStudyProgram(input)).toEqual({ message: "Program studi berhasil dibuat", id: 7 });
		expect(repository.createStudyProgram).toHaveBeenCalledWith(input);
	});

	test("updateStudyProgram sends only the defined fields and confirms", async () => {
		const repository = createFakeRepository();
		repository.updateStudyProgram.mockResolvedValue(studyProgramRecord);
		const service = createUniversityService({ repository });

		expect(await service.updateStudyProgram({ id: 7, name: "Kedokteran Gigi", description: undefined })).toEqual({
			message: "Program studi berhasil diperbarui",
		});
		expect(repository.updateStudyProgram).toHaveBeenCalledWith(7, { name: "Kedokteran Gigi" });
	});

	test("updateStudyProgram throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.updateStudyProgram({ id: 999, name: "X" })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program studi tidak ditemukan",
		});
	});

	test("deleteStudyProgram throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.deleteStudyProgram({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program studi tidak ditemukan",
		});
	});
});

describe("admin university program service", () => {
	test("findUniversityProgram merges the program link with its yearly data", async () => {
		const repository = createFakeRepository();
		repository.findUniversityProgram.mockResolvedValue(universityProgramRow);
		repository.listUniversityProgramYearlyData.mockResolvedValue([yearlyData]);
		const service = createUniversityService({ repository });

		expect(await service.findUniversityProgram({ id: 9 })).toEqual({
			id: 9,
			university: { id: 3, name: "Universitas Gadjah Mada", slug: "ugm" },
			studyProgram: { id: 7, name: "Kedokteran", category: "SAINTEK" },
			tuition: 5000000,
			capacity: 60,
			accreditation: "A",
			averageScore: 600,
			isActive: true,
			yearlyData: [yearlyData],
		});
		expect(repository.listUniversityProgramYearlyData).toHaveBeenCalledWith(9);
	});

	test("findUniversityProgram throws a domain NOT_FOUND error when the program link is missing", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.findUniversityProgram({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program universitas tidak ditemukan",
		});
		expect(repository.listUniversityProgramYearlyData).not.toHaveBeenCalled();
	});

	test("createUniversityProgram rejects a duplicate pair with BAD_REQUEST", async () => {
		const repository = createFakeRepository();
		repository.findUniversityProgramByPair.mockResolvedValue({ id: 9 });
		const service = createUniversityService({ repository });
		const input = { universityId: 3, studyProgramId: 7 };

		await expect(service.createUniversityProgram(input)).rejects.toMatchObject({
			name: "DomainError",
			code: "BAD_REQUEST",
			message: "Program universitas sudah ada",
		});
		expect(repository.createUniversityProgram).not.toHaveBeenCalled();
	});

	test("createUniversityProgram returns the created id once no duplicate exists", async () => {
		const repository = createFakeRepository();
		repository.createUniversityProgram.mockResolvedValue(universityProgram);
		const service = createUniversityService({ repository });
		const input = { universityId: 3, studyProgramId: 7 };

		expect(await service.createUniversityProgram(input)).toEqual({
			message: "Program universitas berhasil dibuat",
			id: 9,
		});
		expect(repository.findUniversityProgramByPair).toHaveBeenCalledWith(3, 7);
		expect(repository.createUniversityProgram).toHaveBeenCalledWith(input);
	});

	test("createUniversityProgram throws a domain INTERNAL_SERVER_ERROR error when no row comes back", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.createUniversityProgram({ universityId: 3, studyProgramId: 7 })).rejects.toMatchObject({
			name: "DomainError",
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat program universitas",
		});
	});

	test("updateUniversityProgram sends only the defined fields and confirms", async () => {
		const repository = createFakeRepository();
		repository.updateUniversityProgram.mockResolvedValue(universityProgram);
		const service = createUniversityService({ repository });

		expect(
			await service.updateUniversityProgram({
				id: 9,
				tuition: 6000000,
				capacity: undefined,
				accreditation: undefined,
				averageScore: undefined,
				isActive: undefined,
			}),
		).toEqual({ message: "Program universitas berhasil diperbarui" });
		expect(repository.updateUniversityProgram).toHaveBeenCalledWith(9, { tuition: 6000000 });
	});

	test("updateUniversityProgram throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.updateUniversityProgram({ id: 999, isActive: false })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program universitas tidak ditemukan",
		});
	});

	test("deleteUniversityProgram throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.deleteUniversityProgram({ id: 999 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Program universitas tidak ditemukan",
		});
	});
});

describe("yearly data service", () => {
	test("upsertYearlyData maps the program id and returns the stored id", async () => {
		const repository = createFakeRepository();
		repository.upsertYearlyData.mockResolvedValue({ id: 13 });
		const service = createUniversityService({ repository });

		expect(await service.upsertYearlyData({ id: 9, year: 2024, averageGrade: 640 })).toEqual({
			message: "Data tahunan berhasil disimpan",
			id: 13,
		});
		expect(repository.upsertYearlyData).toHaveBeenCalledWith({
			universityStudyProgramId: 9,
			year: 2024,
			averageGrade: 640,
			passingGrade: undefined,
			applicantCount: undefined,
			passedCount: undefined,
		});
	});

	test("upsertYearlyData throws a domain INTERNAL_SERVER_ERROR error when no row comes back", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.upsertYearlyData({ id: 9, year: 2024 })).rejects.toMatchObject({
			name: "DomainError",
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat data tahunan",
		});
	});

	test("removeYearlyData throws a domain NOT_FOUND error when nothing matched", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await expect(service.removeYearlyData({ id: 9, year: 2024 })).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Data tahunan tidak ditemukan",
		});
		expect(repository.removeYearlyData).toHaveBeenCalledWith({ universityStudyProgramId: 9, year: 2024 });
	});

	test("removeYearlyData confirms the removal", async () => {
		const repository = createFakeRepository();
		repository.removeYearlyData.mockResolvedValue({ id: 13 });
		const service = createUniversityService({ repository });

		expect(await service.removeYearlyData({ id: 9, year: 2024 })).toEqual({
			message: "Data tahunan berhasil dihapus",
		});
	});
});

describe("university browsing pagination", () => {
	test("listUniversities builds the page from one row past the limit", async () => {
		const repository = createFakeRepository();
		repository.listUniversityCards.mockResolvedValue([
			{ id: 20, name: "Universitas A", slug: "a", logo: null, location: "Depok", rank: 20 },
			{ id: 21, name: "Universitas B", slug: "b", logo: null, location: "Bandung", rank: 21 },
			{ id: 22, name: "Universitas C", slug: "c", logo: null, location: "Surabaya", rank: 22 },
		]);
		const service = createUniversityService({ repository });

		const page = await service.listUniversities({ limit: 2, search: "univers" });
		expect(page.items).toEqual([
			{ id: 20, name: "Universitas A", slug: "a", logo: null, location: "Depok", rank: 20 },
			{ id: 21, name: "Universitas B", slug: "b", logo: null, location: "Bandung", rank: 21 },
		]);
		expect(page.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: false,
			startCursor: createIdCursor(20),
			endCursor: createIdCursor(21),
		});
		expect(repository.listUniversityCards).toHaveBeenCalledWith({
			limit: 2,
			cursorId: undefined,
			isBackward: false,
			search: "univers",
		});
	});

	test("listUniversities applies the default and maximum limit and parses an after cursor", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		await service.listUniversities({});
		await service.listUniversities({ limit: 500, after: createIdCursor(41) });
		expect(repository.listUniversityCards).toHaveBeenNthCalledWith(1, {
			limit: 20,
			cursorId: undefined,
			isBackward: false,
			search: undefined,
		});
		expect(repository.listUniversityCards).toHaveBeenNthCalledWith(2, {
			limit: 100,
			cursorId: 41,
			isBackward: false,
			search: undefined,
		});
	});

	test("listPrograms pages backwards from a before cursor", async () => {
		const repository = createFakeRepository();
		const service = createUniversityService({ repository });

		const page = await service.listPrograms({ before: createIdCursor(5) });
		expect(page.items).toEqual([]);
		expect(repository.listProgramCards).toHaveBeenCalledWith({
			limit: 20,
			cursorId: 5,
			isBackward: true,
			search: undefined,
		});
	});
});

describe("admin university program list", () => {
	test("listUniversityPrograms maps rows into the nested response shape", async () => {
		const repository = createFakeRepository();
		repository.listUniversityPrograms.mockResolvedValue([universityProgramRow]);
		const service = createUniversityService({ repository });

		const page = await service.listUniversityPrograms({ universityId: 3 });
		expect(page.items).toEqual([
			{
				id: 9,
				university: { id: 3, name: "Universitas Gadjah Mada", slug: "ugm" },
				studyProgram: { id: 7, name: "Kedokteran", category: "SAINTEK" },
				tuition: 5000000,
				capacity: 60,
				accreditation: "A",
				averageScore: 600,
				isActive: true,
			},
		]);
		expect(page.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: createIdCursor(9),
			endCursor: createIdCursor(9),
		});
		expect(repository.listUniversityPrograms).toHaveBeenCalledWith({
			limit: 20,
			cursorId: undefined,
			isBackward: false,
			universityId: 3,
			studyProgramId: undefined,
		});
	});
});
