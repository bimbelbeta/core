import { describe, expect, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import { type AdminServiceRepository, type CreateTryoutInput, createTryoutAdminService } from "./admin.service";
import type {
	AccessCodeInsert,
	AccessCodeRow,
	AccessCodeSummary,
	AccessCodeView,
	SubtestInsert,
	SubtestQuestionInsert,
	SubtestRow,
	TryoutChanges,
	TryoutInsert,
	TryoutRow,
	TryoutSubtestQuestionRow,
} from "./repository";

const subtestQuestionRow: TryoutSubtestQuestionRow = {
	subtestId: 10,
	questionId: 5,
	order: 1,
	createdAt: null,
	updatedAt: null,
};
const tryoutRow: TryoutRow = {
	id: 1,
	title: "Tryout",
	description: null,
	passingGrade: 600,
	category: "utbk",
	status: "draft",
	startsAt: null,
	endsAt: null,
	createdAt: null,
	updatedAt: null,
};
const subtestRow: SubtestRow = {
	id: 10,
	tryoutId: 1,
	name: "Subtest",
	description: null,
	duration: 0,
	questionOrder: "sequential",
	order: 1,
	scoringMap: null,
};
const accessCodeRow: AccessCodeRow = {
	id: 7,
	tryoutId: 1,
	codeHash: "hash",
	codePreview: "PREVIEW",
	label: null,
	isActive: true,
	expiresAt: null,
	maxUses: null,
	usedCount: 0,
	createdAt: null,
	updatedAt: null,
};

type RecordedWrites = {
	insertedTryouts: TryoutInsert[];
	updatedTryouts: Array<{ id: number; changes: TryoutChanges }>;
	deletedTryouts: number[];
	insertedAccessCodes: AccessCodeInsert[];
	insertedSubtests: SubtestInsert[];
	updatedSubtests: Array<{ id: number; changes: Record<string, unknown> }>;
	deletedSubtests: number[];
	insertedSubtestQuestions: SubtestQuestionInsert[];
	insertedSubtestQuestionBatches: SubtestQuestionInsert[][];
	deletedSubtestQuestions: Array<{ subtestId: number; questionIds: number[] }>;
	updatedQuestionOrders: Array<{ questionId: number; order: number }>;
};

type AdminRows = {
	tryout?: TryoutRow | undefined;
	tryoutExists?: { id: number };
	attemptRowSubtests?: SubtestRow[];
	subtest?: SubtestRow | undefined;
	maxSubtestOrder?: number | null;
	maxQuestionOrder?: number | null;
	subtestQuestion?: Pick<TryoutSubtestQuestionRow, "subtestId" | "questionId"> | undefined;
	subtestQuestionIds?: Array<{ questionId: number }>;
	accessCode?: AccessCodeSummary | undefined;
	accessCodes?: AccessCodeView[];
	updatedSubtestQuestionOrders?: TryoutSubtestQuestionRow[];
	removedSubtestQuestions?: TryoutSubtestQuestionRow[];
	removedSubtestQuestion?: TryoutSubtestQuestionRow[];
	writes: RecordedWrites;
};

function makeRepository(rows: AdminRows): AdminServiceRepository {
	return {
		insertTryout: async (values: TryoutInsert) => {
			rows.writes.insertedTryouts.push(values);
			return { ...tryoutRow, ...values, id: 42 };
		},
		listForAdmin: async () => [{ ...tryoutRow, subtestCount: 0, attemptCount: 0 }],
		countForAdmin: async () => 1,
		findTryoutById: async () => rows.tryout,
		listSubtestsForTryout: async () =>
			rows.attemptRowSubtests?.map((row) => ({ ...row, questionCount: 0 })) ?? [{ ...subtestRow, questionCount: 0 }],
		updateTryout: async (id: number, changes: Record<string, unknown>) => {
			rows.writes.updatedTryouts.push({ id, changes });
			return rows.tryout ? { ...tryoutRow, id } : undefined;
		},
		deleteTryout: async (id: number) => {
			rows.writes.deletedTryouts.push(id);
			return rows.tryout ? { ...tryoutRow, id } : undefined;
		},
		findTryoutId: async () =>
			rows.tryoutExists !== undefined ? rows.tryoutExists : rows.tryout ? { id: 1 } : undefined,
		findAccessCode: async () => rows.accessCode,
		listAccessCodes: async () => rows.accessCodes ?? [],
		insertAccessCode: async (values: AccessCodeInsert) => {
			rows.writes.insertedAccessCodes.push(values);
			return { ...accessCodeRow, ...values };
		},
		updateAccessCodeStatus: async () => (rows.tryout ? { id: 7, isActive: false } : undefined),
		listAttemptsWithUsers: async () => [],
		listSubtestAttemptScores: async () => [],
		findSubtestById: async () => rows.subtest,
		maxSubtestOrder: async () => rows.maxSubtestOrder ?? null,
		insertSubtest: async (values: SubtestInsert) => {
			rows.writes.insertedSubtests.push(values);
			return { ...subtestRow, ...values, id: 11 };
		},
		updateSubtest: async (id: number, changes: Record<string, unknown>) => {
			rows.writes.updatedSubtests.push({ id, changes });
			return rows.subtest ? { ...subtestRow, id } : undefined;
		},
		deleteSubtest: async (id: number) => {
			rows.writes.deletedSubtests.push(id);
			return rows.subtest ? { ...subtestRow, id } : undefined;
		},
		listSubtestQuestions: async () => [
			{
				id: 5,
				order: 1,
				question: { id: 5, type: "multiple_choice" as const, content: "Soal", contentJson: null },
			},
		],
		findSubtestQuestion: async () => rows.subtestQuestion,
		listSubtestQuestionIds: async () => rows.subtestQuestionIds ?? [],
		maxQuestionOrder: async () => rows.maxQuestionOrder ?? null,
		insertSubtestQuestion: async (values: SubtestQuestionInsert) => {
			rows.writes.insertedSubtestQuestions.push(values);
		},
		insertSubtestQuestions: async (values: SubtestQuestionInsert[]) => {
			rows.writes.insertedSubtestQuestionBatches.push(values);
		},
		updateSubtestQuestionOrder: async (questionId: number, order: number) => {
			rows.writes.updatedQuestionOrders.push({ questionId, order });
			return rows.updatedSubtestQuestionOrders ?? [];
		},
		deleteSubtestQuestions: async (subtestId: number, questionIds: number[]) => {
			rows.writes.deletedSubtestQuestions.push({ subtestId, questionIds });
			return rows.removedSubtestQuestions ?? [];
		},
		deleteSubtestQuestion: async () => rows.removedSubtestQuestion ?? [],
	};
}

function makeService(rows: AdminRows, overrides: Partial<AdminServiceRepository> = {}) {
	return { service: createTryoutAdminService({ repository: { ...makeRepository(rows), ...overrides } }), rows };
}

function baseRows(overrides: Partial<AdminRows> = {}): AdminRows {
	return {
		tryout: tryoutRow,
		writes: {
			insertedTryouts: [],
			updatedTryouts: [],
			deletedTryouts: [],
			insertedAccessCodes: [],
			insertedSubtests: [],
			updatedSubtests: [],
			deletedSubtests: [],
			insertedSubtestQuestions: [],
			insertedSubtestQuestionBatches: [],
			deletedSubtestQuestions: [],
			updatedQuestionOrders: [],
		},
		...overrides,
	};
}

const createInput: CreateTryoutInput = {
	title: "Tryout Baru",
	category: "utbk",
};

describe("admin tryout service", () => {
	test("creates a tryout and reports the new id", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		const created = await service.create(createInput);
		expect(created).toEqual({ message: "Tryout berhasil dibuat", id: 42 });
		expect(rows.writes.insertedTryouts).toEqual([
			{
				title: "Tryout Baru",
				description: null,
				category: "utbk",
				status: "draft",
				startsAt: null,
				endsAt: null,
			},
		]);
	});

	test("creates a tryout with a window and explicit status", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		await service.create({
			...createInput,
			status: "published",
			startsAt: "2025-06-01T00:00:00.000Z",
			endsAt: "2025-06-02T00:00:00.000Z",
			description: "Deskripsi",
		});
		const [write] = rows.writes.insertedTryouts;
		if (!write) throw new Error("expected a tryout insert");
		expect(write).toMatchObject({
			status: "published",
			description: "Deskripsi",
			startsAt: new Date("2025-06-01T00:00:00.000Z"),
			endsAt: new Date("2025-06-02T00:00:00.000Z"),
		});
	});

	test("reports a failed create as an internal error", async () => {
		const rows = baseRows();
		const repository = makeRepository(rows);
		const service = createTryoutAdminService({
			repository: { ...repository, insertTryout: async () => undefined },
		});
		await expect(service.create(createInput)).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat tryout",
		});
	});

	test("finds a tryout with its subtests", async () => {
		const { service } = makeService(baseRows());
		const found = await service.find({ id: 1 });
		expect(found.tryout).toEqual(tryoutRow);
		expect(found.subtests).toEqual([{ ...subtestRow, questionCount: 0 }]);
	});

	test("still reports a bad tryout id as NOT_FOUND on the admin surface", async () => {
		const { service } = makeService(baseRows({ tryout: undefined }));
		await expect(service.find({ id: 99 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(service.update({ id: 99, title: "X" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(service.remove({ id: 99 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});

	test("updates a tryout with only the provided fields", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		const updated = await service.update({ id: 1, title: "Baru", startsAt: "2025-06-01T00:00:00.000Z" });
		expect(updated).toEqual({ message: "Tryout berhasil diperbarui" });
		const [write] = rows.writes.updatedTryouts;
		if (!write) throw new Error("expected a tryout update");
		expect(write).toMatchObject({ id: 1, changes: { title: "Baru" } });
		expect(write.changes.startsAt).toEqual(new Date("2025-06-01T00:00:00.000Z"));
		expect(write.changes.updatedAt).toBeInstanceOf(Date);
		expect(write.changes.description).toBeUndefined();
	});

	test("removes a tryout", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		await expect(service.remove({ id: 1 })).resolves.toEqual({ message: "Tryout berhasil dihapus" });
		expect(rows.writes.deletedTryouts).toEqual([1]);
	});

	test("rejects an access code on a missing tryout or an invalid quota", async () => {
		const { service } = makeService(baseRows({ tryout: undefined }));
		await expect(service.createAccessCode({ id: 99, maxUses: 1 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		const rows = baseRows();
		const withTryout = makeService(rows);
		await expect(withTryout.service.createAccessCode({ id: 1, maxUses: 0 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Maksimal penggunaan harus lebih dari 0",
		});
	});

	test("rejects a duplicate access code before writing", async () => {
		const rows = baseRows({
			accessCode: { id: 7, isActive: true, expiresAt: null, maxUses: null, usedCount: 0 },
		});
		const { service } = makeService(rows);
		await expect(service.createAccessCode({ id: 1, code: "duplikat", maxUses: 2 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Kode akses sudah ada untuk tryout ini",
		});
		expect(rows.writes.insertedAccessCodes).toEqual([]);
	});

	test("reports a failed insert as a server error, not as a duplicate code", async () => {
		const rows = baseRows();
		rows.writes.insertedAccessCodes = [];
		const { service } = makeService(rows, {
			insertAccessCode: async () => undefined,
		});
		await expect(service.createAccessCode({ id: 1, code: "baru", maxUses: 2 })).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal membuat kode akses",
		});
	});

	test("creates an access code with a generated code and returns the plain code", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		const created = await service.createAccessCode({ id: 1, label: " Kelas A ", maxUses: 5 });
		expect(created.code).toMatch(/^[A-Z0-9_-]{8}$/);
		expect(rows.writes.insertedAccessCodes[0]).toMatchObject({
			tryoutId: 1,
			label: "Kelas A",
			maxUses: 5,
			codePreview: created.code,
			codeHash: expect.any(String),
		});
	});

	test("uppercases and trims a provided access code", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		const created = await service.createAccessCode({ id: 1, code: " rumah  " });
		expect(created.code).toBe("RUMAH");
	});

	test("updates an access code status and rejects a bad one", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		await expect(service.updateAccessCodeStatus({ id: 1, accessCodeId: 7, isActive: false })).resolves.toEqual({
			id: 7,
			isActive: false,
		});
		const missing = makeService(baseRows({ tryout: undefined }));
		await expect(
			missing.service.updateAccessCodeStatus({ id: 1, accessCodeId: 7, isActive: false }),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Kode akses tidak ditemukan",
		});
	});
});

describe("admin subtest service", () => {
	test("finds, updates, and removes subtests with the stored messages", async () => {
		const rows = baseRows({ subtest: subtestRow });
		const { service } = makeService(rows);
		expect(await service.findSubtest({ id: 10 })).toEqual(subtestRow);
		await expect(service.updateSubtest({ id: 10, name: "Baru", scoringMap: null })).resolves.toEqual({
			message: "Subtest berhasil diperbarui",
		});
		expect(rows.writes.updatedSubtests[0]).toMatchObject({ id: 10 });
		await expect(service.removeSubtest({ id: 10 })).resolves.toEqual({ message: "Subtest berhasil dihapus" });
		expect(rows.writes.deletedSubtests).toEqual([10]);
	});

	test("still reports a bad subtest id as NOT_FOUND", async () => {
		const { service } = makeService(baseRows({ subtest: undefined }));
		await expect(service.findSubtest({ id: 99 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
		await expect(service.updateSubtest({ id: 99, name: "X" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
		await expect(service.removeSubtest({ id: 99 })).rejects.toBeInstanceOf(DomainError);
	});

	test("creates a subtest after its tryout, appending order defaults", async () => {
		const rows = baseRows({ maxSubtestOrder: 3 });
		const { service } = makeService(rows);
		const created = await service.createSubtest({ tryoutId: 1, name: "Subtes Baru" });
		expect(created).toEqual({ message: "Subtest berhasil dibuat", id: 11 });
		expect(rows.writes.insertedSubtests[0]).toEqual({
			tryoutId: 1,
			name: "Subtes Baru",
			description: null,
			duration: 0,
			questionOrder: "sequential",
			order: 4,
		});
	});

	test("rejects a subtest create on a missing tryout", async () => {
		const { service } = makeService(baseRows({ tryout: undefined }));
		await expect(service.createSubtest({ tryoutId: 99, name: "X" })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});
});

describe("admin subtest question service", () => {
	test("lists the subtest questions with tiptap content", async () => {
		const { service } = makeService(baseRows());
		const listed = await service.listSubtestQuestions({ subtestId: 10 });
		expect(listed.questions).toEqual([
			{
				id: 5,
				order: 1,
				question: {
					id: 5,
					type: "multiple_choice",
					content: {
						type: "doc",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Soal" }] }],
					},
					contentJson: null,
				},
			},
		]);
	});

	test("rejects adding a question that is already in the subtest", async () => {
		const rows = baseRows({ subtestQuestion: { subtestId: 10, questionId: 5 } });
		const { service } = makeService(rows);
		await expect(service.addQuestionToSubtest({ subtestId: 10, questionId: 5 })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Question sudah ada di subtest ini",
		});
		expect(rows.writes.insertedSubtestQuestions).toEqual([]);
	});

	test("appends a question after the current maximum order", async () => {
		const rows = baseRows({ maxQuestionOrder: 4 });
		const { service } = makeService(rows);
		await expect(service.addQuestionToSubtest({ subtestId: 10, questionId: 5 })).resolves.toEqual({
			message: "Question berhasil ditambahkan ke subtest",
		});
		expect(rows.writes.insertedSubtestQuestions).toEqual([{ subtestId: 10, questionId: 5, order: 5 }]);
	});

	test("honours an explicit order when adding a question", async () => {
		const rows = baseRows();
		const { service } = makeService(rows);
		await service.addQuestionToSubtest({ subtestId: 10, questionId: 5, order: 12 });
		expect(rows.writes.insertedSubtestQuestions).toEqual([{ subtestId: 10, questionId: 5, order: 12 }]);
	});

	test("bulk add skips existing questions and orders the new ones", async () => {
		const rows = baseRows({ subtestQuestionIds: [{ questionId: 2 }], maxQuestionOrder: 2 });
		const { service } = makeService(rows);
		const added = await service.bulkAddQuestionsToSubtest({ subtestId: 10, questionIds: [1, 2, 3] });
		expect(added).toEqual({ message: "Questions berhasil ditambahkan ke subtest", addedCount: 2 });
		expect(rows.writes.insertedSubtestQuestionBatches).toEqual([
			[
				{ subtestId: 10, questionId: 1, order: 3 },
				{ subtestId: 10, questionId: 3, order: 4 },
			],
		]);
	});

	test("bulk add rejects an empty list and a fully duplicated list", async () => {
		const rows = baseRows({ subtestQuestionIds: [{ questionId: 1 }] });
		const { service } = makeService(rows);
		await expect(service.bulkAddQuestionsToSubtest({ subtestId: 10, questionIds: [] })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Question IDs tidak boleh kosong",
		});
		await expect(service.bulkAddQuestionsToSubtest({ subtestId: 10, questionIds: [1] })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Semua question sudah ada di subtest ini",
		});
		expect(rows.writes.insertedSubtestQuestionBatches).toEqual([]);
	});

	test("bulk remove reports the removed count", async () => {
		const rows = baseRows({ removedSubtestQuestions: [subtestQuestionRow, subtestQuestionRow] });
		const { service } = makeService(rows);
		const removed = await service.bulkRemoveQuestionsFromSubtest({ subtestId: 10, questionIds: [1, 2] });
		expect(removed).toEqual({ message: "Questions berhasil dihapus dari subtest", removedCount: 2 });
		expect(rows.writes.deletedSubtestQuestions).toEqual([{ subtestId: 10, questionIds: [1, 2] }]);
	});

	test("rejects an empty bulk remove list", async () => {
		const { service } = makeService(baseRows());
		await expect(service.bulkRemoveQuestionsFromSubtest({ subtestId: 10, questionIds: [] })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Question IDs tidak boleh kosong",
		});
	});

	test("updates a question order and rejects a missing one", async () => {
		const rows = baseRows({ updatedSubtestQuestionOrders: [subtestQuestionRow] });
		const { service } = makeService(rows);
		await expect(service.updateSubtestQuestionOrder({ id: 5, order: 3 })).resolves.toEqual({
			message: "Urutan question berhasil diperbarui",
		});
		expect(rows.writes.updatedQuestionOrders).toEqual([{ questionId: 5, order: 3 }]);

		const missing = makeService(baseRows({ updatedSubtestQuestionOrders: [] }));
		await expect(missing.service.updateSubtestQuestionOrder({ id: 5, order: 3 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Question di subtest tidak ditemukan",
		});
	});

	test("removes a question from a subtest and rejects a missing one", async () => {
		const rows = baseRows({ removedSubtestQuestion: [subtestQuestionRow] });
		const { service } = makeService(rows);
		await expect(service.removeQuestionFromSubtest({ subtestId: 10, questionId: 5 })).resolves.toEqual({
			message: "Question berhasil dihapus dari subtest",
		});
		const missing = makeService(baseRows({ removedSubtestQuestion: [] }));
		await expect(missing.service.removeQuestionFromSubtest({ subtestId: 10, questionId: 5 })).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Question di subtest tidak ditemukan",
		});
	});
});
