import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { and, asc, desc, eq, gt, inArray, like, lt, sql } from "drizzle-orm";
import { admin } from "../..";
import { normalizeQuestionContent, readTiptapContent } from "../../lib/content-utils";
import { buildIdCursorPage, parseIdCursor } from "../../lib/pagination/cursor";

const createQuestion = admin.admin.tryout.questions.createQuestion.handler(async ({ input, errors }) => {
	const choices = input.choices;
	const { contentJson, discussionJson, contentText, discussionText } = normalizeQuestionContent(input);

	if (input.type === "multiple_choice") {
		if (!choices || choices.length < 2) {
			throw errors.BAD_REQUEST({
				message: "Multiple choice harus memiliki minimal 2 pilihan",
			});
		}

		const correctCount = choices.filter((choice) => choice.isCorrect).length;
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
			const choicesToInsert = choices.map((choice, index: number) => ({
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

const list = admin.admin.tryout.questions.list.handler(async ({ input }) => {
	const limit = input.limit ?? 10;
	const isBackward = !!input.before;
	const cursorStr = input.before || input.after;
	const cursorId = cursorStr ? parseIdCursor(cursorStr) : undefined;

	const conditions = [];

	if (cursorId !== undefined) {
		conditions.push(isBackward ? lt(question.id, cursorId) : gt(question.id, cursorId));
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
		.orderBy(isBackward ? desc(question.id) : asc(question.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, !!cursorStr);

	return {
		items: items.map((q) => ({
			...q,
			content: readTiptapContent(q.contentJson, q.content),
			discussion: readTiptapContent(q.discussionJson, q.discussion),
		})),
		pageInfo,
	};
});

const find = admin.admin.tryout.questions.find.handler(async ({ input, errors }) => {
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
			content: readTiptapContent(questionData.contentJson, questionData.content),
			discussion: readTiptapContent(questionData.discussionJson, questionData.discussion),
			essayCorrectAnswer: questionData.essayCorrectAnswer,
			tags: questionData.tags,
		},
		choices: choicesData,
	};
});

const updateQuestion = admin.admin.tryout.questions.updateQuestion.handler(async ({ input, errors }) => {
	const { contentJson, discussionJson, contentText, discussionText } = normalizeQuestionContent(input);

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

			const incomingIds = new Set(
				input.choices.filter((choice) => choice.id && choice.id > 0).map((choice) => choice.id as number),
			);

			const toDelete = existingChoices.filter((choice) => !incomingIds.has(choice.id));
			if (toDelete.length > 0) {
				await tx.delete(questionChoice).where(
					inArray(
						questionChoice.id,
						toDelete.map((c) => c.id),
					),
				);
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

const removeQuestion = admin.admin.tryout.questions.remove.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(question).where(eq(question.id, input.id)).returning();

	if (!deleted) {
		throw errors.NOT_FOUND({
			message: "Question tidak ditemukan",
		});
	}

	return { message: "Question berhasil dihapus" };
});

const createChoice = admin.admin.tryout.questions.createChoice.handler(async ({ input, errors }) => {
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

const updateChoice = admin.admin.tryout.questions.updateChoice.handler(async ({ input, errors }) => {
	const updateData: { content?: string; isCorrect?: boolean } = {};

	if (input.content !== undefined) updateData.content = input.content;
	if (input.isCorrect !== undefined) updateData.isCorrect = input.isCorrect;

	const [updated] = await db.update(questionChoice).set(updateData).where(eq(questionChoice.id, input.id)).returning();

	if (!updated)
		throw errors.NOT_FOUND({
			message: "Choice tidak ditemukan",
		});

	return { message: "Choice berhasil diperbarui" };
});

const removeChoice = admin.admin.tryout.questions.removeChoice.handler(async ({ input, errors }) => {
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
	list,
	find,
	updateQuestion,
	remove: removeQuestion,
	createChoice,
	updateChoice,
	removeChoice,
};
