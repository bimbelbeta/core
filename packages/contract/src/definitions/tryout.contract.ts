import { type } from "arktype";
import { oc } from "../lib/contract-definition";

const TryoutAttemptStatus = "'not_started' | 'ongoing' | 'finished'";
const TryoutQuestionType = "'multiple_choice' | 'multiple_choice_complex' | 'essay'";

const ChoiceSchema = type({
	id: "number",
	content: "string",
	code: "string",
});

const ChoiceWithAnswerSchema = type({
	id: "number",
	content: "string",
	code: "string",
	isCorrect: "boolean",
});

const UserAnswerSchema = type({
	selectedChoiceId: "number | null",
	selectedChoiceIds: "number[] | null",
	essayAnswer: "string | null",
	isDoubtful: "boolean",
});

const TryoutQuestionSchema = type({
	id: "number",
	content: "unknown",
	type: TryoutQuestionType,
	choices: ChoiceSchema.array(),
	userAnswer: UserAnswerSchema,
});

const ReviewQuestionSchema = type({
	id: "number",
	content: "unknown",
	type: TryoutQuestionType,
	discussion: "unknown | null",
	choices: ChoiceWithAnswerSchema.array(),
	userAnswer: UserAnswerSchema,
});

const TryoutSubtestSchema = type({
	id: "number",
	tryoutId: "number",
	name: "string",
	description: "string | null",
	duration: "number",
	questionOrder: "string",
	order: "number",
	scoringMap: "Record<string, number> | null",
});

const TryoutAttemptSchema = type({
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
});

const TryoutSubtestAttemptSchema = type({
	id: "number",
	tryoutAttemptId: "number",
	subtestId: "number",
	startedAt: "Date",
	completedAt: "Date | null",
	deadline: "Date",
	status: TryoutAttemptStatus,
	score: "number | null",
});

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
				id: "number",
				title: "string",
				passingGrade: "number",
				startsAt: "Date | null",
				endsAt: "Date | null",
				attemptId: "number | null",
				attemptStatus: `${TryoutAttemptStatus} | null`,
				isOpen: "boolean",
			},
			"[]",
		),
	),
	featured: oc.route({ path: "/tryouts/featured", method: "GET", tags: ["Tryouts"] }).output(
		type({
			id: "number",
			title: "string",
			passingGrade: "number",
			startsAt: "Date | null",
			endsAt: "Date | null",
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
				id: "number",
				title: "string",
				description: "string | null",
				passingGrade: "number",
				category: "'sd' | 'smp' | 'sma' | 'utbk'",
				status: "'draft' | 'published' | 'archived'",
				startsAt: "Date | null",
				endsAt: "Date | null",
				createdAt: "Date | null",
				updatedAt: "Date | null",
				subtests: TryoutSubtestSchema.array(),
				attempt: TryoutAttemptSchema,
				currentSubtest: type({
					id: "number",
					tryoutId: "number",
					name: "string",
					description: "string | null",
					duration: "number",
					questionOrder: "string",
					order: "number",
					scoringMap: "Record<string, number> | null",
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
