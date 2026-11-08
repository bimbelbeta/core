import { describe, expect, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import { createIdCursor } from "@/lib/pagination/cursor";
import type {
	ChoiceInsertData,
	ChoiceRow,
	ChoiceUpdateData,
	ListQuestionsQuery,
	QuestionInsertData,
	QuestionRepository,
	QuestionRow,
	QuestionUpdateData,
} from "./repository";
import { createQuestionService } from "./service";

const questionRow: QuestionRow = {
	id: 7,
	type: "multiple_choice",
	content: "Soal teks",
	discussion: "Pembahasan teks",
	contentJson: { type: "doc", content: [{ type: "paragraph" }] },
	discussionJson: null,
	essayCorrectAnswer: null,
	tags: ["aljabar"],
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
	updatedAt: new Date("2025-01-02T00:00:00.000Z"),
};

const choiceRow: ChoiceRow = {
	id: 11,
	questionId: 7,
	code: "A",
	content: "Pilihan A",
	isCorrect: true,
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
	updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

function makeQuestionRow(overrides: Partial<QuestionRow>): QuestionRow {
	return { ...questionRow, ...overrides };
}

function makeRepository(overrides: Partial<QuestionRepository> = {}): QuestionRepository {
	const unused = async () => {
		throw new Error("Metode repositori tidak terpakai dalam pengujian ini");
	};
	const repository: QuestionRepository = {
		listQuestions: unused,
		findQuestion: unused,
		listChoices: unused,
		insertQuestion: unused,
		insertChoices: unused,
		updateQuestion: unused,
		deleteQuestion: unused,
		insertChoice: unused,
		updateChoice: unused,
		deleteChoice: unused,
		deleteChoices: unused,
		transaction: async (fn) => fn(repository),
		...overrides,
	};
	return repository;
}

function makeRecordingRepository() {
	const writes: {
		questions: QuestionInsertData[];
		choiceRows: ChoiceInsertData[];
	} = { questions: [], choiceRows: [] };
	const repository = makeRepository({
		insertQuestion: async (data) => {
			writes.questions.push(data);
			return { ...questionRow, ...data, id: 42 };
		},
		insertChoices: async (rows) => {
			writes.choiceRows.push(...rows);
		},
	});
	return { repository, writes };
}

describe("question service create", () => {
	test("rejects a single-answer multiple choice with fewer than two choices", async () => {
		const { repository, writes } = makeRecordingRepository();
		const base = { type: "multiple_choice" as const, content: "Soal", discussion: "Pembahasan" };

		for (const input of [base, { ...base, choices: [{ content: "Pilihan", isCorrect: true }] }]) {
			try {
				await createQuestionService(repository).create(input);
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError);
				expect(error).toHaveProperty("code", "BAD_REQUEST");
				expect(error).toHaveProperty("message", "Multiple choice harus memiliki minimal 2 pilihan");
			}
		}

		expect(writes.questions).toEqual([]);
		expect(writes.choiceRows).toEqual([]);
	});

	test("rejects a single-answer multiple choice without exactly one correct answer", async () => {
		const { repository } = makeRecordingRepository();

		for (const choices of [
			[
				{ content: "Pilihan", isCorrect: true },
				{ content: "Pilihan", isCorrect: true },
			],
			[
				{ content: "Pilihan", isCorrect: false },
				{ content: "Pilihan", isCorrect: false },
			],
		]) {
			try {
				await createQuestionService(repository).create({
					type: "multiple_choice",
					content: "Soal",
					discussion: "Pembahasan",
					choices,
				});
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError);
				expect(error).toHaveProperty("code", "BAD_REQUEST");
				expect(error).toHaveProperty("message", "Multiple choice harus memiliki tepat 1 pilihan yang benar");
			}
		}
	});

	test("rejects a complex multiple choice with fewer than two choices", async () => {
		const { repository } = makeRecordingRepository();

		try {
			await createQuestionService(repository).create({
				type: "multiple_choice_complex",
				content: "Soal",
				discussion: "Pembahasan",
			});
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "BAD_REQUEST");
			expect(error).toHaveProperty("message", "Pilihan majemuk kompleks harus memiliki minimal 2 pilihan");
		}
	});

	test("creates a question with normalized content and choices coded by position", async () => {
		const { repository, writes } = makeRecordingRepository();

		const created = await createQuestionService(repository).create({
			type: "multiple_choice",
			content: "Soal",
			discussion: { type: "doc", content: [] },
			tags: ["aljabar"],
			choices: [
				{ content: "Benar", isCorrect: true },
				{ content: "Salah", isCorrect: false },
			],
		});

		expect(created).toEqual({ id: 42 });
		expect(writes.questions).toEqual([
			{
				type: "multiple_choice",
				content: "Soal",
				contentJson: null,
				discussion: '{"type":"doc","content":[]}',
				discussionJson: { type: "doc", content: [] },
				tags: ["aljabar"],
				essayCorrectAnswer: undefined,
			},
		]);
		expect(writes.choiceRows).toEqual([
			{ questionId: 42, code: "A", content: "Benar", isCorrect: true },
			{ questionId: 42, code: "B", content: "Salah", isCorrect: false },
		]);
	});

	test("creates an essay without any choices and default tags", async () => {
		const { repository, writes } = makeRecordingRepository();

		const created = await createQuestionService(repository).create({
			type: "essay",
			content: "Soal",
			discussion: "Pembahasan",
		});

		expect(created).toEqual({ id: 42 });
		expect(writes.questions).toEqual([
			{
				type: "essay",
				content: "Soal",
				contentJson: null,
				discussion: "Pembahasan",
				discussionJson: null,
				tags: [],
				essayCorrectAnswer: undefined,
			},
		]);
		expect(writes.choiceRows).toEqual([]);
	});
});

describe("question service list", () => {
	test("lists a page of questions with normalized content", async () => {
		const queries: ListQuestionsQuery[] = [];
		const repository = makeRepository({
			listQuestions: async (query) => {
				queries.push(query);
				return [makeQuestionRow({ id: 9 }), makeQuestionRow({ id: 8 }), makeQuestionRow({ id: 7 })];
			},
		});

		const page = await createQuestionService(repository).list({});

		expect(queries).toEqual([{ limit: 10, backward: false, cursorId: undefined }]);
		expect(page.items.map((item) => item.id)).toEqual([9, 8, 7]);
		expect(page.items[0]).toEqual({
			...makeQuestionRow({ id: 9 }),
			content: { type: "doc", content: [{ type: "paragraph" }] },
			discussion: {
				type: "doc",
				content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan teks" }] }],
			},
		});
		expect(page.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: "OQ",
			endCursor: "Nw",
		});
	});

	test("returns the page before a cursor in descending order", async () => {
		const queries: ListQuestionsQuery[] = [];
		const repository = makeRepository({
			listQuestions: async (query) => {
				queries.push(query);
				return [makeQuestionRow({ id: 6 }), makeQuestionRow({ id: 7 }), makeQuestionRow({ id: 8 })];
			},
		});

		const page = await createQuestionService(repository).list({ limit: 2, before: createIdCursor(5) });

		expect(queries).toEqual([{ limit: 2, backward: true, cursorId: 5 }]);
		expect(page.items.map((item) => item.id)).toEqual([7, 6]);
		expect(page.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: true,
			startCursor: "Nw",
			endCursor: "Ng",
		});
	});
});

function makeChoiceRow(overrides: Partial<ChoiceRow>): ChoiceRow {
	return { ...choiceRow, ...overrides };
}

describe("question service update", () => {
	function makeUpdateRepository(existingChoices: ChoiceRow[], questionExists = true) {
		const writes: {
			questions: { id: number; data: QuestionUpdateData }[];
			deletedChoiceIds: number[];
			updatedChoices: { id: number; data: ChoiceUpdateData }[];
			insertedChoices: ChoiceInsertData[];
		} = { questions: [], deletedChoiceIds: [], updatedChoices: [], insertedChoices: [] };
		const repository = makeRepository({
			updateQuestion: async (id, data) => {
				writes.questions.push({ id, data });
				return questionExists ? makeQuestionRow({ ...data, id }) : undefined;
			},
			listChoices: async () => existingChoices,
			deleteChoices: async (ids) => {
				writes.deletedChoiceIds.push(...ids);
			},
			updateChoice: async (id, data) => {
				writes.updatedChoices.push({ id, data });
				return makeChoiceRow({ ...data, id });
			},
			insertChoice: async (data) => {
				writes.insertedChoices.push(data);
				return makeChoiceRow({ ...data, id: 99 });
			},
		});
		return { repository, writes };
	}

	test("reports a missing question as a NOT_FOUND domain error without touching choices", async () => {
		const { repository, writes } = makeUpdateRepository([makeChoiceRow({ id: 1 })], false);

		try {
			await createQuestionService(repository).update({ id: 7, content: "Soal baru", discussion: "Pembahasan" });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "NOT_FOUND");
			expect(error).toHaveProperty("message", "Question tidak ditemukan");
		}

		expect(writes.questions).toEqual([
			{
				id: 7,
				data: {
					content: "Soal baru",
					contentJson: null,
					discussion: "Pembahasan",
					discussionJson: null,
					essayCorrectAnswer: undefined,
					tags: [],
				},
			},
		]);
		expect(writes.deletedChoiceIds).toEqual([]);
		expect(writes.updatedChoices).toEqual([]);
		expect(writes.insertedChoices).toEqual([]);
	});

	test("updates changed choices, deletes omitted ones, and inserts new ones on free codes", async () => {
		const existing = [
			makeChoiceRow({ id: 1, code: "A", content: "Lama", isCorrect: true }),
			makeChoiceRow({ id: 2, code: "B", content: "Pilihan B", isCorrect: false }),
			makeChoiceRow({ id: 3, code: "C", content: "Pilihan C", isCorrect: false }),
			makeChoiceRow({ id: 7, code: "G", content: "Wortel", isCorrect: true }),
		];
		const { repository, writes } = makeUpdateRepository(existing);

		await createQuestionService(repository).update({
			id: 7,
			content: "Soal baru",
			discussion: { type: "doc", content: [] },
			tags: ["aljabar"],
			choices: [
				{ id: 1, content: "Baru", isCorrect: false },
				{ content: "Brokol", isCorrect: true },
				{ id: 7, content: "Wortel", isCorrect: true },
				{ content: "Buncis", isCorrect: false },
				{ content: "Bayam", isCorrect: true },
				{ content: "Selada", isCorrect: true },
			],
		});

		expect(writes.questions).toEqual([
			{
				id: 7,
				data: {
					content: "Soal baru",
					contentJson: null,
					discussion: '{"type":"doc","content":[]}',
					discussionJson: { type: "doc", content: [] },
					essayCorrectAnswer: undefined,
					tags: ["aljabar"],
				},
			},
		]);
		expect(writes.deletedChoiceIds).toEqual([2, 3]);
		expect(writes.updatedChoices).toEqual([{ id: 1, data: { content: "Baru", isCorrect: false } }]);
		expect(writes.insertedChoices).toEqual([
			{ questionId: 7, code: "B", content: "Brokol", isCorrect: true },
			{ questionId: 7, code: "C", content: "Buncis", isCorrect: false },
			{ questionId: 7, code: "D", content: "Bayam", isCorrect: true },
			{ questionId: 7, code: "E", content: "Selada", isCorrect: true },
		]);
	});

	test("skips a new choice once every code is taken", async () => {
		const existing = ["A", "B", "C", "D", "E", "F", "G"].map((code, index) =>
			makeChoiceRow({ id: index + 1, code, content: "Pilihan", isCorrect: false }),
		);
		const { repository, writes } = makeUpdateRepository(existing);

		await createQuestionService(repository).update({
			id: 7,
			content: "Soal baru",
			discussion: "Pembahasan",
			choices: [
				...existing.map((choice) => ({ id: choice.id, content: choice.content, isCorrect: choice.isCorrect })),
				{ content: "Kelebihan", isCorrect: true },
			],
		});

		expect(writes.deletedChoiceIds).toEqual([]);
		expect(writes.updatedChoices).toEqual([]);
		expect(writes.insertedChoices).toEqual([]);
	});

	test("reuses a code freed by a deleted choice", async () => {
		const existing = [
			makeChoiceRow({ id: 1, code: "A", content: "Pilihan A", isCorrect: true }),
			makeChoiceRow({ id: 2, code: "B", content: "Pilihan B", isCorrect: false }),
		];
		const { repository, writes } = makeUpdateRepository(existing);

		await createQuestionService(repository).update({
			id: 7,
			content: "Soal baru",
			discussion: "Pembahasan",
			choices: [{ content: "Segar", isCorrect: false }],
		});

		expect(writes.deletedChoiceIds).toEqual([1, 2]);
		expect(writes.insertedChoices).toEqual([{ questionId: 7, code: "A", content: "Segar", isCorrect: false }]);
	});
});

describe("question service find", () => {
	test("returns the question with normalized content and its choices", async () => {
		const repository = makeRepository({
			findQuestion: async () => questionRow,
			listChoices: async () => [choiceRow],
		});

		const found = await createQuestionService(repository).find({ id: 7 });

		expect(found).toEqual({
			question: {
				id: 7,
				type: "multiple_choice",
				content: { type: "doc", content: [{ type: "paragraph" }] },
				discussion: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan teks" }] }],
				},
				essayCorrectAnswer: null,
				tags: ["aljabar"],
			},
			choices: [choiceRow],
		});
	});

	test("reports a missing question as a NOT_FOUND domain error", async () => {
		const repository = makeRepository({
			findQuestion: async () => undefined,
		});

		try {
			await createQuestionService(repository).find({ id: 7 });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "NOT_FOUND");
			expect(error).toHaveProperty("message", "Question tidak ditemukan");
		}
	});
});

describe("question service remove", () => {
	test("deletes an existing question", async () => {
		const deletedIds: number[] = [];
		const repository = makeRepository({
			deleteQuestion: async (id) => {
				deletedIds.push(id);
				return makeQuestionRow({ id });
			},
		});

		await createQuestionService(repository).remove({ id: 7 });

		expect(deletedIds).toEqual([7]);
	});

	test("reports a missing question as a NOT_FOUND domain error", async () => {
		const repository = makeRepository({
			deleteQuestion: async () => undefined,
		});

		try {
			await createQuestionService(repository).remove({ id: 7 });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "NOT_FOUND");
			expect(error).toHaveProperty("message", "Question tidak ditemukan");
		}
	});
});

describe("question service createChoice", () => {
	function makeCreateChoiceRepository(existing: ChoiceRow[]) {
		const writes: { inserted: ChoiceInsertData[] } = { inserted: [] };
		const repository = makeRepository({
			listChoices: async () => existing,
			insertChoice: async (data) => {
				writes.inserted.push(data);
				return makeChoiceRow({ ...data, id: 99 });
			},
		});
		return { repository, writes };
	}

	test("allocates the first free choice code", async () => {
		const { repository, writes } = makeCreateChoiceRepository([
			makeChoiceRow({ id: 1, code: "A" }),
			makeChoiceRow({ id: 2, code: "B" }),
		]);

		const created = await createQuestionService(repository).createChoice({
			questionId: 7,
			content: "Brokol",
			isCorrect: true,
		});

		expect(created).toEqual({ id: 99 });
		expect(writes.inserted).toEqual([{ questionId: 7, code: "C", content: "Brokol", isCorrect: true }]);
	});

	test("rejects a choice once every code is taken", async () => {
		const existing = ["A", "B", "C", "D", "E", "F", "G"].map((code, index) => makeChoiceRow({ id: index + 1, code }));
		const { repository, writes } = makeCreateChoiceRepository(existing);

		try {
			await createQuestionService(repository).createChoice({ questionId: 7, content: "Kelebihan", isCorrect: true });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "BAD_REQUEST");
			expect(error).toHaveProperty("message", "Maksimal pilihan tercapai (7 pilihan)");
		}

		expect(writes.inserted).toEqual([]);
	});
});

describe("question service updateChoice and removeChoice", () => {
	test("updates only the fields the caller provides", async () => {
		const updates: { id: number; data: ChoiceUpdateData }[] = [];
		const repository = makeRepository({
			updateChoice: async (id, data) => {
				updates.push({ id, data });
				return makeChoiceRow({ id, ...data });
			},
		});

		await createQuestionService(repository).updateChoice({ id: 5, content: "Baru" });

		expect(updates).toEqual([{ id: 5, data: { content: "Baru" } }]);
	});

	test("reports a missing choice as a NOT_FOUND domain error", async () => {
		const repository = makeRepository({
			updateChoice: async () => undefined,
			deleteChoice: async () => undefined,
		});

		for (const callable of [
			() => createQuestionService(repository).updateChoice({ id: 5, content: "Baru" }),
			() => createQuestionService(repository).removeChoice({ id: 5 }),
		]) {
			try {
				await callable();
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError);
				expect(error).toHaveProperty("code", "NOT_FOUND");
				expect(error).toHaveProperty("message", "Choice tidak ditemukan");
			}
		}
	});

	test("deletes an existing choice", async () => {
		const deletedIds: number[] = [];
		const repository = makeRepository({
			deleteChoice: async (id) => {
				deletedIds.push(id);
				return makeChoiceRow({ id });
			},
		});

		await createQuestionService(repository).removeChoice({ id: 5 });

		expect(deletedIds).toEqual([5]);
	});
});
