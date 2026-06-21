import { db } from "@bimbelbeta/db";
import {
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
} from "@bimbelbeta/db/schema/tryout";
import { eq, inArray, sql } from "drizzle-orm";

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
 * Calculates score from a scoring map or falls back to linear percentage.
 * @param scoringMap - Map of correctCount -> score (e.g., {"1": 120, "2": 200, ...})
 * @param correctCount - Number of correct answers
 * @param totalCount - Total number of questions
 * @returns The calculated score
 */
export function getScoreFromMap(
	scoringMap: Record<string, number> | null | undefined,
	correctCount: number,
	totalCount: number,
): number {
	// If scoring map exists and has the correct count, use it
	const mappedScore = scoringMap?.[correctCount.toString()];
	if (mappedScore !== undefined) {
		return mappedScore;
	}
	// Fallback: linear scale (0-1000)
	if (totalCount === 0) return 0;
	return Math.round((correctCount / totalCount) * 1000);
}

/** Returns true if the multiple-choice answer is correct. */
export function scoreMultipleChoice(isCorrect: boolean | null | undefined): boolean {
	return !!isCorrect;
}

/** Returns true if ALL correct choices are selected and NO incorrect choices are selected. */
export function scoreComplexChoice(selectedIds: number[], choices: Array<{ id: number; isCorrect: boolean }>): boolean {
	const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id);
	const selectedIncorrectChoices = selectedIds.filter((id) => !correctChoiceIds.includes(id));
	const allCorrectSelected = correctChoiceIds.every((id) => selectedIds.includes(id));
	const noIncorrectSelected = selectedIncorrectChoices.length === 0;
	return allCorrectSelected && noIncorrectSelected;
}

/** Returns true if the trimmed, lowercased essay answer matches the correct answer. */
export function scoreEssay(userAnswer: string | null | undefined, correctAnswer: string | null | undefined): boolean {
	const userEssay = userAnswer?.trim().toLowerCase() ?? "";
	const correctEssay = correctAnswer?.trim().toLowerCase() ?? "";
	return !!(userEssay && correctEssay && userEssay === correctEssay);
}

/** Calculates total score as the rounded average of per-subtest scores. Returns 0 for empty input. */
export function calcTotalScore(scores: number[]): number {
	if (scores.length === 0) return 0;
	return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Calculates scores for all subtests in a tryout attempt.
 * Score is on a 1-1000 scale per subtest.
 * Total score is the average of all subtest scores.
 */
export async function calculateTryoutScores(attemptId: number): Promise<TryoutScoreResult> {
	const subtestAttempts = await db
		.select({
			id: tryoutSubtestAttempt.id,
			subtestId: tryoutSubtestAttempt.subtestId,
			scoringMap: tryoutSubtest.scoringMap,
		})
		.from(tryoutSubtestAttempt)
		.innerJoin(tryoutSubtest, eq(tryoutSubtest.id, tryoutSubtestAttempt.subtestId))
		.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptId));

	if (subtestAttempts.length === 0) {
		return { subtests: [], totalScore: 0 };
	}

	const userAnswers = await db.query.tryoutUserAnswer.findMany({
		where: {
			attemptId: { eq: attemptId },
		},
		with: {
			selectedChoice: {
				columns: {
					isCorrect: true,
				},
			},
		},
	});

	const answerMap = new Map(userAnswers.map((a) => [a.questionId, a]));

	// Bulk-fetch all subtest questions for all subtests in one query
	const subtestIds = subtestAttempts.map((sa) => sa.subtestId);
	const allSubtestQuestions = await db
		.select({
			subtestId: tryoutSubtestQuestion.subtestId,
			questionId: tryoutSubtestQuestion.questionId,
		})
		.from(tryoutSubtestQuestion)
		.where(inArray(tryoutSubtestQuestion.subtestId, subtestIds));

	// Group subtest questions by subtestId
	const questionsBySubtest = new Map<number, number[]>();
	for (const sq of allSubtestQuestions) {
		if (!questionsBySubtest.has(sq.subtestId)) {
			questionsBySubtest.set(sq.subtestId, []);
		}
		questionsBySubtest.get(sq.subtestId)!.push(sq.questionId);
	}

	// Bulk-fetch all questions for all subtests in one query
	const allQuestionIds = allSubtestQuestions.map((sq) => sq.questionId);
	const allQuestions =
		allQuestionIds.length > 0
			? await db.query.question.findMany({
					where: { id: { in: allQuestionIds } },
					columns: { id: true, type: true, essayCorrectAnswer: true },
				})
			: [];

	const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

	// Bulk-fetch all complex choices in one query
	const complexQuestionIds = allQuestions.filter((q) => q.type === "multiple_choice_complex").map((q) => q.id);
	const allComplexChoices =
		complexQuestionIds.length > 0
			? await db.query.questionChoice.findMany({
					where: { questionId: { in: complexQuestionIds } },
					columns: { questionId: true, id: true, isCorrect: true },
				})
			: [];

	// Group choices by questionId for efficient lookup
	const choicesByQuestion = new Map<number, Array<{ id: number; isCorrect: boolean }>>();
	for (const choice of allComplexChoices) {
		if (!choicesByQuestion.has(choice.questionId)) {
			choicesByQuestion.set(choice.questionId, []);
		}
		choicesByQuestion.get(choice.questionId)!.push({ id: choice.id, isCorrect: choice.isCorrect });
	}

	const subtestScores: SubtestScoreResult[] = [];

	for (const subtestAttempt of subtestAttempts) {
		const subtestQuestionIds = questionsBySubtest.get(subtestAttempt.subtestId) ?? [];

		if (subtestQuestionIds.length === 0) {
			continue;
		}

		let correctCount = 0;
		const totalCount = subtestQuestionIds.length;

		for (const questionId of subtestQuestionIds) {
			const userAnswer = answerMap.get(questionId);
			const questionData = questionMap.get(questionId);

			if (!userAnswer || !questionData) {
				// Unanswered = incorrect
				continue;
			}

			if (questionData.type === "multiple_choice") {
				if (scoreMultipleChoice(userAnswer.selectedChoice?.isCorrect)) {
					correctCount++;
				}
			} else if (questionData.type === "multiple_choice_complex") {
				const selectedIds = userAnswer.selectedChoiceIds ?? [];
				const choices = choicesByQuestion.get(questionId) ?? [];
				if (scoreComplexChoice(selectedIds, choices)) {
					correctCount++;
				}
			} else if (questionData.type === "essay") {
				if (scoreEssay(userAnswer.essayAnswer, questionData.essayCorrectAnswer)) {
					correctCount++;
				}
			}
		}

		// Calculate score using scoring map or linear fallback
		const score = getScoreFromMap(subtestAttempt.scoringMap, correctCount, totalCount);

		subtestScores.push({
			subtestAttemptId: subtestAttempt.id,
			subtestId: subtestAttempt.subtestId,
			score,
			correct: correctCount,
			total: totalCount,
		});
	}

	// Calculate total score as average of subtest scores
	const totalScore = calcTotalScore(subtestScores.map((s) => s.score));

	return {
		subtests: subtestScores,
		totalScore,
	};
}

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Saves calculated scores to the database.
 * Updates both subtest attempt scores and the total tryout attempt score.
 * Pass an existing transaction `tx` to participate in a caller-managed transaction,
 * or omit it to run in its own transaction.
 */
export async function saveScoresToDatabase(attemptId: number, scores: TryoutScoreResult, tx?: DbTx): Promise<void> {
	const persist = async (t: DbTx) => {
		if (scores.subtests.length > 0) {
			const caseExpr = sql.join(
				scores.subtests.map(
					(s) => sql`WHEN ${tryoutSubtestAttempt.id} = ${s.subtestAttemptId} THEN ${s.score}`,
				),
				sql` `,
			);
			const ids = scores.subtests.map((s) => s.subtestAttemptId);

			await t
				.update(tryoutSubtestAttempt)
				.set({ score: sql`CASE ${caseExpr} END` })
				.where(inArray(tryoutSubtestAttempt.id, ids));
		}
		await t.update(tryoutAttempt).set({ score: scores.totalScore }).where(eq(tryoutAttempt.id, attemptId));
	};

	if (tx) {
		await persist(tx);
	} else {
		await db.transaction(persist);
	}
}
