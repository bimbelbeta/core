import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "../../common/pagination";
import { oc } from "../../lib/contract-definition";

const ChoiceSchema = createSelectSchema(questionChoice)
	.pick("questionId", "code", "content", "isCorrect", "createdAt", "updatedAt")
	.merge({ id: "number" });
const QuestionTypeSchema = "'multiple_choice' | 'multiple_choice_complex' | 'essay'";
const QuestionChoiceInputSchema = type({
	content: "string",
	isCorrect: "boolean",
});
const QuestionBaseSchema = createSelectSchema(question)
	.pick(
		"type",
		"content",
		"discussion",
		"contentJson",
		"discussionJson",
		"essayCorrectAnswer",
		"tags",
		"createdAt",
		"updatedAt",
	)
	.merge({ id: "number", tags: "string[] | null" });
const QuestionListItemSchema = type({
	"...": QuestionBaseSchema,
	content: "unknown",
	discussion: "unknown",
});
const QuestionDetailSchema = type({
	"...": createSelectSchema(question)
		.pick("type", "content", "discussion", "essayCorrectAnswer", "tags")
		.merge({ id: "number", tags: "string[] | null" }),
	content: "unknown",
	discussion: "unknown",
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
				"...": PaginationInputSchema,
				search: "string?",
				type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'?",
				tag: "string?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				excludeIds: "number[]?",
			}),
		)
		.output(type({ items: QuestionListItemSchema.array(), pageInfo: PageInfoSchema })),
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
