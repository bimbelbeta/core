import { questionChoice } from "@bimbelbeta/db/schema/question";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../../lib/contract-definition";

const MessageResponseSchema = type({ message: "string" });
const ContentMaterialCountSchema = type({ "video?": "number", "note?": "number", "practiceQuestions?": "number" });
const QuestionChoiceSchema = createSelectSchema(questionChoice)
	.pick("questionId", "code", "content", "isCorrect", "createdAt", "updatedAt")
	.merge({ id: "number" });

export const adminSubjectContract = {
	create: oc
		.route({ path: "/admin/subjects", method: "POST", tags: ["Admin - Classes"] })
		.input(
			type({
				name: "string",
				shortName: "string",
				description: "string?",
				order: "number?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				gradeLevel: "number?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	update: oc
		.route({ path: "/admin/subjects/{id}", method: "PATCH", tags: ["Admin - Classes"] })
		.input(
			type({
				id: "number",
				name: "string?",
				shortName: "string?",
				description: "string?",
				order: "number?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				gradeLevel: "number?",
			}),
		)
		.output(MessageResponseSchema),
	remove: oc
		.route({ path: "/admin/subjects/{id}", method: "DELETE", tags: ["Admin - Classes"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	reorder: oc
		.route({ path: "/admin/subjects/reorder", method: "PATCH", tags: ["Admin - Classes"] })
		.input(type({ items: type({ id: "number", order: "number" }).array() }))
		.output(MessageResponseSchema),
};

export const adminContentContract = {
	createContent: oc
		.route({ path: "/admin/content", method: "POST", tags: ["Admin - Content"] })
		.input(
			type({
				subjectId: "number",
				title: "string",
				order: "number",
				"video?": type({ videoUrl: "string", title: "string", content: "Record<string, unknown>" }),
				"note?": type({ content: "Record<string, unknown>" }),
				"practiceQuestionIds?": "number[]",
			}),
		)
		.output(type({ message: "string", contentId: "number", createdMaterials: ContentMaterialCountSchema })),
	updateContent: oc
		.route({ path: "/admin/content/{id}", method: "PATCH", tags: ["Admin - Content"] })
		.input(type({ id: "number", title: "string?", order: "number?" }))
		.output(MessageResponseSchema),
	removeContent: oc
		.route({ path: "/admin/content/{id}", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	reorderContent: oc
		.route({ path: "/admin/content/reorder", method: "PATCH", tags: ["Admin - Content"] })
		.input(type({ subjectId: "number", items: type({ id: "number", order: "number" }).array() }))
		.output(MessageResponseSchema),
	upsertVideo: oc
		.route({ path: "/admin/content/{id}/video", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", videoUrl: "string", content: "Record<string, unknown>" }))
		.output(type({ message: "string", videoId: "number" })),
	removeVideo: oc
		.route({ path: "/admin/content/{id}/video", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	upsertNote: oc
		.route({ path: "/admin/content/{id}/note", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", content: "Record<string, unknown>" }))
		.output(type({ message: "string", noteId: "number" })),
	removeNote: oc
		.route({ path: "/admin/content/{id}/note", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	setPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", questionIds: "number[]" }))
		.output(MessageResponseSchema),
	clearPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	listPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "GET", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(
			type({
				questions: type(
					{
						questionId: "number",
						order: "number",
						type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
						content: "Record<string, unknown>",
						discussion: "Record<string, unknown> | null",
						tags: "string[]",
						choices: QuestionChoiceSchema.array(),
					},
					"[]",
				),
			}),
		),
	removePracticeQuestion: oc
		.route({ path: "/admin/content/{id}/practice-questions/{questionId}", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number", questionId: "number" }))
		.output(MessageResponseSchema),
	reorderPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions/reorder", method: "PATCH", tags: ["Admin - Content"] })
		.input(type({ id: "number", questionIds: "number[]" }))
		.output(MessageResponseSchema),
	addPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions/add", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", questionIds: "number[]" }))
		.output(type({ message: "string", addedCount: "number" })),
};
