import type { DbClient } from "@bimbelbeta/db";
import { createQuestionRepository } from "@/features/question/repository";
import { createTransactionRepository } from "@/features/transaction/repository";
import { createTryoutRepository } from "@/features/tryout/repository";
import { createUserRepository } from "@/features/user/repository";

export function createDashboardRepository(client: DbClient) {
	const users = createUserRepository(client);
	const questions = createQuestionRepository(client);
	const transactions = createTransactionRepository(client);
	const tryouts = createTryoutRepository(client);

	function userCounts(since: Date) {
		return users.countDashboardStats(since);
	}

	function questionCounts() {
		return questions.countQuestions();
	}

	function successfulRevenueSince(since: Date, untilBefore?: Date) {
		return transactions.sumSuccessfulGrossSince(since, untilBefore);
	}

	function recentTryouts(limit: number) {
		return tryouts.listRecentWithCounts(limit);
	}

	return { userCounts, questionCounts, successfulRevenueSince, recentTryouts };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
