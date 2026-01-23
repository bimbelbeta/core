import { db } from "@bimbelbeta/db";
import { question } from "@bimbelbeta/db/schema/question";
import { tryoutSubtestQuestion } from "@bimbelbeta/db/schema/tryout";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, eq, inArray, sql } from "drizzle-orm";
import { admin } from "../..";
import { convertToTiptap } from "../../lib/convert-to-tiptap";

const listSubtestQuestions = admin
	.route({
		path: "/admin/tryouts/subtests/{subtestId}/questions",
		method: "GET",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ subtestId: "number" }))
	.handler(async ({ input }) => {
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
					content: q.question.contentJson ?? convertToTiptap(q.question.content),
				},
			})),
		};
	});

const addQuestionToSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{subtestId}/questions",
		method: "POST",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			subtestId: "number",
			questionId: "number",
			order: "number?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
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
		} catch (_error) {
			throw new ORPCError("CONFLICT", {
				message: "Question sudah ada di subtest ini",
			});
		}

		return { message: "Question berhasil ditambahkan ke subtest" };
	});

const bulkAddQuestionsToSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{subtestId}/questions/bulk",
		method: "POST",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			subtestId: "number",
			questionIds: "number[]",
		}),
	)
	.output(type({ message: "string", addedCount: "number" }))
	.handler(async ({ input }) => {
		if (!input.questionIds || input.questionIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Question IDs tidak boleh kosong",
			});
		}

		const existingQuestions = await db
			.select({ questionId: tryoutSubtestQuestion.questionId })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId));

		const existingIds = existingQuestions.map((q) => q.questionId);
		const newQuestionIds = input.questionIds.filter((id) => !existingIds.includes(id));

		if (newQuestionIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Semua question sudah ada di subtest ini",
			});
		}

		const [maxOrderResult] = await db
			.select({ maxOrder: sql<number>`max(${tryoutSubtestQuestion.order})` })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, input.subtestId));

		const startOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

		const values = newQuestionIds.map((qId, index) => ({
			subtestId: input.subtestId,
			questionId: qId,
			order: startOrder + index,
		}));

		await db.insert(tryoutSubtestQuestion).values(values);

		return {
			message: "Questions berhasil ditambahkan ke subtest",
			addedCount: newQuestionIds.length,
		};
	});

const bulkRemoveQuestionsFromSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/{subtestId}/questions/bulk",
		method: "DELETE",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			subtestId: "number",
			questionIds: "number[]",
		}),
	)
	.output(type({ message: "string", removedCount: "number" }))
	.handler(async ({ input }) => {
		if (!input.questionIds || input.questionIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
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
	});

const updateSubtestQuestionOrder = admin
	.route({
		path: "/admin/tryouts/subtests/questions/{id}",
		method: "PATCH",
		tags: ["Admin - Tryouts"],
	})
	.input(
		type({
			id: "number",
			order: "number",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [updated] = await db
			.update(tryoutSubtestQuestion)
			.set({ order: input.order })
			.where(eq(tryoutSubtestQuestion.questionId, input.id))
			.returning();

		if (!updated)
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan di subtest",
			});

		return { message: "Urutan question berhasil diperbarui" };
	});

const removeQuestionFromSubtest = admin
	.route({
		path: "/admin/tryouts/subtests/questions/{id}",
		method: "DELETE",
		tags: ["Admin - Tryouts"],
	})
	.input(type({ subtestId: "number", questionId: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
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
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan di subtest",
			});
		}

		return { message: "Question berhasil dihapus dari subtest" };
	});

export const subtestQuestionRouter = {
	listSubtestQuestions,
	addQuestionToSubtest,
	bulkAddQuestionsToSubtest,
	bulkRemoveQuestionsFromSubtest,
	updateSubtestQuestionOrder,
	removeQuestionFromSubtest,
};
