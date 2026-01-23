import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, count, eq, like, sql } from "drizzle-orm";
import { admin } from "../..";

const createQuestion = admin
	.route({
		path: "/admin/questions",
		method: "POST",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			type: type("'multiple_choice' | 'essay'"),
			content: "string",
			discussion: "string?",
			tags: "string[]?",
			choices: "unknown?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		const choices = input.choices as { content: string; isCorrect: boolean }[] | undefined;

		if (input.type === "multiple_choice") {
			if (!choices || choices.length < 2) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Multiple choice harus memiliki minimal 2 pilihan",
				});
			}

			const correctCount = choices.filter((c) => c.isCorrect).length;
			if (correctCount !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Multiple choice harus memiliki tepat 1 pilihan yang benar",
				});
			}
		}

		const result = await db.transaction(async (tx) => {
			const [newQuestion] = await tx
				.insert(question)
				.values({
					type: input.type,
					content: input.content,
					discussion: input.discussion ?? "",
					tags: input.tags ?? [],
				})
				.returning();

			if (!newQuestion)
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Gagal membuat question",
				});

			if (input.type === "multiple_choice" && choices) {
				const choiceCodes = ["A", "B", "C", "D", "E", "F", "G"] as const;
				const choicesToInsert = choices.map((choice, index) => ({
					questionId: newQuestion.id,
					code: choiceCodes[index] || "A",
					content: choice.content,
					isCorrect: choice.isCorrect,
				}));

				await tx.insert(questionChoice).values(choicesToInsert);
			}

			return newQuestion.id;
		});

		return {
			message: "Question berhasil dibuat",
			id: result,
		};
	});

const listQuestions = admin
	.route({
		path: "/admin/questions",
		method: "GET",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			page: "number = 1",
			limit: "number = 10",
			search: "string?",
			type: type("'multiple_choice' | 'essay'")?.optional(),
			tag: "string?",
		}),
	)
	.handler(async ({ input }) => {
		const offset = (input.page - 1) * input.limit;

		const conditions = [];

		if (input.search) {
			conditions.push(like(question.content, `%${input.search}%`));
		}

		if (input.type) {
			conditions.push(eq(question.type, input.type));
		}

		if (input.tag) {
			conditions.push(
				sql`EXISTS (
					SELECT 1
					FROM unnest(${question.tags}) AS tag
					WHERE tag ILIKE ${`%${input.tag}%`}
				)`,
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const questionsList = await db
			.select()
			.from(question)
			.where(whereClause)
			.limit(input.limit)
			.offset(offset)
			.orderBy(question.id);

		const [countResult] = await db.select({ value: count() }).from(question).where(whereClause);
		const total = countResult?.value ?? 0;

		return {
			questions: questionsList,
			total,
			page: input.page,
			limit: input.limit,
		};
	});

const getQuestion = admin
	.route({
		path: "/admin/questions/{id}",
		method: "GET",
		tags: ["Admin - Questions"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
		const [questionData] = await db.select().from(question).where(eq(question.id, input.id)).limit(1);

		if (!questionData)
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan",
			});

		const choicesData = await db
			.select()
			.from(questionChoice)
			.where(eq(questionChoice.questionId, input.id))
			.orderBy(questionChoice.code);

		return {
			question: questionData,
			choices: choicesData,
		};
	});

const updateQuestion = admin
	.route({
		path: "/admin/questions/{id}",
		method: "PATCH",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			id: "number",
			content: "string?",
			discussion: "string?",
			tags: "string[]?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const updateData: {
			content?: string;
			discussion?: string;
			tags?: string[];
		} = {};

		if (input.content !== undefined) updateData.content = input.content;
		if (input.discussion !== undefined) updateData.discussion = input.discussion;
		if (input.tags !== undefined) updateData.tags = input.tags;

		const [updated] = await db.update(question).set(updateData).where(eq(question.id, input.id)).returning();

		if (!updated)
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan",
			});

		return { message: "Question berhasil diperbarui" };
	});

const deleteQuestion = admin
	.route({
		path: "/admin/questions/{id}",
		method: "DELETE",
		tags: ["Admin - Questions"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(question).where(eq(question.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan",
			});
		}

		return { message: "Question berhasil dihapus" };
	});

const createChoice = admin
	.route({
		path: "/admin/questions/{questionId}/choices",
		method: "POST",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			questionId: "number",
			content: "string",
			isCorrect: "boolean",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		const existingChoices = await db
			.select({ code: questionChoice.code })
			.from(questionChoice)
			.where(eq(questionChoice.questionId, input.questionId));

		const choiceCodes = ["A", "B", "C", "D", "E", "F", "G"] as const;
		const usedCodes = existingChoices.map((c) => c.code);
		const nextCode = choiceCodes.find((code) => !usedCodes.includes(code));

		if (!nextCode) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Maksimal pilihan tercapai (7 pilihan)",
			});
		}

		const [created] = await db
			.insert(questionChoice)
			.values({
				questionId: input.questionId,
				code: nextCode,
				content: input.content,
				isCorrect: input.isCorrect,
			})
			.returning();

		if (!created)
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal membuat choice",
			});

		return {
			message: "Choice berhasil dibuat",
			id: created.id,
		};
	});

const updateChoice = admin
	.route({
		path: "/admin/questions/choices/{id}",
		method: "PATCH",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			id: "number",
			content: "string?",
			isCorrect: "boolean?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const updateData: { content?: string; isCorrect?: boolean } = {};

		if (input.content !== undefined) updateData.content = input.content;
		if (input.isCorrect !== undefined) updateData.isCorrect = input.isCorrect;

		const [updated] = await db
			.update(questionChoice)
			.set(updateData)
			.where(eq(questionChoice.id, input.id))
			.returning();

		if (!updated)
			throw new ORPCError("NOT_FOUND", {
				message: "Choice tidak ditemukan",
			});

		return { message: "Choice berhasil diperbarui" };
	});

const deleteChoice = admin
	.route({
		path: "/admin/questions/choices/{id}",
		method: "DELETE",
		tags: ["Admin - Questions"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(questionChoice).where(eq(questionChoice.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Choice tidak ditemukan",
			});
		}

		return { message: "Choice berhasil dihapus" };
	});

export const questionRouter = {
	createQuestion,
	listQuestions,
	getQuestion,
	updateQuestion,
	deleteQuestion,
	createChoice,
	updateChoice,
	deleteChoice,
};
