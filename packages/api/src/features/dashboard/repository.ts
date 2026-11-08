import type { DbClient } from "@bimbelbeta/db";
import { createSubjectRepository } from "@/features/subject/repository";
import { createTransactionRepository } from "@/features/transaction/repository";
import { createUserRepository } from "@/features/user/repository";

export function createDashboardRepository(client: DbClient) {
	const users = createUserRepository(client);
	const subjects = createSubjectRepository(client);
	const transactions = createTransactionRepository(client);

	function userCounts(since: Date) {
		return users.countDashboardStats(since);
	}

	function subjectCount() {
		return subjects.countAll();
	}

	function successfulRevenueSince(since: Date) {
		return transactions.sumSuccessfulGrossSince(since);
	}

	return { userCounts, subjectCount, successfulRevenueSince };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
