import { db } from "@bimbelbeta/db";
import { createCreditRepository } from "@/features/credit/repository";
import { DomainError } from "@/lib/domain-error";
import { computeSubtestDeadline } from "./deadline";
import { createTryoutRepository, type TryoutRepository, type TryoutTransaction } from "./repository";
import {
	calcTotalScore,
	getScoreFromMap,
	type SubtestScoreResult,
	scoreComplexChoice,
	scoreEssay,
	scoreMultipleChoice,
	type TryoutScoreResult,
} from "./scoring";

export type SubmitRepository = Pick<
	TryoutRepository,
	| "findAttemptForSubmission"
	| "listSubtestAttemptScoreInputs"
	| "listAnswersWithSelectedChoice"
	| "listSubtestQuestionPairs"
	| "listQuestionsForScoring"
	| "listChoiceCorrectness"
	| "finishSubtestAttempt"
	| "finishAttempt"
	| "saveScores"
	| "insertSubtestAttempt"
>;

export type SubmitServiceDependencies = {
	repository: SubmitRepository;
	withTransaction: <T>(fn: (tx: TryoutTransaction<SubmitRepository>) => Promise<T>) => Promise<T>;
};

async function calculateScores(repository: SubmitRepository, attemptId: number): Promise<TryoutScoreResult> {
	const subtestAttempts = await repository.listSubtestAttemptScoreInputs(attemptId);
	if (subtestAttempts.length === 0) {
		return { subtests: [], totalScore: 0 };
	}

	const userAnswers = await repository.listAnswersWithSelectedChoice(attemptId);
	const answerMap = new Map(userAnswers.map((a) => [a.questionId, a]));

	const subtestIds = subtestAttempts.map((sa) => sa.subtestId);
	const allSubtestQuestions = await repository.listSubtestQuestionPairs(subtestIds);
	const questionsBySubtest = new Map<number, number[]>();
	for (const sq of allSubtestQuestions) {
		if (!questionsBySubtest.has(sq.subtestId)) {
			questionsBySubtest.set(sq.subtestId, []);
		}
		questionsBySubtest.get(sq.subtestId)!.push(sq.questionId);
	}

	const allQuestionIds = allSubtestQuestions.map((sq) => sq.questionId);
	const allQuestions = allQuestionIds.length > 0 ? await repository.listQuestionsForScoring(allQuestionIds) : [];
	const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

	const complexQuestionIds = allQuestions.filter((q) => q.type === "multiple_choice_complex").map((q) => q.id);
	const allComplexChoices =
		complexQuestionIds.length > 0 ? await repository.listChoiceCorrectness(complexQuestionIds) : [];
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
				continue;
			}

			if (questionData.type === "multiple_choice") {
				if (scoreMultipleChoice(userAnswer.selectedChoiceCorrect)) {
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

		const score = getScoreFromMap(subtestAttempt.scoringMap, correctCount, totalCount);
		subtestScores.push({
			subtestAttemptId: subtestAttempt.id,
			subtestId: subtestAttempt.subtestId,
			score,
			correct: correctCount,
			total: totalCount,
		});
	}

	const totalScore = calcTotalScore(subtestScores.map((s) => s.score));
	return { subtests: subtestScores, totalScore };
}

export function createSubmitService(deps: SubmitServiceDependencies) {
	const { repository } = deps;

	async function finalizeExpiredAttempt(attemptId: number): Promise<void> {
		const scores = await calculateScores(repository, attemptId);

		await deps
			.withTransaction(async ({ repository: repo }) => {
				await repo.finishAttempt(attemptId);
				await repo.saveScores(attemptId, scores);
			})
			.catch(async (error: unknown) => {
				console.error(error);
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal menyimpan skor tryout.");
			});
	}

	return {
		finalizeExpiredAttempt,

		async submitSubtest(input: { tryoutId: number; subtestId: number }, userId: string) {
			const attempt = await repository.findAttemptForSubmission(input.tryoutId, userId);
			if (!attempt) throw new DomainError("BAD_REQUEST", "Gagal menemukan pengerjaan tryout.");

			const currentSubtestAttempt = attempt.subtestAttempts.find(
				(sa) => sa.subtestId === input.subtestId && sa.status === "ongoing",
			);
			if (!currentSubtestAttempt) throw new DomainError("BAD_REQUEST", "Subtest tidak aktif");

			const tryoutData = attempt.tryout;
			if (!tryoutData) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const currentIndex = tryoutData.subtests.findIndex((s) => s.id === input.subtestId);
			if (currentIndex === -1) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");

			const now = new Date();
			if (attempt.deadline && attempt.deadline < now) {
				throw new DomainError("BAD_REQUEST", "Tryout telah berakhir");
			}

			const nextSubtest = tryoutData.subtests[currentIndex + 1];
			if (nextSubtest) {
				const nextDeadline = computeSubtestDeadline(nextSubtest.duration, attempt.deadline);
				await deps
					.withTransaction(async ({ repository: repo }) => {
						await repo.finishSubtestAttempt(currentSubtestAttempt.id);
						await repo.insertSubtestAttempt({
							tryoutAttemptId: attempt.id,
							subtestId: nextSubtest.id,
							deadline: nextDeadline,
						});
					})
					.catch(async (error: unknown) => {
						console.error(error);
						throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal menyimpan progres subtest.");
					});
				return { success: true as const, tryoutCompleted: false as const, nextSubtestId: nextSubtest.id };
			}

			const scores = await calculateScores(repository, attempt.id);

			await deps
				.withTransaction(async ({ repository: repo }) => {
					await repo.finishSubtestAttempt(currentSubtestAttempt.id);
					await repo.finishAttempt(attempt.id);
					await repo.saveScores(attempt.id, scores);
				})
				.catch(async (error: unknown) => {
					console.error(error);
					throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal menyimpan skor tryout.");
				});

			return { success: true as const, tryoutCompleted: true as const, score: scores.totalScore };
		},

		async submitTryout(input: { tryoutId: number }, userId: string) {
			const attempt = await repository.findAttemptForSubmission(input.tryoutId, userId);
			if (!attempt) throw new DomainError("BAD_REQUEST", "Gagal menemukan pengerjaan tryout.");

			const scores = await calculateScores(repository, attempt.id);

			await deps
				.withTransaction(async ({ repository: repo }) => {
					await repo.finishAttempt(attempt.id);
					await repo.saveScores(attempt.id, scores);
				})
				.catch(async (error: unknown) => {
					console.error(error);
					throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal menyimpan skor tryout.");
				});

			return { success: true as const, score: scores.totalScore };
		},
	};
}

export const submitService = createSubmitService({
	repository: createTryoutRepository(db),
	withTransaction: (fn) =>
		db.transaction(async (trx) => fn({ repository: createTryoutRepository(trx), credit: createCreditRepository(trx) })),
});
