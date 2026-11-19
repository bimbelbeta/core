import { db } from "@bimbelbeta/db";

import { DomainError, withErrorFallback } from "@/lib/domain-error";
import { parseNullableInt } from "@/lib/utils";
import {
	createTryoutRepository,
	type SubmissionAttempt,
	type TryoutRepository,
	type TryoutTransaction,
} from "./repository";
import {
	calcTotalScore,
	getScoreFromMap,
	type SubtestScoreResult,
	scoreComplexChoice,
	scoreEssay,
	scoreMultipleChoice,
	type TryoutScoreResult,
} from "./scoring";
import { planSubmitSubtest, reconcileSubtestExpiry, type TimelineMutation } from "./timeline";
import { runInTransaction } from "./transaction";

export type SubmitRepository = Pick<
	TryoutRepository,
	| "lockAttemptForUpdate"
	| "findAttemptForSubmission"
	| "listSubtestAttemptScoreInputs"
	| "listAnswersWithSelectedChoice"
	| "listSubtestQuestionPairs"
	| "listQuestionsForScoring"
	| "listChoiceCorrectness"
	| "listExpiredOngoingAttemptIds"
	| "finishSubtestAttempt"
	| "finishAttempt"
	| "saveScores"
	| "insertSubtestAttempt"
>;

export function toTimelineInput(
	attempt: Pick<SubmissionAttempt, "status" | "deadline" | "breakEndsAt" | "subtestAttempts">,
	subtests: NonNullable<SubmissionAttempt["tryout"]>["subtests"],
) {
	return {
		attemptStatus: attempt.status,
		attemptDeadline: attempt.deadline,
		breakEndsAt: attempt.breakEndsAt ?? null,
		subtests: subtests.map((s) => ({ id: s.id, order: s.order, durationMinutes: s.duration })),
		subtestAttempts: attempt.subtestAttempts,
	};
}

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

const EXPIRED_ATTEMPT_BATCH = 200;

export function createSubmitService(deps: SubmitServiceDependencies) {
	const { repository } = deps;

	async function closeAndScoreAttempt(repo: SubmitRepository, attemptId: number, completedAt?: Date) {
		await repo.finishAttempt(attemptId, { completedAt, autoSubmitted: true });
		const scores = await calculateScores(repo, attemptId);
		await repo.saveScores(attemptId, scores);
		return scores.totalScore;
	}

	async function finalizeAttempt(attemptId: number): Promise<void> {
		await deps.withTransaction(({ repository: repo }) => closeAndScoreAttempt(repo, attemptId));
	}

	async function finalizeExpiredAttempt(attemptId: number): Promise<void> {
		await withErrorFallback("Gagal menyimpan skor tryout.", () => finalizeAttempt(attemptId));
	}

	async function applyMutations(repo: SubmitRepository, attemptId: number, mutations: TimelineMutation[]) {
		let totalScore: number | null = null;
		for (const m of mutations) {
			if (m.kind === "finish_subtest") {
				await repo.finishSubtestAttempt(m.subtestAttemptId, {
					completedAt: m.completedAt,
					autoSubmitted: m.autoSubmitted,
				});
			} else if (m.kind === "insert_subtest") {
				const { kind: _kind, ...values } = m;
				await repo.insertSubtestAttempt({ tryoutAttemptId: attemptId, ...values });
			} else if (m.kind === "finish_attempt") {
				totalScore = await withErrorFallback("Gagal menyimpan skor tryout.", () =>
					closeAndScoreAttempt(repo, attemptId, m.completedAt),
				);
			}
		}
		return totalScore;
	}

	return {
		finalizeExpiredAttempt,

		async reconcileFindAttempt(tryoutId: number, userId: string, now = new Date()) {
			return withErrorFallback("Gagal memproses batas waktu subtest.", () =>
				deps.withTransaction(async ({ repository: repo }) => {
					await repo.lockAttemptForUpdate(tryoutId, userId);
					const attempt = await repo.findAttemptForSubmission(tryoutId, userId);
					if (!attempt || attempt.isRevoked || !attempt.tryout) return { attempt, autoSubmittedSubtestId: null };

					const { mutations, autoSubmittedSubtestId } = reconcileSubtestExpiry(
						toTimelineInput(attempt, attempt.tryout.subtests),
						now,
					);
					if (mutations.length === 0) return { attempt, autoSubmittedSubtestId: null };

					await applyMutations(repo, attempt.id, mutations);
					return {
						attempt: (await repo.findAttemptForSubmission(tryoutId, userId)) ?? attempt,
						autoSubmittedSubtestId,
					};
				}),
			);
		},

		async sweepExpiredAttempts(now = new Date()): Promise<{ finalized: number; failedAttemptIds: number[] }> {
			const attemptIds = await repository.listExpiredOngoingAttemptIds(now, EXPIRED_ATTEMPT_BATCH);
			const failedAttemptIds: number[] = [];
			let finalized = 0;

			for (const attemptId of attemptIds) {
				try {
					await finalizeAttempt(attemptId);
					finalized++;
				} catch (error) {
					failedAttemptIds.push(attemptId);
					console.error(`[cron] Gagal menyelesaikan pengerjaan ${attemptId}.`, error);
				}
			}

			return { finalized, failedAttemptIds };
		},

		async submitSubtest(input: { tryoutId: number; subtestId: number }, userId: string, now = new Date()) {
			return withErrorFallback("Gagal menyimpan progres subtest.", () =>
				deps.withTransaction(async ({ repository: repo }) => {
					await repo.lockAttemptForUpdate(input.tryoutId, userId);
					const attempt = await repo.findAttemptForSubmission(input.tryoutId, userId);
					if (!attempt) throw new DomainError("BAD_REQUEST", "Gagal menemukan pengerjaan tryout.");
					if (attempt.isRevoked) throw new DomainError("FORBIDDEN", "Pengerjaan telah dibatalkan");
					if (!attempt.tryout) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

					const plan = planSubmitSubtest(toTimelineInput(attempt, attempt.tryout.subtests), input.subtestId, now);
					if (plan.kind === "invalid") throw new DomainError("BAD_REQUEST", "Subtest tidak aktif");

					const scoredTotal = plan.mutations.length > 0 ? await applyMutations(repo, attempt.id, plan.mutations) : null;
					if (plan.kind === "next") {
						return {
							success: true as const,
							tryoutCompleted: false as const,
							nextSubtestId: plan.nextSubtestId,
							breakDeadline: plan.breakDeadline,
							autoCompletedByTimer: plan.autoCompletedByTimer,
						};
					}

					return {
						success: true as const,
						tryoutCompleted: true as const,
						score: scoredTotal ?? parseNullableInt(attempt.score) ?? 0,
						autoCompletedByTimer: plan.autoCompletedByTimer,
					};
				}),
			);
		},

		async submitTryout(input: { tryoutId: number }, userId: string) {
			const attempt = await repository.findAttemptForSubmission(input.tryoutId, userId);
			if (!attempt) throw new DomainError("BAD_REQUEST", "Gagal menemukan pengerjaan tryout.");
			if (attempt.isRevoked) throw new DomainError("FORBIDDEN", "Pengerjaan telah dibatalkan");
			if (attempt.status === "finished") {
				return { success: true as const, score: parseNullableInt(attempt.score) ?? 0 };
			}

			const scores = await calculateScores(repository, attempt.id);

			await withErrorFallback("Gagal menyimpan skor tryout.", () =>
				deps.withTransaction(async ({ repository: repo }) => {
					await repo.finishAttempt(attempt.id);
					await repo.saveScores(attempt.id, scores);
				}),
			);

			return { success: true as const, score: scores.totalScore };
		},
	};
}

export const submitService = createSubmitService({
	repository: createTryoutRepository(db),
	withTransaction: runInTransaction,
});
