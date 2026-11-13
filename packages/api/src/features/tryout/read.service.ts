import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildDateIdCursorPage, decodeDateIdPage } from "@/lib/pagination/cursor";
import { parseNullableInt } from "@/lib/utils";
import { flattenReviewQuestions, flattenTryoutQuestions } from "./question-utils";
import { createTryoutRepository, type TryoutRepository } from "./repository";
import { calcTryoutMaxScore } from "./scoring";
import { submitService } from "./submit.service";

export type ReadRepository = Pick<
	TryoutRepository,
	| "findPublishedTryoutWithSubtests"
	| "findAttemptWithSubtestAttempts"
	| "listForMember"
	| "findFeatured"
	| "listHistory"
	| "listSubtestScoringInputs"
	| "findFinishedAttemptResult"
	| "findAttemptForReview"
	| "findSubtestName"
	| "listSubtestQuestionRows"
>;

export type ReadServiceDependencies = {
	repository: ReadRepository;
	finalizeExpiredAttempt: (attemptId: number) => Promise<void>;
};

export function createTryoutReadService(deps: ReadServiceDependencies) {
	const { repository } = deps;

	return {
		async list(
			input:
				| {
						limit?: number;
						after?: string;
						before?: string;
						level?: "utbk" | "tka";
						category?: "sd" | "smp" | "sma" | "utbk";
				  }
				| undefined,
			caller: Session["user"],
		) {
			const now = new Date();
			const { limit, backward: isBackward, cursorDateId, hasCursor } = decodeDateIdPage(input);

			const rows = await repository.listForMember({
				userId: caller.id,
				limit,
				backward: isBackward,
				cursorStartsAt: cursorDateId ?? null,
			});

			const { items, pageInfo } = buildDateIdCursorPage(rows, limit, isBackward, hasCursor);

			return {
				items: items.map((t) => ({
					...t,
					isOpen: (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt >= now),
				})),
				pageInfo,
			};
		},

		async active(_caller: Session["user"]) {
			return [];
		},

		async featured(caller: Session["user"]) {
			const data = await repository.findFeatured(caller.id);
			if (!data) throw new DomainError("NOT_FOUND", "Gagal menemukan paket Tryout!");

			let status: "finished" | "not_started" | "ongoing" = "not_started";
			if (data.startedAt) status = "ongoing";
			if (data.completedAt) status = "finished";

			return { ...data, status };
		},

		async find(input: { id: number }, caller: Session["user"]) {
			const tryoutData = await repository.findPublishedTryoutWithSubtests(input.id);
			if (!tryoutData) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan.");

			const attempt = await repository.findAttemptWithSubtestAttempts(input.id, caller.id);
			if (!attempt || attempt.isRevoked) {
				throw new DomainError("UNAUTHORIZED", "Gagal menemukan pengerjaan tryout.");
			}

			const normalizedAttempt = { ...attempt, score: parseNullableInt(attempt.score) };
			const mappedSubtests = tryoutData.subtests.map((subtest) => ({
				...subtest,
				questionCount: subtest.questionCount ?? 0,
			}));
			const baseTryoutData = { ...tryoutData, subtests: mappedSubtests };

			if (normalizedAttempt.status === "finished") {
				return {
					...baseTryoutData,
					attempt: normalizedAttempt,
					currentSubtest: null,
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: null,
					autoSubmittedSubtestId: null,
					totalSubtests: mappedSubtests.length,
					completedSubtests: mappedSubtests.length,
				};
			}

			const completedSubtestIds = new Set(
				normalizedAttempt.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
			);
			const currentSubtest = mappedSubtests.find((s) => !completedSubtestIds.has(s.id));

			if (
				Date.now() > normalizedAttempt.deadline.getTime() &&
				!normalizedAttempt.completedAt &&
				normalizedAttempt.status === "ongoing"
			) {
				await deps.finalizeExpiredAttempt(normalizedAttempt.id);

				return {
					...baseTryoutData,
					attempt: { ...normalizedAttempt, status: "finished" as const, completedAt: new Date() },
					currentSubtest: null,
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: null,
					autoSubmittedSubtestId: null,
					totalSubtests: mappedSubtests.length,
					completedSubtests: completedSubtestIds.size,
				};
			}

			if (!currentSubtest) {
				return {
					...baseTryoutData,
					attempt: normalizedAttempt,
					currentSubtest: null,
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: normalizedAttempt.breakEndsAt ?? null,
					autoSubmittedSubtestId: null,
					totalSubtests: mappedSubtests.length,
					completedSubtests: completedSubtestIds.size,
				};
			}

			const currentSubtestAttempt = normalizedAttempt.subtestAttempts.find((sa) => sa.subtestId === currentSubtest.id);

			if (!currentSubtestAttempt) {
				return {
					...baseTryoutData,
					attempt: normalizedAttempt,
					currentSubtest: {
						...currentSubtest,
						questions: [],
						deadline: null,
						status: "not_started" as const,
					},
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: normalizedAttempt.breakEndsAt ?? null,
					autoSubmittedSubtestId: null,
					totalSubtests: mappedSubtests.length,
					completedSubtests: completedSubtestIds.size,
				};
			}

			const rows = await repository.listSubtestQuestionRows(currentSubtest.id, attempt.id);
			const questions = flattenTryoutQuestions(rows);

			return {
				...baseTryoutData,
				attempt: normalizedAttempt,
				currentSubtest: {
					...currentSubtest,
					questions,
					deadline: currentSubtestAttempt.deadline,
					status: currentSubtestAttempt.status,
				},
				overallDeadline: normalizedAttempt.deadline,
				breakDeadline: null,
				autoSubmittedSubtestId: null,
				totalSubtests: mappedSubtests.length,
				completedSubtests: completedSubtestIds.size,
			};
		},

		async history(caller: Session["user"]) {
			const attempts = await repository.listHistory(caller.id);
			const scoringInputs = await repository.listSubtestScoringInputs(attempts.map((attempt) => attempt.tryout.id));
			return attempts.map((attempt) => ({
				...attempt,
				score: parseNullableInt(attempt.score),
				maxScore: calcTryoutMaxScore(scoringInputs.filter((input) => input.tryoutId === attempt.tryout.id)),
				tryout: attempt.tryout,
			}));
		},

		async result(input: { attemptId: number }, caller: Session["user"]) {
			const attempt = await repository.findFinishedAttemptResult(input.attemptId, caller.id);
			if (!attempt) throw new DomainError("NOT_FOUND", "Gagal menemukan pengerjaan tryout.");

			const scoringInputs = await repository.listSubtestScoringInputs([attempt.tryout.id]);

			return {
				...attempt,
				attemptNumber: attempt.attemptNumber,
				isRetake: attempt.attemptNumber > 1,
				score: parseNullableInt(attempt.score),
				maxScore: calcTryoutMaxScore(scoringInputs),
				tryout: attempt.tryout,
				subtestAttempts: attempt.subtestAttempts.map((sa) => ({
					...sa,
					score: parseNullableInt(sa.score),
					correctCount: 0,
					questionCount: 0,
				})),
				allAttempts: [],
			};
		},

		async ranking(
			_input: { id: number; limit?: number; after?: string; before?: string; search?: string; universityId?: number },
			_caller: Session["user"],
		) {
			return {
				items: [],
				myRank: null,
				pageInfo: {
					hasNextPage: false,
					hasPreviousPage: false,
					startCursor: null,
					endCursor: null,
				},
			};
		},

		async review(input: { attemptId: number; subtestId: number }, caller: Session["user"]) {
			const attempt = await repository.findAttemptForReview(input.attemptId, caller.id);
			if (!attempt) throw new DomainError("NOT_FOUND", "Gagal menemukan pengerjaan tryout.");

			const canSeeDiscussion = caller.isPremium || attempt.usedCredit || attempt.usedAccessCode;

			const subtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);
			if (subtestAttempt?.status !== "finished") {
				throw new DomainError("BAD_REQUEST", "Subtest belum selesai atau tidak ditemukan.");
			}

			const rows = await repository.listSubtestQuestionRows(input.subtestId, attempt.id);
			const questions = flattenReviewQuestions(rows, canSeeDiscussion);

			const subtestData = await repository.findSubtestName(input.subtestId);
			if (!subtestData) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");

			return {
				tryout: attempt.tryout ?? { id: 0, title: "", category: "utbk" as const },
				attemptNumber: attempt.attemptNumber,
				isRetake: attempt.attemptNumber > 1,
				subtest: subtestData,
				questions,
			};
		},
	};
}

export const tryoutReadService = createTryoutReadService({
	repository: createTryoutRepository(db),
	finalizeExpiredAttempt: (attemptId) => submitService.finalizeExpiredAttempt(attemptId),
});
