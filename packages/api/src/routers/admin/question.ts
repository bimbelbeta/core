import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { type } from "arktype";
import { and, eq, gt, like, sql } from "drizzle-orm";
import { admin } from "../..";
import { convertToTiptap } from "../../lib/convert-to-tiptap";

const createQuestion = admin
	.route({
		path: "/admin/questions",
		method: "POST",
		tags: ["Admin - Questions"],
	})
	.input(
		type({
			type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
			content: "unknown",
			discussion: "unknown",
			tags: "string[]?",
			essayCorrectAnswer: "string?",
			choices: type(
				{
					content: "string",
					isCorrect: "boolean",
				},
				"[]",
			).optional(),
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input, errors }) => {
		const choices = input.choices;
		const contentJson = typeof input.content === "object" ? input.content : null;
		const discussionJson = typeof input.discussion === "object" ? input.discussion : null;

		const contentText = typeof input.content === "string" ? input.content : JSON.stringify(input.content);
		const discussionText = typeof input.discussion === "string" ? input.discussion : JSON.stringify(input.discussion);

		if (input.type === "multiple_choice") {
			if (!choices || choices.length < 2) {
				throw errors.BAD_REQUEST({
					message: "Multiple choice harus memiliki minimal 2 pilihan",
				});
			}

			const correctCount = choices.filter((c) => c.isCorrect).length;
			if (correctCount !== 1) {
				throw errors.BAD_REQUEST({
					message: "Multiple choice harus memiliki tepat 1 pilihan yang benar",
				});
			}
		}

		if (input.type === "multiple_choice_complex") {
			if (!choices || choices.length < 2) {
				throw errors.BAD_REQUEST({
					message: "Pilihan majemuk kompleks harus memiliki minimal 2 pilihan",
				});
			}
			// Flexible: allows 0, 1, or multiple correct answers
		}

		const result = await db.transaction(async (tx) => {
			const [newQuestion] = await tx
				.insert(question)
				.values({
					type: input.type,
					content: contentText,
					discussion: discussionText,
					contentJson,
					discussionJson,
					tags: input.tags ?? [],
					essayCorrectAnswer: input.essayCorrectAnswer,
				})
				.returning();

			if (!newQuestion)
				throw errors.INTERNAL_SERVER_ERROR({
					message: "Gagal membuat question",
				});

			if ((input.type === "multiple_choice" || input.type === "multiple_choice_complex") && choices) {
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
			cursor: "number?",
			limit: "number = 10",
			search: "string?",
			type: type("'multiple_choice' | 'multiple_choice_complex' | 'essay'")?.optional(),
			tag: "string?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			excludeIds: "number[]?",
		}),
	)
	.handler(async ({ input }) => {
		const rows = await db
			.select()
			.from(question)
			.where(
				and(
					input.cursor ? gt(question.id, input.cursor) : undefined,
					input.search ? like(question.content, `%${input.search}%`) : undefined,
					input.type ? eq(question.type, input.type) : undefined,
					input.tag
						? sql`EXISTS (
					SELECT 1
					FROM unnest(${question.tags}) AS tag
					WHERE tag ILIKE ${`%${input.tag}%`}
				)`
						: undefined,
					input.category ? sql`${input.category} = ANY(${question.tags})` : undefined,
					input.excludeIds && input.excludeIds.length > 0
						? sql`${question.id} NOT IN (${sql.join(
								input.excludeIds.map((id) => sql`${id}`),
								sql`, `,
							)})`
						: undefined,
				),
			)
			.limit(input.limit + 1)
			.orderBy(question.id);

		const hasMore = rows.length > input.limit;
		const questionsList = hasMore ? rows.slice(0, input.limit) : rows;
		const lastQuestion = questionsList.at(-1);

		return {
			questions: questionsList.map((q) => ({
				...q,
				content: q.contentJson ?? convertToTiptap(q.content),
				discussion: q.discussionJson ?? convertToTiptap(q.discussion),
			})),
			nextCursor: hasMore && lastQuestion ? lastQuestion.id : undefined,
		};
	});

const getQuestion = admin
	.route({
		path: "/admin/questions/{id}",
		method: "GET",
		tags: ["Admin - Questions"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input, errors }) => {
		const [questionData] = await db.select().from(question).where(eq(question.id, input.id)).limit(1);

		if (!questionData)
			throw errors.NOT_FOUND({
				message: "Question tidak ditemukan",
			});

		const choicesData = await db
			.select()
			.from(questionChoice)
			.where(eq(questionChoice.questionId, input.id))
			.orderBy(questionChoice.code);

		return {
			question: {
				id: questionData.id,
				type: questionData.type,
				content: questionData.contentJson ?? convertToTiptap(questionData.content),
				discussion: questionData.discussionJson ?? convertToTiptap(questionData.discussion),
				essayCorrectAnswer: questionData.essayCorrectAnswer,
				tags: questionData.tags,
			},
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
			content: "unknown",
			discussion: "unknown",
			tags: "string[]?",
			essayCorrectAnswer: "string?",
			choices: type(
				{
					"id?": "number",
					content: "string",
					isCorrect: "boolean",
				},
				"[]",
			).optional(),
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input, errors }) => {
		const contentJson = typeof input.content === "object" ? input.content : null;
		const discussionJson = typeof input.discussion === "object" ? input.discussion : null;

		const contentText = typeof input.content === "string" ? input.content : JSON.stringify(input.content);
		const discussionText = typeof input.discussion === "string" ? input.discussion : JSON.stringify(input.discussion);

		await db.transaction(async (tx) => {
			const [q] = await tx
				.update(question)
				.set({
					content: contentText,
					discussion: discussionText,
					contentJson,
					discussionJson,
					essayCorrectAnswer: input.essayCorrectAnswer,
					tags: input.tags ?? [],
				})
				.where(eq(question.id, input.id))
				.returning();

			if (!q)
				throw errors.NOT_FOUND({
					message: "Question tidak ditemukan",
				});

			if (input.choices) {
				const existingChoices = await tx.select().from(questionChoice).where(eq(questionChoice.questionId, input.id));

				const incomingIds = new Set(input.choices.filter((c) => c.id && c.id > 0).map((c) => c.id as number));

				const toDelete = existingChoices.filter((c) => !incomingIds.has(c.id));
				for (const choice of toDelete) {
					await tx.delete(questionChoice).where(eq(questionChoice.id, choice.id));
				}

				const choiceCodes = ["A", "B", "C", "D", "E", "F", "G"] as const;
				const usedCodes = new Set(existingChoices.filter((c) => incomingIds.has(c.id)).map((c) => c.code));

				for (const choice of input.choices) {
					if (choice.id && choice.id > 0) {
						const existing = existingChoices.find((c) => c.id === choice.id);
						if (existing && (existing.content !== choice.content || existing.isCorrect !== choice.isCorrect)) {
							await tx
								.update(questionChoice)
								.set({ content: choice.content, isCorrect: choice.isCorrect })
								.where(eq(questionChoice.id, choice.id));
						}
					} else {
						const nextCode = choiceCodes.find((code) => !usedCodes.has(code));
						if (nextCode) {
							usedCodes.add(nextCode);
							await tx.insert(questionChoice).values({
								questionId: input.id,
								code: nextCode,
								content: choice.content,
								isCorrect: choice.isCorrect,
							});
						}
					}
				}
			}
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
	.handler(async ({ input, errors }) => {
		const [deleted] = await db.delete(question).where(eq(question.id, input.id)).returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
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
	.handler(async ({ input, errors }) => {
		const existingChoices = await db
			.select({ code: questionChoice.code })
			.from(questionChoice)
			.where(eq(questionChoice.questionId, input.questionId));

		const choiceCodes = ["A", "B", "C", "D", "E", "F", "G"] as const;
		const usedCodes = existingChoices.map((c) => c.code);
		const nextCode = choiceCodes.find((code) => !usedCodes.includes(code));

		if (!nextCode) {
			throw errors.BAD_REQUEST({
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
			throw errors.INTERNAL_SERVER_ERROR({
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
	.handler(async ({ input, errors }) => {
		const updateData: { content?: string; isCorrect?: boolean } = {};

		if (input.content !== undefined) updateData.content = input.content;
		if (input.isCorrect !== undefined) updateData.isCorrect = input.isCorrect;

		const [updated] = await db
			.update(questionChoice)
			.set(updateData)
			.where(eq(questionChoice.id, input.id))
			.returning();

		if (!updated)
			throw errors.NOT_FOUND({
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
	.handler(async ({ input, errors }) => {
		const [deleted] = await db.delete(questionChoice).where(eq(questionChoice.id, input.id)).returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
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
