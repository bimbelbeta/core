import { adminImplementer } from "@/lib/router-definition";
import { contentService } from "./service";

const admin = adminImplementer;

const create = admin.admin.content.create.handler(async ({ input }) => {
	const { contentId, createdMaterials } = await contentService.create(input);
	return { message: "Konten berhasil dibuat", contentId, createdMaterials };
});

const update = admin.admin.content.update.handler(async ({ input }) => {
	await contentService.update(input.id, { title: input.title, order: input.order });
	return { message: "Konten berhasil diperbarui" };
});

const remove = admin.admin.content.remove.handler(async ({ input }) => {
	await contentService.remove(input.id);
	return { message: "Konten berhasil dihapus" };
});

const reorder = admin.admin.content.reorder.handler(async ({ input }) => {
	await contentService.reorder(input.subjectId, input.items);
	return { message: "Urutan konten berhasil diperbarui" };
});

const upsertVideo = admin.admin.content.upsertVideo.handler(async ({ input }) => {
	const { videoId } = await contentService.upsertVideo(input.id, {
		videoUrl: input.videoUrl,
		content: input.content,
	});
	return { message: "Video material berhasil disimpan", videoId };
});

const removeVideo = admin.admin.content.removeVideo.handler(async ({ input }) => {
	await contentService.removeVideo(input.id);
	return { message: "Video material berhasil dihapus" };
});

const upsertNote = admin.admin.content.upsertNote.handler(async ({ input }) => {
	const { noteId } = await contentService.upsertNote(input.id, { content: input.content });
	return { message: "Catatan material berhasil disimpan", noteId };
});

const removeNote = admin.admin.content.removeNote.handler(async ({ input }) => {
	await contentService.removeNote(input.id);
	return { message: "Catatan material berhasil dihapus" };
});

const setPracticeQuestions = admin.admin.content.setPracticeQuestions.handler(async ({ input }) => {
	await contentService.setPracticeQuestions(input.id, input.questionIds);
	return { message: "Latihan soal berhasil dihubungkan ke konten" };
});

const clearPracticeQuestions = admin.admin.content.clearPracticeQuestions.handler(async ({ input }) => {
	await contentService.clearPracticeQuestions(input.id);
	return { message: "Latihan soal berhasil dihapus dari konten" };
});

const listPracticeQuestions = admin.admin.content.listPracticeQuestions.handler(async ({ input }) => {
	const { questions } = await contentService.listPracticeQuestions(input.id);
	return { questions };
});

const removePracticeQuestion = admin.admin.content.removePracticeQuestion.handler(async ({ input }) => {
	await contentService.removePracticeQuestion(input.id, input.questionId);
	return { message: "Soal berhasil dihapus dari konten" };
});

const reorderPracticeQuestions = admin.admin.content.reorderPracticeQuestions.handler(async ({ input }) => {
	await contentService.reorderPracticeQuestions(input.id, input.questionIds);
	return { message: "Urutan latihan soal berhasil diperbarui" };
});

const addPracticeQuestions = admin.admin.content.addPracticeQuestions.handler(async ({ input }) => {
	const { addedCount } = await contentService.addPracticeQuestions(input.id, input.questionIds);
	return {
		message: addedCount === 0 ? "Semua soal sudah ada di konten ini" : `${addedCount} soal berhasil ditambahkan`,
		addedCount,
	};
});

export const adminContentRouter = {
	create,
	update,
	remove,
	reorder,
	upsertVideo,
	removeVideo,
	upsertNote,
	removeNote,
	setPracticeQuestions,
	clearPracticeQuestions,
	listPracticeQuestions,
	removePracticeQuestion,
	reorderPracticeQuestions,
	addPracticeQuestions,
};
