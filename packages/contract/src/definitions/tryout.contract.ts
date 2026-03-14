import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../lib/contract-definition";

const TryoutAttemptStatus = "'not_started' | 'ongoing' | 'finished'";

const ChoiceSchema = createSelectSchema(questionChoice).pick("code").merge({ id: "number", content: "string" });

const ChoiceWithAnswerSchema = createSelectSchema(questionChoice)
	.pick("code", "isCorrect")
	.merge({ id: "number", content: "string" });

const UserAnswerSchema = createSelectSchema(tryoutUserAnswer)
	.pick("selectedChoiceId", "selectedChoiceIds", "essayAnswer", "isDoubtful")
	.merge({ selectedChoiceIds: "number[] | null" });

const TryoutSchema = createSelectSchema(tryout)
	.pick("title", "description", "passingGrade", "category", "status", "startsAt", "endsAt", "createdAt", "updatedAt")
	.merge({
		id: "number",
		startsAt: "Date | null",
		endsAt: "Date | null",
		createdAt: "Date | null",
		updatedAt: "Date | null",
	});

const TryoutListItemSchema = createSelectSchema(tryout)
	.pick("title", "passingGrade", "startsAt", "endsAt")
	.merge({ id: "number", startsAt: "Date | null", endsAt: "Date | null" });

const QuestionBaseSchema = createSelectSchema(question)
	.pick("type")
	.merge({ id: "number", content: "Record<string, unknown>" });

const ReviewQuestionBaseSchema = createSelectSchema(question)
	.pick("type", "discussion")
	.merge({ id: "number", content: "Record<string, unknown>" });

const TryoutQuestionSchema = type({
	"...": QuestionBaseSchema,
	choices: ChoiceSchema.array(),
	userAnswer: UserAnswerSchema,
});

const ReviewQuestionSchema = type({
	"...": ReviewQuestionBaseSchema,
	discussion: "Record<string, unknown> | null",
	choices: ChoiceWithAnswerSchema.array(),
	userAnswer: UserAnswerSchema,
});

const TryoutSubtestSchema = createSelectSchema(tryoutSubtest)
	.pick("tryoutId", "name", "description", "duration", "questionOrder", "order", "scoringMap")
	.merge({ id: "number" });

const TryoutAttemptSchema = createSelectSchema(tryoutAttempt)
	.pick(
		"userId",
		"tryoutId",
		"startedAt",
		"deadline",
		"completedAt",
		"status",
		"score",
		"submittedImageUrl",
		"isRevoked",
		"usedCredit",
	)
	.merge({ id: "number", startedAt: "Date", deadline: "Date", completedAt: "Date | null", score: "number | null" });

const TryoutSubtestAttemptSchema = createSelectSchema(tryoutSubtestAttempt)
	.pick("tryoutAttemptId", "subtestId", "startedAt", "completedAt", "deadline", "status", "score")
	.merge({ id: "number", startedAt: "Date", completedAt: "Date | null", deadline: "Date", score: "number | null" });

const TryoutHistoryItemSchema = type({
	id: "number",
	score: "number | null",
	status: TryoutAttemptStatus,
	startedAt: "Date",
	completedAt: "Date | null",
	tryout: {
		id: "number",
		title: "string",
	},
});

export const tryoutContract = {
	list: oc.route({ path: "/tryouts", method: "GET", tags: ["Tryouts"] }).output(
		type(
			{
				"...": TryoutListItemSchema,
				attemptId: "number | null",
				attemptStatus: `${TryoutAttemptStatus} | null`,
				isOpen: "boolean",
			},
			"[]",
		),
	),
	featured: oc.route({ path: "/tryouts/featured", method: "GET", tags: ["Tryouts"] }).output(
		type({
			"...": TryoutListItemSchema,
			startedAt: "Date | null",
			completedAt: "Date | null",
			attemptId: "number | null",
			attemptStatus: `${TryoutAttemptStatus} | null`,
			status: "'finished' | 'not_started' | 'ongoing'",
		}),
	),
	find: oc
		.route({ path: "/tryouts/{id}", method: "GET", tags: ["Tryouts"] })
		.input(type({ id: "number" }))
		.output(
			type({
				"...": TryoutSchema,
				subtests: TryoutSubtestSchema.array(),
				attempt: TryoutAttemptSchema,
				currentSubtest: type({
					"...": TryoutSubtestSchema,
					questions: TryoutQuestionSchema.array(),
					deadline: "Date | null",
					status: TryoutAttemptStatus,
				}).or("null"),
				overallDeadline: "Date",
				totalSubtests: "number",
				completedSubtests: "number",
			}),
		),
	start: oc
		.route({ path: "/tryouts/{id}/start", method: "POST", tags: ["Tryouts"] })
		.input(type({ id: "number", imageUrl: "string?", useCredit: "boolean?" }))
		.output(
			type({
				id: "number",
				userId: "string",
				tryoutId: "number",
				startedAt: "Date",
				deadline: "Date",
				completedAt: "Date | null",
				status: TryoutAttemptStatus,
				score: "number | null",
				submittedImageUrl: "string | null",
				isRevoked: "boolean",
				usedCredit: "boolean",
				"overallDeadline?": "Date",
			}),
		),
	startSubtest: oc
		.route({ path: "/tryouts/{tryoutId}/subtests/{subtestId}/start", method: "POST", tags: ["Tryouts"] })
		.input(type({ tryoutId: "number", subtestId: "number" }))
		.output(TryoutSubtestAttemptSchema),
	saveAnswer: oc
		.route({ path: "/tryouts/{tryoutId}/questions/{questionId}/answer", method: "POST", tags: ["Tryouts"] })
		.input(
			type({
				tryoutId: "number",
				questionId: "number",
				selectedChoiceId: "number?",
				selectedChoiceIds: "number[]?",
				essayAnswer: "string?",
			}),
		)
		.output(type({ success: "boolean" })),
	toggleRaguRagu: oc
		.route({
			path: "/tryouts/{tryoutId}/questions/{questionId}/ragu-ragu",
			method: "POST",
			tags: ["Tryouts"],
		})
		.input(type({ tryoutId: "number", questionId: "number" }))
		.output(type({ success: "boolean" })),
	submitSubtest: oc
		.route({ path: "/tryouts/{tryoutId}/subtests/{subtestId}/submit", method: "POST", tags: ["Tryouts"] })
		.input(type({ tryoutId: "number", subtestId: "number" }))
		.output(
			type({ success: "boolean", "nextSubtestId?": "number", "tryoutCompleted?": "boolean", "score?": "number" }),
		),
	submitTryout: oc
		.route({ path: "/tryouts/{tryoutId}/submit", method: "POST", tags: ["Tryouts"] })
		.input(type({ tryoutId: "number" }))
		.output(type({ success: "boolean", score: "number" })),
	history: oc
		.route({ path: "/tryouts/history", method: "GET", tags: ["Tryouts"] })
		.output(TryoutHistoryItemSchema.array()),
	attemptResult: oc
		.route({ path: "/tryouts/attempts/{attemptId}", method: "GET", tags: ["Tryouts"] })
		.input(type({ attemptId: "number" }))
		.output(
			type({
				id: "number",
				startedAt: "Date",
				score: "number | null",
				deadline: "Date",
				completedAt: "Date | null",
				status: TryoutAttemptStatus,
				usedCredit: "boolean",
				tryout: {
					id: "number",
					title: "string",
					passingGrade: "number",
					subtests: type(
						{
							id: "number",
							name: "string",
							duration: "number",
						},
						"[]",
					),
				},
				subtestAttempts: type(
					{
						id: "number",
						subtestId: "number",
						status: TryoutAttemptStatus,
						completedAt: "Date | null",
						score: "number | null",
					},
					"[]",
				),
			}),
		),
	review: oc
		.route({
			path: "/tryouts/attempts/{attemptId}/subtests/{subtestId}/review",
			method: "GET",
			tags: ["Tryouts"],
		})
		.input(type({ attemptId: "number", subtestId: "number" }))
		.output(type({ subtest: { name: "string" }, questions: ReviewQuestionSchema.array() })),
};
