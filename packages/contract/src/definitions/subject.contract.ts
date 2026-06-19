import { contentItem, noteMaterial, subject, videoMaterial } from "@bimbelbeta/db/schema/subject";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-orm/arktype";
import { ChoiceWithAnswerSchema } from "@/common/choices";
import { PageInfoSchema } from "@/common/pagination";
import { MessageResponseSchema } from "@/common/response";
import { oc } from "@/lib/contract-definition";

const SubjectSchema = createSelectSchema(subject)
	.pick("name", "shortName", "description", "order", "category", "gradeLevel")
	.merge({ id: "number" });

const ContentItemSchema = createSelectSchema(contentItem).pick("title", "order").merge({ id: "number" });

const ContentItemDetailSchema = createSelectSchema(contentItem)
	.pick("subjectId", "title", "order")
	.merge({ id: "number" });

const VideoMaterialSchema = createSelectSchema(videoMaterial)
	.pick("videoUrl", "content")
	.merge({ id: "number", content: "unknown" });

const NoteMaterialSchema = createSelectSchema(noteMaterial).pick("content").merge({ id: "number", content: "unknown" });

// Extended/computed schemas with additional fields
const SubjectWithContentSchema = type({
	"...": SubjectSchema,
	totalContent: "number",
	hasViewed: "boolean",
});

const ContentItemWithProgressSchema = type({
	"...": ContentItemSchema,
	hasVideo: "boolean",
	hasNote: "boolean",
	hasPracticeQuestions: "boolean",
	videoCompleted: "boolean | null",
	noteCompleted: "boolean | null",
	practiceQuestionsCompleted: "boolean | null",
	lastViewedAt: "Date | null",
});

const SubjectContentSchema = type({
	subject: SubjectSchema,
	items: ContentItemWithProgressSchema.array(),
	pageInfo: PageInfoSchema,
});

// ChoiceWithAnswerSchema imported from common/choices

const PracticeQuestionSchema = type({
	questionId: "number",
	order: "number",
	question: "unknown",
	discussion: "unknown",
	type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
	essayCorrectAnswer: "string | null",
	answers: ChoiceWithAnswerSchema.array(),
});

const PracticeQuestionsSchema = type({
	questions: PracticeQuestionSchema.array(),
});

const SubjectContentDetailSchema = type({
	"...": ContentItemDetailSchema,
	video: VideoMaterialSchema.or("null"),
	note: NoteMaterialSchema.or("null"),
	practiceQuestions: PracticeQuestionsSchema.or("null"),
});

const RecentViewItemSchema = type({
	viewedAt: "Date",
	contentId: "number",
	contentTitle: "string",
	subjectId: "number",
	subjectName: "string",
	subjectShortName: "string",
	hasVideo: "boolean",
	hasNote: "boolean",
	hasPracticeQuestions: "boolean",
});

const UpdateProgressInputSchema = type({
	contentId: "number",
	"videoCompleted?": "boolean",
	"noteCompleted?": "boolean",
	"practiceQuestionsCompleted?": "boolean",
});

const ProgressStatsSchema = type({
	materialsCompleted: "number",
});

export const subjectContract = {
	list: oc
		.route({
			path: "/subjects",
			method: "GET",
			tags: ["Content"],
		})
		.input(
			type({
				"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
				"search?": "string",
				"limit?": "number >= 1",
				"after?": "string",
				"before?": "string",
			}),
		)
		.output(
			type({
				items: SubjectWithContentSchema.array(),
				pageInfo: PageInfoSchema,
			}),
		),
	listContent: oc
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
				"after?": "string",
				"before?": "string",
			}),
		)
		.output(SubjectContentSchema),
	findContent: oc
		.route({
			path: "/content/{contentId}",
			method: "GET",
			tags: ["Content"],
		})
		.input(
			type({
				contentId: "number > 0",
			}),
		)
		.output(SubjectContentDetailSchema),
	trackView: oc
		.route({
			path: "/content/{contentId}/view",
			method: "POST",
			tags: ["Content"],
		})
		.input(type({ contentId: "number" }))
		.output(MessageResponseSchema),
	listRecentViews: oc
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
			path: "/content/{contentId}/progress",
			method: "PATCH",
			tags: ["Content"],
		})
		.input(UpdateProgressInputSchema)
		.output(MessageResponseSchema),
	stats: oc
		.route({
			path: "/content/progress/stats",
			method: "GET",
			tags: ["Content"],
		})
		.output(ProgressStatsSchema),
};
