import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";

import { DomainError } from "@/lib/domain-error";
import { parseNullableInt } from "@/lib/utils";
import { hashAccessCode } from "./access-code";
import { createTryoutRepository, runInTransaction, type TryoutRepository, type TryoutTransaction } from "./repository";

export type StartTryoutRepository = Pick<
	TryoutRepository,
	| "findPublishedTryoutWithSubtests"
	| "findAccessCode"
	| "findAttempt"
	| "insertAttempt"
	| "consumeAccessCodeQuota"
	| "insertSubtestAttempt"
>;

export type StartTryoutDependencies = {
	repository: StartTryoutRepository;
	withTransaction: <T>(fn: (tx: TryoutTransaction<StartTryoutRepository>) => Promise<T>) => Promise<T>;
};

export type StartTryoutInput = { id: number; imageUrl?: string; useCredit?: boolean; accessCode?: string };

export function createStartTryoutService(deps: StartTryoutDependencies) {
	const { repository } = deps;

	return {
		async start(input: StartTryoutInput, caller: Session["user"]) {
			const tryoutData = await repository.findPublishedTryoutWithSubtests(input.id);
			if (!tryoutData) throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");

			const isPremiumUser = caller.isPremium;
			const hasImageProof = !!input.imageUrl;
			const wantsToUseCredit = !!input.useCredit;
			const userCredits = caller.tryoutCredits ?? 0;

			const accessCodeInput = input.accessCode?.trim();
			const now = new Date();

			let validAccessCode = null;
			if (accessCodeInput) {
				validAccessCode = (await repository.findAccessCode(input.id, hashAccessCode(accessCodeInput))) ?? null;
			}

			const usesAccessCode = !!validAccessCode && !wantsToUseCredit && !isPremiumUser && !hasImageProof;
			const codeIsTheOnlyAttempt = !!accessCodeInput && !isPremiumUser && !hasImageProof && !wantsToUseCredit;

			if (codeIsTheOnlyAttempt && validAccessCode) {
				if (!validAccessCode.isActive) {
					throw new DomainError("FORBIDDEN", "Kode akses tidak aktif");
				}
				if (validAccessCode.expiresAt && validAccessCode.expiresAt < now) {
					throw new DomainError("FORBIDDEN", "Kode akses sudah kedaluwarsa");
				}
				if (validAccessCode.maxUses !== null && validAccessCode.usedCount >= validAccessCode.maxUses) {
					throw new DomainError("FORBIDDEN", "Kuota kode akses sudah habis");
				}
			}

			if (codeIsTheOnlyAttempt && !validAccessCode) {
				throw new DomainError("FORBIDDEN", "Kode akses tidak valid");
			}

			if (!isPremiumUser && !hasImageProof && !wantsToUseCredit && !usesAccessCode) {
				throw new DomainError("FORBIDDEN", "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses");
			}

			const usesCredit = wantsToUseCredit && !isPremiumUser;
			if (usesCredit && userCredits <= 0) {
				throw new DomainError("FORBIDDEN", "Kredit tryout tidak cukup");
			}
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

			const attempt = await deps.withTransaction(async ({ repository: repo, credit }) => {
				const newAttempt = await repo.insertAttempt({
					tryoutId: input.id,
					userId: caller.id,
					submittedImageUrl: usesCredit ? null : input.imageUrl,
					deadline: overallDeadline,
					usedCredit: usesCredit,
					usedAccessCode: usesAccessCode,
					accessCodeId: usesAccessCode ? (validAccessCode?.id ?? null) : null,
				});
				if (!newAttempt) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memulai tryout");

				if (usesAccessCode && validAccessCode) {
					const consumed = await repo.consumeAccessCodeQuota(validAccessCode.id);
					if (!consumed) {
						throw new DomainError("FORBIDDEN", "Kuota kode akses sudah habis");
					}
				}

				if (usesCredit) {
					await credit.deductCreditForTryoutAttempt({
						userId: caller.id,
						tryoutAttemptId: newAttempt.id,
						note: `Used for tryout: ${tryoutData.title}`,
					});
				}

				const firstSubtest = tryoutData.subtests[0]!;
				await repo.insertSubtestAttempt({
					tryoutAttemptId: newAttempt.id,
					subtestId: firstSubtest.id,
					deadline: deadlineMap.get(firstSubtest.id)!,
				});

				return newAttempt;
			});

			return {
				...attempt,
				score: parseNullableInt(attempt.score),
				overallDeadline,
			};
		},
	};
}

export const startTryoutService = createStartTryoutService({
	repository: createTryoutRepository(db),
	withTransaction: runInTransaction,
});
