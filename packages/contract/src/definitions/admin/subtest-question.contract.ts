import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const MessageResponseSchema = type({ message: "string" });
const QuestionSummarySchema = type({
	id: "number",
	type: "'essay' | 'multiple_choice' | 'multiple_choice_complex'",
	content: "unknown",
	"contentJson?": "unknown",
});

export const adminSubtestQuestionContract = {
	listSubtestQuestions: oc
		.route({ path: "/admin/tryouts/subtests/{subtestId}/questions", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ subtestId: "number" }))
		.output(type({ questions: type({ id: "number", order: "number | null", question: QuestionSummarySchema }, "[]") })),
	addQuestionToSubtest: oc
		.route({ path: "/admin/tryouts/subtests/{subtestId}/questions", method: "POST", tags: ["Admin - Tryouts"] })
		.input(type({ subtestId: "number", questionId: "number", order: "number?" }))
		.output(MessageResponseSchema),
	bulkAddQuestionsToSubtest: oc
		.route({ path: "/admin/tryouts/subtests/{subtestId}/questions/bulk", method: "POST", tags: ["Admin - Tryouts"] })
		.input(type({ subtestId: "number", questionIds: "number[]" }))
		.output(type({ message: "string", addedCount: "number" })),
	bulkRemoveQuestionsFromSubtest: oc
		.route({ path: "/admin/tryouts/subtests/{subtestId}/questions/bulk", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ subtestId: "number", questionIds: "number[]" }))
		.output(type({ message: "string", removedCount: "number" })),
	updateSubtestQuestionOrder: oc
		.route({ path: "/admin/tryouts/subtests/questions/{id}", method: "PATCH", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number", order: "number" }))
		.output(MessageResponseSchema),
	removeQuestionFromSubtest: oc
		.route({ path: "/admin/tryouts/subtests/questions/{questionId}", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ subtestId: "number", questionId: "number" }))
		.output(MessageResponseSchema),
};
