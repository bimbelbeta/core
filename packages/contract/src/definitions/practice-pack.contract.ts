import {
	practicePackAttemptSelectSchema,
	practicePackSelectSchema,
} from "@bimbelbeta/db/validators/practice-pack.validator";
import { questionChoiceSelectSchema } from "@bimbelbeta/db/validators/question.validator";
import { oc } from "@orpc/contract";
import { type } from "arktype";

const PracticePackSchema = practicePackSelectSchema;
const PracticePackAttemptSchema = practicePackAttemptSelectSchema;
const ChoiceSchema = questionChoiceSelectSchema;

const PracticePackWithProgressSchema = type({
	...practicePackSelectSchema.infer,
	"attemptId?": "number",
	"attemptStatus?": "'not_started' | 'ongoing' | 'finished'",
	"completedAt?": "string",
});

const PracticePackQuestionSchema = type({
	questionId: "number",
	order: "number",
	content: "string",
	contentJson: "string | null",
	type: "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
	"choices?": ChoiceSchema.array(),
	"selectedChoiceId?": "number",
	"essayAnswer?": "string",
});

export const listPracticePacksContract = oc
	.route({
		path: "/practice-packs",
		method: "GET",
		tags: ["Practice Pack"],
	})
	.output(
		type({
			data: PracticePackWithProgressSchema.array(),
		}),
	);

export const getPracticePackContract = oc
	.route({
		path: "/practice-packs/{id}",
		method: "GET",
		tags: ["Practice Pack"],
	})
	.input(type({ id: "number" }))
	.output(
		type({
			practicePack: PracticePackSchema,
			attempt: {
				id: "number",
				practicePackId: "number",
				startedAt: "string",
				"completedAt?": "string",
				status: "'not_started' | 'ongoing' | 'finished'",
			},
			progress: {
				answeredCount: "number",
				totalQuestions: "number",
			},
		}),
	);

export const startAttemptContract = oc
	.route({
		path: "/practice-packs/{id}/start",
		method: "POST",
		tags: ["Practice Pack"],
	})
	.input(type({ id: "number" }))
	.output(
		type({
			attempt: PracticePackAttemptSchema,
			questions: PracticePackQuestionSchema.array(),
		}),
	);

export const getQuestionsContract = oc
	.route({
		path: "/practice-packs/attempts/{attemptId}/questions",
		method: "GET",
		tags: ["Practice Pack"],
	})
	.input(type({ attemptId: "number" }))
	.output(
		type({
			questions: PracticePackQuestionSchema.array(),
		}),
	);

export const submitAnswerContract = oc
	.route({
		path: "/practice-packs/attempts/answer",
		method: "POST",
		tags: ["Practice Pack"],
	})
	.input(
		type({
			attemptId: "number",
			questionId: "number",
			"selectedChoiceId?": "number",
			"essayAnswer?": "string",
		}),
	)
	.output(
		type({
			message: "string",
			isCorrect: "boolean | null",
		}),
	);

export const finishAttemptContract = oc
	.route({
		path: "/practice-packs/attempts/{attemptId}/finish",
		method: "POST",
		tags: ["Practice Pack"],
	})
	.input(type({ attemptId: "number" }))
	.output(
		type({
			message: "string",
			score: "number",
			correctCount: "number",
			totalQuestions: "number",
		}),
	);

export const getResultsContract = oc
	.route({
		path: "/practice-packs/attempts/{attemptId}/results",
		method: "GET",
		tags: ["Practice Pack"],
	})
	.input(type({ attemptId: "number" }))
	.output(
		type({
			attempt: PracticePackAttemptSchema,
			questions: type({
				questionId: "number",
				order: "number",
				content: "string",
				correctChoiceId: "number",
				selectedChoiceId: "number | null",
				isCorrect: "boolean",
			}).array(),
			score: "number",
			correctCount: "number",
			totalQuestions: "number",
		}),
	);

export const practicePackContract = {
	list: listPracticePacksContract,
	get: getPracticePackContract,
	start: startAttemptContract,
	getQuestions: getQuestionsContract,
	submitAnswer: submitAnswerContract,
	finish: finishAttemptContract,
	getResults: getResultsContract,
};
