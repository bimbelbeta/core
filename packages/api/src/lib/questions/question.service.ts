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

const creationFailed = new Error("Question creation failed");

async function saveQuestion(input: CreateQuestionInput, content: ReturnType<typeof normalizeQuestionContent>) {
	try {
		return await db.transaction(async (tx) => {
			const [created] = await tx
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
				.returning();
			if (!created) throw creationFailed;

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
	} catch (error) {
		if (error === creationFailed) return undefined;
		throw error;
	}
}

export const createQuestionService = (save: typeof saveQuestion) => ({
	async create(input: CreateQuestionInput) {
		const content = normalizeQuestionContent(input);
		const choices = input.choices;
		if (input.type === "multiple_choice") {
			if (!choices || choices.length < 2) return { status: "too_few_choices" } as const;
			if (choices.filter((choice) => choice.isCorrect).length !== 1)
				return { status: "incorrect_choice_count" } as const;
		}
		if (input.type === "multiple_choice_complex" && (!choices || choices.length < 2)) {
			return { status: "too_few_complex_choices" } as const;
		}

		const id = await save(input, content);
		if (id === undefined) return { status: "creation_failed" } as const;
		return { status: "created", id } as const;
	},
});

export const questionService = createQuestionService(saveQuestion);
