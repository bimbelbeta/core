import { describe, expect, mock, test } from "bun:test";
import type { TiptapDocument } from "@/lib/content-utils";
import { DomainError } from "@/lib/domain-error";
import { createContentService } from "./service";

const questionJsonDoc: TiptapDocument = {
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text: "Doc>" }] }],
};
const discussionJsonDoc: TiptapDocument = {
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text: "Disc>" }] }],
};
const questionTextWrapped: TiptapDocument = {
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text: "Question text" }] }],
};
const discussionTextWrapped: TiptapDocument = {
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text: "Discussion text" }] }],
};

function practiceQuestion(
	questionId: number,
	order: number,
): {
	questionId: number;
	order: number;
	type: "multiple_choice" | "multiple_choice_complex" | "essay";
	content: string;
	contentJson: unknown;
	discussion: string;
	discussionJson: unknown;
	tags: string[] | null;
} {
	return {
		questionId,
		order,
		type: "multiple_choice",
		content: "Question text",
		contentJson: null,
		discussion: "Discussion text",
		discussionJson: null,
		tags: null,
	};
}

function choiceRow(id: number, questionId: number, code: string) {
	return {
		id,
		questionId,
		code,
		content: `Pilihan ${code}`,
		isCorrect: code === "A",
		createdAt: new Date(0),
		updatedAt: new Date(0),
	};
}

function setup() {
	const repository = {
		findContentById: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		createContentWithMaterials: mock(
			async (): Promise<{ contentId: number; videoId: number | undefined; noteId: number | undefined }> => ({
				contentId: 1,
				videoId: undefined,
				noteId: undefined,
			}),
		),
		updateContent: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		deleteContent: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		reorderContents: mock(async (_subjectId: number, _items: { id: number; order: number }[]) => {}),
		upsertVideoMaterial: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		deleteVideoForContent: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		upsertNoteMaterial: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		deleteNoteForContent: mock(async (): Promise<{ id: number } | undefined> => ({ id: 1 })),
		findPracticeQuestions: mock(async () => [practiceQuestion(7, 1), practiceQuestion(8, 2)]),
		findChoicesByQuestionIds: mock(async () => [choiceRow(701, 7, "B"), choiceRow(702, 7, "A")]),
		findPracticeQuestionLinks: mock(async () => [{ questionId: 5, order: 2 }]),
		insertPracticeQuestions: mock(async () => {}),
		deletePracticeQuestions: mock(async () => {}),
		updatePracticeQuestionOrders: mock(async () => {}),
		removePracticeQuestion: mock(async (): Promise<{ questionId: number } | undefined> => ({ questionId: 1 })),
	};
	return { repository, service: createContentService({ repository }) };
}

async function expectDomainError(promise: Promise<unknown>, code: string, message: string) {
	try {
		await promise;
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(DomainError);
		expect(error).toMatchObject({ code, message });
	}
}

describe("content service", () => {
	test("rejects content without any material", async () => {
		const { repository, service } = setup();
		const input = { subjectId: 1, title: "Konten", order: 1 };
		await expectDomainError(
			service.create(input),
			"BAD_REQUEST",
			"Konten harus memiliki minimal salah satu: video, catatan, atau latihan soal",
		);
		await expectDomainError(
			service.create({ ...input, practiceQuestionIds: [] }),
			"BAD_REQUEST",
			"Konten harus memiliki minimal salah satu: video, catatan, atau latihan soal",
		);
		expect(repository.createContentWithMaterials).not.toHaveBeenCalled();
	});

	test("creates content and reports the ids of its materials", async () => {
		const { repository, service } = setup();
		repository.createContentWithMaterials
			.mockResolvedValueOnce({ contentId: 5, videoId: undefined, noteId: 22 })
			.mockResolvedValueOnce({ contentId: 6, videoId: 33, noteId: undefined });
		const result = await service.create({ subjectId: 1, title: "Konten", order: 1, note: { content: {} } });
		expect(result).toEqual({ contentId: 5, createdMaterials: { note: 22 } });
		const videoOnly = await service.create({
			subjectId: 1,
			title: "Konten",
			order: 2,
			video: { videoUrl: "https://youtu.be/x", content: {} },
		});
		expect(videoOnly).toEqual({ contentId: 6, createdMaterials: { video: 33 } });
	});

	test("counts practice questions written with the content", async () => {
		const { repository, service } = setup();
		repository.createContentWithMaterials.mockResolvedValueOnce({ contentId: 5, videoId: 11, noteId: 22 });
		const result = await service.create({
			subjectId: 1,
			title: "Konten",
			order: 1,
			video: { videoUrl: "https://youtu.be/x", content: {} },
			note: { content: {} },
			practiceQuestionIds: [10, 11],
		});
		expect(result).toEqual({
			contentId: 5,
			createdMaterials: { video: 11, note: 22, practiceQuestions: 2 },
		});
	});

	test("reports a missing content on update", async () => {
		const { repository, service } = setup();
		repository.updateContent.mockResolvedValueOnce(undefined);
		await expectDomainError(service.update(999, { title: "Judul" }), "NOT_FOUND", "Konten tidak ditemukan");
	});

	test("updates the content with the requested changes", async () => {
		const { repository, service } = setup();
		await service.update(5, { title: "Judul baru", order: 9 });
		expect(repository.updateContent).toHaveBeenCalledWith(5, { title: "Judul baru", order: 9 });
	});

	test("reports a missing content on remove", async () => {
		const { repository, service } = setup();
		repository.deleteContent.mockResolvedValueOnce(undefined);
		await expectDomainError(service.remove(999), "NOT_FOUND", "Konten tidak ditemukan");
	});

	test("removes the content by its id", async () => {
		const { repository, service } = setup();
		await service.remove(5);
		expect(repository.deleteContent).toHaveBeenCalledWith(5);
	});

	test("reorders contents inside their subject", async () => {
		const { repository, service } = setup();
		const items = [
			{ id: 1, order: 2 },
			{ id: 2, order: 1 },
		];
		await service.reorder(3, items);
		expect(repository.reorderContents).toHaveBeenCalledWith(3, items);
	});

	test("rejects an empty video url before anything is fetched", async () => {
		const { repository, service } = setup();
		await expectDomainError(
			service.upsertVideo(1, { videoUrl: "", content: {} }),
			"BAD_REQUEST",
			"Video URL wajib diisi",
		);
		expect(repository.findContentById).not.toHaveBeenCalled();
	});

	test("reports a missing content when saving a video", async () => {
		const { repository, service } = setup();
		repository.findContentById.mockResolvedValueOnce(undefined);
		await expectDomainError(
			service.upsertVideo(1, { videoUrl: "https://youtu.be/x", content: {} }),
			"NOT_FOUND",
			"Konten tidak ditemukan",
		);
		expect(repository.upsertVideoMaterial).not.toHaveBeenCalled();
	});

	test("saves a video material and returns its id", async () => {
		const { repository, service } = setup();
		const result = await service.upsertVideo(1, { videoUrl: "https://youtu.be/x", content: questionJsonDoc });
		expect(result).toEqual({ videoId: 1 });
		expect(repository.upsertVideoMaterial).toHaveBeenCalledWith({
			contentItemId: 1,
			videoUrl: "https://youtu.be/x",
			content: questionJsonDoc,
		});
	});

	test("reports a failed video material write", async () => {
		const { repository, service } = setup();
		repository.upsertVideoMaterial.mockResolvedValueOnce(undefined);
		await expectDomainError(
			service.upsertVideo(1, { videoUrl: "https://youtu.be/x", content: {} }),
			"INTERNAL_SERVER_ERROR",
			"Gagal membuat video material",
		);
	});

	test("reports a missing video material on remove", async () => {
		const { repository, service } = setup();
		repository.deleteVideoForContent.mockResolvedValueOnce(undefined);
		await expectDomainError(service.removeVideo(999), "NOT_FOUND", "Video material tidak ditemukan");
	});

	test("removes the video material of a content", async () => {
		const { repository, service } = setup();
		await service.removeVideo(5);
		expect(repository.deleteVideoForContent).toHaveBeenCalledWith(5);
	});

	test("reports a missing content or a failed write when saving a note", async () => {
		const { repository, service } = setup();
		repository.findContentById.mockResolvedValueOnce(undefined);
		await expectDomainError(service.upsertNote(1, { content: {} }), "NOT_FOUND", "Konten tidak ditemukan");
		repository.upsertNoteMaterial.mockResolvedValueOnce(undefined);
		await expectDomainError(
			service.upsertNote(1, { content: {} }),
			"INTERNAL_SERVER_ERROR",
			"Gagal membuat catatan material",
		);
	});

	test("saves a note material and returns its id", async () => {
		const { repository, service } = setup();
		const result = await service.upsertNote(1, { content: questionJsonDoc });
		expect(result).toEqual({ noteId: 1 });
		expect(repository.upsertNoteMaterial).toHaveBeenCalledWith({ contentItemId: 1, content: questionJsonDoc });
	});

	test("reports a missing note material on remove", async () => {
		const { repository, service } = setup();
		repository.deleteNoteForContent.mockResolvedValueOnce(undefined);
		await expectDomainError(service.removeNote(999), "NOT_FOUND", "Catatan tidak ditemukan");
	});

	test("replaces the linked questions in the given order", async () => {
		const { repository, service } = setup();
		await service.setPracticeQuestions(1, [5, 6]);
		expect(repository.deletePracticeQuestions).toHaveBeenCalledWith(1);
		expect(repository.insertPracticeQuestions).toHaveBeenCalledWith([
			{ contentItemId: 1, questionId: 5, order: 1 },
			{ contentItemId: 1, questionId: 6, order: 2 },
		]);
	});

	test("only clears the links when no question ids are given", async () => {
		const { repository, service } = setup();
		await service.setPracticeQuestions(1, []);
		expect(repository.deletePracticeQuestions).toHaveBeenCalledWith(1);
		expect(repository.insertPracticeQuestions).not.toHaveBeenCalled();
	});

	test("clears all linked questions of a content", async () => {
		const { repository, service } = setup();
		await service.clearPracticeQuestions(1);
		expect(repository.deletePracticeQuestions).toHaveBeenCalledWith(1);
	});

	test("reports a missing content when listing practice questions", async () => {
		const { repository, service } = setup();
		repository.findContentById.mockResolvedValueOnce(undefined);
		await expectDomainError(service.listPracticeQuestions(999), "NOT_FOUND", "Konten tidak ditemukan");
	});

	test("lists questions in link order with grouped choices and tiptap documents", async () => {
		const { repository, service } = setup();
		repository.findPracticeQuestions.mockResolvedValueOnce([
			{ ...practiceQuestion(7, 1), contentJson: questionJsonDoc, content: "{legacy}", tags: ["aljabar"] },
			{ ...practiceQuestion(8, 2), discussionJson: discussionJsonDoc, discussion: "{legacy}" },
		]);
		repository.findChoicesByQuestionIds.mockResolvedValueOnce([
			choiceRow(701, 7, "B"),
			choiceRow(702, 7, "A"),
			choiceRow(703, 8, "A"),
		]);
		const result = await service.listPracticeQuestions(1);
		expect(result).toEqual({
			questions: [
				{
					questionId: 7,
					order: 1,
					type: "multiple_choice",
					content: questionJsonDoc,
					discussion: discussionTextWrapped,
					tags: ["aljabar"],
					choices: [choiceRow(701, 7, "B"), choiceRow(702, 7, "A")],
				},
				{
					questionId: 8,
					order: 2,
					type: "multiple_choice",
					content: questionTextWrapped,
					discussion: discussionJsonDoc,
					tags: [],
					choices: [choiceRow(703, 8, "A")],
				},
			],
		});
	});

	test("returns no questions and skips fetching choices when none are linked", async () => {
		const { repository, service } = setup();
		repository.findPracticeQuestions.mockResolvedValueOnce([]);
		expect(await service.listPracticeQuestions(1)).toEqual({ questions: [] });
		expect(repository.findChoicesByQuestionIds).not.toHaveBeenCalled();
	});

	test("reports a missing question link on remove", async () => {
		const { repository, service } = setup();
		repository.removePracticeQuestion.mockResolvedValueOnce(undefined);
		await expectDomainError(service.removePracticeQuestion(1, 9), "NOT_FOUND", "Soal di konten ini tidak ditemukan");
	});

	test("removes a linked question", async () => {
		const { repository, service } = setup();
		await service.removePracticeQuestion(1, 9);
		expect(repository.removePracticeQuestion).toHaveBeenCalledWith(1, 9);
	});

	test("reports a missing content when reordering practice questions", async () => {
		const { repository, service } = setup();
		repository.findContentById.mockResolvedValueOnce(undefined);
		await expectDomainError(service.reorderPracticeQuestions(999, [5, 6]), "NOT_FOUND", "Konten tidak ditemukan");
		expect(repository.updatePracticeQuestionOrders).not.toHaveBeenCalled();
	});

	test("renumbers the given practice questions sequentially", async () => {
		const { repository, service } = setup();
		await service.reorderPracticeQuestions(1, [5, 6]);
		expect(repository.updatePracticeQuestionOrders).toHaveBeenCalledWith(1, [
			{ questionId: 5, order: 1 },
			{ questionId: 6, order: 2 },
		]);
	});

	test("reports a missing content when adding practice questions", async () => {
		const { repository, service } = setup();
		repository.findContentById.mockResolvedValueOnce(undefined);
		await expectDomainError(service.addPracticeQuestions(999, [5]), "NOT_FOUND", "Konten tidak ditemukan");
		expect(repository.insertPracticeQuestions).not.toHaveBeenCalled();
	});

	test("adds nothing when every question is already linked", async () => {
		const { repository, service } = setup();
		repository.findPracticeQuestionLinks.mockResolvedValueOnce([{ questionId: 5, order: 2 }]);
		expect(await service.addPracticeQuestions(1, [5, 5])).toEqual({ addedCount: 0 });
		expect(repository.insertPracticeQuestions).not.toHaveBeenCalled();
	});

	test("appends new questions after the highest existing order", async () => {
		const { repository, service } = setup();
		repository.findPracticeQuestionLinks.mockResolvedValueOnce([
			{ questionId: 5, order: 2 },
			{ questionId: 6, order: 3 },
		]);
		expect(await service.addPracticeQuestions(1, [5, 7, 8])).toEqual({ addedCount: 2 });
		expect(repository.insertPracticeQuestions).toHaveBeenCalledWith([
			{ contentItemId: 1, questionId: 7, order: 4 },
			{ contentItemId: 1, questionId: 8, order: 5 },
		]);
	});
});
