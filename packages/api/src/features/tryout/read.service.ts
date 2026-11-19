import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildDateIdCursorPage, decodeDateIdPage } from "@/lib/pagination/cursor";
import { parseNullableInt } from "@/lib/utils";
import { flattenReviewQuestions, flattenTryoutQuestions } from "./question-utils";
import { type AttemptWithSubtestAttempts, createTryoutRepository, type TryoutRepository } from "./repository";
import { calcTryoutMaxScore } from "./scoring";
import { submitService, toTimelineInput } from "./submit.service";
import { reconcileTimeline, type TimelinePhase } from "./timeline";

export type ReadRepository = Pick<
	TryoutRepository,
	| "findPublishedTryoutWithSubtests"
	| "findAttemptWithSubtestAttempts"
	| "listForMember"
	| "listActiveAttempts"
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
	reconcileFindAttempt: (
		tryoutId: number,
		userId: string,
		now: Date,
	) => Promise<{ attempt: AttemptWithSubtestAttempts | undefined; phase: TimelinePhase }>;
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
				level: input?.level,
				category: input?.category,
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

		async active(caller: Session["user"]) {
			const rows = await repository.listActiveAttempts(caller.id, new Date());
			return rows.flatMap((row) => {
				if (row.tryout?.status !== "published") return [];
				const tryoutData = row.tryout;
				const completedSubtestIds = new Set(
					row.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
				);
				const ongoing = row.subtestAttempts.find((sa) => sa.status === "ongoing");
				const activeSubtest = ongoing
					? tryoutData.subtests.find((s) => s.id === ongoing.subtestId)
					: tryoutData.subtests.find((s) => !completedSubtestIds.has(s.id));

				return [
					{
						id: tryoutData.id,
						attemptId: row.id,
						attemptNumber: row.attemptNumber,
						title: tryoutData.title,
						category: tryoutData.category,
						totalSubtests: tryoutData.subtests.length,
						completedSubtests: completedSubtestIds.size,
						activeSubtestName: activeSubtest?.name ?? null,
						activeDeadline: ongoing ? ongoing.deadline : null,
						breakDeadline: ongoing ? null : (row.breakEndsAt ?? null),
					},
				];
			});
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

			const initialAttempt = await repository.findAttemptWithSubtestAttempts(input.id, caller.id);
			if (!initialAttempt || initialAttempt.isRevoked) {
				throw new DomainError("UNAUTHORIZED", "Gagal menemukan pengerjaan tryout.");
			}

			const now = new Date();
			const initialReconciled = reconcileTimeline(toTimelineInput(initialAttempt, tryoutData.subtests), now);
			const reconciled =
				initialReconciled.mutations.length > 0 ? await deps.reconcileFindAttempt(input.id, caller.id, now) : null;
			const attempt = reconciled ? reconciled.attempt : initialAttempt;
			if (!attempt || attempt.isRevoked) {
				throw new DomainError("UNAUTHORIZED", "Gagal menemukan pengerjaan tryout.");
			}
			const phase = reconciled ? reconciled.phase : initialReconciled.phase;

			const normalizedAttempt = { ...attempt, score: parseNullableInt(attempt.score) };
			const mappedSubtests = tryoutData.subtests.map((subtest) => ({
				...subtest,
				questionCount: subtest.questionCount ?? 0,
			}));
			const baseTryoutData = { ...tryoutData, subtests: mappedSubtests };

			if (phase.phase === "finished") {
				return {
					...baseTryoutData,
					attempt: normalizedAttempt,
					currentSubtest: null,
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: null,
					autoSubmittedSubtestId: phase.autoSubmittedSubtestId,
					totalSubtests: mappedSubtests.length,
					completedSubtests: mappedSubtests.length,
				};
			}

			const completedSubtestIds = new Set(
				normalizedAttempt.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
			);
			const targetSubtestId = phase.phase === "break" ? phase.nextSubtestId : phase.subtestId;
			const currentSubtest = mappedSubtests.find((s) => s.id === targetSubtestId);

			if (!currentSubtest) {
				return {
					...baseTryoutData,
					attempt: normalizedAttempt,
					currentSubtest: null,
					overallDeadline: normalizedAttempt.deadline,
					breakDeadline: phase.phase === "break" ? phase.breakEndsAt : null,
					autoSubmittedSubtestId: phase.phase === "break" ? phase.autoSubmittedSubtestId : null,
					totalSubtests: mappedSubtests.length,
					completedSubtests: completedSubtestIds.size,
				};
			}

			if (phase.phase === "break") {
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
					breakDeadline: phase.breakEndsAt,
					autoSubmittedSubtestId: phase.autoSubmittedSubtestId,
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
					deadline: phase.deadline,
					status: "ongoing" as const,
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

			const subtestAttempt = attempt.subtestAttempts.find((sa) => sa.subtestId === input.subtestId);
			if (subtestAttempt?.status !== "finished") {
				throw new DomainError("BAD_REQUEST", "Subtest belum selesai atau tidak ditemukan.");
			}

			const rows = await repository.listSubtestQuestionRows(input.subtestId, attempt.id);
			const questions = flattenReviewQuestions(rows);

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
	reconcileFindAttempt: (tryoutId, userId, now) => submitService.reconcileFindAttempt(tryoutId, userId, now),
});
