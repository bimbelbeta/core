import { db } from "@bimbelbeta/db";
import { readTiptapContent } from "@/features/question/content-utils";
import { DomainError } from "@/lib/domain-error";
import { buildIdCursorPage, parseIdCursor } from "@/lib/pagination/cursor";
import { parseNullableInt, pickDefined } from "@/lib/utils";
import { generateAccessCode, hashAccessCode } from "./access-code";
import { createTryoutRepository, type TryoutRepository } from "./repository";

export type AdminServiceRepository = Pick<
	TryoutRepository,
	| "insertTryout"
	| "listForAdmin"
	| "findTryoutById"
	| "findTryoutId"
	| "listSubtestsForTryout"
	| "updateTryout"
	| "deleteTryout"
	| "findAccessCode"
	| "listAccessCodes"
	| "insertAccessCode"
	| "updateAccessCodeStatus"
	| "listAttemptsWithUsers"
	| "listSubtestAttemptScores"
	| "findSubtestById"
	| "maxSubtestOrder"
	| "insertSubtest"
	| "updateSubtest"
	| "deleteSubtest"
	| "listSubtestQuestions"
	| "findSubtestQuestion"
	| "listSubtestQuestionIds"
	| "maxQuestionOrder"
	| "insertSubtestQuestion"
	| "insertSubtestQuestions"
	| "updateSubtestQuestionOrder"
	| "deleteSubtestQuestions"
	| "deleteSubtestQuestion"
>;

type TryoutCategory = "sd" | "smp" | "sma" | "utbk";
type TryoutStatusValue = "draft" | "published" | "archived";

export type CreateTryoutInput = {
	title: string;
	description?: string | null;
	category: TryoutCategory;
	status?: TryoutStatusValue;
	startsAt?: string;
	endsAt?: string;
};

export type UpdateTryoutInput = {
	id: number;
	title?: string;
	description?: string | null;
	category?: TryoutCategory;
	status?: TryoutStatusValue;
	startsAt?: string;
	endsAt?: string;
};

export type ListTryoutInput = {
	limit?: number;
	after?: string;
	before?: string;
	search?: string;
	category?: TryoutCategory;
	status?: TryoutStatusValue;
};

export type ListAccessCodeInput = { id: number };

export type CreateAccessCodeInput = {
	id: number;
	label?: string;
	code?: string;
	expiresAt?: string;
	maxUses?: number;
};

export type UpdateAccessCodeStatusInput = { id: number; accessCodeId: number; isActive: boolean };

export type CreateSubtestInput = {
	tryoutId: number;
	name: string;
	description?: string;
	duration?: number;
	questionOrder?: "random" | "sequential";
};

export type UpdateSubtestInput = {
	id: number;
	name?: string;
	description?: string | null;
	duration?: number;
	questionOrder?: "random" | "sequential";
	scoringMap?: Record<string, number> | null;
};

export type PaginatedByTryoutInput = { id: number; limit?: number; after?: string; before?: string };
export type BySubtestInput = { subtestId: number };
export type AddQuestionInput = { subtestId: number; questionId: number; order?: number };
export type BulkQuestionsInput = { subtestId: number; questionIds: number[] };

export function createTryoutAdminService({ repository }: { repository: AdminServiceRepository }) {
	return {
		async create(input: CreateTryoutInput) {
			const created = await repository.insertTryout({
				title: input.title,
				description: input.description ?? null,
				category: input.category,
				status: input.status ?? "draft",
				startsAt: input.startsAt ? new Date(input.startsAt) : null,
				endsAt: input.endsAt ? new Date(input.endsAt) : null,
			});
			if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat tryout");
			return { message: "Tryout berhasil dibuat", id: created.id };
		},

		async list(input: ListTryoutInput) {
			const limit = input.limit ?? 10;
			const isBackward = !!input.before;
			const cursorStr = input.before || input.after;
			const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

			const rows = await repository.listForAdmin({
				limit,
				backward: isBackward,
				cursorId,
				search: input.search,
				category: input.category,
				status: input.status,
			});

			return buildIdCursorPage(rows, limit, isBackward, !!cursorStr);
		},

		async find(input: { id: number }) {
			const tryoutData = await repository.findTryoutById(input.id);
			if (!tryoutData) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const subtestsData = await repository.listSubtestsForTryout(input.id);

			return {
				tryout: tryoutData,
				subtests: subtestsData,
			};
		},

		async update(input: UpdateTryoutInput) {
			const updateData = {
				...pickDefined({
					title: input.title,
					description: input.description !== undefined ? (input.description ?? null) : undefined,
					category: input.category,
					status: input.status,
					startsAt: input.startsAt !== undefined ? (input.startsAt ? new Date(input.startsAt) : null) : undefined,
					endsAt: input.endsAt !== undefined ? (input.endsAt ? new Date(input.endsAt) : null) : undefined,
				}),
				updatedAt: new Date(),
			};

			const updated = await repository.updateTryout(input.id, updateData);
			if (!updated) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			return { message: "Tryout berhasil diperbarui" };
		},

		async remove(input: { id: number }) {
			const removed = await repository.deleteTryout(input.id);
			if (!removed) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");
			return { message: "Tryout berhasil dihapus" };
		},

		async listAccessCodes(input: ListAccessCodeInput) {
			return await repository.listAccessCodes(input.id);
		},

		async createAccessCode(input: CreateAccessCodeInput) {
			const existingTryout = await repository.findTryoutId(input.id);
			if (!existingTryout) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			if (input.maxUses !== undefined && input.maxUses <= 0) {
				throw new DomainError("BAD_REQUEST", "Maksimal penggunaan harus lebih dari 0");
			}

			const plainCode = (input.code?.trim() || generateAccessCode()).toUpperCase();
			const codeHash = hashAccessCode(plainCode);

			const duplicate = await repository.findAccessCode(input.id, codeHash);
			if (duplicate) throw new DomainError("BAD_REQUEST", "Kode akses sudah ada untuk tryout ini");

			const created = await repository.insertAccessCode({
				tryoutId: input.id,
				codeHash,
				codePreview: plainCode,
				label: input.label?.trim() || null,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				maxUses: input.maxUses ?? null,
			});
			if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat kode akses");

			return {
				...created,
				code: plainCode,
			};
		},

		async updateAccessCodeStatus(input: UpdateAccessCodeStatusInput) {
			const updated = await repository.updateAccessCodeStatus(input.id, input.accessCodeId, input.isActive);
			if (!updated) throw new DomainError("NOT_FOUND", "Kode akses tidak ditemukan");
			return updated;
		},

		async listAttempts(input: PaginatedByTryoutInput) {
			const limit = input.limit ?? 10;
			const isBackward = !!input.before;
			const cursorStr = input.before || input.after;
			const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

			const rows = await repository.listAttemptsWithUsers(input.id, {
				limit,
				backward: isBackward,
				cursorId,
			});

			const mappedRows = rows.map((row) => ({
				id: row.attempt.id,
				attempt: { ...row.attempt, score: parseNullableInt(row.attempt.score) },
				user: row.user,
			}));

			const { items: pagedItems, pageInfo } = buildIdCursorPage(mappedRows, limit, isBackward, !!cursorStr);
			const attemptIds = pagedItems.map((row) => row.id);
			const subtestAttemptsByAttemptId = new Map<number, { subtestId: number; score: number | null }[]>();

			if (attemptIds.length > 0) {
				const subtestAttempts = await repository.listSubtestAttemptScores(attemptIds);
				for (const subtestAttempt of subtestAttempts) {
					const attempts = subtestAttemptsByAttemptId.get(subtestAttempt.tryoutAttemptId) ?? [];
					attempts.push({
						subtestId: subtestAttempt.subtestId,
						score: parseNullableInt(subtestAttempt.score),
					});
					subtestAttemptsByAttemptId.set(subtestAttempt.tryoutAttemptId, attempts);
				}
			}

			const items = pagedItems.map((row) => ({
				...row,
				subtestAttempts: subtestAttemptsByAttemptId.get(row.id) ?? [],
			}));

			return { items, pageInfo };
		},

		async findSubtest(input: { id: number }) {
			const subtest = await repository.findSubtestById(input.id);
			if (!subtest) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");
			return subtest;
		},

		async createSubtest(input: CreateSubtestInput) {
			const tryoutExists = await repository.findTryoutId(input.tryoutId);
			if (!tryoutExists) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const maxOrder = await repository.maxSubtestOrder(input.tryoutId);
			const nextOrder = (maxOrder ?? 0) + 1;

			const created = await repository.insertSubtest({
				tryoutId: input.tryoutId,
				name: input.name,
				description: input.description ?? null,
				duration: input.duration ?? 0,
				questionOrder: input.questionOrder ?? "sequential",
				order: nextOrder,
			});
			if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat subtest");

			return {
				message: "Subtest berhasil dibuat",
				id: created.id,
			};
		},

		async updateSubtest(input: UpdateSubtestInput) {
			const updateData = {
				...pickDefined({
					name: input.name,
					description: input.description !== undefined ? (input.description ?? null) : undefined,
					duration: input.duration,
					questionOrder: input.questionOrder,
					scoringMap: input.scoringMap,
				}),
				updatedAt: new Date(),
			};

			const updated = await repository.updateSubtest(input.id, updateData);
			if (!updated) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");

			return { message: "Subtest berhasil diperbarui" };
		},

		async removeSubtest(input: { id: number }) {
			const removed = await repository.deleteSubtest(input.id);
			if (!removed) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");
			return { message: "Subtest berhasil dihapus" };
		},

		async listSubtestQuestions(input: BySubtestInput) {
			const questionsData = await repository.listSubtestQuestions(input.subtestId);
			return {
				questions: questionsData.map((q) => ({
					...q,
					question: {
						...q.question,
						content: readTiptapContent(q.question.contentJson, q.question.content),
					},
				})),
			};
		},

		async addQuestionToSubtest(input: AddQuestionInput) {
			let nextOrder = input.order;
			if (nextOrder === undefined) {
				const maxOrder = await repository.maxQuestionOrder(input.subtestId);
				nextOrder = (maxOrder ?? 0) + 1;
			}

			const existing = await repository.findSubtestQuestion(input.subtestId, input.questionId);
			if (existing) throw new DomainError("BAD_REQUEST", "Question sudah ada di subtest ini");

			await repository.insertSubtestQuestion({
				subtestId: input.subtestId,
				questionId: input.questionId,
				order: nextOrder,
			});

			return { message: "Question berhasil ditambahkan ke subtest" };
		},

		async bulkAddQuestionsToSubtest(input: BulkQuestionsInput) {
			if (!input.questionIds || input.questionIds.length === 0) {
				throw new DomainError("BAD_REQUEST", "Question IDs tidak boleh kosong");
			}

			const existingQuestions = await repository.listSubtestQuestionIds(input.subtestId);
			const existingIds = existingQuestions.map((q) => q.questionId);
			const newQuestionIds = input.questionIds.filter((id) => !existingIds.includes(id));

			if (newQuestionIds.length === 0) {
				throw new DomainError("BAD_REQUEST", "Semua question sudah ada di subtest ini");
			}

			const maxOrder = await repository.maxQuestionOrder(input.subtestId);
			const startOrder = (maxOrder ?? 0) + 1;

			await repository.insertSubtestQuestions(
				newQuestionIds.map((questionId, index) => ({
					subtestId: input.subtestId,
					questionId,
					order: startOrder + index,
				})),
			);

			return {
				message: "Questions berhasil ditambahkan ke subtest",
				addedCount: newQuestionIds.length,
			};
		},

		async bulkRemoveQuestionsFromSubtest(input: BulkQuestionsInput) {
			if (!input.questionIds || input.questionIds.length === 0) {
				throw new DomainError("BAD_REQUEST", "Question IDs tidak boleh kosong");
			}

			const removed = await repository.deleteSubtestQuestions(input.subtestId, input.questionIds);

			return {
				message: "Questions berhasil dihapus dari subtest",
				removedCount: removed.length,
			};
		},

		async updateSubtestQuestionOrder(input: { id: number; order: number }) {
			const updated = await repository.updateSubtestQuestionOrder(input.id, input.order);
			if (updated.length === 0) throw new DomainError("NOT_FOUND", "Question di subtest tidak ditemukan");
			return { message: "Urutan question berhasil diperbarui" };
		},

		async removeQuestionFromSubtest(input: { subtestId: number; questionId: number }) {
			const removed = await repository.deleteSubtestQuestion(input.subtestId, input.questionId);
			if (removed.length === 0) throw new DomainError("NOT_FOUND", "Question di subtest tidak ditemukan");
			return { message: "Question berhasil dihapus dari subtest" };
		},
	};
}

export const tryoutAdminService = createTryoutAdminService({
	repository: createTryoutRepository(db),
});
