import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { ORPCError } from "@orpc/client";
import { and, eq, gt, like, sql } from "drizzle-orm";
import { admin } from "../..";
import { convertToTiptap } from "../../lib/convert-to-tiptap";

type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";

type QuestionChoiceInput = {
	id?: number;
	content: string;
	isCorrect: boolean;
};

type CreateQuestionInput = {
	type: QuestionType;
	content: unknown;
	discussion: unknown;
	tags?: string[];
	essayCorrectAnswer?: string;
	choices?: QuestionChoiceInput[];
};

type ListQuestionsInput = {
	cursor?: number;
	limit: number;
	search?: string;
	type?: QuestionType;
	tag?: string;
	category?: "sd" | "smp" | "sma" | "utbk";
	excludeIds?: number[];
};

type QuestionIdInput = {
	id: number;
};

type UpdateQuestionInput = {
	id: number;
	content: unknown;
	discussion: unknown;
	tags?: string[];
	essayCorrectAnswer?: string;
	choices?: QuestionChoiceInput[];
};

type CreateChoiceInput = {
	questionId: number;
	content: string;
	isCorrect: boolean;
};

type UpdateChoiceInput = {
	id: number;
	content?: string;
	isCorrect?: boolean;
};

const createQuestion = admin.admin.tryout.questions.createQuestion.handler(
	async ({ input }: { input: CreateQuestionInput }) => {
		const choices = input.choices;
		const contentJson = typeof input.content === "object" ? input.content : null;
		const discussionJson = typeof input.discussion === "object" ? input.discussion : null;

		const contentText = typeof input.content === "string" ? input.content : JSON.stringify(input.content);
		const discussionText = typeof input.discussion === "string" ? input.discussion : JSON.stringify(input.discussion);

		if (input.type === "multiple_choice") {
			if (!choices || choices.length < 2) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Multiple choice harus memiliki minimal 2 pilihan",
				});
			}

			const correctCount = choices.filter((choice: QuestionChoiceInput) => choice.isCorrect).length;
			if (correctCount !== 1) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Multiple choice harus memiliki tepat 1 pilihan yang benar",
				});
			}
		}

		if (input.type === "multiple_choice_complex") {
			if (!choices || choices.length < 2) {
				throw new ORPCError("BAD_REQUEST", {
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
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Gagal membuat question",
				});

			if ((input.type === "multiple_choice" || input.type === "multiple_choice_complex") && choices) {
				const choiceCodes = ["A", "B", "C", "D", "E", "F", "G"] as const;
				const choicesToInsert = choices.map((choice: QuestionChoiceInput, index: number) => ({
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
	},
);

const listQuestions = admin.admin.tryout.questions.listQuestions.handler(
	async ({ input }: { input: ListQuestionsInput }) => {
		const conditions = [];

		if (input.cursor) {
			conditions.push(gt(question.id, input.cursor));
		}

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

		// Category filter - looks for exact category tag (sd, smp, sma, utbk)
		if (input.category) {
			conditions.push(sql`${input.category} = ANY(${question.tags})`);
		}

		// Exclude specific question IDs (useful for filtering out already linked questions)
		if (input.excludeIds && input.excludeIds.length > 0) {
			conditions.push(
				sql`${question.id} NOT IN (${sql.join(
					input.excludeIds.map((id: number) => sql`${id}`),
					sql`, `,
				)})`,
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const rows = await db
			.select()
			.from(question)
			.where(whereClause)
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
	},
);

const getQuestion = admin.admin.tryout.questions.getQuestion.handler(async ({ input }: { input: QuestionIdInput }) => {
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

const updateQuestion = admin.admin.tryout.questions.updateQuestion.handler(
	async ({ input }: { input: UpdateQuestionInput }) => {
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
				throw new ORPCError("NOT_FOUND", {
					message: "Question tidak ditemukan",
				});

			if (input.choices) {
				const existingChoices = await tx.select().from(questionChoice).where(eq(questionChoice.questionId, input.id));

				const incomingIds = new Set(
					input.choices
						.filter((choice: QuestionChoiceInput) => choice.id && choice.id > 0)
						.map((choice) => choice.id as number),
				);

				const toDelete = existingChoices.filter((choice) => !incomingIds.has(choice.id));
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
	},
);

const deleteQuestion = admin.admin.tryout.questions.deleteQuestion.handler(
	async ({ input }: { input: QuestionIdInput }) => {
		const [deleted] = await db.delete(question).where(eq(question.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Question tidak ditemukan",
			});
		}

		return { message: "Question berhasil dihapus" };
	},
);

const createChoice = admin.admin.tryout.questions.createChoice.handler(
	async ({ input }: { input: CreateChoiceInput }) => {
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
	},
);

const updateChoice = admin.admin.tryout.questions.updateChoice.handler(
	async ({ input }: { input: UpdateChoiceInput }) => {
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
	},
);

const deleteChoice = admin.admin.tryout.questions.deleteChoice.handler(
	async ({ input }: { input: QuestionIdInput }) => {
		const [deleted] = await db.delete(questionChoice).where(eq(questionChoice.id, input.id)).returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Choice tidak ditemukan",
			});
		}

		return { message: "Choice berhasil dihapus" };
	},
);

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
