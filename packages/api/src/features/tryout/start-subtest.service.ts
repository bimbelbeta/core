import { DomainError, withErrorFallback } from "@/lib/domain-error";
import { parseNullableInt } from "@/lib/utils";
import type { TryoutRepository, TryoutTransaction } from "./repository";
import { submitService, type TimelineMutationRepository, toTimelineInput } from "./submit.service";
import { planStartSubtest } from "./timeline";
import { runInTransaction } from "./transaction";

export type StartSubtestRepository = Pick<TryoutRepository, "lockAttemptForUpdate" | "findAttemptForSubtestStart"> &
	TimelineMutationRepository;

export type StartSubtestDependencies = {
	repository?: StartSubtestRepository;
	withTransaction?: <T>(fn: (tx: TryoutTransaction<StartSubtestRepository>) => Promise<T>) => Promise<T>;
};

const INVALID_START_ERRORS = {
	subtest_not_found: ["NOT_FOUND", "Subtest tidak ditemukan"],
	attempt_finished: ["BAD_REQUEST", "Tryout telah berakhir"],
	prerequisite_not_finished: ["BAD_REQUEST", "Selesaikan subtest sebelumnya terlebih dahulu"],
} as const;

export function createStartSubtestService({ withTransaction = runInTransaction }: StartSubtestDependencies = {}) {
	return {
		async start(tryoutId: number, subtestId: number, userId: string, now = new Date()) {
			return withErrorFallback("Gagal memulai subtest.", () =>
				withTransaction(async ({ repository: repo }) => {
					await repo.lockAttemptForUpdate(tryoutId, userId);
					const attempt = await repo.findAttemptForSubtestStart(tryoutId, userId);
					if (!attempt) throw new DomainError("BAD_REQUEST", "Anda belum memulai tryout ini");
					if (attempt.isRevoked) throw new DomainError("FORBIDDEN", "Pengerjaan telah dibatalkan");
					if (!attempt.tryout) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

					const plan = planStartSubtest(toTimelineInput(attempt, attempt.tryout.subtests), subtestId, now);
					if (plan.kind === "existing") {
						const existing = attempt.subtestAttempts.find((item) => item.subtestId === subtestId);
						if (!existing) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memulai subtest");
						return { ...existing, score: parseNullableInt(existing.score) };
					}
					if (plan.kind === "invalid") {
						const [code, message] = INVALID_START_ERRORS[plan.reason];
						throw new DomainError(code, message);
					}

					const { insertedSubtests, scores } = await submitService.applyTimelineMutations(
						repo,
						attempt.id,
						plan.mutations,
					);
					const created = insertedSubtests.find((row) => row.subtestId === subtestId);
					if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memulai subtest");

					const scored = scores?.subtests.find((s) => s.subtestId === subtestId)?.score;
					return { ...created, score: scored ?? parseNullableInt(created.score) };
				}),
			);
		},
	};
}

export const startSubtestService = createStartSubtestService({ withTransaction: runInTransaction });
