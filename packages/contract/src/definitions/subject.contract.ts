import { questionChoice } from "@bimbelbeta/db/schema/question";
import { contentItem, noteMaterial, subject, videoMaterial } from "@bimbelbeta/db/schema/subject";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../lib/contract-definition";

const SubjectSchema = createSelectSchema(subject).omit("createdAt", "updatedAt");

const SubjectWithContentSchema = type({
	...SubjectSchema,
	description: "string",
	gradeLevel: "string",
	totalContent: "number",
	hasViewed: "boolean",
});

const ContentItemWithProgressSchema = type({
	id: "number",
	title: "string",
	order: "number",
	hasVideo: "boolean",
	hasNote: "boolean",
	hasPracticeQuestions: "boolean",
	videoCompleted: "boolean?",
	noteCompleted: "boolean?",
	practiceQuestionsCompleted: "boolean?",
	lastViewedAt: "Date?",
});

const SubjectContentSchema = type({
	subject: SubjectSchema,
	items: ContentItemWithProgressSchema.array(),
});

const ChoiceWithAnswerSchema = createSelectSchema(questionChoice).omit("questionId", "createdAt", "updatedAt");

const PracticeQuestionSchema = type({
	questionId: "number",
	order: "number",
	question: "unknown",
	discussion: "unknown",
	type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
	essayCorrectAnswer: "string | null",
	answers: ChoiceWithAnswerSchema.array(),
});

const VideoMaterialSchema = createSelectSchema(videoMaterial).omit("contentItemId", "createdAt", "updatedAt");

const NoteMaterialSchema = createSelectSchema(noteMaterial).omit("contentItemId", "createdAt", "updatedAt");

const PracticeQuestionsSchema = type({
	questions: PracticeQuestionSchema.array(),
});

const ContentItemBaseSchema = createSelectSchema(contentItem).omit("order", "createdAt", "updatedAt");

const SubjectContentDetailSchema = type({
	...ContentItemBaseSchema,
	video: VideoMaterialSchema.or("null"),
	note: NoteMaterialSchema.or("null"),
	practiceQuestions: PracticeQuestionsSchema.or("null"),
});

const MessageResponseSchema = type({
	message: "string",
});

const RecentViewItemSchema = type({
	viewedAt: "Date",
	contentId: "number",
	contentTitle: "string",
	subjectId: "number",
	subtestName: "string",
	subtestShortName: "string",
	hasVideo: "boolean",
	hasNote: "boolean",
	hasPracticeQuestions: "boolean",
});

const UpdateProgressInputSchema = type({
	id: "number",
	"videoCompleted?": "boolean",
	"noteCompleted?": "boolean",
	"practiceQuestionsCompleted?": "boolean",
});

const ProgressStatsSchema = type({
	materialsCompleted: "number",
});

export const subjectContract = {
	listSubjects: oc
		.route({
			path: "/subjects",
			method: "GET",
			tags: ["Content"],
		})
		.input(
			type({
				"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
				"search?": "string",
			}),
		)
		.output(SubjectWithContentSchema.array()),
	listContentBySubjectCategory: oc
		.route({
			path: "/subjects/{subjectId}/content",
			method: "GET",
			tags: ["Content"],
		})
		.input(
			type({
				subjectId: "number",
				"search?": "string",
				"limit?": "number >= 1",
				"offset?": "number >= 0",
			}),
		)
		.output(SubjectContentSchema),
	getContentById: oc
		.route({
			path: "/content/{contentId}",
			method: "GET",
			tags: ["Content"],
		})
		.input(
			type({
				contentId: type("number"),
			}),
		)
		.output(SubjectContentDetailSchema),
	trackView: oc
		.route({
			path: "/content/{id}/view",
			method: "POST",
			tags: ["Content"],
		})
		.input(type({ id: "number" }))
		.output(MessageResponseSchema),
	getRecentViews: oc
		.route({
			path: "/content/recent",
			method: "GET",
			tags: ["Content"],
		})
		.output(RecentViewItemSchema.array()),
	trackSubjectView: oc
		.route({
			path: "/subjects/{subjectId}/view",
			method: "POST",
			tags: ["Content"],
		})
		.input(type({ subjectId: "number" }))
		.output(MessageResponseSchema),
	updateProgress: oc
		.route({
			path: "/content/{id}/progress",
			method: "PATCH",
			tags: ["Content"],
		})
		.input(UpdateProgressInputSchema)
		.output(MessageResponseSchema),
	getProgressStats: oc
		.route({
			path: "/content/progress/stats",
			method: "GET",
			tags: ["Content"],
		})
		.output(ProgressStatsSchema),
};
