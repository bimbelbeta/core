import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { normalizeQuestionContent } from "@/lib/content-utils";

type CreateQuestionInput = {
	type: typeof question.$inferInsert.type;
	content: unknown;
	discussion: unknown;
	tags?: string[];
	essayCorrectAnswer?: string;
	choices?: { content: string; isCorrect: boolean }[];
};

async function saveQuestion(input: CreateQuestionInput, content: ReturnType<typeof normalizeQuestionContent>) {
	return await db.transaction(async (tx) => {
		const created = (
			await tx
				.insert(question)
				.values({
					type: input.type,
					content: content.contentText,
					discussion: content.discussionText,
					contentJson: content.contentJson,
					discussionJson: content.discussionJson,
					tags: input.tags ?? [],
					essayCorrectAnswer: input.essayCorrectAnswer,
				})
				.returning()
		)[0]!;
		if ((input.type === "multiple_choice" || input.type === "multiple_choice_complex") && input.choices) {
			const codes = ["A", "B", "C", "D", "E", "F", "G"] as const;
			await tx.insert(questionChoice).values(
				input.choices.map((choice, index) => ({
					questionId: created.id,
					code: codes[index] || "A",
					content: choice.content,
					isCorrect: choice.isCorrect,
				})),
			);
		}
		return created.id;
	});
}

export function validateQuestion(input: CreateQuestionInput) {
	const choices = input.choices;
	if (input.type === "multiple_choice") {
		if (!choices || choices.length < 2) return { status: "too_few_choices" } as const;
		if (choices.filter((choice) => choice.isCorrect).length !== 1) {
			return { status: "incorrect_choice_count" } as const;
		}
	}
	if (input.type === "multiple_choice_complex" && (!choices || choices.length < 2)) {
		return { status: "too_few_complex_choices" } as const;
	}
	return null;
}

/**
 * Validates a question and writes it with its answer choices.
 *
 * Rules depend on the question type. A single-answer multiple choice needs at least two choices
 * and exactly one correct answer. A complex multiple choice also needs at least two choices but
 * may have zero, one, or several correct answers. Essay questions need no choices at all.
 *
 * The question row and its choices are inserted in one transaction, so a failed choice insert
 * cannot leave a question with missing options.
 *
 * @returns `created` with the new question id, or `too_few_choices`, `incorrect_choice_count`,
 * or `too_few_complex_choices`.
 */
export const questionService = {
	async create(input: CreateQuestionInput) {
		const invalid = validateQuestion(input);
		if (invalid) return invalid;

		return { status: "created", id: await saveQuestion(input, normalizeQuestionContent(input)) } as const;
	},
};
