import { db } from "@bimbelbeta/db";
import { question } from "@bimbelbeta/db/schema/question";
import { tryoutSubtestQuestion } from "@bimbelbeta/db/schema/tryout";
import { and, eq, inArray, sql } from "drizzle-orm";
import { readTiptapContent } from "../../lib/content-utils";
import { baseImplementer } from "../../lib/router-definition";
import { rateLimit, requireAdmin, requireAuth } from "../../lib/router-definition/middleware";

const admin = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

const list = admin.admin.tryout.questionsBulk.list.handler(async ({ input }) => {
	const questionsData = await db
		.select({
			id: tryoutSubtestQuestion.questionId,
			order: tryoutSubtestQuestion.order,
			question: {
				id: question.id,
				type: question.type,
				content: question.content,
				contentJson: question.contentJson,
			},
		})
		.from(tryoutSubtestQuestion)
		.innerJoin(question, eq(tryoutSubtestQuestion.questionId, question.id))
		.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId))
		.orderBy(tryoutSubtestQuestion.order);

	return {
		questions: questionsData.map((q) => ({
			...q,
			question: {
				...q.question,
				content: readTiptapContent(q.question.contentJson, q.question.content),
			},
		})),
	};
});

const addQuestionToSubtest = admin.admin.tryout.questionsBulk.addQuestionToSubtest.handler(
	async ({ input, errors }) => {
		let nextOrder = input.order;

		if (nextOrder === undefined) {
			const [maxOrderResult] = await db
				.select({ maxOrder: sql<number>`max(${tryoutSubtestQuestion.order})` })
				.from(tryoutSubtestQuestion)
				.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId));

			nextOrder = (maxOrderResult?.maxOrder ?? 0) + 1;
		}

		try {
			await db.insert(tryoutSubtestQuestion).values({
				subtestId: input.subtestId,
				questionId: input.questionId,
				order: nextOrder,
			});
		} catch (err) {
			// PostgreSQL unique violation code 23505
			const code = (err as { code?: string })?.code;
			if (code === "23505") {
				throw errors.BAD_REQUEST({
					message: "Question sudah ada di subtest ini",
				});
			}
			throw err;
		}

		return { message: "Question berhasil ditambahkan ke subtest" };
	},
);

const bulkAddQuestionsToSubtest = admin.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest.handler(
	async ({ input, errors }) => {
		if (!input.questionIds || input.questionIds.length === 0) {
			throw errors.BAD_REQUEST({
				message: "Question IDs tidak boleh kosong",
			});
		}

		const existingQuestions = await db
			.select({ questionId: tryoutSubtestQuestion.questionId })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId));

		const existingIds = existingQuestions.map((q) => q.questionId);
		const newQuestionIds = input.questionIds.filter((id: number) => !existingIds.includes(id));

		if (newQuestionIds.length === 0) {
			throw errors.BAD_REQUEST({
				message: "Semua question sudah ada di subtest ini",
			});
		}

		const [maxOrderResult] = await db
			.select({ maxOrder: sql<number>`max(${tryoutSubtestQuestion.order})` })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId));

		const startOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

		const values = newQuestionIds.map((qId: number, index: number) => ({
			subtestId: input.subtestId,
			questionId: qId,
			order: startOrder + index,
		}));

		await db.insert(tryoutSubtestQuestion).values(values);

		return {
			message: "Questions berhasil ditambahkan ke subtest",
			addedCount: newQuestionIds.length,
		};
	},
);

const bulkRemoveQuestionsFromSubtest = admin.admin.tryout.questionsBulk.bulkRemoveQuestionsFromSubtest.handler(
	async ({ input, errors }) => {
		if (!input.questionIds || input.questionIds.length === 0) {
			throw errors.BAD_REQUEST({
				message: "Question IDs tidak boleh kosong",
			});
		}

		const result = await db
			.delete(tryoutSubtestQuestion)
			.where(
				and(
					eq(tryoutSubtestQuestion.subtestId, input.subtestId),
					inArray(tryoutSubtestQuestion.questionId, input.questionIds),
				),
			)
			.returning();

		return {
			message: "Questions berhasil dihapus dari subtest",
			removedCount: result.length,
		};
	},
);

const updateSubtestQuestionOrder = admin.admin.tryout.questionsBulk.updateSubtestQuestionOrder.handler(
	async ({ input, errors }) => {
		const [updated] = await db
			.update(tryoutSubtestQuestion)
			.set({ order: input.order })
			.where(eq(tryoutSubtestQuestion.questionId, input.id))
			.returning();

		if (!updated)
			throw errors.NOT_FOUND({
				message: "Question tidak ditemukan di subtest",
			});

		return { message: "Urutan question berhasil diperbarui" };
	},
);

const removeQuestionFromSubtest = admin.admin.tryout.questionsBulk.removeQuestionFromSubtest.handler(
	async ({ input, errors }) => {
		const [deleted] = await db
			.delete(tryoutSubtestQuestion)
			.where(
				and(
					eq(tryoutSubtestQuestion.questionId, input.questionId),
					eq(tryoutSubtestQuestion.subtestId, input.subtestId),
				),
			)
			.returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
				message: "Question tidak ditemukan di subtest",
			});
		}

		return { message: "Question berhasil dihapus dari subtest" };
	},
);

export const subtestQuestionRouter = {
	list,
	addQuestionToSubtest,
	bulkAddQuestionsToSubtest,
	bulkRemoveQuestionsFromSubtest,
	updateSubtestQuestionOrder,
	removeQuestionFromSubtest,
};
