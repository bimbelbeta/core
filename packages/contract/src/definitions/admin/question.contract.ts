import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const ChoiceSchema = type({
	id: "number",
	questionId: "number",
	code: "string",
	content: "string",
	isCorrect: "boolean",
	createdAt: "Date | null",
	updatedAt: "Date | null",
});
const QuestionTypeSchema = "'multiple_choice' | 'multiple_choice_complex' | 'essay'";
const QuestionChoiceInputSchema = type({
	content: "string",
	isCorrect: "boolean",
});
const QuestionListItemSchema = type({
	id: "number",
	type: QuestionTypeSchema,
	content: "unknown",
	discussion: "unknown",
	contentJson: "unknown | null",
	discussionJson: "unknown | null",
	essayCorrectAnswer: "string | null",
	tags: "string[] | null",
	createdAt: "Date | null",
	updatedAt: "Date | null",
});
const QuestionDetailSchema = type({
	id: "number",
	type: QuestionTypeSchema,
	content: "unknown",
	discussion: "unknown",
	essayCorrectAnswer: "string | null",
	tags: "string[] | null",
});

const MessageResponseSchema = type({ message: "string" });

export const adminQuestionContract = {
	createQuestion: oc
		.route({ path: "/admin/questions", method: "POST", tags: ["Admin - Questions"] })
		.input(
			type({
				type: QuestionTypeSchema,
				content: "unknown",
				discussion: "unknown",
				tags: "string[]?",
				essayCorrectAnswer: "string?",
				choices: QuestionChoiceInputSchema.array().optional(),
			}),
		)
		.output(type({ message: "string", id: "number" })),
	list: oc
		.route({ path: "/admin/questions", method: "GET", tags: ["Admin - Questions"] })
		.input(
			type({
				cursor: "number?",
				limit: "number = 10",
				search: "string?",
				type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'?",
				tag: "string?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				excludeIds: "number[]?",
			}),
		)
		.output(type({ questions: QuestionListItemSchema.array(), nextCursor: "number?" })),
	find: oc
		.route({ path: "/admin/questions/{id}", method: "GET", tags: ["Admin - Questions"] })
		.input(type({ id: "number" }))
		.output(type({ question: QuestionDetailSchema, choices: ChoiceSchema.array() })),
	updateQuestion: oc
		.route({ path: "/admin/questions/{id}", method: "PATCH", tags: ["Admin - Questions"] })
		.input(
			type({
				id: "number",
				content: "unknown",
				discussion: "unknown",
				tags: "string[]?",
				essayCorrectAnswer: "string?",
				choices: type({ "id?": "number", content: "string", isCorrect: "boolean" }, "[]").optional(),
			}),
		)
		.output(MessageResponseSchema),
	deleteQuestion: oc
		.route({ path: "/admin/questions/{id}", method: "DELETE", tags: ["Admin - Questions"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	createChoice: oc
		.route({ path: "/admin/questions/{questionId}/choices", method: "POST", tags: ["Admin - Questions"] })
		.input(type({ questionId: "number", content: "string", isCorrect: "boolean" }))
		.output(type({ message: "string", id: "number" })),
	updateChoice: oc
		.route({ path: "/admin/questions/choices/{id}", method: "PATCH", tags: ["Admin - Questions"] })
		.input(type({ id: "number", content: "string?", isCorrect: "boolean?" }))
		.output(MessageResponseSchema),
	deleteChoice: oc
		.route({ path: "/admin/questions/choices/{id}", method: "DELETE", tags: ["Admin - Questions"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
};
