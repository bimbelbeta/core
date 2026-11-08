import { db } from "@bimbelbeta/db";
import { readTiptapContent } from "@/features/question/content-utils";
import { DomainError } from "@/lib/domain-error";
import type { ContentRepository, CreateContentInput } from "./repository";
import { createContentRepository } from "./repository";

type ContentServiceDependencies = {
	repository: Pick<
		ContentRepository,
		| "createContentWithMaterials"
		| "updateContent"
		| "deleteContent"
		| "reorderContents"
		| "upsertVideoMaterial"
		| "deleteVideoForContent"
		| "upsertNoteMaterial"
		| "deleteNoteForContent"
		| "findContentById"
		| "findPracticeQuestions"
		| "findChoicesByQuestionIds"
		| "findPracticeQuestionLinks"
		| "insertPracticeQuestions"
		| "deletePracticeQuestions"
		| "updatePracticeQuestionOrders"
		| "removePracticeQuestion"
	>;
};

function hasMaterials(input: CreateContentInput): boolean {
	return !!input.video || !!input.note || (input.practiceQuestionIds?.length ?? 0) > 0;
}

export function createContentService(deps: ContentServiceDependencies) {
	const repository = deps.repository;

	return {
		async create(input: CreateContentInput) {
			if (!hasMaterials(input)) {
				throw new DomainError(
					"BAD_REQUEST",
					"Konten harus memiliki minimal salah satu: video, catatan, atau latihan soal",
				);
			}
			const { contentId, videoId, noteId } = await repository.createContentWithMaterials(input);
			const createdMaterials: { video?: number; note?: number; practiceQuestions?: number } = {};
			if (input.video) createdMaterials.video = videoId;
			if (input.note) createdMaterials.note = noteId;
			if (input.practiceQuestionIds?.length) {
				createdMaterials.practiceQuestions = input.practiceQuestionIds.length;
			}
			return { contentId, createdMaterials };
		},

		async update(id: number, changes: { title?: string; order?: number }) {
			const updated = await repository.updateContent(id, changes);
			if (!updated) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
		},

		async remove(id: number) {
			const removed = await repository.deleteContent(id);
			if (!removed) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
		},

		async reorder(subjectId: number, items: { id: number; order: number }[]) {
			await repository.reorderContents(subjectId, items);
		},

		async upsertVideo(contentItemId: number, video: { videoUrl: string; content: Record<string, unknown> }) {
			if (!video.videoUrl) throw new DomainError("BAD_REQUEST", "Video URL wajib diisi");
			const content = await repository.findContentById(contentItemId);
			if (!content) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
			const saved = await repository.upsertVideoMaterial({
				contentItemId,
				videoUrl: video.videoUrl,
				content: video.content,
			});
			if (!saved) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat video material");
			return { videoId: saved.id };
		},

		async removeVideo(contentItemId: number) {
			const removed = await repository.deleteVideoForContent(contentItemId);
			if (!removed) throw new DomainError("NOT_FOUND", "Video material tidak ditemukan");
		},

		async upsertNote(contentItemId: number, note: { content: Record<string, unknown> }) {
			const content = await repository.findContentById(contentItemId);
			if (!content) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
			const saved = await repository.upsertNoteMaterial({ contentItemId, content: note.content });
			if (!saved) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat catatan material");
			return { noteId: saved.id };
		},

		async removeNote(contentItemId: number) {
			const removed = await repository.deleteNoteForContent(contentItemId);
			if (!removed) throw new DomainError("NOT_FOUND", "Catatan tidak ditemukan");
		},

		async setPracticeQuestions(contentItemId: number, questionIds: number[]) {
			await repository.deletePracticeQuestions(contentItemId);
			if (questionIds.length > 0) {
				await repository.insertPracticeQuestions(
					questionIds.map((questionId, index) => ({ contentItemId, questionId, order: index + 1 })),
				);
			}
		},

		async clearPracticeQuestions(contentItemId: number) {
			await repository.deletePracticeQuestions(contentItemId);
		},

		async listPracticeQuestions(contentItemId: number) {
			const content = await repository.findContentById(contentItemId);
			if (!content) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
			const linkedQuestions = await repository.findPracticeQuestions(contentItemId);
			const questionIds = linkedQuestions.map((question) => question.questionId);
			const allChoices = questionIds.length > 0 ? await repository.findChoicesByQuestionIds(questionIds) : [];
			const choicesByQuestionId: Record<number, (typeof allChoices)[number][]> = {};
			for (const choice of allChoices) {
				choicesByQuestionId[choice.questionId] = [...(choicesByQuestionId[choice.questionId] ?? []), choice];
			}
			return {
				questions: linkedQuestions.map((question) => ({
					questionId: question.questionId,
					order: question.order,
					type: question.type,
					content: readTiptapContent(question.contentJson, question.content),
					discussion: readTiptapContent(question.discussionJson, question.discussion),
					tags: question.tags ?? [],
					choices: choicesByQuestionId[question.questionId] ?? [],
				})),
			};
		},

		async removePracticeQuestion(contentItemId: number, questionId: number) {
			const removed = await repository.removePracticeQuestion(contentItemId, questionId);
			if (!removed) throw new DomainError("NOT_FOUND", "Soal di konten ini tidak ditemukan");
		},

		async reorderPracticeQuestions(contentItemId: number, questionIds: number[]) {
			const content = await repository.findContentById(contentItemId);
			if (!content) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
			await repository.updatePracticeQuestionOrders(
				contentItemId,
				questionIds.map((questionId, index) => ({ questionId, order: index + 1 })),
			);
		},

		async addPracticeQuestions(contentItemId: number, questionIds: number[]) {
			const content = await repository.findContentById(contentItemId);
			if (!content) throw new DomainError("NOT_FOUND", "Konten tidak ditemukan");
			const existing = await repository.findPracticeQuestionLinks(contentItemId);
			const existingIds = new Set(existing.map((link) => link.questionId));
			const maxOrder = existing.length > 0 ? Math.max(...existing.map((link) => link.order)) : 0;
			const newQuestionIds = questionIds.filter((questionId) => !existingIds.has(questionId));
			if (newQuestionIds.length === 0) return { addedCount: 0 };
			await repository.insertPracticeQuestions(
				newQuestionIds.map((questionId, index) => ({
					contentItemId,
					questionId,
					order: maxOrder + index + 1,
				})),
			);
			return { addedCount: newQuestionIds.length };
		},
	};
}

export const contentService = createContentService({ repository: createContentRepository(db) });
