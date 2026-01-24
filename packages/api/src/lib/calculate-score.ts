import { db } from "@bimbelbeta/db";
import { question } from "@bimbelbeta/db/schema/question";
import {
	tryoutAttempt,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { eq, inArray } from "drizzle-orm";

export interface SubtestScoreResult {
	subtestAttemptId: number;
	subtestId: number;
	score: number; // 1-1000
	correct: number;
	total: number;
}

export interface TryoutScoreResult {
	subtests: SubtestScoreResult[];
	totalScore: number;
}

/**
 * Calculates scores for all subtests in a tryout attempt.
 * Score is on a 1-1000 scale per subtest.
 * Total score is the average of all subtest scores.
 */
export async function calculateTryoutScores(attemptId: number): Promise<TryoutScoreResult> {
	// Get all subtest attempts for this tryout attempt
	const subtestAttempts = await db.query.tryoutSubtestAttempt.findMany({
		where: eq(tryoutSubtestAttempt.tryoutAttemptId, attemptId),
	});

	if (subtestAttempts.length === 0) {
		return { subtests: [], totalScore: 0 };
	}

	// Get all user answers for this attempt
	const userAnswers = await db.query.tryoutUserAnswer.findMany({
		where: eq(tryoutUserAnswer.attemptId, attemptId),
		with: {
			selectedChoice: {
				columns: {
					isCorrect: true,
				},
			},
		},
	});

	// Create a map of questionId -> user answer
	const answerMap = new Map(userAnswers.map((a) => [a.questionId, a]));

	const subtestScores: SubtestScoreResult[] = [];

	for (const subtestAttempt of subtestAttempts) {
		// Get all questions for this subtest
		const subtestQuestions = await db
			.select({
				questionId: tryoutSubtestQuestion.questionId,
			})
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, subtestAttempt.subtestId));

		if (subtestQuestions.length === 0) {
			// Skip subtests with no questions
			continue;
		}

		// Get question details for essay checking
		const questionIds = subtestQuestions.map((q) => q.questionId);
		const questions = await db.query.question.findMany({
			where: inArray(question.id, questionIds),
			columns: {
				id: true,
				type: true,
				essayCorrectAnswer: true,
			},
		});

		const questionMap = new Map(questions.map((q) => [q.id, q]));

		let correctCount = 0;
		const totalCount = subtestQuestions.length;

		for (const sq of subtestQuestions) {
			const userAnswer = answerMap.get(sq.questionId);
			const questionData = questionMap.get(sq.questionId);

			if (!userAnswer || !questionData) {
				// Unanswered = incorrect
				continue;
			}

			if (questionData.type === "multiple_choice") {
				// Check if selected choice is correct
				if (userAnswer.selectedChoice?.isCorrect) {
					correctCount++;
				}
			} else if (questionData.type === "essay") {
				// Exact match comparison (case-insensitive, trimmed)
				const userEssay = userAnswer.essayAnswer?.trim().toLowerCase() ?? "";
				const correctEssay = questionData.essayCorrectAnswer?.trim().toLowerCase() ?? "";

				if (userEssay && correctEssay && userEssay === correctEssay) {
					correctCount++;
				}
			}
		}

		// Calculate score on 1-1000 scale
		const score = Math.round((correctCount / totalCount) * 1000);

		subtestScores.push({
			subtestAttemptId: subtestAttempt.id,
			subtestId: subtestAttempt.subtestId,
			score,
			correct: correctCount,
			total: totalCount,
		});
	}

	// Calculate total score as average of subtest scores
	const totalScore =
		subtestScores.length > 0
			? Math.round(subtestScores.reduce((sum, s) => sum + s.score, 0) / subtestScores.length)
			: 0;

	return {
		subtests: subtestScores,
		totalScore,
	};
}

/**
 * Saves calculated scores to the database.
 * Updates both subtest attempt scores and the total tryout attempt score.
 */
export async function saveScoresToDatabase(attemptId: number, scores: TryoutScoreResult): Promise<void> {
	// Update each subtest attempt with its score
	for (const subtestScore of scores.subtests) {
		await db
			.update(tryoutSubtestAttempt)
			.set({ score: subtestScore.score })
			.where(eq(tryoutSubtestAttempt.id, subtestScore.subtestAttemptId));
	}

	// Update the total tryout attempt score
	await db.update(tryoutAttempt).set({ score: scores.totalScore }).where(eq(tryoutAttempt.id, attemptId));
}
