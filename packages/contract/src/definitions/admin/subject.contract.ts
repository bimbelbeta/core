import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const MessageResponseSchema = type({ message: "string" });
const ContentMaterialCountSchema = type({ "video?": "number", "note?": "number", "practiceQuestions?": "number" });
const QuestionChoiceSchema = type({
	id: "number",
	questionId: "number",
	code: "string",
	content: "string",
	isCorrect: "boolean",
	createdAt: "Date | null",
	updatedAt: "Date | null",
});

export const adminSubjectContract = {
	createSubject: oc
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
	updateSubject: oc
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
	deleteSubject: oc
		.route({ path: "/admin/subjects/{id}", method: "DELETE", tags: ["Admin - Classes"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	reorderSubjects: oc
		.route({ path: "/admin/subjects/reorder", method: "PATCH", tags: ["Admin - Classes"] })
		.input(type({ items: "unknown" }))
		.output(MessageResponseSchema),
	createContent: oc
		.route({ path: "/admin/content", method: "POST", tags: ["Admin - Content"] })
		.input(
			type({
				subjectId: "number",
				title: "string",
				order: "number",
				video: "object?",
				note: "object?",
				practiceQuestionIds: "number[]?",
			}),
		)
		.output(type({ message: "string", contentId: "number", createdMaterials: ContentMaterialCountSchema })),
	updateContent: oc
		.route({ path: "/admin/content/{id}", method: "PATCH", tags: ["Admin - Content"] })
		.input(type({ id: "number", title: "string?", order: "number?" }))
		.output(MessageResponseSchema),
	deleteContent: oc
		.route({ path: "/admin/content/{id}", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	reorderContent: oc
		.route({ path: "/admin/content/reorder", method: "PATCH", tags: ["Admin - Content"] })
		.input(type({ subjectId: "number", items: "unknown" }))
		.output(MessageResponseSchema),
	upsertVideo: oc
		.route({ path: "/admin/content/{id}/video", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", videoUrl: "string", content: "object" }))
		.output(type({ message: "string", videoId: "number" })),
	deleteVideo: oc
		.route({ path: "/admin/content/{id}/video", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	upsertNote: oc
		.route({ path: "/admin/content/{id}/note", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", content: "object" }))
		.output(type({ message: "string", noteId: "number" })),
	deleteNote: oc
		.route({ path: "/admin/content/{id}/note", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	linkPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "POST", tags: ["Admin - Content"] })
		.input(type({ id: "number", questionIds: "number[]" }))
		.output(MessageResponseSchema),
	unlinkPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "DELETE", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	getContentPracticeQuestions: oc
		.route({ path: "/admin/content/{id}/practice-questions", method: "GET", tags: ["Admin - Content"] })
		.input(type({ id: "number" }))
		.output(
			type({
				questions: type(
					{
						questionId: "number",
						order: "number",
						type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
						content: "unknown",
						discussion: "unknown",
						tags: "string[]",
						choices: QuestionChoiceSchema.array(),
					},
					"[]",
				),
			}),
		),
	unlinkSinglePracticeQuestion: oc
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
