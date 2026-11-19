import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";

import { DomainError } from "@/lib/domain-error";
import { parseNullableInt } from "@/lib/utils";
import { createTryoutRepository, type TryoutRepository, type TryoutTransaction } from "./repository";
import { runInTransaction } from "./transaction";

export type StartTryoutRepository = Pick<
	TryoutRepository,
	"findPublishedTryoutWithSubtests" | "findAttempt" | "insertAttempt" | "insertSubtestAttempt"
>;

export type StartTryoutDependencies = {
	repository: StartTryoutRepository;
	withTransaction: <T>(fn: (tx: TryoutTransaction<StartTryoutRepository>) => Promise<T>) => Promise<T>;
};

export type StartTryoutInput = {
	id: number;
	imageUrl?: string;
	useCredit?: boolean;
	accessCode?: string;
	retake?: boolean;
};

export function createStartTryoutService(deps: StartTryoutDependencies) {
	const { repository } = deps;

	return {
		async start(input: StartTryoutInput, caller: Session["user"]) {
			const tryoutData = await repository.findPublishedTryoutWithSubtests(input.id);
			if (!tryoutData) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const now = new Date();
			if (tryoutData.startsAt && tryoutData.startsAt > now) {
				throw new DomainError("BAD_REQUEST", "Tryout belum dimulai");
			}
			if (tryoutData.endsAt && tryoutData.endsAt < now) {
				throw new DomainError("BAD_REQUEST", "Tryout sudah selesai");
			}

			const existingAttempt = await repository.findAttempt(input.id, caller.id);
			if (existingAttempt) {
				if (existingAttempt.isRevoked) {
					throw new DomainError("FORBIDDEN", "Pengerjaan telah dibatalkan");
				}
				return {
					...existingAttempt,
					score: parseNullableInt(existingAttempt.score),
				};
			}

			if (tryoutData.subtests.length === 0) {
				throw new DomainError("BAD_REQUEST", "Tryout tidak memiliki subtest");
			}

			let cumulativeMinutes = 0;
			const deadlineMap = new Map<number, Date>();
			for (const subtest of tryoutData.subtests) {
				cumulativeMinutes += subtest.duration;
				const deadline = new Date(now.getTime() + cumulativeMinutes * 60 * 1000);
				deadlineMap.set(subtest.id, deadline);
			}

			const overallDeadline = deadlineMap.get(tryoutData.subtests[tryoutData.subtests.length - 1]!.id)!;

			const result = await deps.withTransaction(async ({ repository: repo }) => {
				const newAttempt = await repo.insertAttempt({
					tryoutId: input.id,
					userId: caller.id,
					submittedImageUrl: null,
					deadline: overallDeadline,
					usedCredit: false,
					usedAccessCode: false,
					accessCodeId: null,
				});
				if (!newAttempt) {
					const existing = await repo.findAttempt(input.id, caller.id);
					if (!existing) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memulai tryout");
					if (existing.isRevoked) {
						throw new DomainError("FORBIDDEN", "Pengerjaan telah dibatalkan");
					}
					return { created: false as const, attempt: existing };
				}

				const firstSubtest = tryoutData.subtests[0]!;
				await repo.insertSubtestAttempt({
					tryoutAttemptId: newAttempt.id,
					subtestId: firstSubtest.id,
					deadline: deadlineMap.get(firstSubtest.id)!,
				});

				return { created: true as const, attempt: newAttempt };
			});

			if (!result.created) {
				return {
					...result.attempt,
					score: parseNullableInt(result.attempt.score),
				};
			}

			return {
				...result.attempt,
				score: parseNullableInt(result.attempt.score),
				overallDeadline,
			};
		},
	};
}

export const startTryoutService = createStartTryoutService({
	repository: createTryoutRepository(db),
	withTransaction: runInTransaction,
});
