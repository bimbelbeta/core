import { db } from "@bimbelbeta/db";
import {
  tryoutAttempt,
  tryoutSubtest,
  tryoutSubtestAttempt,
  tryoutSubtestQuestion,
} from "@bimbelbeta/db/schema/tryout";
import { eq } from "drizzle-orm";

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
function getScoreFromMap(
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
  return Math.round((correctCount / totalCount) * 1000);
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

  const subtestScores: SubtestScoreResult[] = [];

  for (const subtestAttempt of subtestAttempts) {
    const subtestQuestions = await db
      .select({
        questionId: tryoutSubtestQuestion.questionId,
      })
      .from(tryoutSubtestQuestion)
      .where(eq(tryoutSubtestQuestion.subtestId, subtestAttempt.subtestId));

    if (subtestQuestions.length === 0) {
      continue;
    }

    const questionIds = subtestQuestions.map((q) => q.questionId);
    const questions = await db.query.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      columns: {
        id: true,
        type: true,
        essayCorrectAnswer: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const complexQuestionIds = questions.filter((q) => q.type === "multiple_choice_complex").map((q) => q.id);

    const allComplexChoices =
      complexQuestionIds.length > 0
        ? await db.query.questionChoice.findMany({
          where: {
            questionId: {
              in: complexQuestionIds,
            },
          },
          columns: {
            questionId: true,
            id: true,
            isCorrect: true,
          },
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
      } else if (questionData.type === "multiple_choice_complex") {
        // Correct if: ALL correct choices are selected AND NO incorrect choices are selected
        const selectedIds = userAnswer.selectedChoiceIds ?? [];
        const choices = choicesByQuestion.get(sq.questionId) ?? [];

        const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id);
        const selectedIncorrectChoices = selectedIds.filter((id) => !correctChoiceIds.includes(id));

        // Correct only if all correct are selected and no incorrect are selected
        const allCorrectSelected = correctChoiceIds.every((id) => selectedIds.includes(id));
        const noIncorrectSelected = selectedIncorrectChoices.length === 0;

        if (allCorrectSelected && noIncorrectSelected) {
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
      .set({ score: subtestScore.score.toString() })
      .where(eq(tryoutSubtestAttempt.id, subtestScore.subtestAttemptId));
  }

  // Update the total tryout attempt score
  await db.update(tryoutAttempt).set({ score: scores.totalScore.toString() }).where(eq(tryoutAttempt.id, attemptId));
}
