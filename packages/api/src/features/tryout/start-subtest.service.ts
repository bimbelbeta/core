import { db } from "@bimbelbeta/db";
import { DomainError } from "@/lib/domain-error";
import { parseNullableInt } from "@/lib/utils";
import { computeSubtestDeadline } from "./deadline";
import { createTryoutRepository, type SubtestAttemptInsert, type TryoutRepository } from "./repository";

export type StartSubtestRepository = Pick<TryoutRepository, "findAttemptForSubtestStart" | "insertSubtestAttempt">;

export function createStartSubtestService({ repository }: { repository: StartSubtestRepository }) {
	return {
		async start(tryoutId: number, subtestId: number, userId: string) {
			const attempt = await repository.findAttemptForSubtestStart(tryoutId, userId);
			if (!attempt) throw new DomainError("BAD_REQUEST", "Anda belum memulai tryout ini");

			const existing = attempt.subtestAttempts.find((item) => item.subtestId === subtestId);
			if (existing) return { ...existing, score: parseNullableInt(existing.score) };
			if (!attempt.tryout) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const index = attempt.tryout.subtests.findIndex((item) => item.id === subtestId);
			if (index === -1) throw new DomainError("NOT_FOUND", "Subtest tidak ditemukan");

			const previous =
				index > 0
					? attempt.subtestAttempts.find((item) => item.subtestId === attempt.tryout?.subtests[index - 1]?.id)
					: undefined;
			if (index > 0 && previous?.status !== "finished") {
				throw new DomainError("BAD_REQUEST", "Selesaikan subtest sebelumnya terlebih dahulu");
			}
			if (previous && !previous.deadline) {
				throw new DomainError("BAD_REQUEST", "Pengerjaan tidak memiliki batas waktu");
			}

			const startFrom = previous?.deadline ?? new Date();
			const deadline = computeSubtestDeadline(attempt.tryout.subtests[index]!.duration, attempt.deadline, startFrom);
			const values: SubtestAttemptInsert = { tryoutAttemptId: attempt.id, subtestId, deadline };
			const created = await repository.insertSubtestAttempt(values);
			if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memulai subtest");
			return { ...created, score: parseNullableInt(created.score) };
		},
	};
}

export const startSubtestService = createStartSubtestService({
	repository: createTryoutRepository(db),
});
