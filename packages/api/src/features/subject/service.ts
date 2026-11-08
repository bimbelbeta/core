import { canAccessContent } from "@bimbelbeta/contract/common/content-access";
import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import type { QuestionRepository } from "@/features/question/repository";
import { createQuestionRepository } from "@/features/question/repository";
import { readTiptapContent } from "@/lib/content-utils";
import { DomainError, withErrorFallback } from "@/lib/domain-error";
import { buildIdCursorPage, decodePageInput, parseIdCursor } from "@/lib/pagination/cursor";
import { pickDefined } from "@/lib/utils";
import { createSubjectRepository, type SubjectChanges, type SubjectRepository, type SubjectRow } from "./repository";
import { validateGradeLevel } from "./utils";

export type MemberListInput = {
	category?: SubjectRow["category"];
	search?: string;
	limit?: number;
	after?: string;
	before?: string;
};

export type ListContentInput = {
	subjectId: number;
	search?: string;
	limit?: number;
	after?: string;
	before?: string;
};

export type TrackProgressInput = {
	contentId: number;
	videoCompleted?: boolean;
	noteCompleted?: boolean;
	practiceQuestionsCompleted?: boolean;
};

export type CreateSubjectInput = {
	name: string;
	shortName: string;
	description?: string | null;
	order?: number;
	category?: SubjectRow["category"];
	gradeLevel?: number | null;
};

export type UpdateSubjectInput = {
	id: number;
	name?: string;
	shortName?: string;
	description?: string | null;
	order?: number;
	category?: SubjectRow["category"];
	gradeLevel?: number | null;
};

export type SubjectServiceDependencies = {
	repository: SubjectRepository;
	questionRepository: QuestionRepository;
};

function subjectNotFound() {
	return new DomainError("NOT_FOUND", "Subject tidak ditemukan");
}

function contentNotFound() {
	return new DomainError("NOT_FOUND", "Konten tidak ditemukan");
}

function classNotFound() {
	return new DomainError("NOT_FOUND", "Kelas tidak ditemukan");
}

export function createSubjectService(deps: SubjectServiceDependencies) {
	return {
		async list(input: MemberListInput | undefined, caller: Session["user"]) {
			const { limit, backward, cursor, hasCursor } = decodePageInput(input);
			const rows = await deps.repository.listSubjects({
				limit,
				cursorId: cursor ? parseIdCursor(cursor) : null,
				backward,
				category: input?.category,
				search: input?.search,
				userId: caller.id,
			});
			return buildIdCursorPage(rows, limit, backward, hasCursor);
		},

		async listContent(input: ListContentInput, caller: Session["user"]) {
			const targetSubject = await deps.repository.findSubjectSummary(input.subjectId);
			if (!targetSubject) throw subjectNotFound();

			const { limit, backward, cursor, hasCursor } = decodePageInput(input);
			const rows = await deps.repository.listContentItems({
				subjectId: input.subjectId,
				limit,
				cursorId: cursor ? parseIdCursor(cursor) : null,
				backward,
				search: input.search,
				userId: caller.id,
			});
			const { items, pageInfo } = buildIdCursorPage(rows, limit, backward, hasCursor);

			return {
				subject: targetSubject,
				items,
				pageInfo,
			};
		},

		async findContent(input: { contentId: number }, caller: Session["user"]) {
			const row = await deps.repository.findContentDetail(input.contentId);
			if (!row) throw contentNotFound();

			if (!canAccessContent(caller.isPremium, caller.role, row.subtestOrder, row.order)) {
				throw new DomainError("FORBIDDEN", "Konten ini memerlukan akun premium");
			}

			const links = await deps.repository.listPracticeQuestionLinks(input.contentId);
			const questionsById = new Map(
				(links.length > 0
					? await deps.questionRepository.listQuestionsWithChoices(links.map((link) => link.questionId))
					: []
				).map((entry) => [entry.question.id, entry]),
			);

			const questions = links
				.flatMap((link) => {
					const entry = questionsById.get(link.questionId);
					if (!entry) return [];

					return [
						{
							questionId: link.questionId,
							order: link.order,
							question: readTiptapContent(entry.question.contentJson, entry.question.content),
							discussion: readTiptapContent(entry.question.discussionJson, entry.question.discussion),
							type: entry.question.type,
							essayCorrectAnswer: entry.question.essayCorrectAnswer ?? null,
							answers: entry.choices
								.map((choice) => ({
									id: choice.id,
									content: choice.content,
									code: choice.code,
									isCorrect: choice.isCorrect,
								}))
								.sort((a, b) => a.code.localeCompare(b.code)),
						},
					];
				})
				.sort((a, b) => a.order - b.order);

			return {
				id: row.id,
				title: row.title,
				order: row.order,
				subjectId: row.subjectId,
				video: row.videoId
					? {
							id: row.videoId,
							videoUrl: row.videoUrl!,
							content: row.videoContent,
						}
					: null,
				note: row.noteId
					? {
							id: row.noteId,
							content: row.noteContent,
						}
					: null,
				practiceQuestions: questions.length > 0 ? { questions } : null,
			};
		},

		async trackView(input: { contentId: number }, caller: Session["user"]) {
			const item = await deps.repository.findContentRef(input.contentId);
			if (!item) throw contentNotFound();

			await deps.repository.transaction(async (repository) => {
				await repository.deleteRecentView({ userId: caller.id, contentId: input.contentId });
				await repository.insertRecentView({ userId: caller.id, contentId: input.contentId });

				const toDelete = await repository.listRecentViewOverflow(caller.id);
				if (toDelete.length > 0) {
					await repository.deleteRecentViews(toDelete.map((view) => view.id));
				}
			});

			return { message: "Berhasil mencatat aktivitas" };
		},

		async listRecentViews(caller: Session["user"]) {
			return await deps.repository.listRecentViews(caller.id);
		},

		async trackSubjectView(input: { subjectId: number }, caller: Session["user"]) {
			const targetSubject = await deps.repository.findSubjectRef(input.subjectId);
			if (!targetSubject) throw subjectNotFound();

			await deps.repository.upsertSubjectView({ userId: caller.id, subjectId: input.subjectId });

			return { message: "Berhasil mencatat aktivitas" };
		},

		async updateProgress(input: TrackProgressInput, caller: Session["user"]) {
			const item = await deps.repository.findContentRef(input.contentId);
			if (!item) throw contentNotFound();

			await withErrorFallback("Gagal menyimpan progres.", () =>
				deps.repository.upsertProgress({
					userId: caller.id,
					contentItemId: input.contentId,
					videoCompleted: input.videoCompleted,
					noteCompleted: input.noteCompleted,
					practiceQuestionsCompleted: input.practiceQuestionsCompleted,
				}),
			);

			return { message: "Progress berhasil disimpan" };
		},

		async stats(caller: Session["user"]) {
			const stats = await deps.repository.countCompletedMaterials(caller.id);
			return {
				materialsCompleted: Number(stats?.materialsCompleted ?? 0),
			};
		},

		async create(input: CreateSubjectInput) {
			if (input.gradeLevel !== undefined && input.gradeLevel !== null) {
				const category = input.category ?? "utbk";
				const result = validateGradeLevel(category, input.gradeLevel);
				if (!result.valid) throw new DomainError("BAD_REQUEST", result.message!);
			}

			const created = await deps.repository.insertSubject({
				name: input.name,
				shortName: input.shortName,
				description: input.description ?? null,
				order: input.order ?? 1,
				category: input.category ?? "utbk",
				gradeLevel: input.gradeLevel ?? null,
			});

			if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat kelas");

			return {
				message: "Kelas berhasil dibuat",
				id: created.id,
			};
		},

		async update(input: UpdateSubjectInput) {
			if (input.gradeLevel !== undefined) {
				let category = input.category;

				if (!category) {
					const existing = await deps.repository.findSubjectCategory(input.id);
					if (existing) category = existing.category;
				}

				if (input.gradeLevel !== null && category) {
					const result = validateGradeLevel(category, input.gradeLevel);
					if (!result.valid) throw new DomainError("BAD_REQUEST", result.message!);
				}
			}

			const updateData: SubjectChanges = {
				...pickDefined({
					name: input.name,
					shortName: input.shortName,
					description: input.description !== undefined ? (input.description ?? null) : undefined,
					order: input.order,
					category: input.category,
					gradeLevel: input.gradeLevel !== undefined ? (input.gradeLevel ?? null) : undefined,
				}),
				updatedAt: new Date(),
			};

			const updated = await deps.repository.updateSubject(input.id, updateData);
			if (!updated) throw classNotFound();

			return { message: "Kelas berhasil diperbarui" };
		},

		async remove(input: { id: number }) {
			const removed = await deps.repository.deleteSubject(input.id);
			if (!removed) throw classNotFound();

			return { message: "Kelas berhasil dihapus" };
		},

		async reorder(input: { items: { id: number; order: number }[] }) {
			await deps.repository.reorderSubjects(input.items);
			return { message: "Urutan kelas berhasil diperbarui" };
		},
	};
}

export const subjectService = createSubjectService({
	repository: createSubjectRepository(db),
	questionRepository: createQuestionRepository(db),
});
