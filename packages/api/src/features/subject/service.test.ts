import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import type { ChoiceRow, QuestionRepository, QuestionRow } from "@/features/question/repository";
import { DomainError } from "@/lib/domain-error";
import type {
	ContentDetailRow,
	SubjectChanges,
	SubjectInsert,
	SubjectRepository,
	SubjectRow,
	UpsertProgressInput,
} from "./repository";
import { createSubjectService } from "./service";

const now = new Date("2025-01-01T00:00:00.000Z");

const caller = {
	id: "user-1",
	name: "Anggota",
	email: "anggota@example.com",
	emailVerified: true,
	image: null,
	createdAt: now,
	updatedAt: now,
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 3,
	targetUniversityId: null,
	targetStudyProgramId: null,
} satisfies Session["user"];

const premiumCaller = { ...caller, isPremium: true };
const adminCaller = { ...caller, role: "admin" as const };

const detailRow: ContentDetailRow = {
	id: 12,
	title: "Judul Materi",
	order: 3,
	subjectId: 4,
	subtestOrder: 2,
	videoId: 55,
	videoUrl: "https://youtu.be/contoh",
	videoContent: { type: "doc", content: [] },
	noteId: 7,
	noteContent: { type: "doc", content: [] },
};

const subjectRow: SubjectRow = {
	id: 4,
	name: "Matematika",
	shortName: "MTK",
	description: null,
	order: 1,
	category: "utbk",
	gradeLevel: null,
	createdAt: now,
	updatedAt: now,
};

function makeRepository(overrides: Partial<SubjectRepository> = {}): SubjectRepository {
	const unused = async () => {
		throw new Error("Metode repositori tidak terpakai dalam pengujian ini");
	};
	const repository: SubjectRepository = {
		listSubjects: unused,
		findSubjectSummary: unused,
		listContentItems: unused,
		findContentDetail: unused,
		listPracticeQuestionLinks: unused,
		findContentRef: unused,
		findSubjectRef: unused,
		listRecentViews: unused,
		deleteRecentView: unused,
		insertRecentView: unused,
		listRecentViewOverflow: unused,
		deleteRecentViews: unused,
		upsertSubjectView: unused,
		upsertProgress: unused,
		countCompletedMaterials: unused,
		insertSubject: unused,
		updateSubject: unused,
		deleteSubject: unused,
		reorderSubjects: unused,
		findSubjectCategory: unused,
		countAll: unused,
		transaction: async (fn) => fn(repository),
		...overrides,
	};
	return repository;
}

const questionRow: QuestionRow = {
	id: 31,
	type: "multiple_choice",
	content: "Soal teks",
	discussion: "Pembahasan teks",
	contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Soal" }] }] },
	discussionJson: null,
	essayCorrectAnswer: null,
	tags: ["aljabar"],
	createdAt: now,
	updatedAt: now,
};

const choiceRows: ChoiceRow[] = [
	{
		id: 101,
		questionId: 31,
		code: "B",
		content: "Pilihan B",
		isCorrect: true,
		createdAt: now,
		updatedAt: now,
	},
	{
		id: 100,
		questionId: 31,
		code: "A",
		content: "Pilihan A",
		isCorrect: false,
		createdAt: now,
		updatedAt: now,
	},
];

function makeQuestionRepository(overrides: Partial<QuestionRepository> = {}): QuestionRepository {
	const unused = async () => {
		throw new Error("Metode repositori tidak terpakai dalam pengujian ini");
	};
	const repository: QuestionRepository = {
		listQuestions: unused,
		countQuestions: unused,
		findQuestion: unused,
		listChoices: unused,
		listQuestionsWithChoices: unused,
		insertQuestion: unused,
		insertChoices: unused,
		insertChoice: unused,
		updateQuestion: unused,
		updateChoice: unused,
		deleteQuestion: unused,
		deleteChoice: unused,
		deleteChoices: unused,
		transaction: async (fn) => fn(repository),
		...overrides,
	};
	return repository;
}

function makeService(repository: SubjectRepository, questionRepository: QuestionRepository = makeQuestionRepository()) {
	return createSubjectService({ repository, questionRepository });
}

async function expectDomainError(promise: Promise<unknown>, code: string, message: string) {
	try {
		await promise;
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(DomainError);
		expect(error).toHaveProperty("code", code);
		expect(error).toHaveProperty("message", message);
	}
}

describe("subject service listContent", () => {
	test("throws NOT_FOUND when the subject is missing", async () => {
		const service = makeService(makeRepository({ findSubjectSummary: async () => undefined }));
		await expectDomainError(service.listContent({ subjectId: 4 }, caller), "NOT_FOUND", "Subject tidak ditemukan");
	});

	test("returns the subject and the cursor page built from repository rows", async () => {
		const rows = [
			{
				id: 9,
				title: "Materi",
				order: 1,
				hasVideo: true,
				hasNote: false,
				hasPracticeQuestions: false,
				videoCompleted: null,
				noteCompleted: null,
				practiceQuestionsCompleted: null,
				lastViewedAt: null,
			},
		];
		const service = makeService(
			makeRepository({
				findSubjectSummary: async () => ({
					id: 4,
					name: "Matematika",
					shortName: "MTK",
					description: null,
					order: 2,
					category: "utbk",
					gradeLevel: null,
				}),
				listContentItems: async () => rows,
			}),
		);

		const result = await service.listContent({ subjectId: 4 }, caller);
		expect(result.subject).toEqual({
			id: 4,
			name: "Matematika",
			shortName: "MTK",
			description: null,
			order: 2,
			category: "utbk",
			gradeLevel: null,
		});
		expect(result.items).toEqual(rows);
		expect(result.pageInfo.hasNextPage).toBe(false);
		expect(result.pageInfo.hasPreviousPage).toBe(false);
	});
});

describe("subject service findContent", () => {
	test("throws NOT_FOUND when the content is missing", async () => {
		const service = makeService(makeRepository({ findContentDetail: async () => undefined }));
		await expectDomainError(service.findContent({ contentId: 12 }, caller), "NOT_FOUND", "Konten tidak ditemukan");
	});

	test("serves content to a non-premium user when content access is open for all", async () => {
		const service = makeService(
			makeRepository({
				findContentDetail: async () => detailRow,
				listPracticeQuestionLinks: async () => [],
			}),
			makeQuestionRepository(),
		);
		const result = await service.findContent({ contentId: 12 }, caller);
		expect(result.id).toBe(12);
	});

	test("serves locked content to a premium caller", async () => {
		const service = makeService(
			makeRepository({
				findContentDetail: async () => detailRow,
				listPracticeQuestionLinks: async () => [],
			}),
			makeQuestionRepository(),
		);
		const result = await service.findContent({ contentId: 12 }, premiumCaller);
		expect(result.id).toBe(12);
		expect(result.practiceQuestions).toBe(null);
		expect(result.video).toEqual({
			id: 55,
			videoUrl: "https://youtu.be/contoh",
			content: { type: "doc", content: [] },
		});
	});

	test("serves locked content to an admin caller", async () => {
		const service = makeService(
			makeRepository({
				findContentDetail: async () => detailRow,
				listPracticeQuestionLinks: async () => [],
			}),
			makeQuestionRepository(),
		);
		const result = await service.findContent({ contentId: 12 }, adminCaller);
		expect(result.note).toEqual({ id: 7, content: { type: "doc", content: [] } });
	});

	test("assembles practice questions with their choices in order", async () => {
		const service = makeService(
			makeRepository({
				findContentDetail: async () => detailRow,
				listPracticeQuestionLinks: async () => [
					{ questionId: 31, order: 2 },
					{ questionId: 32, order: 1 },
				],
			}),
			makeQuestionRepository({
				listQuestionsWithChoices: async (ids) =>
					ids
						.map((id) =>
							id === 31
								? { question: questionRow, choices: choiceRows }
								: {
										question: {
											...questionRow,
											id: 32,
											type: "essay" as const,
											essayCorrectAnswer: "Jawaban esai",
										},
										choices: [],
									},
						)
						.filter(Boolean),
			}),
		);

		const result = await service.findContent({ contentId: 12 }, premiumCaller);
		expect(result.practiceQuestions?.questions).toEqual([
			{
				questionId: 32,
				order: 1,
				question: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Soal" }] }] },
				discussion: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan teks" }] }],
				},
				type: "essay",
				essayCorrectAnswer: "Jawaban esai",
				answers: [],
			},
			{
				questionId: 31,
				order: 2,
				question: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Soal" }] }] },
				discussion: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan teks" }] }],
				},
				type: "multiple_choice",
				essayCorrectAnswer: null,
				answers: [
					{ id: 100, content: "Pilihan A", code: "A", isCorrect: false },
					{ id: 101, content: "Pilihan B", code: "B", isCorrect: true },
				],
			},
		]);
	});
});

describe("subject service trackView", () => {
	test("throws NOT_FOUND when the content is missing", async () => {
		const service = makeService(makeRepository({ findContentRef: async () => undefined }));
		await expectDomainError(service.trackView({ contentId: 12 }, caller), "NOT_FOUND", "Konten tidak ditemukan");
	});

	test("re-records the view and trims beyond the five most recent", async () => {
		const calls: { deletes: { userId: string; contentId: number }[]; inserts: number; overflowDeleted: number[] } = {
			deletes: [],
			inserts: 0,
			overflowDeleted: [],
		};
		const repository = makeRepository({
			findContentRef: async () => ({ id: 12 }),
			deleteRecentView: async (input) => {
				calls.deletes.push(input);
			},
			insertRecentView: async () => {
				calls.inserts += 1;
			},
			listRecentViewOverflow: async () => [{ id: 61 }, { id: 62 }],
			deleteRecentViews: async (ids) => {
				calls.overflowDeleted.push(...ids);
			},
		});

		expect(await makeService(repository).trackView({ contentId: 12 }, caller)).toEqual({
			message: "Berhasil mencatat aktivitas",
		});
		expect(calls.deletes).toEqual([{ userId: caller.id, contentId: 12 }]);
		expect(calls.inserts).toBe(1);
		expect(calls.overflowDeleted).toEqual([61, 62]);
	});
});

describe("subject service trackSubjectView", () => {
	test("throws NOT_FOUND when the subject is missing", async () => {
		const service = makeService(makeRepository({ findSubjectRef: async () => undefined }));
		await expectDomainError(service.trackSubjectView({ subjectId: 4 }, caller), "NOT_FOUND", "Subject tidak ditemukan");
	});

	test("upserts the subject view for the caller", async () => {
		const upserts: { userId: string; subjectId: number }[] = [];
		const service = makeService(
			makeRepository({
				findSubjectRef: async () => ({ id: 4 }),
				upsertSubjectView: async (input) => {
					upserts.push(input);
				},
			}),
		);

		expect(await service.trackSubjectView({ subjectId: 4 }, caller)).toEqual({
			message: "Berhasil mencatat aktivitas",
		});
		expect(upserts).toEqual([{ userId: caller.id, subjectId: 4 }]);
	});
});

describe("subject service updateProgress", () => {
	test("throws NOT_FOUND when the content is missing", async () => {
		const service = makeService(makeRepository({ findContentRef: async () => undefined }));
		await expectDomainError(
			service.updateProgress({ contentId: 12, videoCompleted: true }, caller),
			"NOT_FOUND",
			"Konten tidak ditemukan",
		);
	});

	test("translates a failed write into INTERNAL_SERVER_ERROR", async () => {
		const service = makeService(
			makeRepository({
				findContentRef: async () => ({ id: 12 }),
				upsertProgress: async () => {
					throw new Error("write failed");
				},
			}),
		);

		await expectDomainError(
			service.updateProgress({ contentId: 12, videoCompleted: true }, caller),
			"INTERNAL_SERVER_ERROR",
			"Gagal menyimpan progres.",
		);
	});

	test("stores the completed flags for the caller", async () => {
		const upserts: UpsertProgressInput[] = [];
		const service = makeService(
			makeRepository({
				findContentRef: async () => ({ id: 12 }),
				upsertProgress: async (input) => {
					upserts.push(input);
				},
			}),
		);

		expect(await service.updateProgress({ contentId: 12, videoCompleted: true, noteCompleted: true }, caller)).toEqual({
			message: "Progress berhasil disimpan",
		});
		expect(upserts).toEqual([{ userId: caller.id, contentItemId: 12, videoCompleted: true, noteCompleted: true }]);
	});
});

describe("subject service stats", () => {
	test("returns the number of materials the caller completed", async () => {
		const service = makeService(makeRepository({ countCompletedMaterials: async () => ({ materialsCompleted: 7 }) }));
		expect(await service.stats(caller)).toEqual({ materialsCompleted: 7 });
	});

	test("returns zero when the repository has no row", async () => {
		const service = makeService(makeRepository({ countCompletedMaterials: async () => undefined }));
		expect(await service.stats(caller)).toEqual({ materialsCompleted: 0 });
	});
});

describe("subject service admin create", () => {
	test("rejects a utbk subject with a gradeLevel", async () => {
		const service = makeService(makeRepository());
		await expectDomainError(
			service.create({ name: "Kelas", shortName: "K", category: "utbk", gradeLevel: 10 }),
			"BAD_REQUEST",
			"UTBK tidak boleh memiliki gradeLevel",
		);
	});

	test("inserts with the defaults and returns the created id", async () => {
		const inserts: SubjectInsert[] = [];
		const service = makeService(
			makeRepository({
				insertSubject: async (values) => {
					inserts.push(values);
					return { ...subjectRow, ...values };
				},
			}),
		);

		expect(await service.create({ name: "Kelas Baru", shortName: "KB" })).toEqual({
			message: "Kelas berhasil dibuat",
			id: subjectRow.id,
		});
		expect(inserts).toEqual([
			{
				name: "Kelas Baru",
				shortName: "KB",
				description: null,
				order: 1,
				category: "utbk",
				gradeLevel: null,
			},
		]);
	});

	test("rejects a grade level outside the category range", async () => {
		const service = makeService(makeRepository());
		await expectDomainError(
			service.create({ name: "Kelas", shortName: "K", category: "sd", gradeLevel: 7 }),
			"BAD_REQUEST",
			"GradeLevel harus antara 1 dan 6 untuk kategori SD",
		);
	});

	test("reports an insert that returns no row as an internal error", async () => {
		const service = makeService(makeRepository({ insertSubject: async () => undefined }));
		await expectDomainError(
			service.create({ name: "Kelas", shortName: "K" }),
			"INTERNAL_SERVER_ERROR",
			"Gagal membuat kelas",
		);
	});
});

describe("subject service admin update", () => {
	test("rejects a grade level outside the resolved category range", async () => {
		const service = makeService(makeRepository({ findSubjectCategory: async () => ({ category: "sma" }) }));
		await expectDomainError(
			service.update({ id: 4, gradeLevel: 9 }),
			"BAD_REQUEST",
			"GradeLevel harus antara 10 dan 12 untuk kategori SMA",
		);
	});

	test("allows clearing the grade level", async () => {
		const changes: SubjectChanges[] = [];
		const service = makeService(
			makeRepository({
				findSubjectCategory: async () => undefined,
				updateSubject: async (_id, data) => {
					changes.push(data);
					return subjectRow;
				},
			}),
		);

		expect(await service.update({ id: 4, gradeLevel: null })).toEqual({ message: "Kelas berhasil diperbarui" });
		expect(changes[0]?.gradeLevel).toBe(null);
	});

	test("throws NOT_FOUND when the update matches no row", async () => {
		const service = makeService(makeRepository({ updateSubject: async () => undefined }));
		await expectDomainError(service.update({ id: 4 }), "NOT_FOUND", "Kelas tidak ditemukan");
	});

	test("forwards only the provided fields to the repository", async () => {
		const changes: SubjectChanges[] = [];
		const service = makeService(
			makeRepository({
				updateSubject: async (_id, data) => {
					changes.push(data);
					return subjectRow;
				},
			}),
		);

		await service.update({ id: 4, name: "Matematika Dasar", order: 5 });
		expect(changes[0]).toEqual({ name: "Matematika Dasar", order: 5, updatedAt: expect.any(Date) });
	});
});

describe("subject service admin remove", () => {
	test("throws NOT_FOUND when the delete matches no row", async () => {
		const service = makeService(makeRepository({ deleteSubject: async () => undefined }));
		await expectDomainError(service.remove({ id: 4 }), "NOT_FOUND", "Kelas tidak ditemukan");
	});

	test("deletes the subject and confirms it", async () => {
		const deleted: number[] = [];
		const service = makeService(
			makeRepository({
				deleteSubject: async (id) => {
					deleted.push(id);
					return subjectRow;
				},
			}),
		);

		expect(await service.remove({ id: 4 })).toEqual({ message: "Kelas berhasil dihapus" });
		expect(deleted).toEqual([4]);
	});
});

describe("subject service admin reorder", () => {
	test("forwards the items and confirms the update", async () => {
		const reordered: { id: number; order: number }[][] = [];
		const service = makeService(
			makeRepository({
				reorderSubjects: async (items) => {
					reordered.push(items);
				},
			}),
		);

		const items = [
			{ id: 4, order: 1 },
			{ id: 5, order: 2 },
		];
		expect(await service.reorder({ items })).toEqual({ message: "Urutan kelas berhasil diperbarui" });
		expect(reordered).toEqual([items]);
	});
});
