import { db } from "@bimbelbeta/db";
import { createTransactionRepository } from "@/features/transaction/repository";
import { submitService } from "@/features/tryout/submit.service";
import { createUserRepository } from "@/features/user/repository";

export type ScheduledJobSummary = {
	finalizedAttempts: number;
	failedAttemptIds: number[];
	revokedPremium: number;
	failedTransactions: number;
};

export async function runScheduledJobs(): Promise<ScheduledJobSummary> {
	const now = new Date();
	const attempts = await submitService.sweepExpiredAttempts(now);
	const revokedPremium = await createUserRepository(db).revokeExpiredPremium(now);
	const failedTransactions = await createTransactionRepository(db).failExpiredPending(now);

	return {
		finalizedAttempts: attempts.finalized,
		failedAttemptIds: attempts.failedAttemptIds,
		revokedPremium,
		failedTransactions,
	};
}
